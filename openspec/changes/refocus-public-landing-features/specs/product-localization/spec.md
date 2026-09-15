## MODIFIED Requirements

### Requirement: Landing page dictionary copy
The system SHALL render all landing-page user-facing and assistive content from Vietnamese and English frontend dictionaries selected by the active locale route. The localized contract SHALL cover the four feature chapters, Hero copy and feature links, three-step AnalysisFlow, ProviderIntegrations, the interactive product showcase and Scheduled Telegram demo, CTA and navigation labels, email behavior microcopy, locale-control labels, alternative text, document metadata, and social-card titles.

#### Scenario: Vietnamese landing copy
- **WHEN** a visitor opens `/vi`
- **THEN** the landing Hero renders `Hiểu thị trường qua Đồ thị Tri thức và AI.` and `Khám phá các mối liên hệ, theo dõi biến động giá trực tiếp, trò chuyện với Trợ lý AI và nhận cập nhật thị trường qua Telegram.`
- **AND** the four feature chapters render Vietnamese copy for Đồ thị Tri thức, Biểu đồ trực tiếp, Trợ lý AI, and Telegram
- **AND** the product showcase renders Vietnamese selectors for Đồ thị Tri thức, Biểu đồ thị trường, Hội thoại AI, and Telegram theo lịch
- **AND** its heading is `Xem cách Signapse biến dữ liệu thành hành động.`
- **AND** its Scheduled Telegram controls, workflow states, Demo label, Replay action, schedule summary, and message preview render in natural Vietnamese
- **AND** the AnalysisFlow uses the three approved Vietnamese titles and descriptions from the public landing contract
- **AND** CTA labels, navigation labels, provider-integration copy, email microcopy, metadata, social-card title, and accessibility labels render in natural Vietnamese from the selected dictionary

#### Scenario: English landing copy
- **WHEN** a visitor opens `/en`
- **THEN** the landing Hero renders `Understand markets through the Knowledge Graph and AI.` and `Explore relationships, follow live price movements, chat with the AI Assistant, and receive market updates through Telegram.`
- **AND** the four feature chapters render English copy for Knowledge Graph, Live charts, AI Assistant, and Telegram
- **AND** the product showcase renders English selectors for Knowledge Graph, Market Chart, AI Conversation, and Scheduled Telegram
- **AND** its heading is `See how Signapse turns data into action.`
- **AND** its Scheduled Telegram controls, workflow states, Demo label, Replay action, schedule summary, and message preview render in natural English
- **AND** the AnalysisFlow uses `Choose an asset, review price action`, `Open an event, check the sources`, and `Analyze with the AI Assistant` with their approved English descriptions
- **AND** CTA labels, navigation labels, provider-integration copy, email microcopy, metadata, social-card title, and accessibility labels render in English from the selected dictionary

#### Scenario: Dictionary parity includes the four-feature landing contract
- **WHEN** the frontend dictionaries are typechecked
- **THEN** Vietnamese and English dictionaries expose matching message keys for the four feature chapters, Hero feature links, three-step AnalysisFlow, product showcase selectors, Scheduled Telegram controls and states, CTA states, metadata, social artwork, locale navigation, and accessibility labels
- **AND** obsolete two-proof Hero, four-step AnalysisFlow, WorkspaceAssistant, Reaction & Evidence chapter, `workspace-ai`, and Market Query landing keys are absent when no runtime caller remains

#### Scenario: Landing copy avoids hardcoded user-facing strings
- **WHEN** the localized landing implementation is statically inspected
- **THEN** visible and assistive copy comes from the selected dictionary
- **AND** only canonical product identifiers, route fragments, the locked request-access address and subject, and other non-translated machine values may remain outside dictionary copy

#### Scenario: Locale-specific media text does not fall back across languages
- **WHEN** a localized feature capture or social card contains visible language-dependent text
- **THEN** the active route uses the corresponding Vietnamese or English asset or generated output
- **AND** a missing locale-specific feature capture causes text-first rendering for that slot rather than fallback to the other language

#### Scenario: Telegram copy preserves the approved claim boundary
- **WHEN** a visitor reads Vietnamese or English Telegram landing copy
- **THEN** the localized text describes configured market-news alerts, economic-calendar updates, and scheduled market analysis from Signapse
- **AND** it does not introduce claims about public channels, arbitrary threshold alerts, manual AI-answer delivery, guaranteed delivery/read state, or commercial exclusivity

#### Scenario: Scheduled Telegram demo copy remains an identified simulation

- **WHEN** a visitor reads the Vietnamese or English Scheduled Telegram showcase stage
- **THEN** the destination, route, schedule, watched-asset, local-send-time, schedule-timezone, and schedule-output-language concepts use the canonical localized product vocabulary
- **AND** the stage visibly identifies its fixed content as Demo
- **AND** its final status communicates a completed simulation rather than Telegram delivery or reading
- **AND** assistive labels communicate the same selected values and workflow state as the visible content
