# BLEIB PAPA — Website

Alles für bleibpapa.de: Landingpage, Danke-Seite, Rechtsseiten und Blog.

```
bleib-papa-web/
├─ src/
│  ├─ site.ts              ← Domain, Impressumsdaten, Endpunkte (zentrale Stellschraube)
│  ├─ pages/               Landingpage, Danke, Impressum, Datenschutz, Kontakt, Blog
│  ├─ content/blog/        Blogartikel als Markdown
│  ├─ components/          Header, Footer, Opt-in-Formular
│  └─ styles/global.css    komplettes Design
├─ public/
│  ├─ assets/              Bilder und Schriften
│  ├─ admin/               Editor-Oberfläche für den Blog
│  └─ uploads/             Bilder, die du im Editor hochlädst
└─ netlify/functions/
   └─ optin.mjs            übergibt Anmeldungen an Brevo
```

---

## Was du einmalig einrichten musst

Ich kann keine Konten anlegen und mich nirgends einloggen. Diese fünf Schritte machst
du, alles andere übernehme ich danach.

### 1. GitHub-Konto und Repository (ca. 3 Minuten)

Auf [github.com](https://github.com) ein kostenloses Konto anlegen, dann ein neues
Repository erstellen: Name `bleib-papa-web`, **Private**, keine Häkchen bei README
oder .gitignore.

Danach sag mir deinen GitHub-Benutzernamen, dann lade ich das Projekt hoch.

### 2. Netlify verbinden (ca. 3 Minuten)

Auf [netlify.com](https://netlify.com) mit dem GitHub-Konto anmelden
(„Sign up with GitHub"). Dann: **Add new site → Import an existing project →
GitHub → bleib-papa-web**. Die Bau-Einstellungen erkennt Netlify selbst, weil
`netlify.toml` im Projekt liegt. Auf **Deploy** klicken.

Nach ein bis zwei Minuten läuft die Seite unter einer Adresse wie
`zufälliger-name.netlify.app`.

### 3. Brevo einrichten (ca. 10 Minuten)

Auf [brevo.com](https://www.brevo.com/de/) ein Konto anlegen (kostenlos bis 300
E-Mails pro Tag). Dort:

1. **Kontakte → Listen → Neue Liste**, z. B. „BLEIB PAPA Guide". Die Listen-ID
   steht in der Übersicht.
2. **Kontakte → Attribute**: ein Attribut `VORNAME` (Text) und `QUELLE` (Text)
   anlegen, falls nicht vorhanden.
3. **Kampagnen → Vorlagen → Neue Vorlage** für die Bestätigungsmail
   (Double-Opt-in). Text zum Beispiel: „Bestätige kurz deine Adresse, dann kommt
   der Guide." Darin den Platzhalter für den Bestätigungslink einsetzen
   (`{{ doubleoptin }}`). Vorlage aktivieren, die Vorlagen-ID notieren.
4. **Rechts oben auf deinen Namen → SMTP & API → API-Schlüssel → Neuen Schlüssel
   erstellen.** Diesen Schlüssel nur bei Netlify eintragen, nirgendwo sonst.

Dann in Netlify unter **Site configuration → Environment variables** anlegen:

| Name | Wert |
|---|---|
| `BREVO_API_KEY` | dein API-Schlüssel |
| `BREVO_LIST_ID` | ID der Liste, z. B. `3` |
| `BREVO_DOI_TEMPLATE_ID` | ID der Bestätigungs-Vorlage |
| `BREVO_DOI_REDIRECT` | `https://bleibpapa.de/guide/` |

Der API-Schlüssel liegt damit nur auf dem Server. Im Quelltext der Website taucht
er nie auf.

### 4. Domain verbinden (ca. 5 Minuten plus Wartezeit)

In Netlify: **Domain management → Add a domain** → deine Domain eintragen.
Netlify zeigt dir dann zwei DNS-Einträge an. Diese bei Strato unter
**Domainverwaltung → DNS-Einstellungen** eintragen:

- `A`-Eintrag für die Hauptdomain auf die von Netlify genannte IP
- `CNAME`-Eintrag für `www` auf deine Netlify-Adresse

Die Umstellung dauert je nach Anbieter ein paar Minuten bis 24 Stunden. Das
HTTPS-Zertifikat stellt Netlify danach automatisch aus.

### 5. Login für den Blog-Editor (ca. 2 Minuten)

In Netlify: **Site configuration → Access control → OAuth → Install provider →
GitHub**. Damit kannst du dich unter `deinedomain.de/admin/` mit deinem
GitHub-Konto anmelden.

---

## Blog schreiben

Unter `deinedomain.de/admin/` anmelden. Dort: **Blogbeiträge → New Blogbeitrag**.
Titel, Kurzbeschreibung, Datum, optional ein Bild, dann der Text.

- **Speichern** legt einen Entwurf an, der noch nicht öffentlich ist.
- **Publish** veröffentlicht ihn. Die Website baut sich danach von selbst neu,
  nach ein bis zwei Minuten ist der Beitrag online.
- Das Häkchen **Entwurf** hält einen Beitrag zurück, auch wenn er schon
  veröffentlicht wurde.

Formatierung im Textfeld: `##` für Zwischenüberschriften, `**fett**`, `>` für ein
hervorgehobenes Zitat.

---

## Selbst ändern

**Texte und Bilder:** in den Dateien unter `src/pages/`.
**Domain, Impressumsdaten:** in `src/site.ts` — von dort ziehen sich Impressum,
Datenschutz und Sitemap ihre Werte.
**Farben und Abstände:** ganz oben in `src/styles/global.css`.

Lokal ansehen:

```bash
npm run dev
```

---

## Noch offen

- [ ] Anschrift und Telefonnummer in `src/site.ts` eintragen (fürs Impressum)
- [ ] Datenschutzerklärung anwaltlich prüfen lassen
- [ ] Seite `/guide/` anlegen, auf der nach der Bestätigung das PDF liegt
- [ ] Meta-Pixel oder Analytics einbauen, falls gewünscht (erst nach Einwilligung)
