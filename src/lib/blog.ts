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

export type Cta = {
  ueberschrift: string;
  text: string;
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
    buttonText: eigen?.buttonText?.trim() || s.buttonText,
    buttonUrl: eigen?.buttonUrl?.trim() || s.buttonUrl,
    bild: s.bild,
    bildAlt: s.bildAlt,
  };
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
