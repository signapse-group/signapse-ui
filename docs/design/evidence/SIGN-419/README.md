# SIGN-419 News Outlet rendered evidence

Captured by the focused local fixture browser cases in [`news-outlets.spec.ts`](../../../../tests/e2e/news-outlets.spec.ts). The accepted direction is the News Outlet section on [parent SIGN-41](https://signapse-group.atlassian.net/browse/SIGN-41); the existing [SIGN-211 list pattern](../SIGN-211/list-1520x1024.png) was used for rendered comparison. The parent text supplied the list, form and responsive direction. Its reference attachments were not readable through the active Jira connector.

The read-only fixture grants only `news-outlet:read` and uses a non-HTTP homepage value (`ftp://fixture.example/source`). The test verifies list/detail navigation, hidden create/edit/delete actions, a disabled toggle, text rendering without an unsafe external link, the read-only detail state, and no horizontal overflow at 360, 390, 767, 768, 1024, 1439, 1440 and 1520 CSS-pixel widths. A 760×512 CSS-pixel viewport also covers the effective layout at 200% zoom for a 1520×1024 viewport.

The form fixture checks create denial for read-only access, allows create with `news-outlet:create`, verifies required-field semantics, and renders the update form with `news-outlet:read` plus `news-outlet:update`. It checks the status control, mobile overflow, and that browser console/page errors remain empty.

The Vietnamese locale and the browser project's normal `Asia/Ho_Chi_Minh` timezone are enabled. News Outlet timestamps render in UTC during SSR and first hydration, then switch to the viewer's local time after mount. This avoids replacing the list tree on hydration and preserves the existing local-time display. The screenshots are from the candidate represented by the PR description.

- [Read-only list, 1520×1024](news-outlet-read-only-list-1520x1024.png)
- [Read-only detail, mobile 390px wide](news-outlet-read-only-detail-mobile-390.png)
- [Create form, 1520×1024](news-outlet-create-form-wide-1520x1024.png)
- [Edit form, mobile 390×844](news-outlet-edit-form-mobile-390x844.png)

This is local fixture evidence only. QA/coordinator owns live UI/API, permission and persistence acceptance; no live feature testing was run.
