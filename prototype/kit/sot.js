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
    var ov = el('div.overlay.on', { onclick: function () { ov.remove(); } }, [
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
    strip.appendChild(el('button', {
      text: document.body.classList.contains('night') ? '☀' : '☾', title: 'Tag / Nacht',
      onclick: function () { night(); }
    }));
    strip.appendChild(el('a', { text: '?', href: P.link({ hilfe: true }), title: 'Alle Parameter' }));
    document.body.appendChild(strip);
    return strip;
    function defineFlag(n, v) { var p = {}; p[n] = v ? true : null; return p; }
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
    params: params, debug: debug, hilfe: printHelp,
    night: night, nightRestore: nightRestore,
    toast: toast, overlay: overlay, sheet: sheet,
    tabs: tabs, groups: groups,
    rng: rng, jahr: jahr, num: num, vz: vz,
    store: store, tempo: tempo, warte: warte
  };
})();
