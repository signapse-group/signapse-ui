# SIGN-437 invalid page render evidence

The screenshot was captured by the focused local P0 route check in [`ai-provider-configs.spec.ts`](../../../../tests/e2e/ai-provider-configs.spec.ts) after opening `page=0&size=10&sort=id_asc`.

- Canonical URL: `/vi/ai-provider-configs?page=1&size=10&sort=id_asc`
- Fixture request: `GET /ai-provider-configs?page=0&size=10&sort=id%2Casc`
- Render: first connection, page 1 and size 10
- Viewport: 1520×1024 CSS pixels, dark theme, expanded sidebar

The [dev OpenAPI contract](https://dev-api.signapse.cloud/v3/api-docs), fetched 2026-10-30 10:46 UTC, confirms that API pages are zero-based (`x-build-revision` `ec4d5376a4b8dd075db55525f602183f555a3c18`; SHA-256 `94206f0734ea0e11ce9b99375700805d4821b1c0e3c4106cbd8dfbd11c2275b5`).

The accepted basis is [SIGN-429](https://signapse-group.atlassian.net/browse/SIGN-429), [SIGN-193 AC-4 / TC-04 M07](https://signapse-group.atlassian.net/browse/SIGN-193), and the approved AI connections list in [SIGN-189](https://signapse-group.atlassian.net/browse/SIGN-189). Jira attachment 10031 was not readable through the active connector; the rendered pattern was compared with the existing [SIGN-211 list evidence](../SIGN-211/list-1520x1024.png).

This fixture check establishes the local route, API query, rendered page and browser history behavior. Live UI/API/auth/persistence remains with QA Retest [SIGN-444](https://signapse-group.atlassian.net/browse/SIGN-444).

- [Page zero normalized, 1520×1024](page-zero-normalized-vi-1520x1024.png)
