## ADDED Requirements

### Requirement: Landing interactive product showcase

The landing page SHALL present Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram through one localized interactive product showcase with feature selectors and a shared demonstration stage. The showcase SHALL preserve useful server-rendered content for every feature and SHALL identify simulated content without presenting it as a live application session.

#### Scenario: Four feature selectors share one stage

- **WHEN** a visitor reaches `SEE THE WORKFLOW`
- **THEN** the showcase presents selectors in this order: Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram
- **AND** Scheduled Telegram is selected by default
- **AND** the active selector exposes its localized outcome and description while the shared stage exposes the corresponding proof
- **AND** the old Strategy Coding showcase surface is absent

#### Scenario: Static features remain useful during phased rollout

- **WHEN** a visitor selects Knowledge Graph, Market Chart, or AI Conversation
- **THEN** Knowledge Graph and Market Chart show their locale-appropriate approved captures when available
- **AND** AI Conversation shows a complete localized text-first proof
- **AND** none of the three static stages shows a spinner, loading skeleton, disabled selector, or public `Coming soon` message
- **AND** the static stages do not animate as Scheduled Telegram workflows

#### Scenario: Feature selectors use accessible tab behavior

- **WHEN** a visitor operates the showcase with a pointer or keyboard
- **THEN** the four selectors expose tab semantics and the shared stage exposes matching tabpanel semantics
- **AND** only one selector is active at a time
- **AND** Arrow Up and Arrow Down move through the vertical selectors without trapping focus
- **AND** every actionable selector and demo control retains a visible focus indicator

#### Scenario: Showcase reflows without changing its interaction model

- **WHEN** the showcase renders on a narrow viewport or at 200 percent zoom
- **THEN** the vertical feature selectors appear before the shared stage
- **AND** the implementation does not replace them with a dropdown, horizontal scrolling selector, or a second accordion interaction model
- **AND** feature copy, approved captures, controls, and focus indicators remain visible without page-level horizontal overflow

### Requirement: Scheduled Telegram interactive workflow demo

The landing page SHALL provide a deterministic, localized DOM simulation of a scheduled asset analysis using fixed public demo data. The simulation SHALL NOT call an application or Telegram backend, authenticate a visitor, mutate a workspace, send a Telegram message, or claim external delivery or reading.

#### Scenario: Demo starts from truthful prerequisites

- **WHEN** the Scheduled Telegram stage renders
- **THEN** it presents `Market Desk` as an active Telegram destination
- **AND** it presents the Scheduled Market Analysis route as enabled
- **AND** it presents `Morning briefing` as the schedule name and `Asia/Bangkok` as the schedule timezone
- **AND** a visible Demo label distinguishes the simulation from a live product session

#### Scenario: Visitor controls the bounded schedule inputs

- **WHEN** a visitor uses the Scheduled Telegram controls
- **THEN** they can select XAU/USD or BTC/USD as the watched asset
- **AND** they can select 08:00 or 18:00 as the local send time
- **AND** they can select Vietnamese or English as the schedule output language
- **AND** the schedule summary and Telegram message preview derive deterministically from the selected values
- **AND** the primary walkthrough action is `Xem luồng gửi` or `View delivery flow` rather than a manual send action

#### Scenario: Workflow sequence communicates scheduled delivery

- **WHEN** the visitor starts or watches the Scheduled Telegram walkthrough
- **THEN** it advances through Route ready, Configure, Scheduled, Scheduled run, and Telegram preview in that order
- **AND** it stops and holds the final preview instead of looping
- **AND** it exposes direct step navigation and Replay
- **AND** the final state is labeled as a completed simulation rather than `Delivered`, `Read`, or an equivalent receipt

#### Scenario: Autoplay yields to the visitor

- **WHEN** Scheduled Telegram remains active and roughly 40 percent of the showcase enters the viewport for the first time in a page view
- **THEN** the walkthrough may autoplay once for approximately 3.1 seconds
- **AND** pointer, focus, or selection interaction switches it to manual playback until Replay
- **AND** leaving the viewport, hiding the document, or selecting another feature prevents future scheduled transitions
- **AND** returning to Scheduled Telegram preserves its stable state and does not restart autoplay
- **AND** stale callbacks from an earlier run cannot change the current run

#### Scenario: Reduced motion and static fallback preserve the story

- **WHEN** the visitor prefers reduced motion, JavaScript is unavailable, or the interactive renderer cannot load
- **THEN** the destination, schedule summary, and localized Telegram message preview remain available
- **AND** reduced-motion users can still change supported selections and steps with state changes applied without interpolated movement
- **AND** the static and interactive stages reserve a stable responsive footprint
- **AND** decorative progress motion does not control or move keyboard focus

#### Scenario: Telegram preview preserves claim boundaries

- **WHEN** the localized message preview is rendered for any supported selection
- **THEN** it states that the selected scheduled market analysis has been prepared and directs the visitor to Signapse to review context and sources before making a decision
- **AND** it does not include private data, market prices, recommendations, trading signals, arbitrary threshold alerts, public-channel claims, delivery receipts, read receipts, or guaranteed outcomes

## REMOVED Requirements

### Requirement: Knowledge Graph Hero proof

**Reason**: The Hero no longer uses a two-proof layout. Knowledge Graph value is introduced through the Hero feature navigation and the dedicated Knowledge Graph chapter.
**Migration**: Remove the old specialized-AI proof keys and assertions. Keep the bounded AI/Knowledge Graph claim in the new Hero positioning and AI Assistant chapter.

### Requirement: Chart-context Hero proof

**Reason**: Chart context is now a primary Live Charts chapter and is introduced through the four-feature Hero navigation rather than a second proof block.
**Migration**: Move the concise chart message into the Live Charts chapter and keep detailed availability boundaries there.

### Requirement: Two-proof Hero hierarchy

**Reason**: The landing now has four primary feature links instead of exactly two Hero proof points.
**Migration**: Replace the two-proof assertions with the four-feature Hero hierarchy in the modified positioning and product-story requirements.

## MODIFIED Requirements

### Requirement: Landing page positioning

The landing page SHALL position Signapse as a Market Intelligence Platform with four primary capabilities: Knowledge Graph exploration, live market charts, AI conversation with Knowledge Graph context, and Telegram updates. It SHALL retain analysis-support, inspectable-data, and user-decision boundaries.

#### Scenario: Vietnamese four-feature Hero renders

- **WHEN** an unauthenticated or authenticated visitor reads the Hero on `/vi`
- **THEN** its eyebrow is `MARKET INTELLIGENCE PLATFORM`
- **AND** its H1 is `Hiểu thị trường qua Đồ thị Tri thức và AI.`
- **AND** its supporting copy is `Khám phá các mối liên hệ, theo dõi biến động giá trực tiếp, trò chuyện với Trợ lý AI và nhận cập nhật thị trường qua Telegram.`
- **AND** the Hero presents localized links for `Đồ thị Tri thức`, `Biểu đồ trực tiếp`, `Trợ lý AI`, and `Telegram`
- **AND** it identifies the next access action and a short AI-assistance-not-prediction trust boundary in the same scan

#### Scenario: English four-feature Hero renders

- **WHEN** an unauthenticated or authenticated visitor reads the Hero on `/en`
- **THEN** its eyebrow is `MARKET INTELLIGENCE PLATFORM`
- **AND** its H1 is `Understand markets through the Knowledge Graph and AI.`
- **AND** its supporting copy is `Explore relationships, follow live price movements, chat with the AI Assistant, and receive market updates through Telegram.`
- **AND** the Hero presents localized links for `Knowledge Graph`, `Live charts`, `AI Assistant`, and `Telegram`
- **AND** the localized message communicates the same four-feature meaning as the Vietnamese copy

#### Scenario: Hero feature links target the primary product chapters

- **WHEN** a visitor activates one of the four Hero feature links
- **THEN** Knowledge Graph navigates to `#knowledge-graph`
- **AND** Live charts navigates to `#live-charts`
- **AND** AI Assistant navigates to `#ai-assistant`
- **AND** Telegram navigates to `#telegram`

#### Scenario: AI role is scoped to supported behavior

- **WHEN** a visitor reads the Hero or AI Assistant chapter
- **THEN** the page explains that the AI Assistant uses Market Knowledge Graph context to support text-based market questions and relationship analysis
- **AND** it does not imply graph-node chat, automatic chart-context handoff, structured evidence sheets, reasoning chains, streaming tokens, trading signals, or execution controls

#### Scenario: Telegram role is scoped to configured updates

- **WHEN** a visitor reads the Hero or Telegram chapter
- **THEN** the page describes market-news alerts, economic-calendar updates, and scheduled market analysis from Signapse through a linked and configured Telegram destination
- **AND** it does not imply a public channel, arbitrary threshold alerts, manual AI-answer delivery, guaranteed delivery/read state, or commercial exclusivity

#### Scenario: Claims stay analysis-focused

- **WHEN** a visitor reads the Hero and primary feature chapters
- **THEN** the page describes observing, inspecting, analyzing, and receiving configured updates around market information
- **AND** it does not describe Signapse as a prediction engine, trading-signal product, automated-trading system, or provider of guaranteed outcomes

### Requirement: Landing page CTA states

The landing page SHALL expose a single auth-aware access model across the header, Hero, final CTA, and footer, using only destinations that exist.

The request-access destination MUST be `mailto:access@signapse.cloud?subject=Signapse%20access%20request`, the localized sign-in destination MUST be `/{lang}/sign-in`, the localized dashboard destination MUST be `/{lang}/dashboard`, and the Hero secondary destination MUST be `#product`.

#### Scenario: Public user sees gated CTAs

- **WHEN** an unauthenticated visitor views the landing page
- **THEN** the header primary, Hero primary, and final CTA offer `Yêu cầu truy cập` or `Request access` using the locked mail destination
- **AND** adjacent microcopy explains that the action opens an email application
- **AND** the footer exposes the plain request-access email address for copying

#### Scenario: Anonymous visitor sees feature discovery and sign-in actions

- **WHEN** an unauthenticated visitor views the landing page
- **THEN** the Hero secondary action is `Khám phá tính năng` or `Explore features` and links to `#product`
- **AND** the header and footer expose the localized sign-in destination
- **AND** the navigation exposes `Cách sử dụng` or `How to use` linking to `#how-it-works`

#### Scenario: Authenticated user can open dashboard

- **WHEN** an authenticated visitor views the landing page
- **THEN** the header primary, Hero primary, final CTA, and footer app-entry action open the localized dashboard
- **AND** the Hero secondary action still links to `#product`

#### Scenario: Feature links preserve the single landing access model

- **WHEN** a visitor follows any feature link or the Hero secondary CTA
- **THEN** the visitor remains on the same localized public landing route
- **AND** no feature link changes authentication state or creates a second access funnel

#### Scenario: Mail action does not claim delivery

- **WHEN** a visitor activates request access
- **THEN** the landing opens the locked mail destination in the visitor's email application
- **AND** it does not display a success toast or confirmation claiming the email was sent or received

#### Scenario: Preview uses the production access destination

- **WHEN** the landing renders on the preview application host
- **THEN** it uses the same locked request-access destination as production
- **AND** it does not substitute a test mailbox or environment-specific CTA

### Requirement: Landing page product story

The landing page SHALL organize the product story into the canonical sequence: Public Header, Hero Product Proof, Product Story, Analysis Flow, AI Provider Integrations, Final Access CTA, and Public Footer.

#### Scenario: AI provider integrations are visible before conversion

- **WHEN** a visitor reaches `#trust` before the final access CTA
- **THEN** the page presents OpenAI, Gemini, Anthropic, DeepSeek, Groq, and Z.AI as the MVP provider set
- **AND** Vietnamese and English routes render equivalent localized section copy
- **AND** normalized provider logos use appropriate brand colors and move in a slow, borderless continuous rail
- **AND** reduced-motion users receive a static horizontally scrollable rail without duplicate assistive content

#### Scenario: Feature highlights render as four editorial chapters

- **WHEN** a visitor reaches `#product`
- **THEN** the page presents four chapters in this order: Knowledge Graph, Live Charts, AI Assistant, and Telegram
- **AND** each chapter contains an outcome heading, concise explanation, and a product-proof media slot
- **AND** the chapter layout does not present the four features as a compact equal-weight card wall

#### Scenario: Knowledge Graph chapter stays runtime-faithful

- **WHEN** a visitor reaches `#knowledge-graph`
- **THEN** the page explains that visitors can explore relationships among events, assets, news articles, and market narratives
- **AND** it distinguishes Graph View exploration from the Market Knowledge Graph context used by the AI Assistant
- **AND** it does not claim workspace/watchlist filtering or removed graph entity kinds

#### Scenario: Live chart chapter stays runtime-faithful

- **WHEN** a visitor reaches `#live-charts`
- **THEN** the page explains tracked-asset selection, price movement updates, event markers, and economic-calendar context on the chart
- **AND** it explains that a visitor can open an event to inspect market reactions and related sources
- **AND** detailed copy retains stale, disconnected, market-closed, and data-availability boundaries
- **AND** it does not imply arbitrary symbol coverage, system-wide real-time intelligence, causal proof, or trading signals

#### Scenario: AI Assistant chapter stays runtime-faithful

- **WHEN** a visitor reaches `#ai-assistant`
- **THEN** the page explains text conversation with the AI Assistant using Market Knowledge Graph context to analyze relationships among events, assets, and news
- **AND** it explains that conversation history belongs to the active workspace
- **AND** it does not claim graph-node chat, automatic chart-context handoff, token streaming, attachments, evidence sheets, or complete source coverage for every response

#### Scenario: Telegram chapter stays runtime-faithful

- **WHEN** a visitor reaches `#telegram`
- **THEN** the page explains linking a Telegram destination, selecting configured content routes, and scheduling analysis for a tracked asset
- **AND** it identifies market-news alerts, economic-calendar updates, and scheduled market analysis from Signapse
- **AND** it does not claim a public channel, arbitrary threshold alerts, manual AI-answer delivery, guaranteed delivery/read state, or commercial exclusivity

#### Scenario: Analysis flow follows the product story

- **WHEN** a visitor reaches `#how-it-works`
- **THEN** the section appears after the four product chapters and before AI Provider Integrations
- **AND** it presents three steps in Vietnamese: `Chọn tài sản, xem diễn biến giá`, `Mở sự kiện, kiểm tra nguồn tin`, and `Phân tích cùng Trợ lý AI`
- **AND** the corresponding English titles are `Choose an asset, review price action`, `Open an event, check the sources`, and `Analyze with the AI Assistant`
- **AND** the Vietnamese descriptions are exactly:
  - `Chọn tài sản trong danh sách theo dõi. Xem diễn biến giá cùng các dấu mốc sự kiện và lịch kinh tế.`
  - `Mở chi tiết sự kiện để đọc phản ứng thị trường và đối chiếu với các nguồn tin.`
  - `Trợ lý AI hỗ trợ bạn phân tích quan hệ giữa sự kiện, tài sản và tin tức để tìm hiểu thêm những thông tin liên quan.`
- **AND** it does not render the former four-step sequence, a repeated intro, a repeated arrow label, or a separate AI note

#### Scenario: Removed supporting chapters do not remain as peer sections

- **WHEN** a visitor reads the landing page
- **THEN** workspace/history details appear within the AI Assistant chapter
- **AND** reaction/source details appear within the Live Charts chapter
- **AND** the page does not render a standalone `#workspace-ai` section or standalone Reaction & Evidence chapter

#### Scenario: Footer exposes only real destinations

- **WHEN** a visitor reaches the footer
- **THEN** it exposes brand identity, locale links, the request-access email, and the auth-appropriate sign-in or dashboard destination
- **AND** it does not render Docs, Privacy, Terms, pricing, public Telegram-channel, or integration links unless corresponding destinations exist

### Requirement: Landing page visual media readiness

The landing page SHALL render a text-first composition whenever no locale-appropriate product capture has completed approval. In that state it SHALL render the existing localized control-free interactive market-context figure as progressive enhancement over a server-rendered silent dual-view fallback. It MUST NOT render a generated image presented as a product screenshot, an empty media placeholder, or unlabeled synthetic product UI. The labeled Scheduled Telegram DOM simulation defined by this change is the only product-like synthetic landing surface permitted by this requirement.

#### Scenario: Four product media slots are represented

- **WHEN** the landing product story is rendered
- **THEN** it exposes media slots for Knowledge Graph, Live Charts, AI Assistant, and Telegram
- **AND** each slot has localized adjacent text that communicates the essential insight without depending on the image

#### Scenario: Screenshot assets are not yet approved

- **WHEN** a locale has no approved product capture for one or more feature slots
- **THEN** the affected chapter remains complete in localized text
- **AND** the Hero keeps the control-free conceptual market-context figure
- **AND** the page does not render an unapproved fake chart, fake metric, fake conversation, fake graph, or unlabeled fake Telegram message
- **AND** the bounded Scheduled Telegram DOM simulation remains explicitly labeled as Demo and does not claim live or delivered data

#### Scenario: Approved feature captures render safely

- **WHEN** a locale-appropriate capture passes public-data, privacy, licensing, attribution, claim, localization, intrinsic-size, and performance review
- **THEN** the corresponding feature slot may render that capture with localized alternative text
- **AND** adjacent text communicates the same essential insight
- **AND** Graph View and Live Charts captures use the approved demo scenario and do not expose private or backend-only state

#### Scenario: One locale lacks an approved capture

- **WHEN** a product capture is approved for one locale but not the other
- **THEN** the locale without an approved asset remains text-first for that feature
- **AND** it does not fall back to the other locale's image

#### Scenario: Existing conceptual figure remains bounded

- **WHEN** the landing renders without an approved Hero capture
- **THEN** the conceptual figure presents the Market Knowledge Graph and price action as complementary views of market context
- **AND** it does not imply that the graph generates, transforms into, or predicts market prices
- **AND** it does not present itself as a live product chart, trading signal, or approved product capture

### Requirement: Landing page localized navigation

The landing page SHALL expose semantic Vietnamese and English locale links in the header and footer, SHALL treat the locale URL segment as the source of truth, and MUST NOT read or write an app locale cookie.

#### Scenario: Locale links expose language semantics

- **WHEN** a visitor reviews a landing locale control
- **THEN** it contains links for `Tiếng Việt` and `English` with matching `lang` and `hreflang` attributes
- **AND** the active locale is visibly indicated and carries `aria-current="page"`

#### Scenario: Locale switch preserves supported feature and section state

- **WHEN** a visitor switches locale with a query string and a hash in `#top`, `#product`, `#knowledge-graph`, `#live-charts`, `#ai-assistant`, `#telegram`, `#how-it-works`, `#trust`, or `#access`
- **THEN** only the locale pathname segment changes
- **AND** the query string and supported hash are preserved
- **AND** no locale cookie mutation occurs

#### Scenario: Locale switch drops removed and unsupported hashes

- **WHEN** a visitor switches locale while the URL contains `#workspace-ai` or another unsupported hash
- **THEN** the destination preserves the non-locale pathname and query string
- **AND** the removed or unsupported hash is omitted

#### Scenario: Locale switch preserves access state

- **WHEN** an anonymous or authenticated visitor switches locale
- **THEN** the destination remains the equivalent public landing route
- **AND** the CTA state continues to reflect the same authentication state

### Requirement: Landing feature story responsive composition

The landing page SHALL keep the four feature chapters readable and in canonical order across supported viewport sizes and SHALL avoid page-level horizontal overflow.

#### Scenario: Narrow feature chapters reflow

- **WHEN** the landing is viewed below 1200 CSS pixels or at 200% zoom
- **THEN** each feature chapter uses a single-column copy-before-media reading order
- **AND** the feature links wrap without clipping
- **AND** the interactive product showcase keeps its vertical selectors before the shared stage

#### Scenario: Wide feature chapters use editorial composition

- **WHEN** the landing is viewed at or above 1200 CSS pixels
- **THEN** feature chapters may alternate copy and media while preserving heading/copy before media in DOM order
- **AND** the three-step AnalysisFlow may render in one row without reducing readable body-copy measure
- **AND** the interactive product showcase may place its vertical selectors beside the wider shared stage

#### Scenario: Responsive feature story has no page overflow

- **WHEN** the landing is viewed at 375, 768, 1024, or 1440 CSS pixels or at 200% zoom
- **THEN** all four feature chapters, anchors, CTAs, and media fallbacks remain accessible
- **AND** horizontal overflow is confined to an intentional media surface if required
- **AND** the page does not clip feature labels, images, showcase controls, focus states, or navigation controls
