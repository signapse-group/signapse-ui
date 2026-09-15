## Why

The public landing page does not currently make Signapse's four main product capabilities clear: Knowledge Graph exploration, live market charts, AI conversation with Knowledge Graph context, and Telegram updates. The current page gives too much weight to supporting concepts and leaves Telegram absent, so visitors cannot quickly understand the product's primary reasons to use it.

The current `SEE THE WORKFLOW` section also presents disconnected Graph, Chart, Telegram, and Strategy surfaces instead of one extensible product showcase. Telegram is a static alert card with unsupported threshold-alert wording, so visitors cannot experience how a supported scheduled asset analysis moves from configuration to a Telegram destination.

## What Changes

- **BREAKING** Replace the current landing message hierarchy with four primary feature chapters: Knowledge Graph, Live Charts, AI Assistant, and Telegram.
- Update the Hero headline and supporting copy so the four capabilities are visible in the first scan.
- Replace the two Hero proof blocks with feature links to `#knowledge-graph`, `#live-charts`, `#ai-assistant`, and `#telegram`.
- Change the Hero secondary CTA to “Khám phá tính năng” / “Explore features” linking to `#product`.
- Reorder the landing story to Hero → Product Story → Analysis Flow → AI Provider Integrations → Final CTA, with the public header and footer surrounding it.
- Replace the three existing product chapters with four editorial chapters and media surfaces for the four primary features.
- Fold reaction/source inspection into Live Charts and fold workspace/history support into AI Assistant; remove the standalone Workspace Assistant section and standalone Reaction & Evidence chapter.
- Add Telegram landing content covering linked destinations, configurable alert routes, economic-calendar updates, and scheduled per-asset market analysis from Signapse.
- Keep the approved three-step AnalysisFlow copy, move it after the feature chapters, and remove the obsolete four-step flow, intro repetition, and repeated AI note.
- Prepare localized product-proof media slots for Graph View, live chart, AI conversation, and Telegram message examples, with text-first fallback until each locale-appropriate asset is approved.
- Replace the disconnected `SEE THE WORKFLOW` composition with an interactive product showcase whose selectors present Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram in that order over one shared demonstration stage.
- Keep the approved Knowledge Graph and Market Chart captures as static showcase proofs, keep AI Conversation as a static text-first proof, and make Scheduled Telegram the default active and only interactive proof in this phase.
- Add a labeled, deterministic Scheduled Telegram DOM simulation for choosing a watched asset, local send time, and output language, then observing route readiness, schedule configuration, a scheduled run, and a Telegram message preview without calling a backend or sending Telegram.
- Add route-local Motion animation, progressive loading, one-shot viewport autoplay, manual interruption, Replay, reduced-motion behavior, and a server-rendered static fallback for the Scheduled Telegram demo.
- Remove the Strategy Coding surface and unsupported price-threshold alert example from `SEE THE WORKFLOW` without removing the separate Strategy capability elsewhere on the landing.
- Replace the low-value standalone trust section with a localized provider-integration section naming OpenAI, Gemini, Anthropic, DeepSeek, Groq, and Z.AI. Keep the existing `#trust` URL anchor compatible.
- Update supported feature anchors, locale-switch preservation, Vietnamese/English dictionaries, landing tests, and obsolete landing copy contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-landing-page`: Change the public landing positioning, Hero copy, CTA destination, feature story topology, AnalysisFlow order/content, Telegram claims, approved media slots, supported anchors, interactive showcase behavior, and Scheduled Telegram demo lifecycle.
- `product-localization`: Change the required localized landing dictionary contract to cover the four feature chapters, new Hero/CTA copy, three-step AnalysisFlow, feature anchors, media alternatives, showcase controls and states, and removal of obsolete landing keys.

## Impact

- Updates the public localized landing composition, its Vietnamese and English dictionaries, route-local styling, and feature-anchor behavior.
- Updates localized landing metadata-adjacent copy contracts only where required; no backend API, authentication, permission, or persistence changes.
- Adds landing media preparation/integration work for four product-proof surfaces. Approved assets must be locale-correct, privacy-safe, licensed, dimensioned, and accompanied by localized text alternatives.
- Adds the `motion` production dependency behind a route-local client boundary; the public landing keeps server-rendered showcase content and loads the interactive Telegram renderer near the viewport.
- Adds a deterministic public demo model only; no Telegram API, authentication, permission, workspace, persistence, or external-delivery behavior changes.
- Updates component, browser, localization, and static contract tests that currently assert the old eight-part topology, four-step AnalysisFlow, two Hero proofs, three product chapters, and legacy anchors.
- Preserves the existing auth-aware request-access/dashboard destinations, public-route protection, Hero conceptual figure behavior, metadata policy, and Telegram configuration runtime.
