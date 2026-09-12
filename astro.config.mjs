// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync, readdirSync } from "node:fs";

// Muss zur Domain in src/site.ts passen.
const SITE_URL = "https://bleibpapa.de";

/**
 * Erscheinungstag je Blogbeitrag, gelesen aus dem Frontmatter.
 *
 * Google nutzt lastmod als Hinweis darauf, wann sich eine Seite zuletzt
 * geaendert hat, und crawlt frische Seiten eher nach. Bei einem Blog, der
 * taeglich einen Beitrag veroeffentlicht, ist das der Unterschied zwischen
 * "in ein paar Tagen im Index" und "irgendwann".
 */
function blogDaten() {
  const karte = new Map();
  for (const datei of readdirSync("src/content/blog").filter((d) => d.endsWith(".md"))) {
    const treffer = readFileSync(`src/content/blog/${datei}`, "utf8").match(/^datum:\s*(\d{4}-\d{2}-\d{2})/m);
    if (treffer) karte.set(`/blog/${datei.replace(/\.md$/, "")}/`, treffer[1]);
  }
  return karte;
}

const daten = blogDaten();

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    sitemap({
      // Rechtsseiten sowie Danke- und Download-Seite gehören nicht in die Sitemap.
      filter: (page) =>
        !["/danke", "/guide", "/impressum", "/datenschutz", "/agb", "/widerruf"].some((p) => page.includes(p)),
      serialize(eintrag) {
        const pfad = new URL(eintrag.url).pathname;
        const datum = daten.get(pfad);
        if (datum) eintrag.lastmod = new Date(`${datum}T06:00:00Z`).toISOString();
        return eintrag;
      },
    }),
  ],
});
