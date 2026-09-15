# Signapse Domain

Signapse manages market intelligence workflows and the channels used to deliver operational notifications.

## Identity And Access

**Account profile (Hồ sơ tài khoản)**:
The authenticated user's self-service surface for viewing and editing personal information supported by the account contract.
_Avoid_: Billing settings, subscription profile, user management

**Account role (Vai trò tài khoản)**:
The authorization role assigned to a user and exposed as `role_name`; it is not a commercial tier.
_Avoid_: Package, plan, subscription tier

**API access token (Token truy cập API)**:
A short-lived credential an authenticated user obtains to call Signapse APIs under their own identity and permissions.
_Avoid_: Developer token, API key, system token, admin token

## Public Web Surfaces

**Coming-soon site**:
The temporary public announcement surface that represents Signapse before the full public product landing is released.
_Avoid_: Application landing page, production app

**Application landing page**:
The localized public product story delivered by the Signapse application and evaluated independently before any public cutover.
_Avoid_: Coming-soon site, dashboard

**Text-first landing**:
An application landing-page state that omits product captures when no locale-appropriate capture has been approved, while keeping the complete product story in text.
_Avoid_: Placeholder mock, synthetic product preview

**Approved product capture (Ảnh sản phẩm được duyệt)**:
A static capture of an available Signapse product surface or a real Signapse Telegram message, using demo data approved for public use and with the final image approved by the Product Owner. It illustrates an actual product state, not a conceptual visual or an interactive product demo.
_Avoid_: Generated product screenshot, private-workspace capture, live demo

**Interactive Telegram workflow demo (Demo tương tác quy trình Telegram)**:
A public DOM simulation of the supported scheduled asset-analysis workflow, using fixed demo data without calling the backend or sending a Telegram message. It may reproduce selected product concepts and states, but it is not a live product session or proof of delivery.
_Avoid_: Live demo, Telegram delivery test, approved product capture, synthetic product screenshot

**Interactive product showcase (Showcase sản phẩm tương tác)**:
A public landing section that presents the four primary Signapse capabilities through feature selectors and one shared demonstration stage. Each capability owns its stage content while the surrounding section preserves a consistent product-story hierarchy.
_Avoid_: Product card wall, screenshot gallery, live application workspace

**Interactive market-context figure (Hình bối cảnh thị trường tương tác)**:
A localized conceptual landing visual that presents the Market Knowledge Graph and price action as complementary views of market context. It has no visible control chrome, but supports fine-pointer hover and drag; coarse pointers do not expose a hidden tap mode. It begins once per page view with a brief graph-only rotation that settles automatically, supports nonvisual keyboard exploration with focus feedback, and keeps a silent dual-view fallback with a nonvisual description when rendering is unavailable. It is not a product capture and does not imply that the graph generates, predicts, or transforms into market prices.
_Avoid_: Product demo, live trading chart, graph-generated price, prediction visualization

**Price action (Diễn biến giá)**:
The conceptual view of observable market-price movement paired with the Market Knowledge Graph in the interactive market-context figure.
_Avoid_: Live trading chart, trading signal, price forecast, Knowledge Graph output

**Market Intelligence Platform (Nền tảng Market Intelligence)**:
The public product category for Signapse, which organizes inspectable price, event, reaction, source, and relationship data into Market Knowledge Graph context for AI-assisted market questions; the user owns the trading decision.
_Avoid_: AI-assisted market analysis workspace, AI trading engine, prediction engine, automated trading, trading signals

**Market Knowledge Graph (Đồ thị Tri thức thị trường)**:
The market-context structure built from multi-source market data through aggregation, evaluation, and analysis; it provides contextual input to the AI Assistant.
_Avoid_: Model-training corpus, prediction engine, trading-signal generator, guarantee that every Assistant response exposes complete evidence or sources

**AI conversation (Hội thoại với Trợ lý AI)**:
A text conversation with the Signapse AI Assistant that uses Market Knowledge Graph context to support market questions and relationship analysis, with history belonging to the active workspace.
_Avoid_: Chat with a selected graph node, automatic chart-context handoff, guaranteed source sheet

## Knowledge Graph Exploration

**Knowledge Graph demo surface (Bề mặt demo Đồ thị Tri thức)**:
An internal evaluation surface for comparing ways to browse the Market Knowledge Graph with a fixed representative graph; it is not the production Graph View and does not change the shared graph contract.
_Avoid_: Production Graph View, backend graph endpoint, product capture

**Landing release owner**:
The Signapse Product Owner accountable for approving the public landing cutover after collecting the required product and engineering sign-offs.
_Avoid_: Mailbox owner, deployment operator

## Feedback

**Feedback submission (Phản hồi)**:
A bug report or idea submitted by an authenticated user for review, optionally with a screenshot and technical context.
_Avoid_: Ticket, yêu cầu hỗ trợ, phiếu phản hồi

**Promoted feedback (Phản hồi đã chuyển xử lý)**:
A reviewed feedback submission selected for follow-up handling; this outcome does not by itself promise implementation.
_Avoid_: Phản hồi đã chấp nhận, công việc đã cam kết

**Dismissed feedback (Phản hồi không tiếp nhận)**:
A reviewed feedback submission not selected for follow-up handling; it is a review outcome, not deletion or user withdrawal.
_Avoid_: Phản hồi đã xóa, phản hồi đã rút

**Withdrawn feedback (Phản hồi đã rút)**:
A feedback submission retracted by its feedback sender and no longer accessible. Withdrawal is an outcome, not a persisted feedback status, and is distinct from administrative deletion.
_Avoid_: Phản hồi không tiếp nhận, phản hồi đã xóa

**Pending feedback (Phản hồi chờ xem xét)**:
A feedback submission awaiting its first review outcome.
_Avoid_: Phản hồi mới, ticket mở

**Administrative feedback deletion (Xóa phản hồi)**:
The irreversible removal of an existing feedback submission by an authorized administrator, regardless of review outcome; it is distinct from sender withdrawal and reviewer dismissal.
_Avoid_: Rút phản hồi, không tiếp nhận, lưu trữ phản hồi

**Feedback review message (Kết quả xem xét)**:
A user-visible explanation sent by a reviewer when a feedback submission is moved to follow-up handling or not accepted.
_Avoid_: Ghi chú nội bộ, admin note, private review note

**Feedback sender (Người gửi phản hồi)**:
The authenticated user who created a feedback submission.
_Avoid_: Reporter, tác giả, nhà báo

**Feedback action availability (Khả năng thao tác phản hồi)**:
Whether a feedback submission may currently be withdrawn, reviewed, or administratively deleted, based on its review state, the action scope, and the actor's permission. The backend remains the final authority when concurrent operations race.
_Avoid_: Backend capability flag, guaranteed mutation success

**Feedback technical context (Thông tin kỹ thuật của phản hồi)**:
Optional diagnostic metadata knowingly attached by the feedback sender, limited to the page path without query or fragment, application version, identified browser and operating system, locale, and bug observation time. It excludes page content, form data, raw user-agent, IP address, and device identifiers.
_Avoid_: Tracking data, page snapshot, telemetry payload

**Feedback screenshot (Ảnh chụp phản hồi)**:
A single manually selected PNG or JPEG image of at most 5 MiB and 25 megapixels attached to a feedback submission.
_Avoid_: Automatic capture, attachment, document upload

**Promoted feedback issue reference (Tham chiếu issue của phản hồi đã chuyển xử lý)**:
A positive GitHub issue number parsed from the configured-repository Issue URL supplied during promotion. It is moderation-only reference data and does not mean Signapse created the issue or promised implementation.
_Avoid_: Automatic GitHub issue, implementation commitment, personal feedback link

## Telegram

**Telegram bot connection (Bot Telegram)**:
A Telegram bot registered with Signapse to deliver messages to linked Telegram destinations.
_Avoid_: Kết nối bot when naming the entity

**Telegram destination (Điểm nhận)**:
A verified Telegram chat, group, or channel that Signapse can send messages to through its linked Telegram bot.
_Avoid_: Đích đến, Telegram connection

**Test message (Tin nhắn thử)**:
A fixed message generated by Signapse and sent to a Telegram destination to verify end-to-end delivery through its linked bot.
_Avoid_: Preview, test delivery, kiểm tra kết nối

**Telegram feature setting (Định tuyến tính năng Telegram)**:
The workspace-scoped configuration for one Telegram feature flow, including its delivery destination and enabled state. Calendar and news alert flows may also have a flow output-language override. The scheduled market-analysis flow retains its routing setting, but its flow output-language value is not part of current scheduled-delivery language resolution.
_Avoid_: Lịch gửi, cấu hình bot

**Feature output language (Ngôn ngữ đầu ra của luồng)**:
The optional language override on the economic-calendar or market-news Telegram feature setting. When absent, delivery falls back to the owner's preferred language and then the system default.
_Avoid_: Ngôn ngữ giao diện, ngôn ngữ của lịch

**Scheduled asset analysis (Lịch phân tích thị trường)**:
A recurring Telegram delivery that generates one market analysis for one asset currently tracked by a workspace.
_Avoid_: Lịch phân tích đa tài sản, lịch toàn bộ watchlist

**Signapse market analysis (Bản phân tích từ Signapse)**:
Market analysis generated by Signapse, including analysis delivered through a configured Telegram schedule. The name identifies its origin without implying commercial exclusivity or guaranteed trading results.
_Avoid_: Bản phân tích độc quyền, trading advice, guaranteed prediction

**Watched asset (Tài sản theo dõi)**:
An asset included in the active workspace's watchlist and eligible for workspace-scoped workflows.
_Avoid_: Tài sản không gắn với workspace, asset khi cần nói rõ phạm vi

**Local send time (Giờ gửi địa phương)**:
A minute-precision time used by a scheduled asset analysis in its configured timezone.
_Avoid_: Giờ UTC, thời điểm gửi tuyệt đối

**Schedule timezone (Múi giờ của lịch)**:
The timezone used to interpret a scheduled asset analysis's local send times.
_Avoid_: Múi giờ trình duyệt, múi giờ UTC mặc định

**Schedule output language (Ngôn ngữ đầu ra của lịch)**:
The optional language override used for the human-facing analysis generated by a scheduled asset analysis. When absent, delivery falls back directly to the owner's preferred language and then the system default; it does not inherit the scheduled-market-analysis feature setting's language.
_Avoid_: Ngôn ngữ giao diện, ngôn ngữ của Telegram

**Owner preferred language (Ngôn ngữ ưu tiên của chủ sở hữu)**:
The language preference of the owner of a Telegram delivery configuration. It is the fallback for Telegram delivery when no applicable output-language override is configured, before the system default.
_Avoid_: Locale đường dẫn, ngôn ngữ của trình duyệt

**Disabled schedule (Lịch đã vô hiệu hóa)**:
A scheduled asset analysis that no longer runs and cannot be reactivated through the UI.
_Avoid_: Lịch tạm dừng, lịch có thể tiếp tục

## Market Charts

**Upcoming economic calendar event (Sự kiện lịch kinh tế sắp diễn ra)**:
A scheduled economic announcement relevant to the selected chart asset whose scheduled time is still ahead of the current time. Its relevance and schedule are independent of whether price candles exist for that time.
_Avoid_: Market Event annotation, future candle, notification subscription

**Calendar lookahead interval (Khoảng lịch xem trước)**:
The future time span in which a user reviews scheduled economic calendar events relevant to the selected chart asset.
_Avoid_: Displayed candle interval, candle timeframe, available provider coverage

**Economic event awaiting publication (Sự kiện chờ công bố)**:
A scheduled economic announcement whose scheduled time has arrived but whose publication has not yet been confirmed. Leaving the chart's waiting group does not by itself mean the announcement was published or cancelled.
_Avoid_: Upcoming event, cancelled event, failed announcement

**Available candle (Nến khả dụng)**:
An actual OHLCV candle available for an asset and timeframe; a gap in provider history is not a candle.
_Avoid_: Time slot, missing candle

**Count-back request (Yêu cầu nến lùi)**:
A candle request that asks for up to a positive count of available candles immediately before its exclusive anchor, ignoring gaps. A short non-empty result can still have older available candles.
_Avoid_: Time-range backfill, slot count

**Candle boundary (Mốc nến)**:
An aligned UTC boundary between consecutive timeframe buckets. Initial chart history uses the end boundary of the current bucket, while older history uses the oldest returned candle boundary.
_Avoid_: Current wall-clock time, rounded timestamp

**Exhausted candle history (Lịch sử nến đã hết)**:
The terminal state in which a valid count-back request finds no older available candles at its requested anchor. A short non-empty response and a loading failure do not indicate exhaustion.
_Avoid_: Fetch error, empty state

**Displayed candle interval (Khoảng nến hiển thị)**:
The time span covered by the available candles rendered in the chart, rather than the requested calendar-time range.
_Avoid_: Requested range, provider gap

## Quick Detail Overlays

**Signapse entity quick detail (Quick detail)**:
A local modal reading overlay that keeps the owner context and URL in place while showing focused detail content. Dashboard and Graph View can open Event inspection or Article reader; Market Charts opens Event inspection only.
_Avoid_: Quick view, full detail page, global intercepted drawer, Inspector
