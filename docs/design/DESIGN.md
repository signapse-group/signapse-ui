# Signapse UI/UX Design System

Tài liệu này là nguồn chuẩn cho các quy ước UI/UX bền vững của Signapse: visual, theme, layout, component composition, interaction, content, state, accessibility và UI review. Mọi thay đổi hoặc review UI hiển thị cho người dùng dưới `app/[lang]/**` hoặc `components/**` phải tuân theo tài liệu này cùng các technical boundary trong `components/AGENTS.override.md`.

Tài liệu không sở hữu kiến trúc repository, dependency/import boundary, API, permission, validation, localization mechanism, workflow hay verification policy. Các nội dung đó vẫn thuộc `AGENTS.md`, scoped overrides và skills tương ứng.

## Reference

- `docs/design/design_light.png`
- `docs/design/design_dark.png`

Hai reference thể hiện một ngôn ngữ thiết kế rất hợp với Signapse:

- Tối giản, sắc nét, nhiều khoảng thở.
- Inner surface có viền mảnh, chiều sâu nhẹ và hierarchy rõ.
- Nền grid rất tinh tế, không cạnh tranh với nội dung.
- Typography rõ, heading mạnh, metadata nhỏ và tracking rộng.
- Metric cards và status surfaces có hierarchy rõ.
- Light mode và dark mode cùng một logic thẩm mỹ, không giống hai theme rời nhau.

## Direction

Tên direction: **Financial Command Surface**

Signapse không phải landing page marketing. Đây là công cụ vận hành cho admin/operator cần đọc dữ liệu, kiểm tra trạng thái, thao tác CRUD, quản lý workflow AI và phân tích thị trường. Vì vậy direction này ưu tiên cảm giác:

- Chuyên nghiệp, tĩnh, đáng tin.
- Dữ liệu rõ ràng, ít nhiễu.
- Bề mặt UI có chiều sâu nhẹ nhưng không bóng bẩy quá mức.
- Trạng thái, cảnh báo và insight nổi bật đúng lúc.
- Không dùng hiệu ứng trang trí gây xao nhãng.

## Goals

- Tạo một visual language thống nhất cho dashboard Signapse.
- Áp dụng reference theo hướng token, surface và hierarchy, không hardcode theo từng màn.
- Giữ UI tiếng Việt chuyên nghiệp, dễ đọc.
- Dùng Geist và Geist Mono theo stack hiện tại, với hierarchy rõ và khả năng đọc tiếng Việt tốt.
- Tăng cảm giác tài chính, phân tích và vận hành mà vẫn giữ mật độ thông tin phù hợp admin tool.
- Bảo toàn accessibility, responsive layout và skeleton parity.

## Non-Goals

- Không clone layout hero/section, dùng nhiều CTA marketing hoặc biến dashboard thành marketing page.
- Không biến mọi content block thành card, thêm floating decoration không phục vụ dữ liệu hoặc giảm mật độ table chỉ để giống reference.
- Không đổi API, permission, form validation hoặc workflow nghiệp vụ.
- Không thêm animation lớn hoặc motion trang trí nặng.
- Không dùng tài liệu này để thay thế component API rules, skill workflow hoặc technical guardrails.

## Design Principles

### 1. Calm Financial Precision

UI nên tạo cảm giác chính xác và có kiểm soát. Màu sắc, border, shadow và spacing đều cần tiết chế. Những thứ quan trọng như trạng thái lỗi, confidence, active status hoặc destructive action mới được phép nổi bật.

### 2. Surface Hierarchy Over Decoration

Reference đẹp vì surface rhythm rõ: nền yên, card nổi nhẹ, metric module gọn, metadata nhỏ. Khi áp dụng vào Signapse, mỗi surface phải có vai trò:

- Page shell định hướng.
- Card shell gom nội dung chính.
- Table surface đọc dữ liệu.
- Toolbar surface điều khiển view.
- Form surface nhập liệu.
- Workbench surface hỗ trợ phân tích.

### 3. Token First

Màu sắc và cảm giác nền phải đi qua semantic tokens hoặc shared app-level surfaces. Quy tắc thực thi nằm ở `Semantic Tokens`; feature-level class chỉ dùng khi cần hierarchy hoặc trạng thái nghiệp vụ riêng.

### 4. Dashboard Translation, Not Screenshot Copy

Reference là landing page. Signapse là dashboard. Khi có xung đột, ưu tiên dashboard:

- Bảng phải dễ scan hơn là đẹp như card marketing.
- Form phải rõ validation và pending state.
- Workbench phải giữ density và decision path.
- Navigation phải ổn định, không trang trí quá mức.

### 5. Light And Dark Parity

Light mode và dark mode phải là hai biến thể của cùng một direction. Không để light mode quá trắng phẳng hoặc dark mode quá đen chìm.

## Theme And Component Chrome

- Feature/shared code dùng default chrome của preset `radix-nova` qua wrappers trong `@/components/ui/`.
- `className` trên shadcn primitives chỉ dùng cho layout như width, max-width, flex/grid, gap, alignment, max-height, overflow, truncate hoặc responsive constraints.
- Không thêm `h-*`, `min-h-*`, `rounded-*`, padding, foreground/background, border, ring, shadow hoặc typography classes chỉ để đổi height, radius, color, border hay density mặc định của primitive.
- Khi cần control compact, ưu tiên variant/size sẵn có; chỉ hard-code height/radius khi không có option phù hợp và có product reason rõ.
- Wrapper trong `components/ui` có thể được bảo trì theo shadcn workflow, nhưng không nhận feature-specific visual customization.
- Wrapper shadcn mặc định phải giữ contract variant, size và chrome từ registry item của preset hiện tại.
- Không thêm variant, size hoặc chrome vào wrapper chỉ để phục vụ một feature, prototype hoặc trạng thái cục bộ. Ngoại lệ phải là quyết định design-system có nhu cầu dùng chung rõ ràng và được ghi nhận trong tài liệu này trước khi triển khai.

### Semantic Tokens

- `app/globals.css` và `tailwind.baseColor` trong `components.json` giữ neutral default của `radix-nova`.
- Không đổi `--primary`, `--accent`, `--sidebar-*`, `--chart-*`, radius hoặc wrapper chrome để sửa một vấn đề cục bộ.
- Màu feature đi qua semantic tokens hoặc shared app-level surfaces; không dùng raw palette tùy ý.
- Light và dark mode là hai biến thể của cùng một system, có contrast và hierarchy tương đương.
- Background grid hoặc depth decoration, nếu có, chỉ thuộc app shell/shared surface và phải rất nhẹ; không lặp ở từng card.
- Shadow tạo hierarchy nhẹ, không dùng để làm destructive/alert state nổi bật.

### Badge Semantics

- Chỉ dùng các variant mặc định `default`, `secondary`, `destructive`, `outline`, `ghost` hoặc `link`.
- Status không có variant tương ứng phải dùng built-in variant gần nhất và giữ text hoặc icon làm tín hiệu chính; không thêm `info`, `success`, `warning`, `danger` hoặc intent feature-specific vào shared `<Badge>`.
- Badge luôn có text hoặc icon hỗ trợ ý nghĩa; màu không phải tín hiệu duy nhất của trạng thái.

## Layout And Surface Composition

### App Shell

App shell giữ cảm giác yên, có khoảng thở và không tạo quá nhiều border cạnh tranh. Page padding phải đủ thoáng trên desktop nhưng không làm mobile chật.

- Pages trong `app/[lang]/(main)` dùng cardless workspace từ parent padding layout.
- Breadcrumb trong app header là page identity hiển thị chính cho simple pages; sửa breadcrumb mapping thay vì thêm body heading trùng lặp.
- Mỗi route vẫn phải có đúng một `<h1>` ngữ nghĩa. Heading có thể là `sr-only` khi trùng hoàn toàn với breadcrumb; sau client navigation, focus chuyển đến heading hoặc main content mà không làm cuộn trang bất ngờ.
- Top loading bar luôn bật cho page transitions.

### Content Width Modes

Content-width policy chỉ áp dụng cho vùng main content của `app/[lang]/(main)`; header và sidebar luôn giữ fluid. Mỗi route có một primary content mode, được chọn theo decision path chính của route thay vì chỉ vì route có table hoặc chart nhúng.

- `fluid` là default: list, table và admin data surface lấp đầy vùng content đã có gutter từ app shell. `fluid` không có nghĩa là full-bleed sát viewport hoặc sidebar.
- `bounded` dành cho overview và decision surface không cần canvas hoặc data grid cực rộng. Content dùng toàn bộ chiều rộng khả dụng cho tới khi đạt `100rem`, sau đó căn giữa; không dùng breakpoint toggle chỉ để bật/tắt cap. Trading Intelligence Dashboard là ví dụ chuẩn.
- `canvas` dành cho interactive workbench mà chiều ngang và/hoặc chiều cao là một phần của task, như Graph View, Market Charts và editor. Canvas không có page-level max-width và có thể sở hữu chiều cao theo ngữ cảnh, nhưng không được tạo horizontal page overflow ngoài surface chủ đích.
- Wide table hoặc chart nhúng không tự đổi mode của page. Trong `bounded`, ưu tiên summary, reflow hoặc horizontal scroll cục bộ trong table surface; không dùng negative margin hay full-bleed escape. Nếu data width là decision path chính, nó thuộc dedicated `fluid` hoặc `canvas` route.
- Loading, empty, error và permission-denied state kế thừa content mode của route; một inner state panel không tự đổi width mode hoặc hierarchy của page.
- `100rem` và mode semantics thuộc shared app-level content-width contract. Feature route chỉ chọn mode, không thêm page-level `max-width` tùy ý hoặc tạo giá trị width cạnh tranh.

### Sidebar And Header

Sidebar là navigation vận hành, không phải brand hero. Cần sạch, ít nhiễu, active state rõ.

- Real active item dùng `sidebar-primary` và `sidebar-primary-foreground` như neutral selected surface, không giống CTA/inverse button.
- Hover dùng `sidebar-accent`; focus-visible giữ `sidebar-ring`. Focus là accessibility state, không trộn với selected/current state.
- Open parent không có background state; expanded state chỉ cần chevron rotation.
- Active item và parent có active child không tăng font weight chỉ vì state.
- Không thêm active-color token, dùng global `accent` hoặc đổi `--sidebar-*` để sửa cục bộ.
- Density thuộc `AppSidebar`; child list giữ left indent rõ, mở rộng hợp lý và dùng `py-1`.
- Không thêm decoration cạnh tranh với content; label tiếng Việt phải đúng dấu và nhất quán.

### Page And Card Surfaces

- Không bọc toàn bộ page trong main `<Card>` chỉ để lặp breadcrumb title.
- Chỉ dùng `<Card>` cho inner surface có boundary thật như form section, detail panel, dashboard tile, access-denied/error panel hoặc repeated item.
- Không dùng nested Card chỉ để lấy border/radius nếu đã có shared surface phù hợp.
- List page render toolbar, `AppListTable` và pagination trực tiếp, không thêm outer Card/Header/Title/Description/Separator.

### List Table Surface

Table là bề mặt quan trọng nhất của dashboard. Reference có nhiều card metric, nhưng trong Signapse table phải ưu tiên scan dữ liệu.

Translation:

- Shell nhất quán qua `AppListTable`; component này cung cấp standard `mt-4`, còn `AppListToolbar` không sở hữu bottom margin.
- Header row dịu, không quá đậm.
- Table dùng shared header và empty-state components; empty state nằm trong table surface.
- Skeleton phải giống bố cục table thật.
- Row hover nhẹ, không làm mất contrast.
- Multiline cell override default nowrap cục bộ; long text phải có wrapping, truncation hoặc line-clamp strategy rõ. Nội dung bị truncate phải có cách xem đầy đủ bằng tooltip, expand hoặc detail view và không chỉ phụ thuộc hover.
- Boolean toggle trong row dùng compact status capsule có label, switch, `aria-label`, pending/disabled behavior ổn định và skeleton cùng hình dạng.
- Plain timestamp dùng icon `size-3` và `text-xs text-muted-foreground tabular-nums`, không dùng badge hay strong value styling.
- Sortable header phải dùng control keyboard-accessible; header cell expose `aria-sort` đúng với trạng thái hiện tại.
- Trên viewport nhỏ, ưu tiên cột phục vụ quyết định và ẩn/gộp metadata thứ cấp. Wide table chỉ horizontal scroll bên trong table surface, không làm page overflow.

### Toolbar

Toolbar là control surface. Nó nên gọn, có nhóm trái/phải rõ, không nổi bật hơn table.

Translation:

- Layout responsive dùng `flex-col sm:flex-row sm:justify-between`.
- Leading area chứa primary action và search; trailing area chứa filter, sort và page size.
- Primary controls giữ default shadcn size/chrome; không thêm custom height/radius/padding hoặc `size="sm"` chỉ để đổi density.
- Mỗi surface chỉ có một primary action. Secondary actions giảm emphasis; destructive actions tách khỏi primary flow hoặc nằm trong overflow menu khi toolbar dày.

### Forms

Form cần rõ field, description, validation và pending state.

Translation:

- Form dùng `AppFormShell`, `AppFormShellBody`, `AppFormShellFooter`; chọn width `sm` cho form đơn giản, `md` cho CRUD phổ biến và `lg` cho form dày.
- Standalone create, update và profile route dùng `AppFormShell` như primary Form surface: giữ scale `sm`/`md`/`lg` và căn giữa trong content pane. Skeleton mirror cùng alignment; dialog, drawer, side panel và form nhúng giữ local surface pattern, không kế thừa rule này.
- Account profile có thể chọn `surface="plain"` trên `AppFormShell` để giữ focused-form width lớn và căn giữa theo gutter của app nhưng bỏ outer border, radius, background và shadow; surface card vẫn là mặc định cho các consumer hiện có.
- Plain profile giữ identity row và grid responsive: avatar/fallback cùng trục nội dung, field pairs dùng hai cột khi đủ rộng và reflow một cột trong container hẹp hoặc zoom; email chiếm full row.
- Body dùng `FieldGroup`, `FieldSet` và `gap-*`; flex/grid layouts dùng `gap-*`, không dùng `space-y-*`.
- Description dùng muted foreground.
- Footer card tách khỏi body bằng border/subtle background; footer plain dùng top divider trong suốt, không tạo thêm card background, và phải giữ cùng footprint khi pending.
- Mỗi input có visible label; placeholder không thay thế label. Required state, helper text và format yêu cầu phải rõ trước khi submit.
- Mọi field nhập text hoặc số có thể chỉnh sửa phải có placeholder phù hợp ngữ cảnh, áp dụng cho create, update, profile, dialog và inline edit. Ngoại lệ gồm field chỉ đọc, input kỹ thuật ẩn và control native không hỗ trợ placeholder như date/time/file.
- Placeholder cung cấp ví dụ hoặc gợi ý ngắn và dùng copy từ dictionary; giữ hướng dẫn quan trọng trong helper text hiển thị riêng. Giá trị mẫu nằm trong placeholder, không tự điền thành `value`/`defaultValue`.
- Dùng semantic input type và `autocomplete` phù hợp để hỗ trợ mobile keyboard và browser autofill.
- Field error nằm cạnh field, dùng `aria-invalid` và liên kết bằng `aria-describedby`; sau submit lỗi, focus chuyển đến field lỗi đầu tiên hoặc error summary khi có nhiều lỗi.
- Submit/save pending phải disabled và hiển thị `<Spinner>`.
- Submit lỗi không xóa dữ liệu hợp lệ đã nhập. Edit flow có ghost Cancel khôi phục initial data hoặc thoát an toàn; form dài hoặc quan trọng phải cảnh báo trước khi bỏ thay đổi chưa lưu.
- Switch trong create/update/detail dùng compact field treatment; row capsule, toolbar/workbench toggle, permission matrix và route-row switch giữ pattern riêng.

### Empty, Loading, Error, Permission

Các state này phải trông như một phần của system, không phải afterthought.

Translation:

- Empty dùng `<Empty>` và nằm đúng surface; phân biệt first-use empty với no-results do filter/search.
- Loading skeleton bám bố cục thật.
- Account profile loading skeleton và localized error/retry state dùng cùng plain surface, width, identity row, grid và footer alignment với form resolved; error không hiển thị raw exception.
- Loading, empty, error và permission-denied state giữ content-width mode của route, không tự co hẹp hoặc mở rộng page shell.
- Error copy tiếng Việt rõ, không kỹ thuật hóa quá mức, nêu recovery action như retry, sửa dữ liệu hoặc mở trợ giúp.
- Submit hoặc refresh lỗi không xóa input, filter hay context người dùng đang thao tác.
- Partial, stale hoặc offline state phải chỉ rõ dữ liệu nào chưa khả dụng và thời điểm cập nhật gần nhất; không trình bày dữ liệu cũ như dữ liệu live.
- Permission denied nói rõ quyền cần thiết nhưng không đổ lỗi người dùng.

### Workbench Screens

Các màn như market query hoặc graph view cần áp dụng direction thận trọng hơn list page vì nhiều nội dung đặc thù.

Translation:

- Giữ decision path rõ.
- Dùng surface hierarchy thay vì chia quá nhiều card cùng trọng lượng.
- Evidence, status, confidence, limitations cần dễ scan.
- Decorative atmosphere không được che mất canvas hoặc data.

### Data Visualization And Financial Data

- Chọn chart theo quyết định cần hỗ trợ: line cho trend, candlestick/OHLC cho giá giao dịch, bar cho so sánh; không dùng chart chỉ để trang trí.
- Axis, legend và tooltip phải nêu rõ đơn vị, timezone, time granularity và precision. Số, ngày, currency và percentage dùng localization formatters; phân biệt rõ `0`, giá trị âm và không có dữ liệu.
- Giá trị tăng/giảm, bullish/bearish, confidence hoặc anomaly không chỉ dựa vào đỏ/xanh; bổ sung sign, label, icon, shape hoặc line style.
- Legend, tooltip và data point tương tác phải dùng được bằng keyboard và tap, không chỉ bằng hover. Chart quan trọng cần text summary và table/detail alternative cho dữ liệu chính.
- Chart responsive bằng cách reflow, giảm tick hoặc ưu tiên series chính; không ép label nhỏ, xoay khó đọc hoặc tạo page overflow.
- Loading dùng skeleton cùng footprint; empty không render khung axis vô nghĩa; error có retry action và giữ context/range đang xem.
- Realtime view hiển thị current value, thời điểm cập nhật cuối và trạng thái stale. Khi dữ liệu cập nhật nhanh, cung cấp pause/freeze, tôn trọng `prefers-reduced-motion` và aggregate/downsample khi mật độ làm giảm readability hoặc interaction.

## Interaction And Navigation

### Dialog And Destructive Confirmation

Chọn overlay theo mục đích, không theo hình thức:

| Nhu cầu                                                    | Component            |
| ---------------------------------------------------------- | -------------------- |
| Form, lựa chọn hoặc tác vụ có thể hủy an toàn              | `<Dialog>`           |
| Xác nhận hành động quan trọng, khó hoặc không thể hoàn tác | `<AlertDialog>`      |
| Thông báo không cần chặn workflow                          | `<Alert>` hoặc toast |

- Mọi `Dialog` và `AlertDialog` phải có title hiển thị. Description phải giải thích mục đích, tác động hoặc hậu quả đủ để người dùng quyết định.
- Không dùng `AlertDialog` cho form, input, lựa chọn thông thường hoặc nội dung chỉ để đọc; các trường hợp này dùng `Dialog`.
- Dialog phải có cách đóng hiển thị rõ. Focus di chuyển vào overlay khi mở, bị giới hạn phù hợp trong overlay và trở về trigger hoặc điểm tiếp theo hợp lý khi đóng.
- Không hiển thị confirmation cho hành động dễ hoàn tác hoặc không có hậu quả đáng kể.

Delete confirmation tuân theo pattern sau:

- Trigger là button có label dùng `variant="destructive"`; icon dùng `Trash2Icon` và `data-icon="inline-start"`. Icon-only trigger phải có accessible name và tooltip.
- Trong table row hoặc menu dày đặc, ưu tiên destructive menu item thay vì lặp nhiều destructive button nổi bật.
- Dùng `AlertDialogContent size="sm"` với `AlertDialogMedia`, `AlertDialogTitle`, `AlertDialogDescription` và `AlertDialogFooter`.
- `AlertDialogMedia` dùng `Trash2Icon` với semantic tokens `bg-destructive/10 text-destructive`; không thêm raw palette hoặc manual dark-mode overrides.
- Title hỏi trực tiếp về đối tượng cần xóa. Description nêu rõ đối tượng, dữ liệu liên quan và tính không thể hoàn tác; tránh copy chung chung như “Bạn có chắc không?”.
- Cancel đứng trước Delete trong DOM và dùng `variant="outline"`. Confirm action dùng `variant="destructive"`; không tự dựng destructive chrome bằng `className`.
- Copy phải lấy từ dictionary. Không hardcode label, title, description hoặc pending text trong feature component.
- Với async delete, dùng controlled state, giữ dialog mở trong khi pending hoặc khi có lỗi, disable cả Cancel và Delete, hiển thị `<Spinner>`, chỉ đóng sau thành công. Nếu chặn hành vi đóng mặc định của `AlertDialogAction`, gọi `event.preventDefault()` trước khi chạy action.
- Async delete không được khóa dialog vô hạn. Timeout hoặc error phải bật lại controls, hiển thị lỗi có recovery path và cho phép retry hoặc cancel.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button type="button" variant="destructive">
      <Trash2Icon data-icon="inline-start" />
      {t.delete}
    </Button>
  </AlertDialogTrigger>

  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogMedia className="bg-destructive/10 text-destructive">
        <Trash2Icon />
      </AlertDialogMedia>
      <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
      <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel variant="outline">
        {dictionary.common.cancel}
      </AlertDialogCancel>
      <AlertDialogAction variant="destructive">{t.delete}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Feedback And Recovery

- Submit thành công có feedback ngắn và chuyển đến destination phù hợp mà không phá Back behavior hoặc context cần giữ.
- Pending state không thay đổi layout đột ngột; spinner hoặc progress thay feedback cùng vị trí và chỉ disable phạm vi control liên quan.
- Error hiển thị gần nguồn phát sinh, nêu nguyên nhân có ích và recovery action; timeout phải cho retry hoặc cancel.
- Toast và dynamic status không cướp focus, được thông báo qua live region phù hợp và không thay thế field-level hoặc blocking error.

### URL State, Search And Pagination

- Filter, search, sort, `page` và `size` nằm trong URL để deep link, refresh và Back/Forward khôi phục đúng view.
- Khi search, filter, sort hoặc page size đổi, xóa param rỗng và reset `page` về `1` khi page hiện tại có thể không còn hợp lệ.
- Search dùng `type="search"`, có label hiển thị hoặc `sr-only`, debounce khoảng `300ms` và không cần Search button nếu không có business requirement.
- Search nằm ở leading area, full-width trên mobile và có width giới hạn trên desktop; pending feedback giữ nguyên footprint của control.
- Page-size selector nằm trong trailing controls với options `10`, `20`, `50`, `100`, mặc định `10`; không lặp trong footer pagination.
- Sort/page-size pending chỉ disable control liên quan và không làm toolbar thay đổi layout.

### Quick Detail Overlay

Signapse entity quick detail là local, modal reading overlay cho một entity đang được xem; không phải ecommerce “quick view”, không phải global intercepted route và không phải mode mới của shared `Drawer` primitive.

#### Scope And Resolver

- Chỉ `event` và `news-article` có quick detail. Owner được chấp thuận hiện tại là Dashboard, Graph View và Market Charts; màn mới chỉ được thêm owner khi giữ context nền có giá trị rõ ràng, qua design review/proposal riêng.
- Graph View node inspector vẫn là summary/decision surface. Không gọi Event quick detail là “Inspector” để tránh lẫn với component đó.
- Mỗi owner có tối đa một entity quick detail đang mở; không nested overlay, không quick-detail back-stack và không thay nội dung bằng entity khác từ cross-entity action.
- Resolver là policy duy nhất: entity kind chọn profile (`event` → **Event inspection**, `news-article` → **Article reader**); host surface và effective CSS viewport chọn placement. Trigger/caller không tự truyền mode, direction hoặc width tùy ý.
- Open/close overlay không đổi URL và không dùng `router.back()`, `router.push()` hoặc `router.replace()` chỉ để quản lý drawer state. Canonical routes `/events/{id}` và `/news-articles/{id}` vẫn là full detail pages cho normal link, reload, copied URL, direct navigation và list/detail CRUD.

#### Profiles And Content

- **Event inspection** là scan surface: title, status, concise description, key facts, tối đa bốn evidence và bốn related assets. Không biến nó thành reader/lịch sử đầy đủ; canonical Event page là nơi xem sâu hơn.
- **Article reader** hiển thị toàn bộ bài theo thứ tự đọc: title, provenance, publication metadata, original-source link, optional feature image và safe Markdown. Không thêm linked-event review, operational panel hay page shell.
- Article prose luôn dùng readable measure `max-width: 72ch`, dù outer sheet rộng hơn. Image/media có thể rộng theo reader panel; table, code và content intrinsically wide chỉ scroll trong surface chủ đích, không tạo page overflow.
- Khi Event inspection nằm trong bottom sheet, cụm facts/evidence/asset có `max-width: 64rem` và căn giữa. Cross-entity evidence action đi tới canonical News route trong cùng tab, không mở Article reader lồng bên trong Event inspection.
- Canonical “Open full event/article” là action internal cùng tab trong sticky header. Original source là action provenance thứ cấp trong Article reader, không thay thế canonical action.

#### Placement And Geometry

| Effective CSS viewport | Event inspection | Article reader |
| --- | --- | --- |
| Mọi owner được chấp thuận từ `1440px` | right-side sheet bám viewport, tối đa `32rem`, cao `100dvh` | right-side sheet bám viewport, tối đa `44rem`, cao `100dvh` |
| Mọi owner được chấp thuận từ `768px` đến dưới `1440px` | bottom sheet, content-fit, `max-height: min(60dvh, 36rem)` | bottom sheet, `height: min(72dvh, 48rem)` |
| Mọi owner dưới `768px` | bottom sheet, content-fit, tối đa `90dvh` | bottom sheet, cao `90dvh` |

- Quick Detail side sheet ở wide desktop bám cạnh phải của viewport overlay đang hoạt động; không owner nào tự chọn placement hoặc bị giới hạn bởi grid 12 cột/module. Ngưỡng `1440px` dựa trên effective CSS viewport, không đổi theo trạng thái sidebar.
- Fullscreen Market Charts giữ fullscreen và render overlay trong fullscreen portal container; đây là exception theo host, không phải profile mới.
- Resize hoặc browser zoom re-resolve placement theo effective CSS viewport, giữ entity, modal focus và vị trí cuộn. Transition không phát lại opening animation và phải tôn trọng `prefers-reduced-motion`.

#### Interaction, State And Accessibility

- Overlay là modal. Header sticky có localized entity/state title, Close thấy được và canonical action; trên mobile có thể xếp hai hàng. Không thêm profile prefix hoặc generic owner/source description chỉ để phân loại overlay. Không dùng sticky footer chỉ để lặp action.
- Khi mở, focus vào Close; khi đóng bằng Close, Escape, backdrop trên desktop hoặc swipe-down trên mobile, focus trở về đúng trigger. Focus trap, keyboard order và visible focus phải giữ đúng khi placement đổi do resize/zoom.
- Body là vùng scroll duy nhất. Loading, error, missing và access-denied giữ profile/placement của entity đích; skeleton mirror resolved geometry và overlay không remount/animate lần hai khi dữ liệu về.
- Mọi state có accessible title; loading được công bố busy, còn loading/error/missing/access-denied feedback được công bố trong body bằng state-specific text và live-region phù hợp.
- Dữ liệu là snapshot trong một lần mở: không tự refetch/reflow nội dung khi người dùng đang đọc; lần mở mới hoặc retry chủ đích mới lấy dữ liệu mới. Đóng rồi mở lại bắt đầu từ đầu nội dung.

## Content And Language

- Mỗi screen chỉ hiển thị text giúp người dùng ra quyết định hoặc hoàn thành task; không lặp ý nghĩa của breadcrumb, control hoặc metric.
- Tránh decorative badge, body heading lặp page identity, hero copy, `CardDescription`, placeholder panel hoặc implementation-detail copy không có decision value.
- Dense data screen ưu tiên controls và primary data; long copy, roadmap/future notes và legal/vendor notes chuyển sang tooltip, help text, footer legal area hoặc docs.
- User-facing copy phải được localization và tiếng Việt phải tự nhiên, đúng dấu; technical instructions chịu trách nhiệm quy định helper cụ thể.
- Vendor/license attribution phải ở vị trí người dùng truy cập được khi rời main surface.

## Accessibility And Responsive Behavior

- Mục tiêu là WCAG 2.2 AA. Normal text đạt contrast tối thiểu `4.5:1`; large text, component boundary, state indicator và focus indicator đạt tối thiểu `3:1` trong cả light và dark mode.
- Ưu tiên native semantic elements. Mỗi page có một `<h1>`, heading hierarchy tuần tự và skip link đến main content khi có repeated navigation.
- Mọi interaction dùng được bằng keyboard với tab order hợp lý; focus luôn nhìn thấy, không bị sticky surface che và được quản lý đúng sau route change.
- Dialog/overlay restore focus an toàn; icon-only control có accessible name. Meaningful image có `alt`, decorative image dùng `alt=""`.
- Mọi control vào/thoát fullscreen hoặc mở rộng/thu gọn surface theo fullscreen pattern phải dùng nhất quán Lucide `Maximize` khi mở rộng và `Minimize` khi thu gọn; không dùng các biến thể `Expand`, `Maximize2` hoặc `Minimize2` cho hành động này.
- Search, form controls và switches có label phù hợp; error và dynamic status vừa hiển thị trực quan vừa được thông báo qua `aria-live`, `role="alert"` hoặc primitive tương đương.
- Không dùng color làm tín hiệu duy nhất; status cần thêm text, icon, sign, shape hoặc pattern phù hợp.
- Icons trong button dùng wrapper `data-icon` treatment.
- Interactive target tối thiểu `24×24` CSS px; ưu tiên `44×44` px trên mobile hoặc coarse pointer mà không làm giảm density desktop.
- Motion phải có mục đích, không block interaction và tôn trọng `prefers-reduced-motion`.
- Skeleton và Suspense fallback mirror final layout ở mọi breakpoint.
- Desktop, tablet, mobile và zoom `200%` giữ hierarchy, không mất nội dung/chức năng và không tạo horizontal overflow ngoài surface chủ đích.

## UI Review Criteria

Khi implement hoặc review UI, kiểm tra các state và breakpoint liên quan:

- Light mode và dark mode.
- Sidebar mở rộng và collapsed.
- Content-width mode khớp primary task của route: `bounded` chỉ cho overview/decision surface, `fluid` cho list/table/data surface và `canvas` cho interactive workbench.
- Desktop, tablet và mobile width, bao gồm sidebar mở rộng/collapsed tại 1440, 1920 và 2560px.
- Entity quick detail: resolver `event`/`news-article`, approved owner, một modal duy nhất, canonical URL không đổi khi mở/đóng, đúng profile content và không nested/back-stack.
- Entity quick detail placement tại `767px`, `768px`, `1439px`, `1440px`, desktop rộng và zoom `200%`; mọi owner dùng side sheet chung từ `1440px`, bottom-sheet fallback dưới ngưỡng và fullscreen giữ portal cục bộ.
- Entity quick detail accessibility: sticky header có entity/state title/Close/canonical action, không có profile prefix hoặc generic header description, body là scroll region duy nhất, focus vào Close rồi quay về trigger, dismissal keyboard/pointer/touch, state busy/error/denied được công bố và reduced motion không replay opening animation.
- List normal state.
- List empty state.
- Loading skeleton.
- Error boundary.
- Permission denied.
- Create form.
- Edit form.
- Delete confirmation.
- Workbench idle/loading/success/error.
- Chart loading/empty/error, keyboard interaction, text/table alternative và responsive behavior.
- Realtime current value, last-updated, stale state, pause/freeze và reduced motion.
- Semantic heading, skip link, route-change focus, focus ring và keyboard navigation.
- Contrast light/dark, non-color status cues, target size và zoom `200%`.
- Form labels, placeholder khi field rỗng theo phần Forms (create và edit sau khi xóa giá trị), announced errors, recovery action, unsaved-change protection và data retention sau lỗi.
- Bounded content giữ cap và căn giữa; fluid/canvas không bị page-level cap; loading, empty, error và permission-denied state mirror mode của content thật.
- Horizontal overflow chỉ xuất hiện bên trong surface chủ đích.
- Không có mojibake.
- Không có UI copy tiếng Anh mới hướng người dùng, trừ tên riêng hoặc thuật ngữ kỹ thuật cần thiết.

Ưu tiên finding theo các UI drift category: shadcn chrome, toolbar/table spacing, main-card shell, form shell, table/chart surface, skeleton mismatch, URL/search state, accessibility regression, stale-data ambiguity, recovery gap, UI copy noise và non-Vietnamese UI copy. Nếu visual direction làm giảm readability hoặc data density cần thiết, ưu tiên readability và decision path.
