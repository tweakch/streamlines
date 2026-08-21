/* ============================================================================
   sot-doc.js — STROMLINIEN Prototyp-Baukasten · Wissensdokumente

   Verdrahtet ein Handbuch: aufklappbare Karten, Inhaltsverzeichnis aus den
   Kapiteln, Statusfilter, Publish-/Entwicklungs-Ansicht, Tag/Nacht.

     SOT.doc.init();     // reicht, wenn die Struktur aus sot-doc.css steht

   Das Dokument liefert nur Struktur und `data-s` je Karte; Zählung, Filter,
   Verzeichnis und Ansichtswechsel kommen von hier. Genau diese vier Dinge
   waren in jedem der drei Handbücher einzeln geschrieben.

   Erwartete Struktur (siehe sot-doc.css):
     h2.chap  mit id und <span class="n">01</span>
     .card[data-s="done|concept|idea|rej|open"] > .chead + .cbody
   Optional im Dokument, wird bespielt wenn vorhanden:
     .modebtn  .viewbtn  #toclinks  #count  #modetag  .filters
   ========================================================================= */
'use strict';
SOT.doc = (function () {
  var $ = SOT.$, $$ = SOT.$$, el = SOT.el;

  var STATES = ['done', 'concept', 'idea', 'rej', 'open'];
  var LABEL = { done: 'Umgesetzt', concept: 'Konzept', idea: 'Idee', rej: 'Verworfen', open: 'Offen' };
  // Publish zeigt, was entschieden oder gebaut ist — nicht, was gedacht wurde.
  var PUBLISH = ['done', 'concept'];

  var mode = 'dev', filter = 'all', key = 'sot-doc-mode';

  function init(opts) {
    opts = opts || {};
    if (opts.key) key = opts.key;

    // Karten: Plakette ergänzen, Chevron ergänzen, Kopf klickbar machen.
    $$('.card').forEach(function (card) {
      var head = card.querySelector('.chead');
      if (!head) return;
      var s = card.dataset.s || 'open';
      if (!head.querySelector('.badge')) {
        head.insertBefore(el('span.badge.b-' + s, { text: LABEL[s] || s }),
                          head.querySelector('.chev') || null);
      }
      if (!head.querySelector('.chev')) head.appendChild(el('span.chev', { text: '▶' }));
      head.addEventListener('click', function () { card.classList.toggle('openc'); });
    });

    // Filterleiste bauen, falls das Dokument nur den leeren Behälter mitbringt.
    var bar = $('.filters');
    if (bar && !bar.children.length) {
      bar.appendChild(el('button.fbtn.on', { text: 'Alle', data: { f: 'all' } }));
      STATES.forEach(function (s) {
        bar.appendChild(el('button.fbtn', { data: { f: s } }, [
          el('span.dot', { style: { background: 'var(--st-' + s + ')' } }), LABEL[s]
        ]));
      });
    }
    $$('.fbtn').forEach(function (b) {
      b.addEventListener('click', function () { filter = b.dataset.f; render(); });
    });

    // Ansichtswechsel und Tag/Nacht.
    var vb = $('.viewbtn');
    if (vb) vb.addEventListener('click', function () { setMode(mode === 'publish' ? 'dev' : 'publish', true); });
    var mb = $('.modebtn');
    if (mb) mb.addEventListener('click', function () {
      mb.textContent = SOT.night(undefined, true) ? '☀ TAG' : '☾ NACHT';
    });
    SOT.nightRestore();
    if (mb) mb.textContent = document.body.classList.contains('night') ? '☀ TAG' : '☾ NACHT';

    // ?mode gewinnt (teilbare Links), sonst die gemerkte Wahl, sonst Entwicklung.
    var q = new URLSearchParams(location.search).get('mode');
    var m = (q === 'publish' || q === 'dev') ? q : SOT.store.get(key);
    setMode(m === 'publish' ? 'publish' : 'dev', false);

    // ?karte=<id> öffnet eine Karte direkt und springt hin — ein Screenshot
    // kann nicht klicken, und ein zugeklapptes Handbuch zeigt nichts.
    var open = new URLSearchParams(location.search).get('karte');
    if (open) {
      var c = document.getElementById(open) || $('.card[data-id="' + open + '"]');
      if (c) { c.classList.add('openc'); c.scrollIntoView({ block: 'center' }); }
    }
    return api;
  }

  function visible(card) {
    var s = card.dataset.s || 'open';
    if (mode === 'publish') return PUBLISH.indexOf(s) >= 0;
    return filter === 'all' || filter === s;
  }

  function render() {
    var toc = [], n = 0;
    // Ein Kapitel ohne sichtbare Karte verschwindet mitsamt Untertitel —
    // sonst stehen in der Publish-Ansicht leere Überschriften herum.
    chapters().forEach(function (ch) {
      var any = false;
      ch.cards.forEach(function (card) {
        var show = visible(card);
        card.classList.toggle('hidden', !show);
        if (show) { any = true; n++; }
      });
      ch.h2.style.display = any ? '' : 'none';
      ch.subs.forEach(function (p) { p.style.display = any ? '' : 'none'; });
      if (any) {
        var num = ch.h2.querySelector('.n');
        var title = num ? ch.h2.textContent.replace(num.textContent, '').trim() : ch.h2.textContent.trim();
        toc.push('<a href="#' + ch.h2.id + '">' + (num ? parseInt(num.textContent, 10) + ' ' : '') + title + '</a>');
      }
    });
    var t = $('#toclinks'); if (t) t.innerHTML = ' ' + toc.join(' · ');
    var c = $('#count'); if (c) c.textContent = n + ' Einträge' + (filter !== 'all' && mode !== 'publish' ? ' · Filter aktiv' : '');
    var mt = $('#modetag'); if (mt) mt.textContent = mode === 'publish' ? 'Publish' : 'Entwicklung';
    var vb = $('.viewbtn');
    if (vb) {
      vb.textContent = mode === 'publish' ? '✎ ENTWICKLUNG' : '⎙ PUBLISH';
      vb.title = mode === 'publish'
        ? 'Zur Entwicklungs-Ansicht: alles inkl. Ideen, Verworfenem und offenen Fragen'
        : 'Zur Publish-Ansicht: nur Entschiedenes und Umgesetztes';
    }
    $$('.fbtn').forEach(function (b) { b.classList.toggle('on', b.dataset.f === filter); });
  }

  // Kapitel = h2.chap plus alles bis zum nächsten h2.chap.
  function chapters() {
    var out = [], cur = null;
    Array.prototype.forEach.call(document.body.querySelectorAll('h2.chap, .card, .chapsub'), function (node) {
      if (node.matches('h2.chap')) { cur = { h2: node, cards: [], subs: [] }; out.push(cur); }
      else if (!cur) return;
      else if (node.matches('.card')) cur.cards.push(node);
      else cur.subs.push(node);
    });
    return out;
  }

  function setMode(m, persist) {
    mode = m;
    if (mode === 'publish') filter = 'all';
    document.body.classList.toggle('publish', mode === 'publish');
    if (persist) {
      SOT.store.set(key, mode);
      var u = new URL(location.href);
      u.searchParams.set('mode', mode);
      history.replaceState(null, '', u);
    }
    render();
  }

  // Zählung je Status — für eine Bilanzzeile im Dokument selbst.
  function stats() {
    var out = { total: 0 };
    STATES.forEach(function (s) { out[s] = 0; });
    $$('.card').forEach(function (c) { var s = c.dataset.s || 'open'; out[s] = (out[s] || 0) + 1; out.total++; });
    return out;
  }

  var api = { init: init, render: render, setMode: setMode, stats: stats,
              STATES: STATES, LABEL: LABEL, PUBLISH: PUBLISH };
  return api;
})();
