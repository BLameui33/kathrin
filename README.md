# Kathrin — Zeitgenössische Kunst
**Portfolio-Website mit Decap CMS auf GitHub Pages**

---

## Dateistruktur

```
kathrin-portfolio/
├── index.html               ← Hauptseite (One-Pager)
├── styles.css               ← Gesamtes Stylesheet
├── script.js                ← Galerie-Loader, Lightbox, Formular
├── .nojekyll                ← GitHub Pages: Jekyll deaktivieren
├── content/
│   └── kunstwerke.json      ← Alle Werksdaten (vom CMS bearbeitet)
├── images/
│   └── uploads/             ← Hochgeladene Bilder (via CMS)
└── admin/
    ├── index.html           ← Decap CMS Einstiegsseite
    └── config.yml           ← CMS-Konfiguration
```

---

## Deployment auf GitHub Pages

### 1. Repository anlegen
```bash
# Neues Repo auf github.com erstellen (öffentlich!), dann:
git init
git add .
git commit -m "Initial commit: Kathrin Portfolio"
git branch -M main
git remote add origin https://github.com/IHR-USERNAME/IHR-REPO.git
git push -u origin main
```

### 2. GitHub Pages aktivieren
- Repository → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main** / **/ (root)**
- Speichern → URL: `https://IHR-USERNAME.github.io/IHR-REPO`

### 3. OAuth für Decap CMS einrichten

**A) GitHub OAuth App anlegen**
- github.com → Settings → Developer settings → OAuth Apps → **New OAuth App**
- Application name: `Kathrin CMS`
- Homepage URL: `https://IHR-USERNAME.github.io/IHR-REPO`
- Authorization callback URL: `https://api.netlify.com/auth/done`
- → **Client ID** und **Client Secret** notieren

**B) Netlify als kostenloser OAuth-Proxy**
- [app.netlify.com](https://app.netlify.com) → Kostenlosen Account anlegen
- **Add new site → "Sites without deploys"** (kein eigenes Hosting nötig)
- Site settings → **Access control → OAuth**
- → **Install provider: GitHub**
- Client ID + Secret aus Schritt A eintragen

**C) `admin/config.yml` anpassen**
```yaml
backend:
  repo: IHR-USERNAME/IHR-REPO   # ← anpassen
  base_url: https://api.netlify.com
```

### 4. Fertig!
- Hauptseite: `https://IHR-USERNAME.github.io/IHR-REPO`
- CMS: `https://IHR-USERNAME.github.io/IHR-REPO/admin/`

---

## CMS nutzen — Werke verwalten

1. `/admin/` aufrufen → **Login with GitHub**
2. **Kunstwerke → Alle Werke → Werksliste**
3. Werk hinzufügen / bearbeiten / löschen
4. **Publish** klickt → Decap CMS erstellt einen Git-Commit
5. GitHub Pages deployed automatisch innerhalb ~60 Sekunden

---

## Kontaktformular

Das Formular simuliert den Versand (Demo-Modus). Für echten E-Mail-Versand:

**Option A — Formspree (empfohlen, kostenlos)**
```javascript
// In script.js, Zeile ~170, ersetzen:
const res = await fetch('https://formspree.io/f/IHRE_FORMSPREE_ID', {
  method: 'POST',
  body: new FormData(form),
  headers: { 'Accept': 'application/json' }
});
if (!res.ok) throw new Error('Fehler');
```
→ [formspree.io](https://formspree.io) — kostenlos bis 50 Nachrichten/Monat

**Option B — Netlify Forms**
```html
<!-- In index.html, <form>-Tag ergänzen: -->
<form netlify name="kontakt" ...>
```

---

## Portrait-Bild einbinden

In `index.html`, Bereich `<!-- Portrait-Spalte -->`:
```html
<!-- Dieses div ersetzen: -->
<div class="portrait-placeholder"> … </div>

<!-- Durch: -->
<img
  src="images/uploads/portrait.jpg"
  alt="Kathrin im Atelier, Berlin 2024"
  class="portrait-placeholder"
  style="object-fit: cover; width: 100%; aspect-ratio: 3/4;"
/>
```

---

## Lokale Entwicklung

```bash
# Einfacher lokaler Server (Python)
python3 -m http.server 8000
# → http://localhost:8000

# Oder mit Node.js
npx serve .
```

**CMS lokal testen:**
```bash
npx netlify-cms-proxy-server
# In admin/config.yml einkommentieren: local_backend: true
```

---

## Technischer Stack

| Bereich | Technologie |
|---|---|
| Frontend | HTML5 · CSS3 (Custom Properties) · Vanilla JS |
| Hosting | GitHub Pages (kostenlos) |
| CMS | Decap CMS v3 (Git-basiert, kein Server) |
| Fonts | Google Fonts: Playfair Display · Cormorant Garamond · DM Sans |
| Formular | Formspree / Netlify Forms (optional) |
| Build | Kein Build-Prozess — direkt deploybar |
