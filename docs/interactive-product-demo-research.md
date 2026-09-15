# Interactive product demo và animated product UI cho landing page

Ngày nghiên cứu: 2026-09-15. Phạm vi: nghiên cứu kỹ thuật và đề xuất kiến trúc Next.js; không triển khai hay sửa landing page hiện có. Các cấu trúc và timing đề xuất bên dưới là thiết kế của báo cáo, không phải reverse-engineering mã nguồn Linear.

## Kết luận

Với giao diện SaaS gồm bảng, card, menu, bộ lọc và panel, chọn HTML/CSS/React làm bề mặt chính; dùng dữ liệu mẫu xác định và một bộ điều phối nhỏ để kể một workflow. CSS xử lý hover/focus đơn giản; Motion xử lý enter/exit, layout và chuyển động theo state. Chỉ chọn GSAP khi cần timeline nhiều lớp hoặc scroll scrubbing phức tạp. Canvas/WebGL phù hợp hơn với đồ họa dày đặc, shader và 3D. Video phù hợp với câu chuyện tuyến tính cần độ trung thực cao nhưng không cần tương tác bên trong UI.

Đây là khuyến nghị kiến trúc dựa trên các khả năng được tài liệu chính thức xác nhận, không phải benchmark chứng minh một renderer luôn nhanh hơn renderer khác.

## 1. Phân biệt các mô hình

- **Animated product UI:** UI được dựng bằng code và chạy một kịch bản định sẵn. Không có thao tác có ý nghĩa thì đây vẫn là illustration có animation.
- **Interactive product demo:** người xem có thể đổi lựa chọn, mở chi tiết hoặc thực hiện một hành động và thấy UI phản hồi theo state.
- **Guided capture tour:** các màn hình đã chụp/ghi hoặc snapshot DOM được nối bằng hotspot. Có tương tác điều hướng, nhưng không nhất thiết có mô hình ứng dụng bên dưới.
- **Live sandbox:** dùng phần lớn ứng dụng thật trong môi trường thử nghiệm; fidelity cao nhưng chi phí tải, cô lập dữ liệu và bảo trì lớn hơn.

Với feature section, thường chỉ cần một happy path và một vài tương tác được chọn kỹ. Không cần sao chép router, auth, API client hay toàn bộ dashboard thật.

### Một ví dụ có xác nhận thư viện

[Linear](https://linear.app/) là tham chiếu cho cách đặt workflow sản phẩm trong section giới thiệu. Nội dung trang được đọc trong nghiên cứu có các cột trạng thái issue, activity, roadmap và các panel minh họa, đồng thời có tài nguyên ảnh. Bằng chứng này hỗ trợ nhận định có nội dung UI dạng HTML/text, nhưng không chứng minh toàn bộ visual đều là DOM animation, mọi control đều thao tác được, hay Linear dùng Motion/GSAP/XState. Báo cáo không có source nội bộ hoặc profiling runtime của Linear.

[Cursor](https://cursor.com/) công bố các vùng có mô tả interactive demo cùng text và button của giao diện IDE/CLI. [README chính thức của Motion](https://github.com/motiondivision/motion) xác nhận Motion chạy animation trên homepage Cursor. Đây là bằng chứng ở cấp website/thư viện; không chứng minh mọi scene dùng cùng một renderer hay state model. Bài học: dựng một lát cắt giao diện với nội dung mẫu đủ thuyết phục, đặt ngay cạnh lợi ích sản phẩm.

### Repo nền tảng

**Case study sát nhất:** [Vercel virtual product tour (2023)](https://vercel.com/blog/designing-the-vercel-virtual-product-tour) công bố UI tương tác, `DemoContext` với `index/subIndex`, CSS animation, xử lý completion và mobile cards. Bài học: sequence cần một nguồn state; mobile cần bố cục riêng.

**Đối chiếu 3D:** [Resend qua Spline](https://blog.spline.design/how-resend-uses-spline-for-3d-design) dùng cube tương tác và React integration. Đây là scene thương hiệu, không phải mô phỏng bảng/menu SaaS.

**Recreation có code:** [Linear vaporwave bằng React Three Fiber](https://github.com/MaximeHeckel/linear-vaporwave-react-three-fiber) và [bài kỹ thuật của tác giả](https://blog.maximeheckel.com/posts/vaporwave-3d-scene-with-threejs/) phù hợp học 3D/renderer. Đây là bản tái dựng của tác giả độc lập, không phải mã nguồn hay bằng chứng stack production của Linear.

- [motiondivision/motion](https://github.com/motiondivision/motion): nền tảng DOM/React motion, gesture, layout và sequence.
- [greensock/react](https://github.com/greensock/react): lifecycle/cleanup cho timeline GSAP trong React.
- [statelyai/xstate](https://github.com/statelyai/xstate): state machine và actor khi workflow có nhiều nhánh.
- [magicuidesign/magicui](https://github.com/magicuidesign/magicui): component/effect animation có mã nguồn; dùng làm vật liệu trình bày, vẫn cần tự viết logic sản phẩm.

Các repo trên không phải source code của Linear. Repo thư viện mở cũng không đồng nghĩa mọi template hoặc ví dụ thương mại liên quan đều miễn phí.

### Case study về demo thật có backend

[Liveblocks v0.17, 28/06/2022](https://liveblocks.io/blog/whats-new-in-v0-17) giải thích lobby tự chia khách truy cập landing page vào các room và liên kết proof-of-concept dùng Next.js, Redis, Liveblocks. Đây là tham chiếu cho live multiplayer demo, không phải bằng chứng về fake-data autoplay. Bài học là quyết định fidelity trước: nếu chỉ cần minh họa cộng tác thì cursor và event mẫu đủ; nếu cần khách truy cập thực sự gặp nhau thì mới cần backend/room lifecycle. Case study lịch sử này không nên được dùng như hướng dẫn API hiện hành.

Mã nguồn liên quan: [liveblocks/lobby-demo](https://github.com/liveblocks/lobby-demo). Ghi chú khảo sát bổ sung: [examples-research.md](../.scratch/interactive-product-demo/examples-research.md).

## 2. Kỹ thuật xây dựng

### Component hóa và fake data

Tách các phần có ý nghĩa như `DemoFrame`, `SignalList`, `SignalCard`, `DetailPanel`, `DemoControls`. Tái sử dụng token, icon và presentational component của sản phẩm nếu không kéo theo data fetching hoặc auth. Nội dung mẫu nên có ID, thời gian và giá trị cố định; không gọi `Math.random()` hoặc thời gian hiện tại trong render đầu tiên. Fake data cần quan hệ nhất quán: chọn một tín hiệu phải mở đúng panel tương ứng.

React state chỉ chứa thay đổi mang ý nghĩa sản phẩm: item được chọn, tab, trạng thái xử lý. Vị trí con trỏ, tiến trình tween và giá trị thay đổi mỗi frame thuộc animation layer. MotionValue cập nhật DOM mà không kích hoạt React render. [Motion values](https://motion.dev/docs/react-motion-value).

### DOM animation, CSS, Motion và GSAP

| Công cụ | Dùng cho | Giới hạn cần nhớ |
| --- | --- | --- |
| CSS transitions/keyframes | Hover, focus, màu, disclosure đơn giản, pulse ngắn | Khó điều phối nhiều nhánh và nhiều clock bằng delay rải rác |
| Web Animations API | Tween DOM có play/pause/cancel mà không thêm dependency | Tự quản lý lifecycle, selector và sequence |
| Motion cho React, trước đây thường gọi Framer Motion | Layout, enter/exit, gesture, spring và sequence gắn với component | Vẫn phải thiết kế state và chính sách ngắt autoplay |
| GSAP | Timeline nhiều lớp, overlap, label, scrub/pin theo scroll | Không để React và GSAP đồng thời ghi cùng style; cần cleanup |

Web Animations API cung cấp điều khiển animation của browser. `useAnimate` bổ sung selector được giới hạn trong component và cleanup khi unmount. GSAP cung cấp tích hợp React thông qua `useGSAP`. [MDN WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API), [Motion useAnimate](https://motion.dev/docs/react-use-animate), [GSAP React](https://gsap.com/resources/React/).

Không cần cài cả Motion và GSAP cho cùng một card. Nếu dùng chung trên trang, mỗi engine nên sở hữu một scene hoặc các thuộc tính riêng biệt.

### Scroll-triggered và scroll-linked

- **Triggered:** vào viewport thì bắt đầu; sequence tiếp tục theo thời gian. Phù hợp với demo workflow để người xem dừng cuộn và quan sát.
- **Linked/scrubbed:** vị trí cuộn quyết định tiến trình. Phù hợp với câu chuyện chia chương hoặc sơ đồ biến đổi liên tục.

Motion có `whileInView`/`useInView` và `useScroll`; GSAP ScrollTrigger hỗ trợ scrub và pin. [Motion scroll](https://motion.dev/docs/react-scroll-animations), [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

Đề xuất: scroll chỉ đánh thức demo; UI tương tác chạy bằng state cục bộ. Nếu vừa kéo card vừa để scroll điều khiển tiến trình chính, cần quy tắc ai sở hữu state; tránh reset hành động người dùng khi họ cuộn nhẹ.

### Hover, click và drag

- Hover chỉ bổ sung affordance hoặc preview; click/tap phải truy cập được nội dung quan trọng.
- Click/keyboard gửi domain event, ví dụ `SELECT_SIGNAL`; autoplay cũng gửi cùng event thay vì giả lập DOM click.
- Drag cập nhật vị trí bằng animation value trong lúc kéo; chỉ commit thay đổi state khi thả hợp lệ.
- Không tự di chuyển keyboard focus để giả lập người sử dụng. Con trỏ minh họa là decoration, không phải focus thật.
- Có nút/menu thay thế kéo thả, ví dụ “Chuyển sang Đã xem”; keyboard support riêng chưa thay thế yêu cầu thao tác single-pointer không kéo của WCAG 2.5.7. [W3C dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

## 3. Điều phối sequence để sản phẩm có vẻ tự hoạt động

Ví dụ storyboard đề xuất, tổng khoảng 8–10 giây:

| Bước | Ý nghĩa | Chuyển động |
| --- | --- | --- |
| Ready | Hiển thị danh sách ngắn | Không chuyển động, để đọc |
| Incoming | Tín hiệu mẫu xuất hiện | Fade + translate nhỏ |
| Selected | Chọn tín hiệu đó | Highlight, các item khác giảm nhấn |
| Details | Hiện phần giải thích | Panel mở, nội dung xuất hiện theo nhóm |
| Reviewed | Đánh dấu đã xem | Badge và item cập nhật |
| Complete | Giữ kết quả | Dừng, có phát lại |

Chất lượng đến từ quan hệ nhân–quả, khoảng nghỉ để đọc và một điểm tập trung mỗi bước. Không cần mọi card cùng chuyển động. Con trỏ giả chỉ hữu ích khi giải thích thao tác; có thể bỏ để giảm nhiễu.

### Hai tầng state

1. **Playback:** `idle`, `autoplay`, `paused`, `manual`, `complete`.
2. **Product:** item đã chọn, panel mở, trạng thái item và bước hiện tại.

Một `useReducer` là đủ cho một workflow ít nhánh. XState hữu ích khi có nhánh, resume, hủy nhiều tác vụ hoặc các trạng thái chạy song song. XState mô hình hóa event/transition xác định và hủy delayed transition khi rời state. Đây là khả năng của thư viện, không phải bằng chứng Linear dùng XState. [Transitions](https://stately.ai/docs/transitions), [Delayed transitions](https://stately.ai/docs/delayed-transitions).

Các quy tắc cần ghi rõ trước triển khai:

- Vào viewport lần đầu → autoplay nếu cho phép chuyển động.
- Pointer down hoặc focus đi vào demo → dừng autoplay, chuyển sang manual và giữ dữ liệu hiện tại.
- Ra viewport hoặc tab trình duyệt bị ẩn → dừng timer lẫn tween; khi quay lại tiếp tục bước đang dở nếu chưa có manual/pause của người dùng.
- Nút Pause phải có hiệu lực bền vững; viewport không tự bật lại.
- Kết thúc → giữ trạng thái cuối; Replay chủ động reset fixture và bắt đầu lượt mới.
- Cleanup phải dừng animation, hủy timer/listener và vô hiệu hóa async continuation cũ. Dùng run ID hoặc cancellation token để completion của lượt trước không đổi state lượt mới.

`await animate(...)` phù hợp để nối chuyển động, nhưng cleanup visual không đồng nghĩa toàn bộ async workflow tự hủy. Một runner phải kiểm tra lượt còn hợp lệ sau mỗi await. Tránh nhiều `setTimeout` không có chủ sở hữu. Khi pause thật giữa bước, lưu thời gian còn lại hoặc dùng playback control; không quảng cáo resume nếu thực tế reset cả bước.

## 4. Chọn DOM, Canvas/WebGL hay video

| Tiêu chí | DOM/React + CSS/SVG | Canvas 2D / WebGL | Video |
| --- | --- | --- | --- |
| Phù hợp | Bảng, card, menu, panel, workflow | Canvas: đồ họa 2D dày; WebGL: particle, shader, 3D | Câu chuyện tuyến tính, recording thật, cinematic |
| Tương tác | Event và semantics tự nhiên | Tự xử lý hit test, focus, HTML overlay | Điều khiển playback; UI bên trong không tương tác thật |
| Performance | Tốt khi ít node và ít layout/paint | Có lợi cho workload phù hợp; tốn GPU, VRAM và pin | Ít logic UI; vẫn tốn network, decode và bộ nhớ |
| Responsive | Reflow, đổi số cột, bản địa hóa | Tự đổi coordinate, camera và độ phân giải | Scale/crop; nội dung trong frame không reflow |
| Accessibility | Có thể dùng button, heading và focus chuẩn | Pixel không cung cấp semantics tự động | Cần mô tả, control và caption khi có lời thoại |
| Bảo trì | Cập nhật fixture/text/token trực tiếp | Cần kỹ năng đồ họa, kiểm tra thiết bị | Dễ phát nhưng phải render/ghi lại khi UI thay đổi |

Canvas và WebGL không đồng nghĩa: Canvas 2D là API vẽ 2D; WebGL là API đồ họa dựa trên GPU, thường cũng vẽ vào một canvas. GPU không khiến mọi workload tự động nhanh hơn. Text, form và menu thường được phục vụ tốt hơn bằng DOM. MDN lưu ý canvas là bitmap và không tự phơi bày các đối tượng vẽ cho công nghệ hỗ trợ. [MDN canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas).

Kiến trúc hybrid hữu ích: controls/text bằng DOM, đường nối đơn giản bằng SVG, vùng đồ họa thực sự cần thiết mới dùng canvas. Với React Three Fiber, dùng render-on-demand khi cảnh đứng yên và quản lý resolution/quality phù hợp. Continuous animation vẫn cần yêu cầu frame mới. [R3F performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

Video là lựa chọn hợp lý nếu người xem chỉ cần xem, visual khó tái tạo và workflow ổn định. Dùng poster, nguồn được nén phù hợp và trì hoãn video dưới màn hình đầu; autoplay có thể khiến tải video bắt đầu sớm, nên `preload` không phải bảo đảm trì hoãn. Đo file/codec và thiết bị mục tiêu thay vì mặc định video nặng hơn DOM. [Video performance](https://web.dev/learn/performance/video-performance), [Lazy loading video](https://web.dev/articles/lazy-loading-video).

## 5. Kiến trúc Next.js đề xuất

Đây là cấu trúc minh họa trong locale route, không phải các file đã được triển khai:

```text
app/[lang]/
  landing-demo-section.tsx    # Server: heading, copy, static preview
  landing-product-demo.tsx    # Client: UI, reducer và playback controls
  landing-demo-model.ts      # Fixture + pure transitions nếu đủ lớn để tách
  landing-demo.module.css     # Layout responsive và CSS effects
```

Giữ presentational subcomponent trong file demo trước; tách theo trách nhiệm khi số scene tăng. Chỉ tách runner thành hook riêng khi lifecycle đủ phức tạp. Không cần universal animation engine hay global store cho một section.

Luồng: **Server section → Client boundary → visibility gate → reducer → UI → animation completion event**. Các event từ người dùng đi vào cùng reducer. Không gọi auth hoặc backend của dashboard; text nhận từ dictionary theo locale và dữ liệu tài chính minh họa phải được nhận diện là dữ liệu mẫu.

Next.js mặc định dùng Server Components; Client Component là ranh giới cho state/event/browser API, không đồng nghĩa tắt SSR. Giữ initial render xác định. [Next.js Server/Client Components](https://nextjs.org/learn/react-foundations/server-and-client-components).

### Hai ngưỡng tải và chạy

1. Render HTML preview có kích thước ổn định cùng server section.
2. Một client gate nhỏ quan sát vùng cách viewport khoảng 200–400px và mount dynamic demo khi gần đến. Con số là điểm khởi đầu để đo, không phải chuẩn.
3. Khi phần demo đủ hiện rõ, ví dụ 35–50%, và document đang visible thì chạy. Chọn threshold theo kích thước scene; scene cao hơn viewport có thể không đạt threshold theo tỷ lệ.
4. Giữ module đã tải; pause khi đi ra ngoài. Không unmount/remount liên tục làm mất manual state.

IntersectionObserver cung cấp thông báo giao cắt bất đồng bộ. `next/dynamic` giúp chia tải Client Components nhưng không tự biết viewport; conditional mount là phần chính sách riêng. Tài liệu Next.js còn nêu giới hạn code splitting khi dynamic-import Client Component trực tiếp từ Server Component; đặt cổng tải trong Client Component và kiểm tra production network thực tế. [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading).

Với demo nhẹ ở hero, tải trực tiếp có thể tốt hơn thêm một vòng lazy-loading. Chỉ dùng `ssr: false` cho phần thật sự phụ thuộc browser, chẳng hạn WebGL; giữ server preview ở ngoài. SSR preview và client frame đầu phải khớp để tránh nháy hoặc layout shift.

## 6. Performance, responsive và accessibility

### Performance

- Ưu tiên transform/opacity; hạn chế animate kích thước và tọa độ layout liên tục. Layout animation vẫn có phép đo layout, không miễn phí.
- Tránh backdrop blur, filter, shadow diện rộng hoặc nhiều layer promotion. Dùng `will-change` có chọn lọc.
- Không `setState` theo từng frame cho cursor hoặc progress.
- Chỉ chạy scene đang xem; phối hợp document visibility. Pause visual và scheduler cùng lúc.
- Không import toàn bộ chart/editor/table engine chỉ để minh họa vài hàng.
- Dùng Motion `LazyMotion`/feature bundle phù hợp nếu đo thấy cần. `domAnimation` và `domMax` có khả năng khác nhau; drag/layout cần chọn đúng bộ tính năng.
- Đo production build: JS theo route, long task, dropped frames, LCP/INP/CLS và mức CPU khi scene offscreen. Không có benchmark thực thi trong nghiên cứu này.

Browser performance phụ thuộc thuộc tính được animate và lượng paint/layout, không chỉ tên thư viện. [web.dev animation guide](https://web.dev/articles/animations-guide), [Motion performance](https://motion.dev/docs/performance), [Motion bundle size](https://motion.dev/docs/react-reduce-bundle-size).

### Responsive

Desktop có thể dùng list + detail cạnh nhau; mobile giữ một panel chính, ít row/cột và nút chọn bước. Tránh scale dashboard desktop xuống làm chữ và hit area quá nhỏ. Dùng grid/container query, kích thước tương đối, và đo anchor theo element nếu cần con trỏ giả. Không hardcode toàn bộ tọa độ cho màn hình desktop. Kiểm tra nội dung tiếng Việt dài, zoom và font load.

### Accessibility

- Hỗ trợ `prefers-reduced-motion`: bỏ autoplay di chuyển/typewriter, cho xem state tĩnh hoặc đổi bước trực tiếp bằng nút.
- `MotionConfig reducedMotion="user"` giảm transform/layout nhưng vẫn có thể giữ opacity; runner phải tự xử lý chính sách autoplay. [MotionConfig](https://www.motion.dev/docs/react-motion-config).
- Có Pause/Replay thật cho sequence tự chạy dài. WCAG 2.2.2 yêu cầu cơ chế pause/stop/hide với nội dung chuyển động tự bắt đầu, quá 5 giây và song song nội dung khác, trừ ngoại lệ thiết yếu; auto-updating information có điều kiện riêng. Reduced motion không thay thế mọi yêu cầu này. [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).
- Giữ focus hiển thị và ổn định; dùng button cho điều khiển; không để autoplay xóa phần tử người dùng đang focus.
- Con trỏ và hiệu ứng trang trí dùng `aria-hidden`; không đặt control thật trong cây bị ẩn với screen reader.
- Không phát `aria-live` mỗi frame hoặc mỗi ký tự; chỉ thông báo kết quả cần thiết do người dùng chủ động thao tác.
- Heading và mô tả lợi ích phải đọc được ngay cả khi JavaScript/animation không chạy.

## 7. Tiêu chí kiểm tra khi triển khai

Các kiểm tra đề xuất, chưa chạy vì báo cáo không triển khai code:

- Pure transition: cùng fixture/event → cùng state; Replay khôi phục fixture.
- Fake clock: interaction giữa sequence hủy autoplay; async completion cũ không đổi state mới.
- Visibility: không tiến bước khi hidden/offscreen; pause của người dùng không bị viewport override.
- Reduced motion, keyboard và thao tác thay thế drag.
- Mobile, nội dung dài, zoom; preview/loaded demo không gây layout shift.
- Production bundle/network và trace CPU khi demo đứng yên.

Đề xuất bước triển khai đầu tiên: một scene DOM có 3–5 trạng thái, dữ liệu mẫu cố định, click mở chi tiết, CSS + Motion nếu cần layout/exit. Sau khi đo và thấy cần mới thêm nhánh phức tạp, XState, timeline GSAP hoặc WebGL.

Đối chiếu `package.json` của repo tại thời điểm nghiên cứu: đã có Next.js 16, React 19, `tw-animate-css` và `three`; chưa khai báo trực tiếp `motion`, `framer-motion`, `gsap` hoặc `xstate`. Vì vậy có thể bắt đầu bằng reducer + CSS/WAAPI; việc đã có Three.js không phải lý do dùng WebGL cho card/list. Chỉ bổ sung Motion khi storyboard cần layout/exit/gesture đủ để bù chi phí dependency.
