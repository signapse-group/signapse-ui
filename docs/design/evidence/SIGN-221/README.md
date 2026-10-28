# SIGN-221 approved design comparison

The approved current Edit references are attached to [parent SIGN-200](https://signapse-group.atlassian.net/browse/SIGN-200), design version `ai-connections-edit-20261028`: Desktop Edit frame `UEeu4` (attachment 10075) and Mobile Edit frame `UqQV9` (attachment 10074). Attachment 10050 is superseded and was not used as the target.

These candidate renders were captured by the P0 browser suite from commit `fc87bec` with dark mode and the fixture connection detail loaded. The desktop uses a 1520×1600 CSS viewport at 100% zoom with the sidebar expanded. The mobile image is a full-page render at 390 CSS pixels wide with the sidebar hidden:

- [Desktop Edit](edit-1520x1600.png)
- [Mobile Edit](edit-mobile-390.png)

The fixture uses Groq connection `#12`, a masked legacy key, and three task/model references. The approved frame uses DeepSeek connection `#1`; provider, identifier, description, and masked-key text are dynamic. The card order, fixed-provider state, editable endpoint and description, key controls, referenced-connection delete block, task labels/models, and task-configuration link follow the approved layout.

The P0 browser suite passed 7/7. It checked body overflow at 360, 390, 767, 768, 1024, 1439, 1440, and 1520 CSS pixels, plus a 760×512 CSS viewport representing the effective layout width at 200% desktop zoom. Keyboard order and serious/critical axe findings were checked on the edit frame.
