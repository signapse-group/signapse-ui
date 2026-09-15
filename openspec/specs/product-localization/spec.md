# product-localization Specification

## Purpose
TBD - created by archiving change add-product-localization. Update Purpose after archive.
## Requirements

### Requirement: Document Language Metadata

The system SHALL reflect the active app locale in document language metadata.

#### Scenario: Root layout renders

- **WHEN** the application root layout renders
- **THEN** the `<html>` element MUST use `lang="vi"` for Vietnamese and `lang="en"` for English

### Requirement: Dictionary-Backed User-Facing Copy

The system SHALL render product UI copy from Vietnamese and English frontend dictionaries.

#### Scenario: User-facing copy renders

- **WHEN** navigation, toolbar controls, buttons, forms, dialogs, sheets, empty states, errors, toasts, list labels, detail labels, placeholders, or accessibility labels are displayed
- **THEN** the visible or assistive text MUST come from the active locale dictionary

#### Scenario: Locale changes

- **WHEN** a user changes the app locale from Vietnamese to English or from English to Vietnamese
- **THEN** user-facing product copy MUST update to the selected language after the route refresh

#### Scenario: Dictionary parity

- **WHEN** the frontend dictionaries are typechecked
- **THEN** Vietnamese and English dictionaries MUST expose the same message keys

### Requirement: Editor feedback avoids native browser dialogs

The application SHALL present editor input and recoverable editor failures through dictionary-backed application dialogs or toasts and MUST NOT invoke browser-native `prompt()`, `alert()`, or `confirm()` dialogs from application paths.

#### Scenario: Application source is inspected for native dialogs

- **WHEN** the editor application paths are statically inspected
- **THEN** no reachable browser-native `prompt()`, `alert()`, or `confirm()` call remains

### Requirement: Canonical Identifiers Are Not Translated

The system SHALL NOT translate canonical API identifiers or persisted/generated domain content as part of frontend localization.

#### Scenario: Backend data contains canonical values

- **WHEN** the UI displays enum values, permission keys, provider identifiers, model names, endpoint paths, request field names, `$filter` fields, upstream provider content, persisted domain content, or AI-generated records
- **THEN** the system MUST preserve the canonical value unless an existing presentation helper intentionally maps that value to localized display copy

#### Scenario: Backend returns localized error message

- **WHEN** a backend error response includes a `message` field
- **THEN** the frontend MUST render that message as received
- **AND** MUST NOT infer or mutate a separate `language` field in the response body

### Requirement: Locale-Aware Formatting

The system SHALL format human-facing dates, times, numbers, percentages, and currency values according to the active app locale.

#### Scenario: Vietnamese locale formats values

- **WHEN** the active app locale is `vi`
- **THEN** user-facing date, time, number, percent, and currency formatting MUST use Vietnamese-compatible locale settings

#### Scenario: English locale formats values

- **WHEN** the active app locale is `en`
- **THEN** user-facing date, time, number, percent, and currency formatting MUST use English-compatible locale settings

#### Scenario: Machine identifiers render

- **WHEN** the UI displays machine identifiers, cron expressions, route paths, permission keys, model ids, or API field names
- **THEN** the system MUST NOT apply locale formatting that changes the identifier value

### Requirement: Backend Language Header Propagation

The system SHALL send the active app locale to backend APIs using the standard `Accept-Language` request header.

#### Scenario: Authenticated backend call

- **WHEN** `fetchAuthenticated()` calls a backend endpoint
- **THEN** the request MUST include `Accept-Language` set to the active app locale
- **AND** the request MUST include `Accept: application/json`

#### Scenario: Public backend call

- **WHEN** `fetchPublic()` calls a backend endpoint
- **THEN** the request MUST include `Accept-Language` set to the active app locale
- **AND** the request MUST include `Accept: application/json`

#### Scenario: JSON request body is sent

- **WHEN** a backend request sends a JSON body
- **THEN** the request MUST include `Content-Type: application/json`

#### Scenario: FormData request body is sent

- **WHEN** a backend request sends `FormData`
- **THEN** the request MUST NOT force `Content-Type: application/json`

#### Scenario: Backend returns language metadata

- **WHEN** a backend response includes `Content-Language`
- **THEN** the frontend MUST NOT require that header for ordinary UI rendering
- **AND** smoke checks MAY inspect that header for debugging or contract verification

### Requirement: Localization Documentation

The system SHALL document the frontend/backend language contract for maintainers.

#### Scenario: API mapping documentation is reviewed

- **WHEN** a developer reads the API mapping documentation
- **THEN** it MUST describe that frontend backend calls use `Accept-Language` from the active app locale
- **AND** it MUST note that localized backend errors retain the existing `message` response shape

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
