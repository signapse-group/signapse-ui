# Signapse Public Landing Page

> Trạng thái: Đã chốt cho OpenSpec proposal và implementation  
> Phạm vi: Landing công khai tại `/vi` và `/en`  
> Cập nhật gần nhất: 2026-09-15

Quyết định ngày 2026-09-09: landing tập trung vào bốn tính năng Đồ thị Tri thức, Biểu đồ trực tiếp, Trợ lý AI và Telegram. Graph và Chart dùng ảnh sản phẩm đã duyệt; AI Assistant và Telegram là hai chapter text-only hoàn chỉnh, không có hạng mục ảnh còn thiếu.

Quyết định showcase ngày 2026-09-15: `SEE THE WORKFLOW` dùng bốn feature selector Đồ thị Tri thức, Biểu đồ thị trường, Hội thoại AI và Telegram theo lịch trên một shared stage. Graph/Chart tái sử dụng approved capture, AI giữ static text-first proof, và chỉ Telegram theo lịch dùng interactive DOM simulation có nhãn `Demo` cùng route-local Motion trong phase đầu.

Quyết định visual ngày 2026-09-09: landing dùng fixed branded composition với palette navy/mint đã được duyệt cho Signapse. Quyết định này chỉ áp dụng cho landing; dashboard vẫn phản ứng theo theme preference của người dùng.

Quyết định Hero background ngày 2026-09-09: Hero dùng một trường glyph `O/H/L/C/V` tĩnh, route-local, phía sau copy và market-context figure. Ký hiệu chỉ tạo chiều sâu và nhận diện ngữ cảnh dữ liệu thị trường; chúng không biểu diễn ticker, giá, tín hiệu hoặc dữ liệu live.

Quyết định phục hồi Hero ngày 2026-09-08: đưa riêng Hero về baseline trước refocus tại commit `8ae5336` — H1, supporting copy, CTA tới `#how-it-works`, hai proof point và breakpoint `lg`. ProductStory, AnalysisFlow, ProviderIntegrations, FinalAccessCta, Footer và toàn bộ media giữ nguyên runtime hiện tại. Bố cục chapter theo tính năng và ảnh thật có chú thích vẫn thuộc refinement đã triển khai.

## Authority

Tài liệu này là nguồn chuẩn cho định vị, nội dung, bố cục, CTA, claim và media của public landing page Signapse.

- `docs/design/LANDING.md` sở hữu product story và page-specific design direction của landing.
- `docs/design/DESIGN.md` vẫn sở hữu global shared tokens, typography, component chrome và accessibility conventions. Fixed branded palette và theme-boundary exception của landing thuộc tài liệu này.
- Runtime frontend, OpenSpec capability specs và `docs/APIMAPPING.md` sở hữu sự thật về tính năng đang khả dụng.
- OpenSpec change của landing sở hữu các requirement có thể kiểm chứng và kế hoạch triển khai.

Khi các nguồn xung đột, landing chỉ được claim capability đã có surface frontend khả dụng. Backend-only endpoint, code legacy hoặc roadmap không được xem là tính năng công khai. Claim matrix trong tài liệu này phải được cập nhật trước khi landing copy mở rộng theo capability mới.

Trong phạm vi public landing `/{lang}`, tài liệu này override các câu dashboard-scoped trong `docs/design/DESIGN.md` về hero/section composition, việc lặp cùng một primary CTA, background grid và theme parity của landing. `DESIGN.md` vẫn là nguồn chuẩn cho global semantic tokens, Geist typography, shadcn chrome, responsive và accessibility. Landing dùng một route-scoped semantic palette cố định; không sửa `:root`, `.dark`, `components.json` hoặc token của dashboard. Landing dùng một interactive market-context figure có nhãn trong Hero; Analysis Flow có thể dùng đường nối thứ tự decorative giữa ba bước. Connector/node geometry decorative không được lặp trong product frame/card và phải ẩn khỏi accessibility tree. Interactive figure là progressive enhancement của static dual-view fallback, trình bày Market Knowledge Graph và price action như hai góc nhìn bổ sung về bối cảnh thị trường; nó không phải product capture và không ngụ ý graph tạo, biến đổi hoặc dự báo giá. Figure có ý nghĩa phải có text summary localized, semantic keyboard behavior và fallback cùng footprint. Primary CTA chỉ được lặp tại Header, Hero và Final CTA với đúng destination trong CTA Contract.

`openspec/specs/public-landing-page/spec.md` là đầu vào migration cho thay đổi tiếp theo. Các requirement về Hero phải khớp baseline `8ae5336`: hai Hero proof points và Hero secondary CTA tới `#how-it-works`; các requirement về bốn product chapters, AnalysisFlow ba bước, trust, media và CTA còn lại giữ theo runtime hiện tại. Dùng delta `MODIFIED` hoặc `REMOVED` phù hợp; không giữ hai contract cạnh tranh.

## Purpose

Landing giúp một người chưa biết Signapse hiểu trong một lượt đọc:

1. Signapse dành cho ai.
2. Vấn đề phân tích thị trường nào sản phẩm giải quyết.
3. Những surface nào chứng minh được giá trị đó.
4. Giới hạn của sản phẩm.
5. Cách yêu cầu truy cập hoặc mở dashboard.

### Goals

- Định vị Signapse là Market Intelligence Platform với bốn tính năng chính: Đồ thị Tri thức, Biểu đồ trực tiếp, Trợ lý AI và Telegram.
- Giúp người đọc nhận ra định vị Knowledge Graph và AI ngay từ Hero, sau đó xem bốn tính năng, lợi ích và product proof trước hành trình sử dụng.
- Dùng product proof thật thay cho mock dashboard hoặc số liệu dựng sẵn.
- Chuyển khách phù hợp sang một đường dẫn yêu cầu truy cập rõ ràng.
- Giữ copy tiếng Việt và tiếng Anh chính xác với runtime hiện tại.
- Đạt WCAG 2.2 AA, responsive và light/dark parity.

### Non-goals

- Không định vị Signapse là nền tảng trade signal, tư vấn mua/bán hoặc hệ thống tự động đặt lệnh.
- Không hứa dự báo chắc chắn, lợi nhuận, hiệu suất đầu tư hoặc độ chính xác không có số liệu kiểm chứng.
- Không quảng bá backend-only capability hoặc surface frontend đã bị loại bỏ.
- Không thêm pricing, testimonial, customer logo, comparison table hoặc performance metric khi chưa có dữ liệu và quyền công khai.
- Không tạo request-access form, CRM integration hoặc lead-storage workflow trong lần rebuild này.
- Không biến landing thành tài liệu kỹ thuật về pipeline AI hoặc admin workflow nội bộ.
- Không sửa drift ngoài landing trong `docs/APIMAPPING.md` hoặc capability spec `market-chart-annotation-popup-surface`; các debt này thuộc change riêng.

## Audience And Jobs To Be Done

### Primary audience

- Market analyst cần kết nối biến động giá với sự kiện và nguồn tin liên quan.
- Trader thiên về research cần kiểm tra bối cảnh trước khi tự đưa ra quyết định.
- Người theo dõi nhiều tài sản trong workspace đang hoạt động và cần đối chiếu chúng với tin tức, sự kiện kinh tế liên quan.

Landing không được ngầm hứa team collaboration, shared workspace membership hoặc portfolio execution vì runtime hiện tại không cung cấp các capability đó.

### Primary job

> Khi thị trường biến động, tôi muốn đặt giá, sự kiện, phản ứng và nguồn tin liên quan vào cùng một bối cảnh để biết điều gì đáng chú ý, kiểm tra bằng chứng và tiếp tục phân tích mà không phải ghép thủ công nhiều công cụ rời rạc.

### Supporting jobs

- Theo dõi các tài sản quan trọng trong workspace đang hoạt động.
- Xem sự kiện và lịch kinh tế cạnh diễn biến giá.
- Đọc phản ứng thị trường và nguồn bằng chứng khi dữ liệu khả dụng.
- Khám phá quan hệ giữa event, asset, news article và narrative.
- Tiếp tục hội thoại phân tích trong Trợ lý AI của active workspace.
- Nhận cảnh báo tin thị trường, cập nhật lịch kinh tế và bản phân tích từ Signapse qua Telegram sau khi liên kết và cấu hình.

## Positioning And Locked Message Hierarchy

### Category

**Market Intelligence Platform**

Signapse khác một charting terminal, news reader hoặc chatbot độc lập ở chỗ sản phẩm đặt các surface đó quanh cùng lớp sự kiện và quan hệ thị trường, trong khi Trợ lý AI hỗ trợ đặt câu hỏi và tổng hợp bằng văn bản. Landing phải nói về khả năng quan sát, kiểm tra và truy vết; không khẳng định quan hệ nhân quả khi dữ liệu chỉ cho thấy sự liên quan.

Thứ tự tính năng: Đồ thị Tri thức → Biểu đồ trực tiếp → Trợ lý AI → Telegram. Graph View là bề mặt khám phá quan hệ; Market Knowledge Graph cũng cung cấp ngữ cảnh cho Trợ lý AI. Telegram là kênh cập nhật sau khi thiết lập. Phản ứng và nguồn tin hỗ trợ phần Chart; workspace và lịch sử hội thoại hỗ trợ phần AI, không tạo thêm các section ngang hàng.

### Locked first-viewport copy

| Vai trò                  | Tiếng Việt                                                                                                                                                                                                      | English                                                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eyebrow                  | MARKET INTELLIGENCE PLATFORM                                                                                                                                                                                    | MARKET INTELLIGENCE PLATFORM                                                                                                                                                                                 |
| H1                       | Biến dữ liệu thị trường thành Đồ thị Tri thức.                                                                                                                                                                  | Turn market data into a Knowledge Graph.                                                                                                                                                                     |
| Supporting copy          | Signapse tổng hợp, đánh giá và phân tích dữ liệu giá, sự kiện, phản ứng và tin tức từ nhiều nguồn thành các mối liên hệ có thể kiểm tra — tạo ngữ cảnh cho Trợ lý AI khi bạn đặt câu hỏi và đọc từng biến động. | Signapse aggregates, evaluates, and analyzes multi-source price, event, reaction, and news data into inspectable relationships—giving the AI Assistant context when you ask questions and read market moves. |
| Primary CTA              | Yêu cầu truy cập                                                                                                                                                                                                | Request access                                                                                                                                                                                               |
| Hero secondary CTA       | Xem cách Signapse phân tích                                                                                                                                                                                     | See how Signapse analyzes markets                                                                                                                                                                            |
| Signed-in CTA            | Mở bảng điều khiển                                                                                                                                                                                              | Open dashboard                                                                                                                                                                                               |
| Request-access microcopy | Mở ứng dụng email.                                                                                                                                                                                              | Opens your email app.                                                                                                                                                                                        |
| Trust line               | AI hỗ trợ tổng hợp và khám phá. Bạn kiểm tra nguồn và tự đưa ra quyết định giao dịch.                                                                                                                           | AI supports synthesis and exploration. You verify the sources and make the trading decision.                                                                                                                 |
| Hero proof 1 title       | Trợ lý AI chuyên biệt                                                                                                                                                                                           | Specialized AI Assistant                                                                                                                                                                                     |
| Hero proof 1 body        | Vận hành trên Đồ thị Tri thức, được xây dựng từ dữ liệu thị trường đa nguồn đã qua tổng hợp, đánh giá và phân tích.                                                                                             | Powered by a Knowledge Graph built from multi-source market data—aggregated, evaluated, and analyzed.                                                                                                        |
| Hero proof 2 title       | Đọc bối cảnh, không chỉ nhìn nến                                                                                                                                                                                | Read the context, not just the candles                                                                                                                                                                       |
| Hero proof 2 body        | Đọc diễn biến giá trên chart cùng phản ứng thị trường, sự kiện và lịch kinh tế liên quan.                                                                                                                       | Read price action alongside market reactions, related events, and economic-calendar context.                                                                                                                 |

Hero giữ visual conceptual hiện có; dưới figure là hai proof block ngắn. Điều hướng tới bốn chapter vẫn thuộc Header và ProductStory; ảnh Graph/Chart nằm trong chapter tương ứng, không lặp thành một hàng link trong Hero.

Implementation dùng các chuỗi trong first viewport và Locked Section Copy làm editorial baseline. Chỉ được sửa lỗi chính tả hoặc ngữ pháp mà không đổi nghĩa; mọi thay đổi về promise, qualifier, capability boundary, hierarchy hoặc CTA phải cập nhật tài liệu này và cả hai locale trong cùng change.

## Canonical Product Language

| Khái niệm                | Copy tiếng Việt               | English                       | Nghĩa chính xác trên landing                                                                                                                                                                      | Tránh dùng                                                                                                                                                                 |
| ------------------------ | ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace                | workspace                     | workspace                     | Ngữ cảnh làm việc đang hoạt động của người dùng                                                                                                                                                   | shared workspace, team workspace                                                                                                                                           |
| Tracked assets           | danh sách tài sản theo dõi    | tracked asset list            | Một danh sách asset thuộc active workspace                                                                                                                                                        | named watchlists, watchlist groups                                                                                                                                         |
| Market event             | sự kiện thị trường            | market event                  | Sự kiện có thời điểm, asset liên quan và metadata khả dụng                                                                                                                                        | signal, guaranteed catalyst                                                                                                                                                |
| Market reaction          | phản ứng thị trường           | market reaction               | Đánh giá direction, horizon, confidence và reasoning khi có dữ liệu                                                                                                                               | prediction, trade setup                                                                                                                                                    |
| Evidence                 | nguồn tin và bằng chứng       | sources and evidence          | News article hoặc source context giúp truy vết event                                                                                                                                              | AI proof, guaranteed truth                                                                                                                                                 |
| Narrative                | mạch diễn giải thị trường     | market narrative              | Narrative node hoặc quan hệ narrative đã có trong graph                                                                                                                                           | dedicated narrative workspace                                                                                                                                              |
| Confidence               | độ tin cậy                    | confidence                    | Metadata đánh giá của hệ thống, không phải xác suất lợi nhuận hoặc độ chính xác dự báo                                                                                                            | win rate, forecast accuracy                                                                                                                                                |
| Evaluated outcome        | diễn biến đã đánh giá         | evaluated outcome             | Kết quả đánh giá của phản ứng chính trong chart annotation khi dữ liệu khả dụng                                                                                                                   | `observedAt` như outcome; result; guaranteed impact                                                                                                                        |
| Event-aware Charts       | Biểu đồ theo bối cảnh sự kiện | Event-aware Charts            | Candle chart có event/calendar context khi dữ liệu khả dụng                                                                                                                                       | trading signals                                                                                                                                                            |
| Reaction & Evidence      | Phản ứng và bằng chứng        | Reaction & Evidence           | Chi tiết sự kiện hiển thị nguồn tin và thẻ phản ứng khi dữ liệu khả dụng; chart annotation chỉ cung cấp preview ngắn và đường dẫn tới chi tiết                                                    | Market Query evidence sheet; annotation evidence reader; `observedAt` như observed outcome                                                                                 |
| Market Knowledge Graph   | Đồ thị Tri thức thị trường    | Market Knowledge Graph        | Cấu trúc ngữ cảnh thị trường được xây dựng từ dữ liệu đa nguồn qua tổng hợp, đánh giá và phân tích; cung cấp ngữ cảnh cho Trợ lý AI và là một góc nhìn bổ sung cho price action trong Hero figure | Dữ liệu huấn luyện model, prediction engine, trading-signal generator, graph-generated price, guarantee that every Assistant response exposes complete evidence or sources |
| Price action             | Diễn biến giá                 | Price action                  | Góc nhìn khái niệm về chuyển động giá quan sát được, đặt cạnh Market Knowledge Graph trong Hero figure để đọc bối cảnh; không phải dữ liệu live                                                   | Live trading chart, trading signal, price forecast, Knowledge Graph output                                                                                                 |
| Connected Market Graph   | Đồ thị quan hệ thị trường     | Connected Market Graph        | Graph của event, asset, news article và narrative                                                                                                                                                 | workspace graph slice, Theme node                                                                                                                                          |
| AI Assistant             | Trợ lý AI                     | AI Assistant                  | Hội thoại text-only có session/history theo active workspace; nhận ngữ cảnh từ Market Knowledge Graph để hỗ trợ đặt câu hỏi thị trường bằng văn bản                                               | Market Query workbench; structured evidence sheet; prediction engine                                                                                                       |
| Live charts              | Biểu đồ trực tiếp             | Live charts                   | Bề mặt biểu đồ giá có cập nhật trực tiếp và bối cảnh sự kiện; dùng làm tên chapter công khai                                                                                                      | Cập nhật tức thời mọi dữ liệu; mọi thị trường luôn mở                                                                                                                      |
| Signapse market analysis | bản phân tích từ Signapse     | market analysis from Signapse | Nội dung phân tích do Signapse tạo, có thể gửi theo lịch qua Telegram                                                                                                                             | Cam kết độc quyền thương mại; tư vấn mua/bán; kết quả được bảo đảm                                                                                                         |
| Telegram updates         | cập nhật qua Telegram         | Telegram updates              | Cảnh báo tin thị trường, lịch kinh tế và phân tích định kỳ gửi tới điểm nhận đã liên kết và cấu hình                                                                                              | Kênh công khai mặc định; cảnh báo chạm ngưỡng giá; gửi thủ công câu trả lời AI                                                                                             |

Không dùng chuỗi copy Việt–Anh dày đặc nếu đã có cách diễn đạt tiếng Việt tự nhiên. Tên feature tiếng Anh chỉ xuất hiện như tên sản phẩm hoặc lần giải thích đầu tiên.

## Claim Matrix

| Surface                            | Claim được phép công khai                                                                                                                                                                                                 | Qualifier bắt buộc                                                                                                                                                                                                                                                                                                          | Không được claim                                                                                                                                                                                     | Runtime evidence                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace và tracked assets        | Người dùng có thể quản lý danh sách tài sản theo dõi của active workspace; chart chọn asset từ danh sách này.                                                                                                             | Chỉ có một tracked-asset list cho active workspace.                                                                                                                                                                                                                                                                         | Named/grouped/nested watchlists; shared team workspace; watchlist là evidence boundary của AI.                                                                                                       | `openspec/specs/workspace-watchlist-management/spec.md`; `openspec/specs/market-chart-candle-workbench/spec.md`                                                                                                           |
| Event-aware Charts                 | Chart tải historical candles cho asset được chọn từ tracked-asset list và có thể hiển thị market-event annotation cùng economic-calendar event liên quan; live quote hoặc partial candle có thể được cập nhật qua stream. | Annotation và calendar event chỉ xuất hiện khi backend trả dữ liệu phù hợp. Dùng từ “live” riêng cho dữ liệu chart; stream có thể stale, disconnected hoặc market closed, và candle response có thể rỗng.                                                                                                                   | Real-time intelligence toàn hệ thống; annotation/calendar luôn tồn tại; provider uptime guarantee; arbitrary symbol charting; trade entry/stop/target.                                               | `openspec/specs/market-chart-candle-workbench/spec.md`; `openspec/specs/market-chart-live-sse-stream/spec.md`; `openspec/specs/market-chart-economic-calendar-events/spec.md`; `docs/APIMAPPING.md` mục API market charts |
| Hot-event annotation preview       | Annotation popup có thể hiển thị thời điểm, tiêu đề/tóm tắt, phản ứng dự kiến và diễn biến đã đánh giá của phản ứng chính khi các field đó khả dụng; người dùng có thể mở chi tiết sự kiện tương ứng.                     | Đây là preview ngắn. Outcome chỉ xuất hiện khi `topMarketReaction.outcome` có dữ liệu; tương quan theo thời gian không chứng minh quan hệ nhân quả.                                                                                                                                                                         | Rich evidence reader trong popup; reasoning/evidence blocks; toàn bộ phản ứng của sự kiện; outcome luôn tồn tại; guaranteed cause hoặc prediction accuracy.                                          | `docs/APIMAPPING.md` mục API market charts; `app/[lang]/(main)/market-charts/market-chart-workbench.tsx`                                                                                                                  |
| Event detail: reaction và evidence | Chi tiết sự kiện có thể hiển thị nguồn tin liên kết và các thẻ phản ứng thị trường gồm asset, direction, horizon, confidence, reasoning và thời điểm ghi nhận khi dữ liệu khả dụng.                                       | Evidence và reaction đều có thể vắng mặt. `observedAt` là thời điểm ghi nhận, không phải observed/evaluated outcome; confidence không phải forecast accuracy.                                                                                                                                                               | Event detail có realized return/evaluated outcome; mọi event luôn có evidence hoặc reaction; guaranteed cause; prediction; AI Assistant evidence sheet.                                              | `docs/APIMAPPING.md` mục API events; `openspec/specs/event-market-reactions-ui/spec.md`; `app/[lang]/(main)/events/[id]/page.tsx`; `app/[lang]/(main)/events/event-quick-detail-content.tsx`                              |
| Connected Market Graph             | Graph giúp khám phá node `event`, `asset`, `news-article`, `narrative` và các quan hệ hiện có giữa chúng.                                                                                                                 | Theme chỉ là metadata trên event/narrative; graph hiện không nhận workspace/watchlist filter.                                                                                                                                                                                                                               | Theme hoặc warm-episode node; workspace-focused graph slice; dedicated narrative management.                                                                                                         | `docs/APIMAPPING.md` mục API graph view; `openspec/specs/graph-view-backend-contract/spec.md`                                                                                                                             |
| AI Assistant                       | Trợ lý AI có thể được mô tả là chuyên biệt và vận hành trên Market Knowledge Graph, được xây dựng từ dữ liệu thị trường đa nguồn qua tổng hợp, đánh giá và phân tích.                                                     | Knowledge Graph cung cấp ngữ cảnh phân tích; không phải claim model training/fine-tuning, dữ liệu bao phủ đầy đủ, hoặc mọi câu trả lời đều hiển thị evidence/source. Submission là synchronous; active workspace scope là conversation state/request scope, không phải cam kết mọi câu trả lời chỉ dùng watchlist evidence. | Streaming tokens; structured analysis workbench; evidence/limitations sheet; attachments; manual Telegram delivery; route Market Query; prediction accuracy, signal generation, automated execution. | Product Owner-approved Market Knowledge Graph context; `openspec/specs/ai-assistant-market-conversations/spec.md`; `docs/APIMAPPING.md` mục API market query                                                              |
| Narratives                         | Landing có thể nói graph chứa narrative node và quan hệ narrative–event/narrative–asset.                                                                                                                                  | Narrative chỉ được trình bày trong phạm vi graph đang có.                                                                                                                                                                                                                                                                   | Narrative list/detail, refresh workflow hoặc dedicated narrative workspace.                                                                                                                          | `docs/APIMAPPING.md` mục API graph view và API narratives                                                                                                                                                                 |
| Telegram                           | Nhận cảnh báo tin thị trường, cập nhật lịch kinh tế và bản phân tích từ Signapse qua điểm nhận Telegram đã liên kết; chọn nội dung nhận và thiết lập lịch phân tích theo tài sản theo dõi.                                | Cần quyền phù hợp, bot và điểm nhận hoạt động, routing bật; phân tích định kỳ cần lịch đã cấu hình. Một lịch chọn một tài sản, một đến bốn giờ gửi trong ngày và múi giờ.                                                                                                                                                   | Kênh công khai mặc định; gửi thủ công câu trả lời AI sang Telegram; cảnh báo chạm ngưỡng giá tùy ý; bảo đảm nhận/đọc tin; độc quyền thương mại chưa được xác định.                                   | `app/[lang]/(main)/telegram/telegram-configuration.tsx`; `openspec/specs/telegram-configuration-ui/spec.md`; `docs/APIMAPPING.md` mục API telegram                                                                        |
| Trading outcomes                   | Signapse hỗ trợ quá trình phân tích và kiểm chứng nguồn.                                                                                                                                                                  | Hero trust note và footer disclaimer phải giữ giới hạn trách nhiệm rõ ràng.                                                                                                                                                                                                                                                 | Buy/sell advice; signal generation; automated execution; P&L; guaranteed forecast; performance return.                                                                                               | Product boundary của landing                                                                                                                                                                                              |

### Global claim rules

- Không biến dữ liệu optional thành capability luôn khả dụng.
- Không dùng backend-only API làm bằng chứng cho public claim.
- Không dùng “AI-powered” như giá trị độc lập; phải nói rõ người dùng xem hoặc làm được gì.
- Không gọi correlation là causation.
- Không dùng số liệu hiệu quả, customer count, uptime, accuracy hoặc conversion khi chưa có nguồn được duyệt.
- Mọi headline, caption, alt text và metadata cũng phải tuân theo claim matrix.
- Copy giới thiệu tính năng được viết ngắn gọn theo Locked Section Copy; điều kiện dữ liệu và thiết lập tập trung trong ghi chú chi tiết phù hợp, Hero trust note và footer disclaimer, không lặp vào từng câu hoặc thêm trở lại description AnalysisFlow đã duyệt. Những giới hạn này vẫn là contract sản phẩm.

## Locked Section Copy

Các dictionary entry của landing phải bắt đầu từ copy dưới đây. Tên component và role chỉ là implementation mapping, không phải user-facing text.

### `PublicHeader` And `PublicFooter`

| Vai trò            | Tiếng Việt                                  | English                          |
| ------------------ | ------------------------------------------- | -------------------------------- |
| Nav: Product       | Sản phẩm                                    | Product                          |
| Nav: Overview      | Tổng quan                                   | Overview                         |
| Nav: How it works  | Cách hoạt động                              | How it works                     |
| Sign in            | Đăng nhập                                   | Sign in                          |
| Locale group label | Chọn ngôn ngữ                               | Choose language                  |
| Vietnamese locale  | Tiếng Việt                                  | Tiếng Việt                       |
| English locale     | English                                     | English                          |
| Footer descriptor  | Phân tích thị trường theo bối cảnh sự kiện. | Event-aware market intelligence. |

CTA label trong Header và email fallback trong Footer dùng đúng CTA Contract, không tạo biến thể copy khác.

Header chỉ hiển thị nhóm Sản phẩm, locale và auth-aware CTA. Desktop dùng disclosure chứa Tổng quan (`#product`), bốn chapter theo thứ tự tính năng và Cách hoạt động (`#how-it-works`). Mobile hiển thị cùng danh sách trong menu, không có submenu bay ngang. Menu đóng khi chọn link, Escape hoặc bấm ngoài; Escape trả focus về trigger. Blog, Tài liệu và dropdown Hỗ trợ chưa hiển thị; tài liệu người dùng sẽ được xây dựng sau. Trust vẫn là section của landing, liên hệ vẫn ở Footer.

### `AnalysisFlow` — `#how-it-works`

Quyết định nội dung chốt ngày 2026-09-07: chuyển từ bốn bước sang ba bước bên dưới. Đây là baseline cho thay đổi tiếp theo; runtime, dictionary và OpenSpec hiện hành chưa được cập nhật trong phiên chốt nội dung này.

| Vai trò      | Tiếng Việt                                                                                                          | English                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Eyebrow      | CÁCH SỬ DỤNG SIGNAPSE                                                                                               | HOW TO USE SIGNAPSE                                                                                               |
| H2           | Bắt đầu từ một biến động bạn muốn hiểu.                                                                             | Start with a market move you want to understand.                                                                  |
| Step 1 title | Chọn tài sản, xem diễn biến giá                                                                                     | Choose an asset, review price action                                                                              |
| Step 1 body  | Chọn tài sản trong danh sách theo dõi. Xem diễn biến giá cùng các dấu mốc sự kiện và lịch kinh tế.                  | Choose an asset from your tracked list. View price action alongside event markers and the economic calendar.      |
| Step 2 title | Mở sự kiện, kiểm tra nguồn tin                                                                                      | Open an event, check the sources                                                                                  |
| Step 2 body  | Mở chi tiết sự kiện để đọc phản ứng thị trường và đối chiếu với các nguồn tin.                                      | Open event details to read market reactions and cross-check them against news sources.                            |
| Step 3 title | Phân tích cùng Trợ lý AI                                                                                            | Analyze with the AI Assistant                                                                                     |
| Step 3 body  | Trợ lý AI hỗ trợ bạn phân tích quan hệ giữa sự kiện, tài sản và tin tức để tìm hiểu thêm những thông tin liên quan. | The AI Assistant helps you analyze relationships between events, assets, and news to explore related information. |

- Section giúp người mới hình dung hành trình sử dụng: xem giá, kiểm tra nguồn, phân tích với Trợ lý AI. Gộp chọn tài sản và xem bối cảnh biểu đồ vào bước đầu; bước cuối giới thiệu Trợ lý AI thay cho thao tác khám phá Graph View.
- Chỉ hiển thị eyebrow, H2 và ba bước đánh số `01`–`03`. Bỏ intro, dòng mũi tên lặp tên bước và dòng riêng về Trợ lý AI cuối section.
- Giữ nguyên description tiếng Việt đã chốt. Không thêm lại “khi có dữ liệu”, “khi có sẵn” hoặc “liên kết” vào hai description đầu; bản tiếng Anh giữ cùng mức diễn đạt. Đây là quyết định rút gọn copy tại AnalysisFlow; các giới hạn dữ liệu trong ProductStory, Hero/footer và claim matrix vẫn được giữ.
- Nội dung AI tuân theo claim matrix: hỗ trợ phân tích quan hệ bằng ngữ cảnh Market Knowledge Graph. Thứ tự các bước không cam kết tự chuyển sự kiện hoặc biểu đồ đang xem vào hội thoại, hoặc mọi câu trả lời đều có nguồn đầy đủ.
- Đặt section sau toàn bộ bốn product chapters và trước ProviderIntegrations. Ba bước nằm cùng hàng khi đủ chiều rộng và xếp dọc trên màn hình hẹp; không giữ một hình trang trí riêng chiếm diện tích. Đường nối tĩnh giữa các bước là tùy chọn nếu giúp đọc thứ tự; phải decorative và ẩn khỏi accessibility tree.
- Telegram được trình bày trong chapter riêng như kênh cập nhật sau khi thiết lập; không thêm bước thứ tư vào AnalysisFlow. Giữ nguyên toàn bộ copy ba bước đã chốt.

### `ProductStory` — `#product`

| Vai trò | Tiếng Việt                                         | English                                            |
| ------- | -------------------------------------------------- | -------------------------------------------------- |
| H2      | Bốn tính năng để theo dõi và phân tích thị trường. | Four features for following and analyzing markets. |

Section không cần intro lặp danh sách bốn tính năng đã hiển thị trong Hero. Bốn chapter đủ rộng, theo thứ tự dưới đây; mỗi chapter có outcome và body ngắn. Graph/Chart dùng ảnh làm product proof; AI/Telegram dùng nội dung text-only. Caption/alt phải mô tả đúng ảnh thực tế được duyệt; không viết caption khẳng định dữ liệu chưa xuất hiện trong ảnh.

#### Chapter 1 — Knowledge Graph — `#knowledge-graph`

| Vai trò | Tiếng Việt                                                                                                                                           | English                                                                                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eyebrow | Đồ thị Tri thức                                                                                                                                      | Knowledge Graph                                                                                                                                              |
| H3      | Nhìn thấy các mối liên hệ trong thị trường.                                                                                                          | See how market information connects.                                                                                                                         |
| Body    | Khám phá quan hệ giữa sự kiện, tài sản và tin tức trên Đồ thị Tri thức. Theo dấu các liên kết để mở rộng bối cảnh quanh thông tin bạn đang quan tâm. | Explore relationships between events, assets, and news on the Knowledge Graph. Follow the links to expand the context around information that interests you. |

Product proof: ảnh Graph View thực tế cho thấy một sự kiện nối với tài sản và bài viết liên quan. Giữ phân biệt bề mặt Graph View có thể khám phá với lớp Market Knowledge Graph cung cấp ngữ cảnh cho AI. Không dùng hình động Hero hoặc Sigma demo để giả làm ảnh sản phẩm. Các giới hạn về node kinds, narrative và workspace filtering trong claim matrix vẫn áp dụng.

#### Chapter 2 — Live Charts — `#live-charts`

| Vai trò           | Tiếng Việt                                                                                        | English                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Eyebrow           | Biểu đồ trực tiếp                                                                                 | Live charts                                                                                 |
| H3                | Theo dõi thị trường khi giá đang chuyển động.                                                     | Follow markets as prices move.                                                              |
| Body              | Theo dõi diễn biến giá cập nhật trực tiếp, cùng các dấu mốc sự kiện và lịch kinh tế trên biểu đồ. | Follow live price movements alongside event markers and the economic calendar on the chart. |
| Supporting detail | Mở dấu mốc sự kiện để xem phản ứng thị trường và kiểm tra nguồn tin.                              | Open an event marker to review market reactions and check the sources.                      |

Product proof: ảnh chart thực tế có dữ liệu giá, dấu mốc sự kiện và trạng thái luồng được giữ nguyên. Chú thích là preview và đường dẫn tới chi tiết; không ngụ ý toàn bộ nguồn tin nằm trong popup. Reaction & Evidence được gộp vào phần giải thích Chart, không còn là chapter riêng. Trạng thái dữ liệu cũ, mất kết nối, thị trường đóng cửa và giới hạn dữ liệu phải được giữ trong capture và ghi chú chi tiết phù hợp.

#### Chapter 3 — AI Assistant — `#ai-assistant`

| Vai trò | Tiếng Việt                                                                                                                                                   | English                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow | Trợ lý AI                                                                                                                                                    | AI Assistant                                                                                                                                               |
| H3      | Đặt câu hỏi với ngữ cảnh từ Đồ thị Tri thức.                                                                                                                 | Ask questions with context from the Knowledge Graph.                                                                                                       |
| Body    | Trò chuyện với Trợ lý AI để phân tích quan hệ giữa sự kiện, tài sản và tin tức. Tiếp tục đặt câu hỏi và xem lại các cuộc trò chuyện trong workspace của bạn. | Chat with the AI Assistant to analyze relationships between events, assets, and news. Ask follow-up questions and revisit conversations in your workspace. |

Product proof: chapter text-only giải thích trực tiếp vai trò của ngữ cảnh Market Knowledge Graph và lợi ích của lịch sử hội thoại. Không claim chọn node để chat, tự chuyển chart/event đang xem vào hội thoại, hoặc mọi câu trả lời có evidence/source sheet. Bỏ section WorkspaceAssistant riêng; thông tin danh sách theo dõi được giải thích trong Chart, thông tin workspace/history nằm tại đây.

#### Chapter 4 — Telegram — `#telegram`

| Vai trò | Tiếng Việt                                                                                                                                              | English                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eyebrow | Telegram                                                                                                                                                | Telegram                                                                                                                                               |
| H3      | Nhận cập nhật và bản phân tích từ Signapse.                                                                                                             | Receive updates and market analysis from Signapse.                                                                                                     |
| Body    | Nhận cảnh báo tin thị trường, cập nhật lịch kinh tế và bản phân tích từ Signapse qua Telegram. Thiết lập lịch nhận phân tích theo tài sản bạn theo dõi. | Receive market news alerts, economic calendar updates, and market analysis from Signapse through Telegram. Schedule analysis for the assets you track. |
| Setup   | Liên kết Telegram, chọn nội dung nhận và thiết lập lịch phân tích theo tài sản.                                                                         | Link Telegram, choose what to receive, and schedule analysis by asset.                                                                                 |

Product proof: chapter text-only mô tả ba nhóm nội dung người dùng nhận được và cách thiết lập. Không dùng ảnh tin nhắn hoặc màn hình quản trị bot; việc không có ảnh là bố cục đã chốt, không phải trạng thái thiếu media.

Luồng tiếp cận đã chốt: sau khi được cấp quyền phù hợp, người dùng liên kết điểm nhận Telegram, chọn luồng nội dung và thiết lập lịch phân tích theo tài sản. Sử dụng cấu hình bot/điểm nhận/routing/lịch hiện có, không xây onboarding mới hoặc tạo kênh chung. Không thêm CTA tham gia kênh công khai hay liên kết bot chưa được xác định. Dùng “bản phân tích từ Signapse”; không dùng “độc quyền” để ngụ ý quyền truy cập trả phí, quyền sở hữu hoặc lợi thế thương mại chưa được xác định.

### `InteractiveProductShowcase` — `SEE THE WORKFLOW`

| Vai trò | Tiếng Việt                                                                                                                       | English                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Eyebrow | SEE THE WORKFLOW                                                                                                                 | SEE THE WORKFLOW                                                                                                                     |
| H2      | Xem cách Signapse biến dữ liệu thành hành động.                                                                                  | See how Signapse turns data into action.                                                                                             |
| Intro   | Khám phá cách Đồ thị Tri thức, biểu đồ thị trường, hội thoại AI và Telegram kết nối trong quy trình phân tích.                  | Explore how the Knowledge Graph, market charts, AI conversations, and Telegram connect across the analysis workflow.                 |

- Feature selector dùng thứ tự Đồ thị Tri thức → Biểu đồ thị trường → Hội thoại AI → Telegram theo lịch trên một shared stage; Scheduled Telegram active mặc định.
- Desktop dùng semantic vertical tabs ở cột trái và stage rộng ở cột phải. Narrow viewport và zoom `200%` giữ cùng tab model, xếp selector dọc phía trên stage; không đổi sang dropdown, horizontal tab rail hoặc accordion.
- Graph và Chart dùng approved capture theo locale; AI Conversation dùng static text-first proof. Ba static stage không dùng spinner, skeleton hoặc public “Coming soon”.
- Scheduled Telegram là interactive product-like surface duy nhất được phép trong phase này. Surface phải có nhãn `Demo`, dùng fixture cố định, không gọi backend, không gửi Telegram và không giả delivery/read receipt.
- Demo bắt đầu từ `Market Desk` đang hoạt động, route Scheduled Market Analysis đã bật, lịch `Morning briefing` và múi giờ `Asia/Bangkok`. Người xem chọn XAU/USD/BTC/USD, 08:00/18:00 và Tiếng Việt/English rồi kích hoạt “Xem luồng gửi” / “View delivery flow”.
- Sequence đi qua Route ready → Configure → Scheduled → Scheduled run → Telegram preview trong khoảng 3,1 giây, autoplay một lần khi đủ visible, dừng ở final state và nhường quyền điều khiển cho pointer/focus/selection. Replay là cách duy nhất chủ động chạy lại.
- Reduced motion đổi state tức thời. Server fallback luôn giữ destination, schedule summary và localized message preview có nhãn `Demo` trong cùng footprint.
- Message preview chỉ nói bản phân tích theo lịch đã được chuẩn bị và dẫn người xem về Signapse để kiểm tra bối cảnh/nguồn trước khi tự quyết định; không có giá, khuyến nghị, signal, cảnh báo ngưỡng giá, claim kênh công khai hoặc trạng thái delivered/read.

### `ProviderIntegrations` — `#trust`

| Vai trò | Tiếng Việt                                                                                                                                                                 | English                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow | TÍCH HỢP AI ĐA NHÀ CUNG CẤP                                                                                                                                                | MULTI-PROVIDER AI INTEGRATIONS                                                                                                                             |
| H2      | Nhiều mô hình AI. Một nền tảng Signapse.                                                                                                                                    | Multiple AI models. One Signapse platform.                                                                                                                 |
| Intro   | Linh hoạt lựa chọn mô hình AI cho từng tác vụ phân tích và phát triển chiến lược.                                                                                          | Choose the right AI model for each analysis and strategy-development task.                                                                               |
| List    | OpenAI · Gemini · Anthropic · DeepSeek · Groq · Z.AI                                                                                                                       | OpenAI · Gemini · Anthropic · DeepSeek · Groq · Z.AI                                                                                                      |

### `FinalAccessCta` — `#access`

Anonymous state:

| Vai trò   | Tiếng Việt                                                                                                                             | English                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| H2        | Xem thị trường trong đúng bối cảnh.                                                                                                    | See the market in context.                                                                                                  |
| Body      | Yêu cầu truy cập để khám phá Đồ thị Tri thức, theo dõi biểu đồ trực tiếp, trò chuyện với Trợ lý AI và thiết lập cập nhật qua Telegram. | Request access to explore the Knowledge Graph, follow live charts, chat with the AI Assistant, and set up Telegram updates. |
| CTA       | Yêu cầu truy cập                                                                                                                       | Request access                                                                                                              |
| Microcopy | Liên kết này mở ứng dụng email tới `access@signapse.cloud`. Nếu không mở được, hãy sao chép địa chỉ trong footer.                      | This link opens your email app to `access@signapse.cloud`. If it does not open, copy the address from the footer.           |

Authenticated state:

| Vai trò | Tiếng Việt                                                   | English                                       |
| ------- | ------------------------------------------------------------ | --------------------------------------------- |
| H2      | Tiếp tục từ workspace đang hoạt động.                        | Continue from your active workspace.          |
| Body    | Mở bảng điều khiển để tiếp tục hành trình phân tích của bạn. | Open the dashboard to continue your analysis. |
| CTA     | Mở bảng điều khiển                                           | Open dashboard                                |

## CTA Contract

### Locked destinations

```text
Request access: mailto:access@signapse.cloud?subject=Signapse%20access%20request
Sign in:        /{lang}/sign-in
Open dashboard: /{lang}/dashboard
How it works:   #how-it-works
Product:        #product
Knowledge Graph: #knowledge-graph
Live charts:    #live-charts
AI Assistant:   #ai-assistant
Telegram:       #telegram
Trust:          #trust
```

| Trạng thái     | Vị trí                                                    | CTA                                                             | Destination               | Hành vi                                                                   |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Chưa đăng nhập | Header                                                    | Yêu cầu truy cập / Request access                               | Request-access `mailto:`  | Mở email client của người dùng.                                           |
| Chưa đăng nhập | Header secondary                                          | Đăng nhập / Sign in                                             | `/{lang}/sign-in`         | Mở Clerk sign-in theo locale.                                             |
| Chưa đăng nhập | Footer secondary                                          | Đăng nhập / Sign in                                             | `/{lang}/sign-in`         | Giữ một đường vào sign-in ở cuối trang.                                   |
| Chưa đăng nhập | Hero primary                                              | Yêu cầu truy cập / Request access                               | Request-access `mailto:`  | Cùng destination với header; không tạo funnel thứ hai.                    |
| Chưa đăng nhập | Hero secondary                                            | Xem cách Signapse phân tích / See how Signapse analyzes markets | `#how-it-works`           | Cuộn tới hành trình phân tích ba bước.                                    |
| Chưa đăng nhập | Final CTA                                                 | Yêu cầu truy cập / Request access                               | Request-access `mailto:`  | Cùng destination với hero.                                                |
| Đã đăng nhập   | Header primary, Hero primary, Final CTA, Footer secondary | Mở bảng điều khiển / Open dashboard                             | `/{lang}/dashboard`       | Thay Sign in trong Footer và mở protected dashboard theo locale.          |
| Đã đăng nhập   | Hero secondary                                            | Xem cách Signapse phân tích / See how Signapse analyzes markets | `#how-it-works`           | Giữ điều hướng nội trang như trạng thái chưa đăng nhập.                   |
| Mọi người dùng | Footer contact                                            | `access@signapse.cloud`                                         | Cùng request-access email | Hiển thị địa chỉ email để có thể copy khi máy không cấu hình mail client. |

### CTA behavior rules

- Microcopy cạnh request-access CTA phải nói rõ link sẽ mở ứng dụng email.
- Preview và production dùng cùng locked request-access destination; không có test mailbox hoặc CTA override theo environment.
- Landing không hiển thị success toast hoặc confirmation giả vì nó không biết email đã được gửi hay chưa.
- Không dùng “Start free”, “Create account”, “Book demo” hoặc “Get started” khi chưa có destination tương ứng.
- Không thêm form trong landing change. Request form chỉ được đề xuất riêng khi đã chốt data owner, storage, abuse protection, privacy notice và success state.
- CTA analytics không nằm trong scope này; chỉ thêm khi có analytics event contract và consent policy.
- Trước public release, product owner phải xác nhận `access@signapse.cloud` đã được provision, nhận được email từ bên ngoài và có người theo dõi. Nếu chưa đạt, locked destination chưa được phép ship và phải được thay bằng destination đã duyệt trong tài liệu này.

## Public Asset Policy

### Approved now

Các asset sau đã nằm trong public runtime và được phép dùng trên landing:

| Asset                                              | Vai trò được phép                               |
| -------------------------------------------------- | ----------------------------------------------- |
| `public/favicon.svg`                               | Favicon và browser identity.                    |
| `public/images/signapse_logo_dark.svg`             | Logo vector trên nền phù hợp.                   |
| `public/images/signapse_logo_light.svg`            | Logo vector trên nền phù hợp.                   |
| `public/images/signapse_logo_dark_2048x2048.webp`  | Raster brand asset hoặc social artwork khi cần. |
| `public/images/signapse_logo_light_2048x2048.webp` | Raster brand asset hoặc social artwork khi cần. |

Ưu tiên SVG cho UI. Hai bản WebP chỉ dùng khi consumer cần raster; không tải file 2048px nếu kích thước hiển thị nhỏ hơn đáng kể.

### Product captures permitted after review

Phạm vi media chỉ gồm ảnh Đồ thị Tri thức và Biểu đồ trực tiếp. Hai feature này đã có asset Việt–Anh được duyệt và tích hợp; AI Assistant và Telegram không có media slot.

| Planned asset                                         | Surface được capture                                                  | Vị trí            | Trạng thái           |
| ----------------------------------------------------- | --------------------------------------------------------------------- | ----------------- | -------------------- |
| `public/images/landing/{lang}/knowledge-graph.webp`   | Graph View với sự kiện, tài sản và bài viết liên quan                 | Đồ thị Tri thức   | Đã duyệt và tích hợp |
| `public/images/landing/{lang}/live-market-chart.webp` | Chart với giá, dấu mốc sự kiện, lịch kinh tế và trạng thái luồng thật | Biểu đồ trực tiếp | Đã duyệt và tích hợp |

`{lang}` là `vi` hoặc `en`. Capture có visible UI text phải có hai asset dùng cùng demo scenario, product state và crop tương đương; text trong ảnh phải khớp locale của route. Asset không có text phụ thuộc ngôn ngữ có thể dùng chung dưới `public/images/landing/shared/` sau khi được duyệt. Nếu asset của một locale chưa tồn tại hoặc chưa approved, locale đó bỏ media slot và dùng text-first composition; không fallback sang ảnh của locale còn lại.

Text-first chỉ là fallback khi Graph hoặc Chart thiếu ảnh đã duyệt cho locale hiện tại. AI Assistant và Telegram luôn là text-only theo thiết kế và không được ghi nhận như media còn thiếu.

### Capture preparation and ownership

- Codex phụ trách kịch bản chụp, crop, tối ưu, caption và alt cho ảnh Graph/Chart Việt–Anh. Product Owner xác nhận môi trường/nguồn demo được phép công khai và duyệt riêng ảnh cuối của từng locale trước khi tích hợp.
- Graph ưu tiên một cụm quan hệ dễ đọc gồm sự kiện, tài sản và bài viết liên quan; 2–3 chú thích chỉ rõ điều cần quan sát. Không dùng Sigma demo thay Graph View hoặc diễn đạt đường nối như bằng chứng nhân quả.
- Chart thể hiện giá, dấu mốc sự kiện, lịch kinh tế và trạng thái dữ liệu thực tế. Có thể dùng thêm crop chi tiết sự kiện khi cần, nhưng phải phân biệt preview với màn chi tiết; ảnh tĩnh không được mô tả như biểu đồ live đang chạy.
- AI Assistant và Telegram không có capture requirement hoặc media catalog entry.
- Ghi lại theo Graph/Chart và locale: nguồn và kịch bản, path, dimensions, caption/alt, trạng thái thiếu ảnh/chờ duyệt/đã duyệt, cùng xác nhận của owner. Không lưu credential hoặc dữ liệu riêng trong hồ sơ này.

### Capture approval checklist

Một product capture chỉ được công khai khi tất cả điều kiện sau đạt:

- Dùng seeded/demo workspace hoặc dữ liệu đã được chủ sở hữu xác nhận cho phép công khai.
- Không có tên, email, avatar, workspace riêng, watchlist riêng hoặc thông tin nhận dạng người dùng thật.
- Không có API key, token, permission detail, internal hostname, request payload, console log hoặc admin-only control nhạy cảm.
- Không hiển thị unreleased hoặc backend-only capability.
- Không chứa customer logo, testimonial, portfolio value, P&L hoặc performance metric chưa được duyệt.
- Headline, article excerpt và source content tuân thủ quyền sử dụng; ưu tiên demo copy do Signapse sở hữu hoặc dữ liệu được phép tái sử dụng.
- Vendor/source attribution vẫn hiển thị khi license hoặc ngữ cảnh yêu cầu.
- Số liệu trong capture là dữ liệu demo có chủ đích, không phải số ngẫu nhiên được trình bày như runtime truth.
- Crop không làm thay đổi ý nghĩa hoặc che limitation/status quan trọng.
- Visible UI text khớp locale của route; asset selection, caption và alt text lấy từ dictionary.
- Có localized alt text; nội dung thiết yếu trong ảnh cũng được giải thích bằng text cạnh ảnh.
- Hai locale được duyệt độc lập trên cùng demo scenario; không dùng ảnh sai locale làm fallback.
- Asset có intrinsic dimensions, được tối ưu WebP/AVIF và không gây layout shift.

### Prohibited assets and treatments

- Không publish `docs/design/design_light.png` hoặc `docs/design/design_dark.png`; đây là design reference, không phải product proof.
- Không dùng các bản logo trong `docs/design/logo/` làm runtime source khi đã có canonical asset dưới `public/images/`.
- Không dựng lại synthetic dashboard hiện tại với chart bars, confidence, evidence count hoặc control giả.
- Không dùng stock trader imagery, AI brain/blob, neon crypto aesthetic, ticker wallpaper hoặc candlestick chỉ để trang trí. Ngoại lệ hẹp là trường glyph `O/H/L/C/V` tĩnh đã duyệt cho nền Hero; trường này không chứa ticker, giá, phần trăm, BUY/SELL, tín hiệu hoặc candle giả.
- Không dùng screenshot từ production/private workspace.
- Không dùng customer logo, quote, rating hoặc certification khi chưa có quyền bằng văn bản.
- Không dùng generated image để giả làm screenshot sản phẩm.

Nếu chưa có capture được duyệt, hero phải dùng text-first composition và conceptual figure có nhãn, không dùng placeholder mock để lấp chỗ trống.

## Information Architecture

| Thứ tự | Section / route-local component | ID              | Mục tiêu                                                  | Nội dung chính                                                                              | Product proof                                        |
| ------ | ------------------------------- | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1      | `PublicHeader`                  | —               | Nhận diện, điều hướng và access path                      | Logo; Sản phẩm (Tổng quan, bốn tính năng, Cách hoạt động); locale; auth-aware CTA           | Brand asset                                          |
| 2      | `HeroProductProof`              | `#top`          | Định vị Knowledge Graph/AI và dẫn tới hành động tiếp theo | H1/supporting copy baseline; CTA; trust line; hai proof point                               | Conceptual market-context figure hiện có             |
| 3      | `ProductStory`                  | `#product`      | Giải thích bốn tính năng chính bằng bốn chapter lớn       | Đồ thị Tri thức → Biểu đồ trực tiếp → Trợ lý AI → Telegram                                  | Ảnh Graph/Chart; AI/Telegram text-only               |
| 4      | `AnalysisFlow`                  | `#how-it-works` | Giúp người mới hình dung hành trình sử dụng               | Chọn tài sản, xem diễn biến giá → Mở sự kiện, kiểm tra nguồn tin → Phân tích cùng Trợ lý AI | Ba bước bằng text; đường nối thứ tự tĩnh là tùy chọn |
| 5      | `InteractiveProductShowcase`    | —               | Cho xem bốn feature trên một shared stage                 | Graph/Chart static proof; AI text-first; Scheduled Telegram Motion demo                     | Hai approved capture + DOM demo có nhãn              |
| 6      | `ProviderIntegrations`          | `#trust`        | Cho thấy khả năng tích hợp nhiều nhà cung cấp AI          | OpenAI; Gemini; Anthropic; DeepSeek; Groq; Z.AI                                             | Logo màu, không khung, chuyển động chậm              |
| 7      | `FinalAccessCta`                | `#access`       | Kết thúc bằng cùng một conversion path                    | Outcome recap; auth-aware CTA; email behavior microcopy                                     | Không cần media                                      |
| 8      | `PublicFooter`                  | —               | Cung cấp fallback và locale path                          | Brand; sign-in hoặc dashboard theo auth state; request-access email; locale                 | Brand asset                                          |

### Composition rules

- Không tạo section riêng chỉ để lặp lại problem statement; hero và `AnalysisFlow` đã sở hữu vấn đề.
- `ProductStory` dùng bốn chapter editorial theo thứ tự đã chốt, không xếp thành bốn cột chữ nhỏ. Bố cục desktop theo bảng bên dưới; Graph/Chart trên màn hình hẹp luôn đọc copy trước ảnh.
- Tên feature là nhãn nhỏ; câu lợi ích đã duyệt là heading `h3` chính của chapter, nổi bật hơn body. Không lặp tên/mô tả trong một khung media chỉ chứa chữ. Chỉ thêm supporting detail có giá trị, tối đa ba proof points; không điền đủ bullet chỉ để cân số lượng. Không lặp phần giới thiệu bốn tính năng giữa Hero và ProductStory.
- Khi Graph hoặc Chart chưa có ảnh được duyệt cho locale hiện tại, bỏ toàn bộ media surface, không giữ cột rỗng hoặc chiều cao placeholder. AI Assistant và Telegram luôn text-only với measure dễ đọc.
- WorkspaceAssistant riêng được gộp vào chapter AI; Reaction & Evidence được gộp vào Chart. Xóa section/copy/helper cũ không còn caller khi triển khai; không thêm chapter thứ năm cho hai nhóm thông tin hỗ trợ này.
- Essential text đứng ngoài screenshot; screenshot không phải tài liệu đọc duy nhất.
- Header, Hero và Final CTA dùng cùng một primary destination.
- Footer chỉ hiển thị link đang tồn tại; không render Docs, Privacy hoặc Terms trước khi route thật có sẵn.
- Route-specific sections ở cạnh route. Không tạo shared component hoặc wrapper mới chỉ cho landing.
- Showcase shell sở hữu feature selection và shared stage; mỗi feature renderer là route-local và có thể được thay độc lập. Phase đầu chỉ Telegram theo lịch có interactive renderer.

### Feature-specific composition

| Chapter           | Desktop từ `1200px`, khi có ảnh được duyệt | Trọng tâm nội dung                                                                 |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Đồ thị Tri thức   | Copy trái, ảnh graph phải                  | Một cụm quan hệ dễ hiểu; 2–3 chú thích giúp đọc sự kiện, tài sản và nguồn tin      |
| Biểu đồ trực tiếp | Copy trái, ảnh chart phải                  | Giá đi cùng dấu mốc sự kiện và lịch kinh tế; phản ứng/nguồn tin là nội dung hỗ trợ |
| Trợ lý AI         | Text-only, measure tối đa `3xl`            | Ngữ cảnh Market Knowledge Graph và lịch sử hội thoại                               |
| Telegram          | Text-only, measure tối đa `3xl`            | Ba nhóm nội dung nhận được và thiết lập                                            |

Product chapter composition không đồng nhất với `InteractiveProductShowcase`: Telegram chapter vẫn text-only, còn showcase có một Scheduled Telegram DOM simulation được nhận diện rõ là `Demo`.

Graph là điểm nhấn thị giác đầu tiên nhưng không tạo thêm section hoặc thay đổi vị thế bốn tính năng chính. Hero giữ hai proof point ngắn; điều hướng tới bốn feature thuộc Header và ProductStory, không lặp thành một hàng link trong Hero.

### Product image presentation

- Mỗi ảnh sản phẩm được duyệt hiển thị trực tiếp trong chapter, không có nút mở rộng hoặc hộp thoại phụ. Ảnh là product proof tĩnh, không phải demo và không chứa interaction giả với graph/chart/chat.
- Chú thích, annotation và thông tin thiết yếu luôn là text ngoài ảnh, đọc được ngay tại chapter. Caption/alt dựa trên nội dung capture đã duyệt; không khẳng định dữ liệu chưa có trong ảnh.
- Ảnh giữ tỷ lệ và intrinsic dimensions, dùng responsive width theo bố cục chapter, không crop thêm hoặc kéo méo. Ở mobile và zoom `200%`, ảnh reflow bên dưới copy và không tạo page-level overflow.
- Nếu ảnh inline lỗi, chapter vẫn giữ outcome, body, caption và annotation; thông báo lỗi localized không được làm mất nội dung giải thích.

## Visual Direction

Tên direction: **Evidence-Led Editorial**.

Landing phải gợi cảm giác một market briefing rõ ràng, chính xác và có thể truy vết. Bốn tính năng có vai trò dễ phân biệt: khám phá quan hệ, theo dõi giá trực tiếp, phân tích cùng AI và nhận cập nhật qua Telegram. Product proof phục vụ từng vai trò; AnalysisFlow nối chúng thành hành trình sử dụng ngắn sau phần tính năng. Hero figure giữ hình học graph-to-price-action trừu tượng đã có để cho thấy hai góc nhìn bổ sung; không dùng ticker, trục, số liệu, dashboard chrome hoặc giá giả.

### Design dials

- Variance: `5/10` — hiện đại, có nhịp editorial nhưng không phá cấu trúc đọc.
- Motion: `2/10` — transition nhẹ, không choreography hoặc scroll-jacking.
- Density: `3/10` — nhiều khoảng thở hơn dashboard.

### Visual rules

- Giữ Geist và Geist Mono theo stack hiện tại.
- Dùng route-scoped semantic landing tokens cùng shadcn wrapper chrome hiện có; global neutral tokens trong `DESIGN.md` không thay đổi. Landing giữ một fixed branded composition dưới cả global light và dark theme.
- Palette anchor của landing là navy `#03141D`, navy surface `#08232E`, mint `#12D6B1`, off-white `#EAFDF8`, muted `#A6C4BF` và boundary `#3C6A70`. Có thể dẫn xuất shade cùng hue family để đạt hierarchy và WCAG AA.
- Header, Hero, Final CTA và Footer dùng dark surface family. Product Story, Analysis Flow và Provider Integrations dùng off-white surface family. Logo variant chọn theo surface, không theo global `.dark` class.
- Dùng một accent có kiểm soát cho primary CTA và tín hiệu nghiệp vụ thật.
- Hero dùng một interactive market-context figure có nhãn localized, static dual-view fallback và route-local WebGL enhancement; Analysis Flow chỉ dùng đường nối thứ tự tĩnh decorative khi cần, theo composition đã chốt trong Locked Section Copy. Connector/grid/node geometry phải nhẹ, không lặp trong chapter/card; conceptual labels và summary phải có nghĩa độc lập với motion.
- Hero dùng trường glyph `O/H/L/C/V` route-local làm texture thứ cấp phía sau nội dung và figure. Chiều sâu đến từ scale, opacity, navy/mint gradient và mask; lớp này tĩnh, không tương tác, ẩn khỏi accessibility tree và không cạnh tranh với headline hoặc figure.
- Product capture là visual chính; icon chỉ hỗ trợ scan và dùng Lucide, không dùng emoji.
- Section rhythm dùng chapter Graph với copy trái và ảnh phải ở desktop, sau đó các chapter copy/media theo Feature-specific composition; giữ copy trước media ở mobile. Không copy giá trị màu hoặc tài sản của Graphify; không đổi geometry, font hoặc motion Hero chỉ để giống reference.
- Không dùng bento wall, testimonial carousel, logo cloud, glassmorphism, purple gradient hoặc AI decoration không có product meaning.
- Không thêm GSAP hoặc chart engine. Hero figure được phép dùng route-local `three@0.180.0` để tái hiện visual core đã duyệt; renderer phải dynamic-load, capped-pixel-ratio, dừng khi idle/paused/hidden/offscreen, dispose đầy đủ và tôn trọng reduced motion. Scheduled Telegram showcase được phép dùng route-local `motion` qua progressive client boundary; các transition UI khác dùng `150–250ms` cho hover/focus/disclosure.

## Responsive Behavior

| Viewport       | Quy tắc                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `< 640px`      | Một cột; copy trước visual; CTA full-width khi cần; header giữ brand + primary CTA + menu, locale và secondary action nằm trong native disclosure; touch target ưu tiên tối thiểu 44×44px. |
| `640px–767px`  | Một cột; copy trước visual; mobile navigation dùng native disclosure; locale có thể hiển thị khi đủ chỗ; touch target ưu tiên tối thiểu 44×44px.                                           |
| `768px–1199px` | Hero và product chapters vẫn một cột để product capture có đủ chiều rộng; AnalysisFlow ba bước xếp dọc; showcase selector đứng trước shared stage.                                         |
| `≥ 1200px`     | Hero có thể dùng split `5/7`; Graph và Chart có copy trái/ảnh phải; AI/Telegram chapter text-only; AnalysisFlow cùng hàng; showcase selector trái, shared stage phải.                    |
| Zoom `200%`    | Reflow như narrow viewport; không page-level horizontal overflow; sticky/fixed surface không che focus hoặc heading.                                                                       |

- Không đặt essential popup/content bằng absolute positioning trên screenshot mock.
- Media giữ aspect ratio, intrinsic dimensions và không làm thay đổi layout khi tải.
- Chapter order trong DOM luôn là heading/copy trước media, kể cả khi desktop đảo vị trí bằng CSS.

## Accessibility Requirements

- Mục tiêu WCAG 2.2 AA.
- Có skip link tới `<main>` khi header navigation lặp lại trên mọi locale.
- Mỗi route có đúng một `<h1>`; heading hierarchy không bỏ cấp.
- Header dùng `<nav>` có accessible label; mobile disclosure dùng native semantics và hoạt động bằng keyboard.
- Focus-visible luôn rõ, không bị border/background của product frame che mất.
- Link/button có accessible name trùng hoặc làm rõ visible label; icon decorative dùng `aria-hidden`.
- Target tối thiểu 24×24 CSS px và ưu tiên 44×44px trên mobile/coarse pointer.
- Không dùng color làm tín hiệu duy nhất cho direction, confidence, status hoặc graph relation.
- Interactive figure có nhãn phải có `<figure>`/caption hoặc text summary localized; stage là focusable labelled group, không dùng `role="application"`; canvas, connector và node geometry decorative dùng `aria-hidden`. Enter/Space đổi mode, arrow keys xoay, pointer fine có hover preview/click pin, touch phân biệt tap và drag, và Pause/Resume là native button.
- Meaningful image có localized `alt`; decorative image có `alt=""`.
- Ảnh product proof là nội dung tĩnh, có alt localized và caption/annotation đi kèm; không tạo thêm interaction chỉ để phóng to ảnh.
- Alt text mô tả insight của capture, không liệt kê mọi chữ trong screenshot.
- Nội dung và hành động không phụ thuộc hover; screenshot không chứa control trông tương tác được nếu nó chỉ là ảnh.
- Tôn trọng `prefers-reduced-motion`; trang vẫn đầy đủ ý nghĩa khi tắt toàn bộ motion. Reduced-motion bắt đầu không auto-rotate, đổi mode tức thời và chỉ opt-in rotation trong mount hiện tại.
- Contrast tối thiểu `4.5:1` cho normal text và `3:1` cho large text, focus indicator và component boundary quan trọng khi landing hiển thị dưới cả global light và dark theme.
- Trang sử dụng được hoàn toàn bằng keyboard và ở zoom `200%`.

## Localization And Copy Rules

- Mọi user-facing copy, alt text, metadata và accessible label lấy từ dictionary tiếng Việt/tiếng Anh.
- Tiếng Việt là bản biên tập tự nhiên, không phải bản dịch word-for-word từ tiếng Anh.
- Internal anchor IDs giữ ổn định bằng tiếng Anh giữa hai locale.
- Không hardcode `/vi` hoặc `/en`; dùng locale routing helpers.
- Không dùng `event`, `reaction`, `evidence`, `narrative`, `watchlist`, `reasoning` liên tục trong copy tiếng Việt khi canonical Vietnamese term đã được định nghĩa ở trên.
- Tên riêng và canonical feature name có thể giữ tiếng Anh ở lần xuất hiện đầu tiên, sau đó dùng cách gọi tiếng Việt nhất quán.

### Locale switch contract

- Locale control hiển thị link `Tiếng Việt` và `English` trong một group có localized accessible label.
- Mỗi link có `lang`, `hreflang`; locale hiện tại có state nhìn thấy được và `aria-current="page"`.
- Khi đổi locale, chỉ thay segment locale của pathname; giữ query string và hash hợp lệ trong `#top`, `#product`, `#knowledge-graph`, `#live-charts`, `#ai-assistant`, `#telegram`, `#how-it-works`, `#trust`, `#access`; bỏ hash không được hỗ trợ. `#workspace-ai` rời supported set cùng section cũ; không thêm anchor compatibility ẩn.
- Locale segment trong URL là source of truth; locale switch không đọc hoặc ghi `signapse_locale` cookie.
- Destination được tạo bằng locale routing helper, không hardcode `/vi` hoặc `/en`.
- Header và Footer dùng cùng behavior; locale switch không làm thay đổi CTA/auth state.

### Locked metadata

| Locale | Title                                    | Description                                                                                                                                |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `vi`   | Signapse \| Market Intelligence Platform | Signapse kết nối giá, sự kiện, phản ứng và nguồn tin liên quan để hỗ trợ phân tích thị trường bằng AI với bối cảnh có thể kiểm tra.        |
| `en`   | Signapse \| Market Intelligence Platform | Signapse connects price, events, market reactions, and related sources to support AI-assisted market analysis with context you can verify. |

- Metadata dùng Next.js Metadata API và dictionary hiện hành.
- Khai báo canonical locale URL và language alternates cho `/vi` và `/en`.
- Root `/` giữ locale negotiation hiện hành và fallback `/vi`; metadata alternates dùng root `/` làm `x-default`, còn `/vi` và `/en` self-canonical và alternate cho nhau.
- Sau cutover, `www.signapse.cloud` redirect vĩnh viễn về cùng path và query trên canonical apex `signapse.cloud`.
- Trước apex cutover, landing tại `https://dev.signapse.cloud/{lang}` vẫn public để test anonymous, tự canonical theo origin `dev.signapse.cloud`, nhưng phải khai báo `noindex` và không được claim canonical apex. Sau release approval và cutover, canonical chuyển sang `https://signapse.cloud/{lang}` và landing tại apex mới trở thành indexable.
- Bản phát hành đầu phải có hai Open Graph social card brand-only cho `vi` và `en`, dùng cùng layout, approved logo/brand asset và đúng localized metadata title trong bảng trên; không thêm body copy. Hai card nằm trong cùng landing change, không dùng product screenshot, product mock hoặc claim bổ sung.

## Performance And Technical Boundaries

- Landing tại `/{lang}` phải thực sự public và không render protected dashboard shell.
- `/{lang}/dashboard` và các app route khác vẫn protected.
- Public origin và indexability lấy từ server-side deployment configuration explicit. Deployment non-indexable có origin thiếu hoặc không hợp lệ vẫn render với `noindex` nhưng bỏ canonical/language alternates và không suy luận từ hostname. Deployment indexable phải fail fast nếu origin không đúng chính xác `https://signapse.cloud`.
- Giữ landing là Server Component mặc định; chỉ thêm client boundary khi native HTML/CSS không đáp ứng interaction bắt buộc.
- Trường glyph nền Hero render bằng SVG inline trong Server Component và CSS route-local; không fetch dữ liệu, random runtime, animation loop hoặc dependency mới.
- Hero entrance và conceptual-flow emphasis dùng route-local CSS opacity/transform one-shot; Hero figure là ngoại lệ hẹp được phép dynamic-load `three@0.180.0` cho visual core đã duyệt, không thêm GSAP/chart engine/scroll observer. Reduced-motion render ngay trạng thái cuối.
- Giữ implementation route-local: `page.tsx` sở hữu metadata/dictionary/auth orchestration; một Server Component sở hữu các named landing sections; Context figure là client island riêng cho WebGL/interaction; locale switch vẫn là client island nhỏ đọc hash/query; một pure access model sở hữu CTA state/destination. Không tạo shared landing framework hoặc tách mỗi section thành một shallow file.
- Ưu tiên native disclosure cho mobile navigation; không thêm dependency mới.
- Reuse `Logo`, `Button`, locale routing helpers và shadcn wrappers hiện có.
- Product capture chỉ là inline media surface với fallback lỗi localized; không thêm dialog, lightbox hoặc client boundary riêng chỉ để phóng to ảnh.
- Không thêm shared UI abstraction chỉ phục vụ landing.
- Product images dùng `next/image`, intrinsic dimensions và responsive `sizes`.
- Hero image được ưu tiên tải chỉ khi asset đã approved; below-fold images lazy-load.
- Mục tiêu CLS `< 0.1`; không thêm third-party script hoặc external font cho landing.
- Khi rebuild, xóa toàn bộ unused landing mock helpers, copy keys và old section code; không giữ compatibility component không còn caller.

## Acceptance Criteria

### Product and content

- First viewport hiển thị audience outcome, AI-assisted promise, CTA và trust boundary trong một lượt scan.
- Đúng bốn product chapters theo thứ tự Đồ thị Tri thức, Biểu đồ trực tiếp, Trợ lý AI và Telegram; mỗi chapter có outcome và body của locale tương ứng.
- AI và Telegram là tính năng chính; workspace/history và reaction/evidence là nội dung hỗ trợ tại AI/Chart. Không còn WorkspaceAssistant hoặc Reaction & Evidence chapter riêng.
- Thứ tự section là Hero → ProductStory → AnalysisFlow → ProviderIntegrations → FinalAccessCta, với Header/Footer bao quanh. Hero giữ hai proof point; AnalysisFlow giữ đúng ba bước và các description đã duyệt.
- Telegram mô tả liên kết điểm nhận, chọn nội dung nhận và thiết lập lịch phân tích theo tài sản; dùng “bản phân tích từ Signapse”, không claim kênh chung hoặc độc quyền thương mại.
- Header, từng section, chapter, provider integration và final CTA dùng Locked Section Copy cho đúng locale.
- Mọi copy, metadata, caption và alt text qua claim-matrix review.
- Không còn claim về workspace graph slice, Theme node, watchlist evidence boundary hoặc Market Query evidence sheet.

### Routing and CTA

- Người chưa đăng nhập mở được `/vi` và `/en` mà không bị chuyển tới sign-in.
- Dashboard shell không xuất hiện trên landing.
- Request-access CTA dùng đúng locked `mailto:` destination và có email fallback hiển thị ở footer.
- Cutover-only: mailbox request-access phải được owner xác nhận provision, nhận external mail và có người theo dõi trước apex release; đây không phải merge/archive acceptance của landing implementation change.
- Sign-in và dashboard destinations giữ locale.
- Anonymous và authenticated CTA states đúng với CTA matrix.
- Hero secondary của cả hai trạng thái là “Xem cách Signapse phân tích” / “See how Signapse analyzes markets” tới `#how-it-works`; navigation “Tổng quan” / “Overview” trong nhóm Sản phẩm tới `#product`. Các chapter anchor và supported hashes được giữ qua đổi locale.
- Locale switch giữ query và supported hash, đánh dấu current locale đúng semantics và không đổi auth state.

### Media

- Chỉ approved brand asset, approved product capture hoặc Scheduled Telegram DOM simulation có nhãn `Demo` xuất hiện trên trang.
- Nếu chưa có approved hero capture, hero render text-first với conceptual figure, không có synthetic mock.
- Product capture đáp ứng toàn bộ capture approval checklist.
- Chỉ Graph View và live chart có ảnh sản phẩm. Ghi rõ nguồn, locale và trạng thái duyệt của hai slot này; AI Assistant và Telegram là text-only theo thiết kế.
- Capture có visible UI text dùng đúng asset `vi`/`en`; thiếu một locale thì locale đó dùng text-first, không fallback chéo ngôn ngữ.
- Không có fake metric, private/runtime-sensitive data hoặc unlabeled synthetic product UI. Telegram controls chỉ thay đổi fixture công khai trong demo và không tạo external effect.
- Có hồ sơ nguồn/demo approval và duyệt ảnh cuối cho Graph/Chart theo locale. Thiếu ảnh ở hai feature này thì bỏ media surface, không giữ text placeholder.

### Layout and accessibility

- Kiểm tra ở `375`, `768`, `1024` và `1440px`, light/dark và zoom `200%`.
- Không có page-level horizontal overflow.
- Tab order, focus, skip link, nav disclosure và CTA đều dùng được bằng keyboard.
- Reduced-motion mode không mất nội dung hoặc interaction.
- Conceptual figure có accessible text summary; decorative geometry không xuất hiện trong accessibility tree.
- Trường glyph OHLCV xuất hiện đúng một lần trong Hero, nằm sau content/figure, không thêm accessible name, control hoặc tab stop và không tạo page-level overflow.
- Screenshot alt text và adjacent copy truyền đạt cùng insight chính.
- Graph và Chart chapter có copy trái, ảnh phải ở desktop; AI/Telegram chapter text-only. Showcase giữ selector trái/stage phải ở desktop và selector trước stage trên mobile/zoom; nhãn feature không cạnh tranh với outcome heading.
- Ảnh approved hiển thị đúng locale, không méo/crop sai; caption/annotation luôn đọc được ngoài ảnh và lỗi ảnh không làm mất nội dung chapter.

### Verification

- OpenSpec được tách thành hai change: change đầu rebuild landing trên application host ở trạng thái public `noindex`; change sau mới thực hiện apex cutover, retire/supersede coming-soon contract và bật indexability.
- OpenSpec change dùng `MODIFIED`/`REMOVED` để thay requirement cũ, không chồng thêm “V2” requirements.
- Chạy targeted OpenSpec validation, lint, typecheck và production build.
- Static search xác nhận old landing keys, old mock components và forbidden claims đã được loại bỏ.
- Kiểm tra metadata, canonical/alternate locale URLs và mọi CTA/link destination.
- Với thay đổi bốn tính năng: kiểm tra thứ tự section/chapter, copy VI/EN, ba bước AnalysisFlow, CTA và feature-anchor/locale behavior; kiểm tra Graph/Chart asset path, dimensions, locale và accessibility text. AI/Telegram chapter không có media surface; showcase kiểm tra riêng ba static proofs và một labeled Scheduled Telegram demo.
- Với đợt cải thiện bố cục/media: automated checks từ repo kiểm tra heading hierarchy, text-first fallback cho Graph/Chart, bố cục chapter, thứ tự mobile, đúng ảnh/locale và trạng thái lỗi inline. Owner approval của Graph/Chart vẫn được ghi rõ riêng.
- Apex cutover chỉ được duyệt sau khi automated gates pass và owner xác nhận Clerk thật, mailbox, visual/accessibility VI/EN light/dark/breakpoints, canonical/alternates và hai social card trên preview. Các owner/manual checks này là cutover gates, không phải archive-blocking checkbox của landing implementation change.

## Deferred Until Explicitly Approved

- Request-access form hoặc CRM integration.
- Pricing, free trial hoặc self-service signup.
- Customer logos, testimonials, ratings, case studies hoặc product metrics.
- Integration ngoài Telegram; kênh Telegram công khai mặc định hoặc onboarding mới.
- Interactive demo cho Knowledge Graph, Market Chart hoặc AI Conversation; video hoặc autoplay media ngoài bounded Scheduled Telegram sequence.
- Client-side scroll animation framework ngoài route-local Motion boundary của Scheduled Telegram showcase.
- Team collaboration hoặc shared-workspace positioning.
- Dedicated social artwork ngoài approved brand assets.

## Source References

- `docs/design/DESIGN.md`
- `docs/APIMAPPING.md`
- `openspec/specs/public-landing-page/spec.md` — migration input có known drift; không dùng làm claim evidence cho tới khi được sync
- `openspec/specs/workspace-watchlist-management/spec.md`
- `openspec/specs/market-chart-candle-workbench/spec.md`
- `openspec/specs/market-chart-live-sse-stream/spec.md`
- `openspec/specs/market-chart-economic-calendar-events/spec.md`
- `openspec/specs/event-read-and-enrichment/spec.md` — migration input có field naming drift; claim evidence dùng runtime và `docs/APIMAPPING.md` cho tới khi được sync
- `openspec/specs/event-market-reactions-ui/spec.md`
- `openspec/specs/market-chart-annotation-popup-surface/spec.md` — migration input có requirement nội bộ mâu thuẫn; runtime và `docs/APIMAPPING.md` quyết định concise-preview contract
- `openspec/specs/graph-view-backend-contract/spec.md`
- `openspec/specs/ai-assistant-market-conversations/spec.md`
- `openspec/specs/telegram-configuration-ui/spec.md`
- `docs/design/landing-product-captures.md`
