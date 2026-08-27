// Mehrsprachigkeit — dasselbe Modell wie prototype/kit/sot-i18n.js:
// DER DEUTSCHE TEXT IST DER SCHLÜSSEL (gettext-Stil). t('Nahrung') statt
// t('res.food'). Warum: der Umbau ist mechanisch (Text wickeln, fertig),
// Deutsch bleibt die Quelle der Wahrheit, eine fehlende Übersetzung zeigt
// den deutschen Text statt eines Lochs, und die Wörterbücher sind reine
// Deutsch→Sprache-Tabellen — in Prototyp und App wortgleich austauschbar.
// Der bekannte Preis: ändert sich der deutsche Wortlaut, verwaist der
// Eintrag; `orphans()` findet solche Einträge.

export type Lang = 'de' | 'en';

// Wörterbuch je Sprache: deutscher Text → Übersetzung. {n}-Platzhalter
// bleiben wörtlich stehen ('Runde {n}' → 'Round {n}').
const dicts: Partial<Record<Lang, Record<string, string>>> = {
  en: {},
};

const KEY = 'sot-lang';

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'de' || q === 'en') return q;
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'de' || s === 'en') return s;
  } catch {
    /* localStorage kann in manchen Kontexten werfen — dann Standard. */
  }
  return 'de';
}

let lang: Lang = initialLang();
document.documentElement.lang = lang;

type Listener = (l: Lang) => void;
const listeners = new Set<Listener>();

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang): void {
  lang = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* nicht persistierbar — Sitzung läuft trotzdem in der Sprache */
  }
  listeners.forEach((fn) => fn(l));
}

// React-Anbindung ohne Bibliothek: useSyncExternalStore-kompatibles Paar.
export function subscribeLang(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(text: string, params?: Record<string, string | number>): string {
  let out = lang !== 'de' ? (dicts[lang]?.[text] ?? text) : text;
  if (params) {
    out = out.replace(/\{(\w+)\}/g, (m, k: string) =>
      params[k] !== undefined ? String(params[k]) : m,
    );
  }
  return out;
}

// Einfacher Plural: tn(3, '{n} Plättchen', '{n} Plättchen') — beide Formen
// sind eigene Schlüssel, jede Sprache übersetzt beide.
export function tn(count: number, one: string, many: string): string {
  return t(count === 1 ? one : many, { n: count });
}

// Wörterbuch-Einträge nachliefern (z. B. je Screen gebündelt).
export function addDict(l: Lang, entries: Record<string, string>): void {
  dicts[l] = { ...(dicts[l] ?? {}), ...entries };
}

// Waisen: Einträge, deren deutscher Schlüssel nirgends mehr per t() läuft,
// sind hier nicht automatisch zählbar (kein DOM-Sweep wie im Prototyp) —
// diese Liste vergleicht zwei Wörterbücher gegeneinander und gehört in
// einen Test, nicht in den Spielcode.
export function orphans(reference: Record<string, string>, l: Lang): string[] {
  const d = dicts[l] ?? {};
  return Object.keys(d).filter((k) => !(k in reference));
}
