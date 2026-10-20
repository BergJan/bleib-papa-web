/**
 * Macht aus brevo/email-strecke.md sieben Textdateien zum Einfügen in Brevo.
 *
 *   node werkzeuge/mails-aufbereiten.mjs
 *
 * Im Markdown stehen die Mails als Zitatblöcke mit Markdown-Auszeichnung. In
 * Brevos Einfachem Editor braucht man reinen Text, die Links setzt man dort von
 * Hand auf einzelne Wörter. Deshalb erzeugt dieses Werkzeug je Mail:
 *
 *   - den Betreff und den Vorschautext zum Abtippen
 *   - den Fließtext ohne Markdown, zum Markieren und Kopieren
 *   - darunter die Linkziele und die fett zu setzenden Stellen
 *
 * Quelle bleibt die Markdown-Datei. Ändert sich dort ein Text, einfach erneut
 * laufen lassen.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const quelle = path.join("brevo", "email-strecke.md");
const ordner = path.join("brevo", "mails");
mkdirSync(ordner, { recursive: true });

const md = readFileSync(quelle, "utf8").replace(/\r\n/g, "\n");

/* Dateinamen je Mailnummer, damit die Reihenfolge im Ordner stimmt. */
const namen = [
  "01-guide",
  "02-der-satz",
  "03-einfluss",
  "04-event-papa",
  "05-zwoelf-tage",
  "06-einwaende",
  "07-entscheidung",
];

const bloecke = md.split(/^## Mail (\d+) · Tag (\d+)$/m).slice(1);
let gezaehlt = 0;

for (let i = 0; i < bloecke.length; i += 3) {
  const nr = Number(bloecke[i]);
  const tag = bloecke[i + 1];
  const roh = bloecke[i + 2];

  const betreff = roh.match(/^\*\*Betreff:\*\* (.+)$/m)?.[1]?.trim() ?? "";
  const vorschau = roh.match(/^\*\*Vorschautext:\*\* (.+)$/m)?.[1]?.trim() ?? "";

  /* Nur die Zeilen des Zitatblocks sind der Mailtext. */
  const zeilen = roh
    .split("\n")
    .filter((z) => z.startsWith(">"))
    .map((z) => z.replace(/^>\s?/, ""));

  const links = [];
  const fett = [];

  const text = zeilen
    .join("\n")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, url) => {
      links.push({ text: t, url });
      return t;
    })
    .replace(/\*\*([^*]+)\*\*/g, (_, t) => {
      fett.push(t.replace(/\s+/g, " ").trim());
      return t;
    })
    /* Zeilenumbrüche des Markdowns sind Satzumbrüche, keine Absätze. */
    .split(/\n\s*\n/)
    .map((absatz) => absatz.replace(/\n/g, " ").replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  const teile = [
    `MAIL ${nr} · versendet an Tag ${tag}`,
    "",
    "=== BETREFF ===",
    betreff,
    "",
    "=== VORSCHAUTEXT ===",
    vorschau,
    "",
    "=== TEXT · ab hier bis zur nächsten Linie kopieren ===",
    "",
    text,
    "",
    "=== ENDE TEXT ===",
  ];

  if (links.length) {
    teile.push("", "=== LINKS, in Brevo von Hand setzen ===");
    for (const l of links) teile.push(`„${l.text}"`, `   ${l.url}`);
  }
  if (fett.length) {
    teile.push("", "=== FETT SETZEN ===");
    for (const f of fett) teile.push(`• ${f}`);
  }

  const datei = path.join(ordner, `${namen[nr - 1]}.txt`);
  writeFileSync(datei, teile.join("\n") + "\n", "utf8");
  console.log(`${datei}  (${text.length} Zeichen Text, ${links.length} Links, ${fett.length} fett)`);
  gezaehlt++;
}

console.log(`\n${gezaehlt} Mails aufbereitet.`);
