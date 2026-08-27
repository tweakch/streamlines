# `prototype/vendor/` — mitgelieferte Fremdbibliotheken

Die Werkstatt-Regel sagt: **eine HTML-Datei, keine Abhängigkeiten außer Google
Fonts und `kit/`.** Dieser Ordner ist die einzige Ausnahme, und sie hat einen
Grund: `three.js` kann man nicht nachtippen. Wer 3D als Kartenrenderer prüfen
will, braucht die Bibliothek — und sie soll dabei **nicht am Netz hängen**.

## Warum nicht vom CDN

Ein `import` von `cdn.jsdelivr.net` würde heute laufen und in `archive/`
irgendwann nicht mehr. Archivierte Prototypen sind unveränderliche Geschichte;
eine Datei, die dafür ein fremdes Netz braucht, kann diese Zusage nicht halten.
Darum liegt die Bibliothek hier im Repo, versioniert im Ordnernamen.

## Inhalt

| Ordner | Was | Woher |
| --- | --- | --- |
| `three-0.185.1/` | `three.module.min.js` + `three.core.min.js` — nur der **Kern**, keine Addons | `npm pack three@0.185.1`, aus `package/build/` |

Nur der Kern. Kein `examples/jsm` — kein `EffectComposer`, kein SSAO/GTAO, keine
`OrbitControls`, kein `BufferGeometryUtils`. Das ist Absicht: jedes Addon wären
weitere Dateien hier, und der Kern reicht weiter, als man denkt
(Nachbearbeitung über `RawShaderMaterial` und eigene Rendertargets, Verschmelzen
über einen eigenen Bauplan, Kamera und Zeiger von Hand). `diorama-labor-v1.html`
zeigt, wie weit.

`three.module.min.js` importiert `./three.core.min.js` — **beide Dateien
gehören zusammen**, seit r166 ist der Kern ausgelagert.

## Der `file://`-Haken

ES-Module lädt Chrome unter `file://` **nicht** (Herkunft „null“, CORS). Ein
Prototyp, der von hier importiert, lässt sich also nicht mehr per Doppelklick
öffnen. Zwei Wege:

```
npx http-server prototype          # dann http://localhost:8080/drafts/…
```

und für Bildschirmfotos die Kennung mitgeben:

```
chrome.exe --headless=new --disable-gpu --allow-file-access-from-files ^
  --virtual-time-budget=30000 --window-size=1280,860 ^
  --screenshot="out.png" "file:///…/drafts/diorama-labor-v1.html?still"
```

Ein Prototyp, der von hier lädt, **muss das melden**, wenn es nicht klappt —
sonst bleibt die Seite weiß und man sucht den Fehler in seinem eigenen Code.
`diorama-labor-v1.html` setzt dafür einen Wecker: meldet sich der Modulteil
nicht innerhalb von 2,5 s, erscheint die Fläche mit genau diesen zwei Wegen.

## Für `inline.mjs` und das Archiv

`kit/inline.mjs` kennt nur die `kit/`-Verweise. Eine Datei mit
`vendor/`-Import ist nach dem Inlinen **noch nicht** in sich geschlossen — der
Import bleibt stehen. Wer so eine Datei archiviert, hat zwei Möglichkeiten:

1. die Bibliothek beim Archivieren mit einbetten (rund 750 kB je Datei), oder
2. den `vendor/`-Ordner als Teil des Archivs verstehen — das Archiv verweist
   dann auf eine **versionierte** Fassung, die nie wieder verändert wird.

Bislang gilt **2**: `three-0.185.1/` wird nicht aktualisiert, sondern bei Bedarf
ein neuer Ordner daneben gelegt. Ein Versionssprung darf keine archivierte
Datei anders aussehen lassen.
