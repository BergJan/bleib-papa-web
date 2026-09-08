/**
 * TEMPORAER: Probiert eine uebergebene templateId gegen den DOI-Endpunkt.
 * Aufruf: /.netlify/functions/diag?doi=7
 * Wird nach der Fehlersuche wieder entfernt.
 */
export default async (req) => {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey) return new Response("kein Key", { status: 500 });

  const url = new URL(req.url);
  const templateId = Number(url.searchParams.get("doi") || 0);
  const email = url.searchParams.get("mail") || "office@janphilipberg.com";
  if (!templateId) return new Response("doi-Parameter fehlt", { status: 400 });

  const res = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      email,
      attributes: { VORNAME: "Jan", QUELLE: "diagnose" },
      includeListIds: [listId],
      templateId,
      redirectionUrl: "https://bleibpapa.de/guide/",
    }),
  });

  const text = await res.text();
  return new Response(JSON.stringify({ templateId, status: res.status, antwort: text }, null, 1), {
    headers: { "Content-Type": "application/json" },
  });
};
