# BLEIB PAPA — Website

Live unter **https://bleibpapa.de** · Repository: `BergJan/bleib-papa-web` · Hosting: Netlify (Projekt `bleibpapa`)

Jede Änderung, die ins Repository geht, ist ein bis zwei Minuten später automatisch online.

```
bleib-papa-web/
├─ src/
│  ├─ site.ts              ← Domain, Impressumsdaten, Tracking-IDs (zentrale Stellschraube)
│  ├─ pages/               Landingpage, Danke, Guide, Impressum, Datenschutz, Kontakt, Blog
│  ├─ content/blog/        Blogartikel als Markdown
│  ├─ components/          Header, Footer, Opt-in-Formular, Einwilligungsbanner
│  └─ styles/global.css    komplettes Design
├─ public/
│  ├─ assets/              Bilder und Schriften
│  ├─ downloads/           das Guide-PDF
│  ├─ admin/               Editor-Oberfläche für den Blog
│  └─ uploads/             Bilder, die du im Editor hochlädst
├─ netlify/functions/
│  └─ optin.mjs            übergibt Anmeldungen an Brevo
└─ brevo/doi-mail.html     Vorlage der Bestätigungsmail (zum Nachschlagen)
```

---

## Wie ein Lead entsteht

1. Besucher füllt das Formular auf `/` aus
2. `netlify/functions/optin.mjs` meldet ihn bei Brevo an (API-Schlüssel liegt nur in Netlify)
3. Weiterleitung auf `/danke/` — „Ein Klick fehlt noch"
4. Brevo verschickt die Bestätigungsmail (Vorlage **#34**)
5. Klick auf den Bestätigungslink → Kontakt landet in Liste **#14** → Weiterleitung auf `/guide/`
6. Dort liegt das PDF zum Download

**Brevo-Eigenheit, die viel Zeit gekostet hat:** Echte DOI-Vorlagen entstehen ausschließlich
über *Marketing → Formulare* (Formular-Assistent) oder als Kopie einer vorhandenen DOI-Vorlage.
Eine unter *Kampagnen → Templates* angelegte Vorlage sieht identisch aus, wird von der API aber
mit „An active DOI template does not exist" abgelehnt.

---

## Blog schreiben

Unter `bleibpapa.de/admin/` mit GitHub anmelden. *Blogbeiträge → New Blogbeitrag*.

Die Maske ist in drei Ebenen sortiert. Wer wissen will, wo ein Feld landet, geht danach:

| Ebene | Felder | Wo es auftaucht |
|---|---|---|
| Sichtbar | Artikeltitel, Teaser, Quick Answer, Text, FAQ, CTA, Quellen, Bilder | auf der Seite |
| Nur im HTML | SEO-Titel, Meta Description, Canonical, Indexierung, Schema | im Quelltext, für Suchmaschinen |
| Nur intern | GEO & Redaktion, Fokus-Thema, „Verwendung im Artikel" bei Quellen | nirgends, nur im Backend |

Die internen Felder erscheinen nachweislich nicht im ausgelieferten HTML.

**Was automatisch passiert**

- Aus Titel, Teaser, Autor, Datum, Bild und Quellen entsteht das `BlogPosting`-Markup
- Aus den FAQ entsteht zusätzlich `FAQPage`-Markup, aber nur weil die Fragen auch sichtbar
  unter dem Artikel stehen
- SEO-Titel leer? Dann gilt der Artikeltitel. Meta Description leer? Dann gilt der Teaser
- Canonical leer? Dann die eigene Artikel-URL
- Der CTA am Artikelende kommt aus `src/site.ts` (`blogCta`). Einmal dort ändern wirkt in
  allen Beiträgen. Ein einzelner Artikel darf ihn überschreiben oder abschalten

**Status**

Nur **Veröffentlicht** erscheint auf der Website. **Geplant** erscheint automatisch, sobald
das Veröffentlichungsdatum erreicht ist und danach ein Build läuft. Entwurf, Zur Prüfung und
Archiviert bleiben unsichtbar.

**Autor**

Autorenprofile liegen unter *Autoren* im Backend. Jedes Profil bekommt eine eigene Seite
(`/autor/jan-philip-berg/`), die unter jedem Beitrag verlinkt ist. Das zahlt auf die Frage
ein, warum ausgerechnet hier jemand über dieses Thema schreibt.

Formatierung: `##` für Zwischenüberschriften, `**fett**`, `>` für ein hervorgehobenes Zitat.
H1 gibt es im Editor absichtlich nicht, die kommt aus dem Titelfeld.

Tipp: Mehrere Artikel sammeln und gemeinsam veröffentlichen — jedes „Publish" stößt einen
Build an und verbraucht Netlify-Credits.

---

## Artikel einpflegen

Fertige Artikel liegen als `.docx`, `.md` oder `.txt` im Ordner
`Desktop/BLEIB-PAPA-Artikel/` im vereinbarten Blockformat. Der Importer macht
daraus einen Beitrag:

```bash
node werkzeuge/artikel-import.mjs "<Datei>" --bild /uploads/<name>.jpg
```

Optional `--datum TT.MM.JJJJ`. Liegt der Tag in der Zukunft, wird der Beitrag
automatisch auf **Geplant** gesetzt statt sofort veröffentlicht.

Aus `.docx` erkennt der Importer Zwischenüberschriften an den Word-Formatvorlagen
(Heading2, Heading3), nicht am Text. Das ist der Grund für das Werkzeug: Beim
Einfügen in den Rich-Text-Editor gingen die Überschriften einmal komplett verloren
und standen als „H2: ..." im Fließtext.

Er setzt außerdem Leerzeilen zwischen die Absätze, weil Word keine kennt und
Markdown sie braucht, übernimmt Aufzählungen und Hyperlinks und entfernt
Tracking-Parameter wie `utm_source` aus den Quellen-URLs.

Bilder vorher verkleinern: 2 MB PNG aus einem KI-Werkzeug werden als JPEG mit
1600 px Breite rund 170 KB, ohne sichtbaren Unterschied.

---

## Geplante Beiträge

Ein Beitrag im Status **Geplant** erscheint automatisch, sobald sein
Veröffentlichungsdatum erreicht ist. Dafür sorgt die Funktion
`netlify/functions/geplant-pruefen.mjs`: Sie läuft jede Nacht um 4:30 Uhr UTC,
liest die Terminliste unter `/geplant.json` und stößt nur dann einen Build an,
wenn wirklich ein Beitrag fällig ist. An Tagen ohne Termin passiert nichts,
das spart Credits.

Einmalig nötig: In Netlify unter *Build & deploy -> Build hooks* einen Hook
anlegen und seine Adresse als Umgebungsvariable `BUILD_HOOK_URL` hinterlegen.
Fehlt sie, tut die Funktion nichts und schreibt das ins Protokoll.

`/geplant.json` enthält absichtlich nur Datumsangaben, keine Titel und keine
Texte. Über einen unveröffentlichten Beitrag steht dort nichts.

---

## Tracking und Einwilligung

Meta-Pixel und Google Analytics stehen in `src/site.ts` unter `tracking`. Sie werden
**erst nach Zustimmung** über das Banner geladen. Bei Ablehnung wird nichts geladen und
nichts gespeichert — geprüft.

| | |
|---|---|
| Meta-Pixel | `1059550730286880` |
| Google Analytics | `G-1P7LX41Z6D` |
| Event bei Anmeldung | Meta `Lead`, GA4 `generate_lead`, dataLayer `lead_optin` |

Um das Banner abzuschalten, sobald kein Tracking mehr läuft: beide IDs leeren und
`bannerImmerZeigen` auf `false` setzen.

---

## Zugänge und Einstellungen

| Wo | Was |
|---|---|
| Netlify → Environment variables | `BREVO_API_KEY`, `BREVO_LIST_ID` (14), `BREVO_DOI_TEMPLATE_ID` (34), `BREVO_DOI_REDIRECT` |
| Brevo → Sicherheit | IP-Beschränkung für API-Schlüssel ist **aus** (nötig, weil Netlify wechselnde IPs nutzt) |
| Strato → DNS | A-Record auf `75.2.60.5`, `www` als CNAME, dazu SPF, DKIM und der Brevo-Code |
| GitHub → OAuth App | `BLEIB PAPA CMS`, Callback `https://api.netlify.com/auth/done` |

Beide Domains (`bleibpapa.de` und `bleib-papa.de`, jeweils mit und ohne `www`) leiten
per 301 auf `https://bleibpapa.de`. Die Regeln stehen in `netlify.toml`.

---

## Selbst ändern

**Texte und Bilder:** in den Dateien unter `src/pages/`
**Domain, Impressumsdaten, Tracking:** in `src/site.ts`
**Farben und Abstände:** ganz oben in `src/styles/global.css`

Lokal ansehen: `npm run dev`

**Achtung bei Astro:** Steht ein `<a>` oder `<strong>` am Zeilenanfang, verschluckt Astro das
Leerzeichen davor („in derDatenschutzerklärung"). Dann `{" "}` ans Ende der Zeile davor setzen.

---

## Noch offen

- [ ] Datenschutzerklärung anwaltlich prüfen lassen — besonders wegen Meta und Google
- [ ] Guide-PDF: Original in Druckqualität liegt außerhalb des Projekts, hier liegt die
      auf 1,1 MB komprimierte Fassung (Ghostscript, `-dPDFSETTINGS=/ebook`)
