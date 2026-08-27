/* ============================================================================
   sot-i18n.js — STROMLINIEN Prototyp-Baukasten · Mehrsprachigkeit

     script src        →  ../kit/sot.js
     script src        →  ../kit/sot-i18n.js

   Hängt als SOT.i18n an, dazu SOT.t als Kurzform. Verlangt sot.js.

   DIE TRAGENDE ENTSCHEIDUNG: der deutsche Text IST der Schlüssel.
     SOT.t('Der Stamm zieht weiter')          → 'The clan moves on'   (en)
     SOT.t('Runde {n} von {max}', {n:3, max:10})
   Warum gettext-Stil und keine erfundenen Schlüssel ('res.food'):
   - Der Umbau wird mechanisch: Text finden, in t() wickeln, fertig —
     niemand erfindet Namen, niemand pflegt eine Schlüssel-Datei parallel.
   - Deutsch bleibt die Quelle der Wahrheit (Projektregel: deutsches
     Spieltext-Vokabular, Plättchen/Furt/Fundstelle), der Code liest sich
     weiter wie das Spiel.
   - Eine fehlende Übersetzung zeigt den deutschen Text statt eines Lochs
     oder eines rohen 'res.food' — schlimmster Fall ist der heutige Zustand.
   - Die Wörterbücher sind reine Deutsch→Sprache-Tabellen, die man einer
     Übersetzerin als Ganzes geben kann, ohne den Code zu zeigen.
   Der bekannte Preis: ändert sich der deutsche Wortlaut, verwaist der
   Eintrag. `pruefe()` findet solche Waisen, darum ist er tragbar.

   HTML-Texte laufen über data-t — leer heisst „eigener Textinhalt ist der
   Schlüssel“, damit das Markup lesbar bleibt:
     <span data-t>Nahrung</span>
     <button data-t data-t-title>Aufdecken</button>   (übersetzt auch title)
   sweep() übersetzt alle [data-t] unter einem Wurzelknoten. Wer Text per JS
   setzt, nimmt direkt SOT.t().

   Sprache: ?lang=xx gewinnt (teilbare Links, Screenshot-Regel), sonst die
   gemerkte Wahl, sonst 'de'. Wechsel zur Laufzeit feuert 'sot:lang' auf
   document und sweept erneut — dynamische Anzeigen hängen sich an das Event.

   Dasselbe Modell für die App: app/src/i18n.ts trägt dieselbe API (t,
   Wörterbuch Deutsch→Sprache, gleiche Platzhalter-Syntax), damit ein im
   Prototyp erprobtes Wörterbuch wortgleich hinüberwandert.
   ========================================================================= */
'use strict';
SOT.i18n = (function () {
  var DICTS = {};          // {en: {'Nahrung':'Food', …}, rm: …}
  var lang = 'de';
  var KEY = 'sot-lang';

  /* ---------------------------------------------------------- Wörterbuch ---*/
  // add('en', {…}) — mehrfach aufrufbar, Einträge werden gemischt. So kann
  // der Baukasten seine eigenen Zeilen (sot-doc-Plaketten, ?hilfe-Tafel)
  // beisteuern und der Prototyp seine dazu.
  function add(l, entries) {
    if (!DICTS[l]) DICTS[l] = {};
    for (var k in entries) DICTS[l][k] = entries[k];
    return api;
  }

  /* ----------------------------------------------------------- Übersetzen ---*/
  // t('Runde {n}', {n:3}) — Schlüssel ist der deutsche Text. Für 'de' (oder
  // fehlenden Eintrag) wird nur interpoliert. {n}-Platzhalter bleiben im
  // Wörterbuch wörtlich stehen: 'Runde {n}' → 'Round {n}'.
  function t(text, params) {
    var out = (lang !== 'de' && DICTS[lang] && DICTS[lang][text] !== undefined)
      ? DICTS[lang][text] : text;
    if (params) out = out.replace(/\{(\w+)\}/g, function (m, k) {
      return params[k] !== undefined ? String(params[k]) : m;
    });
    return out;
  }

  // Einfacher Plural ohne Bibliothek: n(3, '{n} Plättchen', '{n} Plättchen')
  // — beide Formen sind eigene Schlüssel, jede Sprache übersetzt beide.
  // Reicht für de/en/rm/it; CLDR-Pluralkategorien wären hier Überbau.
  function n(count, one, many) {
    return t(count === 1 ? one : many, { n: count });
  }

  /* ---------------------------------------------------------------- sweep ---
     Übersetzt alle [data-t] unter root. Der ORIGINALE deutsche Text wird
     beim ersten Lauf an das Element geheftet (dataset.tKey) — sonst würde
     ein zweiter sweep() die schon übersetzte Fassung als Schlüssel nehmen
     und beim Rückschalten auf Deutsch nichts mehr finden.
     data-t="Eigener Schlüssel" übersteuert den Textinhalt (nötig, wenn der
     sichtbare Text Markup enthält). data-t-title / data-t-aria übersetzen
     title bzw. aria-label nach derselben Regel.
     -------------------------------------------------------------------------- */
  function sweep(root) {
    SOT.$$('[data-t]', root ? SOT.$(root) : document).forEach(function (el) {
      var key = el.dataset.tKey || el.dataset.t || el.textContent.trim();
      el.dataset.tKey = key;
      el.textContent = t(key);
      if (el.hasAttribute('data-t-title')) {
        var tk = el.dataset.tTitleKey || el.getAttribute('title') || key;
        el.dataset.tTitleKey = tk;
        el.setAttribute('title', t(tk));
      }
      if (el.hasAttribute('data-t-aria')) {
        var ak = el.dataset.tAriaKey || el.getAttribute('aria-label') || key;
        el.dataset.tAriaKey = ak;
        el.setAttribute('aria-label', t(ak));
      }
    });
  }

  /* --------------------------------------------------------------- Sprache ---*/
  function set(l, persist) {
    lang = l || 'de';
    document.documentElement.lang = lang;
    if (persist) SOT.store.set(KEY, lang);
    sweep();
    document.dispatchEvent(new CustomEvent('sot:lang', { detail: { lang: lang } }));
    return lang;
  }
  function get() { return lang; }
  function languages() {
    var out = ['de'];
    for (var l in DICTS) if (out.indexOf(l) < 0) out.push(l);
    return out;
  }

  /* Umschalter für Kopfzeilen: ein Knopf, der durch die registrierten
     Sprachen klickt. SOT.i18n.button($('hright')) hängt ihn ein. */
  function button(parent) {
    var b = SOT.el('button.small.langbtn', {
      text: lang.toUpperCase(), title: 'Sprache wechseln',
      onclick: function () {
        var ls = languages(), i = ls.indexOf(lang);
        set(ls[(i + 1) % ls.length], true);
        b.textContent = lang.toUpperCase();
      }
    });
    if (parent) SOT.$(parent).appendChild(b);
    return b;
  }

  /* ---------------------------------------------------------------- Prüfen ---
     pruefe() — die Waisen- und Lückenliste, das Werkzeug für den Umbau:
       fehlt:   Schlüssel, die im Dokument vorkommen, aber im Wörterbuch
                einer Sprache fehlen (→ übersetzen)
       waisen:  Wörterbuch-Einträge, deren deutscher Text im Dokument nicht
                (mehr) vorkommt (→ Wortlaut geändert? Eintrag nachziehen)
     Nur die data-t-Schlüssel sind automatisch zählbar; reine SOT.t()-Aufrufe
     im JS registrieren sich über den t()-Aufruf selbst nicht — darum können
     Prototypen zusätzliche Schlüssel mit keys([...]) anmelden.
     ?i18n zeigt die Tafel im Browser.
     -------------------------------------------------------------------------- */
  var EXTRA_KEYS = [];
  function keys(list) { EXTRA_KEYS = EXTRA_KEYS.concat(list); return api; }

  function pruefe() {
    var used = {};
    SOT.$$('[data-t]').forEach(function (el) {
      used[el.dataset.tKey || el.dataset.t || el.textContent.trim()] = 1;
    });
    EXTRA_KEYS.forEach(function (k) { used[k] = 1; });
    var report = {};
    for (var l in DICTS) {
      var fehlt = [], waisen = [];
      for (var k in used) if (DICTS[l][k] === undefined) fehlt.push(k);
      for (var k2 in DICTS[l]) if (!used[k2]) waisen.push(k2);
      report[l] = { fehlt: fehlt, waisen: waisen };
    }
    return report;
  }

  function zeigePruefung() {
    var r = pruefe();
    var rows = '';
    for (var l in r) {
      rows += '<tr><th colspan="2">' + l + ' — fehlt: ' + r[l].fehlt.length +
              ' · Waisen: ' + r[l].waisen.length + '</th></tr>';
      r[l].fehlt.forEach(function (k) { rows += '<tr><td class="dim">fehlt</td><td>' + k + '</td></tr>'; });
      r[l].waisen.forEach(function (k) { rows += '<tr><td class="warn">Waise</td><td>' + k + '</td></tr>'; });
    }
    var ov = SOT.el('div.overlay.on', { onclick: function () { ov.remove(); } }, [
      SOT.el('div.ocard', { style: { maxWidth: '620px', maxHeight: '80vh', overflow: 'auto' } }, [
        SOT.el('div.tag', { text: 'i18n · Lücken und Waisen' }),
        SOT.el('table.t', { html: rows || '<tr><td>vollständig</td></tr>' })
      ])
    ]);
    document.body.appendChild(ov);
  }

  /* ------------------------------------------------------------------ Init ---
     Läuft sofort: ?lang gewinnt, sonst gemerkte Wahl, sonst de. sweep()
     nach DOMContentLoaded, damit statisches Markup erfasst ist. ?i18n
     öffnet die Prüftafel.
     -------------------------------------------------------------------------- */
  var q = new URLSearchParams(location.search);
  var initial = q.get('lang') || SOT.store.get(KEY) || 'de';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      set(initial, false);
      if (q.has('i18n')) setTimeout(zeigePruefung, 0);
    });
  } else {
    set(initial, false);
    if (q.has('i18n')) setTimeout(zeigePruefung, 0);
  }

  var api = { add: add, t: t, n: n, sweep: sweep, set: set, get: get,
              languages: languages, button: button, keys: keys,
              pruefe: pruefe, zeigePruefung: zeigePruefung };
  return api;
})();
/* Kurzform, damit gewickelter Text kurz bleibt: SOT.t('…'). */
SOT.t = SOT.i18n.t;
SOT.tn = SOT.i18n.n;
