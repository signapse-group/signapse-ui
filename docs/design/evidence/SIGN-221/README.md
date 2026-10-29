# SIGN-221 approved Edit design comparison

The current approved references are attached to [parent SIGN-200](https://signapse-group.atlassian.net/browse/SIGN-200), design version `ai-connections-edit-20261028`: Desktop Edit frame `UEeu4` (attachment 10075) and Mobile Edit frame `UqQV9` (attachment 10074). Attachment 10050 is superseded and was not used.

These candidate renders were recaptured on 2026-10-29 by the targeted P0 browser case `matches the approved edit design at 1520x1600 and stays usable on mobile` in `tests/e2e/ai-provider-configs.spec.ts`. The source candidate revision is recorded in the PR description. The desktop uses a 1520×1600 CSS viewport at 100% zoom with the sidebar expanded. The mobile image is a full-page render at 390 CSS pixels wide with the sidebar hidden:

- [Desktop Edit, 1520×1600](edit-1520x1600.png)
- [Mobile Edit, 390px wide](edit-mobile-390.png)

The fixture uses Groq connection `#12`, a masked legacy key, and three task/model references. The approved frame uses DeepSeek connection `#1`; provider, identifier, description and key-preview text are fixture content. The comparison covers the card order, fixed-provider state, editable endpoint and description, masked key, blocked last-key and referenced-connection deletion, task/model references, and task-configuration link. Mobile keeps the approved AI connections > Edit breadcrumb while hiding Overview. The key validation helper uses the shorter mobile copy, and the task-configuration action keeps its leading arrow icon.

The targeted P0 design case passed (1/1). It checked body overflow at 360, 390, 767, 768, 1024, 1439, 1440 and 1520 CSS pixels, plus a 760×512 CSS viewport representing the effective layout width at 200% desktop zoom. It also checked keyboard order through endpoint, description and replacement-key fields, serious/critical axe findings on the desktop Edit frame, and the unsaved-draft dialog: Enter on Back opens it, Escape restores focus and retains the endpoint draft, and Discard returns to the connection list and clears the draft. The mobile render was captured and checked for horizontal overflow.

The focused navigation-retention P0 case passed (1/1): endpoint, description, replacement-key and new-key drafts survive exits through the breadcrumb, sidebar, browser Back and browser Forward, then restore on return to the edit route. Drafts stay in the authenticated app layout's in-memory provider; they are not written to browser storage. A hard unload still shows the browser's native unsaved-change warning.
