-- ============================================================================
-- schema.sql — das Schema der Naturengine in Postgres (Datenbank `welten`).
--
-- Alles liegt im Schema `natur`, damit es neben den Spielständen
-- (public.profiles, public.saves aus server/api/server.js) leben kann, ohne
-- sich mit ihnen zu vermischen.
--
-- Das Schema hat ZWEI Hälften, und die Grenze dazwischen ist der wichtigste
-- Entwurfsgedanke der ganzen Datei:
--
--   Teil 1  DIE GEBACKENE KARTE — ein ERZEUGNIS.
--           Kommt vollständig aus pipeline/out/karte.sqlite und wird bei jedem
--           Ingest geleert und neu geschrieben. Nichts darf hier hineinkommen,
--           was nicht die Pipeline erzeugt hat: es wäre beim nächsten Lauf weg.
--
--   Teil 2  DIE NATURENGINE — WISSEN.
--           Quellen, Befunde, Bedingungen, Arten, Parameter, Läufe. Wird vom
--           Ingest NIE angetastet (einzige Ausnahme: die fünf Evidenz-Tore,
--           die Projektkanon sind). Ein Befund wird niemals von der Simulation
--           überschrieben — das ist der Architekturkern.
--
-- Deshalb zeigt KEIN Fremdschlüssel aus Teil 2 auf Teil 1. Eine Bedingung
-- nennt ihre Ebene als Zahl, nicht als Verweis auf natur.ebene: sonst hinge
-- gesammeltes Wissen an einer Tabelle, die die Pipeline routinemässig leert.
--
-- Idempotent: `create ... if not exists` überall, der Ingest darf beliebig oft
-- laufen. Sobald sich das Schema wirklich bewegt, gehört hier ein
-- Migrationswerkzeug hin — nicht eine zweite Spalte "if not exists".
-- ============================================================================

create schema if not exists natur;

-- ============================================================================
-- TEIL 1 — Die gebackene Karte (Erzeugnis, wird bei jedem Ingest ersetzt)
-- ============================================================================

-- Woher die Karte stammt: eine Zeile je Datei in pipeline/sources/, mit
-- Lizenz. Ohne diese Tabelle ist das Tileset rechtlich blind.
create table if not exists natur.datenquelle (
  datei        text primary key,
  art          text not null,              -- geo | hoehen | tiefe
  merkmale     integer,                    -- Anzahl Features (nur bei geo)
  quelle       text,
  beschreibung text,
  lizenz       text,
  crs          text,
  stand        text
);

-- Die Ausgabe-Ebenen der Pipeline (10 km / 2 km / 0.4 km).
create table if not exists natur.ebene (
  id     integer primary key,
  hex_km double precision not null,
  cols   integer not null,
  zeilen integer not null,                 -- "rows" ist in SQL zu nah am Schlüsselwort
  kachel integer not null,
  region jsonb
);

-- Ein Overlay ist ein Feldparameter über der ganzen Karte. belegt/inspiriert/
-- erfunden sind seine Realitätsnähe aus dem Herkunftsprotokoll (Handbuch P6).
create table if not exists natur.overlay (
  id           text primary key,
  name         text not null,
  gruppe       text not null,
  einheit      text,
  kodierung    text not null,
  ebenen       jsonb not null,
  quellen      jsonb not null,
  notiz        text,
  skala        jsonb,
  quelle_fehlt boolean not null default false,
  belegt       double precision not null default 0,
  inspiriert   double precision not null default 0,
  erfunden     double precision not null default 0
);

-- Legende kategorialer Overlays.
create table if not exists natur.klasse (
  overlay    text not null references natur.overlay(id) on delete cascade,
  wert       smallint not null,
  schluessel text not null,
  name       text not null,
  farbe      text,
  extra      jsonb,
  primary key (overlay, wert)
);

-- Auslieferung: 32×32 Werte als BLOB, unveränderlich über den Inhalts-Hash.
create table if not exists natur.kachel (
  overlay text not null references natur.overlay(id) on delete cascade,
  ebene   integer not null references natur.ebene(id) on delete cascade,
  tx      integer not null,
  ty      integer not null,
  hash    text not null,
  gesetzt integer not null,
  daten   bytea not null,
  primary key (overlay, ebene, tx, ty)
);

-- Abfrage: nur Spielebenen, nur gesetzte Werte. Dieselbe Zahl wie in der
-- Kachel — die eine Form ist zum Zeichnen, die andere zum Fragen.
create table if not exists natur.zellwert (
  ebene   integer not null references natur.ebene(id) on delete cascade,
  overlay text not null references natur.overlay(id) on delete cascade,
  c       integer not null,
  r       integer not null,
  wert    smallint not null,
  primary key (ebene, overlay, c, r)
);
create index if not exists ix_zellwert_wert on natur.zellwert (ebene, overlay, wert);
create index if not exists ix_zellwert_ort  on natur.zellwert (ebene, c, r);

-- Das Herkunftsprotokoll: was aus den Quellen wurde, Posten für Posten.
create table if not exists natur.ledger (
  id           bigserial primary key,
  stufe        text not null,
  quelle       text not null,
  ebene        integer,
  eingabe      bigint not null,
  ausgabe      bigint not null,
  ausgestossen bigint not null,
  belegt       double precision not null,
  inspiriert   double precision not null,
  erfunden     double precision not null,
  posten       jsonb not null
);

create table if not exists natur.karte_meta (
  schluessel text primary key,
  wert       text not null
);

-- ============================================================================
-- TEIL 2 — Die Naturengine (Wissen, vom Ingest unberührt)
-- ============================================================================

-- Wissenschaftliche Quelle. Nicht zu verwechseln mit natur.datenquelle: das
-- sind Dateien der Pipeline, das hier ist Literatur.
create table if not exists natur.quelle (
  id         text primary key,
  art        text not null,                -- publikation | datensatz | bericht | mitteilung
  titel      text not null,
  autoren    text,
  jahr       integer,
  doi        text,
  url        text,
  notiz      text,
  erfasst_am timestamptz not null default now()
);

-- Art — Pflanze wie Tier in einer Tabelle: sie unterscheiden sich in ihren
-- Parametern, nicht in ihrer Natur als Population über einem Feld.
create table if not exists natur.art (
  id               text primary key,       -- betula, cervus_elaphus
  reich            text not null,          -- pflanze | tier
  wissenschaftlich text,
  name_de          text not null,
  notiz            text
);

-- Ein Modellparameter ist eine VERTEILUNG, keine Zahl: gleiche Naturgesetze,
-- verschiedene Welten. `herkunft` trennt biologische Fakten aus der Literatur
-- von Werten, an denen der Optimierer drehen darf — sonst verbiegt die
-- Kalibrierung am Ende die Biologie, bis die Tore stimmen.
create table if not exists natur.art_parameter (
  art         text not null references natur.art(id) on delete cascade,
  gruppe      text not null,               -- klima | wasser | terrain | wachstum |
                                           -- fortpflanzung | konkurrenz | stoerung
  name        text not null,
  einheit     text,
  mittel      double precision not null,
  streuung    double precision not null default 0,
  konfidenz   double precision not null default 0.5,
  herkunft    text not null,               -- literatur | kalibriert | geschaetzt
  optimierbar boolean not null default false,
  quelle      text references natur.quelle(id),
  primary key (art, gruppe, name),
  constraint art_parameter_literatur_ist_fest
    check (herkunft <> 'literatur' or optimierbar = false)
);

-- Befund = Evidence. Was eine Quelle tatsächlich behauptet. Wird von der
-- Simulation NIE überschrieben.
create table if not exists natur.befund (
  id          bigserial primary key,
  quelle      text not null references natur.quelle(id),
  art         text references natur.art(id),
  befundart   text not null,               -- makrorest | pollen | holzkohle |
                                           -- knochen | artefakt | datierung
  aussage     text not null,               -- vorhanden | abwesend | haeufig | selten
  zeit_bp     integer not null,            -- Jahre vor heute
  zeit_spanne integer,                     -- ± Jahre
  lon         double precision,
  lat         double precision,
  ort         text,
  konfidenz   double precision not null,
  notiz       text,
  erfasst_am  timestamptz not null default now(),
  constraint befund_konfidenz check (konfidenz > 0 and konfidenz <= 1)
);
create index if not exists ix_befund_zeit on natur.befund (zeit_bp);
create index if not exists ix_befund_art  on natur.befund (art, zeit_bp);

-- Kandidat aus der Extraktion, VOR der Validierung. Getrennte Tabelle, damit
-- ein maschineller Vorschlag nie versehentlich als Befund gilt.
create table if not exists natur.befund_kandidat (
  id         bigserial primary key,
  quelle     text not null references natur.quelle(id),
  auszug     text not null,                -- die Textstelle, auf die er sich beruft
  vorschlag  jsonb not null,               -- Feldvorschläge in der Form von natur.befund
  modell     text,
  stand      text not null default 'offen',-- offen | angenommen | verworfen
  befund     bigint references natur.befund(id),
  grund      text,
  erfasst_am timestamptz not null default now()
);

-- Bedingung = Constraint. Was aus einem Befund für den erlaubten Zustandsraum
-- folgt. `reichweite_km` ist das Flüssigkeitsprinzip: ein Nachweis macht auch
-- die Nachbarschaft plausibler, nicht nur seine eigene Zelle.
create table if not exists natur.bedingung (
  id            bigserial primary key,
  befund        bigint references natur.befund(id) on delete cascade,
  ebene         integer,                   -- absichtlich OHNE Fremdschlüssel
  c             integer,
  r             integer,
  art           text references natur.art(id),
  zeit_bp       integer not null,
  groesse       text not null,             -- deckung | population | temperatur | ...
  operator      text not null,             -- >= | <= | ~
  wert          double precision not null,
  gewicht       double precision not null default 1,
  reichweite_km double precision,
  notiz         text
);
create index if not exists ix_bedingung_zeit on natur.bedingung (zeit_bp);
create index if not exists ix_bedingung_ort  on natur.bedingung (ebene, c, r);

-- Die fünf Evidenz-Tore: Zielbereiche, keine exakten Karten. Der Ingest hält
-- sie aktuell — sie sind Projektkanon, nicht erhobene Daten.
create table if not exists natur.tor (
  id        text primary key,              -- g1 ... g5
  zeit_bp   integer not null,
  name      text not null,
  erwartung text not null
);

create table if not exists natur.parametersatz (
  id         text primary key,
  eltern     text references natur.parametersatz(id),
  notiz      text,
  werte      jsonb not null default '{}'::jsonb,
  erzeugt_am timestamptz not null default now()
);

-- Ein Lauf ist reproduzierbar: Parametersatz + Modellversion + Saat.
create table if not exists natur.lauf (
  id             bigserial primary key,
  parametersatz  text not null references natur.parametersatz(id),
  modell_version text not null,
  saat           bigint not null,
  gestartet_am   timestamptz not null default now(),
  beendet_am     timestamptz,
  gesamt_score   double precision,
  notiz          text
);

create table if not exists natur.lauf_tor (
  lauf   bigint not null references natur.lauf(id) on delete cascade,
  tor    text not null references natur.tor(id),
  score  double precision not null,
  fehler jsonb,
  primary key (lauf, tor)
);

-- Der vorhergesagte Zustand einer Zelle in einem Lauf. Die Teilzustände sind
-- jsonb, weil ihre Felder mit dem Modell wachsen — eine Spalte je Art wäre
-- nach zehn Arten unbrauchbar.
create table if not exists natur.zustand (
  lauf       bigint not null references natur.lauf(id) on delete cascade,
  ebene      integer not null,             -- absichtlich OHNE Fremdschlüssel
  c          integer not null,
  r          integer not null,
  zeit_bp    integer not null,
  klima      jsonb,
  wasser     jsonb,
  vegetation jsonb,
  fauna      jsonb,
  mensch     jsonb,
  primary key (lauf, ebene, c, r, zeit_bp)
);
