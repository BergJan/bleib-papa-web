import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { SITE } from "../site";

export type Beitrag = CollectionEntry<"blog">;

/**
 * Sichtbar ist ein Beitrag nur im Status "veroeffentlicht".
 * "geplant" erscheint automatisch, sobald das Datum erreicht ist und die
 * Seite danach neu gebaut wird (jeder Speichervorgang im Redaktionssystem
 * loest einen Build aus, spaetestens der naechste Beitrag also).
 */
export function istOeffentlich(p: Beitrag): boolean {
  if (p.data.status === "veroeffentlicht") return true;
  if (p.data.status === "geplant") return p.data.datum.getTime() <= Date.now();
  return false;
}

/** Alle sichtbaren Beitraege, neueste zuerst. */
export async function beitraege(): Promise<Beitrag[]> {
  const alle = await getCollection("blog");
  return alle.filter(istOeffentlich).sort((a, b) => b.data.datum.getTime() - a.data.datum.getTime());
}

/** URL des Beitrags. Das Feld "slug" schlaegt den Dateinamen. */
export function pfad(p: Beitrag): string {
  return `/blog/${p.data.slug?.trim() || p.id}/`;
}

/** Titel fuer Browser-Tab und Suchergebnis. Faellt auf die H1 zurueck. */
export function seoTitel(p: Beitrag): string {
  const eigen = p.data.seo.titel?.trim();
  if (eigen) return eigen;
  const h1 = p.data.titel.trim();
  return h1 ? `${h1} | BLEIB PAPA` : "Beitrag | BLEIB PAPA";
}

/** Meta Description. Faellt auf den Teaser zurueck. */
export function metaBeschreibung(p: Beitrag): string {
  return p.data.seo.beschreibung?.trim() || p.data.teaser;
}

/**
 * Sieht der Wert wie eine Adresse aus? Im Redaktionssystem landet in URL-Feldern
 * gelegentlich beschreibender Text statt einer Adresse. Ungeprueft uebernommen
 * zeigt dann zum Beispiel die Canonical auf eine Seite, die es nicht gibt.
 */
function istAdresse(wert: string): boolean {
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(wert);
}

/** Canonical des Beitrags. Unbrauchbare Eingaben werden verworfen. */
export function canonicalVon(p: Beitrag, eigeneUrl: string): string {
  const eingabe = p.data.seo.canonical?.trim();
  if (!eingabe) return eigeneUrl;
  if (!istAdresse(eingabe)) {
    console.warn(
      `[blog] ${p.id}: "${eingabe}" ist keine Adresse. Canonical bleibt die eigene URL.`,
    );
    return eigeneUrl;
  }
  return new URL(eingabe, SITE.url).href;
}

export type Cta = {
  ueberschrift: string;
  text: string;
  kurztext: string;
  buttonText: string;
  buttonUrl: string;
  bild: string;
  bildAlt: string;
};

/**
 * Der Aufruf am Artikelende. Standard steht in site.ts, einzelne Beitraege
 * duerfen jedes Feld ueberschreiben oder den Block ganz abschalten.
 */
export function cta(p: Beitrag): Cta | null {
  const eigen = p.data.cta;
  if (eigen?.aktiv === false) return null;
  const s = SITE.blogCta;
  return {
    ueberschrift: eigen?.ueberschrift?.trim() || s.ueberschrift,
    text: eigen?.text?.trim() || s.text,
    kurztext: s.kurztext,
    buttonText: eigen?.buttonText?.trim() || s.buttonText,
    buttonUrl: pruefeButtonUrl(eigen?.buttonUrl?.trim(), s.buttonUrl),
    bild: s.bild,
    bildAlt: s.bildAlt,
  };
}

function pruefeButtonUrl(eingabe: string | undefined, standard: string): string {
  if (!eingabe) return standard;
  if (istAdresse(eingabe)) return eingabe;
  console.warn(`[blog] "${eingabe}" ist kein Buttonziel. Es gilt ${standard}.`);
  return standard;
}

/** Autorprofil aus src/content/autoren/. Fehlt es, gibt es null. */
export async function autorVon(p: Beitrag) {
  try {
    return (await getEntry("autoren", p.data.autor)) ?? null;
  } catch {
    return null;
  }
}

export const QUELLENART_LABEL: Record<string, string> = {
  primaerquelle: "Primärquelle",
  behoerde: "Behörde oder Institution",
  studie: "Studie",
  fachverband: "Fachverband",
  fachpublikation: "Fachpublikation",
  unternehmensquelle: "Unternehmensquelle",
  sekundaerquelle: "Sekundärquelle",
  community: "Community",
  sonstige: "Sonstige",
};

const datum = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const datumKurz = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const alsDatum = (d: Date) => datum.format(d);
export const alsDatumKurz = (d: Date) => datumKurz.format(d);

/**
 * Teilt den fertigen Artikel fuer den Einschub mitten im Text.
 *
 * Der Einschub sitzt immer direkt vor einer Zwischenueberschrift, nie mitten
 * in einem Gedanken. Bei "auto" faellt die Wahl auf die Ueberschrift, die der
 * Mitte am naechsten liegt, aber nie auf die erste oder letzte: ganz oben
 * kommt er zu frueh, ganz unten steht ohnehin schon der grosse Aufruf.
 * Kurze Artikel mit weniger als drei Ueberschriften bekommen keinen Einschub.
 */
export function teileFuerEinschub(html: string, wunsch: string): [string, string] | null {
  if (wunsch === "aus") return null;

  const ueberschriften: number[] = [];
  const suche = /<h2\b/gi;
  let treffer: RegExpExecArray | null;
  while ((treffer = suche.exec(html)) !== null) ueberschriften.push(treffer.index);
  if (ueberschriften.length < 3) return null;

  let stelle: number;
  if (wunsch === "auto") {
    const mitte = html.length / 2;
    stelle = ueberschriften
      .slice(1, -1)
      .reduce((a, b) => (Math.abs(b - mitte) < Math.abs(a - mitte) ? b : a));
  } else {
    const n = Number(wunsch);
    if (!Number.isInteger(n) || n < 1 || n >= ueberschriften.length) return null;
    stelle = ueberschriften[n];
  }

  return [html.slice(0, stelle), html.slice(stelle)];
}

/** Weitere Beitraege fuer den Weiterlesen-Block, ohne den aktuellen. */
export async function weitereBeitraege(aktuell: Beitrag, anzahl = 3): Promise<Beitrag[]> {
  const alle = await beitraege();
  return alle.filter((p) => p.id !== aktuell.id).slice(0, anzahl);
}
