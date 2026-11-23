# SIGN-329 Connect new Telegram bot evidence

## Approved references

The dialog references are attached to [SIGN-31](https://signapse-group.atlassian.net/browse/SIGN-31): attachment 10310 (`telegram-connect-bot-desktop-20261123-v2.png`) and attachment 10311 (`telegram-connect-bot-mobile-20261123-v2.png`). The settings surface references are attached to [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32): attachments 10308 (`telegram-settings-wide-20261123-v2.png`), 10312 (`telegram-settings-compact-20261123-v2.png`), and 10309 (`telegram-settings-mobile-20261123-v2.png`). The responsive rules come from the [Responsive Contract](https://github.com/signapse-group/signapse-planing/blob/main/ui-design/references/DESIGN.md#responsive-contract).

## Candidate renders

Captured from the `codex/SIGN-329-connect-bot` working tree based on `fd9ba256091a259bd968c6f29a5eb169d004a736` (`origin/dev`) by the P0 Playwright fixture run. Wide captures use a 1520×1024 CSS viewport with the sidebar expanded. The compact capture uses 1024×768 with the sidebar collapsed. Mobile captures use 390×844 and 360×780 with the sidebar closed.

- [Create-only page, light, 1520×1024](connect-only-desktop-light-1520x1024.png)
- [Connect dialog, dark, 1520×1024](connect-dialog-desktop-dark-1520x1024.png)
- [Readback, dark, 1024×768 compact](readback-compact-dark-1024x768.png)
- [Readback, dark, 390×844 mobile](readback-mobile-dark-390x844.png)
- [Connect dialog, dark, 360×780 small mobile](connect-dialog-small-mobile-dark-360x780.png)

The fixture verifies create-only access without a list read, keyboard opening/submission and focus restoration, POST/readback of safe metadata, and responsive layout at 1520×1024, 1024×768, effective CSS width 760×512, 390×844, and 360×780. It asserts no token or owner data is exposed in fixture readback and reported no browser console or page errors. The 760×512 case simulates the layout width associated with 200% zoom; it is not native browser zoom and has no separate screenshot.

A red “1 Issue” badge appears in the lower-left of some captures from the local Next.js development overlay. It persisted with zero page/console errors and is not part of the Telegram UI. These are fixture renders only: they do not claim live API, authentication, QA, or dev deployment acceptance.
