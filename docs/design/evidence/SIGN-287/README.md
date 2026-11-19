# SIGN-287 Event link role evidence

Implementation source: [`8043c241251187fdac3cfe0a0199bc66874f58a8`](https://github.com/signapse-group/signapse-ui/commit/8043c241251187fdac3cfe0a0199bc66874f58a8), based on `origin/dev` [`3278deb69bc417da5dfbc2681e8d75046a909cd9`](https://github.com/signapse-group/signapse-ui/commit/3278deb69bc417da5dfbc2681e8d75046a909cd9).

## Design references

The Event Detail comparison uses SIGN-262's active Wide and Mobile references (Jira attachments 10286 and 10287, updated 2026-11-18). Quick Event uses SIGN-464's active Wide, Compact and Mobile references (attachments 10281, 10283 and 10285, updated 2026-11-18).

The candidate keeps the existing card composition and adds visible text labels for `PRIMARY_SUBJECT`, `AFFECTED_ASSET` and `REFERENCE_ASSET`. Their badge styles remain distinct: blue for the primary subject, neutral for affected assets and outlined for references. Related Themes stays a separate metadata section and shows only the producer's primary or secondary role. Quick Event keeps the same asset distinction and now exposes the theme metadata as well.

## Candidate renders

These captures come from the P0 fixture-backed browser test at the FE HTTP boundary. They are persisted by running that test with `SIGN287_CAPTURE_EVIDENCE=1`. Event `61` and the linked assets/themes are synthetic fixture data. No live producer event was mutated.

- Event Detail, dark, Vietnamese, 1520×1280 viewport, full-page output: [candidate render](event-detail-wide-dark-vi-1520x1280.png)
- Quick Event, light, Vietnamese, 1520×1440 viewport: [candidate render](quick-event-wide-light-vi-1520x1440.png)
- Quick Event, dark, Vietnamese, 390×844 viewport, asset and theme sections: [candidate render](quick-event-mobile-dark-vi-390x844-assets-and-themes.png)

The browser check also exercised Quick Event placement at 1024×900 and checked page width at 1520, 1024 and 390 CSS pixels. Event Detail SSR was checked at 1520 and 390 pixels. Both surfaces received the same empty-state title and description for `ENRICHMENT_NO_MATCH` and `ENRICHMENT_FAILED`; Event Detail retains the producer status label so those outcomes remain distinguishable.

## API and verification

The dev OpenAPI document was fetched from `https://dev-api.signapse.cloud/v3/api-docs` at 2026-11-19 18:16:04 UTC. Its `x-build-revision` was `60c7ea93296ed3552f75236114e25e94813a50ec`, matching the producer handoff for SIGN-285. The schema requires canonical asset and theme identity and relation types; the FE renders those values without inferring missing roles.

Fixture and component verification:

- `pnpm typecheck` — passed.
- Targeted ESLint for the changed UI, fixture and test files — passed.
- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 18 passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/event-links.spec.ts --retries=0` — 3 passed, including SSR, locale, role badges, both empty outcomes and wide/compact/mobile layout.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep "keeps Dashboard mounted while one Event session crosses placement breakpoints" --retries=0` — 1 passed.
- `pnpm test:contract` — fixture consistency passed for 88 operations.

These checks use local fixtures. QA still owns live feature-flow testing; the coordinator owns acceptance and delivery from the fresh In Review session.
