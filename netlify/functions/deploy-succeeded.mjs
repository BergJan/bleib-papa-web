/**
 * Meldet frisch erschienene Beiträge bei IndexNow.
 *
 * Der Dateiname ist kein Zufall: Netlify startet Funktionen, die wie ein
 * Deploy-Ereignis heißen, genau nach diesem Ereignis. `deploy-succeeded` läuft
 * also, sobald ein Deploy live ist. Erst dann steht die neue Sitemap im Netz,
 * vorher waere nichts zu melden.
 *
 * Warum ueberhaupt: Sonst wartet man darauf, dass Bing von selbst vorbeischaut,
 * und das dauert bei einer jungen Domain Tage. IndexNow dreht das um, die Seite
 * sagt Bescheid. Google beteiligt sich daran nicht, dort bleibt es bei Sitemap
 * und URL-Pruefung in der Search Console.
 *
 * Woher die Adressen kommen: aus dem `lastmod` der Sitemap. Dort steht bei
 * jedem Beitrag sein Erscheinungstag. Gemeldet wird nur, was auf heute faellt,
 * also genau das, was mit diesem Deploy neu sichtbar geworden ist. An Tagen
 * ohne neuen Beitrag passiert nichts.
 *
 * Der Schluessel ist absichtlich oeffentlich. IndexNow prueft die Echtheit
 * einer Meldung, indem es die Datei unter keyLocation abruft und den gleichen
 * Wert erwartet. Wer den Schluessel kennt, kann damit nichts anfangen, solange
 * er die Datei auf bleibpapa.de nicht aendern kann. Aendert sich der Wert hier,
 * muss die Datei in public/ mit umbenannt werden, sonst schlaegt die Pruefung
 * fehl und die Meldung wird verworfen.
 */

const SEITE = "https://bleibpapa.de";
const SCHLUESSEL = "5f3ffe7e303de1244b16c2cc7d652a7f";

export default async () => {
  const heute = new Date().toISOString().slice(0, 10);

  let xml;
  try {
    const antwort = await fetch(`${SEITE}/sitemap-0.xml`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
    xml = await antwort.text();
  } catch (fehler) {
    console.error("Sitemap nicht lesbar:", fehler.message);
    return new Response("Sitemap nicht lesbar", { status: 200 });
  }

  const frisch = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .filter((treffer) => treffer[2].slice(0, 10) === heute)
    .map((treffer) => treffer[1]);

  if (frisch.length === 0) {
    console.log("Kein Beitrag mit heutigem Datum, nichts zu melden.");
    return new Response("nichts neu", { status: 200 });
  }

  /* Die Uebersicht aendert sich mit jedem neuen Beitrag mit. */
  const adressen = [...frisch, `${SEITE}/blog/`];

  try {
    const antwort = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SEITE).hostname,
        key: SCHLUESSEL,
        keyLocation: `${SEITE}/${SCHLUESSEL}.txt`,
        urlList: adressen,
      }),
    });
    console.log(
      `${adressen.length} Adressen an IndexNow gemeldet, Antwort ${antwort.status}: ${adressen.join(", ")}`,
    );
  } catch (fehler) {
    /* Eine fehlgeschlagene Meldung ist kein Grund, den Deploy als kaputt zu
       melden. Der Beitrag ist live, Bing findet ihn dann eben spaeter. */
    console.error("IndexNow nicht erreichbar:", fehler.message);
  }

  return new Response("fertig", { status: 200 });
};
