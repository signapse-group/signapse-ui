# Landing Implementation Research

> Trạng thái: nghiên cứu chuẩn bị proposal, chưa triển khai application code
>
> Ngày kiểm chứng: 2026-08-23
>
> Phạm vi: public landing tại `/vi` và `/en`
>
> Decision update: phiên grilling sau research đã chốt topology và implementation boundaries trong `docs/adr/0005-stage-public-landing-before-apex-cutover.md` và `docs/design/LANDING.md`. Các mô tả “chưa chốt” dưới đây đã được cập nhật theo quyết định đó; phần so sánh plan nói về phiên bản pre-deprecation còn trong Git history.
>
> Showcase update 2026-09-15: canonical design now permits one explicitly labeled Scheduled Telegram DOM simulation inside the four-feature showcase. The historical text-first findings below still govern unapproved captures and every other synthetic product-like surface.

## Kết luận điều hành

Landing đã đủ rõ về product story để chuyển sang OpenSpec proposal, nhưng chưa nên đi thẳng vào implementation.

Nguồn chuẩn hiện tại là `docs/design/LANDING.md`, không phải `docs/design/plan-landing.md`, landing runtime hiện có hay `openspec/specs/public-landing-page/spec.md`. Chính `LANDING.md` xác lập authority này và nói rõ spec landing hiện hành là known drift cần được thay bằng `MODIFIED`/`REMOVED` trước implementation (`docs/design/LANDING.md:7-20`).

Hướng implementation an toàn nhất là:

```text
request /vi hoặc /en
        |
        v
proxy vẫn chạy để cấp locale + Clerk context
        |
        +-- locale root: không auth.protect()
        |
        +-- dashboard/API/app routes: giữ protected
        |
        v
Server Component landing
        |
        +-- dictionary theo params.lang
        +-- auth() chỉ để chọn CTA anonymous/authenticated
        +-- text-first editorial sections
        +-- một client island nhỏ cho locale switch giữ hash/query
```

Không có product capture nào dưới `public/images/landing/`; runtime hiện chỉ có các brand asset đã được duyệt. Vì vậy lần implement đầu phải là text-first, không dựng mock hoặc placeholder để lấp media slot. Đây là behavior đã được canonical doc cho phép, không phải blocker (`docs/design/LANDING.md:310-351`).

Bốn điều chi phối implementation và release:

1. Tạo OpenSpec change thay contract landing cũ; hiện `openspec list --json` không có change landing đang hoạt động.
2. Sửa public-route contract vì production Clerk mode vẫn protect `/vi` và `/en` (`proxy.ts:53-77`).
3. Topology đã chốt thành hai OpenSpec change: landing được test public `noindex` tại `dev.signapse.cloud`; change cutover riêng mới thay coming-soon tại `signapse.cloud`, bật indexability và giữ immutable rollback deployment trong bảy ngày (`docs/adr/0005-stage-public-landing-before-apex-cutover.md`).
4. Signapse Product Owner phải xác nhận mailbox `access@signapse.cloud` đã provision, nhận mail ngoài và có owner theo dõi trước apex cutover; gate này không chặn merge/archive landing implementation (`docs/design/LANDING.md:285-293`).

## 1. Authority: plan cũ và source of truth

### Thứ tự tin cậy nên dùng

1. Runtime frontend là bằng chứng cao nhất rằng một public claim có surface người dùng thật.
2. OpenSpec capability specs và `docs/APIMAPPING.md` mô tả contract, nhưng phải đối chiếu source khi chúng mâu thuẫn.
3. `docs/design/LANDING.md` khóa positioning, copy, CTA, composition, claim boundary và media policy.
4. `docs/design/DESIGN.md` vẫn sở hữu semantic tokens, Geist, shadcn chrome, theme parity và accessibility; landing chỉ override các rule dashboard-scoped được liệt kê rõ (`docs/design/LANDING.md:7-18`, `docs/design/DESIGN.md:1-5`).
5. `docs/design/plan-landing.md` là discovery input lịch sử, không phải implementation contract.

### Những điểm trong plan đã bị canonical doc thay thế

| Chủ đề                   | Plan cũ                                                                                                      | Source of truth hiện tại                                                                                                                               | Hệ quả implementation                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Information architecture | Có `ContextGap` riêng giữa Hero và Analysis Flow.                                                            | Không tạo section lặp problem statement; Hero + Analysis Flow sở hữu vấn đề (`docs/design/LANDING.md:353-374`).                                        | Không implement `ContextGap`.                                |
| Hero/media fallback      | Cho phép illustration bám runtime và gắn nhãn “Minh họa”.                                                    | Cấm synthetic dashboard/generated screenshot và unlabeled mock; chỉ Scheduled Telegram có bounded DOM-demo exception (`docs/design/LANDING.md`).      | Giữ text-first/capture policy; cô lập demo có nhãn rõ.       |
| CTA narrative            | Plan nói tài liệu cần giải thích người dùng gửi gì và nhận phản hồi thế nào.                                 | CTA đã khóa thành `mailto:` + subject, microcopy “mở ứng dụng email”, không được tự thêm form/confirmation (`docs/design/LANDING.md:261-293`).         | Không tự sáng tác SLA, response promise hoặc form.           |
| Product chapters         | Plan mô tả ba capability đúng hướng nhưng còn gọi `hot event`/`warm period` và “graph thật” ở mức discovery. | Copy, qualifier và terminology đã khóa chi tiết trong claim matrix + section copy (`docs/design/LANDING.md:95-135`, `docs/design/LANDING.md:173-227`). | Dictionary bắt đầu từ locked copy, không paraphrase promise. |
| Media readiness          | Plan liệt kê bốn capture cần chuẩn bị.                                                                       | Mỗi locale có approval riêng; thiếu asset locale nào thì locale đó text-first, không fallback chéo (`docs/design/LANDING.md:310-339`).                 | Media là workstream độc lập, không chặn text-first landing.  |
| Component map            | Plan có mười block.                                                                                          | Canonical IA có tám section/component roles (`docs/design/LANDING.md:353-364`).                                                                        | Dùng tám role canonical làm acceptance map.                  |

Các path kiểu `D:/Development/...` và câu “working tree vẫn sạch” trong bản plan pre-deprecation chỉ phản ánh thời điểm discovery cũ; chúng không phải bằng chứng cho working tree hoặc source hiện tại.

## 2. Current-state audit

### Route và auth

- Landing đã ở đúng route ngoài `(main)` và do đó không render dashboard shell (`app/[lang]/page.tsx:54-90`).
- Tuy nhiên public behavior chưa tồn tại trong production Clerk mode: `isPublicRoute` chỉ chứa sign-in, còn mọi path khác đều chạy `auth.protect()` (`proxy.ts:53-77`). Requirement locale root public đã có trong OpenSpec (`openspec/specs/nextjs-locale-routing/spec.md:99-109`), nên đây là runtime/spec mismatch.
- Fixture mode bỏ qua Clerk protection và dev-auth mode cũng bỏ `auth.protect()` (`proxy.ts:49-50`, `proxy.ts:66-67`). Đồng thời page coi dev-auth mode là authenticated (`app/[lang]/page.tsx:61-64`). Vì vậy chỉ mở landing trong fixture/dev-auth không chứng minh anonymous production path hoạt động.
- `auth()` trong Server Component là seam phù hợp để render CTA theo session; Clerk yêu cầu `clerkMiddleware()`/proxy vẫn phải match route ngay cả khi route đó public. Official Clerk docs xác nhận `auth()` chỉ chạy server-side và cần Clerk middleware được cấu hình: [Clerk `auth()` reference](https://clerk.com/docs/reference/nextjs/app-router/auth).
- Official Clerk docs hiện đánh dấu `createRouteMatcher()` là deprecated và khuyên dùng native path matching cho non-auth path logic: [Clerk middleware reference](https://clerk.com/docs/reference/nextjs/clerk-middleware). Landing change không nên mở rộng thành migration toàn bộ auth architecture, nhưng nên tránh thêm public roots vào một abstraction đã deprecated.

Khuyến nghị seam: thay `createRouteMatcher` hiện tại bằng một predicate pathname nhỏ, explicit cho đúng `/vi`, `/en` và hai sign-in subtree; giữ default-deny cho dashboard, protected routes và API. Resource-level authorization migration rộng hơn là change bảo mật riêng, không thuộc landing.

### Page, copy và composition hiện tại

- Page vẫn render chuỗi cũ `Hero -> Problem -> Pillars -> Pipeline -> Personalization -> Trust -> CTA` (`app/[lang]/page.tsx:66-88`).
- Hero chứa mock hardcode với asset names, fake chart heights, `82%`, evidence count `8`, Market Query và Theme node (`app/[lang]/page.tsx:276-398`, `app/[lang]/page.tsx:402-432`). Đây chính là treatment canonical policy cấm (`docs/design/LANDING.md:341-351`).
- Dictionary VI/EN vẫn chứa claim cũ về watchlist làm evidence boundary, workspace graph slice, Theme node, scoped Market Query và team (`app/lib/i18n/dictionaries/vi.ts:554-687`, `app/lib/i18n/dictionaries/en.ts:553-683`). Toàn bộ branch `landing` cần được thay theo schema mới rồi static-search xóa key/claim cũ; không giữ compatibility keys không còn caller (`docs/design/LANDING.md:457-468`).
- Header hiện không có locale switch, mobile disclosure thật, nav accessible label hoặc skip link; footer không tồn tại (`app/[lang]/page.tsx:92-166`, `app/[lang]/page.tsx:712-755`).
- Metadata hiện chỉ có title/description cũ, chưa có canonical, alternates hay approved OG image (`app/[lang]/page.tsx:37-52`).

### Media và shared runtime

- Approved brand assets tồn tại đúng các path canonical trong policy (`docs/design/LANDING.md:294-308`).
- Không có `public/images/landing/{vi,en}/...`; do đó media state hiện tại là “text-first required”, không phải “capture pending placeholder”.
- Shared `Logo` dùng hai theme-specific SVG nhưng hardcode `alt="Signapse Logo"` và đặt `priority` trên cả hai (`components/logo.tsx:10-28`). Trong header/footer có visible brand text, logo nên được ẩn khỏi accessible name để tránh lặp. Next.js 16 cũng đã deprecate `priority` thành `preload`, đồng thời cảnh báo không preload cả hai ảnh theme: [Next.js Image reference](https://nextjs.org/docs/app/api-reference/components/image).
- Không cần biến landing thành lý do sửa rộng mọi Logo consumer. Một narrow shared prop hoặc wrapper `aria-hidden` có thể xử lý accessible-name duplication; nếu đụng `Logo`, cần test sidebar và AI assistant là hai consumer còn lại (`components/app-sidebar.tsx:110-132`, `components/market-conversation-assistant/market-conversation-assistant.tsx:866`).

## 3. Claim matrix validation

| Surface                              | Kết luận                                                                                                                                                            | Primary evidence                                                                                                                                                                                                                                                                                             | Boundary phải giữ khi viết/capture                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active workspace + tracked assets    | **Đã kiểm chứng.** Runtime/domain chỉ có một tracked-asset list cho active workspace; không có named/grouped watchlists.                                            | `openspec/specs/workspace-watchlist-management/spec.md:4-16`, `openspec/specs/workspace-watchlist-management/spec.md:120-129`; API đã tích hợp GET/bulk add/delete (`docs/APIMAPPING.md:493-500`).                                                                                                           | Không nói shared/team workspace, watchlist groups hoặc AI evidence boundary.                                                                                      |
| Chart asset selection                | **Đã kiểm chứng.** Chart lấy selector từ watchlist và resolve bằng `assetId`.                                                                                       | `openspec/specs/market-chart-candle-workbench/spec.md:21-55`; runtime load watchlist rồi pass vào workbench (`app/[lang]/(main)/market-charts/page.tsx:46-64`).                                                                                                                                              | Không nói arbitrary symbol charting.                                                                                                                              |
| Historical candles                   | **Đã kiểm chứng.** Candle response, empty/error distinction và no synthetic fallback đều có contract.                                                               | `openspec/specs/market-chart-candle-workbench/spec.md:57-99`, `openspec/specs/market-chart-candle-workbench/spec.md:124-152`; API ledger (`docs/APIMAPPING.md:202-205`, `docs/APIMAPPING.md:223-243`).                                                                                                       | “Historical candles” là chắc chắn về surface, không phải cam kết provider luôn có data.                                                                           |
| Event annotation + economic calendar | **Đã kiểm chứng.** Hai layer được fetch/render riêng cho displayed candle interval.                                                                                 | `docs/APIMAPPING.md:203-205`, `docs/APIMAPPING.md:225-241`; calendar spec (`openspec/specs/market-chart-economic-calendar-events/spec.md:87-125`).                                                                                                                                                           | Luôn dùng qualifier “khi dữ liệu khả dụng”; không biến temporal proximity thành causation.                                                                        |
| Live quote/partial candle            | **Đã kiểm chứng.** SSE có snapshot/price/candle/status/error; UI model có `DISCONNECTED`, `STALE`, `MARKET_CLOSED`.                                                 | `openspec/specs/market-chart-live-sse-stream/spec.md:6-52`; `app/lib/market-charts/definitions.ts:210-219`; `docs/APIMAPPING.md:205`, `docs/APIMAPPING.md:228-230`.                                                                                                                                          | Chỉ dùng “live” cho chart data và giữ failure/stale/closed qualifier. Không nói realtime intelligence toàn hệ thống.                                              |
| Hot annotation preview               | **Đã kiểm chứng theo runtime.** Popup hiển thị event time, title/summary, primary predicted direction và optional evaluated outcome; title mở event quick detail.   | `app/[lang]/(main)/market-charts/market-chart-workbench.tsx:1962-2067`, `app/[lang]/(main)/market-charts/market-chart-workbench.tsx:2215-2348`.                                                                                                                                                              | Đây là concise preview; không claim reasoning/evidence reader trong popup. `observedAt` không phải outcome.                                                       |
| Event detail reaction + evidence     | **Đã kiểm chứng.** Detail render evidence trước reactions; evidence có article/source/link, reaction có asset/direction/horizon/confidence/reasoning/recorded time. | `app/[lang]/(main)/events/[id]/page.tsx:356-509`, `app/[lang]/(main)/events/[id]/page.tsx:511-575`; DTO (`app/lib/events/definitions.ts:72-100`); API ledger (`docs/APIMAPPING.md:187-196`).                                                                                                                 | Evidence/reaction optional. Event detail không có evaluated return/outcome.                                                                                       |
| Connected Market Graph               | **Đã kiểm chứng.** Node kinds đúng bốn loại; edge kinds đúng bốn relation; theme chỉ là metadata.                                                                   | `app/lib/graph-view/definitions.ts:5-35`, `app/lib/graph-view/definitions.ts:67-128`; graph route fetch không nhận workspace/watchlist filter (`app/[lang]/(main)/graph-view/page.tsx:51-54`); API ledger (`docs/APIMAPPING.md:288-301`).                                                                    | Không claim Theme/warm-episode node, workspace slice hoặc narrative detail route.                                                                                 |
| AI Assistant conversation            | **Đã kiểm chứng.** Conversation/history persisted theo active workspace, follow-up action trả cả turn đồng bộ, UI text-only.                                        | `openspec/specs/ai-assistant-market-conversations/spec.md:6-23`, `openspec/specs/ai-assistant-market-conversations/spec.md:44-99`; runtime submission awaits one response (`components/market-conversation-assistant/market-conversation-assistant.tsx:441-535`); API ledger (`docs/APIMAPPING.md:249-282`). | Không claim token streaming, evidence sheet, attachment, analysis workbench hoặc usable Telegram delivery. Character reveal sau response không phải token stream. |
| Narratives                           | **An toàn khi chỉ nói trong Graph chapter.** Narrative node/edges có runtime; chưa có narrative list/detail route.                                                  | `docs/APIMAPPING.md:284-320`; `app/lib/graph-view/definitions.ts:5-11`.                                                                                                                                                                                                                                      | Không quảng bá dedicated narrative workspace/management. Dashboard có summary module, nhưng locked landing story không cần mở rộng sang đó.                       |
| Trading outcome/prediction           | **Phải cấm.** Runtime có optional evaluated outcome cho annotation, nhưng đó không chứng minh forecast performance hoặc trading advice.                             | Outcome DTO (`docs/APIMAPPING.md:235-236`); landing global claim rules (`docs/design/LANDING.md:128-135`).                                                                                                                                                                                                   | Không nói win rate, accuracy, P&L, signal, entry/stop/target, auto execution hoặc guaranteed cause.                                                               |

### Hai drift không được để claim review bỏ qua

1. `market-chart-annotation-popup-surface` tự mâu thuẫn: concise-preview requirement cấm reasoning/evidence/detail blocks (`openspec/specs/market-chart-annotation-popup-surface/spec.md:32-59`) nhưng requirement sau lại nói popup render confidence/evidence/detail-link data (`openspec/specs/market-chart-annotation-popup-surface/spec.md:138-148`). Runtime hiện khớp concise preview, nên claim matrix trong `LANDING.md` là đúng. Landing proposal không cần sửa capability spec này, nhưng capture/copy review phải dùng runtime, không trích dòng 144 riêng lẻ.
2. `docs/APIMAPPING.md` có summary stale: dòng 41/574 nói dashboard chưa parse/render `marketNarratives`, trong khi source đã parse và render (`app/lib/dashboard/definitions.ts:151-173`, `app/[lang]/(main)/dashboard/page.tsx:254-272`). Dòng 49 nói còn route `market-query`, nhưng section canonical nói route đó đã bị gỡ (`docs/APIMAPPING.md:249-282`). Các drift này không làm invalid ba landing chapters, nhưng cho thấy APIMAPPING không thể được dùng mà không đối chiếu runtime.

## 4. OpenSpec work cần có trước implementation

`openspec list --json` tại thời điểm nghiên cứu chỉ có hai change hoàn tất (`fix-fullscreen-overlay-portals`, `simplify-quick-detail-header`); không có active landing change.

### Contract cũ cần thay

Current `public-landing-page` spec vẫn yêu cầu:

- Chart Annotation + Market Query + Knowledge Graph là ba primary pillars (`openspec/specs/public-landing-page/spec.md:6-12`).
- Hero phải có synthetic workspace mock (`openspec/specs/public-landing-page/spec.md:14-20`).
- Data pipeline và workspace personalization (`openspec/specs/public-landing-page/spec.md:22-31`).
- Anonymous secondary CTA là Sign in một cách tổng quát (`openspec/specs/public-landing-page/spec.md:67-78`), trong khi canonical CTA matrix khóa Hero secondary thành `#how-it-works` và giữ Sign in ở Header/Footer (`docs/design/LANDING.md:274-283`).
- Khi chưa có screenshot thì vẫn render illustrative preview (`openspec/specs/public-landing-page/spec.md:90-99`), trái media policy text-first.

Landing proposal phải dùng `MODIFIED`/`REMOVED`, không thêm một lớp “V3” bên cạnh những requirement này (`docs/design/LANDING.md:507-512`).

### Localization contract đang mâu thuẫn

`product-localization` vẫn yêu cầu cookie `signapse_locale` và selector mutation cookie (`openspec/specs/product-localization/spec.md:6-35`), trong khi `nextjs-locale-routing` yêu cầu locale prefix làm source of truth, switch bằng route và không dùng cookie (`openspec/specs/nextjs-locale-routing/spec.md:65-97`). Runtime hiện theo route locale (`app/lib/i18n/routing.ts:11-38`, `app/lib/i18n/dictionaries.ts:1-18`).

Proposal phải xử lý drift này bằng delta `product-localization` hoặc xác định rõ spec mới nào remove requirement cookie cũ. Không được implement landing locale switch theo hai contract trái nhau.

### Capability map đề xuất cho change

```text
public-landing-page
├── localized public root + no dashboard shell
├── canonical eight-section editorial story
├── three product chapters + strict claim qualifiers
├── auth-aware CTA matrix + exact destinations
├── text-first/approved-media policy
├── responsive + WCAG 2.2 AA behaviors
└── localized metadata/canonical/alternates

product-localization
├── dictionary parity for all landing visible/assistive copy
├── route-locale links, no locale cookie
└── locale switch preserves query + supported hash
```

`nextjs-locale-routing` đã có requirement locale root public đúng (`openspec/specs/nextjs-locale-routing/spec.md:99-109`); task implementation cần làm runtime tuân spec thay vì tạo requirement trùng.

## 5. Implementation seams và quyết định khuyến nghị

### File ownership

Giữ deep module route-local, không tạo shared landing system:

```text
app/[lang]/page.tsx
app/[lang]/_landing/landing-sections.tsx
app/[lang]/_landing/landing-locale-switch.tsx   # client island duy nhất nếu cần
app/lib/i18n/dictionaries/vi.ts
app/lib/i18n/dictionaries/en.ts
proxy.ts
components/logo.tsx                            # chỉ khi chọn narrow prop fix
tests/...                                      # targeted contract/browser checks
openspec/changes/rebuild-public-landing-page/...
```

Route-specific components phải ở cạnh route, Server Components là default và chỉ dùng client boundary khi browser state bắt buộc (`components/AGENTS.override.md:7-13`). Không nên tách mỗi section thành một file nhỏ; một `landing-sections.tsx` có các named sections sẽ giữ story dễ đọc mà không tạo nhiều shallow modules.

### Server/Client boundary

- `page.tsx` giữ Server Component, await `params`, validate locale, load một dictionary và gọi `auth()` để chọn CTA. Pattern async params đang đúng với Next.js 15+ (`app/[lang]/page.tsx:33-64`); official Next.js metadata API cũng hỗ trợ dynamic metadata từ route params: [Next.js `generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).
- Header mobile dùng native `<details>/<summary>` nếu đáp ứng visual; không cần state library hay shadcn overlay.
- Locale switch canonical yêu cầu link semantics, `lang`, `hreflang`, `aria-current`, giữ query và supported hash (`docs/design/LANDING.md:438-444`). Existing `LanguageSelector` là dropdown/radio, giữ query nhưng làm rơi hash (`components/language-selector.tsx:28-93`), nên không reuse nguyên trạng.
- Fragment không được gửi lên server; vì vậy một client island route-local là justified. Nếu island dùng `useSearchParams()`, phải có Suspense boundary theo Next.js guidance. Toàn bộ page không được chuyển thành Client Component.

### Navigation

- Internal dashboard/sign-in links phải locale-aware. Shared scope yêu cầu `LocalizedLink`/localized helpers và cấm hardcode `/vi`, `/en` (`components/AGENTS.override.md:22-28`).
- Anchor IDs giữ đúng `#how-it-works`, `#product`, `#workspace-ai`, `#trust`, `#access` (`docs/design/LANDING.md:261-272`, `docs/design/LANDING.md:429-444`).
- Header/hero/final CTA phải dùng cùng primary destination theo auth state; Sign in chỉ ở anonymous Header/Footer, không làm Hero secondary.
- Không cần tắt prefetch cho CTA dashboard hiện tại vì destination đó chỉ render ở authenticated state. Nếu sau này anonymous state có link trực tiếp tới một protected resource trả 4xx, Clerk khuyên tắt prefetch cho link đó: [Clerk Route Handlers note](https://clerk.com/docs/reference/nextjs/app-router/route-handlers).

### Metadata

- Dùng locked title/description cho từng locale (`docs/design/LANDING.md:446-455`).
- `alternates.canonical` phải là locale URL tương ứng; `alternates.languages` phải có cả `vi` và `en`.
- Next.js yêu cầu `metadataBase` nếu dùng URL metadata relative và sẽ build-error nếu thiếu. Official example: [Next.js metadataBase and alternates](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).
- Topology đã chốt: implementation change phục vụ landing public `noindex` tại `dev.signapse.cloud`; cutover change riêng mới chuyển canonical/indexable origin sang `signapse.cloud`, redirect `www` về apex và retire coming-soon source/spec. Explicit server-side configuration sở hữu origin/indexability; hostname inference bị cấm (`docs/adr/0005-stage-public-landing-before-apex-cutover.md`).
- Không thêm sitemap/robots/manifest vào scope chỉ vì chúng là Next metadata conventions; acceptance hiện chỉ khóa page metadata, canonical/alternate và approved OG image.

### Image/performance

- Chưa có capture duyệt: không render `<Image>` frame rỗng, aspect-ratio placeholder hoặc fake dashboard.
- Khi capture được duyệt, dùng `next/image`, intrinsic dimensions và responsive `sizes`; `width`/`height` giữ aspect ratio và tránh layout shift. Official Next.js guidance: [Image component](https://nextjs.org/docs/app/api-reference/components/image).
- Next.js 16 dùng `preload` thay `priority`. Chỉ preload approved hero image khi nó thật sự là LCP; below-fold lazy mặc định. Không preload cả light/dark variants.
- Root layout đã có Geist/Geist Mono, theme provider và dictionary provider (`app/[lang]/layout.tsx:18-31`, `app/[lang]/layout.tsx:58-85`); landing không cần font, theme hoặc provider riêng.

### Accessibility

- Thêm skip link tới một `<main id="main-content">`; hiện page dùng `<main>` nhưng chưa có target/link (`app/[lang]/page.tsx:66-88`).
- Đúng một `<h1>`, H2/H3 theo canonical hierarchy, `<nav aria-label>` cho header, focus-visible cho mọi link/control.
- Mobile disclosure dùng native semantics, dùng được bằng keyboard; không tạo menu chỉ bằng CSS `display:none` như nav hiện tại (`app/[lang]/page.tsx:112-128`).
- Target tối thiểu 24x24 CSS px và ưu tiên 44x44 trên mobile, không dùng color làm tín hiệu duy nhất, meaningful image có localized alt, decorative image `alt=""` (`docs/design/LANDING.md:412-427`, `docs/design/DESIGN.md:352-365`).
- Đảm bảo anchor heading không bị header che nếu header sticky; hiện canonical doc không yêu cầu sticky, nên không nên thêm sticky header nếu không có product reason.

### Styling

- Direction page-specific là `Evidence-Led Editorial`; token/chrome vẫn theo `DESIGN.md` (`docs/design/LANDING.md:376-397`).
- Không sửa `components/ui` chrome, global primary/accent hoặc semantic tokens vì landing. `className` trên shadcn primitives chỉ phục vụ layout; wrapper không nhận feature variant (`docs/design/DESIGN.md:84-92`).
- Một page-level grid/relationship treatment nhẹ có thể dùng chung Hero + Flow và phải decorative; không lặp ở chapters (`docs/design/LANDING.md:388-397`).

## 6. Blockers và decisions

| Mức                           | Item                                                                               | Trạng thái / khuyến nghị                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Block implementation workflow | Không có active landing OpenSpec change; current spec contradict canonical design. | Tạo proposal trước code.                                                                                                   |
| Block functional acceptance   | Production proxy protect locale roots.                                             | Đổi explicit public path predicate, giữ default-deny cho phần còn lại.                                                     |
| Resolved topology decision    | `coming-soon-site` giữ apex trong lúc landing được test tại `dev.signapse.cloud`.  | Tách landing implementation và apex cutover thành hai OpenSpec change; cutover mới retire coming-soon và bật indexability. |
| Cutover-only release gate     | Chưa có bằng chứng mailbox request-access hoạt động/được theo dõi.                 | Signapse Product Owner xác nhận trước apex cutover; không chặn merge/archive implementation change.                        |
| Resolved by policy            | Chưa có approved product capture.                                                  | Implement text-first; không blocker.                                                                                       |
| Scope decision                | Có nên migrate toàn bộ Clerk protection khỏi proxy theo docs mới?                  | Không trong landing. Chỉ dùng native matching để bỏ deprecated `createRouteMatcher`; security migration là change riêng.   |
| Scope decision                | Có nên sửa `Logo`?                                                                 | Chỉ narrow fix cho accessible duplication/image preload nếu cần; không redesign shared logo.                               |
| Documentation debt            | APIMAPPING summary và annotation spec có internal drift.                           | Không chặn landing nếu claim review dùng runtime; ghi issue/change riêng nếu muốn đồng bộ canonical docs.                  |

## 7. Verification plan

### Codex-runnable, nên là checklist archive-blocking

1. `openspec validate "rebuild-public-landing-page"` (hoặc change name đã duyệt).
2. `pnpm lint`, `pnpm typecheck`, `pnpm build`.
3. Targeted proxy/unit tests:
   - `/vi`, `/en`, `/vi/sign-in/*`, `/en/sign-in/*` public.
   - `/vi/dashboard`, `/en/dashboard`, representative `(main)` route và `/api/*` vẫn protected.
   - Locale redirect `/` và unprefixed page path vẫn giữ behavior.
   - Có thể dùng Next.js proxy testing utilities; official docs cung cấp `unstable_doesProxyMatch` và response helpers: [Next.js Proxy testing](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#unit-testing-experimental).
4. Targeted browser tests cho cả VI/EN:
   - đúng một H1, locked copy và eight-section order;
   - CTA destinations theo fixture-authenticated state;
   - locale switch giữ query + supported hash, bỏ unsupported hash;
   - skip link, nav disclosure, keyboard order và visible focus;
   - no horizontal overflow tại 375/768/1024/1440 và zoom 200%;
   - axe scan cho WCAG issues có thể tự động phát hiện.
5. Metadata assertions trên HTML build/server: localized title/description, preview `noindex` + dev canonical, apex indexable canonical/alternates, fail-closed invalid configuration, và hai localized brand-only Open Graph cards.
6. Static search xác nhận:
   - không còn old landing component/key names `ProblemSection`, `PillarsSection`, `PipelineSection`, `PersonalizationSection`, `ProductPreview`, `MiniGraph`;
   - không còn landing claim `Market Query`, workspace graph slice, Theme node, watchlist evidence boundary, team/shared workspace, fake `82%`/evidence `8`;
   - không có runtime import từ `docs/design/*` hoặc unapproved `public/images/landing/*`.

P0 fixture hiện đặt `SIGNAPSE_AUTH_MODE=disabled` (`playwright.config.ts:8-16`), nên browser lane này chỉ chứng minh signed-in CTA. Anonymous behavior cần targeted unit/integration test với Clerk mocked hoặc một Clerk-enabled test environment; không được ghi “verified” chỉ vì fixture mở được locale root.

ADR của repo cũng xác định P0 không chứng minh authorization và Clerk thật thuộc P1 (`docs/adr/0004-layered-automated-quality-gates.md:7-19`). P1 hiện chưa thực thi được: script chủ động fail với thông báo authenticated canary chưa được implement (`tests/e2e/require-p1-env.mjs:1-24`). Vì vậy anonymous/authenticated acceptance trong production Clerk cần được ghi là release-owner/P1 check cho đến khi canary tồn tại; không được tạo test-only bypass mới trong production code.

### Baseline đã chạy trong research

- `openspec validate --all --strict --no-interactive --json`: **fail baseline**, 149/151 item pass. Hai lỗi có sẵn, không liên quan landing: `dashboard-ui-prototype` thiếu scenario cho 12 requirements và `workspace-overview-narrative-preview` không có requirement. Change landing phải pass targeted strict validation; không được nhận hoặc báo cáo repo-wide `--all` là xanh nếu hai debt này chưa được xử lý.
- `pnpm typecheck`: pass.
- `pnpm lint`: pass với 0 error và 22 warning có sẵn.
- `pnpm test -- --runInBand`: pass 25 test files / 119 tests; chưa có test landing.
- `git diff --no-index --check /dev/null docs/design/LANDING_IMPLEMENTATION_RESEARCH.md`: pass (exit code `1` là expected vì đây là file mới).

Các baseline command chỉ kiểm tra trạng thái trước implementation; chúng không thay verification checklist của change.

### User-owned manual/release QA, không nên là archive-blocking checkbox

- Xác nhận mailbox, external delivery và operational owner.
- Nếu thêm capture: kiểm từng locale theo toàn bộ privacy/licensing/crop checklist (`docs/design/LANDING.md:323-339`).
- Visual review light/dark tại bốn breakpoint, zoom 200%, contrast và focus not obscured.
- Anonymous + authenticated CTA behavior trong môi trường Clerk thật.
- Xác nhận canonical production origin và social share preview.

## 8. Definition of ready cho implementation

Change có thể chuyển từ explore/proposal sang apply khi:

- Proposal đã thay contract landing cũ bằng `MODIFIED`/`REMOVED` và resolve cookie-locale conflict.
- Landing implementation và apex cutover là hai change riêng; preview origin là `dev.signapse.cloud`, indexable origin sau cutover là `signapse.cloud`.
- Text-first là media mode đã chốt cho release đầu; hai localized brand-only Open Graph cards vẫn thuộc implementation change.
- Signapse Product Owner là landing release owner; mailbox proof là cutover-only gate.
- Tasks map trực tiếp vào route/auth, dictionaries, page sections, locale switch, metadata, accessibility và tests; không thêm backend form, CRM, analytics event, testimonial, pricing hoặc product capability mới.

Nếu các điều trên được chốt, implementation không cần backend call hay schema mới. Phạm vi code chủ yếu là rewrite route-local UI/dictionaries, sửa public path predicate và bổ sung targeted verification.

## Official references

- [Next.js `generateMetadata`, `metadataBase`, canonical and language alternates](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js App Router internationalization](https://nextjs.org/docs/app/guides/internationalization)
- [Next.js Image component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Proxy and experimental unit testing](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Clerk `auth()` for App Router](https://clerk.com/docs/reference/nextjs/app-router/auth)
- [Clerk middleware and public/protected route guidance](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk note about prefetching protected links from public pages](https://clerk.com/docs/reference/nextjs/app-router/route-handlers)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
