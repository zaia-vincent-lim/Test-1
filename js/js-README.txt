# JavaScript Components

All logic is split into small files that share a global namespace: window.TN

| File                 | Responsibility                                      |
|----------------------|-----------------------------------------------------|
| article-data.js      | Embedded ARTICLES array (offline fallback)          |
| article-config.js    | TN.CONFIG + TN.state                                |
| article-helpers.js   | Dates, getSource, escapeHtml, CSV parser            |
| article-render.js    | Card HTML, stats, scroll status, modal open/close   |
| article-filters.js   | Source dropdown + search/sort/source filtering      |
| article-refresh.js   | Live fetch from Google Sheet                        |
| article-scroll.js    | Infinite-scroll listener                            |
| article-app.js       | Event wiring + init()                               |

## Load order (required – already set in article-index.html)

1. article-data.js
2. article-config.js
3. article-helpers.js
4. article-render.js
5. article-filters.js
6. article-refresh.js
7. article-scroll.js
8. article-app.js

## Shared namespace

Every module attaches to window.TN:

  TN.CONFIG          – tunable settings
  TN.state           – runtime data
  TN.parseDate / formatDate / getSource / escapeHtml / parseCSV / csvToArticles
  TN.createCardHTML / renderFromStart / loadMore / openModal / closeModal
  TN.populateSourceFilter / applyFilters
  TN.refreshFromSheet
  TN.onScroll

## Adding a new feature

1. Create a new file (e.g. js/article-favourites.js) that attaches functions to TN.
2. Add a <script> tag for it in article-index.html (before article-app.js).
3. Wire any new UI events inside article-app.js.
