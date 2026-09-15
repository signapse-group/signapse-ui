## 1. Contract and localization

- [x] 1.1 Update the Vietnamese and English landing dictionaries with the approved Hero copy, four feature labels/links, four chapter copy sets, Telegram setup copy, revised navigation labels, and the approved three-step AnalysisFlow copy.
- [x] 1.2 Remove obsolete landing dictionary keys for the two Hero proofs, four-step AnalysisFlow, standalone WorkspaceAssistant, standalone Reaction & Evidence chapter, and removed `#workspace-ai` anchor.
- [x] 1.3 Update the landing access model and locale/hash helpers so the Hero secondary CTA targets `#product`, feature anchors are supported, and removed/unknown hashes are dropped while query strings are preserved.
- [x] 1.4 Synchronize the landing design document and domain glossary with the approved four-feature story, Telegram claim boundary, media slots, section order, and terminology.

## 2. Landing composition

- [x] 2.1 Reorder the route-local landing composition to Hero → ProductStory → AnalysisFlow → TrustBoundary → FinalAccessCta, with the existing public header and footer.
- [x] 2.2 Replace the Hero proof blocks with the four feature links and update the Hero secondary CTA while preserving auth-aware primary CTA behavior and the conceptual figure contract.
- [x] 2.3 Replace the three product chapters with Knowledge Graph, Live Charts, AI Assistant, and Telegram chapters, keeping reaction/source content inside Live Charts and workspace/history content inside AI Assistant.
- [x] 2.4 Remove the standalone WorkspaceAssistant section, standalone Reaction & Evidence chapter, old four-step flow presentation, repeated AnalysisFlow intro/arrow/AI note, and unused route-local helpers.
- [x] 2.5 Implement the four chapter media-slot composition with complete text-first fallbacks, copy-before-media DOM order, localized captions/alt text, and no unlabeled synthetic product UI.
- [x] 2.6 Apply the responsive layout rules: single-column feature chapters below 1200px, editorial copy/media composition at wide desktop, wrapped feature links, and no page-level horizontal overflow.

## 3. Product-proof media

- [x] 3.1 Add the route-local media slot contract for `knowledge-graph`, `live-charts`, `ai-assistant`, and `telegram`, including locale-independent slot IDs and text-first fallback behavior.
- [x] 3.2 Confirm that no approved product captures are present in the workspace and keep all four slots text-first without integrating unapproved Graph View, chart, AI, or Telegram assets.
- [x] 3.3 Verify each text-first slot's localized description, adjacent feature copy, stable DOM order, and absence of private data, fake metrics, or unapproved claims.

## 4. Contract and browser coverage

- [x] 4.1 Update component/static landing tests for the four-feature Hero, four product chapters, new section order, three AnalysisFlow steps, exact approved copy, removed legacy keys, and feature anchors in both locales.
- [x] 4.2 Update CTA and locale policy tests for `#product`, the four feature anchors, `#how-it-works`, query preservation, unsupported-hash removal, and anonymous/authenticated access destinations.
- [x] 4.3 Update landing browser tests for feature navigation, new responsive chapter order, mobile disclosure, keyboard focus, reduced motion, light/dark rendering, no-overflow breakpoints, and text-first media fallback.
- [x] 4.4 Add static checks that reject obsolete Hero proof copy, four-step AnalysisFlow copy, `#workspace-ai`, standalone Reaction & Evidence chapter, old Market Query claims, public Telegram-channel claims, and exclusivity claims.

## 5. Verification and handoff

- [x] 5.1 Run targeted landing component, policy, and browser tests and record any environment-only failures separately from implementation failures.
- [x] 5.2 Run `openspec validate --change "refocus-public-landing-features"` and confirm the delta specs contain complete MODIFIED/REMOVED requirement blocks with valid scenarios.
- [x] 5.3 Run lint, typecheck, production build, and repository diff checks for encoding/newline or unlocalized-copy regressions.
- [x] 5.4 Review the final diff for unchanged public-route protection, CTA destinations, Hero figure semantics, Telegram runtime boundaries, and absence of unrelated cleanup.

## 6. AI provider integration section

- [x] 6.1 Replace TrustBoundary with a localized responsive provider strip for OpenAI, Gemini, Anthropic, DeepSeek, Groq, and Z.AI while preserving `#trust` URL compatibility.
- [x] 6.2 Remove obsolete trust/enterprise dictionary keys and update Vietnamese and English provider copy.
- [x] 6.3 Synchronize landing content/design/spec artifacts and section-order assertions.
- [x] 6.4 Run targeted component tests, typecheck, lint, OpenSpec validation, and diff checks.

## 7. Provider logo marquee

- [x] 7.1 Add normalized local SVG marks and Anthropic to the MVP provider set.
- [x] 7.2 Replace the static wordmark grid with a slow CSS marquee and reduced-motion fallback.
- [x] 7.3 Update tests and planning artifacts, then run targeted verification and responsive visual review.

## 8. Provider rail visual refinement

- [x] 8.1 Remove the rail frame, item dividers, and motion control, then increase logo spacing.
- [x] 8.2 Apply provider-appropriate colors through the normalized SVG masks and shorten localized supporting copy.
- [x] 8.3 Update tests and design artifacts, then verify responsive and reduced-motion behavior.

## 9. Interactive showcase contract and localization

- [x] 9.1 Synchronize the landing design/content documents with the four-feature interactive product showcase, static-proof rollout, Scheduled Telegram DOM-simulation boundary, approved bilingual section copy, and forbidden delivery or threshold-alert claims.
- [x] 9.2 Replace the obsolete Showcase and Strategy dictionary contract with matching Vietnamese and English feature-selector, demo-control, workflow-state, accessibility, Replay, schedule-summary, and Telegram-preview messages.
- [x] 9.3 Update static policy checks so they permit only the labeled Scheduled Telegram simulation while continuing to reject private data, fake metrics, public-channel claims, arbitrary threshold alerts, manual AI-answer delivery, guaranteed outcomes, and delivery/read receipts.

## 10. Four-feature showcase shell

- [x] 10.1 Replace the current disconnected Showcase composition with one server-renderable shell containing Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram selectors in canonical order over one shared stage.
- [x] 10.2 Implement accessible vertical tab and tabpanel behavior with Scheduled Telegram selected by default, active-selector detail, pointer and keyboard selection, visible focus, and preserved state across tab changes.
- [x] 10.3 Reuse the locale-appropriate approved Knowledge Graph and Market Chart captures, add the localized static AI Conversation proof, and expose internal static versus interactive demo modes without public loading or coming-soon states.
- [x] 10.4 Implement the desktop selector/stage composition and narrow vertical selector-before-stage reflow with a stable footprint and no page-level horizontal overflow at required breakpoints or 200 percent zoom.

## 11. Scheduled Telegram Motion demo

- [x] 11.1 Add the `motion` production dependency and a route-local progressively loaded client renderer without adding a global Motion provider or changing the server-rendered landing shell.
- [x] 11.2 Implement the deterministic demo model for the active `Market Desk` destination, enabled Scheduled Market Analysis route, `Morning briefing` schedule, `Asia/Bangkok` timezone, supported asset/time/language selections, and localized message derivation.
- [x] 11.3 Implement reducer-owned workflow and playback states for Route ready, Configure, Scheduled, Scheduled run, Telegram preview, direct step selection, manual interaction, and Replay.
- [x] 11.4 Implement declarative Motion variants, one-shot viewport autoplay, document-visibility and feature-tab interruption, stable-state resume, stale-run cancellation, final-state hold, and no automatic replay on tab return.
- [x] 11.5 Implement the server-rendered labeled static Telegram proof, client-load failure behavior, and reduced-motion state changes while preserving controls, content, focus, and stage dimensions.
- [x] 11.6 Remove the old Strategy Coding showcase surface, code sample, and unsupported price-threshold Telegram alert without removing the separate Strategy capability elsewhere on the landing.

## 12. Showcase verification coverage

- [x] 12.1 Add a narrow reducer/lifecycle test for valid workflow progression, selection-derived message content, user interruption, Replay, offscreen waiting, and stale-run cancellation.
- [x] 12.2 Update localized landing composition tests for four selectors, canonical order, default Telegram selection, static and interactive proof modes, approved captures, AI text-first proof, server fallback, and removed Showcase content.
- [x] 12.3 Update browser tests for pointer and keyboard tab operation, asset/time/language controls, one-shot autoplay, manual interruption, preserved tab state, Replay, reduced motion, static fallback semantics, and absence of misleading delivery states.
- [x] 12.4 Verify the showcase at 375, 768, 1024, and 1440 CSS pixels and at 200 percent zoom for selector/stage order, readable content, visible focus, stable layout, and no horizontal overflow; run the existing axe pass.

## 13. Interactive showcase completion gates

- [x] 13.1 Run the targeted reducer, component, policy, and landing browser tests and record environment-only failures separately from implementation failures.
- [x] 13.2 Run lint, typecheck, production build, and bundle inspection; confirm the Motion renderer stays behind the showcase client path and the server-rendered fallback remains available.
- [x] 13.3 Run `openspec validate "refocus-public-landing-features" --type change --strict --no-interactive` and inspect the final diff for UTF-8/newline integrity, localized-copy parity, unchanged public-route/access behavior, and absence of unrelated cleanup.

Verification notes:

- The targeted reducer, component, policy, interaction, reduced-motion, responsive-order, and overflow checks pass.
- The repository unit suite had one unrelated timing failure in `telegram-configuration.component.test.tsx`; the same test passed immediately when rerun alone.
- The full landing browser run exposed existing failures in the header assertions and provider marquee accessibility. The showcase-specific browser tests pass, and the responsive assertions pass at 375, 768, 1024, 1440, and 200 percent zoom.

User-owned manual QA:

- Approve the four product-proof captures for seeded data, privacy, licensing, attribution, locale, crop, and claims.
- Confirm Telegram destination linking, configured alert routes, scheduled market analysis, and external delivery in an authorized environment.
- Review Vietnamese/English visual hierarchy in light/dark themes at the required breakpoints and 200% zoom.
- Review the fixed-palette showcase hierarchy, static feature proofs, Scheduled Telegram choreography, and localized message content on the application-host preview.
