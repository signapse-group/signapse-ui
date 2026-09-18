# Market Chart Learnings From VNBrokerChart

- Loại tài liệu: Research note
- Độc giả chính: Frontend, product, QA
- Phạm vi: Bài học từ `vietdungiitb/vnbrokerchart` có thể áp dụng cho market chart của Signapse
- Không phải là: Đề xuất thay chart engine, migration plan, hay task triển khai đã được phê duyệt
- Ngày nghiên cứu: 2026-05-28

## Nguồn Tham Khảo

- Repo: <https://github.com/vietdungiitb/vnbrokerchart>
- Snapshot đã đọc: `498eb9875530d60f6baea2c12d67ee90b3bd6da3`
- License: MPL-2.0
- Các file/chủ đề đã soi:
  - `README.md`
  - `src/widget/VNBrokerChart.tsx`
  - `src/lib/core/calculators/enrichData.ts`
  - `src/lib/core/calculators/indicatorComputation.ts`
  - `src/lib/core/seriesValueResolver.ts`
  - `src/lib/core/hooks/useDynamicPanes.ts`
  - `src/lib/core/registry/SeriesRegistry.ts`
  - `src/lib/core/replay/BarReplayController.ts`
  - `src/lib/drawing/*`
  - `quality/QUALITY.md`

## Tóm Tắt

`vnbrokerchart` không chỉ là một wrapper chart. Repo này đang xây một charting library riêng cho thị trường chứng khoán Việt Nam: React 19, D3 v7, SVG cho axes, Canvas cho series, indicator store riêng, drawing layer có finite-state interaction, replay controller và bộ test tương đối sâu cho drawing, indicator, replay.

Signapse hiện đang đi theo hướng khác và hợp lý hơn với dashboard quản trị: dùng `klinecharts` làm chart engine, giữ logic backend contract, annotation, lazy history loading và workbench UI trong feature `market-charts`.

Kết luận chính: không nên thay KLineChart bằng engine tự build. Điểm đáng học nằm ở cách `vnbrokerchart` tổ chức chart state, derived data, drawing state và regression tests.

## So Sánh Nhanh

| Trục so sánh     | VNBrokerChart                                                  | Signapse hiện tại                                                        | Nhận định                                                                   |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Chart engine     | Tự xây trên D3 + SVG/Canvas                                    | KLineChart adapter trong `market-chart-canvas.tsx`                       | Signapse nên giữ engine hiện tại để tránh phình phạm vi                     |
| Indicator        | SSOT `enrichData()` + computation plan + canonical key         | KLineChart built-in indicators `MA`, `EMA`, `BOLL`, `MACD`, `RSI`, `KDJ` | Nên học pattern SSOT nếu thêm custom signal hoặc AI indicator               |
| Pane layout      | `PaneDescriptor`, dynamic panes, height ratio, split scale     | Candle pane + volume pane + indicator panes tạo trực tiếp qua KLineChart | Nên descriptor hóa khi số pane/indicator tăng                               |
| Drawing          | State machine, history command, snap, hit-test, storage, alert | KLineChart overlay API + toolbar state nhẹ                               | Hiện tại đủ dùng; nên tách state nếu thêm saved drawings, undo, alert       |
| Annotation/event | Không phải core trong bản community                            | Annotation group Signapse gắn với event, evidence, reaction              | Signapse có lợi thế sản phẩm riêng; không nên bị cuốn vào clone TradingView |
| Replay           | `BarReplayController` domain class độc lập React               | Chưa có                                                                  | Hay cho tương lai: replay quanh event, news, market reaction                |
| Quality          | Test sâu cho core logic chart                                  | Market chart chủ yếu verify qua lint, typecheck, static behavior         | Nên bổ sung deterministic tests cho helper chart                            |

## Áp Dụng Hiện Tại

### 1. Tách Chart View Model Khỏi Canvas Adapter

Signapse đã có các helper riêng:

- `app/[lang]/(main)/market-charts/market-chart-annotations.ts`
- `app/[lang]/(main)/market-charts/market-chart-drawing.ts`
- `app/[lang]/(main)/market-charts/market-chart-canvas.tsx`

Hướng đáng học từ `vnbrokerchart`: đẩy thêm logic domain ra khỏi canvas adapter, để canvas chỉ làm việc với KLineChart lifecycle và rendering boundary.

Ứng dụng gần:

- Giữ `createMarketChartAnnotationGroups()` là helper deterministic, không trộn vào component state.
- Tách thêm các helper đang nằm trong canvas nếu chúng có logic domain rõ ràng: merge candles, normalize candles, request older history, map timeframe sang period.
- Viết test cho helper thay vì chỉ tin vào visual smoke.

Giá trị:

- Giảm rủi ro khi KLineChart beta đổi API.
- Dễ test annotation/lazy history mà không cần browser.
- Giữ requirement cũ: chart vendor types không rò rỉ ra ngoài adapter.

### 2. Tạo Canonical Key Cho Derived Signal

`vnbrokerchart` dùng canonical indicator key để đảm bảo cùng params thì cùng data, bất kể consumer nào đọc. Đây là bài học tốt nếu Signapse thêm overlay không có sẵn trong KLineChart.

Ứng dụng gần:

- Nếu thêm AI-derived overlay như `confidence`, `impact`, `reactionScore`, `newsDensity`, nên định nghĩa key ổn định theo `type + params + source`.
- Presentation như màu, visibility, opacity không được tạo key dữ liệu mới.
- Derived values nên được materialize một lần ở view-model layer, không tính lại trong render.

Ví dụ concept:

```text
MarketChartDerivedSeriesKey
  = reaction-impact:window=7d:assetId=...
  = news-density:bucket=1h:source=event-evidence
```

### 3. Descriptor Hóa Indicator/Panes Khi UI Phức Tạp Hơn

Signapse hiện chỉ cần toggle indicator đơn giản. Nếu toolbar sau này có preset, saved layout, pane resize hoặc nhiều indicator riêng, nên học `PaneDescriptor` của `vnbrokerchart`.

Ứng dụng gần:

- Chưa cần custom pane engine.
- Có thể tạo descriptor nhỏ cho Signapse:

```text
MarketChartPaneDescriptor
  id
  kind: candle | volume | indicator
  visible
  height
  indicators[]
```

Giá trị:

- Toolbar chỉ update descriptor.
- Canvas adapter sync descriptor vào KLineChart.
- Tests có thể assert descriptor -> KLineChart actions dự kiến.

### 4. Thêm Regression Tests Cho Chart Helpers

`vnbrokerchart` mạnh ở việc test drawing history, snap, replay và indicator resolver. Signapse nên lấy tinh thần này cho helper hiện có.

Ứng dụng gần:

- Test `createMarketChartAnnotationGroups()`:
  - group annotation vào nến gần nhất
  - bỏ annotation nằm ngoài candle range
  - direction thành `MIXED` khi nhiều hướng
  - priority high khi có nhiều annotation hoặc severity cao
- Test merge lazy history:
  - prepend nến cũ hơn, dedupe theo time
  - không làm mất annotation đã load
  - xử lý empty older response và exhausted state
- Test drawing config:
  - map tool -> overlay name
  - custom circle/rectangle template có `totalStep` và figure đúng

Giá trị:

- Market chart có nhiều logic phụ thuộc data. Test helper sẽ bắt regression tốt hơn screenshot smoke.
- Giảm phụ thuộc vào Clerk/auth/browser khi verify.

### 5. Giữ Drawing Hiện Tại Gọn, Nhưng Tách Command Surface Nếu Mở Rộng

KLineChart overlay API đang đủ cho tool hiện có: horizontal line, trend line, channel, fibonacci, circle, rectangle. Chưa có lý do để copy drawing layer của `vnbrokerchart`.

Ứng dụng gần:

- Giữ overlay implementation hiện tại.
- Nếu thêm delete/lock/visible/magnet tiếp, gom thành command surface rõ nghĩa:
  - `setDrawingTool`
  - `deleteSelectedDrawing`
  - `setDrawingsLocked`
  - `setDrawingsVisible`
  - `setDrawingMagnet`
- Nếu thêm undo/redo/saved drawings, lúc đó mới tạo reducer/history riêng.

## Có Thể Áp Dụng Tương Lai

### 1. Saved Chart Layouts Và Indicator Presets

Khi người dùng cần lặp lại workflow phân tích, Signapse có thể thêm preset layout:

- basic price + volume
- event analysis
- momentum
- high-volatility watch
- AI reaction review

Học từ `vnbrokerchart`:

- Layout là state có version.
- Pane/series có id ổn định.
- Default panes được normalize khi stored layout cũ thiếu field mới.

Cần một task riêng vì chạm UI state, local persistence và khả năng migrate schema.

### 2. Replay Quanh Event/News

`BarReplayController` là pattern rất phù hợp với định hướng Signapse nếu muốn xem diễn biến thị trường quanh một sự kiện.

Ý tưởng sản phẩm:

- Chọn annotation/event.
- Chart nhảy về vùng trước event.
- Replay từng nến sau event để xem phản ứng giá/volume.
- Kết hợp panel reaction/evidence đang có.

Kiến trúc nên học:

- Replay controller là domain class độc lập React.
- State gồm `currentIndex`, `visibleData`, `currentBar`, `progress`, `speed`, `isPlaying`.
- Component chỉ subscribe và render UI.

Không nên làm trước khi có nhu cầu sản phẩm rõ, vì sẽ thêm state và control phức tạp.

### 3. Drawing History, Storage Và Alert

Nếu Signapse chuyển drawing từ công cụ tạm thời sang workspace phân tích thật, nên học drawing architecture của `vnbrokerchart`.

Tính năng tương lai:

- undo/redo
- saved drawings theo `assetId + timeframe + workspace`
- copy/paste drawing
- trendline alert
- drawing list panel
- batch visibility/lock

Kiến trúc nên học:

- Drawing state machine riêng.
- Drawing history command có `before/after` để undo/redo.
- Serialization có version.
- Hit-test/snap được test bằng unit tests.

Rủi ro:

- Nếu copy trực tiếp sẽ vướng license MPL-2.0 và mismatch với KLineChart.
- Nên thiết kế Signapse-native API dựa trên overlay model hiện tại.

### 4. Custom Derived Overlays Cho AI Workflow

KLineChart có indicator kỹ thuật có sẵn, nhưng Signapse có domain riêng: event, narrative, market reaction, confidence, evidence density.

Tương lai có thể thêm:

- event impact band
- confidence heat lane
- evidence density histogram
- reaction direction ribbon
- narrative regime background zones

Học từ `vnbrokerchart`:

- Registry/descriptor giúp thêm series mà không hardcode tất cả vào component chính.
- Tooltip/value resolver phải đọc cùng nguồn canonical.
- Y-axis/extents phải được tính từ accessor rõ ràng, không dựa vào UI state.

### 5. Quality Gate Riêng Cho Market Chart

`vnbrokerchart` có `quality/QUALITY.md` nhấn mạnh data fidelity, SSOT drift, viewport/backfill math và smoke evidence. Signapse có thể tạo checklist nhẹ hơn cho market chart khi chart tiếp tục mở rộng.

Nội dung nên có:

- chart vendor boundary không rò rỉ
- helper data có unit test
- lazy history không duplicate/mất candles
- annotation grouping có deterministic tests
- visual smoke là user-owned nếu cần auth/backend data
- không thêm fake chart data/copy vào skeleton

## Không Nên Áp Dụng Lúc Này

### Không Thay KLineChart Bằng D3 Engine Riêng

Lý do:

- Signapse là admin/AI trading signal dashboard, không phải charting library.
- KLineChart đã đáp ứng candle, volume, indicators, drawing overlays, lazy loading.
- Tự build engine sẽ tạo surface bug lớn: pan/zoom, axis, touch, resize, crosshair, performance, accessibility, theming.
- Repo `vnbrokerchart` còn mới và đang có community/pro split; việc đưa vào production cần đánh giá độc lập.

### Không Copy Drawing Layer Trực Tiếp

Lý do:

- License MPL-2.0 cần cân nhắc kỹ nếu copy source.
- Drawing layer của `vnbrokerchart` được thiết kế quanh chart engine riêng.
- Signapse đang dùng KLineChart overlay; copy sẽ tạo hai interaction model song song.

### Không Thêm Indicator Catalog 30+ Loại

Lý do:

- Signapse cần insight gắn với event/evidence/AI reaction hơn là đầy đủ indicator như terminal trading.
- Nhiều indicator sẽ tăng UI noise và phải thêm i18n, docs, tests, presets.
- Nên ưu tiên indicator nào hỗ trợ quyết định của operator.

## Hướng Đề Xuất Nếu Muốn Biến Thành Change

Có thể tách thành các task độc lập, theo thứ tự rủi ro tăng dần:

1. `harden-market-chart-helper-tests`
   - Thêm tests cho annotation grouping, candle merge, lazy-history request helpers và drawing overlay mapping.
   - Không đổi UI.

2. `extract-market-chart-view-model`
   - Tách logic mapping candles, annotations, lazy history và indicator descriptors ra khỏi canvas component.
   - Giữ KLineChart là engine.

3. `support-market-chart-layout-presets`
   - Thêm descriptor/preset cho panes và indicators.
   - Cần UX cho toolbar/preset selection.

4. `add-event-replay-mode`
   - Thêm replay quanh annotation/event.
   - Cần product design và browser QA.

5. `persist-market-chart-drawings`
   - Lưu drawing theo workspace/asset/timeframe.
   - Cần backend/local persistence decision, undo/redo và destructive confirmation.

## Kết Luận

Điểm đáng học nhất từ `vnbrokerchart` là kỷ luật kiến trúc: chart data có SSOT, pane/series có descriptor, drawing có state machine, replay là domain class, và core logic được test độc lập React.

Với Signapse, đường đi tốt nhất là giữ KLineChart, nhưng đẩy dần logic domain ra khỏi canvas adapter và thêm deterministic tests. Các tính năng lớn hơn như layout presets, replay event và persisted drawings nên đi qua task riêng.
