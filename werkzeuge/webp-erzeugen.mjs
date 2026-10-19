/**
 * Erzeugt WebP-Fassungen der Bilder in public/assets.
 *
 *   node werkzeuge/webp-erzeugen.mjs            alle
 *   node werkzeuge/webp-erzeugen.mjs jan-portrait.jpg szene-kalender.jpg
 *
 * Die JPG-Dateien bleiben liegen: Im Markup steht ein <picture> mit WebP
 * zuerst und dem JPG als Rueckfall. So sieht auch ein alter Browser etwas.
 *
 * sharp steckt ohnehin in Astro, ein zusaetzliches Paket braucht es nicht.
 */

import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ordner = path.join("public", "assets");

const dateien = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(ordner).filter((d) => /\.jpe?g$/i.test(d));

const kb = (p) => Math.round(statSync(p).size / 1024);

let vorher = 0;
let nachher = 0;

for (const datei of dateien) {
  const quelle = path.join(ordner, datei);
  const ziel = quelle.replace(/\.jpe?g$/i, ".webp");

  /* Qualitaet 78 trifft bei diesen Fotos den Punkt, an dem man den
     Unterschied nicht mehr sieht, die Datei aber deutlich kleiner wird. */
  await sharp(quelle).webp({ quality: 78, effort: 6 }).toFile(ziel);

  vorher += statSync(quelle).size;
  nachher += statSync(ziel).size;
  console.log(
    `${datei.padEnd(30)} ${String(kb(quelle)).padStart(4)} KB  ->  ${String(kb(ziel)).padStart(4)} KB`,
  );
}

console.log(
  `\nGesamt ${Math.round(vorher / 1024)} KB  ->  ${Math.round(nachher / 1024)} KB ` +
    `(${Math.round((1 - nachher / vorher) * 100)} Prozent weniger)`,
);
