/**
 * Wandelt einen fertigen Artikel aus dem Ordner BLEIB-PAPA-Artikel in einen
 * Blogbeitrag um.
 *
 *   node werkzeuge/artikel-import.mjs "<Pfad zur Datei>" [--datum 15.09.2026]
 *
 * Versteht .docx, .md und .txt im vereinbarten Blockformat:
 *   Feldzeilen (TITEL:, SLUG: ...), dann === TEXT ===, === FAQ ===,
 *   === QUELLEN === und === NOTIZEN ===.
 *
 * Aus .docx werden Ueberschriften anhand der Word-Formatvorlagen erkannt
 * (Heading2, Heading3), nicht anhand des Textes. Genau daran ist der erste
 * Artikel gescheitert: Beim Einfuegen ins Redaktionssystem gingen die
 * Ueberschriften verloren und standen als "H2: ..." im Fliesstext.
 *
 * Der Block NOTIZEN ist rein redaktionell und wird nicht uebernommen.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import path from "node:path";

/* ------------------------------------------------------------------ ZIP */

/** Liest eine einzelne Datei aus einem ZIP-Archiv, ohne Fremdpaket. */
function ausZip(archiv, name) {
  const eocd = archiv.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Keine gueltige ZIP-Datei.");
  let zeiger = archiv.readUInt32LE(eocd + 16);
  const anzahl = archiv.readUInt16LE(eocd + 10);

  for (let i = 0; i < anzahl; i++) {
    const nameLaenge = archiv.readUInt16LE(zeiger + 28);
    const extraLaenge = archiv.readUInt16LE(zeiger + 30);
    const kommentarLaenge = archiv.readUInt16LE(zeiger + 32);
    const eintrag = archiv.toString("utf8", zeiger + 46, zeiger + 46 + nameLaenge);

    if (eintrag === name) {
      const methode = archiv.readUInt16LE(zeiger + 10);
      const groesse = archiv.readUInt32LE(zeiger + 20);
      const start = archiv.readUInt32LE(zeiger + 42);
      const lokalName = archiv.readUInt16LE(start + 26);
      const lokalExtra = archiv.readUInt16LE(start + 28);
      const daten = archiv.subarray(
        start + 30 + lokalName + lokalExtra,
        start + 30 + lokalName + lokalExtra + groesse,
      );
      return methode === 8 ? inflateRawSync(daten).toString("utf8") : daten.toString("utf8");
    }
    zeiger += 46 + nameLaenge + extraLaenge + kommentarLaenge;
  }
  throw new Error(`${name} nicht im Archiv gefunden.`);
}

/* ----------------------------------------------------------------- DOCX */

const entschaerfen = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");

function docxAlsText(pfad) {
  const archiv = readFileSync(pfad);
  const dokument = ausZip(archiv, "word/document.xml");

  /* Ziele der Hyperlinks stehen in einer eigenen Datei. */
  const ziele = new Map();
  try {
    for (const m of ausZip(archiv, "word/_rels/document.xml.rels").matchAll(
      /Id="([^"]+)"[^>]*Target="([^"]+)"/g,
    )) {
      ziele.set(m[1], entschaerfen(m[2]));
    }
  } catch {
    /* Ohne Links ist die Datei trotzdem brauchbar. */
  }

  const zeilen = [];
  for (const absatz of dokument.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []) {
    const stil = absatz.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? "";
    const liste = absatz.includes("<w:numPr>");

    let text = "";
    /* Laeufe und Hyperlinks in Dokumentreihenfolge durchgehen. */
    for (const teil of absatz.match(/<w:hyperlink[\s\S]*?<\/w:hyperlink>|<w:r[ >][\s\S]*?<\/w:r>/g) ?? []) {
      let inhalt = "";
      for (const t of teil.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/g) ?? []) {
        if (t.startsWith("<w:tab")) inhalt += " ";
        else if (t.startsWith("<w:br")) inhalt += "\n";
        else inhalt += entschaerfen(t.replace(/<[^>]+>/g, ""));
      }
      if (!inhalt) continue;

      if (teil.startsWith("<w:hyperlink")) {
        const id = teil.match(/r:id="([^"]+)"/)?.[1];
        const ziel = id ? ziele.get(id) : null;
        text += ziel ? `[${inhalt}](${ziel})` : inhalt;
      } else if (/<w:rPr>[\s\S]*?<w:b\/>/.test(teil) && inhalt.trim()) {
        text += `**${inhalt}**`;
      } else {
        text += inhalt;
      }
    }

    text = text.trim();
    if (stil === "Heading2") zeilen.push({ art: "h2", text: `## ${text}` });
    else if (stil.startsWith("Heading")) zeilen.push({ art: "h3", text: `### ${text}` });
    else if (liste && text) zeilen.push({ art: "liste", text: `- ${text}` });
    else zeilen.push({ art: "absatz", text });
  }

  /* Word kennt keine Leerzeilen zwischen Absaetzen, Markdown braucht sie:
     ohne Leerzeile verschmelzen zwei Absaetze zu einem. Aufzaehlungen
     bleiben dagegen als Block zusammen. */
  const raus = [];
  let vorher = null;
  for (const z of zeilen) {
    if (!z.text) continue;
    const zusammen = z.art === "liste" && vorher === "liste";
    if (raus.length && !zusammen) raus.push("");
    raus.push(z.text);
    vorher = z.art;
  }
  return raus.join("\n");
}

/* -------------------------------------------------------------- Zerlegen */

const MARKER = ["=== TEXT ===", "=== FAQ ===", "=== QUELLEN ===", "=== NOTIZEN ==="];
const FELDZEILE = /^([A-ZÄÖÜ][A-ZÄÖÜ0-9 .\-\/]{1,30}):\s*(.*)$/;

function zerlegen(roh) {
  const zeilen = roh.replace(/\r\n/g, "\n").split("\n");
  const felder = {};
  const bloecke = { TEXT: [], FAQ: [], QUELLEN: [], NOTIZEN: [] };

  let block = null;
  let feld = null;

  for (const zeile of zeilen) {
    const marke = MARKER.find((m) => zeile.trim() === m);
    if (marke) {
      block = marke.replace(/=/g, "").trim();
      feld = null;
      continue;
    }

    if (block) {
      bloecke[block].push(zeile);
      continue;
    }

    const treffer = zeile.match(FELDZEILE);
    if (treffer) {
      feld = treffer[1].trim();
      felder[feld] = treffer[2].trim();
    } else if (feld) {
      /* Word bricht lange Werte um, Fortsetzungszeilen gehoeren zum Feld. */
      felder[feld] = (felder[feld] + " " + zeile.trim()).trim();
    }
  }
  return { felder, bloecke };
}

/* ---------------------------------------------------------- Umwandlungen */

const QUELLENART = {
  primärquelle: "primaerquelle",
  primaerquelle: "primaerquelle",
  behörde: "behoerde",
  behoerde: "behoerde",
  studie: "studie",
  fachverband: "fachverband",
  fachpublikation: "fachpublikation",
  unternehmensquelle: "unternehmensquelle",
  sekundärquelle: "sekundaerquelle",
  sekundaerquelle: "sekundaerquelle",
  community: "community",
  sonstige: "sonstige",
};

const SUCHINTENTION = {
  informational: "informational",
  commercial: "commercial",
  transactional: "transactional",
  navigational: "navigational",
};

function alsIso(text) {
  const m = text?.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text?.trim() ?? "")) return text.trim();
  return null;
}

function slugAus(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Nur die URL aus einem Markdown-Link, sonst der Text selbst.
 * Tracking-Parameter fliegen raus: KI-Werkzeuge haengen gern utm_source an,
 * und das hat auf einer Quellenangabe nichts zu suchen.
 */
function nurUrl(s) {
  const roh = (s?.match(/\]\(([^)]+)\)/)?.[1] ?? s ?? "").trim();
  if (!/^https?:\/\//i.test(roh)) return "";
  try {
    const url = new URL(roh);
    for (const p of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref$|source$)/i.test(p)) url.searchParams.delete(p);
    }
    return url.toString().replace(/\?$/, "");
  } catch {
    return roh;
  }
}

function faqAus(zeilen) {
  const eintraege = [];
  let feld = null;
  for (const zeile of zeilen) {
    const f = zeile.match(/^F:\s*(.*)$/);
    const a = zeile.match(/^A:\s*(.*)$/);
    if (f) {
      eintraege.push({ frage: f[1].trim(), antwort: "" });
      feld = "frage";
    } else if (a && eintraege.length) {
      eintraege[eintraege.length - 1].antwort = a[1].trim();
      feld = "antwort";
    } else if (feld && eintraege.length && zeile.trim()) {
      const letzter = eintraege[eintraege.length - 1];
      letzter[feld] = (letzter[feld] + " " + zeile.trim()).trim();
    }
  }
  return eintraege.filter((e) => e.frage && e.antwort);
}

function quellenAus(zeilen) {
  return zeilen
    .filter((z) => z.includes("|"))
    .map((z) => {
      const [name, titel, url, art, datum] = z.split("|").map((t) => t.trim());
      return {
        name: name ?? "",
        titel: titel ?? "",
        url: nurUrl(url),
        art: QUELLENART[(art ?? "").toLowerCase()] ?? "sonstige",
        abgerufen: alsIso(datum),
      };
    })
    .filter((q) => q.name || q.titel || q.url);
}

/* ------------------------------------------------------------------ YAML */

const skalar = (wert) => JSON.stringify(String(wert ?? "").replace(/\s+/g, " ").trim());

function frontmatter(daten) {
  const z = [];
  const setze = (schluessel, wert) => {
    if (wert !== undefined && wert !== null && wert !== "") z.push(`${schluessel}: ${skalar(wert)}`);
  };

  setze("titel", daten.titel);
  setze("slug", daten.slug);
  setze("teaser", daten.teaser);
  setze("quickAnswer", daten.quickAnswer);

  if (daten.faq.length) {
    z.push("faq:");
    for (const f of daten.faq) {
      z.push(`  - frage: ${skalar(f.frage)}`);
      z.push(`    antwort: ${skalar(f.antwort)}`);
    }
  }

  if (daten.quellen.length) {
    z.push("quellen:");
    for (const q of daten.quellen) {
      z.push(`  - name: ${skalar(q.name)}`);
      if (q.titel) z.push(`    titel: ${skalar(q.titel)}`);
      if (q.url) z.push(`    url: ${skalar(q.url)}`);
      z.push(`    art: ${q.art}`);
      if (q.abgerufen) z.push(`    abgerufen: ${q.abgerufen}`);
    }
  }

  if (daten.bild) setze("bild", daten.bild);
  if (daten.bildAlt) setze("bildAlt", daten.bildAlt);

  z.push("seo:");
  if (daten.seoTitel) z.push(`  titel: ${skalar(daten.seoTitel)}`);
  if (daten.metaBeschreibung) z.push(`  beschreibung: ${skalar(daten.metaBeschreibung)}`);
  if (daten.fokus) z.push(`  fokus: ${skalar(daten.fokus)}`);
  z.push(`  robots: "index, follow"`);

  z.push("redaktion:");
  if (daten.suchintention) z.push(`  suchintention: ${daten.suchintention}`);
  if (daten.zielgruppe) z.push(`  zielgruppe: ${skalar(daten.zielgruppe)}`);
  if (daten.nutzerproblem) z.push(`  nutzerproblem: ${skalar(daten.nutzerproblem)}`);
  if (daten.ergebnis) z.push(`  ergebnis: ${skalar(daten.ergebnis)}`);
  if (daten.angle) z.push(`  angle: ${skalar(daten.angle)}`);
  if (daten.entitaeten.length) {
    z.push("  entitaeten:");
    for (const e of daten.entitaeten) z.push(`    - ${skalar(e)}`);
  }

  z.push(`status: ${daten.status}`);
  z.push(`datum: ${daten.datum}`);
  z.push(`autor: jan-philip-berg`);
  z.push(`ctaImText: auto`);

  return `---\n${z.join("\n")}\n---\n`;
}

/* ------------------------------------------------------------------ Lauf */

const argumente = process.argv.slice(2);
const quelle = argumente.find((a) => !a.startsWith("--"));
if (!quelle) {
  console.error('Aufruf: node werkzeuge/artikel-import.mjs "<Datei>" [--datum TT.MM.JJJJ] [--bild /uploads/x.jpg]');
  process.exit(1);
}
const wunschDatum = argumente[argumente.indexOf("--datum") + 1];
const bildPfad = argumente.includes("--bild") ? argumente[argumente.indexOf("--bild") + 1] : null;

const roh = quelle.toLowerCase().endsWith(".docx")
  ? docxAlsText(quelle)
  : readFileSync(quelle, "utf8");

const { felder, bloecke } = zerlegen(roh);

const titel = felder["TITEL"] ?? "";
const slug = felder["SLUG"]?.trim() || slugAus(titel);
if (!slug) {
  console.error("Weder TITEL noch SLUG gefunden. Stimmt das Format?");
  process.exit(1);
}

/* Ein Datum aus der Datei schlaegt nichts, --datum schlaegt alles.
   Liegt der Tag in der Zukunft, wird der Beitrag geplant statt sofort sichtbar. */
const datum =
  alsIso(wunschDatum) ?? alsIso(felder["VERÖFFENTLICHEN AM"] ?? felder["VEROEFFENTLICHEN AM"] ?? "") ??
  new Date().toISOString().slice(0, 10);
const status = datum > new Date().toISOString().slice(0, 10) ? "geplant" : "veroeffentlicht";

const text = bloecke.TEXT.join("\n").replace(/\n{3,}/g, "\n\n").trim();
const faq = faqAus(bloecke.FAQ);
const quellen = quellenAus(bloecke.QUELLEN);

const daten = {
  titel,
  slug,
  teaser: felder["TEASER"],
  quickAnswer: felder["QUICK ANSWER"],
  seoTitel: felder["SEO-TITEL"],
  metaBeschreibung: felder["META BESCHREIBUNG"],
  fokus: felder["FOKUSTHEMA"],
  suchintention: SUCHINTENTION[(felder["SUCHINTENTION"] ?? "").toLowerCase().trim()],
  zielgruppe: felder["ZIELGRUPPE"],
  nutzerproblem: felder["NUTZERPROBLEM"],
  ergebnis: felder["ERGEBNIS"],
  angle: felder["ANGLE"],
  entitaeten: (felder["ENTITÄTEN"] ?? "")
    .split(/,(?![^(]*\))/)
    .map((e) => e.trim().replace(/\.$/, ""))
    .filter(Boolean),
  bild: bildPfad,
  bildAlt: felder["BILD-ALT"],
  faq,
  quellen,
  status,
  datum,
};

const ziel = path.join("src", "content", "blog", `${slug}.md`);
if (existsSync(ziel)) {
  console.error(`${ziel} gibt es schon. Erst pruefen, dann von Hand entscheiden.`);
  process.exit(1);
}
writeFileSync(ziel, frontmatter(daten) + "\n" + text + "\n", "utf8");

const ueberschriften = (text.match(/^## /gm) ?? []).length;
console.log(`${ziel}
  Titel:        ${titel}
  Status:       ${status} zum ${datum}
  Text:         ${text.length} Zeichen, ${ueberschriften} Zwischenueberschriften
  FAQ:          ${faq.length}
  Quellen:      ${quellen.length}${quellen.some((q) => !q.url) ? "  (ohne URL: " + quellen.filter((q) => !q.url).length + ")" : ""}
  Entitaeten:   ${daten.entitaeten.length}
  Bild:         ${bildPfad ?? "keins"}`);

const fehlend = ["teaser", "quickAnswer", "seoTitel", "metaBeschreibung", "bildAlt"].filter(
  (f) => !daten[f],
);
if (fehlend.length) console.log(`  Leer geblieben: ${fehlend.join(", ")}`);
if (ueberschriften === 0) console.log("  ACHTUNG: keine Zwischenueberschrift erkannt.");
