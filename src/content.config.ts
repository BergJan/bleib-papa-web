import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Blogartikel liegen als Markdown-Dateien in src/content/blog/,
 * Autorenprofile in src/content/autoren/.
 *
 * Die Felder hier muessen zu den Feldern in public/admin/config.yml passen.
 * Aufbau nach drei Ebenen getrennt:
 *   - sichtbar im Artikel   (titel, teaser, quickAnswer, faq, cta, quellen, Bilder)
 *   - unsichtbar im HTML    (seo: Titel, Description, Canonical, Robots, Schema)
 *   - nur fuer die Redaktion (redaktion: Suchintention, Zielgruppe, Angle ...)
 */

/** Ein Beitrag erscheint nur, wenn der Status das hergibt. */
export const STATUS = ["entwurf", "pruefung", "geplant", "veroeffentlicht", "archiviert"] as const;

export const QUELLENARTEN = [
  "primaerquelle",
  "behoerde",
  "studie",
  "fachverband",
  "fachpublikation",
  "unternehmensquelle",
  "sekundaerquelle",
  "community",
  "sonstige",
] as const;

export const SUCHINTENTIONEN = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
] as const;

/**
 * Datumsfeld, das beide Schreibweisen versteht.
 *
 * Das Redaktionssystem speichert jetzt JJJJ-MM-TT. Aeltere Beitraege koennen
 * noch TT.MM.JJJJ enthalten, und das versteht JavaScript nicht: aus "01.02.2026"
 * wird der 2. Januar, aus "25.12.2026" gar nichts. Deshalb wird die deutsche
 * Schreibweise hier vorher umgedreht.
 */
const datumsfeld = z.preprocess((wert) => {
  if (typeof wert === "string") {
    const deutsch = wert.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (deutsch) {
      const [, tag, monat, jahr] = deutsch;
      return `${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}`;
    }
  }
  return wert;
}, z.coerce.date());

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    /* ---------- Inhalt ----------
       Nichts ist Pflicht. Ein halb ausgefuellter Entwurf soll sich speichern
       lassen, ohne dass der Seitenaufbau daran scheitert. */
    titel: z.string().default(""),
    /** Ueberschreibt den Dateinamen als URL. Leer lassen = Dateiname. */
    slug: z.string().optional(),
    teaser: z.string().default(""),
    /** Kurze Antwort auf die Hauptfrage. Steht sichtbar ganz oben im Artikel. */
    quickAnswer: z.string().optional(),

    faq: z
      .array(
        z.object({
          frage: z.string().default(""),
          antwort: z.string().default(""),
        }),
      )
      .default([]),

    cta: z
      .object({
        aktiv: z.boolean().default(true),
        ueberschrift: z.string().optional(),
        text: z.string().optional(),
        buttonText: z.string().optional(),
        buttonUrl: z.string().optional(),
      })
      .optional(),

    /** Einschub mitten im Text: "auto", "aus" oder die Nummer einer Zwischenueberschrift. */
    ctaImText: z.string().default("auto"),

    /* ---------- Quellen ---------- */
    quellen: z
      .array(
        z.object({
          name: z.string().default(""),
          titel: z.string().optional(),
          url: z.string().optional(),
          art: z.enum(QUELLENARTEN).catch("sonstige").default("sonstige"),
          abgerufen: datumsfeld.optional(),
          /** Nur intern. Erscheint nicht auf der Website. */
          verwendung: z.string().optional(),
        }),
      )
      .default([]),

    /* ---------- Bilder ---------- */
    bild: z.string().optional(),
    bildAlt: z.string().optional(),
    bildUnterschrift: z.string().optional(),
    bildQuelle: z.string().optional(),
    /** Eigenes Bild fuers Teilen. Leer = Beitragsbild. */
    ogBild: z.string().optional(),

    /* ---------- SEO (unsichtbar im HTML) ---------- */
    seo: z
      .object({
        titel: z.string().optional(),
        beschreibung: z.string().optional(),
        /** Nur intern, rein zur Organisation. */
        fokus: z.string().optional(),
        /** Leer = eigene Artikel-URL. */
        canonical: z.string().optional(),
        robots: z
          .enum(["index, follow", "noindex, follow", "noindex, nofollow"])
          .default("index, follow"),
        /** Notausgang fuer Sonderfaelle: ersetzt das erzeugte JSON-LD. */
        schemaManuell: z.string().optional(),
      })
      .default({}),

    /* ---------- Nur fuer die Redaktion ---------- */
    redaktion: z
      .object({
        suchintention: z.enum(SUCHINTENTIONEN).optional(),
        zielgruppe: z.string().optional(),
        nutzerproblem: z.string().optional(),
        ergebnis: z.string().optional(),
        angle: z.string().optional(),
        entitaeten: z.array(z.string()).default([]),
      })
      .default({}),

    /* ---------- Veroeffentlichung ---------- */
    status: z.enum(STATUS).default("entwurf"),
    datum: datumsfeld.default(() => new Date()),
    aktualisiert: datumsfeld.optional(),
    aktualisiertZeigen: z.boolean().default(false),
    /** Dateiname eines Profils aus src/content/autoren/, ohne .md */
    autor: z.string().default("jan-philip-berg"),
  }),
});

const autoren = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/autoren" }),
  schema: z.object({
    name: z.string().default(""),
    rolle: z.string().optional(),
    kurzvita: z.string().default(""),
    expertise: z.array(z.string()).default([]),
    foto: z.string().optional(),
    /** Externe Profilseite, z. B. LinkedIn. */
    profil: z.string().optional(),
  }),
});

export const collections = { blog, autoren };
