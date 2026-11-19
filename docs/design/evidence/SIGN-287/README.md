# SIGN-287 Event link role evidence

Implementation source: [`8043c241251187fdac3cfe0a0199bc66874f58a8`](https://github.com/signapse-group/signapse-ui/commit/8043c241251187fdac3cfe0a0199bc66874f58a8), based on `origin/dev` [`3278deb69bc417da5dfbc2681e8d75046a909cd9`](https://github.com/signapse-group/signapse-ui/commit/3278deb69bc417da5dfbc2681e8d75046a909cd9). The review-evidence update is recorded in the current PR head.

## Design references

Event Detail uses SIGN-262's active Wide `event-detail-wide-20261118.png` (attachment 10286) and Mobile `event-detail-mobile-20261118.png` (10287). Quick Event uses SIGN-464's active Wide `quick-event-wide-20261118.png` (10281), Compact `quick-event-compact-20261118.png` (10283), and Mobile `quick-event-mobile-20261118.png` (10285). All five references were inspected from the current Jira attachments.

The candidate keeps the accepted card composition and adds visible localized text for `PRIMARY_SUBJECT`, `AFFECTED_ASSET` and `REFERENCE_ASSET`: blue for primary subject, neutral for affected assets and outlined for references. Related Themes remains a separate metadata section and displays only a primary or secondary role supplied by the producer. Quick Event exposes the same asset distinctions and theme metadata.

## Candidate renders

These captures come from the P0 fixture-backed browser test at the FE HTTP boundary. They are persisted by running the test with `SIGN287_CAPTURE_EVIDENCE=1`. Event `61` and its links are synthetic fixture data; no live producer event was changed.

- Event Detail, dark, Vietnamese, 1520×1280, full page: [candidate render](event-detail-wide-dark-vi-1520x1280.png). Compared with SIGN-262 attachment 10286 for section order, card grouping and role text.
- Event Detail, dark, Vietnamese, 390×844, full page: [candidate render](event-detail-mobile-dark-vi-390x844.png). Compared with SIGN-262 attachment 10287 for single-column cards, spacing and labels.
- Event Detail, dark, Vietnamese, effective 720×900 CSS viewport: [candidate render](event-detail-dark-vi-effective-720x900.png). This is the 200% layout width for a 1440px CSS frame; all three asset labels and both theme roles remain present without page-level horizontal overflow.
- Quick Event, light, Vietnamese, 1520×1440: [candidate render](quick-event-wide-light-vi-1520x1440.png). Compared with SIGN-464 attachment 10281 for role badges and card grouping.
- Quick Event, dark, Vietnamese, 1024×900, asset and theme sections: [candidate render](quick-event-compact-dark-vi-1024x900-assets-and-themes.png). Compared with SIGN-464 attachment 10283 for the compact bottom sheet, asset grid and role text.
- Quick Event, dark, Vietnamese, 390×844, assets and themes: [candidate render](quick-event-mobile-dark-vi-390x844-assets-and-themes.png). Compared with SIGN-464 attachment 10285 for mobile card stacking and labels.
- Quick Event, dark, Vietnamese, effective 720×900 CSS viewport, assets and themes: [candidate render](quick-event-dark-vi-effective-720x900-assets-and-themes.png). This is the 200% layout width for a 1440px CSS frame.

The browser test also checks both surfaces at 360px CSS width, including while Quick Event remains open. It checks the Quick Event placement at 1520, 1024, 720, 390 and 360 CSS pixels and asserts no page-level horizontal overflow at each width. The 720px width models the effective CSS layout width of a 1440px frame at 200% zoom. Event Detail SSR stays checked at 1520, 390, 360 and 720 pixels. Both surfaces receive the same empty-state title and description for `ENRICHMENT_NO_MATCH` and `ENRICHMENT_FAILED`; Event Detail retains the producer status so those outcomes remain distinguishable.

## API and verification

The dev OpenAPI document was fetched from `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-19. Its `x-build-revision` was `60c7ea93296ed3552f75236114e25e94813a50ec`, matching the producer handoff for SIGN-285. The schema requires canonical asset and theme identity and relation types; the FE renders those values without inferring missing roles.

Fixture and component verification:

- `pnpm typecheck` — passed.
- Targeted ESLint for the changed UI, fixture and test files — passed.
- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 18 passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/event-links.spec.ts --retries=0` — 3 passed; covers SSR, locale, roles, empty outcomes, source-matched views, 360px and 200%-effective width.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep "keeps Dashboard mounted while one Event session crosses placement breakpoints" --retries=0` — 1 passed.
- `pnpm test:contract` — fixture consistency passed for 88 operations.

These checks use local fixtures. QA owns live feature-flow testing; the coordinator owns acceptance and downstream routing. Two visible differences are baseline-only and unchanged by SIGN-287: the shared Quick Event drawer truncates the title and puts the full-page text action below it, and the floating “Ask Signapse” button overlaps existing Event Detail content at the 390px and effective 720px views. The coordinator can route both to their shared owners separately.
