/**
 * TEMPORAER: Listet die Brevo-Vorlagen auf, um zu sehen, welche als
 * DOI-Vorlage gilt. Wird nach der Fehlersuche wieder entfernt.
 * Gibt nur Namen, IDs und Status zurueck, keine Zugangsdaten.
 */
export default async () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return new Response("kein Key", { status: 500 });

  const res = await fetch("https://api.brevo.com/v3/smtp/templates?limit=50&sort=desc", {
    headers: { "api-key": apiKey, accept: "application/json" },
  });
  const data = await res.json();

  const kurz = (data.templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    aktiv: t.isActive,
    doi: t.doiTemplate ?? false,
  }));

  return new Response(JSON.stringify({ anzahl: data.count, templates: kurz }, null, 1), {
    headers: { "Content-Type": "application/json" },
  });
};
