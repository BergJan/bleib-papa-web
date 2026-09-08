/**
 * Nimmt das Opt-in der Landingpage entgegen und legt den Kontakt bei Brevo an.
 *
 * Der Brevo-API-Key liegt als Umgebungsvariable in Netlify und taucht dadurch
 * nirgends im Quelltext der Website auf.
 *
 * Benötigte Variablen (Netlify: Site configuration -> Environment variables):
 *   BREVO_API_KEY          Pflicht. Brevo -> SMTP & API -> API-Schlüssel
 *   BREVO_LIST_ID          Pflicht. ID der Kontaktliste, z. B. 3
 *   BREVO_DOI_TEMPLATE_ID  Optional. ID der Double-Opt-in-Vorlage.
 *                          Ist sie gesetzt, verschickt Brevo die Bestätigungsmail.
 *   BREVO_DOI_REDIRECT     Optional. Wohin nach dem Klick auf den Bestätigungslink.
 */

const MAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "bad_json" });
  }

  const vorname = String(payload?.vorname ?? "").trim().slice(0, 80);
  const email = String(payload?.email ?? "").trim().toLowerCase().slice(0, 160);
  const quelle = String(payload?.quelle ?? "website").trim().slice(0, 80);

  if (vorname.length < 2) return json(400, { error: "vorname_fehlt" });
  if (!MAIL.test(email)) return json(400, { error: "email_ungueltig" });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID || 0);
  const redirect = process.env.BREVO_DOI_REDIRECT || "";

  if (!apiKey || !listId) {
    console.error("[optin] BREVO_API_KEY oder BREVO_LIST_ID fehlt.");
    return json(500, { error: "nicht_konfiguriert" });
  }

  const attributes = { VORNAME: vorname, QUELLE: quelle };
  const useDoi = templateId > 0 && redirect;

  const endpoint = useDoi
    ? "https://api.brevo.com/v3/contacts/doubleOptinConfirmation"
    : "https://api.brevo.com/v3/contacts";

  const body = useDoi
    ? {
        email,
        attributes,
        includeListIds: [listId],
        templateId,
        redirectionUrl: redirect,
      }
    : {
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true,
      };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    /* Brevo antwortet 204 (DOI verschickt) oder 201 (Kontakt angelegt). */
    if (res.ok) return json(200, { ok: true });

    const detail = await res.text();

    /* Kontakt existiert bereits: für den Nutzer kein Fehler. */
    if (res.status === 400 && detail.includes("duplicate_parameter")) {
      return json(200, { ok: true, bereits_eingetragen: true });
    }

    console.error(`[optin] Brevo ${res.status}: ${detail}`);
    /* Brevos technische Meldung wird mitgeschickt: Sie enthaelt keine Zugangsdaten
       und hilft bei der Fehlersuche. Der Besucher sieht sie nicht, das Formular
       zeigt ihm eine allgemeine Meldung. */
    return json(502, {
      error: "versand_fehlgeschlagen",
      brevo_status: res.status,
      brevo_detail: detail.slice(0, 400),
    });
  } catch (err) {
    console.error("[optin] Netzwerkfehler:", err);
    return json(502, { error: "versand_fehlgeschlagen" });
  }
};
