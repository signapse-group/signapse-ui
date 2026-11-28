# SIGN-715 Signal Engine routing evidence

## Candidate and sources

- Repository: `signapse-group/signapse-ui`
- Branch: `codex/SIGN-715-signal-engine-routing`
- Base: `origin/dev` at `335c9601d7ff114fa5b039a740e5b9f3f9012d65`
- Requirement and approved design source: [SIGN-713](https://signapse-group.atlassian.net/browse/SIGN-713), attachment 10325 `signal-engine-approved-routing.png` and attachment 10327 `signal-engine-approved-preview-v2.png`.
- Responsive contract: `docs/design/DESIGN.md#responsive-contract`.
- Published producer contract: [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs), OpenAPI 3.1.0, build revision `c17dbc55644db1b154dd0cb9edc9115ab5f3a6fa` (fetched 2026-11-28 UTC).

## Design and render observation

The approved PNGs could not be opened in this session. The Jira attachment content request returned HTTP 403, and the authorized `downloadJiraIssueAttachment` connector is not available here. The local approved Pen Desktop MCP is also unavailable on this server; no Pen operation was run. This leaves the required comparison against attachments 10325 and 10327 unresolved.

No current-candidate render was captured. This checkout has no browser executable or Playwright/Puppeteer/render script, and no Preview candidate existed during the local implementation pass. Existing SIGN-392 Telegram routing captures are prior-candidate evidence for shared route controls only; they do not show Signal Engine or its preview modal and are not claimed as current evidence.

The active language set also remains unverified. An unauthenticated `GET /languages` returned 401; this session has no authenticated workspace context. The app dictionaries currently provide preview content for `vi` and `en`, with an app-locale fallback for other ISO codes. The coordinator should confirm the enabled codes or provide a supported authenticated context before AC3 is claimed for every selectable language.

The missing observation is the Signal Engine row and stacked Buy/Sell preview compared with the two approved PNGs, including 390×844, 1024×768, 1520×1024, 767/768 and 1439/1440 CSS px, light and dark themes, sidebar mode, mobile 360px, browser zoom 200%, and dialog focus/close behavior. The local Responsive Contract defines the expected reflow and no-overflow behavior. The coordinator must restore access to the approved PNGs and confirm the active language set; after that, FE can capture and compare the current candidate. QA retains live feature acceptance.

## Local behavior checks

- `pnpm exec vitest run tests/core/telegram-permissions.test.ts tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx` — passed (162 tests).
- `pnpm typecheck` — passed.
- `pnpm build` — passed; Next.js compiled, typechecked and generated all 55 static pages.
- Scoped ESLint for the changed TypeScript files — passed.
- `pnpm test:contract` — passed; fixture consistency for 88 OpenAPI operations.
- `git diff --check` — passed.

These checks cover permission gating, workspace scoping, sparse save/readback, disabled state preservation on rejection, eligible group filtering for group destinations, `vi`/`en` static samples, modal focus restoration and initial disabled/unassigned state. They do not establish rendered visual comparison, other enabled language codes, live authorization, live persistence, CI or Preview build status.
