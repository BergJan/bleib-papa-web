import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

/**
 * Termine der geplanten Beiträge, nur die Daten, keine Titel.
 *
 * Die nächtliche Netlify-Funktion liest diese Liste und stößt einen neuen Build
 * nur dann an, wenn wirklich ein Beitrag fällig ist. So kostet die Automatik
 * an den meisten Tagen keinen Build.
 *
 * Absichtlich ohne Titel und Texte: Über einen unveröffentlichten Beitrag soll
 * hier nichts stehen außer dem Tag, an dem er erscheinen soll.
 */
export const GET: APIRoute = async () => {
  /* Nur Beitraege, deren Tag noch bevorsteht. Ein Beitrag behaelt den Status
     "geplant" auch nach dem Erscheinen, denn niemand schreibt ihn um. Ohne den
     Datumsfilter bliebe er deshalb fuer immer in der Liste, die naechtliche
     Funktion faende jede Nacht etwas "Faelliges" und wuerde taeglich einen
     Build anstossen. */
  const jetzt = Date.now();
  const alle = await getCollection("blog");
  const termine = alle
    .filter((p) => p.data.status === "geplant" && p.data.datum.getTime() > jetzt)
    .map((p) => p.data.datum.toISOString().slice(0, 10))
    .sort();

  return new Response(JSON.stringify({ termine }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
};
