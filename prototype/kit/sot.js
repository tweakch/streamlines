/* ============================================================================
   sot.js — STROMLINIEN Prototyp-Baukasten · Kern

   Klassisches Script, kein Modul: ES-Module scheitern unter file:// an CORS,
   und ein Prototyp muss per Doppelklick aufgehen.

     script src        →  ../kit/sot.js

   Alles hängt an window.SOT. Keine Abhängigkeiten, kein Build.
   ========================================================================= */
'use strict';
window.SOT = (function () {

  /* -------------------------------------------------------------- Auswahl ---*/
  // $ nimmt beides: eine id ('map') oder einen Selektor ('.cell.sel').
  function $(sel, root) {
    if (typeof sel !== 'string') return sel;
    root = root || document;
    if (/^[\w-]+$/.test(sel)) {
      var byId = (root.getElementById ? root : document).getElementById(sel);
      if (byId) return byId;
    }
    return root.querySelector(sel);
  }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Element bauen: el('div.cell.water', {title:'Chur'}, [kind, 'Text'])
     Der erste Parameter trägt Tag, Klassen und optional #id — das kürzt
     genau die Zeilen, die in jedem Prototyp dutzendweise vorkommen. */
  function el(spec, attrs, kids) {
    var m = String(spec).match(/^([a-zA-Z][\w-]*)?(#[\w-]+)?((?:\.[\w-]+)*)$/);
    if (!m) throw new Error('SOT.el: Spec unlesbar: ' + spec);
    var node = document.createElement(m[1] || 'div');
    if (m[2]) node.id = m[2].slice(1);
    if (m[3]) node.className = m[3].slice(1).split('.').join(' ');
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'data' && typeof v === 'object') { for (var d in v) node.dataset[d] = v[d]; }
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    if (kids) [].concat(kids).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return node;
  }
  function clear(node) { node = $(node); while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ------------------------------------------------------- Query-Parameter ---
     Regel der Werkstatt: jeder Prototyp muss seine inneren Zustände über
     Query-Parameter erreichbar machen — ein Screenshot kann nicht klicken.
     SOT.params() erklärt sie EINMAL und liefert dafür getippte Werte, einen
     Debugstrip und eine Selbstauskunft (?hilfe).

       var P = SOT.params({
         epoche: {t:'int', def:1, max:5, help:'Epoche I–V'},
         lod:    {t:'enum', values:['s','m','l'], help:'Detailstufe erzwingen'},
         demo:   {t:'flag', help:'Beispielkarte laden'},
         seed:   {t:'int', def:0}
       });
       if (P.demo) …            // Werte sind schon getippt
       P.set('epoche', 3)       // schreibt die URL um, ohne neu zu laden
     -------------------------------------------------------------------------- */
  var _spec = {};
  function params(spec) {
    var q = new URLSearchParams(location.search);
    var out = {};
    _spec = spec || {};
    Object.keys(_spec).forEach(function (name) {
      var s = _spec[name] || {};
      var raw = q.get(name);
      var t = s.t || 'str';
      var v;
      if (t === 'flag') {
        // ?demo, ?demo=1 → true;  ?demo=0 / ?demo=aus / ?demo=false → false
        v = q.has(name) && !/^(0|aus|false|nein|off)$/i.test(raw || '');
      } else if (raw === null) {
        v = 'def' in s ? s.def : (t === 'int' || t === 'num' ? 0 : null);
      } else if (t === 'int' || t === 'num') {
        v = t === 'int' ? parseInt(raw, 10) : parseFloat(raw);
        if (!isFinite(v)) v = 'def' in s ? s.def : 0;
        if ('min' in s) v = Math.max(s.min, v);
        if ('max' in s) v = Math.min(s.max, v);
      } else if (t === 'enum') {
        v = (s.values || []).indexOf(raw) >= 0 ? raw : ('def' in s ? s.def : (s.values || [])[0]);
      } else if (t === 'list') {
        v = raw.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      } else {
        v = raw;
      }
      out[name] = v;
    });
    // ?night und ?werkbank sind immer da, ohne dass ein Prototyp sie erklärt.
    if (q.has('night')) document.body.classList.add('night');
    if (q.has('werkbank')) document.body.classList.add('werkbank');
    out.set = function (name, value) {
      var u = new URL(location.href);
      if (value === false || value === null || value === undefined) u.searchParams.delete(name);
      else u.searchParams.set(name, value === true ? '1' : value);
      history.replaceState(null, '', u);
      out[name] = value;
      return out;
    };
    out.link = function (patch) {
      var u = new URL(location.href);
      for (var k in patch) {
        if (patch[k] === false || patch[k] === null) u.searchParams.delete(k);
        else u.searchParams.set(k, patch[k] === true ? '1' : patch[k]);
      }
      return u.toString();
    };
    out.spec = _spec;
    if (q.has('hilfe') || q.has('help')) setTimeout(function () { printHelp(_spec); }, 0);
    return out;
  }

  // ?hilfe zeigt eine Tafel aller erklärten Parameter — der Prototyp
  // dokumentiert sich damit selbst, und niemand muss den Quelltext lesen.
  function printHelp(spec) {
    var rows = Object.keys(spec).map(function (n) {
      var s = spec[n] || {};
      var kind = s.t === 'enum' ? (s.values || []).join(' | ') : (s.t || 'str');
      return '<tr><td><code>?' + n + '</code></td><td class="dim">' + kind + '</td>' +
             '<td class="n dim">' + ('def' in s ? String(s.def) : '') + '</td>' +
             '<td>' + (s.help || '') + '</td></tr>';
    }).join('');
    /* Die Hilfetafel muss ÜBER allem liegen. `.overlay` steht auf z-index 50;
       Prototypen mit einer Vollbildschicht darüber (stromlinien-epoche1: .full
       auf 80, erkundung-v6 ebenso) verdecken sie sonst vollständig — ?hilfe
       schien dort wirkungslos. Gefunden beim Umbau der Sonde Spiel/Bühne. */
    var ov = el('div.overlay.on', { style: { zIndex: '2000' }, onclick: function () { ov.remove(); } }, [
      el('div.ocard', { style: { maxWidth: '560px' } }, [
        el('div.tag', { text: 'Debug · Query-Parameter' }),
        el('h2', { text: document.title }),
        el('table.t', { html: '<tr><th>Parameter</th><th>Typ</th><th class="n">Standard</th><th>Bedeutung</th></tr>' + rows }),
        el('p.note', { text: 'Immer verfügbar: ?night · ?werkbank · ?debug · ?hilfe. Klick schließt.' })
      ])
    ]);
    document.body.appendChild(ov);
  }

  /* ------------------------------------------------------------ Debugstrip ---
     SOT.debug(P) baut aus den erklärten Parametern eine Leiste: Flags zum
     Umschalten, Enums als Durchklick, Zahlen als ±. Erscheint nur mit ?debug
     (oder debug:true), damit ein Screenshot sauber bleibt.
     -------------------------------------------------------------------------- */
  function debug(P, opts) {
    opts = opts || {};
    var q = new URLSearchParams(location.search);
    if (!opts.always && !q.has('debug')) return null;
    var strip = el('div.debugstrip');
    var spec = (P && P.spec) || _spec;

    Object.keys(spec).forEach(function (name) {
      var s = spec[name] || {}, cur = P[name];
      if (s.t === 'flag') {
        strip.appendChild(el('button' + (cur ? '.on' : ''), {
          text: name, title: s.help || '',
          onclick: function () { location.href = P.link(defineFlag(name, !cur)); }
        }));
      } else if (s.t === 'enum') {
        var vals = s.values || [], i = vals.indexOf(cur);
        strip.appendChild(el('button.on', {
          text: name + ':' + cur, title: s.help || '',
          onclick: function () { var p = {}; p[name] = vals[(i + 1) % vals.length]; location.href = P.link(p); }
        }));
      } else if (s.t === 'int' || s.t === 'num') {
        var step = s.step || 1;
        strip.appendChild(el('button', {
          text: '−', title: name, onclick: function () { var p = {}; p[name] = cur - step; location.href = P.link(p); }
        }));
        strip.appendChild(el('button.on', { text: name + ':' + cur, title: s.help || '' }));
        strip.appendChild(el('button', {
          text: '+', title: name, onclick: function () { var p = {}; p[name] = cur + step; location.href = P.link(p); }
        }));
      }
    });
    (opts.extra || []).forEach(function (b) {
      strip.appendChild(el('button', { text: b.label, onclick: b.onclick, title: b.title || '' }));
    });
    /* Tag/Nacht: das Zeichen kommt aus sot-icons.js (Icons sind SVG, immer).
       Fehlt die Datei, steht hier das WORT — nie ein Ersatz-Schriftzeichen,
       sonst wäre die Regel schon im Baukasten selbst gebrochen. */
    strip.appendChild(el('button', {
      html: SOT.icon ? '<span class="ibtn">' + SOT.icon(document.body.classList.contains('night') ? 'sonne' : 'mond') + '</span>'
                     : (document.body.classList.contains('night') ? 'Tag' : 'Nacht'),
      title: 'Tag / Nacht',
      onclick: function () { night(); }
    }));
    strip.appendChild(el('a', { text: '?', href: P.link({ hilfe: true }), title: 'Alle Parameter' }));
    document.body.appendChild(strip);
    return strip;
    function defineFlag(n, v) { var p = {}; p[n] = v ? true : null; return p; }
  }

  /* ------------------------------------------------------------ Reglerbrett ---
     Der Debugstrip kann Parameter nur ANTIPPEN: Flag umschalten, Enum
     durchklicken, Zahl um einen Schritt. Wer einen Wert quer durch seinen
     Bereich fahren will, klickt vierzigmal und lädt vierzigmal neu.

     SOT.regler(P) baut aus DERSELBEN Erklärung ein Brett von rechts, mit
     einem echten Bedienelement je Typ. Kein Prototyp muss etwas beschreiben,
     was er nicht schon in SOT.params() beschrieben hat.

       var P = SOT.params({ ela:{t:'int', def:2400, min:800, max:3200, step:50,
                                  help:'Schneegrenze in m'} });
       SOT.regler(P);                       // Griff rechts, ?regler öffnet
       SOT.regler(P, { onChange: neu });    // live statt neu laden

     Ohne onChange wird die URL geschrieben und die Seite NEU GELADEN — das
     wirkt in jedem Prototyp, auch in dem, der seine Welt einmalig beim Start
     baut. Mit onChange(name, wert, P) bleibt die Seite stehen und der
     Prototyp entscheidet selbst, was er neu rechnet; die URL wird trotzdem
     nachgeführt (P.set), damit der Stand teilbar und ein Screenshot
     reproduzierbar bleibt.
     -------------------------------------------------------------------------- */
  function regler(P, opts) {
    opts = opts || {};
    var spec = (P && P.spec) || _spec;
    var namen = Object.keys(spec).filter(function (n) { return !(spec[n] || {}).versteckt; });
    if (!namen.length) return null;

    var live = typeof opts.onChange === 'function';
    var offen = new URLSearchParams(location.search).has('regler') || !!opts.offen;

    var body = el('div.sbody');
    var brett = el('div.sheet.right.regler', {}, [
      el('div.shead', {}, [
        el('b', { text: opts.titel || 'Parameter' }),
        el('button.closesheet', { text: 'Schliessen', title: 'Esc' })
      ]),
      body
    ]);

    namen.forEach(function (name) { body.appendChild(zeile(name)); });

    /* Fusszeile: der Stand IST die URL — darum hier teilen und zurücksetzen,
       nicht irgendwo im Prototyp. */
    body.appendChild(el('div.reglerfuss', {}, [
      el('button', {
        text: 'Zurücksetzen', title: 'Alle Parameter auf ihren Standard',
        onclick: function () {
          var u = new URL(location.href);
          namen.forEach(function (n) { u.searchParams.delete(n); });
          location.href = u.toString();
        }
      }),
      el('button', {
        text: 'Link kopieren', title: 'Diesen Stand teilen',
        onclick: function (e) {
          var b = e.currentTarget;
          navigator.clipboard.writeText(location.href).then(function () {
            b.textContent = 'kopiert';
            setTimeout(function () { b.textContent = 'Link kopieren'; }, 1200);
          });
        }
      })
    ]));

    document.body.appendChild(brett);
    var s = sheet(brett);
    if (offen) s.open();

    /* Der Griff ist immer da, aber schmal und still — ein Screenshot ohne
       ?regler zeigt nur eine Lasche am Rand. */
    if (opts.griff !== false) {
      document.body.appendChild(el('button.reglergriff', {
        text: opts.griffText || 'Parameter', title: 'Parameter einstellen',
        onclick: s.toggle
      }));
    }
    return { sheet: s, open: s.open, close: s.close, toggle: s.toggle, node: brett };

    /* --- eine Zeile je Parameter, das Element folgt dem Typ --------------- */
    function zeile(name) {
      var s2 = spec[name] || {}, cur = P[name], t = s2.t || 'str';
      var reihe = el('div.field.reglerzeile');
      var kopf = el('label', {}, [
        el('span', { text: name }),
        el('span.wert', { text: anzeige(cur, t) })
      ]);
      reihe.appendChild(kopf);
      var lesen = kopf.querySelector('.wert');

      if (t === 'flag') {
        reihe.appendChild(el('input', {
          type: 'checkbox', checked: cur ? true : null,
          onchange: function (e) { setze(name, e.target.checked ? true : null, e.target.checked); }
        }));
      } else if (t === 'enum') {
        var sel = el('select', {
          onchange: function (e) { setze(name, e.target.value, e.target.value); }
        });
        (s2.values || []).forEach(function (v) {
          sel.appendChild(el('option', { value: v, text: v, selected: v === cur ? true : null }));
        });
        reihe.appendChild(sel);
      } else if ((t === 'int' || t === 'num') && 'min' in s2 && 'max' in s2) {
        /* Der gute Fall: Bereich erklärt → Schieber. Das ist zugleich der
           Anreiz, min/max in SOT.params() wirklich anzugeben. */
        var schieber = el('input', {
          type: 'range', min: s2.min, max: s2.max,
          step: s2.step || (t === 'int' ? 1 : 'any'), value: cur,
          oninput: function (e) { lesen.textContent = e.target.value; },
          onchange: function (e) { var v = zahl(e.target.value, t); setze(name, v, v); }
        });
        reihe.appendChild(schieber);
      } else if (t === 'int' || t === 'num') {
        reihe.appendChild(el('input', {
          type: 'number', value: cur, step: s2.step || (t === 'int' ? 1 : 'any'),
          min: 'min' in s2 ? s2.min : null, max: 'max' in s2 ? s2.max : null,
          onchange: function (e) { var v = zahl(e.target.value, t); setze(name, v, v); }
        }));
      } else if (t === 'list') {
        reihe.appendChild(el('input', {
          type: 'text', value: (cur || []).join(','), placeholder: 'a,b,c',
          onchange: function (e) {
            var roh = e.target.value.trim();
            setze(name, roh || null, roh ? roh.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : []);
          }
        }));
      } else {
        reihe.appendChild(el('input', {
          type: 'text', value: cur == null ? '' : cur,
          onchange: function (e) { var v = e.target.value; setze(name, v || null, v); }
        }));
      }

      if (s2.help) reihe.appendChild(el('small.note', { text: s2.help }));
      return reihe;
    }

    function zahl(roh, t) {
      var v = t === 'int' ? parseInt(roh, 10) : parseFloat(roh);
      return isFinite(v) ? v : 0;
    }
    /* Die Ableselampe ist EINE Zeile. Ein langer Wert (pruefkarte trägt ein
       ganzes Karten-JSON) sprengte sonst die Zeile und das Blatt bekam einen
       waagrechten Rollbalken — im Musterbogen gesehen, nicht vermutet. */
    function anzeige(v, t) {
      if (t === 'flag') return v ? 'an' : 'aus';
      var s3 = Array.isArray(v) ? v.join(',') : (v === null || v === undefined ? '' : String(v));
      if (s3 === '') return '—';           // auch die leere Liste, nicht nur null
      return s3.length > 18 ? s3.slice(0, 17) + '…' : s3;
    }

    /* urlWert geht in die Adresse (null = Parameter entfernen),
       echterWert ist der getippte Wert für den Prototyp. */
    function setze(name, urlWert, echterWert) {
      if (!live) { var p = {}; p[name] = urlWert; location.href = P.link(p); return; }
      P.set(name, urlWert);
      P[name] = echterWert;
      var z = body.querySelectorAll('.reglerzeile')[namen.indexOf(name)];
      if (z) z.querySelector('.wert').textContent = anzeige(echterWert, (spec[name] || {}).t || 'str');
      opts.onChange(name, echterWert, P);
    }
  }

  /* ------------------------------------------------------------- Tag/Nacht ---
     Tag/Nacht ist eine Spielmechanik, darum eine body-Klasse und kein
     prefers-color-scheme. `remember` legt die Wahl in localStorage ab —
     nur für Werkzeuge und Dokumente sinnvoll, nicht für Spielbildschirme.
     -------------------------------------------------------------------------- */
  function night(on, remember) {
    var b = document.body;
    if (on === undefined) on = !b.classList.contains('night');
    b.classList.toggle('night', !!on);
    if (remember) store.set('sot-night', on ? '1' : '0');
    return on;
  }
  function nightRestore() {
    var v = store.get('sot-night');
    if (v === '1') document.body.classList.add('night');
  }

  /* ---------------------------------------------------------- Tageszeit ---
     Die vier Tageszeiten tragen eigene Grundtoene (sot.css: --z-morgen ..
     --z-nacht). SOT.zeit('abend') setzt body[data-zeit] — ab da nehmen
     phasen-bewusste Primitive (.primary, .tl-seg.now) automatisch den
     laufenden Akzent --zeit. Wer SOT.zeit nie ruft, sieht keinerlei
     Aenderung (kein data-zeit, kein Umgriff) — der Einbau ist additiv.
     Innere Schluessel des Kernloops werden uebersetzt (daemmerung→morgen,
     tag→mittag). SOT.zeit() ohne Argument liest, SOT.zeit(null) loescht.
     -------------------------------------------------------------------------- */
  var ZEITEN = ['morgen', 'mittag', 'abend', 'nacht'];
  function zeit(name) {
    var b = document.body;
    if (name === undefined) return b.dataset.zeit || null;
    if (name === null) { delete b.dataset.zeit; return null; }
    name = ({ daemmerung: 'morgen', tag: 'mittag' })[name] || name;
    if (ZEITEN.indexOf(name) < 0) throw new Error('SOT.zeit: unbekannte Tageszeit ' + name);
    b.dataset.zeit = name;
    return name;
  }
  zeit.ALLE = ZEITEN;

  /* ---------------------------------------------------------------- Toast ---
     Eine Fassung statt der drei, die in den Prototypen umlaufen. Legt ihr
     Element selbst an, braucht also kein Markup.
     -------------------------------------------------------------------------- */
  var _toast = null;
  function toast(msg, ms) {
    if (!_toast) { _toast = el('div.toast'); document.body.appendChild(_toast); }
    _toast.textContent = msg;
    // Neustart der Transition erzwingen, sonst bleibt ein sichtbarer Toast stumm.
    _toast.classList.add('show');
    clearTimeout(_toast._h);
    _toast._h = setTimeout(function () { _toast.classList.remove('show'); }, ms || 2200);
    return _toast;
  }

  /* ------------------------------------------------- Überlagerung und Blatt ---*/
  // Karte in der Überlagerung. choices: [{label, hint, onclick}]
  function overlay(o) {
    o = o || {};
    var card = el('div.ocard');
    if (o.tag) card.appendChild(el('div.tag', { text: o.tag }));
    if (o.title) card.appendChild(el('h2', { text: o.title }));
    if (o.text) card.appendChild(el('p', { text: o.text }));
    if (o.body) card.appendChild(o.body);
    var wrap = el('div.overlay', null, [card]);
    function close() { wrap.classList.remove('on'); setTimeout(function () { wrap.remove(); }, 900); }
    if (o.choices) {
      var box = el('div.choices');
      o.choices.forEach(function (c) {
        box.appendChild(el('button' + (c.primary ? '.primary' : ''), {
          onclick: function () { if (c.onclick) c.onclick(); if (c.keepOpen !== true) close(); }
        }, [c.label, c.hint ? el('small', { text: c.hint }) : null]));
      });
      card.appendChild(box);
    }
    if (o.dismissable !== false) wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('on'); });
    return { el: wrap, card: card, close: close };
  }

  // Blatt: verdrahtet ein vorhandenes .sheet mit Verdunkelung und Esc.
  function sheet(node) {
    node = $(node);
    var dim = el('div.overlay', { style: { zIndex: 44 } });
    document.body.appendChild(dim);
    dim.addEventListener('click', close);
    function open() { node.classList.add('on'); dim.classList.add('on'); }
    function close() { node.classList.remove('on'); dim.classList.remove('on'); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $$('.closesheet', node).forEach(function (b) { b.addEventListener('click', close); });
    return { open: open, close: close, toggle: function () { node.classList.contains('on') ? close() : open(); } };
  }

  /* -------------------------------------------------------------- Glut-Orb ---
     Ein Licht tritt aus dem Nebel, wandert über einem Ziel und lockt. Das ist
     die Einladung ohne Worte — sie steht dort, wo noch kein Bedienelement
     erklärt wäre (der Auftakt auf dem ersten Feld).

       var o = SOT.orb('#karte', {
         aus:'S', ruf:'antippen', w:30,
         bahn:'kreis', licht:130,
         aufLicht: function (x, y, r) { … }   // je Bild: Mitte des Lichts
       });
       await o.klick;              // erfüllt beim ersten Anfassen
       await o.weg();              // verglühen lassen

     Optionen: aus (S|N|W|E) · ruf (Wort darunter, null = keins) · w
     (Durchmesser, Zahl = px) · dx/dy (Versatz aus der Mitte, '12%' oder px) ·
     ein (Auftritt in ms) · nachEin (Pause bis der Ruf beginnt) · tropfen
     (Tropfen im Kranz, 0 = keiner) · bahn ('ruhe' | 'kreis' | 'acht') ·
     bahnr (Radius der Bahn in px) · bahnzeit (eine Runde in ms) · licht
     (Radius des Scheinwerfers in px, 0 = keiner) · aufLicht (Rückruf je Bild
     mit der Mitte des Lichts, relativ zum Ziel) · label (aria-label) ·
     onclick.

     Zwei Zeitschienen, absichtlich getrennt: die **Dramaturgie** (ein,
     nachEin) läuft über SOT.warte und gehorcht SOT.tempo() — sonst würde
     ?tempo=schnell den Auftakt nicht beschleunigen. Die **Bahn** ist Atmosphäre
     und läuft in ihrem eigenen Takt weiter; ein schnellerer Ablauf soll das
     Licht nicht herumrasen lassen.

     aufLicht ist der Grund, warum die Bahn in JS und nicht in CSS läuft: der
     Prototyp muss wissen, wo das Licht steht, um darauf zu reagieren (Kanten
     fangen es, Nebel weicht). Eine CSS-Animation weiß das nicht. Der Rückruf
     kommt gedrosselt (~30 Hz) — das Auge sieht den Unterschied nicht, der
     Stilbaum schon.
     -------------------------------------------------------------------------- */
  function orb(host, o) {
    o = o || {};
    host = $(host);
    // Der Orb liegt absolut im Ziel. Ein statisch positionierter Behälter
    // würde ihn an das nächste positionierte Elternteil hängen — der
    // klassische „warum sitzt das Licht in der Ecke"-Fehler.
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    var einMs = o.ein === undefined ? 2600 : o.ein;
    var px = function (v) { return typeof v === 'number' ? v + 'px' : v; };
    var ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var feld = el('div.orbfeld.aus-' + (o.aus || 'S'));
    if (o.w) feld.style.setProperty('--orbw', px(o.w));
    if (o.dx) feld.style.setProperty('--orbdx', px(o.dx));
    if (o.dy) feld.style.setProperty('--orbdy', px(o.dy));

    var lichtR = o.licht === undefined ? 0 : o.licht;
    if (lichtR) feld.style.setProperty('--orblichtr', px(lichtR));

    var ball = el('button.orb.tritt', {
      type: 'button',
      'aria-label': o.label || o.ruf || 'Das Licht berühren'
    }, [
      el('i.ring'), el('i.ring.r2'),
      o.ruf === null ? null : el('span.ruf', { text: o.ruf || 'antippen' })
    ]);

    // Tropfenkranz. Der Index steckt als --i im Tropfen: daran hängen Winkel,
    // Verzögerung des Auftritts und Phase des Quellens — ohne ihn wäre es ein
    // Ring, der zappelt, statt einer Flüssigkeit, die sich sammelt.
    var grob = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    var n = o.tropfen === undefined ? (grob ? 8 : 12) : o.tropfen;
    if (n > 0) {
      var kranz = el('i.kranz');
      kranz.style.setProperty('--kranzschritt', (360 / n).toFixed(2) + 'deg');
      for (var k = 0; k < n; k++) {
        var t = el('i.tropf');
        t.style.setProperty('--i', k);
        kranz.appendChild(t);
      }
      ball.insertBefore(kranz, ball.firstChild);
    }
    // Eigenschaftsnamen mit -- gehen nur über setProperty; ein Zuweisen an
    // style würde still nichts tun. Der Auftritt teilt sich die Dauer mit
    // der Wartezeit unten, darum dieselbe Zahl.
    ball.style.setProperty('--orbein', Math.round(einMs * (tempoFaktor || 1)) + 'ms');

    var bahnEl = el('div.orbbahn', null, [lichtR ? el('i.orblicht') : null, ball]);
    feld.appendChild(el('div.orbschein'));
    feld.appendChild(bahnEl);
    host.appendChild(feld);
    requestAnimationFrame(function () { feld.classList.add('an'); });

    var gefasst = false, aufloesen;
    var klick = new Promise(function (r) { aufloesen = r; });
    // Auf einem Telefon gibt es kein Hover: der Kranz muss auch auf Druck
    // erscheinen, sonst sieht ihn dort niemand.
    ball.addEventListener('pointerdown', function () { ball.classList.add('nah'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      ball.addEventListener(ev, function () { ball.classList.remove('nah'); });
    });
    ball.addEventListener('click', function () {
      if (gefasst) return;
      gefasst = true;
      ball.classList.remove('lockt');
      ball.classList.add('gefasst');
      if (o.onclick) o.onclick();
      aufloesen(true);
    });

    /* ---- Bahn und Meldung der Lichtmitte ---------------------------------
       Während des Auftritts wird gemessen — da trägt der Ball eine Animation,
       die in keiner Formel steht. Danach wird gerechnet: Ruhemitte (einmal
       gemessen) plus Bahnversatz. Das Wiegen bleibt dabei außen vor, es sind
       ±9 % der Ballbreite gegen einen Lichtradius von über hundert Pixeln.

       Warum überhaupt: die zwei Rechtecke je Bild erzwingen HEUTE kein Layout
       (nachgemessen: LayoutCount 0 — translate und Custom Properties machen
       Layout nicht schmutzig). Aber sie sind eine Falle: schreibt ein Prototyp
       im selben Bild eine Breite, werden daraus zwei erzwungene Layouts je
       Bild. Rechnen kann nicht kippen.

       Gedrosselt auf ~30 Hz, und bei stehendem Licht hält die Schleife an:
       eine Endlosschleife für ein Bild, das sich nicht ändert, ist reine
       Batterie. Ein Resize weckt sie wieder.
       -------------------------------------------------------------------- */
    var art = ruhig ? 'ruhe' : (o.bahn || 'ruhe');
    var bahnR = o.bahnr === undefined ? 40 : o.bahnr;
    var bahnZeit = o.bahnzeit === undefined ? 9000 : o.bahnzeit;
    var einEnde = ruhig ? 0 : Math.round(einMs * (tempoFaktor || 1));
    var laeuft = true, dreht = false, t0 = null;
    var basis = null, bxAkt = 0, byAkt = 0, neuMessen = true, letzteMeldung = -1e9;

    function mitte() {
      var hb = host.getBoundingClientRect(), bb = ball.getBoundingClientRect();
      return { x: bb.left + bb.width / 2 - hb.left, y: bb.top + bb.height / 2 - hb.top };
    }
    // Ruhemitte: das Rechteck der Bahn trägt ihren eigenen Versatz schon mit,
    // darum wird er wieder abgezogen.
    function basisMessen() {
      var hb = host.getBoundingClientRect(), bb = bahnEl.getBoundingClientRect();
      basis = { x: bb.left + bb.width / 2 - hb.left - bxAkt,
                y: bb.top + bb.height / 2 - hb.top - byAkt };
      neuMessen = false;
    }
    function schritt(ts) {
      if (!laeuft) { dreht = false; return; }
      if (t0 === null) t0 = ts;
      if (neuMessen) basisMessen();
      if (art !== 'ruhe') {
        var ph = ((ts - t0) % bahnZeit) / bahnZeit * Math.PI * 2, bx, by;
        if (art === 'acht') { bx = Math.sin(ph) * bahnR; by = Math.sin(ph * 2) * bahnR * 0.34; }
        // Die Ellipse ist flacher als breit: ein Licht über einer Fläche
        // wandert in der Schräge, ein Kreis sähe aus wie ein Rad.
        else { bx = Math.cos(ph) * bahnR; by = Math.sin(ph) * bahnR * 0.42; }
        bahnEl.style.translate = bx.toFixed(2) + 'px ' + by.toFixed(2) + 'px';
        bxAkt = bx; byAkt = by;
      }
      if (o.aufLicht && ts - letzteMeldung >= 32) {
        letzteMeldung = ts;
        var m = (ts - t0 < einEnde) ? mitte()
                                    : { x: basis.x + bxAkt, y: basis.y + byAkt };
        o.aufLicht(m.x, m.y, lichtR);
      }
      // Steht das Licht und ist der Auftritt vorbei, gibt es nichts mehr zu tun.
      if (art === 'ruhe' && ts - t0 >= einEnde) { dreht = false; return; }
      requestAnimationFrame(schritt);
    }
    function wecken() {
      neuMessen = true;
      if (laeuft && !dreht) { dreht = true; requestAnimationFrame(schritt); }
    }
    window.addEventListener('resize', wecken);
    if (art !== 'ruhe' || o.aufLicht) { dreht = true; requestAnimationFrame(schritt); }

    // Auftritt abwarten, dann in Ruhelage und locken.
    var fertig = warte(einMs).then(function () {
      ball.classList.remove('tritt');
      ball.classList.add('schwebt');
      return warte(o.nachEin === undefined ? 700 : o.nachEin);
    }).then(function () { if (!gefasst) ball.classList.add('lockt'); });

    function lockt() { ball.classList.add('lockt'); }
    function weg() {
      feld.classList.add('weg');
      ball.classList.add('gefasst');
      return warte(900).then(function () {
        laeuft = false;
        window.removeEventListener('resize', wecken);
        feld.remove();
      });
    }
    return {
      el: feld, ball: ball, bahn: bahnEl,
      klick: klick, bereit: fertig, lockt: lockt, weg: weg, mitte: mitte
    };
  }

  /* ---------------------------------------------------------------- Reiter ---
     tabs('.tabs', fn) — button[data-tab] schaltet .pane[data-tab] sichtbar.
     Gibt select(name) zurück, damit ?tab=… ohne Klick ankommt.
     -------------------------------------------------------------------------- */
  function tabs(bar, onChange) {
    bar = $(bar);
    var btns = $$('button[data-tab]', bar);
    function select(name) {
      btns.forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
      $$('[data-tab]').forEach(function (p) {
        if (p.tagName === 'BUTTON') return;
        p.classList.toggle('hid', p.dataset.tab !== name);
      });
      if (onChange) onChange(name);
      return name;
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { select(b.dataset.tab); }); });
    if (btns.length) select((btns.filter(function (b) { return b.classList.contains('on'); })[0] || btns[0]).dataset.tab);
    return { select: select };
  }

  /* Aufklappbare .grp-Gruppen in einer Seitenleiste verdrahten. */
  function groups(root) {
    $$('.grp', $(root) || document).forEach(function (g) {
      var head = g.querySelector('.ghead');
      if (!head || head._sot) return;
      head._sot = 1;
      if (!head.querySelector('.chev')) head.appendChild(el('span.chev', { text: '▶' }));
      head.addEventListener('click', function () { g.classList.toggle('open'); });
    });
  }

  /* --------------------------------------------------------------- Zufall ---
     Seedbar, damit ?seed=… einen Lauf reproduzierbar macht — ohne das ist
     ein Balancing-Befund nicht überprüfbar. mulberry32.
     -------------------------------------------------------------------------- */
  function rng(seed) {
    var a = (seed || 1) >>> 0;
    function next() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    next.int = function (n) { return Math.floor(next() * n); };
    next.pick = function (arr) { return arr[Math.floor(next() * arr.length)]; };
    next.shuffle = function (arr) {
      var a2 = arr.slice();
      for (var i = a2.length - 1; i > 0; i--) { var j = Math.floor(next() * (i + 1)); var t = a2[i]; a2[i] = a2[j]; a2[j] = t; }
      return a2;
    };
    // Gewichtete Wahl: [['ufer',3],['wald',1]]
    next.weighted = function (pairs) {
      var tot = 0, i;
      for (i = 0; i < pairs.length; i++) tot += pairs[i][1];
      var x = next() * tot;
      for (i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x <= 0) return pairs[i][0]; }
      return pairs[pairs.length - 1][0];
    };
    return next;
  }

  /* ------------------------------------------------------------ Formatieren ---*/
  // Jahreszahlen mit Leerzeichen als Tausendertrenner: 11 700 statt 11'700.
  // Schweizer Apostroph und deutscher Punkt lesen sich in einer Jahreszahl
  // beide falsch, darum überall dieselbe schmale Lücke.
  function jahr(y) { return Math.round(y).toLocaleString('de-CH').replace(/[’'.,  ]/g, ' '); }
  function num(n, digits) {
    return (typeof digits === 'number' ? Number(n).toFixed(digits) : String(Math.round(n)))
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function vz(n, digits) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + num(Math.abs(n), digits); }

  /* ------------------------------------------------------------ Speicher ---
     localStorage ist unter file:// je Ordner geteilt und wirft in manchen
     Zuständen — darum immer gekapselt und immer mit Rückfallwert.
     -------------------------------------------------------------------------- */
  var store = {
    get: function (k, def) { try { var v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    json: function (k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } },
    setJson: function (k, v) { return store.set(k, JSON.stringify(v)); },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ------------------------------------------------------------ Spielkarte ---
     Baut eine .effektkarte (sot.css): Kopfband + fuenf Zonen in FESTER
     Reihenfolge — Kopfband (Tageszeit · Art · Dauer) → Name → Wer →
     Wirkung → Regel → Preis/Stimmung. Die Ordnung ist Absicht
     (notes/gedanken-zum-kartendesign.md): wer eine Karte baut, fuellt Zonen,
     statt je Karte ein Layout zu erfinden — darum gibt es hier keinen Weg,
     sie umzustellen.

       SOT.karte({
         name:   'Spaeher vorausschicken',        // Pflicht — Zone 1
         zeit:   'morgen',                        // fester Ton (.z-*), Kopfband
         art:    'spielen',                       // Wortschatz: 'spielen' |
                                                  // 'herstellen' | 'rundenbedingung'
                                                  // (je ein Zeichen; Freitext geht,
                                                  // traegt aber kein Zeichen)
         dauer:  'heute',                         // Wirkdauer, kurz — Kopfband
         geltung:'person',                        // 'person' (Standard) | 'runde';
                                                  // art 'rundenbedingung' setzt
                                                  // 'runde' von selbst
         wer:    [{icon:'jaeger', name:'Jaeger'}],// Marken — wen es trifft (Zone 2)
         wert:   {icon:'spur', text:'+2 Sicht'},  // Zone 3 — die Pointe
         regel:  'Der Jaeger erhaelt +2 Sicht.',  // Zone 4, max 3 Zeilen
         sperre: 'braucht eine wache Person',     // warum gerade nicht spielbar
         kost:   '−1 Nahrung',                    // Zone 5
         flav:   'Wer zuerst sieht, isst zuerst.',
         hoch:   true,                            // 5:7-Hochformat (Handkarte)
         groesse:'s',                             // 's' klein · 'l' gross (ohne: Mittel)
         tag:    'div',                           // Standard: button
         onclick: fn, disabled: true
       })

     Zeichen kommen aus sot-icons.js, wenn es geladen ist; ohne bleibt die
     Stelle leer. Ein unbekannter Name zeigt die Fehlmarke des Zeichensatzes.
     Die Zonen sind SKELETT: Band, Wer, Wirkung, Regel, Preis und Stimmung
     stehen auch leer an ihrem Platz (leer heisst nicht weg) — Reihen bleiben
     so hoehengleich, egal welche Zonen eine Karte fuellt. Die Etiketten im
     Kopfband tragen .lbl und klappen bei schmalen Karten von selbst ein
     (Containerabfrage in sot.css) — die Zeichen bleiben.
     ------------------------------------------------------------------------- */
  var ZEIT_ZEICHEN = { morgen: 'morgen', mittag: 'sonne', abend: 'abend', nacht: 'mond' };
  var ART_ZEICHEN = { spielen: 'spielen', herstellen: 'herstellen', rundenbedingung: 'runde' };
  function karte(def) {
    if (!def || !def.name) throw new Error('SOT.karte: name fehlt — Zone 1 ist Pflicht.');
    function zeichen(name) {
      return (name && window.SOT && window.SOT.icon) ? window.SOT.icon(name) : '';
    }
    var geltung = def.geltung || (def.art === 'rundenbedingung' ? 'runde' : 'person');
    var spec = (def.tag || 'button') + '.effektkarte.'
      + (geltung === 'runde' ? 'k-runde' : 'k-person')
      + (def.zeit ? '.z-' + def.zeit : '') + (def.hoch ? '.hoch' : '')
      + (def.groesse === 's' ? '.klein' : def.groesse === 'l' ? '.gross' : '');
    var node = el(spec, {
      type: def.tag ? null : 'button',
      disabled: def.disabled || null,
      onclick: def.onclick || null
    });
    /* Ein Stueck des Kopfbands: Zeichen + Etikett (.lbl — klappt ein). */
    function band(cls, icon, label) {
      var s = el('span.' + cls, { html: zeichen(icon) });
      if (label) s.appendChild(el('span.lbl', { text: label }));
      return s;
    }
    /* K · Kopfband — Skelett: steht auch leer an seinem Platz. */
    var kopf = el('span.kband');
    if (def.zeit) kopf.appendChild(band('kzeit', ZEIT_ZEICHEN[def.zeit] || def.zeit, def.zeit));
    if (def.art) kopf.appendChild(band('kart', ART_ZEICHEN[def.art] || null, def.art));
    if (def.dauer) kopf.appendChild(band('kdauer', null, def.dauer));
    node.appendChild(kopf);
    /* 1 · Name — fester Kopf, zwei Zeilen hoch. */
    node.appendChild(el('span.knm', { text: def.name }));
    /* 2 · Wer — der Marken-Platz, auch leer da. */
    var wers = el('span.kwers');
    [].concat(def.wer || []).forEach(function (w) {
      var m = el('span.kwer', { html: zeichen(w.icon) });
      if (w.name) m.appendChild(document.createTextNode(w.name));
      wers.appendChild(m);
    });
    node.appendChild(wers);
    /* 3 · Wirkung — Skelett. */
    var wert = el('span.kwert', { html: def.wert && def.wert.icon ? zeichen(def.wert.icon) : '' });
    if (def.wert && def.wert.text) wert.appendChild(document.createTextNode(def.wert.text));
    node.appendChild(wert);
    /* 4 · Regel — Skelett; die Sperre ist Ausnahme, kein Platzhalter. */
    node.appendChild(el('span.kfx', { text: def.regel || '' }));
    if (def.sperre) node.appendChild(el('span.ksperre', { text: def.sperre }));
    /* 5 · Fuss — Skelett. */
    node.appendChild(el('span.kkost', { text: def.kost || '' }));
    node.appendChild(el('span.kflav', { text: def.flav || '' }));
    return node;
  }

  /* ---------------------------------------------------------------- Takt ---
     Für Abläufe, die sich abspielen (Nachtsequenz, Drehbuch). tempo skaliert
     alles auf einmal, damit ?tempo=schnell wirklich alles beschleunigt.
     -------------------------------------------------------------------------- */
  var tempoFaktor = 1;
  function tempo(name) {
    tempoFaktor = name === 'schnell' ? 0.35 : name === 'langsam' ? 2 : 1;
    return tempoFaktor;
  }
  function warte(ms) { return new Promise(function (r) { setTimeout(r, ms * tempoFaktor); }); }

  return {
    $: $, $$: $$, el: el, clear: clear,
    params: params, debug: debug, hilfe: printHelp, regler: regler,
    night: night, nightRestore: nightRestore, zeit: zeit,
    toast: toast, overlay: overlay, sheet: sheet, orb: orb,
    tabs: tabs, groups: groups, karte: karte,
    rng: rng, jahr: jahr, num: num, vz: vz,
    store: store, tempo: tempo, warte: warte
  };
})();
