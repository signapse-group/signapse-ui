# Trading Intelligence Dashboard

**Status:** Accepted  
**Scope:** `app/[lang]/(main)/dashboard`  
**Target:** Desktop web  
**Last updated:** 2026-08-02

Tài liệu này mô tả mục đích, information architecture, bố cục và content rules
riêng cho trang `/dashboard`. Tài liệu mở rộng
[DESIGN.md](./DESIGN.md); khi có xung đột, `DESIGN.md` vẫn là nguồn chuẩn cho
design system, component chrome và accessibility toàn ứng dụng.

## Product Definition

> Dashboard là bề mặt market awareness được cá nhân hóa theo workspace và
> watchlist. Dashboard không phải nơi quan sát sức khỏe pipeline hoặc xử lý tác
> vụ quản trị.

Tên định hướng của trang là **Trading Intelligence Home**, không phải
Operations Console. Trang phục vụ người dùng theo dõi thị trường và hỗ trợ quá
trình ra quyết định giao dịch; không phục vụ việc giám sát hệ thống nội bộ.

## User Questions

Dashboard phải giúp người dùng nhanh chóng trả lời bốn câu hỏi:

1. Thị trường vừa có gì thay đổi?
2. Sự kiện quan trọng nào sắp diễn ra?
3. Watchlist của tôi đang cần chú ý điều gì?
4. Narrative nào đang mạnh lên hoặc yếu đi?

Mọi module trên trang phải đóng góp trực tiếp vào ít nhất một trong bốn câu hỏi
trên.

## Goals

- Cho người dùng thấy market context quan trọng ngay sau khi mở ứng dụng.
- Kết nối workspace, watchlist, event, article và narrative
  thành một decision surface thống nhất.
- Ưu tiên thông tin mới, sự kiện quan trọng sắp tới và nội dung liên quan đến
  phạm vi theo dõi của người dùng.
- Cung cấp đường dẫn ngắn tới Events, News, Market Charts và
  Graph View.
- Giữ mật độ thông tin phù hợp với financial dashboard nhưng không tạo cảm giác
  như màn giám sát vận hành.

## Non-Goals

Dashboard không hiển thị:

- Derivation hoặc enrichment đang pending hay failed.
- Sync job, cronjob, queue hoặc pipeline health.
- AI provider, system prompt hoặc backend processing state.
- Administrative counts, permission diagnostics hoặc system telemetry.
- Nội dung giải thích implementation như “backend” hoặc “processing pipeline”.
- Full trading workbench hoặc candlestick chart lớn đã thuộc trách nhiệm của
  Market Charts.

Các trạng thái nội bộ vẫn có thể được dùng để xác định dữ liệu nào đủ điều kiện
hiển thị, nhưng không được lộ ra UI.

## Information Architecture

### Layout

Trang dùng grid 12 cột với hierarchy bất đối xứng, tránh chia mọi nội dung thành
các card có cùng trọng lượng.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Workspace A                                  [Quản lý tài sản]  │
│ Phạm vi dữ liệu và phân tích đang hoạt động trên dashboard.     │
│ 🗓 07:36, 27 thg 5, 2026                                        │
│                                                                  │
│ Tài sản đang theo dõi [8]                                       │
│ Danh sách này được lưu theo workspace đang hoạt động.           │
│ [EUR/USD] [XAU/USD] [BTC/USD] [NVDA] ...                        │
└──────────────────────────────────────────────────────────────────┘

┌ Sự kiện quan trọng ──────┐ ┌ Event 24h ┐ ┌ Narrative ┐ ┌ Tin mới ┐
│ CPI Hoa Kỳ · 19:30 · CAO │ │    12     │ │ 4 active  │ │   18    │
└───────────────────────────┘ └───────────┘ └───────────┘ └─────────┘

┌ Dòng sự kiện — 8 cột ────────────────────┐ ┌ Tin tức mới nhất — 4 cột ┐
│ Sự kiện mới nhất theo occurredAt         │ │        [Xem toàn bộ]       │
│ Tiêu đề · mô tả · theme · affected asset │ │ Ảnh · tiêu đề · summary    │
│ [Mở event]                               │ │ Raw article, không relation│
└──────────────────────────────────────────┘ └───────────────────────────┘

┌ Tài sản cần chú ý — 7 cột [Graph View] ──┐ ┌ Luận điểm thị trường [Graph View] ┐
│ Symbol · loại · market context gần nhất  │ │ Emerging / Active                 │
│ [Market Charts]                          │ │ Weakening · asset ảnh hưởng       │
└──────────────────────────────────────────┘ └────────────────────────────────────┘
```

## Module Specifications

### Current Workspace

Current Workspace là thanh ngữ cảnh gọn, không phải hero. Tên workspace đang hoạt
động là heading hiển thị của module; không lặp lại label chung “Workspace hiện tại”.
Heading dùng cùng text scale với giá trị “CPI Hoa Kỳ” trong Next Key Event nhưng
không dùng typography mono hoặc tabular dành cho metric.

Nội dung:

- Tên workspace đang hoạt động.
- Mô tả ngắn cho biết workspace xác định phạm vi dữ liệu và phân tích đang hoạt động.
- Thời gian cập nhật workspace dưới dạng `AppTimeMetadata` chỉ gồm calendar-clock icon
  và giá trị được format theo locale, không thêm label hoặc badge.
- Subsection “Tài sản đang theo dõi” có badge số lượng trung tính và mô tả rằng danh
  sách thuộc workspace đang hoạt động.
- Toàn bộ tài sản đang theo dõi dưới dạng item riêng biệt, gồm tên đầy đủ, symbol và
  badge loại tài sản trung tính.
- Hành động quản lý tài sản khi người dùng có quyền phù hợp.

Timestamp nằm dưới workspace description và trên subsection tài sản. Badge số lượng
chỉ là metadata bổ sung, không thay thế danh sách bằng count-only hoặc `+N`. Empty state
vẫn giữ heading, description và count bằng 0. Loading state giữ đúng footprint của
heading, workspace description, timestamp, asset description, count badge và grid item. Không dùng mô tả dài
hoặc thời gian sửa workspace làm nội dung nổi bật. Metadata workspace không được cạnh
tranh với market information.

Danh sách asset dùng responsive grid: bốn cột ở màn hình rất rộng, hai cột ở kích
thước trung gian và một cột trên mobile hoặc khi zoom làm giảm chiều rộng khả dụng.
Không rút gọn thành count-only hoặc `+N`, vì người dùng cần nhìn thấy đầy đủ phạm vi
dữ liệu của workspace. Tên dài được wrap, không phụ thuộc tooltip hoặc hover để xem
đầy đủ.

Mỗi asset item chỉ xác định scope và không có logo giả, giá, market status, market
context hoặc action riêng. `Manage Assets` là action chung của module. `Assets in
Focus` tiếp tục sở hữu market context và action Market Charts theo từng asset.

### Trading Snapshot

Hàng snapshot cung cấp các tín hiệu có thể đọc trong vài giây:

- Sự kiện quan trọng sắp tới.
- Số market event mới trong 24 giờ.
- Số narrative đang hoạt động hoặc mới hình thành.
- Số news item mới trong khoảng thời gian phù hợp.

Metric phải có time window hoặc context rõ. Không hiển thị số tổng tích lũy nếu
con số đó không giúp người dùng ra quyết định.

### Latest News

Latest News cung cấp tin tức mới tách biệt khỏi dòng sự kiện.

Nội dung ưu tiên:

- Tiêu đề tin tức.
- Summary ngắn tối đa hai dòng, nằm ngay dưới tiêu đề.
- Nguồn tin và thời gian xuất bản.
- Hành động xem toàn bộ tin tức ở header của module.

Module không hiển thị forecast, previous, actual, calendar rows hoặc badge quan
hệ với asset/event. Article có thể là bản raw chưa được liên kết; việc thiếu quan
hệ không loại item khỏi module và không được biểu diễn bằng metadata giả.

### Event Timeline

Event Timeline chỉ hiển thị market event và không trộn article vào cùng danh
sách.

Event hiển thị:

- Tiêu đề.
- Mô tả ngắn, tối đa hai dòng trong danh sách.
- Theme dưới dạng text trung tính, phân tách bằng dấu `·`.
- Asset ảnh hưởng dưới dạng badge `outline` trung tính, không suy diễn direction.
- Thời gian xảy ra được format qua `AppTimeMetadata`.
- Confidence dưới dạng metadata trung tính.
- Hành động mở danh sách event.

Timeline sắp xếp mới nhất trước theo `occurredAt`. Relationship row nằm phía trên
metadata thời gian/confidence và được phép wrap trước khi truncate. Không hiển thị
internal enrichment status, Economic Calendar impact, trạng thái sắp lịch hoặc chiều
tăng/giảm của asset. Prototype dùng mock data route-local; contract production được
quyết định trong change riêng.

Event Timeline không dùng status badge; chỉ asset ảnh hưởng dùng badge `outline`
trung tính. Economic Calendar impact chỉ xuất hiện tại tile Sự kiện quan trọng sắp
tới, nơi có đúng ngữ nghĩa lịch kinh tế.

### Market Narratives

Market Narratives tập trung vào các trạng thái có ý nghĩa giao dịch:

- `EMERGING`: luận điểm mới hình thành.
- `ACTIVE`: luận điểm đang có hiệu lực.
- `WEAKENING`: luận điểm đang suy yếu.

Mỗi narrative có thể hiển thị:

- Tiêu đề hoặc thesis.
- Status user-facing.
- Theme chính dưới dạng text trung tính.
- Confidence.
- Toàn bộ asset bị ảnh hưởng, hiển thị thành từng item có thể nhận diện.
- Thời điểm cập nhật gần nhất.

Hành động điều tra trên Graph View áp dụng cho toàn module và nằm trong header,
không nằm trong footer.

`INVALIDATED` và `ARCHIVED` không nằm trên dashboard chính. Các trạng thái này
phù hợp với lịch sử hoặc màn danh sách đầy đủ hơn.

Không suy diễn chiều tăng hoặc giảm của asset nếu data contract production chưa
cung cấp thông tin đó.

Status badge dùng Badge variant `secondary` cho `EMERGING` và `WEAKENING`, và
`default` cho `ACTIVE`. Label vẫn biểu đạt vòng đời luận điểm; variant không biểu đạt
bullish hay bearish, theme là text trung tính và asset bị ảnh hưởng vẫn là badge trung tính.

### Assets in Focus

Giai đoạn đầu sử dụng dữ liệu hiện có:

- Symbol.
- Tên tài sản.
- Loại tài sản.
- Quick link tới Market Charts trên từng asset.
- Một hành động Graph View chung ở header của module.
- Event hoặc narrative gần nhất nếu có thể ghép dữ liệu mà không tạo N+1
  request.

Khi có aggregate API, module có thể bổ sung:

- Giá hiện tại và biến động 24 giờ.
- Sparkline ngắn.
- Catalyst gần nhất.
- Số event mới liên quan trong 24 giờ.
- Top mover trong watchlist.

Không tải riêng dữ liệu thị trường cho từng tài sản bằng N request độc lập.

Badge loại tài sản dùng variant `secondary` vì loại tài sản là category, không phải
status cần semantic color. Symbol và asset scope tiếp tục dùng badge trung tính.

### Action Scope

- Hành động áp dụng cho toàn module nằm trong header của module.
- Hành động áp dụng cho một item nằm trong item tương ứng.
- Latest News không dùng footer cho link xem toàn bộ; Market Narratives không
  dùng footer cho Graph View; Assets in Focus không lặp Graph View trên từng asset.
- Empty và partial-error state không lặp lại cùng một hành động ở cả header và nội
  dung. Loading skeleton giữ footprint của header action.

## Data Eligibility And Internal Status

Dashboard chỉ hiển thị dữ liệu đã đủ điều kiện phục vụ người dùng.

- Không hiển thị các nhãn như `ENRICHMENT_PENDING`,
  `ENRICHMENT_FAILED`, `DERIVATION_PENDING` hoặc `DERIVATION_FAILED`.
- Item chưa sẵn sàng không xuất hiện trong Event Timeline hoặc Latest News.
- Internal status có thể được dùng ở data layer để lọc eligibility.
- Không chuyển internal failure thành alert card màu đỏ trên dashboard.
- Lỗi tải module được biểu đạt bằng ngôn ngữ user-facing và không tiết lộ cơ chế
  xử lý phía sau.

## Empty, Loading And Error States

- Mỗi module có loading skeleton tương ứng với bố cục thật.
- Module tải độc lập; một nguồn dữ liệu chậm hoặc lỗi không chặn toàn bộ
  dashboard.
- Empty state giải thích người dùng có thể làm gì tiếp theo.
- Không dùng copy như “Khi backend trả về dữ liệu...”.
- Error state dùng câu ngắn như “Không thể tải thông tin thị trường” và cung cấp
  retry khi phù hợp.
- Optional module không có quyền truy cập nên được ẩn hoặc thay bằng nội dung
  khác có giá trị; tránh lấp dashboard bằng permission-denied panels.

## Visual Direction

Trang kế thừa direction **Financial Command Surface**:

- Data-dense nhưng tĩnh, rõ và có khoảng thở.
- Dùng Geist và Geist Mono theo design system hiện tại.
- Dùng semantic tokens, không tạo palette riêng cho dashboard.
- Motion nhẹ và chỉ dùng để giải thích state change.
- Light mode và dark mode giữ cùng hierarchy.
- Xanh/đỏ trading chỉ dùng cho biến động giá hoặc tín hiệu thị trường phù hợp,
  không dùng cho trạng thái backend.
- Không đặt candlestick chart lớn trên dashboard; full chart thuộc Market
  Charts.

### Semantic Badge Color

Badge tuân theo hierarchy `impact > trạng thái narrative > category > context`.
Workspace asset, related asset, affected asset, asset type và raw article giữ trung
tính; chỉ impact và trạng thái có semantic intent.

| Nhóm                  | Mapping                                                          |
| --------------------- | ---------------------------------------------------------------- |
| Next Key Event impact | Exact Economic Calendar helper props + localized label           |
| Narrative             | Emerging: `secondary`; Active: `default`; Weakening: `secondary` |
| Asset type            | `secondary`                                                      |

Event impact tái sử dụng cả helper chrome và helper label của Economic Calendar,
không thêm icon hoặc copy riêng tại feature. Các trạng thái khác map sang variant
mặc định gần nhất của shared `<Badge>`; feature code không thêm variant, raw palette
class hoặc manual `dark:` override. Không thêm global CSS hay semantic token. Mọi badge có
text rõ nghĩa để màu không trở thành tín hiệu duy nhất.

Quy tắc impact chỉ áp dụng cho tile Sự kiện quan trọng sắp tới. Tile snapshot tách
thời gian và currency khỏi impact, hiển thị badge helper-provided `CAO` thay cho
chuỗi “Tác động cao”; empty state không hiển thị impact badge.

## Delivery Phases

### Phase 1: Existing Data

- Thu gọn workspace thành Current Workspace và hiển thị đầy đủ asset scope.
- Thêm Trading Snapshot.
- Thêm Event Timeline chỉ chứa event.
- Thêm Latest News tách biệt khỏi event và không hiển thị calendar rows.
- Đặt các hành động toàn module trong header và chỉ giữ Market Charts theo từng asset.
- Trình bày lại Market Narratives với danh sách asset bị ảnh hưởng.
- Chuyển watchlist từ decorative tiles thành danh sách có quick actions.
- Dùng permission-aware rendering và loading/error boundary độc lập theo module.

### Phase 2: Aggregated Trading Data

- Thêm dashboard summary endpoint nếu số lượng request tổng hợp trở nên lớn.
- Thêm watchlist price snapshot, biến động 24 giờ và sparkline.
- Thêm catalyst và event count theo từng tài sản.
- Thêm top mover và watchlist impact ranking.

## Design Completion Criteria

Thiết kế được xem là đạt khi:

- Người dùng nhìn thấy sự kiện quan trọng trước khi thấy metadata workspace.
- Không có process, pipeline hoặc admin status xuất hiện trên dashboard.
- Mỗi metric có time window hoặc decision context rõ.
- Event, article, narrative và watchlist đều có đường dẫn điều tra tiếp theo.
- Vị trí mỗi hành động phản ánh đúng phạm vi toàn module hoặc từng item và không bị
  lặp giữa header, nội dung và footer.
- Dashboard vẫn hữu ích khi một hoặc nhiều optional modules không có dữ liệu.
- Loading skeleton, empty state và error state giữ cùng hierarchy với nội dung
  thật.
- Badge impact khớp hoàn toàn với Economic Calendar; narrative state dùng variant
  mặc định được phép; asset type, asset context và raw article vẫn trung tính.
