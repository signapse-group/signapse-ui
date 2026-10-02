---
status: accepted
---

# Use a fixed branded composition for the public landing

The public Signapse landing will render a route-scoped fixed navy-and-mint composition instead of inheriting the protected application's light/dark palette. It uses the approved Signapse palette with dark header, Hero, final CTA, and footer surfaces plus off-white content surfaces; it leaves global tokens and the visitor's stored dashboard theme preference unchanged. This supersedes the landing-specific theme-parity guidance while preserving the Hero figure's geometry, interaction, accessibility, lifecycle, and performance decisions from ADR-0010.

## Consequences

- Landing descendants resolve semantic colors from their route-local palette owner, so changing or persisting the application theme does not recolor the public landing.
- The landing logo and Hero renderer must choose colors from the landing surface/palette rather than the document's `.dark` class.
- Product demos render from code using route-local frames and landing tokens. Product screenshots and their fallback catalog were retired on 2026-10-02.
- The dashboard and shared Nova wrappers retain their existing neutral light/dark behavior.
- Automated landing tests must cover both global theme settings, preference preservation, palette isolation, and the existing responsive/accessibility/figure contracts. Final WebGL visual review remains a user-owned preview check.
