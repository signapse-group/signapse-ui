# Overview design conformance evidence

Candidate: the source and fixture tests in this commit, based on FE `dev` at `43d0fae51cd28e43e52ce133b00a2d7adc41ff72`. Captured on 2026-11-08 with Chromium and the local secret-free fixture. These are contribution checks, not live QA or parent acceptance.

## Accepted source and comparison

The accepted source is [SIGN-194](https://signapse-group.atlassian.net/browse/SIGN-194), replacement artifacts dated 2026-11-02: attachment **10129 / Tq0T3** (Wide), **10130 / IrgDW** (Compact), and **10131 / W7Xxp** (Mobile). They are also available in the [Planning export directory](https://github.com/signapse-group/signapse-planing/tree/main/ui-design/pen/exports/overview-reference-20261102). Downloaded Jira bytes were verified against those exports; SHA-256 values in that order are `ED8B069966C5E504769E93A8F60272728808E4AA20BF60FF4F81F3609AFE6570`, `F28AC919B5365923CB197A459C6133815F0742002C74503154997F682D648583`, and `A077EC9D33F629420EA1A2C7C99D9558BF99230330CC8D75D028DD77B34CB70A`. Older same-name/frame artifacts are historical.

The current Pen reusable origins were read through Pen MCP to verify both theme values. Each pair below is background / foreground. Browser checks assert the resolved colors on the rendered badge rather than just its class.

| Fixed choice | Light | Dark | Actual |
| --- | --- | --- | --- |
| Equity / info blue | `#e0f2fe / #075985` | `#082f49 / #7dd3fc` | Matches in workspace and Assets in focus. |
| ETF and Emerging / purple | `#ede9fe / #5b21b6` | `#2e1065 / #c4b5fd` | Matches in workspace, Assets in focus and Market narratives. |
| Commodity / amber | `#fef3c7 / #92400e` | `#451a03 / #fcd34d` | Matches in workspace and Assets in focus. |
| Active / cyan | `#cffafe / #155e75` | `#083344 / #67e8f9` | Matches in Market narratives. |
| Weakening / slate | `#e2e8f0 / #334155` | `#1e293b / #cbd5e1` | Matches in Market narratives. |
| Neutral symbol / related asset chips | Shared neutral presentation | Shared neutral presentation | Retained. Unspecified CRYPTO/FX/INDEX categories retain the neutral default. |
| Latest news scope | Neutral Global badge by title | Neutral Global badge by title | Present, localized as Global / Toàn hệ thống. |
| Module action entry path | Visible text under description on Compact/Mobile; at right on Wide | Same layout | Restored for Event timeline, Latest news, Assets in focus and Market narratives. Workspace Manage action also follows its description on Mobile. |
| Announcement hierarchy and impact | Title primary, time beneath; currency and High readable | Same hierarchy | Existing code satisfies the newer [SIGN-195](https://signapse-group.atlassian.net/browse/SIGN-195) decision of 2026-11-05. That decision supersedes the older timestamp-first snapshot; this structure was retained. |

All five color pairs have text contrast from **6.37:1 to 10.39:1**. Text labels remain the primary semantic cue. The additive shared variants leave existing Badge defaults unchanged; the new category helper has two Overview callers, and the lifecycle mapping remains within Market narratives.

The candidate uses synthetic fixture titles, counts and dates to expose all three categories and lifecycles together. Those data differ from the source examples. Existing localization and full titles can also produce different wrapping. These differences do not change the fixed category colors, scope cue or action entry path. The screenshot's personal-note and assistant triggers are existing application UI.

## Candidate renders

| Render | Theme / viewport | Sidebar |
| --- | --- | --- |
| [Wide English](wide-dark-en.png) | Dark, 1520×1000 | Expanded |
| [Wide English](wide-light-en.png) | Light, 1520×1000 | Expanded |
| [Wide Vietnamese](wide-dark-vi.png) | Dark, 1520×1000 | Expanded |
| [Compact Vietnamese](compact-dark-vi.png) | Dark, 1024×900 | Collapsed |
| [Mobile Vietnamese](mobile-dark-vi.png) | Dark, 390×844 | Mobile closed |
| [Small Mobile Vietnamese](small-mobile-dark-vi.png) | Dark, 360×780 | Mobile closed |

Wide dark/light renders show all three asset categories and all three lifecycles in the same state. The compact/mobile renders show the full module headers and their visible action labels. The layout checks inspect actual text and bounding boxes, not hidden accessible labels. Tailwind's generated `max-[1440px]` query is `@media not (min-width: 1440px)`, so it applies strictly below 1440px; the existing Wide layout begins at 1440px.

## Verification and instruction walkthrough

- `pnpm test:quality`: passed, including 88 Vitest files / 610 tests, typecheck, 83-operation fixture guard and 5 deploy-verifier tests. ESLint reports 23 existing warnings outside this change and no errors.
- `pnpm test:browser tests/e2e/dashboard-overview.spec.ts`: 5/5 passed, including both themes, responsive hierarchy, navigation, keyboard/dialog focus, scope changes and independent error states.
- After the final workspace mobile-header adjustment: 10 focused component tests and the two affected Overview browser cases passed. The final captures correspond to that adjustment.
- Documentation paths/anchors and `git diff --check` were checked before publication.
- Instruction entry paths: AGENTS routes every affected direct or assigned UI task to the local design gate; Ready/Progress/In Review runbooks route their respective phase and resume to that same owning rule. No Jira or PR lifecycle is introduced for ordinary direct work.
- Historical mismatch walkthrough: a record naming 02/11 but opening attachment 10053/10054 fails artifact identity; a generic existing-pattern fallback cannot prove a fixed badge color; a light capture cannot establish a dark requirement; unchanged reused UI in the assigned surface still needs assessment.
- Outside-Overview walkthrough: a future UI feature using a fixed status color follows the same gate and shared badge rule. FE may complete ordinary spacing/state details; a new shared variant or unresolved fixed choice requires a bounded design-system decision rather than silently using the closest existing color.

Live feature verification, deployed revision confirmation and product acceptance remain separate from this fixture evidence.
