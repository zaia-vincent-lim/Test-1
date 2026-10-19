# Tabletop Article Prototype

A clean, modular prototype webpage that displays web-scraped tabletop gaming news articles in a card-based layout.

Data is sourced from a public Google Sheet. Embedded data is used by default; a Refresh button can pull the latest version live.

---

## Folder Structure

```
├── article-index.html
├── README.txt
├── css/
│   ├── article-variables.css      ← Design tokens (colours, radius, shadow)
│   ├── article-base.css           ← Reset + body + main
│   ├── article-header.css         ← Sticky header + controls
│   ├── article-cards.css          ← Card grid + card styles
│   ├── article-modal.css          ← Detail modal
│   ├── article-status.css         ← Loading / empty / scroll status + responsive
│   └── css-README.txt
└── js/
    ├── article-data.js    ← Embedded article data (fallback)
    ├── article-config.js  ← CONFIG + state
    ├── article-helpers.js ← Dates, escaping, CSV parser
    ├── article-render.js  ← Cards, stats, modal UI
    ├── article-filters.js ← Search / sort / source filter
    ├── article-refresh.js ← Live refresh from Google Sheet
    ├── article-scroll.js  ← Infinite scroll listener
    ├── article-app.js     ← Event wiring + init
    └── js-README.txt
```

---

## Features

- Card grid (responsive, dark theme)
- Search (title + short + full summary)
- Sort (Newest / Oldest / Title A–Z)
- Source filter (unique domains)
- Infinite scroll (24 cards per batch)
- Live refresh from Google Sheet
- Detail modal with full summary
- Works offline (embedded data fallback)

---

## How to run

1. Keep the folder structure intact.
2. Open article-index.html in any modern browser.
3. No build step or local server required.

---

## Making changes

| Goal                    | Files to edit                          |
|-------------------------|----------------------------------------|
| Colours / theme         | css/article-variables.css              |
| Header / controls look  | css/article-header.css                 |
| Card appearance         | css/article-cards.css                  |
| Modal look              | css/article-modal.css                  |
| Responsive behaviour    | css/article-status.css                 |
| Batch size / thresholds | js/article-config.js                   |
| Filtering logic         | js/article-filters.js                  |
| Live refresh behaviour  | js/article-refresh.js                  |
| Card HTML structure     | js/article-render.js                   |
| New event listeners     | js/article-app.js                      |
| Update offline data     | js/article-data.js                     |

---

## Live Refresh notes

The Refresh button tries a direct fetch of the Google Sheet CSV, then falls back to a public CORS proxy (api.allorigins.win). On failure the existing data is kept. For production, replace the proxy with your own backend endpoint.
