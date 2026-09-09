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
   * Checkout des 66-Tage-Programms (Digistore24, Copecart, elopage, Stripe ...).
   * Solange leer, springen die Kaufbuttons zum Preisblock auf der Seite.
   */
  checkoutUrl: "",

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

  /**
   * Standard-Aufruf am Ende jedes Blogbeitrags.
   * Einmal hier gepflegt, gilt er ueberall. Einzelne Beitraege koennen
   * ihn im Redaktionssystem ueberschreiben oder ganz abschalten.
   */
  blogCta: {
    ueberschrift: "Der kostenlose Guide",
    text:
      "21 einfache Wege, wie du eure Verbindung auch zwischen euren gemeinsamen Tagen " +
      "stärkst. Kostenlos als PDF, direkt per E-Mail.",
    buttonText: "21 Wege ansehen",
    /* Kuerzere Fassung fuer den Einschub mitten im Artikel. */
    kurztext:
      "21 einfache Wege, wie du eure Verbindung auch zwischen euren gemeinsamen " +
      "Tagen stärkst. Kostenlos als PDF.",
    buttonUrl: "/",
    bild: "/assets/guide-mockup.jpg",
    bildAlt:
      "Der kostenlose Guide „21 Wege, deinem Kind nach der Trennung nah zu bleiben“ von BLEIB PAPA, " +
      "aufgeschlagen mit mehreren Innenseiten.",
  },

  /** Logo fuer strukturierte Daten (schema.org Publisher). */
  logo: "/icon-512.png",

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
