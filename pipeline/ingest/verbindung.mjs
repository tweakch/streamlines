/*
 * verbindung.mjs — Aspire spricht .NET, `pg` spricht libpq.
 *
 * Das Harness setzt `ConnectionStrings__welten` im Npgsql-Format
 * ("Host=…;Port=…;Username=…;Password=…;Database=…"). Der Node-Client will ein
 * Objekt. Diese Übersetzung ist die ganze Reibung zwischen den zwei Ökosystemen.
 *
 * ZWILLING: dieselbe Übersetzung steht in server/api/server.js. Bewusst
 * zweimal — es sind zwei getrennt gestartete Prozesse in zwei getrennten
 * npm-Bäumen, und zwanzig Zeilen Parser sind billiger als eine geteilte
 * Abhängigkeit zwischen `server/` und `pipeline/`. Wer die eine ändert, ändert
 * die andere mit.
 *
 * Es gibt hier bewusst KEINEN Vorgabewert: läuft die Stufe ohne Harness, soll
 * sie laut scheitern und nicht stumm in eine fremde Datenbank schreiben.
 */

function paare(text, trenner) {
  return Object.fromEntries(
    text
      .split(trenner)
      .filter((teil) => teil.includes('='))
      .map((teil) => {
        const i = teil.indexOf('=')
        return [teil.slice(0, i).trim().toLowerCase(), teil.slice(i + 1).trim()]
      }),
  )
}

/** Npgsql- oder URL-Zeichenfolge → Konfiguration für `new pg.Client(…)`. */
export function pgConfig(cs, name = 'ConnectionStrings__welten') {
  if (!cs)
    throw new Error(
      `${name} fehlt — läuft das Harness? Diese Stufe startet man über die ` +
        `Ressource „pipeline" im Aspire-Dashboard, nicht von Hand.`,
    )
  if (/^postgres(ql)?:\/\//.test(cs)) return { connectionString: cs }
  const kv = paare(cs, ';')
  return {
    host: kv.host,
    port: Number(kv.port) || 5432,
    user: kv.username ?? kv.userid ?? kv.user,
    password: kv.password,
    database: kv.database,
  }
}

/** Für die Protokollzeile — ohne Passwort. */
export const verbindungAlsText = (c) =>
  c.connectionString
    ? c.connectionString.replace(/:[^:@/]*@/, ':***@')
    : `${c.user}@${c.host}:${c.port}/${c.database}`
