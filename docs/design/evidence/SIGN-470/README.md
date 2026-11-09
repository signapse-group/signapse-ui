# SIGN-470 Quick News Article reader evidence

Captured from the focused local fixture browser case in [`quick-detail.spec.ts`](../../../../tests/e2e/quick-detail.spec.ts): “renders the complete localized Article within wide, compact, and mobile readers.” The rendered implementation is represented by code commit [`c610b51`](https://github.com/signapse-group/signapse-ui/commit/c610b51a1e815785df4ccde58af6bd9dfb8e2083).

The accepted direction is the Article reader detail in [parent SIGN-465](https://signapse-group.atlassian.net/browse/SIGN-465), with placement and responsive behavior following the [Quick Detail Overlay pattern](https://github.com/signapse-group/signapse-planing/blob/1b152a072884bc58759a0b46493e00497cdcd4b7/docs/frontend/signapse-entity-quick-detail.md) and [Responsive Contract](https://github.com/signapse-group/signapse-planing/blob/1b152a072884bc58759a0b46493e00497cdcd4b7/ui-design/references/DESIGN.md#responsive-contract). These screenshots show the Article surface within the existing dashboard shell; they do not represent the shared SIGN-468 header as a changed deliverable.

The fixture requests the Vietnamese locale and returns a long processed body, source snapshot, publication metadata, feature image, table and code block. The case verifies the full body and source/canonical actions, Article placement at wide (right drawer) and compact/mobile (bottom sheet) widths, local scrolling for wide Markdown regions, and no horizontal page overflow from 1520 down to 360 CSS pixels. It also checks the effective 200% layout width and confirms the request uses `vi`. Screenshots show the surface at 1520×1000, 1024×900 and 390×844, plus the end of the long mobile article.

- [Wide reader, 1520×1000](article-reader-wide-1520x1000.png)
- [Compact reader, 1024×900](article-reader-compact-1024x900.png)
- [Mobile reader, 390×844](article-reader-mobile-390x844.png)
- [Mobile reader at the end of the article, 390×844](article-reader-mobile-content-end-390x844.png)

This is local fixture evidence only. It does not cover live authentication, permissions, API integration or QA acceptance.
