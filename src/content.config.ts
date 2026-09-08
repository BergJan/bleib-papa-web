import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Blogartikel liegen als Markdown-Dateien in src/content/blog/.
 * Die Felder hier müssen zu den Feldern in public/admin/config.yml passen.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    titel: z.string(),
    beschreibung: z.string(),
    datum: z.coerce.date(),
    bild: z.string().optional(),
    bildAlt: z.string().optional(),
    entwurf: z.boolean().default(false),
  }),
});

export const collections = { blog };
