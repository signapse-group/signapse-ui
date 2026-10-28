# SIGN-221 approved Edit design comparison

The current approved references are attached to [parent SIGN-200](https://signapse-group.atlassian.net/browse/SIGN-200), design version `ai-connections-edit-20261028`: Desktop Edit frame `UEeu4` (attachment 10075) and Mobile Edit frame `UqQV9` (attachment 10074). Attachment 10050 is superseded and was not used.

These candidate renders were captured on 2026-10-28 by the targeted P0 browser case in `tests/e2e/ai-provider-configs.spec.ts` after applying the PR follow-up. The desktop uses a 1520×1600 CSS viewport at 100% zoom with the sidebar expanded. The mobile image is a full-page render at 390 CSS pixels wide with the sidebar hidden:

- [Desktop Edit, 1520×1600](edit-1520x1600.png)
- [Mobile Edit, 390px wide](edit-mobile-390.png)

The fixture uses Groq connection `#12`, a masked legacy key, and three task/model references. The approved frame uses DeepSeek connection `#1`; provider, identifier, description and key-preview text are fixture content. The comparison covers the card order, fixed-provider state, editable endpoint and description, masked key, blocked last-key and referenced-connection deletion, task/model references, and task-configuration link.

The targeted P0 case passed (1/1). It checked body overflow at 360, 390, 767, 768, 1024, 1439, 1440 and 1520 CSS pixels, plus a 760×512 CSS viewport representing the effective layout width at 200% desktop zoom. It also checked keyboard order through endpoint, description and replacement-key fields, plus serious/critical axe findings on the desktop Edit frame. The mobile render was captured and checked for horizontal overflow.
