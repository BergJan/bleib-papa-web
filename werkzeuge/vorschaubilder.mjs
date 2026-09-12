/**
 * Erzeugt kleine Vorschaubilder fuer die Randspalte und die Blogliste.
 *
 *   node werkzeuge/vorschaubilder.mjs          nur fehlende
 *   node werkzeuge/vorschaubilder.mjs --alle   alle neu
 *
 * Warum ueberhaupt: Die Beitragsbilder sind 1600 px breit und rund 170 KB.
 * In einer 280 px schmalen Randspalte werden davon 72 px angezeigt. Fuenf
 * davon waeren fast ein Megabyte fuer eine Linkliste, und das faellt in den
 * Core Web Vitals auf. Ein Vorschaubild wiegt rund ein Zwanzigstel.
 *
 * Ablage: public/uploads/vorschau/<slug>.jpg, unabhaengig davon, wo das
 * grosse Bild liegt. Manche Beitraege zeigen auf /assets/, die meisten auf
 * /uploads/. Der Slug ist der verlaessliche Schluessel, der Pfad nicht.
 *
 * Auf diesem Rechner gibt es kein ImageMagick, deshalb macht System.Drawing
 * aus PowerShell die Arbeit, wie schon im Artikel-Importer.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

/** Doppelte Anzeigebreite, damit es auf scharfen Bildschirmen nicht matscht. */
export const VORSCHAU_BREITE = 200;
export const VORSCHAU_ORDNER = path.join("public", "uploads", "vorschau");

/** Verkleinert ein Bild auf Vorschaugroesse und schneidet es auf 16:9. */
export function vorschauErzeugen(quelle, slug) {
  mkdirSync(VORSCHAU_ORDNER, { recursive: true });
  const ziel = path.join(VORSCHAU_ORDNER, `${slug}.jpg`);
  const hoehe = Math.round((VORSCHAU_BREITE / 16) * 9);

  /* Mittiger Ausschnitt statt Verzerrung: Nicht jedes Bild ist 16:9, das
     Bild vom 30.09. war zum Beispiel mal 4:3. */
  const skript = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${path.resolve(quelle).replace(/'/g, "''")}')
$zielB = ${VORSCHAU_BREITE}; $zielH = ${hoehe}
$faktor = [Math]::Max($zielB / $img.Width, $zielH / $img.Height)
$neuB = [int][Math]::Ceiling($img.Width * $faktor); $neuH = [int][Math]::Ceiling($img.Height * $faktor)
$x = [int](($zielB - $neuB) / 2); $y = [int](($zielH - $neuH) / 2)
$bmp = New-Object System.Drawing.Bitmap($zielB, $zielH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'; $g.PixelOffsetMode='HighQuality'
$g.DrawImage($img, $x, $y, $neuB, $neuH)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 78L)
$g.Dispose(); $bmp.Save('${path.resolve(ziel).replace(/'/g, "''")}', $codec, $ep)
$bmp.Dispose(); $img.Dispose()
`;
  execFileSync("powershell", ["-NoProfile", "-Command", skript], { encoding: "utf8" });
  return { pfad: `/uploads/vorschau/${slug}.jpg`, groesse: readFileSync(ziel).length };
}

/* ------------------------------------------------------------------ Lauf */

if (process.argv[1] && path.resolve(process.argv[1]).endsWith("vorschaubilder.mjs")) {
  const alle = process.argv.includes("--alle");
  const ordner = "src/content/blog";
  let gemacht = 0;
  let gesamt = 0;

  for (const datei of readdirSync(ordner).filter((d) => d.endsWith(".md"))) {
    const slug = datei.replace(/\.md$/, "");
    const treffer = readFileSync(path.join(ordner, datei), "utf8").match(/^bild:\s*"?([^"\n]+)"?/m);
    if (!treffer) {
      console.log(`  ${slug}: kein Bild im Frontmatter, uebersprungen`);
      continue;
    }

    const quelle = path.join("public", treffer[1].replace(/^\//, ""));
    if (!existsSync(quelle)) {
      console.log(`  ${slug}: ${treffer[1]} nicht gefunden, uebersprungen`);
      continue;
    }
    if (!alle && existsSync(path.join(VORSCHAU_ORDNER, `${slug}.jpg`))) continue;

    const { groesse } = vorschauErzeugen(quelle, slug);
    gemacht++;
    gesamt += groesse;
    console.log(`  ${slug}.jpg  ${Math.round(groesse / 1024)} KB`);
  }

  console.log(
    gemacht
      ? `\n${gemacht} Vorschaubilder erzeugt, zusammen ${Math.round(gesamt / 1024)} KB.`
      : "\nAlle Vorschaubilder waren schon da.",
  );
}
