/**
 * Setzt zwei Workbook-Seiten zu einer Doppelseite zusammen.
 *
 *   node werkzeuge/doppelseite-bauen.mjs <links.png> <rechts.png> <ziel-ohne-endung>
 *
 * Beide Seiten werden auf dieselbe Höhe gebracht und ohne Abstand
 * nebeneinandergesetzt, so wie sie im aufgeschlagenen Heft liegen. In die
 * Mitte kommt ein Bundschatten: ohne ihn sähe es aus wie zwei Bilder
 * nebeneinander, mit ihm wie ein aufgeschlagenes Buch.
 *
 * Der Schlagschatten kommt nicht ins Bild, den setzt das CSS. So bleibt er
 * scharf und lässt sich am Seitenhintergrund ausrichten.
 */

import sharp from "sharp";

const [links, rechts, ziel] = process.argv.slice(2);
if (!links || !rechts || !ziel) {
  console.error("Aufruf: node werkzeuge/doppelseite-bauen.mjs <links> <rechts> <ziel>");
  process.exit(1);
}

const HOEHE = 830;
/* Der Bund ist so breit wie gut drei Prozent einer Seite. Mehr wirkt wie eine
   Klebebindung, die auseinanderfällt. */
const BUND = 46;

const aufHoehe = async (datei) => {
  const bild = sharp(datei).resize({ height: HOEHE });
  const puffer = await bild.png().toBuffer();
  const { width, height } = await sharp(puffer).metadata();
  return { puffer, width, height };
};

const a = await aufHoehe(links);
const b = await aufHoehe(rechts);

const breite = a.width + b.width;

/* Zwei weiche Verläufe, die vom Bund nach außen heller werden. */
const bundSchatten = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BUND * 2}" height="${HOEHE}">
     <defs>
       <linearGradient id="g" x1="0" x2="1">
         <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
         <stop offset="42%"  stop-color="#000" stop-opacity="0.13"/>
         <stop offset="50%"  stop-color="#000" stop-opacity="0.26"/>
         <stop offset="58%"  stop-color="#000" stop-opacity="0.13"/>
         <stop offset="100%" stop-color="#000" stop-opacity="0"/>
       </linearGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#g)"/>
   </svg>`,
);

const zusammengesetzt = sharp({
  create: {
    width: breite,
    height: HOEHE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
}).composite([
  { input: a.puffer, left: 0, top: 0 },
  { input: b.puffer, left: a.width, top: 0 },
  { input: bundSchatten, left: a.width - BUND, top: 0 },
]);

const roh = await zusammengesetzt.png().toBuffer();

await sharp(roh).webp({ quality: 86, effort: 6 }).toFile(`${ziel}.webp`);
/* JPG kennt keine Transparenz, deshalb auf dem Cremeton der Seite. */
await sharp(roh)
  .flatten({ background: "#FBF7F1" })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(`${ziel}.jpg`);

const { statSync } = await import("node:fs");
console.log(
  `${ziel}  ${breite} x ${HOEHE}  ` +
    `webp ${Math.round(statSync(`${ziel}.webp`).size / 1024)} KB, ` +
    `jpg ${Math.round(statSync(`${ziel}.jpg`).size / 1024)} KB`,
);
