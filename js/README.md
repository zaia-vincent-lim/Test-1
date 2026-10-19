# JavaScript Modules

This folder contains the two scripts that power the Tabletop News prototype.

| File       | Role                                      |
|------------|-------------------------------------------|
| `article-data.js`  | Static / embedded article data (fallback) |
| `article-app.js`   | All application logic                     |

Load order (already set in `article-index.html`):

```html
<script src="js/article-data.js"></script>
<script src="js/article-app.js"></script>
```

---

## article-data.js

Holds the complete list of articles as a global constant used as the offline fallback.

```js
const ARTICLES = [
  {
    title: "...",
    link: "...",
    published: "...",
    short: "...",
    full: "..."
  },
  // ...
];
```

### Regenerating

1. Export the Google Sheet as CSV.
2. Convert rows to the object shape above.
3. Replace the contents of `article-data.js` (keep the `const ARTICLES = ...;` wrapper).

Prefer using the **Refresh** button in the UI when possible; only re-generate `article-data.js` when you want a new offline baseline.

---

## article-app.js

All interactive logic lives here (IIFE – does not pollute the global scope except for the `ARTICLES` dependency).

### Architecture

```
CONFIG          → tunable settings (batch size, debounce, sheet URL, CORS proxy)
state           → allArticles, filtered, displayedCount, loading flags
Helpers         → dates, source domain, HTML escape, CSV parser
Source filter   → populateSourceFilter()
Rendering       → createCardHTML, renderFromStart, loadMore (infinite scroll)
Modal           → open / close
Filtering       → search + sort + source
Live refresh    → refreshFromSheet()
Scroll listener → onScroll()
Event wiring    → setupEventListeners()
init()          → entry point
```

### Key configuration

```js
const CONFIG = {
  batchSize: 24,                 // cards per infinite-scroll batch
  searchDebounceMs: 200,
  scrollThresholdPx: 400,        // distance from bottom that triggers load
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/.../export?format=csv",
  corsProxy: "https://api.allorigins.win/raw?url=",
};
```

### State

```js
const state = {
  allArticles: [],     // full dataset
  filtered: [],        // after search / sort / source filter
  displayedCount: 0,   // how many cards are currently in the DOM
  isLoadingMore: false,
  isRefreshing: false,
};
```

### Main behaviours

| Feature            | How it works |
|--------------------|--------------|
| **Source filter**  | Unique domains extracted from links → `<select id="source">`. Changing it re-runs `applyFilters()`. |
| **Infinite scroll**| `renderFromStart()` shows the first batch. `onScroll()` calls `loadMore()` when the user is near the bottom, appending the next batch. |
| **Live refresh**   | `refreshFromSheet()` tries a direct `fetch` of the CSV, falls back to the CORS proxy, parses with the built-in CSV parser, then replaces `state.allArticles` and re-renders. On failure the previous data is kept. |

### Adding new features

| Goal                         | Where to work |
|------------------------------|---------------|
| Change batch size            | `CONFIG.batchSize` |
| New sort option              | `applyFilters()` + the `<select>` in HTML |
| Multi-select sources         | Replace the single `<select>` + filter logic |
| Different CORS proxy / backend | `CONFIG.corsProxy` or rewrite `refreshFromSheet()` |
| Theme toggle                 | Add a button + toggle a class / data-attribute |

### Debugging

- Console errors about missing elements → an ID was renamed in the HTML.
- “Article data failed to load” → `article-data.js` missing or not loaded before `article-app.js`.
- Refresh shows “✗ Failed” → network / proxy issue; existing data is preserved.
- Infinite scroll not loading → check that `#scroll-status` exists and that `displayedCount < filtered.length`.
