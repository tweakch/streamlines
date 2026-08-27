/*
 * apphost.mts — das Entwicklungsharness fuer Streamlines/Stromlinien.
 *
 * Der Sinn dieser Datei ist eine einzige feste Adresse: http://localhost:8080.
 * Aspire verteilt allen Diensten dynamische Ports; das Gateway ist der eine
 * Ort, an dem ein Port gepinnt wird. Genau darum lernen app/, die Prototypen
 * und jeder spaetere Client nur diese eine Adresse — und nie einen zweiten.
 *
 *   aspire run     startet alles, Dashboard-URL steht in der Ausgabe
 *   aspire stop    haelt es an
 *
 * Weltkarte:
 *   :8080/                → app        (Vite dev)
 *   :8080/api/*           → api        (Spielstaende, Postgres + Valkey)
 *   :8080/prototype/*     → tiles      (pipeline/serve.mjs, statisch)
 *   :8080/pipeline/*      → tiles      (Bake aus dem Viewer anstossen)
 *   :8080/server/*        → tiles      (contract.js fuer Drafts)
 *
 * Dazu eine Ressource ohne Adresse: `pipeline` laeuft nicht, sondern wird
 * gestartet — siehe unten.
 */
import { createBuilder } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

/* ---------- Infrastruktur ----------
 * withDataVolume: Spielstaende ueberleben einen Neustart des Containers.
 * withPersistentLifetime: der Container ueberlebt auch `aspire stop` — sonst
 * wartet man bei jedem Start wieder auf ein kaltes Postgres. */

const postgres = await builder
  .addPostgres('postgres')
  .withDataVolume()
  .withPersistentLifetime();

const welten = await postgres.addDatabase('welten');

const cache = await builder.addValkey('cache').withPersistentLifetime();

/* ---------- Dienste ---------- */

const api = await builder
  .addNodeApp('api', '../server/api', 'server.js')
  .withHttpEndpoint({ env: 'PORT' });

await api.withReference(welten);
await api.withReference(cache);
await api.waitFor(welten);
await api.waitFor(cache);

/* serve.mjs bindet von sich aus nur an 127.0.0.1 — bewusst, es ist ein
 * Entwicklungswerkzeug. Das Gateway laeuft aber im Container und kaeme dann
 * nicht herein, deshalb wird die Bindung hier explizit geweitet. */
const tiles = await builder
  .addNodeApp('tiles', '../pipeline', 'serve.mjs')
  .withHttpEndpoint({ env: 'PORT' })
  .withArgs(['--host=0.0.0.0']);

/* ---------- Die Pipeline ----------
 * Ein Stapelverarbeiter, kein Dienst: er laeuft einmal durch, schreibt die
 * gebackene Karte in das Postgres-Schema `natur` und beendet sich. Darum
 *
 *   withExplicitStart  — startet NICHT mit `aspire run`. Im Dashboard steht er
 *                        auf „Not started"; ein Klick auf Start ingestiert, ein
 *                        zweiter Klick spaeter wieder. Ohne dies wuerde bei
 *                        jedem `aspire run` die Datenbank neu geschrieben.
 *   kein Endpunkt      — es gibt nichts, worauf man zeigen koennte.
 *
 * Ohne --bake wird nur uebertragen, was in pipeline/out/karte.sqlite steht
 * (fehlt die Datei, backt das Skript selbst). Wer bei jedem Start die Overlays
 * neu rechnen will, haengt hier .withArgs(['--bake']) an — das kostet Minuten,
 * darum ist es nicht der Standard.
 *
 * NODE_NO_WARNINGS: node:sqlite ist noch experimentell und wuerde sonst jede
 * Ausgabe mit derselben Warnung eroeffnen. */
const pipeline = await builder
  .addNodeApp('pipeline', '../pipeline/ingest', 'ingest.mjs')
  .withExplicitStart()
  .withEnvironment('NODE_NO_WARNINGS', '1');

await pipeline.withReference(welten);
await pipeline.waitFor(welten);

/* addViteApp registriert http-Endpunkt und PORT selbst — kein
 * withHttpEndpoint hier, das waere ein doppelter Endpunkt. */
const app = await builder.addViteApp('app', '../app');
await app.withReference(api);

/* ---------- Die Tuere ----------
 * Kein Pfad-Transform: die API besitzt ihre /api/*-Pfade selbst. So trifft ein
 * Draft dieselbe URL, ob er durch das Gateway geht oder direkt auf den Dienst. */

const gateway = await builder.addYarp('gateway').withHostPort({ port: 8080 });

await gateway.withConfiguration(async (yarp) => {
  await yarp.addRoute('/api/{**catch-all}', api);
  await yarp.addRoute('/prototype/{**catch-all}', tiles);
  await yarp.addRoute('/pipeline/{**catch-all}', tiles);
  await yarp.addRoute('/server/{**catch-all}', tiles);
  await yarp.addCatchAllRoute(app);
});

await builder.build().run();
