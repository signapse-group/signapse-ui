## Context

The current public landing page is a route-local server-rendered story with a client-only conceptual Hero figure, localized dictionaries, an auth-aware access model, and browser coverage for public routing, section order, locale switching, responsive overflow, and accessibility. Its content contract currently presents three product chapters and a separate Workspace/Assistant section, while Telegram is excluded from the primary story.

The approved direction makes four capabilities the primary product story: Knowledge Graph exploration, live market charts, AI conversation with Knowledge Graph context, and Telegram updates. The existing landing route, CTA destinations, Hero figure behavior, public-route policy, and shared design system remain the technical base. The change is a content and composition migration, with approved product media prepared as explicit proof slots.

The existing `SEE THE WORKFLOW` section is a server-rendered showcase containing approved Graph and Chart captures, a static Telegram alert card, and a Strategy Coding card. It does not provide a shared feature-selection model or an interactive product workflow. The refined direction replaces that composition with an interactive product showcase modeled as four feature selectors and one shared stage. Scheduled Telegram is the first interactive DOM simulation; the other three features remain complete static proofs until their later phases.

Constraints:

- Keep the landing public and the dashboard/application/API routes protected.
- Preserve the existing request-access, sign-in, dashboard, metadata, locale, and Hero interaction contracts unless explicitly changed by this design.
- Use only runtime-supported claims. Telegram copy may describe configured alerts and scheduled per-asset analysis, but must not imply a public channel, arbitrary threshold alerts, manual AI delivery, guaranteed delivery, or commercial exclusivity.
- Keep Vietnamese and English copy dictionary-backed and semantically equivalent.
- Keep the product-capture approval policy intact. The only synthetic product-like surface permitted by this phase is the explicitly labeled, deterministic Scheduled Telegram DOM simulation defined by this change; it must not be presented as a screenshot, live session, backend result, or delivery proof.

## Goals / Non-Goals

**Goals:**

- Make the four primary capabilities recognizable in the first scan and through direct feature anchors.
- Give each capability one editorial chapter with a concrete outcome, concise explanation, and product-proof media slot.
- Move the three-step AnalysisFlow after the feature story while preserving its approved copy.
- Explain Telegram as a configured delivery channel for news alerts, economic-calendar updates, and scheduled market analysis.
- Preserve truthful AI, chart, Knowledge Graph, Telegram, access, localization, accessibility, and responsive behavior.
- Replace obsolete landing copy, anchors, section topology, and test expectations in one coherent change.
- Establish one reusable four-feature showcase shell while completing only the Scheduled Telegram interactive renderer in this phase.
- Let visitors change the demo asset, local send time, and output language and observe a bounded scheduled-analysis workflow without external effects.
- Keep the showcase readable and useful through server rendering, failed client loading, reduced motion, narrow viewports, and 200% zoom.

**Non-Goals:**

- Changing backend contracts, Telegram configuration behavior, AI conversation behavior, Graph View behavior, market-chart behavior, permissions, or authentication.
- Building Telegram onboarding, a public Telegram channel, threshold-alert configuration, or a manual “send this AI answer” workflow.
- Adding graph-node-to-chat behavior, automatic chart-context handoff to AI, streaming tokens, evidence sheets, pricing, CRM, analytics, or request forms.
- Redesigning the Hero WebGL figure.
- Building interactive renderers for Knowledge Graph, Market Chart, or AI Conversation.
- Calling Telegram or application APIs, authenticating a public visitor, provisioning a workspace, linking a bot or destination, or sending a real Telegram message from the landing.
- Adding GSAP, XState, Canvas, WebGL, video, a global animation provider, or a second animation engine to the showcase.
- Deploying the landing, changing the public origin, or performing apex cutover.

## Decisions

### 1. Keep one route-local landing composition and change the story topology

The existing landing page remains the composition owner. Its named sections are reorganized to render Hero, ProductStory, AnalysisFlow, ProviderIntegrations, FinalAccessCta, and Footer. The standalone WorkspaceAssistant section is removed, and Reaction & Evidence becomes supporting content inside the Live Charts chapter.

Alternatives considered:

- Add a second marketing page for the four features: rejected because it would split the public product story and duplicate CTA/locale behavior.
- Keep the current three chapters and add Telegram as a fifth chapter: rejected because the agreed product hierarchy has four primary features and supporting concepts should not compete with them.

### 2. Use four editorial chapters instead of a feature-card grid

ProductStory uses four sufficiently wide chapters in this order: Knowledge Graph, Live Charts, AI Assistant, Telegram. Each chapter contains a localized eyebrow/name, outcome heading, concise body, and a media slot. On desktop, copy and media may alternate; on narrow viewports, copy precedes media. Reaction/source inspection belongs to Live Charts, and workspace/history details belong to AI Assistant.

Alternatives considered:

- Four equal compact cards: rejected because the content is too important for small card copy and the landing direction calls for editorial product chapters.
- Keep a separate section for every supporting concept: rejected because it recreates the current dilution problem.

### 3. Use feature anchors and one feature CTA path

The Hero replaces the old two proof blocks with links to `#knowledge-graph`, `#live-charts`, `#ai-assistant`, and `#telegram`. The Hero secondary CTA goes to `#product`; the header keeps “How to use” / `#how-it-works` as navigation. Locale switching preserves the supported feature anchors and drops unknown hashes.

Alternatives considered:

- Keep the Hero secondary CTA on `#how-it-works`: rejected because the new first action is feature discovery; the usage flow follows the feature proof.
- Use separate routes for each feature: rejected because the current landing is a single public product story and no new routes are required.

### 4. Keep approved copy and claims in the landing design contract

The Hero and four chapters use the Vietnamese and English copy recorded in `docs/design/LANDING.md`. The AI chapter describes Knowledge Graph context for text conversation and persisted workspace history. The Telegram chapter describes linking a destination, choosing configured content routes, and scheduling analysis for a tracked asset. It uses “bản phân tích từ Signapse” / “market analysis from Signapse” and does not imply exclusivity.

Alternatives considered:

- Use broader “AI-powered” or “exclusive analysis” marketing claims: rejected because they do not map cleanly to runtime evidence and would weaken the claim boundary.
- Describe Telegram only as a generic integration: rejected because the actual value is the three configured update flows.

### 5. Keep approved captures and text-first proofs distinct from the labeled DOM demo

The four product chapters retain their product-proof contract. In the shared showcase stage, Knowledge Graph and Market Chart reuse their existing approved captures, AI Conversation uses a complete static text-first proof, and Scheduled Telegram uses the labeled interactive DOM simulation. The simulation uses fixed public demo data and is not an approved product capture, screenshot, live workspace, backend result, or delivery record.

Alternatives considered:

- Generate illustrative screenshots: rejected by the landing media policy and because they could be mistaken for runtime proof.
- Replace all four feature stages at once: rejected because the phased rollout needs one complete interactive renderer before committing to three more implementations.
- Show spinners, skeletons, or public “Coming soon” labels for the remaining features: rejected because the approved captures and text-first AI proof already communicate useful product value without implying that content is loading.

### 6. Reuse the existing verification seams

Component/static rendering tests continue to assert localized composition and exact section semantics. Browser tests continue to cover public routes, CTA state, locale switching, mobile disclosure, figure interaction, responsive overflow, reduced motion, metadata, and axe checks. The full localized landing and browser-visible showcase are the primary seams. A narrow reducer test covers only deterministic workflow transitions, interruption, Replay, stale-run cancellation, and selection-to-message mapping that would otherwise require timing-sensitive browser assertions. GPU-dependent or animation pixel snapshots are not release gates.

Alternatives considered:

- Add a separate landing test harness: rejected because the existing component and Playwright seams already observe the external behavior at the right level.

### 7. Use a compact provider wordmark strip before conversion

The former TrustBoundary section becomes ProviderIntegrations and names OpenAI, Gemini, Anthropic, DeepSeek, Groq, and Z.AI as the MVP provider set. The section keeps the existing `#trust` anchor so saved locale-switch URLs remain valid, while its internal section identifier becomes `ai-providers`. Normalized SVG marks use their appropriate brand colors and move in an open, borderless CSS marquee with generous spacing. Reduced-motion users receive a static horizontally scrollable fallback. The concise risk boundary remains available in the Hero and Footer copy.

### 8. Use one four-feature tab model and one shared demonstration stage

The showcase presents Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram in that order through a semantic vertical tablist and one shared tabpanel. Scheduled Telegram is selected by default because it is the only interactive renderer in this phase. On desktop, the tablist occupies the editorial column and the stage occupies the wider visual column. On narrow viewports and at 200% zoom, the same tab semantics remain in a vertical list above the stage; the implementation does not switch to a dropdown or a second accordion interaction model.

The active selector expands its localized outcome and description while inactive selectors stay concise. The showcase shell uses restrained CSS transitions only. Leaving the Scheduled Telegram tab cancels its scheduler and preserves its stable state; returning to it does not replay automatically.

Alternatives considered:

- Use an accordion because the visual reference expands the active item: rejected because all selectors replace one shared stage rather than reveal content beneath each trigger on desktop.
- Disable the three static selectors: rejected because each has a complete proof and must remain explorable before its interactive renderer is built.
- Select Knowledge Graph by default because it is first: rejected because the initial viewport experience would show a static proof instead of the phase's completed interactive workflow.

### 9. Model Scheduled Telegram as a deterministic local workflow

The demo starts with an active `Market Desk` Telegram destination, an enabled Scheduled Market Analysis route, a `Morning briefing` schedule, and the `Asia/Bangkok` schedule timezone. The visitor may choose XAU/USD or BTC/USD, 08:00 or 18:00 as the local send time, and Vietnamese or English as the schedule output language. The call to action is “Xem luồng gửi” / “View delivery flow”; the demo does not expose a manual send action.

A reducer owns the selected values, the stable workflow step, and the playback mode. The sequence advances through Route ready, Configure, Scheduled, Scheduled run, and Telegram preview, then holds the final state. The message preview is derived deterministically from the selected values and carries a visible Demo label. It states that the scheduled market analysis has been prepared and directs the visitor to Signapse to review context and sources before making a decision. It does not contain market prices, recommendations, signals, read receipts, delivery receipts, threshold-alert claims, or private data.

Alternatives considered:

- Recreate bot and destination linking before schedule creation: rejected because it obscures the scheduled-analysis value and expands the public simulation into authentication and infrastructure workflows.
- Let visitors edit every production schedule field: rejected because the landing needs a guided workflow rather than a second configuration application.
- End on “Delivered” or “Read”: rejected because the local simulation cannot prove Telegram acceptance, recipient delivery, or reading.

### 10. Scope Motion to the Scheduled Telegram client island

The implementation adds the `motion` production dependency and uses its current React entry point inside the Scheduled Telegram renderer only. The showcase heading, selectors, static feature proofs, and static Telegram fallback remain server-renderable. A small client gate loads the interactive renderer and its DOM feature bundle when the showcase approaches the viewport. The initial server and client state is deterministic and keeps a stable stage footprint.

Declarative variants translate reducer states into visual states. `LazyMotion` and the DOM feature bundle provide element animation, `AnimatePresence` owns message entry and exit, `useInView` supplies viewport state, and `useReducedMotion` supplies the user's motion preference. Motion does not own business state, no global Motion provider is added, and imperative selector timelines remain outside the initial implementation.

Alternatives considered:

- CSS or Web Animations API only: rejected for this phase because subsequent interactive feature demos are expected and a shared React animation vocabulary is now intentional.
- GSAP timeline: rejected because this workflow is interruptible, state-driven, and does not require pinned scroll choreography.
- Eagerly include Motion in the initial landing client path: rejected because the below-fold demo can preserve server content while deferring its animation runtime.

### 11. Make autoplay bounded, interruptible, and optional

When Scheduled Telegram remains active and roughly 40 percent of the showcase is visible, the demo autoplays once per page view through a sequence of approximately 3.1 seconds. It does not loop. Pointer, focus, or selection interaction switches playback to manual until Replay. Leaving the viewport or hiding the document prevents the next transition; a short in-flight tween may settle. Re-entering resumes from the current stable step only when no manual interaction has occurred. Replay resets the workflow while preserving the current selections; if offscreen, it waits for visibility before running.

A run identifier or abortable scheduler prevents callbacks from earlier runs changing a later state. Reduced-motion users receive the same controls and state changes without interpolated movement. If client code or Motion does not load, the server-rendered destination, schedule summary, and labeled static message preview preserve the essential story without claiming delivery.

Alternatives considered:

- Continuous autoplay: rejected because it competes with reading, wastes offscreen work, and requires additional pause controls.
- Reset every time the Telegram tab becomes active: rejected because it discards user selections and creates surprising repeated motion.
- Move keyboard focus as the automated steps advance: rejected because decorative playback must not control the visitor's focus.

## Risks / Trade-offs

- [Risk] Four chapters make the page longer → Use concise copy, alternate media and copy, and keep supporting details inside the relevant chapter.
- [Risk] Media is unavailable when implementation starts → Preserve complete text-first chapters and track each asset slot with locale, source, dimensions, and approval state.
- [Risk] Telegram copy overpromises delivery or exclusivity → Keep the claim matrix tied to configured routes, active destinations, schedules, and backend-owned content.
- [Risk] Removing old sections breaks anchors or callers → Update route-local composition, dictionaries, locale hash allow-list, tests, and static searches together; do not keep hidden compatibility anchors.
- [Risk] Live-chart wording implies universal real-time coverage → Use live wording for chart updates while retaining availability and stale/disconnected/market-closed boundaries in detailed copy.
- [Risk] AI wording implies graph-node chat or complete evidence → State that the Assistant uses Knowledge Graph context for text conversation and retain the existing exclusions.
- [Risk] A DOM simulation is mistaken for a live application or delivery record → Keep a visible Demo label, fixed public fixtures, bounded copy, and explicit exclusion of backend and delivery claims.
- [Risk] Motion increases the landing client bundle or runs offscreen → Isolate the dependency to the Telegram renderer, load it near the viewport, stop future steps when hidden, and inspect the production bundle.
- [Risk] Autoplay races with user interaction or Replay → Keep workflow state in a reducer and invalidate every prior scheduler run before applying a new event sequence.
- [Risk] Four selectors and a large stage overflow on narrow layouts → Preserve one vertical tab model, stack it above the stage, use a stable responsive footprint, and verify required breakpoints and 200% zoom.

## Migration Plan

1. Apply the delta specs to update the landing contract and localization contract.
2. Update dictionaries, route-local section composition, feature anchors, CTA behavior, and responsive layout.
3. Remove obsolete WorkspaceAssistant, old Hero proof, old four-step flow, Reaction & Evidence chapter, copy keys, and test assertions that no longer have callers.
4. Preserve the approved Knowledge Graph and Market Chart captures, add the static AI showcase proof, and replace the old Showcase composition with the four-feature tab shell.
5. Add localized Scheduled Telegram fixtures, controls, reducer, server fallback, client loading boundary, and Motion renderer.
6. Remove the Showcase Strategy surface and threshold-alert example, then update localized copy and forbidden-claim checks.
7. Run targeted reducer, component, and browser tests; localization and static checks; lint; typecheck; production build and bundle inspection; and OpenSpec validation.
8. Perform manual review for product-capture approval, fixed-palette visual quality, localized content, responsive composition, and motion choreography before release approval.

Rollback is a source change rollback before deployment. No backend or data migration is required. Apex cutover remains a separate change.

## Open Questions

None for the approved scope.
