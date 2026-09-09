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

  /**
   * Tracking. Solange beide Felder leer sind, wird nichts geladen und es
   * erscheint kein Einwilligungsbanner. Sobald eine ID eingetragen ist,
   * erscheint das Banner und das jeweilige Werkzeug wird erst nach
   * ausdrücklicher Zustimmung geladen.
   */
  tracking: {
    /* Meta-Pixel-ID (Events Manager) und GA4-Mess-ID (Format G-XXXXXXX).
       Sobald hier etwas steht, wird es nach Zustimmung wirklich geladen. */
    metaPixelId: "1059550730286880",
    ga4Id: "G-1P7LX41Z6D",

    /* Zeigt die Einwilligungs-Variante des Banners auch dann, wenn oben noch
       keine IDs stehen. So bleibt die Seite optisch unveraendert, wenn das
       Tracking spaeter scharf geschaltet wird. */
    bannerImmerZeigen: true,
  },

  /** Impressumsangaben – bitte prüfen und ergänzen. */
  betreiber: {
    name: "Jan Philip Berg",
    strasse: "Am Vogelsang 13d",
    plz: "57076",
    ort: "Siegen",
    email: "hallo@bleibpapa.de",
    telefon: "+49 151 241 81 247",
    ustId: "",
  },
} as const;
