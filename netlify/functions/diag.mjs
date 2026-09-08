/**
 * TEMPORAER: Zeigt die Kontakt-Attribute des Brevo-Kontos und die Werte
 * des Testkontakts. Wird nach der Fehlersuche wieder entfernt.
 */
export default async () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return new Response("kein Key", { status: 500 });
  const h = { "api-key": apiKey, accept: "application/json" };

  const attrRes = await fetch("https://api.brevo.com/v3/contacts/attributes", { headers: h });
  const attrs = await attrRes.json();

  const kontaktRes = await fetch(
    "https://api.brevo.com/v3/contacts/" + encodeURIComponent("office@janphilipberg.com"),
    { headers: h }
  );
  const kontakt = kontaktRes.ok ? await kontaktRes.json() : { fehler: kontaktRes.status };

  return new Response(
    JSON.stringify(
      {
        attribute: (attrs.attributes ?? [])
          .filter((a) => a.category === "normal")
          .map((a) => ({ name: a.name, typ: a.type })),
        testkontakt: {
          email: kontakt.email,
          attribute: kontakt.attributes,
          listen: kontakt.listIds,
          doiBestaetigt: kontakt.doubleOptinConfirmed ?? null,
        },
      },
      null,
      1
    ),
    { headers: { "Content-Type": "application/json" } }
  );
};
