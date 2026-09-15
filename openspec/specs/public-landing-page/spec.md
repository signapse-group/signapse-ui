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

The landing page SHALL position Signapse as a Market Intelligence Platform for active and research-oriented traders and people monitoring assets, news, and economic events. It SHALL explain that the AI Assistant uses contextual market relationships from the Market Knowledge Graph while price, events, reactions, sources, and relationships remain inspectable Signapse surfaces and the user owns the trading decision.

#### Scenario: Vietnamese Market Intelligence Hero renders

- **WHEN** a visitor reads the Hero on `/vi`
- **THEN** its eyebrow is `MARKET INTELLIGENCE PLATFORM`
- **AND** its H1 is `Biến dữ liệu thị trường thành Đồ thị Tri thức.`
- **AND** its supporting copy is `Signapse tổng hợp, đánh giá và phân tích dữ liệu giá, sự kiện, phản ứng và tin tức từ nhiều nguồn thành các mối liên hệ có thể kiểm tra — tạo ngữ cảnh cho Trợ lý AI khi bạn đặt câu hỏi và đọc từng biến động.`
- **AND** it identifies the next access action and a short AI-assistance-not-prediction trust boundary in the same scan

#### Scenario: English Market Intelligence Hero renders

- **WHEN** a visitor reads the Hero on `/en`
- **THEN** its eyebrow is `MARKET INTELLIGENCE PLATFORM`
- **AND** its H1 is `Turn market data into a Knowledge Graph.`
- **AND** its supporting copy is `Signapse aggregates, evaluates, and analyzes multi-source price, event, reaction, and news data into inspectable relationships—giving the AI Assistant context when you ask questions and read market moves.`
- **AND** the localized message communicates the same Knowledge-Graph context as the Vietnamese copy

#### Scenario: AI role is scoped to supported behavior

- **WHEN** a visitor reads the Hero proof and conceptual figure
- **THEN** the page explains that the AI Assistant uses Market Knowledge Graph context to support natural-language market questions and users can use Signapse surfaces to inspect chart context, events, reactions, sources, and relationships
- **AND** it does not imply that an Assistant response contains structured evidence, reasoning chains, a source sheet, trading signals, or execution controls

#### Scenario: Claims stay analysis-focused

- **WHEN** a visitor reads the Hero and primary product chapters
- **THEN** the page describes how users track assets, inspect related events, reactions, and sources when available, and explore relationships around a move
- **AND** it does not describe Signapse as an internal admin console, an AI pipeline, a prediction engine, a trading-signal product, or an automated-trading system

### Requirement: Knowledge Graph Hero proof

The landing page SHALL present the first Hero proof as a specialized AI Assistant operating on the Signapse Market Knowledge Graph. The localized copy SHALL state that the graph is built from multi-source market data through aggregation, evaluation, and analysis, while retaining Signapse's analysis-support and user-decision boundaries.

#### Scenario: Vietnamese Knowledge Graph proof renders

- **WHEN** a visitor reads the first Hero proof on `/vi`
- **THEN** its title is `Trợ lý AI chuyên biệt`
- **AND** its body is `Vận hành trên Đồ thị Tri thức, được xây dựng từ dữ liệu thị trường đa nguồn đã qua tổng hợp, đánh giá và phân tích.`
- **AND** the surrounding Hero continues to state that the user verifies sources and makes the trading decision

#### Scenario: English Knowledge Graph proof renders

- **WHEN** a visitor reads the first Hero proof on `/en`
- **THEN** its title is `Specialized AI Assistant`
- **AND** its body is `Powered by a Knowledge Graph built from multi-source market data—aggregated, evaluated, and analyzed.`
- **AND** the localized proof communicates the same market-context meaning as the Vietnamese copy

#### Scenario: Knowledge Graph claim remains bounded

- **WHEN** a visitor reads the localized Knowledge Graph Hero proof
- **THEN** the page describes analysis context rather than model training, trading signals, prediction accuracy, or automated execution
- **AND** it does not imply that every Assistant response contains a complete graph, evidence sheet, reasoning chain, or source citation

### Requirement: Chart-context Hero proof

The landing page SHALL present the second Hero proof as reading chart context rather than only individual candles. Its localized copy SHALL identify price action, market reactions, related events, and economic-calendar context without implying causal proof, trading signals, or guaranteed data coverage.

#### Scenario: Vietnamese chart-context proof renders

- **WHEN** a visitor reads the second Hero proof on `/vi`
- **THEN** its title is `Đọc bối cảnh, không chỉ nhìn nến`
- **AND** its body is `Đọc diễn biến giá trên chart cùng phản ứng thị trường, sự kiện và lịch kinh tế liên quan.`

#### Scenario: English chart-context proof renders

- **WHEN** a visitor reads the second Hero proof on `/en`
- **THEN** its title is `Read the context, not just the candles`
- **AND** its body is `Read price action alongside market reactions, related events, and economic-calendar context.`

#### Scenario: Detailed copy retains availability qualifiers

- **WHEN** a visitor reads detailed chart, event, reaction, or economic-calendar descriptions on the landing
- **THEN** the page continues to qualify information that appears only when data is available
- **AND** the concise second Hero proof does not imply causal proof, trading signals, or universal data coverage

### Requirement: Two-proof Hero hierarchy

The landing page SHALL render exactly two Hero proof points: the specialized AI Assistant and chart context. It SHALL NOT render the former relationship-inspection proof in the Hero, while relationship inspection remains part of the detailed product story.

#### Scenario: Hero shows only the two approved proof points

- **WHEN** a visitor reads the Hero on `/vi` or `/en`
- **THEN** the proof list contains the localized specialized-AI and chart-context proofs
- **AND** it does not contain `Kiểm tra mối liên hệ` or `Inspect relationships`
- **AND** no empty third proof slot is rendered at tablet widths

#### Scenario: Relationship inspection remains in the product story

- **WHEN** a visitor continues from the Hero to the product-story chapters
- **THEN** the page still describes inspecting related events, reactions, sources, and relationships within the applicable detailed chapters
- **AND** the removal does not change the conceptual figure's separate behavior or semantics

### Requirement: Landing page CTA states

The landing page SHALL expose a single auth-aware access model across the header, Hero, final CTA, and footer, using only destinations that exist.

The request-access destination MUST be `mailto:access@signapse.cloud?subject=Signapse%20access%20request`, the localized sign-in destination MUST be `/{lang}/sign-in`, the localized dashboard destination MUST be `/{lang}/dashboard`, and the Hero journey destination MUST be `#how-it-works`.

#### Scenario: Public user sees gated CTAs

- **WHEN** an unauthenticated visitor views the landing page
- **THEN** the header primary, Hero primary, and final CTA offer `Yêu cầu truy cập` or `Request access` using the locked mail destination
- **AND** adjacent microcopy explains that the action opens an email application
- **AND** the footer exposes the plain request-access email address for copying

#### Scenario: Anonymous visitor sees sign-in actions

- **WHEN** an unauthenticated visitor views the landing page
- **THEN** the header and footer expose the localized sign-in destination
- **AND** the Hero secondary action links to `#how-it-works` rather than sign-in

#### Scenario: Authenticated user can open dashboard

- **WHEN** an authenticated visitor views the landing page
- **THEN** the header primary, Hero primary, final CTA, and footer app-entry action open the localized dashboard
- **AND** the Hero secondary action still links to `#how-it-works`

#### Scenario: Mail action does not claim delivery

- **WHEN** a visitor activates request access
- **THEN** the landing opens the locked mail destination in the visitor's email application
- **AND** it does not display a success toast or confirmation claiming the email was sent or received

#### Scenario: Preview uses the production access destination

- **WHEN** the landing renders on the preview application host
- **THEN** it uses the same locked request-access destination as production
- **AND** it does not substitute a test mailbox or environment-specific CTA

### Requirement: Landing page product story

The landing page SHALL organize the product story into the canonical sequence: Public Header, Hero Product Proof, Analysis Flow, Product Story, Workspace and Assistant support, AI Provider Integrations, Final Access CTA, and Public Footer.

#### Scenario: Core thesis section renders

- **WHEN** a visitor reaches `#how-it-works`
- **THEN** the page presents `Theo dõi → Đặt vào bối cảnh → Kiểm tra → Khám phá` in Vietnamese or `Track → Contextualize → Inspect → Explore` in English
- **AND** it does not describe an internal data or AI pipeline

#### Scenario: Feature highlights render

- **WHEN** a visitor reaches `#product`
- **THEN** the page presents Event-aware Charts, Reaction & Evidence, and Connected Market Graph as three editorial chapters
- **AND** each chapter contains an outcome heading, an explanation, no more than three proof points, and the applicable claim boundary

#### Scenario: Event-aware chart chapter stays runtime-faithful

- **WHEN** the chart chapter describes product behavior
- **THEN** it explains tracked-asset selection, historical candles, event annotations, economic-calendar context, and live chart states when available
- **AND** it does not imply arbitrary symbol coverage, system-wide realtime intelligence, causal proof, or trading signals

#### Scenario: Reaction and evidence chapter stays runtime-faithful

- **WHEN** the reaction and evidence chapter describes product behavior
- **THEN** it explains concise chart annotation previews and event detail with optional reactions and linked sources
- **AND** it does not claim that event detail contains evaluated trading outcomes or a structured Market Query evidence sheet

#### Scenario: Connected graph chapter stays runtime-faithful

- **WHEN** the graph chapter describes product behavior
- **THEN** it describes relationships among events, assets, news articles, and narratives
- **AND** it states that themes provide context rather than a distinct graph entity type
- **AND** it does not claim workspace or watchlist filtering

#### Scenario: Workspace and Assistant remain supporting capabilities

- **WHEN** a visitor reaches `#workspace-ai`
- **THEN** the page explains active-workspace tracked assets and persisted text conversation sessions and history for the same workspace
- **AND** the AI Assistant is not presented as one of the three primary product chapters
- **AND** it does not claim token streaming, attachments, evidence sheets, Telegram delivery, or team collaboration

#### Scenario: Footer exposes only real destinations

- **WHEN** a visitor reaches the footer
- **THEN** it exposes brand identity, locale links, the request-access email, and the auth-appropriate sign-in or dashboard destination
- **AND** it does not render Docs, Privacy, Terms, pricing, or integration links unless corresponding destinations exist

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

The landing page SHALL render a text-first composition whenever no locale-appropriate product capture has completed approval. In that state it SHALL render a localized control-free interactive market-context figure as progressive enhancement over a server-rendered silent dual-view fallback, and it MUST NOT render synthetic product UI, a generated image presented as a product screenshot, or an empty media placeholder.

#### Scenario: Screenshot assets are not yet available

- **WHEN** the landing has no approved capture for the active locale
- **THEN** the Hero and product chapters render their complete story in localized text and the Hero renders a control-free interactive market-context figure
- **AND** the page does not render the previous mock workspace, fake chart bars, fake confidence, fake evidence counts, Market Query preview, Theme node, visible control-looking product decoration, or fake market values

#### Scenario: Conceptual figure communicates without product mimicry

- **WHEN** the text-first Hero renders its interactive market-context figure
- **THEN** the figure presents the Market Knowledge Graph and price action as complementary views of market context
- **AND** it does not imply that the graph generates, transforms into, or predicts market prices
- **AND** it does not present itself as a live product chart, trading signal, automated-execution surface, or approved product capture
- **AND** it does not display tickers, prices, axes, metrics, trading controls, dashboard chrome, or data that could be mistaken for live market output

#### Scenario: Vietnamese nonvisual figure identity renders

- **WHEN** a visitor uses assistive technology with the interactive market-context figure on `/vi`
- **THEN** a natural Vietnamese nonvisual name, description, and keyboard guidance identify the Market Knowledge Graph and price action views
- **AND** the figure does not visibly render its former title, mode labels, hints, controls, or status messages
- **AND** the obsolete `01 / 03` metadata is absent

#### Scenario: English nonvisual figure identity renders

- **WHEN** a visitor uses assistive technology with the interactive market-context figure on `/en`
- **THEN** a natural English nonvisual name, description, and keyboard guidance identify the Market Knowledge Graph and price action views
- **AND** the figure does not visibly render its former title, mode labels, hints, controls, or status messages
- **AND** the obsolete `01 / 03` metadata is absent

#### Scenario: Static fallback preserves the complete figure meaning without visual copy

- **WHEN** JavaScript has not hydrated, WebGL cannot initialize, or the interactive renderer loses its graphics context
- **THEN** the Hero keeps a server-rendered silent dual-view figure in the same layout footprint
- **AND** the fallback does not visually render labels, controls, or runtime status
- **AND** a localized nonvisual description communicates the graph and price-action context
- **AND** a runtime failure returns to the fallback without exposing a technical exception or blocking the landing journey

#### Scenario: Surrounding Hero content remains stable

- **WHEN** the interactive market-context figure replaces the previous conceptual diagram
- **THEN** the localized Hero headline, supporting copy, CTA behavior, trust note, and two proof points remain unchanged
- **AND** the Hero visual section label and proof heading are absent
- **AND** the canonical landing section order and all sections outside the figure remain unchanged

#### Scenario: One locale lacks an approved capture

- **WHEN** a product capture is approved for one locale but not the other
- **THEN** the locale without an approved asset remains text-first and renders its localized control-free interactive market-context figure
- **AND** it does not fall back to the other locale's image or expose the figure's former visible labels

#### Scenario: Screenshot assets become available

- **WHEN** a locale-appropriate capture passes public-data, privacy, licensing, attribution, claim, localization, intrinsic-size, and performance review
- **THEN** the corresponding media slot may render that capture with localized alternative text
- **AND** adjacent text communicates the same essential insight
- **AND** adopting that capture requires an explicit follow-up decision rather than silently removing the interactive market-context figure

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

#### Scenario: Locale switch preserves supported location state

- **WHEN** a visitor switches locale with a query string and a hash in `#top`, `#how-it-works`, `#product`, `#workspace-ai`, `#trust`, or `#access`
- **THEN** only the locale pathname segment changes
- **AND** the query string and supported hash are preserved
- **AND** no locale cookie mutation occurs

#### Scenario: Locale switch drops an unsupported hash

- **WHEN** a visitor switches locale while the URL contains an unsupported hash
- **THEN** the destination preserves the non-locale pathname and query string
- **AND** the unsupported hash is omitted

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
