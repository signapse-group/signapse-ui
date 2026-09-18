# migrate-shadcn-wrappers-to-base-ui

2026-08-18 — expanded 30-wrapper Base Nova migration implemented and reconciled against the locked `base-nova` registry baseline. Automated verification passed, including deterministic P0 consumer-regression coverage.

## Changed

- Upgraded `shadcn` from `4.13.0` to `4.18.0` and added `@base-ui/react` `1.7.0`.
- Switched `components.json` to the official `base-nova` preset; shadcn resolves its Base UI context as `base: base`.
- Migrated all 30 installed shadcn wrappers and their affected consumers to Base UI contracts, including the Drawer wrapper and its live quick-detail consumer.
- Reconciled the canonical wrappers against `base-nova`: the final 30-component dry-run classified 15 as exact and 15 as formatting/import-only, with no remaining semantic/API/chrome diff. Formatting is intentionally deferred to the user; no formatter was run.
- Exact: `alert-dialog`, `badge`, `bubble`, `button`, `button-group`, `combobox`, `drawer`, `hover-card`, `item`, `label`, `marker`, `popover`, `separator`, `switch`, `tabs`.
- Formatting/import-only: `avatar`, `breadcrumb`, `checkbox`, `collapsible`, `context-menu`, `dialog`, `dropdown-menu`, `radio-group`, `scroll-area`, `select`, `sheet`, `sidebar`, `toggle`, `toggle-group`, `tooltip`.
- The semantic/API/chrome findings were reconciled at the wrapper or usage boundary: accessibility field-label classes in `checkbox`/`radio-group`/`switch`, canonical title/separator/menu chrome, Button extensions, root/type contracts, Sidebar canonical imports, and Tabs disabled-state classes.
- Added `components/ui/drawer-content-in-overlay.tsx` as the named portal-container extension for the quick-detail Drawer while keeping `components/ui/drawer.tsx` registry-shaped.
- Aligned the quick-detail Drawer consumer with the official Base UI sample: default intrinsic sizing, default shell chrome, `showSwipeHandle`, title-only header, no footer actions, and scrollable content; the consumer no longer supplies the previous fixed height or custom Drawer shell chrome.
- Added the official Base Nova `components/ui/combobox.tsx` wrapper and replaced the Telegram schedule timezone Popover/Command selector with its grouped Combobox composition, preserving the system-generated IANA timezone data, localized groups, labels, validation, and form/API contract.
- Replaced Radix `asChild` composition with Base `render`/`useRender` and `mergeProps`, preserving localized links, permissions, responsive behavior, focus handling, and Nova styling.
- Corrected the Button link consumer sweep: native action consumers remain `Button`, while internal and external links render as direct `Link`/`a` elements styled with `buttonVariants`; no anchor is rendered through the native `Button` primitive, eliminating the Base UI `nativeButton` warning.
- Corrected the remaining Base UI Select controlled-value gap: empty schedule destination/asset values and Telegram feature destination values now use `null` instead of `undefined`, preserving controlled lifetime and eliminating the Select warning.
- Corrected the Base UI Menu group-context gap: `DropdownMenuLabel` consumers in workspace, user, asset, and language menus now live inside `DropdownMenuGroup` or `DropdownMenuRadioGroup`; the canonical DropdownMenu wrapper remains unchanged.
- Kept required app-level extensions for overlay portal containers and editor/chart Popover anchors. `PopoverAnchor` now uses Base `useRender` for ref composition rather than `React.cloneElement`.
- Removed the standalone `radix-ui` and `vaul` packages from `package.json` and `pnpm-lock.yaml`; the documented `@radix-ui/react-toolbar` exception was subsequently removed by the dedicated Plate/editor Toolbar follow-up below.
- Follow-up `migrate-toolbar-to-base-ui` (2026-08-19) migrated the custom Plate/editor Toolbar to Base UI Toolbar and Toggle primitives, declared fixed/floating/table orientations, converted popup composition, split-list controls, and preserved the font-size input exception. Its direct Radix Toolbar dependency was removed from the manifest and lockfile.
- Follow-up verification passed: `pnpm test` (12 test files, 44 tests), `pnpm typecheck`, production build, focused ESLint for the changed P0 tests, and `git diff --check`. The full `pnpm lint` command remains blocked by unrelated pre-existing errors in search/editor/mobile-hook files; no formatter was run.
- The Select controlled-value regression harness reproduced the Base UI warning for `undefined → string` and passed for `null → string`; the affected consumer sweep now has no `Select` value fallback to `undefined`.
- The shadcn Base UI dry-run/diff path was verified against `base-nova` without writing files or using `--overwrite`.

## Left alone

- The custom Plate/editor Toolbar was intentionally handled in the dedicated follow-up change above rather than by rewriting the historical shadcn-wrapper migration scope.
- `cmdk`, `react-day-picker`, charts, and other third-party integrations remain unchanged. No non-Drawer Vaul consumer remains in the source tree, so the Vaul dependency was removed.
- The default Base UI Popover wrapper does not expose a compatibility `PopoverAnchor`; the five editor/node consumers use the external anchor composition instead.

## Behavior changes

- Base UI `render` replaces the Radix-only `asChild` prop at wrapper and consumer boundaries.
- Button link consumers use direct anchors/links with `buttonVariants` instead of `Button render`, so native link semantics are not replaced with button semantics.
- Select consumers use Base UI's nullable value and `items` contracts; ToggleGroup uses the Base `multiple` contract; state-control and overlay callbacks follow Base UI reason/cancel signatures.
- Menu group parts use the official Base UI context composition; labels are not rendered as direct children of `DropdownMenuContent`.
- Dialog, AlertDialog, Menu, Select, Popover, Tooltip, HoverCard, and Sheet preserve the app's external portal-container extensions rather than adding vendor-specific internals to the default wrappers.
- Drawer now follows the official Base UI swipe/stack model. The quick-detail surface uses the external Drawer portal extension so fullscreen market-chart overlays keep their local container.
- The quick-detail Drawer now uses Base UI intrinsic sizing with its default viewport cap and sample-aligned shell composition; feature content remains scrollable and the fullscreen portal extension remains external.
- Telegram schedule timezone selection now uses Base UI Combobox grouping, input search, empty state, keyboard navigation, and standard popup positioning while storing the same IANA timezone value.
- Canonical wrapper chrome no longer carries the app-only `cn-*` tokens or Button icon/data-marker extensions; the few required visual compositions stay at usage sites or named external extensions.
- The approved capability difference is the external Popover anchor composition described above; no Radix internals remain in the default Popover wrapper.

## Deterministic verification

- The P0 suite passes with 12 test files and 44 tests. Coverage includes Telegram schedule Select/Combobox behavior, Telegram feature-route Select behavior, WorkspaceSwitcher menu grouping, and EventTimeline link semantics.
- Registry diffs and static consumer sweeps remain the evidence for canonical wrapper parity; the change does not use a browser-based verification gate for responsive rendering, gesture, portal placement, or hydration behavior.
- Final Radix count for the 30-wrapper scope plus the Toolbar follow-up: 0 in-scope wrapper files and no direct `@radix-ui/react-toolbar` source import or manifest dependency remain.
- Static consumer sweep: no migrated app/component consumer retains `asChild` or the obsolete overlay callback props; no `Button` consumer renders a link target; the only remaining `asChild` token is the documented Toolbar type exclusion.
