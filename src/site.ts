/**
 * Zentrale Projektdaten.
 * Alles, was an mehreren Stellen auftaucht, steht hier einmal.
 */
export const SITE = {
  /** Domain ohne Slash am Ende. Wird für Canonical-URLs und die Sitemap gebraucht. */
  url: "https://bleibpapa.de",
  name: "BLEIB PAPA.",
  claim: "Für die Beziehung zwischen Vater und Kind.",

  /** Ziel nach erfolgreichem Opt-in. */
  dankeUrl: "/danke/",

  /** Endpunkt der Netlify-Funktion, die den Kontakt an Brevo übergibt. */
  optinEndpoint: "/.netlify/functions/optin",

  /** Impressumsangaben – bitte prüfen und ergänzen. */
  betreiber: {
    name: "Jan Philip Berg",
    strasse: "",
    plz: "",
    ort: "",
    email: "hallo@bleibpapa.de",
    telefon: "",
    ustId: "",
  },
} as const;
