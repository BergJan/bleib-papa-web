/**
 * Die Themenwelten des Blogs.
 *
 * Fuenf Stueck, mehr nicht. Eine Uebersicht, die ein Vater mit einem Blick
 * erfasst, fuehrt ihn weiter. Fuenfzehn Schlagworte tun das nicht.
 *
 * Diese Liste ist die einzige Stelle, an der die Welten stehen. Schema,
 * Redaktionssystem und die Seiten beziehen sich alle darauf. Kommt eine
 * Welt dazu, muss sie auch in public/admin/config.yml auftauchen, sonst
 * kann sie im Backend niemand auswaehlen.
 */

export type Themenwelt = {
  /** Teil der Adresse: /blog/thema/<schluessel>/ */
  schluessel: string;
  /** So steht es auf den Knoepfen und in der Ueberschrift. */
  name: string;
  /** Ein Satz unter der Ueberschrift der Themenseite. */
  beschreibung: string;
};

export const THEMEN: Themenwelt[] = [
  {
    schluessel: "kontakt-halten",
    name: "Kontakt zwischen den Tagen",
    beschreibung:
      "Anrufen, schreiben, Rituale: Wie ihr verbunden bleibt, auch wenn dein Kind gerade nicht bei dir ist.",
  },
  {
    schluessel: "gemeinsame-zeit",
    name: "Eure gemeinsame Zeit",
    beschreibung:
      "Das Wochenende bei Papa, ohne Programmdruck. Was ihr tut, was Alltag darf und was wirklich zählt.",
  },
  {
    schluessel: "abschied-und-vermissen",
    name: "Abschied und Vermissen",
    beschreibung:
      "Die Übergabe, der leere Sonntagabend, die Tage danach. Warum das weh tut und was dabei hilft.",
  },
  {
    schluessel: "ex-und-neue-partner",
    name: "Ex-Partnerin und neue Partner",
    beschreibung:
      "Eltern bleiben, obwohl ihr kein Paar mehr seid. Konflikte, neue Partner und dein Platz als Vater.",
  },
  {
    schluessel: "deine-vaterrolle",
    name: "Deine Rolle als Vater",
    beschreibung:
      "Zweifel, Schuldgefühle, wenig Zeit. Was ein Kind von seinem Vater braucht und was du dafür nicht sein musst.",
  },
];

export const THEMEN_SCHLUESSEL = THEMEN.map((t) => t.schluessel);

/** Findet eine Welt, oder nichts, wenn das Feld leer oder unbekannt ist. */
export const themenwelt = (schluessel: string | undefined) =>
  THEMEN.find((t) => t.schluessel === schluessel) ?? null;

/** Adresse der Themenseite. */
export const themenPfad = (schluessel: string) => `/blog/thema/${schluessel}/`;
