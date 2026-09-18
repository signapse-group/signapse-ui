# toolbar

2026-08-19, hand migration using the local Base UI type declarations and supported overlay composition, migrated

## Changed

- `components/ui/toolbar.tsx:5` now maps the shared root, group, button, link, and separator to `@base-ui/react/toolbar`; pressed buttons use `@base-ui/react/toggle`, active selectors use `data-pressed`, disabled controls set `focusableWhenDisabled={false}`, and unused Radix toggle-group helpers were removed.
- `components/ui/toolbar.tsx:162` renders split-list actions as sibling Base UI Toolbar buttons inside a non-interactive visual group, preserving the existing Nova grouping and pressed presentation.
- `components/ui/fixed-toolbar.tsx:11` declares vertical Toolbar orientation; `components/ui/floating-toolbar.tsx:75` and `components/ui/table-node.tsx:913,920` declare horizontal orientation.
- Toolbar dropdown consumers in `components/ui/align-toolbar-button.tsx`, `components/ui/export-toolbar-button.tsx`, `components/ui/font-color-toolbar-button.tsx`, `components/ui/import-toolbar-button.tsx`, `components/ui/insert-toolbar-button.tsx`, `components/ui/line-height-toolbar-button.tsx`, `components/ui/more-toolbar-button.tsx`, `components/ui/table-toolbar-button.tsx`, `components/ui/table-node.tsx`, and `components/ui/turn-into-toolbar-button.tsx` now render the local menu trigger through the outer Toolbar button.
- `components/ui/list-toolbar-button.tsx` uses Base pressed state for the primary action and composes the secondary menu trigger as a sibling Toolbar button.
- `components/ui/emoji-toolbar-button.tsx` and `components/ui/callout-node.tsx` use a trigger-render adapter so Toolbar and non-Toolbar emoji controls both keep the supported Popover composition.
- `package.json` and `pnpm-lock.yaml` no longer declare `@radix-ui/react-toolbar`; `pnpm.cmd install --lockfile-only --offline` completed successfully.
- Confirmed the leftover scan is clean for the migrated source and dependency files: `rg -n "@radix-ui/react-toolbar|ToolbarToggleGroup|ToolbarToggleItem" components package.json pnpm-lock.yaml` returns no matches.
- Targeted ESLint passed for all changed Toolbar and emoji/callout files. The full `pnpm.cmd lint` run remains blocked only by seven pre-existing errors and unrelated warnings outside this migration.
- Final deterministic check passed: `pnpm.cmd typecheck`.

## Left alone

- `components/ui/font-size-toolbar-button.tsx` keeps its raw input outside the Toolbar roving-focus composite so native caret movement, Tab behavior, and the existing Popover interaction remain intact.
- `components/ui/dropdown-menu.tsx`, `components/ui/popover.tsx`, `components/ui/tooltip.tsx`, and their overlay-container extensions remain unchanged; the migration composes their public Base UI wrapper contracts at usage sites.
- Other Radix-backed UI wrappers and unrelated third-party integrations remain outside this component migration.

## Behavior changes

- Disabled Toolbar controls are skipped by Base UI roving focus through `focusableWhenDisabled={false}`.
- Fixed Toolbar arrow navigation is vertical; floating and table Toolbar arrow navigation remains horizontal.
- Toolbar pressed styling is driven by Base UI `data-pressed`/`aria-pressed` semantics instead of Radix `data-state`/`aria-checked` selectors.
- Dropdown and Popover controls use the supported Base UI direction with the Toolbar button as the outer rendered control; Tooltip keeps its inverse local-wrapper composition.
- The split-list primary action and menu trigger are separate sibling interactive elements, eliminating nested interactive markup.

## Verify by hand

- Focus the fixed Toolbar and verify Up/Down navigation, including skipping disabled controls; repeat Left/Right navigation in floating and table Toolbars.
- Verify pressed formatting states, dropdown and Popover open/close behavior, Escape dismissal, focus return, and Tooltip display.
- Activate both split-list portions and confirm the primary action does not open the menu and the secondary action does not invoke the primary action.
- Focus the font-size input and verify typing, Left/Right caret movement, Tab traversal, and Popover behavior.
- Check visual parity in fixed, floating, table, light/dark, and responsive layouts.
