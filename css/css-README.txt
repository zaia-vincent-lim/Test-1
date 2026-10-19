# CSS Components

Styles are split into focused files so changes stay local.

| File            | Responsibility                                      |
|-----------------|-----------------------------------------------------|
| article-variables.css   | Design tokens (:root colours, radius, shadow)       |
| article-base.css        | Reset, body, main container                         |
| article-header.css      | Sticky header, search, selects, refresh btn, stats  |
| article-cards.css       | Grid layout + individual card styles                |
| article-modal.css       | Detail modal overlay and content                    |
| article-status.css      | Loading / empty / error, scroll status, responsive  |

## Load order (already set in article-index.html)

1. article-variables.css
2. article-base.css
3. article-header.css
4. article-cards.css
5. article-modal.css
6. article-status.css

## Quick customisation

- Change the whole colour scheme → edit variables.css only
- Adjust card density → edit the minmax() value in cards.css
- Mobile layout → edit the @media block in status.css
