/* ============================================================================
   sot-figuren.js — STROMLINIEN Prototyp-Baukasten · Abbildungen fürs Handbuch

   Leser-Rückmeldung (Aug 2026): das veröffentlichte Handbuch beschreibt Dinge,
   die man sehen müsste — die fünf Zonen einer Spielkarte, die Uhr, eine Furt —
   in reinem Fliesstext. 55 Publish-Karten, 13 285 Wörter, null Abbildungen.

   Die Antwort ist KEIN Bilderordner. Ein Schnappschuss veraltet in dem Moment,
   in dem jemand `SOT.karte()` anfasst, und niemand merkt es. Stattdessen zeigt
   das Handbuch das Ding SELBST: die Spielkarte in der Abbildung ist dieselbe
   SOT.karte(), die im Spiel auf dem Tisch liegt. Ändert sich das Primitiv,
   ändert sich die Abbildung mit — sie kann gar nicht auseinanderlaufen.

     script src  →  ../kit/sot.js  ../kit/sot-icons.js
                    ../kit/sot-hex.js   (für Brett-Abbildungen)
                    ../kit/sot-doc.js   (bringt die Anmeldung SOT.doc.figur)
                    ../kit/sot-figuren.js

   Im Markdown des Handbuchs (prototype/handbuch/NN-*.md):

     ::: figur karte-zonen
     Die fünf Zonen einer Effektkarte.
     :::

   Eine neue Abbildung braucht: einen Eintrag hier, einen Namen im Markdown,
   und einen Blick auf dem Telefon (390 px) — die Bühne bricht um, die
   Beschriftung darf dabei nicht unter das Bild rutschen.

   Regel wie überall: Zeichen sind SVG (SOT.icon), Farben sind Tokens.
   ========================================================================= */
'use strict';
(function () {
  if (!window.SOT || !SOT.doc) throw new Error('sot-figuren.js verlangt sot.js und sot-doc.js');
  var el = SOT.el;

  /* Nummerierte Beschriftung neben einer Abbildung — dieselbe Nummerierung
     wie im Text der Karte, damit Bild und Absatz zusammenfinden. */
  function zonen(liste) {
    var ul = el('ul.fzonen');
    liste.forEach(function (z) {
      ul.appendChild(el('li', {}, [
        el('span.nr', { text: z[0] }),
        el('span', {}, [el('b', { text: z[1] }), ' — ' + z[2]])
      ]));
    });
    return ul;
  }

  /* ------------------------------------------------------------------------
     karte-zonen — „Die Anatomie der Spielkarte: fünf Zonen, feste Reihenfolge"
     Eine echte Karte, danebengestellt die Zonenliste. Die Karte ist bewusst
     .gross: die Zonen sollen lesbar sein, nicht bloss angedeutet.
     --------------------------------------------------------------------- */
  SOT.doc.figur('karte-zonen', function (buehne) {
    buehne.appendChild(SOT.karte({
      name: 'Fährte im Schnee',
      zeit: 'morgen', art: 'spielen', dauer: 'heute',
      wer: [{ icon: 'jaeger', name: 'Jäger' }],
      wert: { icon: 'lupe', text: '+2 Sicht' },
      regel: 'Der Jäger sieht diese Runde zwei Felder weit.',
      sperre: 'Nicht bei Frost.',
      kost: '1 × Vorrat',
      flav: 'Der Schnee erinnert sich länger als der Wald.',
      groesse: 'l', tag: 'div'
    }));
    buehne.appendChild(zonen([
      ['K', 'Kopfband', 'Tageszeit · Art · Dauer, in der Akzentfarbe der Oberkante'],
      ['1', 'Name', 'der grösste Text; fest zwei Zeilen hoch'],
      ['2', 'Wer', 'die Personen-Marken — immer dieselbe Stelle'],
      ['3', 'Wirkung', 'die mechanische Pointe als Zeichen + Zahl'],
      ['4', 'Regeltext', '1–3 kurze Zeilen, darunter in Rot die Sperre'],
      ['5', 'Fuss', 'Preis und Stimmungszeile, die kleinste Schrift']
    ]));
  });

  /* ------------------------------------------------------------------------
     karte-geltung — dieselbe Anatomie, zweimal: die beiden Achsen, nach denen
     man eine Karte ohne Lesen sortieren kann (Tageszeit-Ton · voller vs.
     gestrichelter Rahmen). Drei Karten nebeneinander, damit der Unterschied
     als Unterschied sichtbar wird und nicht behauptet werden muss.
     --------------------------------------------------------------------- */
  SOT.doc.figur('karte-geltung', function (buehne) {
    [
      { name: 'Fährte im Schnee', zeit: 'morgen', art: 'spielen', dauer: 'heute',
        wer: [{ icon: 'jaeger', name: 'Jäger' }], wert: { icon: 'lupe', text: '+2' },
        regel: 'Sicht zwei Felder weit.', kost: '1 × Vorrat' },
      { name: 'Reusen flechten', zeit: 'abend', art: 'herstellen', dauer: 'diese Runde',
        wer: [{ icon: 'sammlerin', name: 'Sammlerin' }], wert: { icon: 'fisch', text: '+1' },
        regel: 'Legt eine Reuse ins Flussfeld.', kost: '2 × Material' },
      { name: 'Erster Frost', zeit: 'nacht', art: 'rundenbedingung', dauer: 'diese Runde',
        wert: { icon: 'frost', text: '−1' }, regel: 'Alle Wege kosten mehr.',
        flav: 'Der Fluss wird still.' }
    ].forEach(function (d) {
      d.groesse = 's'; d.tag = 'div';
      buehne.appendChild(SOT.karte(d));
    });
  });

  /* ------------------------------------------------------------------------
     uhr — „Die Uhr: Tageszeit, Jahr und Runden als ein Instrument"
     Zwei Zeilen, wie in erkundung-v4: die Runden als Leiste OHNE Ziffern
     (die Raute markiert das Anker-Ereignis), darunter die vier Tageszeiten
     als Zeichen; die laufende glüht, vergangene sind gedämpft.
     --------------------------------------------------------------------- */
  SOT.doc.figur('uhr', function (buehne) {
    var kasten = el('div', { style: { width: '100%', maxWidth: '300px' } });

    var tl = el('div.timeline');
    for (var i = 0; i < 8; i++) {
      var cls = '.tl-seg' + (i < 3 ? '.done' : '') + (i === 3 ? '.now' : '') + (i === 5 ? '.anchor' : '');
      tl.appendChild(el(cls, { style: { cursor: 'default' } }));
    }
    kasten.appendChild(tl);

    var zeiten = el('div', { style: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 6px'
    } });
    [['morgen', 'Sonne auf'], ['sonne', 'Sonne hoch'], ['abend', 'Sonne ab'], ['mond', 'Nacht']]
      .forEach(function (z, i) {
        var laufend = i === 1;
        var s = el('span', {
          html: SOT.icon(z[0]),
          title: z[1],
          style: {
            width: '22px', height: '22px', display: 'inline-flex',
            color: laufend ? 'var(--ember)' : 'var(--ink2)',
            opacity: laufend ? '1' : (i < 1 ? '.35' : '.6')
          }
        });
        zeiten.appendChild(s);
      });
    kasten.appendChild(zeiten);
    buehne.appendChild(kasten);

    buehne.appendChild(zonen([
      /* Die Ankermarke wird gezeichnet, nicht getippt — .tl-seg.anchor trägt
         sie als SVG-Maske. Ein Schriftzeichen stünde hier für ein Spielding. */
      ['1', 'Runden', 'Fortschrittsbalken ohne Ziffern; die Ankermarke sitzt über der Runde, in der ein belegtes Ereignis wartet'],
      ['2', 'Tageszeit', 'vier Zeichen, die laufende glüht — ablesbar ohne ein Wort'],
      ['3', 'Jahr', '„vor 12 000 Jahren" — steht im Kopf der Seite, nicht in der Uhr']
    ]));
  });

  /* ------------------------------------------------------------------------
     furt — „Furten – flache Stellen im Fluss"
     Ein Brettausschnitt: der Fluss verzweigt sich zur Schotterflur, wird
     flach, und genau dort liegt die Furt. Die Menschen stehen auf beiden
     Ufern — die Karte zeigt, was der Satz „verbindet Plättchen beider Ufer"
     meint. Geometrie aus SOT.hex (odd-r), damit sie nachbart wie das Spiel.
     --------------------------------------------------------------------- */
  SOT.doc.figur('furt', function (buehne) {
    if (!SOT.hex) { buehne.textContent = 'sot-hex.js fehlt'; return; }
    var COLS = 6, ROWS = 4;
    /* Gelände je Feld — Schotterflur (kies) in der Mitte, wo der Lauf
       sich auf die dreifache Breite verteilt. */
    var WASSER = { '2,0': 1, '2,1': 1, '1,2': 1, '2,2': 1, '3,2': 1, '2,3': 1 };
    var KIES = { '1,2': 1, '3,2': 1 };
    var FURT = { '2,2': 1 };

    var map = el('div.map.tight', { style: { width: '100%', maxWidth: '290px' } });
    SOT.hex.grid(map, COLS, ROWS, function (cell, c, r) {
      var k = c + ',' + r;
      if (FURT[k]) cell.classList.add('water', 'flach', 'furt');
      else if (KIES[k]) cell.classList.add('kies');
      else if (WASSER[k]) cell.classList.add('water');
      else cell.classList.add(r < 2 ? 'ufer' : 'wald');
    });
    /* Die beiden Menschen auf gegenüberliegenden Ufern der Furt — .krone ist
       der Slot der Menschen, .pers die bemessene Marke darin. */
    SOT.hex.mark(SOT.hex.cellAt(map, 1, 1), 'krone', SOT.iconEl('jaeger', 'pers'));
    SOT.hex.mark(SOT.hex.cellAt(map, 3, 3), 'krone', SOT.iconEl('sammlerin', 'pers'));
    /* .lmk positioniert sich selbst im Feld, sie gehört in keinen Slot. */
    SOT.hex.cellAt(map, 2, 2).appendChild(el('span.lmk', { text: 'Furt' }));
    buehne.appendChild(map);
    /* Erst NACH dem Anhängen messen — und autosize statt fester --hexw, weil
       der Kartenrumpf zugeklappt display:none ist und clientWidth dann 0
       liefert; der ResizeObserver holt das nach, sobald die Karte aufgeht. */
    SOT.hex.autosize(map, COLS, { max: 46 });

    buehne.appendChild(zonen([
      ['1', 'Schotterflur', 'der Lauf verzweigt sich auf die dreifache Breite'],
      ['2', 'Furt', 'dasselbe Wasser, flach — hier kommen Menschen hinüber'],
      ['3', 'Verbund', 'Plättchen beider Ufer zählen über die Furt hinweg zusammen']
    ]));
  });
})();
