# public-landing-page Specification

## Purpose

TBD - created by archiving change revise-public-landing-content-v2. Update Purpose after archive.

## Requirements

### Requirement: Public localized landing page

The system SHALL render a public Signapse application landing page at each supported locale root without requiring authentication or workspace permissions and without rendering the protected dashboard shell. Public landing access MUST NOT make dashboard, application, or API routes public.

#### Scenario: Vietnamese landing route

- **WHEN** an unauthenticated visitor opens `/vi`
- **THEN** the system renders the Vietnamese public landing page without redirecting to sign-in
- **AND** the protected dashboard sidebar shell is not rendered

#### Scenario: English landing route

- **WHEN** an unauthenticated visitor opens `/en`
- **THEN** the system renders the English public landing page without redirecting to sign-in
- **AND** the protected dashboard sidebar shell is not rendered

#### Scenario: Protected routes remain protected

- **WHEN** an unauthenticated visitor requests a localized dashboard route, another protected application route, or a protected API route
- **THEN** the existing authentication and authorization behavior remains in effect
- **AND** the request is not made public by the landing route exception

#### Scenario: Root locale negotiation remains canonical

- **WHEN** a visitor opens an unprefixed page route
- **THEN** the existing locale negotiation selects Vietnamese or English from the request preference
- **AND** it falls back to Vietnamese when no supported preference is available

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

### Requirement: Decorative OHLCV Hero depth field

The public landing Hero SHALL render one static, route-local `O/H/L/C/V` glyph field behind its content and market-context figure. The field SHALL use the fixed landing palette, SHALL remain decorative and non-interactive, and SHALL NOT present ticker symbols, prices, percentages, BUY/SELL language, trading signals, candles, or data that could be mistaken for live market output.

#### Scenario: OHLCV depth field renders across locales

- **WHEN** a visitor views the Hero on `/vi` or `/en`
- **THEN** one OHLCV glyph field is rendered behind the localized Hero content and market-context figure
- **AND** the glyph field does not change the Hero copy, CTA destinations, proof points, figure behavior, or canonical section order

#### Scenario: OHLCV depth field remains decorative

- **WHEN** the Hero is inspected through assistive technology or keyboard navigation
- **THEN** the OHLCV glyph field is hidden from the accessibility tree
- **AND** it exposes no accessible name, control, focus target, pointer behavior, or live region

#### Scenario: OHLCV depth field preserves responsive layout

- **WHEN** the landing renders at a supported viewport, 200% zoom, or with reduced motion enabled
- **THEN** the static glyph field remains behind the Hero content and figure without page-level horizontal overflow
- **AND** all localized content and interaction remain available without depending on the decoration

### Requirement: Control-free Hero visual chrome

The text-first Hero SHALL render its market-context figure without visible control chrome. The Hero visual area SHALL NOT display its section label, proof heading, figure caption, hover hint, pause control, mode label, runtime status, fallback labels, or a persistent canvas border. The localized Hero headline, supporting copy, CTA behavior, trust note, and two proof points SHALL remain visible.

#### Scenario: Vietnamese visual chrome is absent

- **WHEN** a visitor views the text-first Hero on `/vi`
- **THEN** `Bối cảnh có thể kiểm tra`, `Từ dữ liệu đến bối cảnh giao dịch`, and `Hai góc nhìn về bối cảnh thị trường` are not visibly rendered in the Hero visual area
- **AND** no visible hint, pause control, mode label, runtime status, fallback label, or persistent canvas border is rendered
- **AND** the Hero headline, supporting copy, CTA behavior, trust note, and two proof points remain visible

#### Scenario: English visual chrome is absent

- **WHEN** a visitor views the text-first Hero on `/en`
- **THEN** `Context you can verify`, `From data to trading context`, and `Two views of market context` are not visibly rendered in the Hero visual area
- **AND** no visible hint, pause control, mode label, runtime status, fallback label, or persistent canvas border is rendered
- **AND** the Hero headline, supporting copy, CTA behavior, trust note, and two proof points remain visible

#### Scenario: Canvas reclaims removed visual-copy space

- **WHEN** a visitor views the text-first Hero at a desktop breakpoint
- **THEN** the market-context canvas uses the visual space released by the removed heading and caption without materially increasing the Hero footprint
- **AND** the canvas remains within the Hero layout without horizontal overflow

#### Scenario: Canvas remains viable on narrow viewports

- **WHEN** a visitor views the text-first Hero on a narrow viewport or at 200% zoom
- **THEN** the market-context canvas retains its mobile minimum footprint
- **AND** the Hero does not create horizontal overflow

### Requirement: Control-free figure interaction and motion

The market-context figure SHALL retain exploration without visible controls. It SHALL support fine-pointer hover preview, pointer drag rotation, keyboard rotation and mode switching, and localized nonvisual guidance. It SHALL NOT expose click or tap pinning. For visitors who have not requested reduced motion, its active view SHALL continue rotating while the figure is visible and not being dragged; reduced-motion preferences SHALL disable automatic rotation.

#### Scenario: Fine-pointer hover previews price action

- **WHEN** a fine-pointer visitor enters the market-context figure without dragging
- **THEN** the figure previews price action
- **AND** the figure returns to graph mode when the pointer leaves
- **AND** no visible control or mode label is required to trigger or explain the preview

#### Scenario: Pointer drag rotates the current view

- **WHEN** a visitor drags within the market-context figure with a supported pointer
- **THEN** the current graph or price-action view rotates during the gesture
- **AND** the gesture does not activate a click or tap pinning mode

#### Scenario: Coarse pointer has no hidden tap mode

- **WHEN** a coarse-pointer visitor taps the market-context figure without dragging
- **THEN** the tap does not pin, toggle, or otherwise change the figure mode
- **AND** a drag gesture remains available for rotation

#### Scenario: Keyboard interaction remains accessible without visible chrome

- **WHEN** a keyboard visitor focuses the enhanced market-context figure
- **THEN** a visible focus indicator is shown only while the figure has keyboard focus
- **AND** Arrow keys rotate the active view
- **AND** Enter and Space switch between graph and price-action views
- **AND** localized nonvisual name, description, and keyboard guidance are available

#### Scenario: Automatic rotation continues and respects reduced motion

- **WHEN** a visitor views the enhanced market-context figure without reduced motion
- **THEN** its active view continues rotating while the figure is visible and not being dragged
- **AND** rotation pauses during a drag and resumes afterward
- **WHEN** the visitor prefers reduced motion
- **THEN** the figure does not start or continue automatic rotation

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

### Requirement: Landing page provider integrations and claim boundaries

The landing page SHALL present Signapse as analysis support for inspecting market context and linked sources, SHALL qualify optional product data in detailed product descriptions, and MUST NOT imply prediction performance, trading advice, signal generation, or automated execution. A concise Hero proof MAY name high-level chart context without repeating an individual data-availability clause when the detailed landing story retains the applicable qualifier.

#### Scenario: AI provider integrations are visible before conversion

- **WHEN** a visitor reviews the provider section at `#trust` before the final access CTA
- **THEN** the page presents OpenAI, Gemini, Anthropic, DeepSeek, Groq, and Z.AI as the MVP provider set
- **AND** Vietnamese and English routes render equivalent localized section copy
- **AND** normalized provider logos use appropriate brand colors and move in a slow, borderless continuous rail
- **AND** reduced-motion users receive a static horizontally scrollable rail without duplicate assistive content
- **AND** it does not claim buy or sell advice, entries, stops, targets, P&L, forecast accuracy, guaranteed outcomes, or automated trading

#### Scenario: Optional data is qualified in detailed copy

- **WHEN** detailed landing copy describes event annotations, calendar context, reactions, evidence, confidence, or evaluated outcomes
- **THEN** the copy states that the information appears when data is available
- **AND** it does not present temporal proximity as proof of causation

#### Scenario: Concise Hero chart proof remains bounded

- **WHEN** a visitor reads the second Hero proof
- **THEN** it may name price action, market reactions, related events, and economic-calendar context without an individual availability qualifier
- **AND** the detailed chart and product-story copy retains the relevant availability boundaries
- **AND** it does not imply causal proof, trading signals, or universal data coverage

#### Scenario: Unsupported product claims are absent

- **WHEN** the localized landing content is reviewed
- **THEN** it does not claim structured Market Query evidence, reasoning chains, watchlist evidence boundaries, workspace-scoped graph data, Theme graph nodes, shared workspaces, or team collaboration

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

### Requirement: Landing page metadata and social discovery

The system SHALL produce localized landing metadata from explicit server-side public-origin and indexability configuration, SHALL fail closed for unknown deployment state, and SHALL provide one brand-only social card for each supported locale.

The Vietnamese title SHALL be `Signapse | Market Intelligence Platform` and its description SHALL be `Signapse kết nối giá, sự kiện, phản ứng và nguồn tin liên quan để hỗ trợ phân tích thị trường bằng AI với bối cảnh có thể kiểm tra.` The English title SHALL be `Signapse | Market Intelligence Platform` and its description SHALL be `Signapse connects price, events, market reactions, and related sources to support AI-assisted market analysis with context you can verify.`

#### Scenario: Valid non-indexable preview metadata renders

- **WHEN** the landing is configured as non-indexable with public origin `https://dev.signapse.cloud`
- **THEN** `/vi` and `/en` emit the locked localized Market Intelligence title and description
- **AND** each locale URL is self-canonical on `dev.signapse.cloud`
- **AND** the metadata exposes Vietnamese and English language alternates plus root `/` as `x-default`
- **AND** the page emits `noindex`

#### Scenario: Invalid non-indexable origin fails closed

- **WHEN** the landing is configured as non-indexable and the public origin is absent or invalid
- **THEN** the landing still renders with `noindex`
- **AND** canonical and language-alternate URLs are omitted
- **AND** the system does not infer an origin from the request hostname

#### Scenario: Invalid indexable configuration is rejected

- **WHEN** the landing is configured as indexable with an origin other than exactly `https://signapse.cloud`
- **THEN** the application fails fast instead of rendering indexable landing metadata

#### Scenario: Indexable apex metadata can be verified before cutover

- **WHEN** the landing metadata policy is evaluated with indexable origin `https://signapse.cloud`
- **THEN** `/vi` and `/en` are self-canonical on the apex origin
- **AND** they expose each other as language alternates plus root `/` as `x-default`
- **AND** the metadata does not emit `noindex`

#### Scenario: Localized social cards render

- **WHEN** a crawler requests the social artwork for `/vi` or `/en`
- **THEN** it receives a brand-only card using the approved Signapse brand treatment and the corresponding localized Market Intelligence Platform title
- **AND** the Vietnamese and English cards use the same layout
- **AND** neither card contains body copy, a product screenshot, a product mock, a metric, or an additional claim

### Requirement: Landing page accessible responsive experience

The landing page SHALL provide equivalent content, navigation, CTA behavior, and interactive market-context figure behavior across supported viewport sizes, light and dark themes, fine and coarse pointers, keyboard and assistive-technology use, 200% zoom, and reduced-motion preferences. The small-viewport header SHALL keep brand, the auth-aware primary CTA, and the navigation disclosure visible without clipping while preserving locale and secondary access actions inside the disclosure.

#### Scenario: Semantic page structure renders

- **WHEN** the landing page is inspected with accessibility semantics
- **THEN** it contains one H1, ordered H2 and H3 headings, a skip link to the main content, and labelled header navigation
- **AND** the interactive market-context figure exposes a concise localized nonvisual name, description, and input instructions
- **AND** the interactive stage uses a labelled focusable group rather than application-mode semantics
- **AND** the canvas and decorative geometry are hidden from the accessibility tree
- **AND** visible brand text is not redundantly announced through the adjacent logo

#### Scenario: Keyboard navigation works

- **WHEN** a visitor uses only the keyboard
- **THEN** the skip link, locale links, mobile navigation disclosure, section links, sign-in or dashboard link, access CTA, and interactive figure are operable in logical order
- **AND** Enter or Space switches between Market Knowledge Graph and price action
- **AND** the arrow keys rotate the current visual mode without trapping focus
- **AND** mode changes are announced through a polite status region
- **AND** every interactive element has a visible focus state

#### Scenario: Fine pointer previews without click pinning

- **WHEN** a visitor with a fine pointer enters an interactive figure without dragging
- **THEN** the figure previews price action
- **AND** leaving the figure returns to the Market Knowledge Graph
- **AND** clicking the figure does not pin or toggle its mode

#### Scenario: Touch preserves rotation without a hidden tap mode

- **WHEN** a visitor taps the interactive figure without crossing the drag threshold
- **THEN** the figure mode does not change or become pinned
- **WHEN** the visitor drags beyond the threshold
- **THEN** the current mode rotates without switching modes

#### Scenario: Automatic rotation remains control-free

- **WHEN** the visitor views the figure without requesting reduced motion
- **THEN** the active view keeps rotating while visible and not being dragged
- **AND** the figure provides no visible pause or mode control

#### Scenario: Small viewport header preserves primary actions

- **WHEN** the landing header is viewed at a width where its full navigation and locale controls do not fit
- **THEN** brand, the auth-aware primary CTA, and the disclosure trigger remain visible in the primary header row
- **AND** locale links, section navigation, and any anonymous secondary sign-in action remain available inside the disclosure
- **AND** no control is made inaccessible by page-level clipping

#### Scenario: Small viewport and zoom reflow

- **WHEN** the landing is viewed at 375, 768, 1024, or 1440 CSS pixels or at 200% zoom
- **THEN** content remains readable in canonical order
- **AND** the figure remains within the existing Hero reading flow and does not use the standalone demo's oversized layout
- **AND** the page has no page-level horizontal overflow or clipped brand, label, CTA, or navigation control
- **AND** mobile controls provide a practical touch target with a preferred minimum of 44 by 44 CSS pixels

#### Scenario: Default motion explains the conceptual flow

- **WHEN** the visitor has not requested reduced motion and the Hero first renders
- **THEN** copy and Hero entrance emphasis may run once without blocking interaction or changing layout bounds
- **AND** the interactive figure may keep rotating its active view while visible and not being dragged
- **AND** its animation does not reset the visitor's selected mode or orientation

#### Scenario: Theme and motion preferences preserve meaning

- **WHEN** the visitor selects light theme or dark theme
- **THEN** the figure preserves equivalent hierarchy and contrast through the active visual theme without resetting its in-memory interaction state
- **WHEN** the visitor has requested reduced motion
- **THEN** the figure starts without automatic rotation and switches modes immediately without animated morphing
- **AND** no required content or action depends on animation, hover, or motion

#### Scenario: Inactive rendering is suspended

- **WHEN** the figure is outside the active viewport, the document is hidden, or automatic rotation is disabled by reduced motion with no morph or manual interaction in progress
- **THEN** ongoing animation work stops
- **AND** returning the figure to an active state preserves the current in-memory mode and orientation

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
