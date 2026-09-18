---
status: accepted
---

# Use progressive WebGL for the landing context figure

Signapse will replace the public landing Hero's static conceptual diagram with a route-local interactive market-context figure derived from the approved v9 Three.js demo. The figure presents the Market Knowledge Graph and price action as complementary views rather than a product capture or a claim that the graph generates prices; it preserves the surrounding Hero and uses a server-rendered static dual-view fallback, a narrowly scoped client island, pinned Three.js dependencies, localized pointer/touch/keyboard controls, theme parity, reduced-motion behavior, and bounded rendering that stops when idle, hidden, or offscreen.

## Consequences

- The landing design contract must explicitly permit this interactive conceptual figure and its narrow animation-dependency exception without broadening product claims.
- Exact demo page chrome, copy, fixed dark palette, `role="application"`, large standalone Hero geometry, and continuous unbounded rendering are not part of the adopted visual.
- The production build keeps the renderer behind the dynamic client boundary and out of the initial landing HTML; the current build emits approximately 697 KB and 43 KB uncompressed client chunks containing the figure/Three.js code, while the server-rendered Hero HTML remains free of renderer runtime code.
- Behavior and layout are automated implementation gates; GPU-dependent pixel snapshots are not. Product visual sign-off remains a user-owned release check under the existing staged-cutover decision.
