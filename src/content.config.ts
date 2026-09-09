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

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    /* ---------- Inhalt ---------- */
    titel: z.string(),
    /** Ueberschreibt den Dateinamen als URL. Leer lassen = Dateiname. */
    slug: z.string().optional(),
    teaser: z.string(),
    /** Kurze Antwort auf die Hauptfrage. Steht sichtbar ganz oben im Artikel. */
    quickAnswer: z.string().optional(),

    faq: z
      .array(
        z.object({
          frage: z.string(),
          antwort: z.string(),
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

    /* ---------- Quellen ---------- */
    quellen: z
      .array(
        z.object({
          name: z.string(),
          titel: z.string().optional(),
          url: z.string().optional(),
          art: z.enum(QUELLENARTEN).default("sonstige"),
          abgerufen: z.coerce.date().optional(),
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
    datum: z.coerce.date(),
    aktualisiert: z.coerce.date().optional(),
    aktualisiertZeigen: z.boolean().default(false),
    /** Dateiname eines Profils aus src/content/autoren/, ohne .md */
    autor: z.string().default("jan-philip-berg"),
  }),
});

const autoren = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/autoren" }),
  schema: z.object({
    name: z.string(),
    rolle: z.string().optional(),
    kurzvita: z.string(),
    expertise: z.array(z.string()).default([]),
    foto: z.string().optional(),
    /** Externe Profilseite, z. B. LinkedIn. */
    profil: z.string().optional(),
  }),
});

export const collections = { blog, autoren };
