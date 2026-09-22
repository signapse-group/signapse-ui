# Đề xuất bộ User Documentation cho Signapse

Ngày nghiên cứu: 2026-09-09. Trạng thái: đề xuất để thảo luận, chưa triển khai hoặc phát hành.

## 1. Quyết định đề xuất

**Xây một khu “Hướng dẫn” tại `/{lang}/help`, lưu nội dung Markdown trong cùng repo, triển khai cùng ứng dụng Next.js hiện tại.** Bản đầu tập trung vào người dùng phân tích thị trường và các tác vụ họ muốn hoàn thành. Dùng `react-markdown` và `remark-gfm` đã có trong dự án; chưa cần CMS, dịch vụ tìm kiếm, database hoặc một ứng dụng docs riêng.

Đây là phương án ít thành phần vận hành nhất theo hiện trạng repo, không phải khẳng định ít công viết giao diện nhất trong mọi trường hợp. Đội phát triển vẫn phải làm một layout đọc tài liệu, bộ nạp nội dung, mục lục và tìm kiếm đơn giản. Nếu người viết chủ yếu là người không dùng Git và cần tự xuất bản hằng ngày, GitBook có thể phù hợp hơn.

Đề xuất cho phép đọc công khai các hướng dẫn sản phẩm đã được duyệt, kể cả khi chưa đăng nhập, để người gặp lỗi truy cập vẫn tìm được trợ giúp. Nội dung vận hành nội bộ tiếp tục ở khu tài liệu kỹ thuật; không đưa vào tập nội dung công khai rồi chỉ ẩn bằng menu.

### Phạm vi và giả định

- Mục tiêu: giúp người mới hoàn thành tác vụ đầu tiên, người đang sử dụng tìm được câu trả lời, và đội sản phẩm cập nhật docs cùng tính năng.
- Giả định: đội nhỏ, frontend đang được phát triển thường xuyên, người viết có thể làm việc qua Markdown/PR với hỗ trợ của kỹ thuật; ưu tiên tiếng Việt, có tiếng Anh tương ứng.
- Đối tượng chính: người đọc, tìm hiểu và phân tích thông tin thị trường. Người cấu hình workspace/Telegram là đối tượng phụ, có quyền tương ứng.
- Chưa làm: tài liệu API đầy đủ, sách hướng dẫn giao dịch, docs quản trị backend, chatbot hỏi đáp docs, editor CMS, version selector, hệ thống ticket hoặc thiết kế lại dashboard.
- Hoàn thành nghiên cứu khi có: lựa chọn triển khai và trade-off, nơi lưu/đọc, sơ đồ nội dung, mẫu bài, kế hoạch xuất bản, tiêu chí kiểm tra và các quyết định còn phụ thuộc sản phẩm.

## 2. Những gì đã xác minh trong repo

| Bằng chứng | Ý nghĩa cho User Documentation |
| --- | --- |
| [CONTEXT.md](../CONTEXT.md) định nghĩa Signapse là Market Intelligence Platform | Dùng thuật ngữ hiện tại; không giới thiệu sản phẩm như công cụ dự đoán hay tự động giao dịch |
| [package.json](../package.json) có Next.js 16.1.7, `react-markdown`, `remark-gfm`, Zod | Có nền tảng để hiển thị Markdown mà không cần thêm một engine docs ngay |
| [Cấu hình locale](../app/lib/i18n/config.ts) có `vi`, `en`, mặc định `vi` | Thiết kế URL và quy trình dịch từ đầu cho hai ngôn ngữ |
| [Cấu hình điều hướng](../config/site.ts) có nhóm phân tích, dữ liệu, quản trị và lọc theo quyền | Không sao chép nguyên sidebar hiện tại thành mục lục cho người dùng cuối |
| [Layout ứng dụng](../app/[lang]/(main)/layout.tsx) tải tài khoản, workspace và quyền | Docs công khai nên nằm ngoài `(main)` để không phụ thuộc dữ liệu workspace |
| [Proxy](../proxy.ts) và [public-path](../app/lib/public-landing/public-path.ts) hiện chỉ miễn bảo vệ cho locale root và sign-in | Thêm route help chưa đủ để có docs công khai; cần bổ sung ngoại lệ đường dẫn hẹp, có kiểm tra |
| [ADR-0005](adr/0005-stage-public-landing-before-apex-cutover.md) tách triển khai landing khỏi cutover apex | Không tự coi `signapse.cloud` đã là host ứng dụng; dùng origin của môi trường hiện hành |
| Thư mục `docs/` chứa API mapping, ADR, design và research | Giữ tài liệu nội bộ tách rõ khỏi nguồn bài công khai |
| [CONTEXT.md](../CONTEXT.md) và runtime AI conversation mô tả hội thoại theo workspace | Bài AI cần giải thích workspace, lịch sử và giới hạn; không hứa tự nhận ngữ cảnh chart/node đang chọn |
| Runtime Telegram và domain glossary mô tả nhiều quyền, điểm nhận, lịch và ngôn ngữ | Cần tách việc nhận thông báo khỏi việc cấu hình hạ tầng Telegram |

CodeGraph không có công cụ callable trong phiên nghiên cứu này, nên đã dùng file nguồn, cấu hình và domain docs để khảo sát. Đây không phải kiểm tra nghiệm thu hệ thống đang chạy. Sự tồn tại của route hoặc tài liệu không chứng minh tính năng đã được bật ở production; cần đối chiếu bản phát hành trước khi xuất bản từng bài. Feedback đặc biệt có phân biệt implementation/activation trong [ADR-0009](adr/0009-separate-feedback-implementation-and-activation-gates.md).

## 3. Căn cứ tổ chức tài liệu

Diátaxis phân biệt bốn nhu cầu: học qua hướng dẫn bắt đầu, hoàn thành tác vụ, tra cứu thông tin, và hiểu khái niệm. Áp dụng như nguyên tắc biên tập; người dùng không cần nhìn thấy các thuật ngữ phân loại đó trong menu. [Nguồn: Diátaxis — Start here](https://diataxis.fr/start-here/).

Không dựng hàng loạt thư mục và trang trống cho đủ mô hình. Mỗi bài phải trả lời một nhu cầu có thật, rồi mở rộng dần. [Nguồn: Diátaxis — How to use](https://www.diataxis.fr/how-to-use-diataxis/).

Trợ giúp nên dễ tìm, gắn với tác vụ, có bước cụ thể và xuất hiện đúng lúc người dùng cần. Vì vậy ngoài trang help tổng, cần liên kết từ những điểm dễ mắc lỗi như workspace trống, cấu hình Telegram hoặc dữ liệu chart không có. [Nguồn: Nielsen Norman Group — Help and Documentation](https://www.nngroup.com/articles/help-and-documentation/).

Các quyết định về URL, số lượng bài, cấu trúc thư mục và thời gian dưới đây là đề xuất riêng cho Signapse, không phải yêu cầu của các nguồn tham khảo.

## 4. Nên để ở đâu?

### Nơi người dùng đọc

- URL chuẩn trong ứng dụng: `/{lang}/help` và `/{lang}/help/{slug}`; ví dụ `/vi/help/getting-started`.
- Cùng origin với ứng dụng ở giai đoạn đầu. Chưa mở `docs.signapse.cloud` để tránh thêm deployment, DNS và quản lý thương hiệu/locale.
- Route dự kiến: `app/[lang]/(help)/help/[[...slug]]/page.tsx`; layout docs độc lập trong `(help)`.
- Điểm vào: “Hướng dẫn” ở khu điều hướng phụ/menu tài khoản; link từ landing/footer khi có nội dung sẵn sàng; link bài cụ thể tại các empty/error state phù hợp.
- Điều hướng help bình thường mở cùng tab. Với form đang nhập hoặc nội dung chưa lưu, cung cấp link mở tab mới có thông báo rõ để người dùng không mất công việc.
- Không bắt đăng nhập để đọc hướng dẫn truy cập tài khoản. Các link chuyển sang thao tác trong app vẫn tuân thủ xác thực và quyền hiện có.

Public docs là lựa chọn sản phẩm được đề xuất, chưa phải quyền tự động publish. Preview giữ `noindex`; canonical, sitemap và alternate language chỉ trỏ tới origin thực sự được phát hành, theo nguyên tắc ADR-0005. `noindex` không phải cơ chế bảo vệ nội dung kín.

### Nơi lưu nội dung nguồn

```text
docs/
  user-documentation-research.md   # Nghiên cứu này, nội bộ
  user/                            # Chỉ bài hướng dẫn có thể xuất bản
    vi/
      getting-started.md
      workspace-and-watchlist.md
      read-dashboard.md
      ...
    en/
      getting-started.md
      workspace-and-watchlist.md
      read-dashboard.md
      ...
public/
  images/help/
    vi/
    en/
app/[lang]/(help)/help/
  layout.tsx
  [[...slug]]/page.tsx
app/lib/user-docs/
  catalog.ts                       # ID, nhóm, thứ tự, tên file; không chứa copy UI
  loader.ts                        # Nạp nội dung phía server qua allowlist
```

Đây là cây dự kiến, chưa tạo. Bộ xuất bản chỉ đọc các bài được khai báo trong catalog thuộc `docs/user`; tuyệt đối không render đệ quy toàn bộ `docs/`. Ảnh ở `public/` đều có thể truy cập trực tiếp, vì vậy chỉ đặt ảnh đã sẵn sàng công khai ở đó. Bản nháp có dữ liệu riêng không đưa vào output build, search index hoặc assets công khai.

### Phân biệt các bộ docs

| Bộ tài liệu | Người đọc | Nơi lưu/hiển thị |
| --- | --- | --- |
| User Guide | Người dùng cuối | `docs/user`, xuất bản tại `/help` |
| Hướng dẫn cấu hình dành cho người có quyền | Người quản lý workspace/Telegram | Nhóm nâng cao trong User Guide nếu nội dung có thể công khai |
| Runbook vận hành, hạ tầng, xử lý sự cố nội bộ | Đội kỹ thuật/vận hành | Tài liệu nội bộ hiện hành, không đưa vào help |
| API contract, mapping và ADR | Kỹ thuật | Giữ cấu trúc hiện tại |
| Developer Guide cho tích hợp ngoài | Người dùng API | Làm riêng khi có nhu cầu đã xác nhận; không đưa token/API làm bài nhập môn |

## 5. Chọn cách triển khai

| Phương án | Thuận lợi | Chi phí/trade-off | Đánh giá cho Signapse |
| --- | --- | --- | --- |
| Markdown trong Next.js, dùng thư viện đã có | Cùng PR và deployment với tính năng; tái sử dụng locale/theme | Tự làm shell, mục lục, tìm kiếm cơ bản; sửa nội dung cần deploy app | **Chọn cho bản đầu nhỏ** |
| Fumadocs tích hợp Next.js | Có bộ công cụ docs, điều hướng và tìm kiếm | Thêm dependency và công tích hợp với theme, locale, provider, quy tắc wrapper hiện tại | Chọn khi nhu cầu docs vượt shell tối thiểu; xem nguồn bên dưới |
| GitBook được host riêng | Thuận tiện cho người viết ngoài đội kỹ thuật; có công cụ xuất bản | Thêm dịch vụ và chính sách gói; cần kiểm tra quyền truy cập, localization, domain, đồng bộ | Chọn nếu biên tập độc lập quan trọng hơn cùng repo/deploy |
| Chỉ Markdown/GitHub hoặc thư mục Drive | Rất ít công khởi tạo | Người dùng phải rời sản phẩm; quyền đọc và trải nghiệm tra cứu phụ thuộc công cụ | Phù hợp bản nháp/biên tập, chưa nên là bề mặt help chính |

`react-markdown` nhận chuỗi Markdown và render thành React elements; `remark-gfm` bổ sung bảng và cú pháp GFM. Dùng renderer giới hạn phần tử cần thiết và giữ xử lý URL an toàn; không cần bật raw HTML. [Nguồn chính thức](https://github.com/remarkjs/react-markdown).

MDX có ích khi bài phải chứa React component tương tác, nhưng kéo theo cấu hình biên dịch và bề mặt thực thi mã. Với hướng dẫn gồm chữ, bước thao tác và ảnh, Markdown đủ dùng. [Nguồn Next.js về MDX](https://nextjs.org/docs/app/guides/mdx).

Không lấy số bài làm ngưỡng cứng để đổi công cụ. Cân nhắc chuyển khi đội phải tự xây full-text search nâng cao, điều hướng nhiều tầng, nhiều phiên bản, hoặc khi thời gian biên tập bị Git/deployment cản trở. Giữ ID và slug ổn định giúp việc chuyển dễ hơn.

Các nguồn kiểm chứng lựa chọn nền tảng:

- Fumadocs hỗ trợ tích hợp vào project hiện có, nên nếu chọn ở đợt sau vẫn có thể giữ cùng app/deployment. I18n của Fumadocs cần kết hợp với routing framework; không copy proxy mẫu đè lên Clerk/locale hiện hành. [Manual installation](https://www.fumadocs.dev/docs/manual-installation), [Internationalization](https://www.fumadocs.dev/docs/internationalization).
- Fumadocs có built-in search và chế độ static index; index static được tải về client, cần tính dung lượng nếu bộ docs lớn. Phiên bản tài liệu hiện tại khác một số kết quả search cache, nên không khóa đề xuất vào tên engine cụ thể. [Built-in search](https://www.fumadocs.dev/docs/headless/search/orama).
- GitBook có Git Sync hai chiều và visual editor. Nếu cần docs riêng tư, phải xem gói và cơ chế authenticated access thực tế; không mặc định session Clerk của app sẽ sử dụng được trên site GitBook. [Git Sync](https://www.gitbook.com/features/git-sync), [Authenticated access](https://gitbook.com/docs/publish/site-audience/authenticated-access).
- GitHub Pages cung cấp static hosting từ repository. Nó là một lựa chọn xuất bản riêng nếu sau này muốn tách deployment, nhưng không giải quyết sẵn workflow quyền người dùng của Signapse. [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Chưa so giá các gói trả phí: chưa xác định yêu cầu biên tập, quyền và localization đủ để chọn gói. Đánh giá trên tập trung vào số thành phần phải duy trì và mức phù hợp workflow hiện có.

## 6. Bố cục nội dung đích

Menu tổ chức theo hành trình và mục tiêu người dùng, tối đa hai cấp. Danh sách dưới đây là bản đồ nội dung có thể mở rộng, không yêu cầu tạo tất cả trang trong lần đầu.

```text
Hướng dẫn Signapse
├── Bắt đầu
│   ├── Bắt đầu với Signapse
│   └── Tài khoản, workspace và quyền truy cập
├── Theo dõi và tìm hiểu thị trường
│   ├── Quản lý tài sản theo dõi
│   ├── Đọc trang Tổng quan
│   ├── Khám phá Đồ thị Tri thức
│   ├── Đọc biểu đồ và dấu mốc sự kiện
│   ├── Theo dõi lịch kinh tế
│   └── Đọc tin, sự kiện và nguồn liên quan
├── Làm việc với Trợ lý AI
│   ├── Đặt câu hỏi thị trường
│   └── Hội thoại, lịch sử và giới hạn câu trả lời
├── Lưu lại và nhận thông tin
│   ├── Ghi chú cá nhân
│   ├── Hiểu thông báo Telegram
│   └── Cấu hình Telegram và lịch phân tích [cần quyền tương ứng]
├── Xử lý vấn đề
│   ├── Không thấy dữ liệu hoặc tính năng
│   ├── Telegram không nhận được tin
│   └── Gửi và theo dõi phản hồi
└── Tra cứu
    ├── Thuật ngữ
    ├── Trạng thái dữ liệu và thời gian
    └── Những thay đổi đáng chú ý với người dùng
```

“Cần quyền tương ứng” là điều kiện bài viết, không phải tên một role tự đặt. Telegram hiện nằm trong nhóm quản trị ở navigation; bài nhận thông báo không nên bắt người dùng thông thường tự cấu hình bot nếu họ không có quyền.

Không đưa các màn demo graph, dashboard prototype, cấu hình AI provider, system prompts, cronjobs hoặc quản lý role vào hành trình nhập môn. Ghi chú cá nhân và Trợ lý AI cần tài liệu dù chúng không phải trang riêng trong sidebar.

### Bộ 14 bài ưu tiên đầu tiên

| # | Bài và slug gợi ý | Kết quả người đọc đạt được | Ưu tiên |
| --- | --- | --- | --- |
| 1 | Bắt đầu với Signapse — `getting-started` | Đi từ truy cập ứng dụng đến xem thông tin một tài sản | P0 |
| 2 | Workspace và tài sản theo dõi — `workspace-and-watchlist` | Hiểu phạm vi dữ liệu, chọn workspace và thêm tài sản nếu có quyền | P0 |
| 3 | Đọc trang Tổng quan — `read-dashboard` | Biết thông tin nào đang hiển thị và mở chi tiết liên quan | P0 |
| 4 | Khám phá Đồ thị Tri thức — `explore-knowledge-graph` | Tìm, xem quan hệ và mở chi tiết; không suy diễn quan hệ thành nhân quả | P0 |
| 5 | Đọc biểu đồ thị trường — `read-market-chart` | Chọn tài sản/khung thời gian, hiểu dấu mốc và khoảng trống dữ liệu | P0 |
| 6 | Lịch kinh tế, tin và sự kiện — `follow-market-events` | Phân biệt lịch sắp tới với thông tin/sự kiện đã được ghi nhận | P0 |
| 7 | Làm việc với Trợ lý AI — `use-ai-assistant` | Tạo hội thoại, tìm lịch sử đúng workspace và hiểu giới hạn | P0 |
| 8 | Không thấy dữ liệu hoặc tính năng — `missing-data-or-access` | Kiểm tra workspace, tài sản, bộ lọc, trạng thái tải và quyền | P0 |
| 9 | Thuật ngữ và trạng thái — `glossary` | Hiểu các khái niệm cốt lõi được dùng xuyên suốt | P0 |
| 10 | Tài khoản và ngôn ngữ — `account-and-language` | Quản lý thông tin được hỗ trợ; phân biệt ngôn ngữ giao diện/đầu ra | P1 |
| 11 | Ghi chú cá nhân — `personal-notes` | Mở ghi chú, hiểu trạng thái lưu và phạm vi workspace theo bản phát hành | P1 |
| 12 | Cấu hình Telegram — `configure-telegram` | Hiểu Bot Telegram, Điểm nhận và xác minh bằng tin nhắn thử | P1 |
| 13 | Lịch phân tích và lỗi nhận tin — `telegram-schedules` | Cấu hình tài sản/giờ/múi giờ/ngôn ngữ, hiểu vô hiệu hóa và kiểm tra lỗi | P1 |
| 14 | Gửi và theo dõi phản hồi — `send-feedback` | Gửi lỗi/ý tưởng, hiểu trạng thái xử lý và việc rút phản hồi | P1 |

P0 gồm 9 bài, đủ mở một help center hữu ích; P1 thêm 5 bài khi tính năng tương ứng được xác nhận khả dụng. Một bài dài hơn khoảng 1.200 từ hoặc giải quyết hai mục tiêu độc lập thì cân nhắc tách. Không tạo trang “sắp có” cho đủ menu.

### Luồng đọc đầu tiên

Bắt đầu → workspace/tài sản theo dõi → Tổng quan → chọn biểu đồ hoặc Đồ thị Tri thức → đặt câu hỏi với Trợ lý AI. Nhánh thay thế khi thiếu quyền hoặc thiếu dữ liệu dẫn đến bài xử lý vấn đề. Telegram là bước mở rộng, không là điều kiện bắt buộc để hiểu sản phẩm.

Ví dụ prompt trong bài AI chỉ minh họa cách đặt câu hỏi. Không viết sẵn kết quả phân tích rồi mô tả như phản hồi chắc chắn từ sản phẩm.

## 7. Bố cục trang và mẫu bài

### Trang chủ hướng dẫn

Một tiêu đề, câu giới thiệu ngắn, ô tìm bài, liên kết “Bắt đầu”, danh sách các nhóm tác vụ và một khu xử lý vấn đề thường gặp. Không cần hero marketing, carousel hoặc nhiều card trang trí.

### Trang bài viết

- Desktop: điều hướng nhóm bên trái; nội dung đọc khoảng 65–75 ký tự mỗi dòng; mục lục heading bên phải khi bài đủ dài.
- Mobile: mục lục nhóm thu gọn có thể dùng bàn phím; nội dung một cột; bảng cuộn trong vùng riêng.
- Phần đầu: breadcrumb, một H1, mô tả kết quả, điều kiện/quyền nếu cần, ngày xác minh nội dung.
- Phần cuối: bài liên quan, bài tiếp theo nếu có hành trình, cách báo nội dung sai.
- Dùng theme/token, font và wrapper hiện có theo [DESIGN](design/DESIGN.md). Width đọc bài là đề xuất cho layout help độc lập, không thay đổi chính sách width của `(main)`.
- Heading có anchor ổn định; hỗ trợ deep link, focus nhìn thấy được, alt ảnh, zoom, light/dark; không biến cả bài thành accordion.

### Template bài how-to

```markdown
# [Động từ + kết quả cần đạt]

[Một hoặc hai câu: bạn sẽ làm được gì sau bài này.]

## Trước khi bắt đầu
- Workspace/dữ liệu cần có.
- Quyền hoặc điều kiện cần thiết, nếu có.

## Các bước thực hiện
1. [Thao tác với đúng nhãn giao diện.]
2. [Thao tác tiếp theo.]
3. [Bước hoàn thành.]

## Kết quả mong đợi
[Người dùng nhìn thấy gì để biết thao tác đã thành công.]

## Nếu chưa thành công
| Hiện tượng | Kiểm tra hoặc cách xử lý |
| --- | --- |
| ... | ... |

## Liên quan
- [Khái niệm hoặc tác vụ tiếp theo.]
```

Tutorial dùng một kịch bản xuyên suốt; reference dùng định nghĩa/bảng; bài giải thích đi từ câu hỏi “vì sao”. Không ép cả bốn loại vào cùng template thao tác.

Metadata tối thiểu: ID/slug ổn định, locale, title, description, nhóm/thứ tự, người phụ trách, ngày xác minh, mã revision nội dung. Có thể lưu metadata bản địa hóa trong dictionary và metadata kỹ thuật trong catalog; bản đầu không cần tự viết YAML parser/frontmatter engine.

## 8. Các nội dung Signapse đặc biệt cần viết chính xác

Những điểm này xuất phát từ [domain glossary](../CONTEXT.md), cần đối chiếu UI phát hành trước khi viết hướng dẫn từng nút:

1. Workspace là phạm vi quan trọng; không thấy hội thoại/dữ liệu có thể do đang ở workspace khác.
2. Account role là quyền, không phải gói thương mại. Không tự lập bảng Free/Pro hoặc hứa mọi tài khoản đều có cùng tính năng.
3. Market Knowledge Graph cung cấp ngữ cảnh; một cạnh quan hệ không tự chứng minh quan hệ nhân quả.
4. Trợ lý AI không được mô tả là tự nhận node/chart đang chọn hoặc luôn cung cấp đầy đủ nguồn cho mọi câu trả lời.
5. Khoảng trống nến, lỗi tải và hết lịch sử là các tình huống khác nhau. Sự kiện lịch kinh tế có thể có thời điểm chưa có nến tương ứng.
6. Telegram có ngôn ngữ giao diện, đầu ra luồng, đầu ra lịch và ngôn ngữ ưu tiên chủ sở hữu. Lịch phân tích không kế thừa ngôn ngữ từ setting của luồng scheduled market analysis theo domain hiện tại.
7. Lịch phân tích áp dụng cho một tài sản theo dõi. Vô hiệu hóa lịch không được gọi là “tạm dừng để bật lại” vì UI hiện không cho kích hoạt lại.
8. Phản hồi đã chuyển xử lý không đồng nghĩa cam kết triển khai; không tiếp nhận, rút và xóa quản trị là các kết quả khác nhau.

Dùng cảnh báo ngắn đúng chỗ khi có hậu quả thao tác; không lặp một khối disclaimer ở mọi trang. Bộ docs hướng dẫn sử dụng sản phẩm, không đưa khuyến nghị giao dịch.

## 9. Triển khai kỹ thuật tối thiểu

### Nội dung và render

1. Khai báo catalog tĩnh gồm danh sách ID và file được phép xuất bản; resolve slug qua catalog, không ghép đường dẫn filesystem trực tiếp từ URL.
2. Nạp bài phía server, render Markdown với bảng, link, ảnh và heading. Tạo ID heading/mục lục từ cùng một quy tắc, xử lý heading trùng.
3. Bài không tồn tại trả 404; không âm thầm đưa người đọc về trang chủ. Link từ catalog dùng đường dẫn đã bản địa hóa.
4. Nội dung nằm cùng commit với UI mà nó hướng dẫn. Dùng build artifact cho bài và index; kiểm tra đóng gói nội dung trên cách deploy thực tế để tránh chạy local được nhưng thiếu `.md` khi deploy.
5. Không cần API backend cho việc đọc bài. Không fetch dữ liệu người dùng để minh họa hướng dẫn.

### Locale và dictionary: phải xử lý rõ từ đầu

Next.js hỗ trợ route locale và nạp bản dịch phía server; đây là cơ sở phù hợp với cấu trúc đang có. [Nguồn Next.js](https://nextjs.org/docs/app/guides/internationalization).

Repo hiện yêu cầu copy người dùng đi qua dictionary. Để giữ quy tắc đó, đề xuất mở rộng `getDictionary`/`getServerDictionary` bằng nhánh server-only theo bài: chỉ khi route help yêu cầu một article ID mới nạp Markdown locale tương ứng và trả article qua dictionary. Title, mô tả và nhãn điều hướng có bản dịch; body được xem là nội dung bản địa hóa của dictionary. Giữ hành vi loader mặc định hiện có và không nhét toàn bộ body docs vào `Providers` phía client. Chi tiết overload/type cần chốt trong thiết kế triển khai.

Nếu sau này muốn dùng content loader hoàn toàn độc lập dictionary, phải ghi nhận đó là thay đổi convention repo; không lặng lẽ bỏ qua quy tắc i18n hiện hành.

- Dùng cùng ID và slug cho VI/EN; chỉ dịch title và nội dung. Chuyển ngôn ngữ giữ bài hiện tại.
- VI là bản gốc biên tập ban đầu. Các bài P0 nên có đủ VI/EN trước khi quảng bá help cho cả hai locale.
- Nếu EN chưa sẵn sàng: UI thông báo bản dịch chưa có và cho link chủ động đến bản VI; không hiển thị tiếng Việt dưới URL tiếng Anh mà không báo.
- Revision thay đổi nội dung đánh dấu bản dịch cần review; đổi ngày không làm bản dịch trở thành “đã cập nhật”. Chỉ xuất bản bài đúng hành vi bản phát hành.

### Tìm kiếm bản đầu

Dùng index nhỏ gồm title, description, heading và từ khóa biên tập theo locale; lọc phía client khi mở tìm kiếm. Hỗ trợ tìm không dấu và ánh xạ `đ`/`d` cho tiếng Việt, đồng thời bổ sung từ đồng nghĩa người dùng hay dùng như “watchlist/tài sản theo dõi”. Kết quả có title, đoạn mô tả và URL bài/heading.

Nêu đúng đây là tìm kiếm theo metadata/heading, chưa phải full-text toàn bộ bài. Với 9–14 bài, đây là điểm khởi đầu hợp lý. Chỉ thêm full-text/engine khi có câu hỏi tìm kiếm mà index này thường xuyên bỏ sót. Index chỉ chứa bài được xuất bản và đúng locale; không chứa nội dung nội bộ.

### Public route và layout

Mở chính xác namespace help theo segment locale; không mở một pattern rộng ảnh hưởng các route hoặc API khác. Kiểm tra cả route gần giống như `/vi/helpful` để tránh miễn auth nhầm. Layout help không gọi workspace API; root vẫn đang có Clerk/Providers nên không khẳng định docs sẽ hoàn toàn không tải Clerk hoặc tự động static-export. Đánh giá dependency root khi triển khai, không tái cấu trúc root chỉ để tối ưu giả định.

### Những phần chưa cần xây

CMS, cơ sở dữ liệu bài, comment công khai, chatbot RAG, vector database, trình sửa MDX, nhiều version tài liệu, hệ thống rating có lưu dữ liệu. Nếu cần báo lỗi nội dung, trước mắt dùng luồng Feedback hiện có khi đã khả dụng và có quyền; prefill ID/URL bài sạch. Không hứa kênh hỗ trợ cho người chưa đăng nhập trước khi xác nhận nơi tiếp nhận và người phụ trách.

## 10. Quy trình giữ docs đúng và gọn

| Vai trò | Trách nhiệm |
| --- | --- |
| Người phụ trách sản phẩm/nội dung | Chọn nhu cầu ưu tiên, xác nhận ngữ nghĩa và việc có thể công khai |
| Người triển khai tính năng | Chỉ ra thay đổi trải nghiệm/quyền/trạng thái, cập nhật bài liên quan trong PR |
| Người review nội dung | Kiểm tra bước làm, đúng nhãn, kết quả, điều kiện và liên kết |
| Người review bản dịch | Đảm bảo VI/EN cùng ý và khớp UI của từng locale |

Một người có thể kiêm nhiều vai trò; không cần thiết lập phòng ban mới. Mỗi bài có một người chịu trách nhiệm rõ ràng.

Quy trình: xác định tác vụ → đối chiếu bản phát hành → viết bản VI → review hành vi → dịch EN → kiểm tra tự động → preview → xuất bản cùng release. Với PR có thay đổi user flow, ghi bài cần cập nhật hoặc giải thích ngắn vì sao docs không bị ảnh hưởng. Không sao chép API schema thành hướng dẫn thao tác.

Ưu tiên chữ và ít ảnh: chỉ dùng ảnh khi giúp xác định vị trí hoặc đọc một trạng thái khó mô tả. Ảnh demo phải loại dữ liệu riêng/token, đúng locale, có alt/caption và ngày kiểm chứng; ảnh landing đã duyệt không tự động phù hợp với từng hướng dẫn thao tác. Không chặn bài chỉ vì chưa có ảnh nếu văn bản đã đủ rõ.

Định kỳ đề xuất: mỗi release rà các bài bị ảnh hưởng; mỗi tháng xem các vấn đề người dùng lặp lại và các bài lâu chưa kiểm chứng. Không tự động lập lịch trong phạm vi nghiên cứu này.

## 11. Kế hoạch triển khai và nghiệm thu

### Đợt A — định nghĩa nội dung

Chốt audience, mức công khai, catalog 9 bài P0, thuật ngữ, template và nguồn xác minh từng bài. Soạn một bài nhập môn và một bài xử lý vấn đề để kiểm tra cấu trúc trước khi viết cả bộ.

### Đợt B — reader tối thiểu và nội dung P0

Thêm route/layout help, dictionary article loading, renderer Markdown, điều hướng, mục lục, locale switch và tìm kiếm metadata. Viết/đối chiếu 9 bài P0 hai ngôn ngữ. Thêm entry point chính và một vài link trợ giúp đúng ngữ cảnh.

### Đợt C — mở rộng có căn cứ

Thêm 5 bài P1 khi các tính năng tương ứng sẵn sàng, sửa dựa trên phản hồi. Tách bài dài theo nhu cầu thực tế. Chỉ quyết định full-text hoặc Fumadocs/GitBook khi có lý do rõ.

Ước lượng lập kế hoạch, chưa phải cam kết: khoảng 1–2 ngày công cho catalog/template; 2–4 ngày cho reader và tích hợp; 4–7 ngày cho 9 bài P0 VI/EN có đối chiếu hành vi; 1–2 ngày review/phát hành. Tổng khoảng 8–15 ngày công trong giả định UI ổn định, có người review và dữ liệu demo. Thời gian viết/kiểm chứng có thể lớn hơn công làm website; prototype reader một ngày không đồng nghĩa docs sẵn sàng phát hành.

### Kiểm tra Codex có thể chạy khi triển khai

- Validate catalog: ID/slug duy nhất, locale hợp lệ, file và metadata đầy đủ; không xuất bản draft; không có orphan trong tập bài phát hành.
- Kiểm tra link nội bộ, ảnh, anchor, locale mapping và trạng thái bản dịch; parse Markdown thật thay vì regex giả định mọi link đều đơn giản.
- Test ranh giới public/protected, slug không hợp lệ, kết quả search không dấu và việc loại nội dung không xuất bản.
- Kiểm tra output build có bài/ảnh cần thiết, không có tài liệu nội bộ trong bundle/index public.
- Chạy lint, typecheck và build thích hợp; kiểm tra accessibility tự động bằng hạ tầng repo khi khả dụng.
- Theo scope triển khai, đọc và tuân thủ các instruction/skill tương ứng trước khi thực hiện thay đổi sản phẩm.

User-owned manual QA, ghi chú không phải checkbox chặn archive: người chưa biết ứng dụng thử hoàn thành một tác vụ với bài; product xác nhận hành vi/quyền trên môi trường thật; review ảnh công khai, VI/EN và mobile. Phân biệt việc hoàn tất engineering với quyết định phát hành public.

### Đánh giá hiệu quả

Ban đầu không xây thêm analytics pipeline. Dùng phản hồi thực tế và công cụ hiện có để xem: người mới hoàn thành tác vụ nào, câu hỏi nào lặp lại, bài nào sai/lỗi link, có tìm được bài cần thiết hay không. Nếu bổ sung search analytics sau này, chỉ thu metadata tối thiểu phù hợp chính sách hiện hành; query tìm kiếm có thể chứa nội dung người dùng nên không tự ghi toàn bộ query.

Mục tiêu chất lượng ban đầu: mỗi tác vụ cốt lõi có một bài tìm được từ help; mỗi bài nêu điều kiện và kết quả; không link hỏng; không mô tả tính năng chưa phát hành như đang có; P0 hai locale được review. Đặt chỉ tiêu giảm câu hỏi hỗ trợ sau khi có số liệu nền, không tự đặt phần trăm thiếu căn cứ.

## 12. Các quyết định còn cần chủ sản phẩm xác nhận khi bắt đầu triển khai

1. Cho phép công khai hướng dẫn sản phẩm hay chỉ dành cho nhóm thử nghiệm? Khuyến nghị: công khai bài đã duyệt, giữ tài liệu nội bộ riêng.
2. Người viết chính có làm việc qua Markdown/PR được không? Khuyến nghị mặc định dựa trên workflow repo hiện tại; nếu không, đánh giá GitBook trước khi code reader.
3. Feature nào thực sự được mở cho nhóm người dùng đầu tiên, đặc biệt Telegram, AI và Feedback? Dùng danh sách này quyết định bài xuất bản.
4. Ai xác nhận nội dung và duy trì VI/EN? Có thể cùng một người phụ trách sản phẩm ở giai đoạn đầu.

Các câu hỏi này không cản việc hoàn tất nghiên cứu. Chưa có thay đổi code ứng dụng, dependency, route auth hoặc cấu hình hosting trong công việc này.
