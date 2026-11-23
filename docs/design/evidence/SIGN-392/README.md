# SIGN-392 rendered evidence

## Candidate and source

- Repository: `signapse-group/signapse-ui`
- Branch: `codex/SIGN-392-market-news-routing`
- Implementation commit: `501e081b36aa1253e09b0df427e7388f58b2d9d0`
- Review base: `origin/dev` at `fd9ba256091a259bd968c6f29a5eb169d004a736`
- Jira requirement and design source: [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32)
- Accepted design revision: v2, approved 2026-11-23. Compared the MARKET_NEWS_ALERT row position/grouping and its destination, language, switch, and clear control against attachments `10308` (`telegram-settings-wide-20261123-v2.png`), `10312` (`telegram-settings-compact-20261123-v2.png`), and `10309` (`telegram-settings-mobile-20261123-v2.png`). The clear action remains inside the destination field. The existing page shell and unrelated route/schedule controls stay in their established layout.

## Published API contract

Checked the published [dev OpenAPI document](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-23 at 18:00:54 UTC; `x-build-revision` was `cee1855e3032a3637353ef425b2678c2f7ea3442`.

- `GET /telegram/feature-settings` returns settings visible under route-specific read permission; workspace ownership remains required.
- `PUT /telegram/feature-settings` uses `telegram-market-news-routing:update` for `MARKET_NEWS_ALERT`. This is independent of the generic feature-setting update permission.
- Sparse updates preserve omitted fields. Clearing sends `destinationId: null` and `enabled: false` together, omitting language so the saved language remains. Disabling omits `destinationId`, retaining even an inactive destination. Assigning or enabling requires an eligible active destination and bot. Enabling without one returns 400; permission errors return 403; missing or unowned resources return 404.
- API responses always include `destination`, which can be `null`. The UI derives success from the confirmed save result, then refreshes/readbacks the stored state. On errors it keeps the previous saved selection visible.
- `Scheduled analysis` stays independently available under its schedule-read permission.

## Render comparison

All captures use the dark theme. PNGs are full-page captures; viewport and output image sizes are listed separately.

| Candidate render                                                          |    Viewport |    PNG size | Locale / state        | Source comparison                                                                                            |
| ------------------------------------------------------------------------- | ----------: | ----------: | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Wide](telegram-routing-wide-dark-en-1520x1024.png)                       | 1520 × 1024 | 1520 × 1226 | EN, sidebar expanded  | Attachment 10308; route remains in the desktop routing table.                                                |
| [Compact](telegram-routing-compact-dark-en-1024x768.png)                  |  1024 × 768 | 1024 × 1547 | EN, sidebar collapsed | Attachment 10312; market controls remain grouped and visible in the compact card.                            |
| [Mobile](telegram-routing-mobile-dark-en-390x1420.png)                    |  390 × 1420 |  390 × 2376 | EN, overlay closed    | Attachment 10309; destination, language, clear, and enabled controls stack within the market card.           |
| [Small mobile](telegram-routing-small-mobile-dark-vi-360x800.png)         |   360 × 800 |  360 × 2440 | VI, overlay closed    | Checks the narrow edge and localized labels.                                                                 |
| [Effective zoom viewport](telegram-routing-effective-760x512-dark-vi.png) |   760 × 512 |  760 × 1830 | VI, sidebar collapsed | Effective CSS viewport equivalent to 200% zoom from 1520 × 1024; this is not an actual browser zoom capture. |

Below 1440 CSS pixels, the market route uses a responsive card so its controls remain together; at 1440 and above it uses the existing table row. The browser checks covered widths 360, 390, 767, 768, 1024, 1439, 1440, and 1520. Page-level horizontal overflow was absent at each width. Existing generic route and schedule tables retain their own horizontal scrolling where needed.

## Local checks and limits

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts tests/core/telegram-permissions.test.ts` — 3 files, 20 tests passed. Covers dedicated read/update permission behavior, schedule permission separation, sparse requests, clear/pause/reassign/readback, API errors, localization, and keyboard use.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0` — 8 browser tests passed using the local fixture server; screenshots above came from this suite. It covers rendered breakpoints, localized controls, route permission isolation, save/error/readback behavior, and page overflow.
- `pnpm typecheck` — passed.
- Changed-file ESLint — passed.
- `pnpm test:contract` — fixture consistency passed for 90 OpenAPI operations.
- Prettier check and `git diff --check` — passed.

The browser fixture exercises the published contract shape but does not prove live API authorization or integration. No live feature test was run; QA owns the real dev flow, including permission, persistence, and readback verification after delivery. CI and the Vercel Preview check are attached to the PR before the In Review handoff.
