/**
 * Veröffentlicht geplante Beiträge von selbst.
 *
 * Läuft jede Nacht, liest die Terminliste unter /geplant.json und stößt nur
 * dann einen neuen Build an, wenn ein Beitrag fällig ist. An Tagen ohne
 * fälligen Beitrag passiert nichts, das spart Netlify-Credits.
 *
 * Benötigte Variable (Netlify: Site configuration -> Environment variables):
 *   BUILD_HOOK_URL   Die Adresse aus Build & deploy -> Build hooks.
 *                    Fehlt sie, tut die Funktion nichts und meldet das nur
 *                    im Protokoll.
 */

const SEITE = "https://bleibpapa.de";

export default async () => {
  const hook = process.env.BUILD_HOOK_URL;
  if (!hook) {
    console.log("Kein BUILD_HOOK_URL hinterlegt. Es wird nichts angestossen.");
    return new Response("kein Build-Hook", { status: 200 });
  }

  let termine = [];
  try {
    const antwort = await fetch(`${SEITE}/geplant.json`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
    ({ termine } = await antwort.json());
  } catch (fehler) {
    console.error("Terminliste nicht lesbar:", fehler.message);
    return new Response("Terminliste nicht lesbar", { status: 200 });
  }

  /* Bis Mitternacht des heutigen Tages, damit ein Beitrag am gesetzten Tag
     erscheint und nicht erst am Tag danach. */
  const heute = new Date().toISOString().slice(0, 10);
  const faellig = termine.filter((t) => t <= heute);

  if (faellig.length === 0) {
    console.log(`Nichts faellig. Offene Termine: ${termine.join(", ") || "keine"}`);
    return new Response("nichts faellig", { status: 200 });
  }

  const bauen = await fetch(hook, { method: "POST" });
  console.log(
    `${faellig.length} Beitrag/Beitraege faellig (${faellig.join(", ")}). ` +
      `Build angestossen, Antwort ${bauen.status}.`,
  );

  return new Response("Build angestossen", { status: 200 });
};

/* Jede Nacht um 4:30 Uhr UTC, also 5:30 oder 6:30 Uhr deutscher Zeit. */
export const config = { schedule: "30 4 * * *" };
