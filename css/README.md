# article-styles.css

All visual styles for the Tabletop News prototype live in this single file.

---

## Design System (CSS Variables)

Defined in `:root`:

| Variable            | Purpose                          | Default value      |
|---------------------|----------------------------------|--------------------|
| `--bg`              | Page background                  | `#0f1419`          |
| `--surface`         | Card / control background        | `#1a2332`          |
| `--surface-hover`   | Hover state for cards            | `#243044`          |
| `--border`          | Borders & dividers               | `#2d3a4f`          |
| `--text`            | Primary text                     | `#e7ecf3`          |
| `--text-muted`      | Secondary / meta text            | `#9aa8bc`          |
| `--accent`          | Links, highlights, focus rings   | `#6c9eff`          |
| `--accent-hover`    | Accent hover state               | `#8bb3ff`          |
| `--card-shadow`     | Soft drop shadow on cards        | `0 4px 20px ...`   |
| `--radius`          | Border radius for cards          | `12px`             |

Change these variables to restyle the entire app quickly.

---

## Main Sections

| Selector / Class          | What it styles                          |
|---------------------------|-----------------------------------------|
| `header` / `.header-inner`| Sticky top bar                          |
| `.search-box`             | Search input + magnifying glass icon    |
| `select`                  | Sort + Source dropdowns                 |
| `.btn-refresh`            | Live refresh button                     |
| `.stats`                  | “Showing X of Y” counter                |
| `.grid`                   | Responsive card layout (CSS Grid)       |
| `.card`                   | Individual article card                 |
| `.card-title`             | Title (2-line clamp)                    |
| `.card-meta` / `.card-date`| Date badge + source domain             |
| `.card-summary`           | Short summary (3-line clamp)            |
| `.card-footer`            | “Read more” + “Visit” actions           |
| `.modal-overlay` / `.modal`| Full-screen detail modal               |
| `.scroll-status`          | Infinite-scroll status (“Loading more…”, “End of results”) |
| `.loading` / `.empty` / `.error` | Status states                    |

---

## Responsive Behaviour

- Desktop: multi-column card grid (`minmax(340px, 1fr)`)
- Mobile (`≤ 600px`): single column, stacked controls, full-width search

---

## How to customise

1. **Change colours** → edit the `:root` variables at the top.
2. **Adjust card density** → change `minmax(340px, 1fr)` in `.grid`.
3. **Tweak spacing / radius** → modify padding and `--radius`.
4. **Add a light theme** → create a second set of variables under `[data-theme="light"]` and toggle the attribute from JavaScript.

---

## Notes

- No external CSS frameworks are used.
- All styles are self-contained.
- Prefer updating the CSS variables first before hard-coding new colours.
