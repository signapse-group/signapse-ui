# Tài liệu ánh xạ API

Tài liệu này ánh xạ OpenAPI backend dev tại `https://dev-api.signapse.cloud/v3/api-docs` tới các điểm tích hợp frontend hiện tại của repo.

Xác minh lần cuối: ngày 26 tháng 8 năm 2026

## Cấu hình cơ sở

| Mục                  | Giá trị                                               |
| -------------------- | ----------------------------------------------------- |
| URL gốc API          | `https://dev-api.signapse.cloud`                      |
| Nguồn chuẩn          | `https://dev-api.signapse.cloud/v3/api-docs`          |
| Hàm auth chính       | `fetchAuthenticated()` trong `app/api/auth/action.ts` |
| Hàm public           | `fetchPublic()` trong `app/api/auth/action.ts`        |
| Kiểu mutation result | `ActionResult<T>` trong `app/lib/definitions.ts`      |
| Locale frontend      | URL prefix `/{lang}` (`vi` / `en`, fallback `vi`)          |

## Quy ước dùng chung

- Các request được bảo vệ đi qua `fetchAuthenticated()`.
- `apiFetch()` đọc `response.text()` trước khi parse JSON.
- `apiFetch()` resolve app locale from the active route locale (`x-signapse-locale` set by `proxy.ts` for page/action requests, with referer route fallback) and sends the same value as `Accept-Language` for both `fetchAuthenticated()` and `fetchPublic()`.
- `apiFetch()` gửi `Accept: application/json` mặc định, nhưng chỉ gửi `Content-Type: application/json` khi request có JSON body và không phải `FormData`.
- Frontend runtime list/search đang serialize query thành `$filter`, `page`, `size`, `sort` thông qua `queryParamsToString()`.
- OpenAPI vẫn mô tả list query bằng `specification` và `pageable`, nên cần tách biệt giữa spec contract và effective runtime contract mà frontend đang gọi.
- Snapshot backend hiện có `securitySchemes.bearerAuth` và metadata `x-signapse-auth` trên từng operation.
- `x-signapse-auth.type` hiện gồm `permission`, `active-user`, `authenticated`, và `public`; frontend vẫn gate UI bằng permission list lấy từ `/me`.

## Contract ngôn ngữ frontend/backend

- Frontend uses the URL prefix `/{lang}` as the product language source of truth. Valid values are `vi` and `en`; unprefixed page requests are redirected by `proxy.ts` using `Accept-Language`, with `/vi` fallback.
- Backend-generated human-facing message được yêu cầu bằng HTTP header chuẩn `Accept-Language`, ví dụ `Accept-Language: vi` hoặc `Accept-Language: en`. Frontend không gửi custom header như `Language`.
- Localized backend error giữ nguyên response shape hiện tại: frontend đọc và render trường `message` như backend trả về, không suy luận hoặc mutate thêm field `language`.
- Backend có thể trả `Content-Language` và `Vary: Accept-Language` cho response localized. Frontend không cần header này để render UI thường ngày; smoke check có thể dùng để debug contract.
- Frontend không dịch canonical API identifiers hoặc domain content ở lớp API mapping, gồm enum values, permission keys, provider ids, endpoint paths, request field names, `$filter` fields, upstream provider content, persisted content, và AI-generated records.

## Tổng quan thay đổi lớn từ snapshot hiện tại

- Snapshot backend hiện tại gồm `127` operation.
- Lần đồng bộ live ngày 15/8/2026 xác nhận mapping cần bao phủ thêm `PATCH /me`, `GET /users`, `PATCH /users/{id}`, và `POST /script`; `UserResponse.preferredLanguage` là object `LanguageResponse` nullable, không phải ISO string.
- Snapshot ngày 11/8 mở rộng `GET /dashboard/summary` thêm hai metric bắt buộc `assetsInFocus` và `marketNarratives`. Backend trả tối đa sáu tài sản và ba luận điểm theo thứ tự authoritative; frontend đã parse/render `recentEvents` và `assetsInFocus`, nhưng chưa parse hoặc render `marketNarratives`.
- Backend đã chuyển domain nội dung canon từ `sources` / `source-documents` sang `news-outlets` / `news-articles`.
- Backend đã unlink `NewsArticle` khỏi `NewsOutlet`: bài viết snapshot tên nguồn vào `sourceName` khi ingest, nên việc đổi tên hoặc xóa outlet không làm thay đổi nguồn đã lưu trên bài viết. Snapshot OpenAPI và frontend hiện đã đồng bộ contract này.
- Backend vẫn giữ các surface `events`, `query`, và `graph-view`, nhưng nhiều payload đã đổi naming từ `sourceDocument*` sang `artifact*` hoặc `news-article`.
- Surface `events` có thêm workflow derive market reactions cho từng event và batch pending events.
- Surface `market-charts` tiep tuc cung cap du lieu nen OHLCV qua endpoint `GET /market-charts/candles`; snapshot moi da tach annotation sang `GET /market-charts/annotations`.
- Snapshot moi tiep tuc toi gian slug: `events`, `news-outlets`, `workspaces`, va `assets` khong con expose `slug`; `NewsOutletListResponse` cung khong con `description`.
- Snapshot backend hiện publish metadata permission chính thức qua `x-signapse-auth`, trong đó một số gate frontend cũ cần được rà lại theo permission mới.
- Frontend hiện đã có route và workbench cho `market-query` và `graph-view`, nhưng vẫn còn lệch contract với snapshot backend mới.
- Frontend đã có surface canon `news-outlets` và `news-articles`; các route legacy `/sources*`, `/news-sources*`, và `/source-documents*` hiện chỉ còn redirect compatibility.
- Legacy source implementation files for `/sources` have been removed; only redirect pages remain so old bookmarks continue to land on `/news-outlets`.
- Surface workspace dùng chuẩn `set-current`, đồng thời `WorkspaceResponse` dùng field có nghĩa `currentWorkspace`.
- `roles` và `permissions` hiện đã có action và UI frontend, không còn ở trạng thái "chưa triển khai".
- Snapshot mới thêm surface `telegram` gồm bot connections, destinations, feature settings, market analysis schedules, và webhook Telegram.
- Live contract ngày 25/8 thêm surface `feedback` gồm luồng user tự gửi/xem/rút feedback và luồng quản trị đọc, promote, dismiss, tải screenshot, hoặc xóa. Frontend đã tích hợp authenticated actions, screenshot proxy, permission-aware navigation và HTTP fixture parity; live OpenAPI structural verification pass, còn effective runtime semantics được ghi trực tiếp trong mục feedback bên dưới.
- Snapshot ngày 14/8 giản lược quản trị bot và destination Telegram: bỏ `PATCH /telegram/bot-connections/{id}` và `PATCH /telegram/destinations/{id}`; `CreateTelegramBotConnectionRequest` chỉ còn field bắt buộc `botToken`. Bản build dev đã khôi phục `POST /telegram/destinations/{destinationId}/test-message` với response `204 No Content`.
- Snapshot mới thêm credential sub-resource cho `ai-provider-configs` để quản lý nhiều API key theo từng provider config mà không expose full key.
- Snapshot mới tiếp tục giản lược `ai-provider-configs`: config request/response không còn `name` và top-level `model`; credential dùng field `model` thay cho `label`.
- Snapshot mới giản lược `cronjobs`: không còn endpoint create/delete cronjob; update schedule chỉ nhận `expression`.
- Snapshot mới đổi personal notes dưới `/me/notes` sang nội dung JSON có version; list chỉ trả summary có `title`, còn detail/create/update dùng `content` dạng mảng, `contentSchemaVersion`, và response có `title`.
- Snapshot mới thêm API `languages`, persisted preferred language trên `/me/preferred-language`, và field `preferredLanguage` trong `UserResponse`.
- Snapshot mới thêm domain `narratives`, đồng thời mở rộng `market-query` với `keyNarratives[]` và `graph-view` với node/edge narrative.
- Snapshot mới bỏ endpoint `POST /news-articles/{id}/crawl-full-content`, mở rộng `system-prompts` với `responseSchema`/`localizedNames`, và thêm `evidenceNote` cho market query evidence.
- Snapshot mới thêm `POST /watchlists/assets` để bulk create watchlist assets; `responseSchema` của system prompts hiện là JSON object inline, không còn component schema `JsonNode`.
- Snapshot mới thêm `GET /market-charts/live` cho live chart stream dạng `text/event-stream`, và `GET /market-charts/economic-calendar-events` cho event lịch kinh tế trên chart; cả hai dùng permission `market-chart:read`.
- Snapshot ngày 27/7 thêm `pricePrecision` kiểu `integer(int32)` vào `AssetListResponse`, `AssetResponse`, và `MarketChartAssetResponse`; candles trả field này tại `asset.pricePrecision`, còn SSE snapshot runtime dùng cùng `MarketChartAssetResponse`.
- Snapshot ngày 30/7 bỏ `contentAvailable` khỏi `EconomicCalendarListResponse` và `MarketChartEconomicCalendarEventResponse`; `EconomicCalendarResponse` đồng thời bỏ cả `content` và `contentAvailable`.
- Snapshot có workflow market conversations / persisted analyses dưới permission `query:execute`; frontend hiện tích hợp hội thoại text-only, còn analysis/evidence/Telegram delivery không có surface hoặc action.
- Snapshot ngày 7/6 đổi tên OpenAPI schema của market conversations sang nhóm `Conversation*` và đổi timestamp conversation/message sang `createdDate` / `lastModifiedDate`.
- Snapshot ngày 11/6 thêm `GET /market-conversations/{conversationId}/messages` để tải lịch sử message theo cursor `beforeMessageId` và `size`.
- Contract conversation hiện chỉ trả message text với `role`, `status`, `content`, `failureReason`, và `createdDate`; không còn `kind`, `analysisId`, hoặc status `PENDING`.
- Snapshot ngày 25/6 bỏ `warm-episode` khỏi topology `graph-view`; `GraphNodeMetadata.knowledgeLayer` vẫn còn là metadata `HOT` / `WARM` trên các node hiện tại.
- Snapshot ngay 18/6 cap nhat `graph-view`: bo node kind `theme`, bo edge kind `event-theme`, va them `metadata.themes[]` cho node `event` / `narrative`; event themes lay tu `EventTheme[]` co `relationType`, narrative theme lay tu `Narrative.primaryTheme`.
- Snapshot mới mở rộng asset type enum từ `COMMODITY`, `CRYPTO`, `FX`, `INDEX` thành thêm `EQUITY`, `ETF` trên assets, watchlists, events, narratives, graph metadata, và market charts.

## Phạm vi endpoint

### 1. API system prompts

| Phương thức | Endpoint backend               | operationId          | Tích hợp frontend                | Trạng thái    | Ghi chú                                                                  |
| ----------- | ------------------------------ | -------------------- | -------------------------------- | ------------- | ------------------------------------------------------------------------ |
| GET         | `/system-prompts`              | `getSystemPrompts`   | `getSystemPrompts(searchParams)` | Đã triển khai | List route `/system-prompts` dùng `Page<SystemPromptResponse>` và ưu tiên tên localized/backend khi hiển thị. |
| POST        | `/system-prompts`              | `createSystemPrompt` | `createSystemPrompt(request)`    | Đã triển khai | Form tạo mới gửi `promptType`, `content`, `responseSchema`, và `localizedNames` khi user nhập tên hiển thị. |
| GET         | `/system-prompts/{promptType}` | `getSystemPrompt`    | `getSystemPromptByType(type)`    | Đã triển khai | Trang chỉnh sửa dùng `promptType` đã URL-encode, load nội dung prompt, tên localized, và schema đầu ra. |
| PUT         | `/system-prompts/{promptType}` | `updateSystemPrompt` | `updateSystemPrompt(type, data)` | Đã triển khai | Form cập nhật gửi `content`, `responseSchema`, và `localizedNames` khi tên hiển thị được chỉnh sửa. |
| DELETE      | `/system-prompts/{promptType}` | `deleteSystemPrompt` | `deleteSystemPrompt(type)`       | Đã triển khai | Action xóa có `AlertDialog` và gate bằng `system-prompt:delete`.         |

Frontend liên quan:

- `app/api/system-prompts/action.ts`
- `app/lib/system-prompts/definitions.ts`
- `app/lib/system-prompts/permissions.ts`
- `app/(main)/system-prompts/*`

Ghi chú:

- Enum `promptType` trong snapshot hiện tại gồm `FIRECRAWL_SOURCE_DOCUMENT_FILTER`, `NEWS_ARTICLE_CONTENT_LOCALIZATION`, `NEWS_PRIMARY_EVENT_DERIVATION`, `EVENT_ASSET_THEME_ENRICHMENT`, `EVENT_MARKET_REACTION_DERIVATION`, `EVENT_NARRATIVE_REFRESH`, `EVENT_GROUNDED_MARKET_QUERY_SYNTHESIS`, `MARKET_QUERY_CONVERSATION_ORCHESTRATION`, `TELEGRAM_CALENDAR_ALERT_ASSESSMENT`, `TELEGRAM_NEWS_ALERT_ASSESSMENT`, và `TELEGRAM_MARKET_ANALYSIS`; nhóm legacy `NEWS_FILTER`, `NEWS_ANALYSIS`, `SIGNAL_GENERATION`, `DECISION_MAKING`, `CONTENT_EXTRACTION`, `SENTIMENT_ANALYSIS`, `TITLE_GENERATION`, `SUMMARY_GENERATION`, `CONTENT_CLEANING` không còn trong snapshot.
- `CreateSystemPromptRequest` hiện yêu cầu `promptType`, `content`, `responseSchema`; `UpdateSystemPromptRequest` có thêm optional `responseSchema` và `localizedNames`.
- `SystemPromptResponse` hiện có thêm `name`, `responseSchema`, `localizedNames`; `responseSchema` là JSON object inline (`type: object`, `additionalProperties: {}`), frontend model bằng JSON value và cung cấp schema editor dạng builder + JSON.
- Frontend validate `content` không được rỗng sau khi `trim()` và không vượt quá `10000` ký tự; `responseSchema` phải là JSON parse được trước khi submit.

### 2. API news outlets

| Phuong thuc | Endpoint backend                   | operationId            | Tich hop frontend                    | Trang thai    | Ghi chu                                                                                                                                        |
| ----------- | ---------------------------------- | ---------------------- | ------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/news-outlets`                    | `getNewsOutlets`       | `getNewsOutlets(searchParams)`       | Da trien khai | List route canon `/news-outlets` da dung `Page<NewsOutletListResponse>` va search/sort theo contract moi.                                      |
| POST        | `/news-outlets`                    | `createNewsOutlet`     | `createNewsOutlet(request)`          | Da trien khai | Form tao moi chi gui cac field snapshot moi ho tro: `name`, `description`, `homepageUrl`, `rssUrl`, `active`; khong con gui `slug`.            |
| GET         | `/news-outlets/{id}`               | `getNewsOutlet`        | `getNewsOutletById(id)`              | Da trien khai | Detail-edit route canon `/news-outlets/{id}` hydrate theo `NewsOutletResponse` khong con `slug`.                                               |
| PUT         | `/news-outlets/{id}`               | `updateNewsOutlet`     | `updateNewsOutlet(id, request)`      | Da trien khai | Form cap nhat chi gui cac field snapshot moi ho tro va khong con gui `slug` hay cac field legacy nhu `type`, `url`, `systemManaged`.           |
| DELETE      | `/news-outlets/{id}`               | `deleteNewsOutlet`     | `deleteNewsOutlet(id)`               | Da trien khai | Action xoa da duoc gate bang permission `news-outlet:delete`.                                                                                  |
| PATCH       | `/news-outlets/{id}/toggle-active` | `toggleActive`         | `toggleNewsOutletActive(id)`         | Da trien khai | Toggle active da duoc gate bang permission `news-outlet:update` va refresh lai list/detail sau mutation.                                       |
| GET         | `/news-outlets/active`             | `getActiveNewsOutlets` | `getActiveNewsOutlets(searchParams)` | Da trien khai | Helper moi da map dung response paginated `Page<NewsOutletListResponse>`; neu dung cho combobox thi FE can doc `content[]` de flatten khi can. |

Frontend lien quan:

- `app/api/news-outlets/action.ts`
- `app/lib/news-outlets/definitions.ts`
- `app/lib/news-outlets/permissions.ts`
- `app/(main)/news-outlets/*`
- `app/(main)/sources/*` (redirect compatibility)
- `app/(main)/news-sources/*` (redirect compatibility)

Ghi chu:

- `NewsOutletListResponse` hien chi con `id`, `name`, `homepageUrl`, `rssUrl`, `active`, `createdDate`; khong con `slug` hoac `description` tren list item.
- `NewsOutletResponse` hien dung `id`, `name`, `description`, `homepageUrl`, `rssUrl`, `active`, `createdDate`, `lastModifiedDate`; khong con `slug`.
- FE `app/lib/news-outlets/definitions.ts`, `app/(main)/news-outlets/news-outlet-create-form.tsx`, va `app/(main)/news-outlets/news-outlet-update-form.tsx` da bo `slug` khoi DTO, form, va payload de khop snapshot moi.
- Frontend da dung route canon `/news-outlets`; navigation "Nguon tin" trong `config/site.ts` da tro ve surface nay va duoc gate bang `news-outlet:read`.
- Cac route legacy `/sources*` va `/news-sources*` chi con redirect ve `/news-outlets*` de giu deeplink va bookmark cu; data layer va list/form/search legacy cua `/sources` da duoc xoa.
- Snapshot backend khong con field `type`, `systemManaged`, ingest metadata, hoac endpoint `/sources*`.

### 3. API news articles

Day la domain noi dung canon cua snapshot backend hien tai.

| Phuong thuc | Endpoint backend                            | operationId               | Tich hop frontend                            | Trang thai                            | Ghi chu                                                                                                                                                                                |
| ----------- | ------------------------------------------- | ------------------------- | -------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/news-articles`                            | `getNewsArticles`         | `getNewsArticles(searchParams)`              | Da trien khai                         | FE list doc `sourceName` da snapshot va giu fallback hien tai khi response thieu ten nguon.                                                                                           |
| GET         | `/news-articles/{id}`                       | `getNewsArticle`          | `getNewsArticleById(id)`                     | Da trien khai                         | FE detail va quick detail doc cung `sourceName` da snapshot trong provenance row.                                                                                                     |
| DELETE      | `/news-articles/{id}`                       | `deleteNewsArticle`       | `deleteNewsArticle(id)`                      | Da trien khai                         | Route canon va nut operator da doi naming sang `news-article`.                                                                                                                         |
| POST        | `/news-articles/{id}/derive-primary-event`  | `derivePrimaryEvent`      | `derivePrimaryEventFromNewsArticle(id)`      | Da trien khai                         | `NewsPrimaryEventDerivationResult` dung `newsArticleId`, `newsArticleTitle`, `status`, `changeType`, `eventId`, `eventCanonicalKey`.                                                   |
| POST        | `/news-articles/derive-pending-news-events` | `derivePendingNewsEvents` | `derivePendingNewsArticleEvents(batchSize?)` | Da trien khai                         | Batch result dung `PendingNewsEventDerivationBatchResult` va summary helper moi theo naming `news-article`.                                                                            |
| PATCH       | `/news-articles/{id}/feature-image`         | `updateFeatureImage`      | `updateNewsArticleFeatureImage(id, request)` | Da trien khai                         | Data layer canon nam trong `app/api/news-articles/action.ts`.                                                                                                                          |

Frontend lien quan:

- `app/api/news-articles/action.ts`
- `app/lib/news-articles/definitions.ts`
- `app/lib/news-articles/permissions.ts`
- `app/(main)/news-articles/*`
- `app/(main)/source-documents/page.tsx`
- `app/(main)/source-documents/[id]/page.tsx` (redirect compatibility)

Ghi chu:

- `NewsArticleListResponse` hien gom `id`, `title`, `description`, `url`, `featureImage`, `sourceName`, `publishedAt`, `status`, `createdDate`.
- `NewsArticleResponse` hien gom `id`, `title`, `description`, `content`, `url`, `featureImage`, `sourceName`, `publishedAt`, `status`, `createdDate`, `lastModifiedDate`, `linkedEvents`; `externalKey` khong con trong snapshot.
- `sourceName` la snapshot bat buoc tren entity: ingestion trim ten outlet khi tao article; rename/delete outlet va ingest lai cung URL khong mutate gia tri da snapshot.
- OpenAPI khai bao `sourceName` la `string`, khong danh dau nullable va khong dua vao mang `required`; FE giu field optional de khop contract generate.
- Enum `status` hien tai la `INGESTED`, `DERIVATION_PENDING`, `EVENT_RESOLVED`, `NO_PRIMARY_EVENT`, `CONTENT_FAILED`, `DERIVATION_FAILED`.
- `LinkedEventSummaryResponse` gom `eventId`, `eventTitle`, `eventCanonicalKey`, `eventStatus`, `evidenceRole`, `evidenceConfidence`, va `evidenceNote`; `eventStatus` dung enum `ENRICHMENT_PENDING`, `ENRICHED`, `ENRICHMENT_NO_MATCH`, `ENRICHMENT_FAILED`, `ARCHIVED`, va khong con `eventEnrichmentStatus`.
- Live OpenAPI v3.1.0 van khai bao `linkedEvents[]` voi `eventId`, `eventTitle`, `eventCanonicalKey`, `eventStatus`, `evidenceRole`, `evidenceConfidence`, va `evidenceNote`; FE giu field nay trong DTO, nhung detail va quick detail khong render linked-event UI hoac event navigation.
- FE `app/lib/news-articles/definitions.ts`, list, detail, va quick detail da dong bo sang `sourceName` ma khong giu compatibility alias.
- Navigation "Noi dung" da tro ve `/news-articles`; route `/source-documents*` chi con redirect sang surface canon moi.
- Snapshot backend khong con `lifecycleStatus`, `readinessStatus`, `eventDerivationStatus`, `documentType`, hoac endpoint canon `/source-documents*`.
- Endpoint `POST /news-articles/{id}/analyze` va `POST /news-articles/{id}/crawl-full-content` khong con nam trong snapshot OpenAPI hien tai; FE da go manual analyze, nhung `crawlNewsArticleFullContent()` va menu crawl tren detail hien con go endpoint da bi bo.

### 4. API events

| Phuong thuc | Endpoint backend                           | operationId                    | Tich hop frontend                               | Trang thai    | Ghi chu                                                                                                                                                                                               |
| ----------- | ------------------------------------------ | ------------------------------ | ----------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/events`                                  | `getEvents`                    | `getEvents(searchParams)`                       | Da trien khai | Frontend co route `/events`, toolbar batch-enrich + batch derive market reactions + search, sort, phan trang, va render schema moi voi `description`, mot badge `status`, `occurredAt`, `confidence`. |
| GET         | `/events/{id}`                             | `getEvent`                     | `getEventById(id)`                              | Da trien khai | Detail da uu tien status, confidence, thoi diem, description, evidence-first, action cluster ben phai title, va render section `marketReactions[]`.                                                   |
| POST        | `/events/{id}/enrich-assets-and-themes`    | `enrichAssetsAndThemes`        | `enrichEventAssetsAndThemes(id)`                | Da trien khai | Co nut operator tren event detail; toast summary da dung `EventEnrichmentResult.outcome` enum `ENRICHMENT_*` + `ARCHIVED`.                                                                            |
| POST        | `/events/{id}/derive-market-reactions`     | `deriveMarketReactions`        | `deriveEventMarketReactions(id)`                | Da trien khai | Co nut operator tren event detail; toast summary dung `reactionCount`, `neutralCount`, va `message`.                                                                                                  |
| POST        | `/events/enrich-pending-assets-and-themes` | `enrichPendingAssetsAndThemes` | `enrichPendingEventAssetsAndThemes(batchSize?)` | Da trien khai | Co nut batch tren event list; batch summary da tinh ca `deferredCount`.                                                                                                                               |
| POST        | `/events/derive-pending-market-reactions`  | `derivePendingMarketReactions` | `derivePendingEventMarketReactions(batchSize?)` | Da trien khai | Co nut batch tren event list; toast summary dung `selectedCount`, `processedCount`, `skippedCount`, `derivedCount`, `neutralCount`, `failedCount`.                                                    |

Frontend lien quan:

- `app/api/events/action.ts`
- `app/lib/events/definitions.ts`
- `app/lib/events/permissions.ts`
- `app/(main)/events/*`

Ghi chu:

- `event:read` dung de gate navigation, `/events`, `/events/{id}`, va cac link sang event detail.
- Snapshot backend hien gate event enrich operators va market reaction derivation bang `news-article:analyze`; FE events da gate bang permission canon nay truoc va chi giu `source-document:analyze` nhu alias compatibility tam thoi.
- `EventListResponse` va `EventResponse` hien dung `description` thay `summary`, `status` enum `ENRICHMENT_PENDING`, `ENRICHED`, `ENRICHMENT_NO_MATCH`, `ENRICHMENT_FAILED`, `ARCHIVED`, va khong con `slug`, `confirmedAt`, `active`, `enrichmentStatus`, `enrichmentAttemptedAt`, `enrichmentCompletedAt`, `enrichmentError`.
- `EventEvidenceSummaryResponse` hien dung `newsArticleId`, `newsArticleTitle`, `newsArticleUrl`, `sourceName`, `publishedAt`, `evidenceRole`, `confidence`, `evidenceNote`; FE event detail va quick detail da doc `sourceName` trong evidence provenance.
- `EventEnrichmentResult.outcome` cung dung enum `ENRICHMENT_PENDING`, `ENRICHED`, `ENRICHMENT_NO_MATCH`, `ENRICHMENT_FAILED`, `ARCHIVED`.
- Batch enrichment result cua `/events/enrich-pending-assets-and-themes` da co them field `deferredCount`; frontend da surface trong toast summary.
- `EventResponse` co them `marketReactions[]` gom `id`, `assetId`, `assetName`, `assetSymbol`, `assetType`, `direction`, `timeHorizon`, `confidence`, `reasoning`, `observedAt`; FE da map DTO va render trong section `Tac dong thi truong` tren detail event.
- Market reaction enums moi: `direction` gom `BULLISH`, `BEARISH`, `MIXED`, `NEUTRAL`; `timeHorizon` gom `INTRADAY`, `SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`.
- `EventMarketReactionDerivationResult` gom `eventId`, `eventTitle`, `eventCanonicalKey`, `reactionCount`, `neutralCount`, `message`; batch result gom `requestedBatchSize`, `selectedCount`, `processedCount`, `skippedCount`, `derivedCount`, `neutralCount`, `failedCount`, `results[]`.
- Detail event hien sap xep `evidence` truoc `marketReactions`, `assets`, va `themes`; vung thong tin ky thuat chi giu cac field snapshot hien tai nhu `canonicalKey`, `createdDate`, `lastModifiedDate`.

### 5. API market charts

| Phuong thuc | Endpoint backend         | operationId  | Tich hop frontend                | Trang thai                                | Ghi chu                                                                                                                                                                                                                                              |
| ----------- | ------------------------ | ------------ | -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/market-charts/candles` | `getCandles` | `getMarketChartCandles(request)` | Da tich hop count-back | Endpoint duoc gate backend bang `market-chart:read`; OpenAPI live `3.1.0` van mo ta schema request co `from` va `countBack`, nhung BE handoff xac nhan hai mode tach biet: chart history dung `assetId`, `timeframe`, `to`, `countBack`, khong gui `from`; exact-range van giu cho use case khac va gui dong thoi `from + to + countBack` bi tu choi `400`. FE parse `MarketChartCandleResponse.asset.pricePrecision` va dung field nay de cau hinh chart. |
| GET         | `/market-charts/annotations` | `getAnnotations` | `getMarketChartAnnotations(request)` | Da trien khai | FE parse timeline top-level `HOT_EVENT` / `WARM_EPISODE`, render marker va warm overlay tu nested `hotEvent` / `warmEpisode`. |
| GET         | `/market-charts/economic-calendar-events` | `getEconomicCalendarEvents` | `getMarketChartEconomicCalendarEvents(request)` | Da tich hop | Contract va FE type/parser/canvas deu khong con `contentAvailable`. |
| GET         | `/market-charts/live`    | `streamLive` | `/api/market-charts/live` + `openMarketChartLiveStream()` | Da dong bo `pricePrecision` | FE da proxy SSE, parse `snapshot` / `price` / `candle` / `status` / `error`, va cap nhat live state. Shared asset schema preserve `snapshot.asset.pricePrecision`; OpenAPI chi expose `SseEmitter`, nen shape event duoc xac minh tu source BE. |

Frontend lien quan:

- `app/api/market-charts/action.ts`
- `app/lib/market-charts/definitions.ts`
- `app/lib/market-charts/permissions.ts`
- `app/api/market-charts/live/route.ts`
- `app/[lang]/(main)/market-charts/page.tsx`
- `app/[lang]/(main)/market-charts/market-chart-live-stream.ts`
- `app/[lang]/(main)/market-charts/market-chart-workbench.tsx`
- `app/[lang]/(main)/market-charts/market-chart-canvas.tsx`
- `app/api/watchlists/action.ts`
- `app/lib/watchlists/definitions.ts`
- Surface nay nhieu kha nang se anh huong toi `market-query` neu can hien thi chart context ben canh ket qua phan tich.

Ghi chu:

- Query contract hien duoc khai bao qua object `request` trong query string, tham chieu schema `MarketChartCandleRequest`.
- `MarketChartCandleRequest` trong OpenAPI gom `assetId`, `timeframe`, `from`, `to`, va `countBack` (`integer`, `int32`); OpenAPI live khong danh dau min/max/default. Theo BE handoff, FE chart history validate `countBack` trong `1..1000`, dung `to` exclusive phai aligned theo timeframe va khong gui `from`; `from + to` chi con cho exact-range use case.
- `MarketChartAnnotationRequest` gom `assetId`, `from`, `to`; range dung `[from, to)`, `from` inclusive va `to` exclusive; response cua `/market-charts/annotations` la mang `MarketChartAnnotationResponse`.
- Live dev OpenAPI 3.1.0 ngày 08/09/2026 xác nhận `GET /market-charts/economic-calendar-events` (`getEconomicCalendarEvents`) nhận schema query `MarketChartEconomicCalendarEventRequest` gồm `assetId`, `from`, `to`, và mảng `impact`; frontend serialize mỗi impact thành query parameter lặp.
- `MarketChartEconomicCalendarEventResponse` gồm `id`, `assetId`, `time`, `title`, `currencyCode`, `type`, `impact`, `forecastValue`, `previousValue`, `actualValue`, `revision`, `actualBetterWorse`, `revisionBetterWorse`, `description`, `status`, và `scheduledAt`; OpenAPI hiện không đánh dấu required/nullability cho các field này, chỉ xác nhận `time` và `scheduledAt` là date-time, còn `status` chỉ gồm `PENDING` và `AVAILABLE`. Contract không xác định field timestamp ưu tiên hoặc bảo đảm provider có đủ lịch tương lai; frontend phải xử lý theo semantics được backend xác nhận trước khi dùng lookahead.
- `MarketChartLiveRequest` gom `assetId` va `timeframe`; response cua `/market-charts/live` la `text/event-stream`. OpenAPI chi mo ta `SseEmitter.timeout`, con runtime snapshot gom `asset`, `symbol`, `timeframe`, `quote`, `candle`, `status`.
- `MarketChartCandleItemResponse` gom `time`, `open`, `high`, `low`, `close`, `volume`, `partial`.
- `MarketChartCandleResponse` gom optional `symbol`, `asset: MarketChartAssetResponse`, `timeframe`, `from`, `to`, va `candles[]`; `MarketChartAssetResponse` moi co optional `pricePrecision`; annotation khong con nam trong candle response.
- `MarketChartAnnotationResponse` moi chi giu top-level shell gom `id`, `annotationType`, `assetId`, `time`, `hotEvent?`, va `warmEpisode?`; `annotationType` chi gom `HOT_EVENT` va `WARM_EPISODE`.
- `HOT_EVENT` render marker diem tai top-level `time`; noi dung popup lay tu `hotEvent` gom `eventId`, `severity`, `direction`, `title`, `summary`, `confidence`, `topMarketReaction`, `marketReactions[]`, `evidence[]`, va `links.eventDetail`.
- `WARM_EPISODE` render overlay/range tu `warmEpisode.periodStart` den `warmEpisode.periodEnd`; top-level `time` bang `periodStart`. Noi dung warm gom `warmEpisodeId`, `direction`, `summary`, `outcome`, va `events[]`.
- Warm event khong con dung top-level annotation rieng; FE neu can marker nho trong overlay thi flatten `warmEpisode.events[]`. Moi warm event gom `warmEpisodeEventId`, `time`, `severity`, `direction`, `title`, `summary`, `confidence`, `relationType`, va `reaction`.
- `MarketChartAnnotationReactionResponse` gom `id`, `direction` (`BULLISH` | `BEARISH` | `NEUTRAL`), `timeHorizon`, `confidence`, `reasoning`, `observedAt`, va `outcome`; enum `MIXED` khong con nam trong contract annotation reaction moi.
- `MarketChartAnnotationOutcomeResponse` gom `anchorTime`, `anchorPrice`, `evaluationTime`, `evaluationPrice`, `realizedReturn`, `actualDirection` (`BULLISH` | `BEARISH` | `NEUTRAL`), `alignment`, `evaluatedAt`, va `summary`.
- FE da dong bo DTO/Zod/UI sang nested `hotEvent` / `warmEpisode` va khong con dung `WARM_EVENT` top-level.
- UI khong expose `from` hoac `to` nhu form input. Route state chi gom `assetId` va `timeframe`; FE resolve asset tu `GET /watchlists`, gui `assetId` cho chart action, va de backend so huu provider-symbol resolution.
- FE candle DTO, Zod request validation, query builder, initial load, va lazy older-history load da dung count-back mode. Initial/refresh anchor la end boundary UTC hien tai; older anchor la dung `time` candle cu nhat; short non-empty page van pageable, chi empty exact (`candles=[]`, `from=to=anchor`) moi exhausted. FE bao toan `partial`, khong synthetic/forward-fill, va tu suy ra displayed interval de gui annotation/calendar; loi provider/API va paging contract violation van retryable.
- FE khong con gui `includeAnnotations`; layer su kien chi dieu khien viec fetch/hien thi marker tu endpoint `/market-charts/annotations`.
- UI dung KLineChart de render nen OHLCV, render marker notification tu annotation endpoint data, group cac annotation cung moc thoi gian, va mo popup detail/evidence/link su kien khi user chon marker hoac moc su kien accessible ben ngoai canvas. Lazy historical loading da duoc trien khai cho huong tai nen cu hon bang endpoint `/market-charts/candles` va fetch annotation rieng cho cung cua so khi layer su kien duoc bat; trade recommendation van chua trien khai ve UI.
- FE truyen `asset.pricePrecision` tu candle data xuong `MarketChartCanvas`, cap nhat `klinecharts.setSymbol()` khi symbol hoac precision thay doi, va chi fallback ve `4` khi backend tra `null` hoac thieu field.
- `GET /watchlists` chua expose `assetPricePrecision` trong snapshot va source BE hien tai. Field nay khong bat buoc cho chart vi candle response da la nguon precision chinh; chi them neu UI can precision truoc khi candle request hoan tat.

### 6. API market query

| Phuong thuc | Endpoint backend                              | operationId          | Tich hop frontend      | Trang thai                            | Ghi chu                                                                                                                                                                                                                                          |
| ----------- | --------------------------------------------- | -------------------- | ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST        | `/query`                                      | `query`              | `queryMarket(request)` | Khong con UI route | Legacy action/DTO con giu de compatibility voi contract cu, nhung frontend khong con route `/market-query` hoac redirect compatibility. |
| GET         | `/market-conversations`                       | `getConversations`   | `getMarketConversations(searchParams)` | Da tich hop | List persisted market conversations, response OpenAPI `PageConversationSummaryResponse`; permission `query:execute`. |
| POST        | `/market-conversations`                       | `createConversation` | `createMarketConversation(request)` | Da tich hop | Tao conversation bang OpenAPI `CreateConversationRequest { title }`; title duoc derive tu cau hoi dau tien, permission `query:execute`. |
| GET         | `/market-conversations/{id}`                  | `getConversation`    | `getMarketConversationById(id)` | Da tich hop | Doc conversation detail gom messages; permission `query:execute`. |
| GET         | `/market-conversations/{conversationId}/messages` | `getMarketConversationMessages` | `getMarketConversationMessages(conversationId, beforeMessageId?)` | Da tich hop | Tai message history theo exclusive cursor `beforeMessageId` va optional `size`; message la text-only va khong con `kind`/`analysisId`; permission `query:execute`. |
| POST        | `/market-conversations/{id}/messages`         | `submitMessage`      | `submitMarketConversationMessage(id, request)` | Da tich hop | Submit bang `{ message }`; frontend khong gui optional `asOfTime`; response chi gom `userMessage` va `assistantMessage`; permission `query:execute`. |
| GET         | `/market-analyses/{id}`                       | `getAnalysis`        | `-` | Chua tich hop | Backend van publish persisted analysis snapshot, nhung frontend khong con action/surface vi conversation message khong co `analysisId`; permission `query:execute`. |
| GET         | `/market-analyses/{id}/evidence`              | `getAnalysisEvidence` | `-` | Chua tich hop | Backend van publish evidence snapshot, nhung frontend khong con analysis entry point; permission `query:execute`. |
| POST        | `/market-analyses/{id}/telegram-deliveries`   | `deliverToTelegram`  | `-` | Chua tich hop | Backend van ho tro delivery bang `{ destinationId }`, nhung frontend khong con manual delivery tu conversation; permission `query:execute`. |

Frontend lien quan:

- `app/api/query/action.ts`
- `app/api/market-conversations/action.ts`
- `app/lib/market-query/definitions.ts`
- `app/lib/market-query/permissions.ts`
- `components/market-conversation-assistant/*`
- `components/protected-ai-assistant.tsx`

Ghi chu:

- Spec request cua `POST /query` van cho phep field optional `asOfTime`, nhung workbench frontend v1 chu dong khong gui field nay de backend tu lay thoi diem hien tai.
- Snapshot OpenAPI hien tai mo ta `evidence[].publishedAt` va `keyEvents[].occurredAt` la `date-time` string; frontend market-query definitions dang cho phep them `null` de tuong thich voi payload runtime da quan sat.
- `MarketQueryKeyEventResponse` da doi `summary` thanh `description`; FE da dong bo DTO va legacy renderer cho field moi.
- `MarketQueryResponse` co them `keyNarratives[]`; FE legacy query type/schema van map field nay, nhung conversation text-only khong render persisted analysis detail.
- Backend DTO `MarketQueryEvidenceResponse` hien dung `eventId`, `eventTitle`, `newsArticleId`, `newsArticleTitle`, `newsArticleUrl`, `sourceName`, `publishedAt`, `evidenceRole`, `evidenceConfidence`, `evidenceNote`. DTO nay khong duoc publish thanh OpenAPI component; FE interface va Zod schema da preserve `sourceName`, con primary conversation UI hien van text-only va khong render evidence.
- Snapshot ngay 7/6 doi ten schema OpenAPI persisted conversation tu nhom `MarketConversation*` sang `ConversationSummaryResponse`, `ConversationDetailResponse`, `ChatMessageResponse`, `CreateConversationRequest`, `SubmitConversationMessageRequest`, va `SubmitConversationMessageResponse`.
- Schema conversation summary/detail hien dung timestamp `createdDate` va `lastModifiedDate`; `ChatMessageResponse` dung `createdDate`. FE `app/lib/market-query/definitions.ts` va global assistant modal da parse/render theo field snapshot hien tai, va history sort mac dinh theo `lastModifiedDate`.
- `MarketConversationMessagePageResponse` gom `content: ChatMessageResponse[]`, `hasMore`, va `nextBeforeMessageId`. Query `beforeMessageId` la exclusive cursor; `size` optional co gioi han `1..100`, nhung OpenAPI hien khai bao schema type la `string`.
- `ChatMessageResponse` gom `id`, `role`, `status`, `content`, `failureReason`, va `createdDate`; `status` chi con `COMPLETED` / `FAILED`, khong con `PENDING`, `kind`, hoac `analysisId`.
- API khong tra message subtype; FE khong suy luan CHAT/CLARIFICATION/REFUSAL/ANALYSIS tu noi dung va render moi assistant turn nhu text thong thuong.
- FE da co action/DTO cho paginated message history qua `GET /market-conversations/{conversationId}/messages` va global assistant modal dung cursor `beforeMessageId` de tai tin nhan cu.
- Backend van publish `MarketAnalysisResponse` va evidence/delivery endpoints, nhung frontend da bo action/DTO/UI khong con caller sau khi conversation message bo `analysisId`.
- FE primary surface hien la global AI assistant modal; khong con UI route `/market-conversations`, `/market-conversations/{id}`, `/market-query`, hoac redirect compatibility cho lien ket cu.

### 7. API graph view

| Phuong thuc | Endpoint backend | operationId    | Tich hop frontend | Trang thai                            | Ghi chu                                                                                                                                                                              |
| ----------- | ---------------- | -------------- | ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET         | `/graph-view`    | `getGraphView` | `getGraphView()`  | Da trien khai | Frontend co route `/graph-view`, page shell duoc gate bang `graph-view:read`, va workbench G6 browse graph theo payload `nodes[]` + `edges[]`, gom narrative node/edge runtime. |

Ghi chu:

- Response snapshot hien tai la `GraphViewResponse` gom `nodes[]` va `edges[]`.
- `nodes[].kind` hien tai gom `event`, `asset`, `news-article`, va `narrative`; backend da bo `theme` va `warm-episode` node khoi graph view.
- `edges[].kind` hien tai gom `event-asset`, `news-article-event`, `narrative-event`, va `narrative-asset`; backend da bo `event-theme`, `asset-warm-episode`, va `warm-episode-event` edge khoi graph view.
- `GraphNodeMetadata` hien dung `sourceName`, `status`, `narrativeStatus`, `thesis`, va `themes[]`; FE Zod schema preserve `sourceName` va graph inspector doc truc tiep field nay.
- `metadata.themes[]` dung `GraphNodeThemeMetadata` gom `title` va `relationType` enum `PRIMARY_THEME` / `SECONDARY_THEME`; field nay chi nam trong metadata cua node `event` va `narrative`.
- Event node themes lay tu `EventTheme[]` nen co the co nhieu item va giu `relationType`; narrative node theme lay tu `Narrative.primaryTheme`, nen duoc surface nhu theme metadata thay vi node/edge rieng.
- `knowledgeLayer` hien co enum `HOT` va `WARM`; day la metadata tren node hien tai, khong tao warm episode node/edge trong Graph View.
- Frontend `app/lib/graph-view/definitions.ts` va `app/[lang]/(main)/graph-view/*` da dong bo schema/visuals/model theo snapshot moi: khong con render `theme` / `event-theme` nhu graph topology va da preserve/render `metadata.themes[]` trong inspector cua node `event` va `narrative`.
- Frontend khong con parse/render `warm-episode`, `asset-warm-episode`, hoac `warm-episode-event` trong Graph View.
- Drill-down cho node bai viet da chuyen sang `/news-articles/{id}`.

### 8. API narratives

| Phuong thuc | Endpoint backend                      | operationId                 | Tich hop frontend | Trang thai      | Ghi chu                                                        |
| ----------- | ------------------------------------- | --------------------------- | ----------------- | --------------- | -------------------------------------------------------------- |
| GET         | `/narratives`                         | `getNarratives`              | `getNarratives(searchParams)` | Da tich hop data layer | Tra ve `PageNarrativeSummaryResponse`; permission `narrative:read`. Chua co route/list UI. |
| GET         | `/narratives/{id}`                    | `getNarrative`              | `-`               | Chua trien khai | Detail gom core narrative, `assets[]`, va `events[]`; permission `narrative:read`. |
| PUT         | `/narratives/{id}/status`             | `updateStatus`              | `-`               | Chua trien khai | Cap nhat status qua `UpdateNarrativeStatusRequest`; permission `narrative:manage`. |
| POST        | `/narratives/{id}/archive`            | `archiveNarrative`          | `-`               | Chua trien khai | Archive narrative; permission `narrative:manage`.             |
| POST        | `/narratives/{id}/refresh`            | `refreshNarrative`          | `-`               | Chua trien khai | Refresh mot narrative; permission `narrative:manage`.         |
| POST        | `/narratives/refresh-event/{eventId}` | `refreshNarrativesForEvent` | `-`               | Chua trien khai | Refresh narratives theo event; permission `narrative:manage`. |
| POST        | `/narratives/refresh-pending`         | `refreshPendingNarratives`  | `-`               | Chua trien khai | Batch refresh pending narratives; permission `narrative:manage`. |

Ghi chu:

- `NarrativeSummaryResponse` gom `title`, `slug`, `thesis`, `summary`, `status`, `confidence`, `firstObservedAt`, `lastUpdatedAt`, primary asset/theme fields.
- `NarrativeResponse` them `assets[]` va `events[]`; asset relation enum gom `PRIMARY`, `AFFECTED`, event relation enum gom `DRIVER`, `SUPPORTING`, `CONTRADICTING`.
- `status` gom `EMERGING`, `ACTIVE`, `WEAKENING`, `INVALIDATED`, `ARCHIVED`.
- Frontend hien co action/schema summary va helper permission `narrative:read`, nhung chua co route, navigation, list/detail, action detail hay operator UI cho narratives.

### 9. API blogs

| Phuong thuc | Endpoint backend | operationId      | Tich hop frontend         | Trang thai                            | Ghi chu                                 |
| ----------- | ---------------- | ---------------- | ------------------------- | ------------------------------------- | --------------------------------------- |
| GET         | `/blogs`         | `getBlogPosts`   | `getBlogs(searchParams)`  | Da trien khai                         | Tra ve `Page<BlogPostListResponse>`.    |
| POST        | `/blogs`         | `createBlogPost` | `createBlog(request)`     | Da trien khai nhung con lech contract | Backend create schema dung `visible`.   |
| GET         | `/blogs/{id}`    | `getBlogPost`    | `getBlogById(id)`         | Da trien khai nhung con lech contract | Response backend dung `visible`.        |
| PUT         | `/blogs/{id}`    | `updateBlogPost` | `updateBlog(id, request)` | Da trien khai                         | Backend update schema dung `isVisible`. |
| DELETE      | `/blogs/{id}`    | `deleteBlogPost` | `deleteBlog(id)`          | Da trien khai                         | Duoc boc trong `ActionResult`.          |

Ghi chu:

- Snapshot hien tai tiep tuc dung `visible` cho create request va cho ca list/detail response, trong khi update request van dung `isVisible`.
- Frontend blogs hien van standardize theo `isVisible` trong definitions va form, nen create payload va mapping list/detail response van la diem drift can xu ly khi dong bo code.

### 10. API cronjobs

| Phuong thuc | Endpoint backend        | operationId | Tich hop frontend            | Trang thai                 | Ghi chu                                                                       |
| ----------- | ----------------------- | ----------- | ---------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| GET         | `/cronjobs`             | `list`      | `getCronjobs(searchParams)`  | Da trien khai              | Tra ve `Page<CronjobListResponse>`.                                           |
| GET         | `/cronjobs/{id}`        | `get`       | `getCronjobById(id)`         | Da trien khai              | Co action typed, khong con route detail/update frontend.                      |
| PATCH       | `/cronjobs/{id}`        | `update`    | `updateCronjob(id, request)` | Da trien khai              | FE cap nhat inline tren list va chi gui `{ expression }`.                     |
| POST        | `/cronjobs/{id}/start`  | `start`     | `startCronjob(id)`           | Da trien khai              | Co UX.                                                                        |
| POST        | `/cronjobs/{id}/pause`  | `pause`     | `pauseCronjob(id)`           | Da trien khai              | Co UX.                                                                        |
| POST        | `/cronjobs/{id}/resume` | `resume`    | `resumeCronjob(id)`          | Da trien khai              | Co UX.                                                                        |
| POST        | `/cronjobs/{id}/stop`   | `stop`      | `-`                          | Khong tich hop co chu dich | Backend co endpoint nhung frontend khong expose stop trong scope UI hien tai. |

Ghi chu:

- Snapshot moi khong con `POST /cronjobs` va `DELETE /cronjobs/{id}`; FE da go create/delete flow va khong con gate `cronjob:create`/`cronjob:delete` tren UI cronjobs.
- `CronjobRequest` trong snapshot moi chi con `expression`; FE da dong bo request type va update inline tren list theo contract nay.

### 11. API AI provider configs

| Phuong thuc | Endpoint backend                                       | operationId              | Tich hop frontend                                       | Trang thai                            | Ghi chu                                                                                                                                                      |
| ----------- | ------------------------------------------------------ | ------------------------ | ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET         | `/ai-provider-configs`                                 | `getAiProviderConfigs`   | `getAiProviderConfigs(searchParams)`                    | Da trien khai nhung con lech runtime | Runtime frontend van dung `page/size/sort` va gui `filter` rong theo helper hien tai; FE da bo search/sort theo `name` vi `SpecificationAiProviderConfig` dang rong. |
| POST        | `/ai-provider-configs`                                 | `createAiProviderConfig` | `createAiProviderConfig(request)`                       | Da trien khai                         | Gui `providerType`, `description`, `baseUrl`, `defaultProvider`, va `credentials[]`; moi credential gui `apiKey` + `model`.                                  |
| GET         | `/ai-provider-configs/{id}`                            | `getAiProviderConfig`    | `getAiProviderConfigById(id)`                           | Da trien khai                         | Detail doc metadata config va `credentials[]` voi `model`, `keyPreview`, timestamps; khong con doc `name`, top-level `model`, hoac `label`.                  |
| PUT         | `/ai-provider-configs/{id}`                            | `updateAiProviderConfig` | `updateAiProviderConfig(id, request)`                   | Da trien khai                         | Update metadata config: `providerType`, `description`, `baseUrl`, `defaultProvider`; model duoc cap nhat tren tung credential.                              |
| DELETE      | `/ai-provider-configs/{id}`                            | `deleteAiProviderConfig` | `deleteAiProviderConfig(id)`                            | Da trien khai                         | Duoc boc trong `ActionResult`.                                                                                                                               |
| PATCH       | `/ai-provider-configs/{id}/set-default`                | `setDefault`             | `setAiProviderConfigDefault(id)`                        | Da trien khai                         | Da tich hop.                                                                                                                                                 |
| POST        | `/ai-provider-configs/model-catalog`                   | `getModelCatalog`        | `getAiProviderModelCatalog(request)`                    | Da trien khai                         | Tai model catalog bang `providerType`, `apiKey`, `baseUrl`; UI goi theo tung credential truoc khi cho chon model.                                           |
| GET         | `/ai-provider-configs/{id}/credentials`                | `getCredentials`         | `getAiProviderCredentials(id)`                          | Da trien khai                         | Doc danh sach credential, response `AiProviderCredentialResponse[]`; permission `ai-provider-config:read`.                                                   |
| POST        | `/ai-provider-configs/{id}/credentials`                | `createCredential`       | `createAiProviderCredential(id, request)`               | Da trien khai                         | Tao credential bang `apiKey` va `model`; UI yeu cau validate API key va chon model truoc khi submit.                                                        |
| PUT         | `/ai-provider-configs/{id}/credentials/{credentialId}` | `updateCredential`       | `updateAiProviderCredential(id, credentialId, request)` | Da trien khai                         | Cap nhat credential bang optional `apiKey`, `model`; UI update yeu cau API key moi duoc validate va chon model moi.                                        |
| DELETE      | `/ai-provider-configs/{id}/credentials/{credentialId}` | `deleteCredential`       | `deleteAiProviderCredential(id, credentialId)`          | Da trien khai                         | Xoa credential qua `AlertDialog`; permission `ai-provider-config:delete`.                                                                                    |

Ghi chu:

- `AiProviderCredentialResponse` gom `id`, `model`, `keyPreview`, `lastUsedDate`, `rateLimitedUntil`, `createdDate`, `lastModifiedDate`; khong expose full `apiKey` va khong con `label`.
- `CreateAiProviderConfigRequest` bat buoc `credentials[]`; moi credential bat buoc `apiKey` va `model`. Config create khong con `name` hay top-level `model`.
- `UpdateAiProviderConfigRequest` chi con `providerType`, `description`, `baseUrl`, `defaultProvider`; credential add/update/delete nam trong sub-resource rieng.
- `SpecificationAiProviderConfig` trong snapshot hien la `{}`, nen UI tam thoi khong render search/filter theo `name` va chi giu sort `id_asc/id_desc` cho den khi BE xac nhan runtime filter moi.
- Enum provider hien gom `DEEPSEEK`, `GEMINI`, `GROQ`, `OPENAI`, `ZAI`; FE da dong bo type, validation, select option, va model catalog request.

### 12. API assets

| Phuong thuc | Endpoint backend | operationId | Tich hop frontend         | Trang thai    | Ghi chu                   |
| ----------- | ---------------- | ----------- | ------------------------- | ------------- | ------------------------- |
| GET         | `/assets`        | `getAssets` | `getAssets(searchParams)` | Da dong bo `pricePrecision` | FE `AssetListResponse` khai bao optional nullable `pricePrecision`. |
| GET         | `/assets/{id}`   | `getAsset`  | `getAssetById(id)`        | Da dong bo `pricePrecision` | FE `AssetResponse` ke thua optional nullable `pricePrecision`. |

Ghi chu:

- `AssetListResponse` gom `id`, `name`, `symbol`, `type`, `pricePrecision`; `AssetResponse` them `createdDate`, `lastModifiedDate`. OpenAPI khong danh dau `pricePrecision` la required va entity BE dung `Integer` nullable, nen FE phai map `number | null | undefined`.
- Asset khong co `slug`. Enum `type` hien gom `COMMODITY`, `CRYPTO`, `EQUITY`, `ETF`, `FX`, `INDEX`; FE assets definitions dung string fallback nen khong bi chan boi enum moi.

### 13. API media

| Phuong thuc | Endpoint backend | operationId   | Tich hop frontend | Trang thai      | Ghi chu                             |
| ----------- | ---------------- | ------------- | ----------------- | --------------- | ----------------------------------- |
| GET         | `/medias`        | `getMedias`   | `-`               | Chua trien khai | Chua co `app/api/medias/action.ts`. |
| GET         | `/medias/{id}`   | `getMedia`    | `-`               | Chua trien khai | Chua co tich hop.                   |
| DELETE      | `/medias/{id}`   | `deleteMedia` | `-`               | Chua trien khai | Chua co tich hop.                   |
| POST        | `/medias/upload` | `upload`      | `-`               | Chua trien khai | Chua co tich hop.                   |

### 14. API economic calendar

| Phương thức | Endpoint backend          | operationId                   | Tích hợp frontend                          | Trạng thái    | Ghi chú                                                                                                                                  |
| ----------- | ------------------------- | ----------------------------- | ------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/economic-calendar`      | `getEconomicCalendarEntries`  | `getEconomicCalendarEntries(searchParams)` | Đã tích hợp | Trả về Spring `Page<EconomicCalendarListResponse>`; contract và FE list đều không còn `contentAvailable`. |
| GET         | `/economic-calendar/{id}` | `getEconomicCalendarEntry`    | `getEconomicCalendarEntryById(id)`         | Đã tích hợp | Detail và FE đều không còn `content` hoặc `contentAvailable`; UI giữ các field metrics và metadata hiện có. |
| POST        | `/economic-calendar/sync` | `syncEconomicCalendarEntries` | `syncEconomicCalendarEntries()`            | Đã triển khai | Trả về `EconomicCalendarSyncResponse` với `fetchedCount`, `createdCount`, `updatedCount`, `skippedCount`.                                |

Ghi chú:

- Frontend đã có `app/api/economic-calendar/action.ts`, definitions, permissions, navigation và route UI `/economic-calendar`.
- `EconomicCalendarListResponse` hiện gồm `id`, `title`, `currencyCode`, `type`, `impact`, `forecastValue`, `previousValue`, `actualValue`, `description`, `revision`, `newsUrl`, `actualBetterWorse`, `revisionBetterWorse`, `status`, `scheduledAt`, `syncedAt`, `createdDate`, và `lastModifiedDate`.
- `EconomicCalendarResponse` hiện có cùng field surface với list item; snapshot không còn `content` hoặc `contentAvailable`.
- Các field văn bản domain phần lớn có thể `null`; `status` chỉ gồm `PENDING` hoặc `AVAILABLE`; timestamp là ISO datetime string.
- `description` đã được backend localized theo current user/request language. `actualBetterWorse` và `revisionBetterWorse` là giá trị từ MDG, frontend không dịch.
- `newsUrl` là source URL gốc; frontend có thể dùng để mở link ngoài khi cần.
- Frontend không còn phụ thuộc vào các field cũ đã bị backend loại bỏ như `url`, `externalKey`, `provider`, `countryCode`, `importance`, `ingestedAt`, `rawContent`, hoặc `rawMetadata`.
- Frontend đã đồng bộ definitions, list/detail UI, dictionary copy và market-chart layer; không còn tham chiếu Economic Calendar `content` hoặc `contentAvailable`.

### 15. API workspace

| Phuong thuc | Endpoint backend                  | operationId           | Tich hop frontend               | Trang thai  | Ghi chu                                                                                      |
| ----------- | --------------------------------- | --------------------- | ------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| GET         | `/me/workspaces`                  | `getMyWorkspaces`     | `getMyWorkspaces(searchParams)` | Da tich hop | `WorkspaceResponse` frontend dung `currentWorkspace` va khong con doc/hien thi `slug`.       |
| POST        | `/me/workspaces`                  | `createWorkspace`     | `createWorkspace(request)`      | Da tich hop | Snapshot moi chi nhan `name`; workspace switcher chi gui payload `name`.                     |
| PUT         | `/me/workspaces/{id}`             | `updateWorkspace`     | `updateWorkspace(id, request)`  | Da tich hop | Snapshot moi chi cap nhat `name`; workspace switcher chi gui payload `name`.                 |
| PATCH       | `/me/workspaces/{id}/set-current` | `setCurrentWorkspace` | `setCurrentWorkspace(id)`       | Da tich hop | Frontend goi dung `/set-current` va gate bang permission chinh thuc `workspace:set-current`. |

### 16. API user

| Phuong thuc | Endpoint backend  | operationId    | Tich hop frontend                | Trang thai                          | Ghi chu                                                                                                                                                                   |
| ----------- | ----------------- | -------------- | -------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/me`             | `me`           | `getMe()`                        | Da tich hop nhung con lech contract | `UserResponse.preferredLanguage` la `LanguageResponse` nullable va `permissions` la `string[]`; `BackendMeResponse` hien chua map preferred language. Auth `active-user`.         |
| PATCH       | `/me`             | `updateProfile` | `updateMyProfile(request)`       | Da tich hop                        | Gui `UserProfileRequest` gom `firstName`, `lastName`, `birthday`, `phone`; response la `UserResponse`; auth `active-user`.                                               |
| GET         | `/users`          | `search`       | `getUsers(searchParams)`         | Da tich hop                        | Tim kiem user theo `user:search`; OpenAPI tra ve `Page<UserSearchResponse>`, frontend van giu fallback cho payload array legacy.                                                 |
| PATCH       | `/users/{id}`     | `updateUser`   | `updateManagedUser(id, request)` | Da tich hop nhung con lech contract | Request la `UserUpdateRequest`; permission `user:update`; OpenAPI response tham chieu `UserSearchResponse`, trong khi action frontend dang type ket qua la `UserResponse`. |

Ghi chu:

- `UserResponse.preferredLanguage` la object `LanguageResponse` (`id`, `isoCode`, `name`) nullable; day la khac biet voi `BackendMeResponse` frontend hien tai chua khai bao field nay.
- `UserResponse.permissions` trong live contract la mang permission key `string[]`; frontend managed-user definition hien dang model field nay thanh `PermissionResponse[]`, can xem lai neu UI can doc permissions cua user.

### 17. API languages

| Phuong thuc | Endpoint backend          | operationId               | Tich hop frontend | Trang thai      | Ghi chu                                                                    |
| ----------- | ------------------------- | ------------------------- | ----------------- | --------------- | -------------------------------------------------------------------------- |
| GET         | `/languages`              | `getLanguages`            | `getLanguages()`  | Da tich hop    | Tai catalog ngon ngu qua `fetchAuthenticated()` de giu lua chon output language cua schedule va Calendar/News feature routing; auth type `active-user`. |
| PATCH       | `/me/preferred-language`  | `updatePreferredLanguage` | `-`               | Chua trien khai | Luu preferred language bang `{ isoCode }` va tra ve `UserResponse`.        |

Ghi chu:

- `LanguageCatalogResponse` gom `currentLanguage`, `preferredLanguage`, `languages[]`; `LanguageResponse` gom `id`, `isoCode`, `name`.
- Frontend van dung URL locale prefix va `Accept-Language`; schedule configuration va Calendar/News feature routing goi `/languages` de nap catalog output language, nhung chua persist `/me/preferred-language`.

### 18. API personal notes

| Phuong thuc | Endpoint backend | operationId          | Tich hop frontend | Trang thai     | Ghi chu |
| ----------- | ---------------- | -------------------- | ----------------- | -------------- | ------- |
| GET         | `/me/notes`      | `getPersonalNotes`   | `getPersonalNotes(searchParams)` | Da tich hop | Sheet khai bao va render `title` tu `PersonalNoteSummaryResponse`, voi fallback da localize khi thieu/rong; permission `personal-note:read`. |
| POST        | `/me/notes`      | `createPersonalNote` | `createPersonalNote(request)` | Da tich hop | Frontend luon gui `{ title, content, contentSchemaVersion }`; draft moi gui `title: null` va Sheet dong bo `PersonalNoteResponse`; permission `personal-note:create`. |
| GET         | `/me/notes/{id}` | `getPersonalNote`    | `getPersonalNote(id)` | Da tich hop | `PersonalNoteResponse.title` duoc giu trong local summary trong khi Sheet tai Plate JSON cua ghi chu duoc chon; permission `personal-note:read`. |
| PUT         | `/me/notes/{id}` | `updatePersonalNote` | `updatePersonalNote(id, request)` | Da tich hop | Content save gui latest backend-confirmed nullable `title`; rename gui title da trim hoac `null` cung Plate content hien tai; permission `personal-note:update`. |
| DELETE      | `/me/notes/{id}` | `deletePersonalNote` | `deletePersonalNote(id)` | Da tich hop | Sheet xac nhan destructive action, reconcile list/selection sau response thanh cong; permission `personal-note:delete`. |

Ghi chu:

- `CreatePersonalNoteRequest` va `UpdatePersonalNoteRequest` co them `title: string` (toi da `255` ky tu) ben canh `content` va `contentSchemaVersion`; frontend contract luon gui field nay va cho phep gia tri `null` theo backend behavior da xac nhan.
- Snapshot khong khai bao enum, default, hoac minimum cho `contentSchemaVersion`; Sheet hien ghi version `1` va khong cho sua version khac.
- `PersonalNoteResponse` gom `id`, `title`, `content`, `contentSchemaVersion`, `createdDate`, `lastModifiedDate`; `PersonalNoteSummaryResponse` co cung metadata va `title` nhung khong co `content`.
- OpenAPI generator hien bieu dien mutation `title` la property string khong required va khong ghi union `null`; frontend chu dong giu contract payload `title: string | null` theo contract backend da xac nhan.
- Frontend so huu list/detail/create/update/delete trong Sheet header, freeform Plate JSON version 1, rename/delete theo permission, fallback da localize, va coordinator Save + safety flush. Summary rail chi hien title; frontend khong normalize H1 hoac parse content de suy title. Khong co route `/notes`.

### 19. API wiki

Khong con tich hop frontend.

Ghi chu:

- Toan bo route, action, definition, va UI surface `wiki` da duoc go khoi frontend.
- Neu backend tai xuat wiki trong tuong lai, nen de xuat mot change moi thay vi tai su dung module cu.

### 20. API roles

| Phuong thuc | Endpoint backend               | operationId             | Tich hop frontend                         | Trang thai    | Ghi chu                                            |
| ----------- | ------------------------------ | ----------------------- | ----------------------------------------- | ------------- | -------------------------------------------------- |
| GET         | `/roles`                       | `getRoles`              | `getRoles()`                              | Da trien khai | Trang roles da load danh sach vai tro.             |
| PUT         | `/roles/{roleKey}/permissions` | `updateRolePermissions` | `updateRolePermissions(roleKey, request)` | Da trien khai | Dialog frontend cho phep cap nhat permission keys. |

### 21. API permissions

| Phuong thuc | Endpoint backend | operationId      | Tich hop frontend  | Trang thai    | Ghi chu                                                 |
| ----------- | ---------------- | ---------------- | ------------------ | ------------- | ------------------------------------------------------- |
| GET         | `/permissions`   | `getPermissions` | `getPermissions()` | Da trien khai | Duoc dung cung role editor de build permission catalog. |

### 22. API watchlists

| Phuong thuc | Endpoint backend               | operationId       | Tich hop frontend                            | Trang thai    | Ghi chu                                                 |
| ----------- | ------------------------------ | ----------------- | -------------------------------------------- | ------------- | ------------------------------------------------------- |
| GET         | `/watchlists`                  | `getWatchlist`    | `getWorkspaceWatchlistAssets(searchParams)`  | Da trien khai | Snapshot hien chua co `assetPricePrecision`; chart khong phu thuoc field nay. |
| POST        | `/watchlists`                  | `createWatchlist` | `-`                                          | Legacy | Single add endpoint con trong snapshot nhung FE workspace watchlist editor da chuyen sang bulk add. |
| POST        | `/watchlists/assets`           | `createWatchlistAssets` | `addAssetsToWorkspaceWatchlist({ assetIds })` | Da trien khai | Bulk add toi da 100 `assetIds` moi request; permission `watchlist:create`. |
| DELETE      | `/watchlists/assets/{assetId}` | `deleteByAssetId` | `removeAssetFromWorkspaceWatchlist(assetId)` | Da trien khai | Sync remove theo diff.                                  |

### 23. API telegram

| Phuong thuc | Endpoint backend                                   | operationId            | Tich hop frontend                                  | Trang thai                            | Ghi chu                                                                                                                                            |
| ----------- | -------------------------------------------------- | ---------------------- | -------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/telegram/bot-connections`                        | `getConnections`       | `getTelegramBotConnections()`                      | Da tich hop                           | Doc danh sach bot connection; permission `telegram-bot-connection:read`.                                                                           |
| POST        | `/telegram/bot-connections`                        | `createConnection`     | `createTelegramBotConnection(request)`             | Da tich hop                           | Contract chi nhan `botToken`; FE schema/form chi gui token va khong co control sua `displayLabel`; permission `telegram-bot-connection:manage`.      |
| PATCH       | `/telegram/bot-connections/{id}/disable`           | `disableConnection`    | `disableTelegramBotConnection(id)`                 | Da tich hop                           | Disable bot connection va tra ve `TelegramBotConnectionResponse`; permission `telegram-bot-connection:manage`.                                     |
| DELETE      | `/telegram/bot-connections/{id}`                   | `removeConnection`     | `deleteTelegramBotConnection(id)`                  | Da tich hop                           | Xoa bot connection qua `AlertDialog`; permission `telegram-bot-connection:manage`.                                                                |
| GET         | `/telegram/destinations`                           | `getDestinations`      | `getTelegramDestinations()`                        | Da tich hop                           | Doc chat/channel da link; permission `telegram-destination:read`.                                                                                  |
| POST        | `/telegram/destinations/link-token`                | `createLinkToken`      | `createTelegramLinkToken(request)`                 | Da tich hop                           | Tao link token tu `botConnectionId` de user link destination qua Telegram; permission `telegram-destination:manage`.                               |
| POST        | `/telegram/destinations/{destinationId}/test-message` | `sendTestMessage`   | `sendTelegramTestMessage(id)`                      | Da tich hop                           | Gui tin nhan thu do backend tao; khong co request body, response `204 No Content`; permission `telegram-destination:manage`.                        |
| PATCH       | `/telegram/destinations/{id}/disable`              | `disableDestination`   | `disableTelegramDestination(id)`                   | Da tich hop                           | Disable destination va tra ve `TelegramDestinationResponse`; permission `telegram-destination:manage`.                                             |
| DELETE      | `/telegram/destinations/{id}`                      | `removeDestination`    | `deleteTelegramDestination(id)`                    | Da tich hop                           | Xoa destination qua `AlertDialog`; permission `telegram-destination:manage`.                                                                       |
| GET         | `/telegram/feature-settings`                       | `getFeatureSettings`   | `getTelegramFeatureSettings()`                     | Da tich hop                           | Response `outputLanguage` da duoc map trong DTO; Calendar va News routing render override nay, con Scheduled khong co feature-level selector vi delivery hien tai khong doc field nay. |
| PUT         | `/telegram/feature-settings`                       | `updateFeatureSetting` | `updateTelegramFeatureSetting(request)`            | Da tich hop                           | Request optional `outputLanguageIsoCode` da duoc map; moi mutation gui lai code hien tai de bao toan override, con omit/blank se chu dong xoa override theo BE. |
| GET         | `/telegram/market-analysis-schedules`              | `getSchedules`         | `getTelegramMarketAnalysisSchedules()`             | Da tich hop                           | Response map singular `asset`, optional `outputLanguage`, status-aware actions, and excludes `REMOVED` from operations.                            |
| POST        | `/telegram/market-analysis-schedules`              | `createSchedule`       | `createTelegramMarketAnalysisSchedule(request)`    | Da tich hop                           | Request gui required `assetId`, 1-4 unique `HH:mm` local times, valid IANA `timezone`, va optional `outputLanguageIsoCode`; authenticated action validates before POST. |
| PUT         | `/telegram/market-analysis-schedules/{id}`         | `updateSchedule`       | `updateTelegramMarketAnalysisSchedule(id, request)` | Da tich hop                           | Same request boundary as create; edit is exposed only for `ACTIVE` schedules because backend PUT reactivates disabled schedules.                    |
| PATCH       | `/telegram/market-analysis-schedules/{id}/disable` | `disableSchedule`      | `disableTelegramMarketAnalysisSchedule(id)`        | Da tich hop                           | Disable schedule va tra ve `TelegramMarketAnalysisScheduleResponse`; permission `telegram-market-analysis-schedule:manage`.                        |
| DELETE      | `/telegram/market-analysis-schedules/{id}`         | `removeSchedule`       | `deleteTelegramMarketAnalysisSchedule(id)`         | Da tich hop                           | Xoa schedule qua `AlertDialog`; permission `telegram-market-analysis-schedule:manage`.                                                            |

Ghi chu:

- Frontend hien co route `/telegram`, action, definitions, permission helper, navigation, va UI quan tri bot/destination/routing/schedule.
- Live contract da bo update `displayLabel` cho bot/destination nhung van publish test-message; FE khong co control edit va da khoi phuc server action/UI test tuong ung.
- `TelegramBotConnectionResponse` va `TelegramDestinationResponse` van expose `displayLabel`, nhung snapshot khong con publish request schema/operation de frontend cap nhat field nay.
- DTO chinh moi gom `TelegramBotConnectionResponse`, `TelegramDestinationResponse`, `TelegramFeatureSettingResponse`, `TelegramMarketAnalysisScheduleResponse`, `TelegramLinkTokenResponse`, va `ScheduledAssetResponse`.
- Enum feature key cua Telegram gom `ECONOMIC_CALENDAR_ALERT`, `MARKET_NEWS_ALERT`, `SCHEDULED_MARKET_ANALYSIS`; day la enum cua feature setting, khong phai system prompt type.
- Snapshot moi them `outputLanguageIsoCode` trong request feature setting/schedule va `outputLanguage` trong response; FE schedule va Calendar/News feature routing da expose field nay qua catalog `/languages` va giu override khi edit/mutation. Lua chon mac dinh gui omit/undefined de BE xoa override; `SCHEDULED_MARKET_ANALYSIS` van khong co selector cap feature vi scheduled delivery doc `schedule.outputLanguage` truc tiep.
- Snapshot da bo 152 schema Telegram Bot API tong quat tung duoc import cho webhook va thay bang ba schema toi thieu `TelegramWebhookChat`, `TelegramWebhookMessage`, `TelegramWebhookUpdateRequest`. Day la contract backend-only, khong lam thay doi DTO cua man hinh quan tri Telegram.

### 24. API feedback

| Phuong thuc | Endpoint backend                                | operationId   | Tich hop frontend | Trang thai       | Ghi chu |
| ----------- | ----------------------------------------------- | ------------- | ----------------- | ---------------- | ------- |
| GET         | `/me/feedback-submissions`                      | `list`        | `getPersonalFeedback`               | Da tich hop  | Danh sach feedback cua user hien tai; auth `active-user`; effective runtime query dùng `$filter/page/size/sort`, trong khi OpenAPI vẫn publish `specification/pageable`. |
| POST        | `/me/feedback-submissions`                      | `create`      | `createFeedbackSubmission`          | Da tich hop  | Multipart `submission` bat buoc va `screenshot` binary tuy chon; auth `active-user`; tra `FeedbackDetailResponse`. |
| GET         | `/me/feedback-submissions/{id}`                 | `get_1`       | `getPersonalFeedbackDetail`         | Da tich hop  | Doc detail thuoc user hien tai; auth `active-user`, cross-owner `404`. |
| DELETE      | `/me/feedback-submissions/{id}`                 | `withdraw`    | `withdrawFeedbackSubmission`        | Da tich hop  | Rut submission cua user; runtime `204`, live OpenAPI publish `200` empty-body gap duoc BE giai thich. |
| GET         | `/me/feedback-submissions/{id}/screenshot`      | `screenshot`  | `GET /api/feedback/personal/{id}/screenshot` | Da tich hop | Screenshot proxy scope personal; PNG/JPEG inline, private no-store, nosniff. |
| GET         | `/feedback-submissions`                         | `list_1`      | `getModerationFeedback`              | Da tich hop  | Danh sach quan tri; permission `feedback:read`; effective runtime contract hỗ trợ filter/sort. |
| GET         | `/feedback-submissions/{id}`                    | `get_2`       | `getModerationFeedbackDetail`        | Da tich hop  | Detail quan tri; permission `feedback:read`; reporter chi moderation. |
| POST        | `/feedback-submissions/{id}/promote`            | `promote`     | `promoteFeedbackSubmission`          | Da tich hop  | Promote request co `reviewMessage` + `githubIssueUrl`; permission `feedback:review`; tra detail da cap nhat. |
| POST        | `/feedback-submissions/{id}/dismiss`            | `dismiss`     | `dismissFeedbackSubmission`          | Da tich hop  | Dismiss request chi co `reviewMessage`; permission `feedback:review`; tra detail da cap nhat. |
| GET         | `/feedback-submissions/{id}/screenshot`         | `screenshot_1` | `GET /api/feedback/moderation/{id}/screenshot` | Da tich hop | Screenshot proxy scope moderation; permission `feedback:read`, khong fallback sang personal scope. |
| DELETE      | `/feedback-submissions/{id}`                    | `erase`       | `eraseFeedbackSubmission`            | Da tich hop  | Xoa o scope quan tri; permission `feedback:delete`; runtime `204`, live OpenAPI publish `200` empty-body gap duoc BE giai thich. |

Ghi chu:

- Probe authoritative dev OpenAPI ngày 26/08/2026 (`https://dev-api.signapse.cloud/v3/api-docs`, OpenAPI `3.1.0`, 97 paths, 179 schemas) xác nhận đủ 11 feedback operations và không có hard path/method/auth/transport/response-family contradiction. OpenAPI vẫn thiếu hoặc biểu diễn khái quát filter grammar, request conditionality, success status detail, requiredness/nullability, lifecycle, screenshot constraints và error examples; effective runtime semantics được ghi trong ledger này và các gap không chặn activation theo gate đã thống nhất.
- `FeedbackSubmissionRequest` bat buoc `type`, `title`, `description`, `expectedOutcome`; `type` gom `BUG` / `IDEA`. Do dai: title `5..150`, description `20..5000`, expected outcome `10..3000`, reproduction steps tuy chon `0..5000`.
- `clientContext` tuy chon va co cac field `pagePath`, `appVersion`, `browserName`, `browserVersion`, `osName`, `osVersion`, `locale`, `observedTime`; effective runtime contract coi cac field la optional va ap dung privacy/format boundary.
- `FeedbackReviewRequest` bat buoc `reviewMessage` dai `10..1000`; runtime Promote yeu cau them `githubIssueUrl`, runtime Dismiss omit field nay, du OpenAPI van publish schema dung chung.
- Status response gom `PENDING_REVIEW`, `PROMOTED`, `DISMISSED`. Detail co them `description`, `expectedOutcome`, `reproductionSteps`, `clientContext`, `screenshot`, `reviewMessage`, `githubIssueNumber`, va `reporter`; list item chi gom metadata co ban va screenshot metadata.
- Cac response schema feedback khong co mang `required` va cung khong publish nullable ro rang. Frontend khong nen suy dien field bat buoc hoac nullable ngoai nhung gi live contract xac nhan.
- `SpecificationFeedbackSubmission` hien la schema rong, nen filter field/operator chua duoc mo ta trong OpenAPI. Effective runtime query dùng `$filter`, `page`, `size`, `sort` thay cho object `specification` / `pageable`.
- OpenAPI chi publish response `200` cho cac operation nay, khong mo ta error response, state transition guard, ownership failure, gioi han/kieu MIME screenshot, hoac lifecycle cho withdraw/promote/dismiss/erase. Effective runtime semantics được ghi trong ledger này; day la documentation gaps, khong phai hard contract blockers.

### 25. Webhook

| Phuong thuc | Endpoint backend                    | operationId            | Tich hop frontend | Trang thai  | Ghi chu                                                     |
| ----------- | ----------------------------------- | ---------------------- | ----------------- | ----------- | ----------------------------------------------------------- |
| POST        | `/webhooks/clerk`                   | `handleClerkWebhook`   | `-`               | Chi backend | Khong ky vong co frontend caller.                           |
| POST        | `/webhooks/telegram/{connectionId}` | `handleTelegramUpdate` | `-`               | Chi backend | Webhook nhan `TelegramWebhookUpdateRequest` tu Telegram, khong ky vong FE caller. |

### 26. Health check

| Phuong thuc | Endpoint backend | operationId   | Tich hop frontend | Trang thai      | Ghi chu               |
| ----------- | ---------------- | ------------- | ----------------- | --------------- | --------------------- |
| GET         | `/health`        | `healthCheck` | `-`               | Chua trien khai | Chua co helper rieng. |

### API script

| Phuong thuc | Endpoint backend | operationId | Tich hop frontend | Trang thai  | Ghi chu                                                                                                      |
| ----------- | ---------------- | ----------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| POST        | `/script`        | `execute`   | `-`               | Chi backend | Auth `authenticated`, khong yeu cau permission; request `ScriptRequest` bat buoc `script` khong rong, response `ScriptResponse` gom `output[]` va `result`. |

### API dashboard summary

| Phuong thuc | Endpoint backend      | operationId | Tich hop frontend | Trang thai      | Ghi chu |
| ----------- | --------------------- | ----------- | ----------------- | --------------- | ------- |
| GET         | `/dashboard/summary`  | `getSummary` | `app/api/dashboard/action.ts` + `dashboard/page.tsx` | Da tich hop mot phan | Khong co body/query. Response dung mot `asOf` UTC va scope workspace hien tai; tra bay metric voi state `AVAILABLE` / `EMPTY` / `DENIED` / `ERROR`. `assetsInFocus` tra toi da sau tai san, `marketNarratives` tra toi da ba luan diem theo thu tu authoritative. Endpoint gate `workspace:read`; loi endpoint la `403`/`409`, loi tung metric nam trong HTTP `200`. |

Ghi chu:

- `scope` gom `workspaceId` va `watchlistAssetCount`; count co the `null` khi thieu quyen scope.
- `nextKeyEvent` la economic-calendar event `HIGH` sap toi, lien quan currency base/quote cua watchlist hien tai.
- `recentEvents` dung `DashboardRecentEventsMetricResponse`; moi item dung `DashboardRecentEventItemResponse` voi `id`, `title`, `description`, `occurredAt`, `confidence`, `themes[]` va `affectedAssets[]`; `description` va `confidence` la required-nullable theo snapshot. Hai mang quan he tai su dung `EventThemeSummaryResponse` va `EventAssetSummaryResponse`.
- `marketEvents24h` dem distinct event du dieu kien trong UTC `[asOf - 24h, asOf)`; `activeNarratives` dem distinct narrative `EMERGING`/`ACTIVE`; `latestNews6h` dem NewsArticle co `publishedAt` trong UTC `[asOf - 6h, asOf)`, khong phu thuoc asset/status.
- `marketNarratives` dung `DashboardMarketNarrativesMetricResponse` voi `state`, `items[]` bat buoc va `errorCode` bat buoc nhung nullable. Mang co toi da ba `DashboardMarketNarrativeItemResponse` theo thu tu authoritative cua backend.
- Moi Market Narrative item bat buoc co `id`, `title`, `thesis`, `status`, `confidence`, `lastUpdatedAt`, `primaryTheme` va `assets[]`; `title`, `thesis`, `confidence` la required-nullable. `status` chi gom `EMERGING`, `WEAKENING`, `ACTIVE`; `lastUpdatedAt` la UTC date-time.
- `primaryTheme` dung `DashboardMarketNarrativeThemeResponse` va la object bat buoc theo snapshot; `themeId`, `themeSlug`, `themeTitle` deu required, rieng `themeTitle` nullable. `assets[]` tai su dung `NarrativeAssetSummaryResponse`; moi field asset required, `weight` nullable, `relationType` gom `PRIMARY` / `AFFECTED`.
- Cua so `marketNarratives` la UTC `[asOf - 7d, asOf)`. Thu tu item la status `EMERGING`, `WEAKENING`, `ACTIVE`; sau do canonical primary watchlist boost, `lastUpdatedAt DESC`, `confidence DESC NULLS LAST`, narrative id DESC. Frontend khong sap xep lai.
- `assetsInFocus` dung `DashboardAssetsInFocusMetricResponse` voi `state`, `items[]` bat buoc va `errorCode` bat buoc nhung nullable. Mang co toi da sau `DashboardAssetInFocusItemResponse`; moi item bat buoc co `assetId`, `assetName`, `assetSymbol`, `assetType` (`COMMODITY` / `CRYPTO` / `EQUITY` / `ETF` / `FX` / `INDEX`) va mot `context`.
- `context` dung `DashboardAssetFocusContextResponse`: `title` va `observedAt` bat buoc; `summary` bat buoc nhung co the `null`. `observedAt` la `Event.occurredAt` hoac `Narrative.lastUpdatedAt`, serialize UTC. Contract khong expose `sourceType` hoac source id cho frontend.
- Thu tu `assetsInFocus.items` la authoritative cua backend: Event truoc Narrative `EMERGING`, `WEAKENING`, `ACTIVE`; sau do uu tien primary relation, `observedAt DESC`, `confidence DESC NULLS LAST`, source id DESC va asset id ASC. Frontend khong sap xep lai.
- Cua so ung vien cho `assetsInFocus` la Event UTC `[asOf - 24h, asOf)` va Narrative UTC `[asOf - 7d, asOf)`. Metric can `watchlist:read` + `asset:read` va it nhat mot trong `event:read` / `narrative:read`; neu khong co quyen doc source nao thi `errorCode` la `ASSETS_IN_FOCUS_READ_REQUIRED`.
- Permission cac metric con lai la `economic-calendar:read` + `watchlist:read` + `asset:read` cho `nextKeyEvent`; `event:read` + `watchlist:read` + `asset:read` cho `recentEvents` va `marketEvents24h`; `narrative:read` + `watchlist:read` + `asset:read` cho `activeNarratives` va `marketNarratives`; va `news-article:read` cho `latestNews6h`.
- `marketNarratives.errorCode` co the la `NARRATIVE_READ_REQUIRED`, `WATCHLIST_READ_REQUIRED`, `ASSET_READ_REQUIRED`, `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, hoac `SUMMARY_UNAVAILABLE`; null khi metric `AVAILABLE` / `EMPTY`.
- Tat ca field cua `DashboardSummaryResponse` va cac metric dashboard hien duoc danh dau required theo snapshot; cac field nullable van phai co mat trong payload. FE da parse/render `recentEvents` va `assetsInFocus`, nhung Zod schema chua khai bao required metric `marketNarratives`, nen field nay bi strip va chua den duoc dashboard chinh. Khong duoc coi `DENIED`/`ERROR` la count `0` hoac empty state.

## Nhom frontend khong nam trong snapshot API hien tai

Nhung nhom duoi day van ton tai tren frontend, nhung khong xuat hien trong `docs/api_mapping.json` hien tai.

| Nhom             | Tinh trang frontend                                                                                     | Ghi chu                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sources          | `app/(main)/sources/page.tsx`, `app/(main)/sources/create/page.tsx`, `app/(main)/sources/[id]/page.tsx` | Chi con route redirect compatibility; data layer va UI legacy cua `/sources` da duoc xoa.     |
| Source documents | `app/(main)/source-documents/page.tsx`, `app/(main)/source-documents/[id]/page.tsx`                     | Chi con route redirect compatibility cho deeplink cu; data layer canon da la `news-articles`. |
| Topics           | `app/api/topics/action.ts`, `app/lib/topics/definitions.ts`, `app/(main)/topics/*`                      | Frontend van co module topics, nhung snapshot API hien tai khong co `/topics*`.               |

## Cac kieu dung chung o frontend

### SearchParams

```ts
interface SearchParams {
  filter: string
  page: number
  size: number
  sort: {
    field: string
    direction: "asc" | "desc"
  }[]
}
```

Duoc `queryParamsToString()` serialize thanh:

- `$filter`
- `page`
- `size`
- `sort=field,direction`

### Page<T>

```ts
interface Page<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  numberOfElements: number
  empty: boolean
}
```

### ActionResult<T>

```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Cac file type/action phia frontend

| Khu vuc                                   | File frontend                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Helper dung chung                         | `app/lib/definitions.ts`, `app/lib/utils.ts`                                                                                                                    |
| Tang van chuyen auth                      | `app/api/auth/action.ts`                                                                                                                                        |
| News outlets                              | `app/api/news-outlets/action.ts`, `app/lib/news-outlets/definitions.ts`, `app/lib/news-outlets/permissions.ts`, `app/(main)/news-outlets/*`                     |
| News articles                             | `app/api/news-articles/action.ts`, `app/lib/news-articles/definitions.ts`, `app/lib/news-articles/permissions.ts`, `app/(main)/news-articles/*`                 |
| Sources (legacy, ngoai snapshot)          | `app/(main)/sources/page.tsx`, `app/(main)/sources/create/page.tsx`, `app/(main)/sources/[id]/page.tsx` (redirect compatibility)                                |
| Source documents (legacy, ngoai snapshot) | `app/(main)/source-documents/page.tsx`, `app/(main)/source-documents/[id]/page.tsx` (redirect compatibility)                                                    |
| Events                                    | `app/api/events/action.ts`, `app/lib/events/definitions.ts`, `app/lib/events/permissions.ts`, `app/(main)/events/*`                                             |
| Market charts                             | `app/api/market-charts/action.ts`, `app/lib/market-charts/definitions.ts`, `app/lib/market-charts/permissions.ts`, `app/(main)/market-charts/*`                 |
| Market query                              | `app/api/query/action.ts`, `app/api/market-conversations/action.ts`, `app/lib/market-query/definitions.ts`, `app/lib/market-query/permissions.ts`, `components/market-conversation-assistant/*`, `components/protected-ai-assistant.tsx` |
| Graph view                                | `app/api/graph-view/action.ts`, `app/lib/graph-view/definitions.ts`, `app/lib/graph-view/permissions.ts`, `app/(main)/graph-view/*`                             |
| Narratives                                | `app/api/narratives/action.ts`, `app/lib/narratives/definitions.ts`, `app/lib/narratives/permissions.ts`                                                        |
| Blogs                                     | `app/api/blogs/action.ts`, `app/lib/blogs/definitions.ts`                                                                                                       |
| Cronjobs                                  | `app/api/cronjobs/action.ts`, `app/lib/cronjobs/definitions.ts`                                                                                                 |
| AI provider configs                       | `app/api/ai-provider-configs/action.ts`, `app/lib/ai-provider-configs/definitions.ts`                                                                           |
| Assets                                    | `app/api/assets/action.ts`, `app/lib/assets/definitions.ts`                                                                                                     |
| Economic calendar                         | `app/api/economic-calendar/action.ts`, `app/lib/economic-calendar/definitions.ts`, `app/lib/economic-calendar/permissions.ts`, `app/(main)/economic-calendar/*` |
| User profile                              | `app/api/user/action.ts`, `app/lib/users/definitions.ts`                                                                                                        |
| Languages                                 | `components/language-selector.tsx`, `app/lib/i18n/*` (route-locale only; no backend language action yet)                                                        |
| Personal notes                            | `app/api/personal-notes/action.ts`, `app/lib/personal-notes/{definitions,permissions}.ts`, `components/personal-notes-quick-sheet.tsx`, `components/personal-note-autosave.ts`, `app/[lang]/(main)/layout.tsx` |
| Workspace                                 | `app/api/workspaces/action.ts`, `app/lib/workspaces/definitions.ts`                                                                                             |
| Watchlists                                | `app/api/watchlists/action.ts`, `app/lib/watchlists/definitions.ts`, `components/workspace-watchlist-editor.tsx`, `components/asset-multi-select-combobox.tsx`  |
| Telegram                                  | `app/api/telegram/action.ts`, `app/lib/telegram/definitions.ts`, `app/lib/telegram/permissions.ts`, `app/[lang]/(main)/telegram/*`                              |
| Feedback                                  | `-` (live contract da co endpoint, frontend chua co module)                                                                                                    |
| Roles va permissions                      | `app/api/roles/action.ts`, `app/lib/roles/definitions.ts`, `app/(main)/roles/*`                                                                                 |
| Route user cuc bo                         | `app/api/user/route.ts`                                                                                                                                         |
| Media                                     | `-`                                                                                                                                                             |
| System prompts                            | `app/api/system-prompts/action.ts`, `app/lib/system-prompts/definitions.ts`, `app/lib/system-prompts/permissions.ts`, `app/(main)/system-prompts/*`             |
| Topics (ngoai spec hien tai)              | `app/api/topics/action.ts`, `app/lib/topics/definitions.ts`, `app/(main)/topics/*`                                                                              |

## Cac diem lech contract da biet

- List/search runtime cua frontend dang dung `$filter/page/size/sort`, trong khi OpenAPI tiep tuc mo ta `specification/pageable` o nhieu list endpoint.
- `feedback`: live contract co 11 operation tren 8 path va FE da tich hop definitions, runtime validation, authenticated actions, permission constants, submission/moderation surface, navigation, i18n, HTTP fixture, va scope-specific screenshot proxy. OpenAPI van sparse o filter grammar, requiredness/nullability, screenshot transport, error/status-transition semantics va ownership guard; effective runtime semantics cho cac diem nay duoc ghi trong muc feedback cua ledger.
- Frontend da migrate route canon sang `/news-outlets*` va `/news-articles*`; `/sources*`, `/news-sources*`, va `/source-documents*` chi con redirect compatibility.
- `news articles`: `linkedEvents[]` da co `eventStatus` enum moi theo enrichment lifecycle va khong con `eventEnrichmentStatus`; FE giu field trong DTO nhung detail va quick detail khong render linked-event UI hoac event navigation.
- `events`: backend gate enrich/market reaction operators bang `news-article:analyze`; FE events da gate bang permission canon nay truoc va chi giu `source-document:analyze` nhu alias compatibility tam thoi.
- `permission scan`: cac literal FE-only `source-document:*` con lai deu la alias compatibility sau permission canon `news-article:*`; cac permission BE chua co FE literal gom `cronjob:stop`, `media:*`, va `narrative:manage`; frontend hien chi co helper cho `narrative:read`.
- `asset type enum`: snapshot moi them `EQUITY` va `ETF` cho asset/watchlist/event/narrative/graph/market-chart payload. FE assets, watchlists, narratives, graph view, market charts dang string-compatible; rieng events van hard-code `EventAssetType` va `dictionary.events.assetTypeLabels` voi 4 gia tri cu, nen co nguy co render label `undefined` cho event assets/reactions moi.
- `system prompts`: snapshot mới thêm prompt type `MARKET_QUERY_CONVERSATION_ORCHESTRATION`; frontend hiện còn thiếu enum/dictionary label cho giá trị này trong `app/lib/system-prompts/definitions.ts` và dictionary system prompt, dù DTO `name`/`responseSchema`/`localizedNames`, create request bắt buộc `responseSchema`, và form schema editor dạng builder + JSON đã được đồng bộ.
- `market charts`: FE da dong bo candles, annotation timeline nested, economic-calendar layer, live SSE proxy/client, va `MarketChartAssetResponse.pricePrecision`; chart dung precision theo asset va fallback `4` cho metadata nullable/thieu. Contract count-back da tich hop cho chart history voi bound `1..1000`, UTC exclusive anchors, partial preservation, exact-empty exhaustion, va metadata range derive tu candles thuc te.
- `news outlets`: snapshot moi da bo `slug` khoi create/update/list/detail va bo `description` khoi list item; FE form/DTO da dong bo, list khong render cac field nay, con detail/edit van giu `description` theo response.
- `workspace`: frontend da bo `slug` khoi create/update/response definitions, workspace switcher payload/UI, va trang tong quan workspace de khop snapshot moi.
- `watchlists`: FE workspace watchlist editor da chuyen add flow sang bulk endpoint `POST /watchlists/assets` voi request `{ assetIds }`, chunk toi da 100 id moi request; remove flow van dung `DELETE /watchlists/assets/{assetId}`. `assetPricePrecision` chua co trong snapshot/source BE va chi la toi uu tuy chon, khong phai dependency de sua chart.
- `news articles`: endpoint crawl full content da bi bo khoi snapshot, nhung FE van con action `crawlNewsArticleFullContent()` va menu crawl tren detail.
- `events`: snapshot moi da bo `slug` va `confirmedAt`, va doi evidence sang `newsArticle*`; FE events da dong bo DTO, detail, quick detail, va action layout theo contract hien tai.
- `dashboard summary`: FE da dong bo va render `recentEvents` cung `assetsInFocus`. Snapshot moi them required metric `marketNarratives` va ba schema `DashboardMarketNarrativesMetricResponse`, `DashboardMarketNarrativeItemResponse`, `DashboardMarketNarrativeThemeResponse`; FE can cap nhat definitions/action validation, dashboard data flow, UI states, action Graph View va i18n truoc khi apply section Luan diem thi truong.
- `telegram`: FE da dong bo bot create chi gui `botToken`, display label read-only, bo hai rename/update operation, va khoi phuc destination test-message theo live contract; schedule va Calendar/News feature routing da expose `outputLanguageIsoCode`/`outputLanguage` qua catalog `/languages`. Moi PUT feature-setting bao toan language code hien tai; gui omit/blank de xoa override. `SCHEDULED_MARKET_ANALYSIS` khong co feature-level selector vi BE hien tai khong doc override o feature setting.
- `ai-provider credentials`: snapshot moi doi credential `label` thanh `model` va bo top-level config `name`/`model`; FE hien van giu `name`, top-level `model`, va credential `label` trong definitions, form, list, detail, va credential panel.
- `cronjobs`: FE da bo create/delete flow va doi update schedule sang inline list chi gui `expression`; endpoint `stop` duoc ghi nhan nhung khong tich hop co chu dich.
- `personal notes`: FE render/copy response `title` voi fallback da localize, nhung editor va draft da freeform, khong ep H1 dau hay title placeholder. Create title la backend snapshot tu content; content update giu stored title. OpenAPI van chua encode required/nullable hoac lifecycle cua `title`; delete va explicit rename chua tich hop.
- `languages`: schedule da co server action nap catalog tu `GET /languages`; `PATCH /me/preferred-language` van chua tich hop va `LanguageSelector` hien chi doi route locale.
- `narratives`: snapshot moi them `/narratives*`, graph narrative node/edge, va market query `keyNarratives[]`; FE chua co module narratives rieng hoac market-query narrative panel, nhung Graph View da model/render narrative node/edge.
- `market query`: spec van mo ta `asOfTime` la optional `date-time`; frontend conversation chu dong omit field nay de backend tu lay thoi diem hien tai va harden parse cho payload runtime co the tra `null` o `publishedAt` va `occurredAt`. Frontend khong con legacy `/market-query` route hay redirect compatibility; global assistant modal la UI primary surface.
- `market conversation messages`: FE da dong bo `ChatMessageResponse` text-only, bo `kind`, `analysisId`, `PENDING`, analysis data part, va analysis detail actions; cursor history va synchronous submit van giu nguyen.
- `graph view`: snapshot moi bo node kind `theme` va `warm-episode`, bo edge kind `event-theme`, `asset-warm-episode`, va `warm-episode-event`, va them `metadata.themes[]` cho event/narrative node; FE Graph View da dong bo definitions, visuals, model build, inspector, va i18n theo contract moi.
- `user profile`: `GET /me` da dong bo `currentWorkspace`, `mainImage` media object, va `permissions[]`, nhung snapshot moi them `preferredLanguage` dang la `LanguageResponse` nullable; `BackendMeResponse` runtime hien van chua map field nay va permission loader chi doc `permissions[]`.
- `blogs`: create va response dung `visible`, update dung `isVisible`; frontend van can tiep tuc xu ly ky de tranh drift.
- `ai-provider-configs`: snapshot khong con expose full `apiKey` tren config response; frontend da doc `credentials[]` preview va ho tro provider enum `GROQ`, nhung can doi tiep UI/DTO theo contract khong con `name`/top-level `model`.
- `media`: da co trong spec nhung frontend chua co module.
- `topics`: van ton tai tren frontend, nhung khong con nam trong snapshot API hien tai.
