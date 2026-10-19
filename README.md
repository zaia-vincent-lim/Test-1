# Tabletop News Prototype

A clean, modular prototype webpage that displays web-scraped tabletop gaming news articles in a card-based layout.

Data is sourced from a public Google Sheet. Embedded data is used by default; a **Refresh** button can pull the latest version live.

---

## Folder Structure

```
tabletop-news/
├── article-index.html          ← Main page (HTML structure only)
├── README.md           ← This file
├── css/
│   ├── article-styles.css      ← All styles
│   └── README.md
└── js/
    ├── article-data.js         ← Embedded article data (fallback)
    ├── article-app.js          ← Application logic
    └── README.md
```

---

## Features

- **Card grid** – Responsive, dark-themed cards with title, date, source, short summary
- **Search** – Filters titles + short + full summaries in real time
- **Sort** – Newest / Oldest / Title A–Z
- **Source filter** – Dropdown of all unique domains (tabletopgamingnews.com, dicebreaker.com, …)
- **Infinite scroll** – Loads 24 more cards as you approach the bottom (no classic pagination)
- **Live refresh** – “↻ Refresh” button fetches the latest CSV from the Google Sheet
- **Detail modal** – Full summary + link to original article
- **Works offline** – Falls back to embedded data if the network request fails

---

## article-index.html

**Purpose:** Entry point. Contains only markup — no styles or business logic.

### Key element IDs (required by article-app.js)

| ID              | Purpose                              |
|-----------------|--------------------------------------|
| `#search`       | Search input                         |
| `#sort`         | Sort select                          |
| `#source`       | Source filter select                 |
| `#refresh-btn`  | Live refresh button                  |
| `#stats`        | “Showing X of Y” counter             |
| `#content`      | Card grid / loading / empty state    |
| `#scroll-status`| Infinite-scroll status text          |
| `#modal`        | Modal overlay                        |
| `#modal-title`  | Article title in modal               |
| `#modal-meta`   | Date + source in modal               |
| `#modal-body`   | Full summary text                    |
| `#modal-link`   | “Open original article” button       |
| `#modal-close`  | Close button                         |

### How to run

1. Keep the folder structure intact.
2. Open `article-index.html` in any modern browser.
3. No build step or local server required.

### Making changes

| Goal                    | File to edit          |
|-------------------------|-----------------------|
| Layout / structure      | `article-index.html`          |
| Look & feel             | `css/article-styles.css`      |
| Behaviour / features    | `js/article-app.js`           |
| Update embedded data    | `js/article-data.js`          |

---

## Live Refresh notes

The Refresh button tries to fetch the Google Sheet CSV directly. Because browsers block cross-origin requests (CORS), it automatically falls back to a public CORS proxy (`api.allorigins.win`).

- If the proxy is down or rate-limited, the button shows “✗ Failed” and keeps the existing data.
- For production, replace the proxy with your own small backend endpoint that fetches the sheet and returns JSON.

---

## Future ideas

- Multi-select source chips instead of a single dropdown
- Tag / category support
- Light / dark theme toggle
- “Mark as read” or favourites (localStorage)
- Keyboard navigation between cards
