// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Muss zur Domain in src/site.ts passen.
const SITE_URL = "https://bleibpapa.de";

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    sitemap({
      // Rechtsseiten und Danke-Seite gehören nicht in die Sitemap.
      filter: (page) =>
        !page.includes("/danke") && !page.includes("/impressum") && !page.includes("/datenschutz"),
    }),
  ],
});
