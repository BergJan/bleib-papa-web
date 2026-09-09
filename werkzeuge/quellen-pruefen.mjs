/**
 * Prüft alle Quellen-URLs der Blogbeiträge und meldet, was nicht erreichbar ist.
 *
 *   node werkzeuge/quellen-pruefen.mjs
 *
 * Gedacht als Kontrolle vor der Veröffentlichung: Eine tote oder erfundene
 * Quelle unter einem Artikel kostet mehr Glaubwürdigkeit, als sie einbringt.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ordner = "src/content/blog";
const urls = new Map();

for (const datei of readdirSync(ordner).filter((d) => d.endsWith(".md"))) {
  const text = readFileSync(path.join(ordner, datei), "utf8");
  for (const m of text.matchAll(/url: "([^"]+)"/g)) {
    const liste = urls.get(m[1]) ?? [];
    liste.push(datei.replace(".md", ""));
    urls.set(m[1], liste);
  }
}

console.log(`${urls.size} verschiedene Quellen-URLs in ${readdirSync(ordner).length} Beiträgen\n`);

const ergebnisse = await Promise.all(
  [...urls.keys()].map(async (u) => {
    try {
      const antwort = await fetch(u, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      return { status: antwort.status, url: u, ziel: antwort.url };
    } catch (fehler) {
      return { status: "FEHLER", url: u, ziel: fehler.message };
    }
  }),
);

/**
 * Wissenschaftsverlage sperren automatische Zugriffe. PubMed antwortet dann
 * mit 203, Taylor & Francis mit 403. Das heisst nicht, dass die Quelle fehlt,
 * nur dass sie sich nicht maschinell pruefen laesst. Solche Adressen muss man
 * einmal von Hand im Browser ansehen, nicht als Fehler behandeln.
 */
const GESPERRT = [203, 403, 401, 429];

const ok = ergebnisse.filter((e) => e.status === 200);
const gesperrt = ergebnisse.filter((e) => GESPERRT.includes(e.status));
const kaputt = ergebnisse.filter((e) => e.status !== 200 && !GESPERRT.includes(e.status));
const umleitung = ok.filter((e) => e.ziel !== e.url);

if (kaputt.length) {
  console.log("NICHT ERREICHBAR:\n");
  for (const e of kaputt) {
    console.log(`  ${e.status}  ${e.url}`);
    console.log(`        in: ${urls.get(e.url).join(", ")}\n`);
  }
}

if (umleitung.length) {
  console.log("UMGELEITET, Adresse besser aktualisieren:\n");
  for (const e of umleitung) {
    console.log(`  ${e.url}\n    nach ${e.ziel}\n`);
  }
}

if (gesperrt.length) {
  console.log("NICHT MASCHINELL PRUEFBAR (Bot-Sperre des Verlags), einmal von Hand ansehen:\n");
  for (const e of gesperrt) console.log(`  ${e.status}  ${e.url}`);
  console.log();
}

console.log(
  `${ok.length} erreichbar, ${gesperrt.length} gesperrt, ${kaputt.length} defekt, ${ergebnisse.length} gesamt.`,
);
process.exit(kaputt.length ? 1 : 0);
