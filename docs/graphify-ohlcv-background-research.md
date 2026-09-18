# Nghiên cứu nền hero Graphify cho Signapse

- Loại: ghi chú nghiên cứu; chưa phải task được phê duyệt hay thay đổi production.
- Ngày: 2026-09-09.
- Mục tiêu: chuyển cảm giác chiều sâu của hero [Graphify](https://graphify.com/) sang ngôn ngữ thị trường với ký hiệu OHLCV.
- Phạm vi đã chốt: public landing hero hiện tại, không phải nền dashboard hay trang đăng nhập.

## Quan sát Graphify

Quan sát screenshot và DOM trực tiếp ngày 2026-09-09: nền hero chuyển dọc từ xanh sang kem, thêm grain SVG `feTurbulence` với `soft-light`, opacity 0.5. Ký hiệu toán là SVG tĩnh lặp lại kích thước 1008×588; chữ monospace chủ yếu 14–16px, vài chữ 18px, opacity khác nhau. Mask dọc làm mờ hai đầu; mask radial tạo khoảng trống quanh nội dung, có cấu hình riêng cho mobile. Một overlay radial tối hơn hỗ trợ vùng copy. Lớp ký hiệu có computed `animation: none`, `transform: none`; canvas wireframe là phần riêng. Nguồn: [Graphify](https://graphify.com/).

Kết luận từ quan sát: chiều sâu của trường ký hiệu đến từ phối màu, độ trong suốt và mask; không có bằng chứng đây là particle animation, parallax hay chữ 3D. Phương án sát reference nhất là SVG nền tĩnh được vẽ mới cho Signapse.

## Điểm tích hợp đã xác minh trong repo

Hero hiện có hai cột: nội dung/CTA bên trái và `LandingContextFigure` cùng hai proof point bên phải. Section đã có `relative overflow-hidden`, phù hợp đặt một lớp nền tuyệt đối phía sau nội dung. Điểm gắn hẹp là `HeroSection` trong [landing-page.tsx](../app/[lang]/landing-page.tsx), bắt đầu tại dòng 248; lớp nền được sở hữu bởi `.heroSection` trong [landing-page.module.css](../app/[lang]/landing-page.module.css). Nền hiện tại chỉ là hai linear gradient tạo grid 72px, còn copy/visual có entrance animation 420ms.

Landing đã có figure Three.js tương tác chuyển giữa knowledge graph và price action/candles. Renderer được dynamic import, có xử lý reduced motion, visibility và tài nguyên WebGL. Vì vậy nền mới phải được đánh giá cùng figure hiện tại: hai chuyển động rõ cùng lúc sẽ cạnh tranh với headline và CTA. Nguồn: [landing-context-figure.tsx](../app/[lang]/landing-context-figure.tsx) và [ADR-0010](adr/0010-use-progressive-webgl-for-landing-context-figure.md).

Palette landing cố định navy/mint, độc lập theme dashboard; `.landingRoot` sở hữu token riêng và `.darkSurface` được hero sử dụng. ADR-0011 thay thế theme-parity guidance dành riêng cho landing. Không cần đổi global tokens hoặc Nova wrappers để tạo nền này. Nguồn: [ADR-0011](adr/0011-fixed-branded-public-landing-composition.md), [landing-page.module.css](../app/[lang]/landing-page.module.css).

Repo đã có `three` 0.180.0, nhưng không vì thế cần thêm renderer cho lớp trang trí. CSS Module và SVG/DOM sẵn có đủ để thử bố cục nhiều lớp. Không đề xuất dependency mới ở giai đoạn nghiên cứu. Nguồn dependency: [package.json](../package.json); đây là đề xuất kỹ thuật, chưa phải kết quả benchmark.

## Hướng chuyển sang OHLCV

Đề xuất dùng một trường ký hiệu có chủ đích thay vì rải ngẫu nhiên cùng một bộ chữ:

| Thành phần                        | Vai trò đề xuất                                         |
| --------------------------------- | ------------------------------------------------------- |
| `O`, `H`, `L`, `C`, `V`           | Tín hiệu nhận diện OHLCV; dùng Geist Mono hiện có       |
| Một vài mini candle hoặc OHLC bar | Giúp người xem nhận ra market ngay cả khi không đọc chữ |
| Volume bars rất nhẹ               | Bổ sung chữ V bằng hình học dễ nhận diện                |
| Các lớp khác cỡ, độ mờ, vị trí    | Tạo khoảng cách gần–xa mà không cần scene 3D thật       |
| Khoảng nền sạch phía sau copy     | Bảo vệ headline, mô tả và CTA khỏi nhiễu thị giác       |

Không dùng ticker, giá, phần trăm hoặc tín hiệu BUY/SELL giả như dữ liệu live. Nếu có số minh họa, cần định nghĩa rõ chúng là chất liệu trang trí; lựa chọn tối giản là bỏ số ở bản đầu. Nền không lấy API market, không cập nhật giá và không mang thêm thông điệp sản phẩm. Đây là lựa chọn thiết kế đề xuất, không phải đặc điểm đã xác minh của Graphify.

## Cách triển khai tối thiểu để thử tiếp

Ưu tiên SVG nền tĩnh được vẽ mới với dữ liệu vị trí cố định, nhiều mức opacity/cỡ glyph và CSS mask dọc/radial. Dùng palette navy/mint route-local hiện có; khoảng sạch cần khớp vị trí copy của Signapse thay vì sao chép thông số mask của Graphify. Giữ phần hiển thị chính và CTA ở lớp trên, nền `aria-hidden="true"`, `pointer-events: none`, không tạo tab stop. Không cần biến toàn bộ landing thành Client Component. Quy tắc placement/server boundary: [components/AGENTS.override.md](../components/AGENTS.override.md).

Nếu chuyển động mang lại giá trị sau thử nghiệm, giới hạn ở transform/opacity nhẹ của một vài lớp; reduced motion dùng bố cục tĩnh. Hiệu ứng parallax theo con trỏ chỉ nên cân nhắc khi bản tĩnh/entrance chưa đạt mục tiêu. Không animate từng ký hiệu với một vòng React state mỗi frame. Đây là khuyến nghị triển khai, chưa phải đo hiệu năng.

Cơ sở platform: CSS mask có thể dùng gradient để điều khiển vùng hiển thị; media query reduced motion nhận lựa chọn giảm chuyển động của người dùng. Nguồn: [MDN mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-image), [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

Một component route-local nếu JSX nền đủ lớn, một phần CSS Module và một điểm gắn tại hero là phạm vi dự kiến. Không sửa figure Three.js hiện hữu chỉ để chứa background; nếu muốn thay figure bằng nền mới thì đó là thay đổi scope và phải cập nhật contract riêng. Figure hiện tại không có visible control chrome, có interaction và motion phù hợp; nền mới không được âm thầm xóa các behavior đó.

## Kế hoạch triển khai đã chốt

Thay đổi được thực hiện trực tiếp trên runtime và các tài liệu chuẩn hiện có theo thứ tự sau:

1. Cập nhật contract landing trước khi sửa runtime:
   - [LANDING.md](design/LANDING.md): cho phép một trường glyph `O/H/L/C/V` route-local trong Hero, xác định đây là texture trừu tượng thứ cấp và giữ nguyên lệnh cấm ticker, giá, phần trăm, BUY/SELL, tín hiệu hoặc candlestick wallpaper có thể bị hiểu là dữ liệu thị trường.
   - Ghi rõ requirement có thể kiểm chứng cho decorative OHLCV depth field trong tài liệu này: render ở cả `/vi` và `/en`, nằm sau nội dung/figure, không thêm copy/control/accessible semantics, không tạo overflow và không thay đổi figure contract.
2. Tạo `app/[lang]/landing-ohlcv-background.tsx` dưới dạng Server Component route-local. Component render một SVG inline duy nhất với vị trí cố định, chỉ dùng glyph `O`, `H`, `L`, `C`, `V` ở một số scale/opacity; không fetch dữ liệu, không dùng random runtime, không có `use client`, ticker, số giá hoặc candle giả. Root decoration dùng `aria-hidden="true"`, SVG dùng `focusable="false"`, toàn bộ lớp dùng `pointer-events: none`.
3. Gắn component làm child đầu tiên của `HeroSection` trong [landing-page.tsx](../app/[lang]/landing-page.tsx). Content grid hiện tại được đưa lên stacking layer phía trên; headline, CTA, trust note, proof points và `LandingContextFigure` giữ nguyên DOM order và behavior.
4. Thay grid 72px hiện tại trong [landing-page.module.css](../app/[lang]/landing-page.module.css) bằng treatment nhiều lớp: ambient navy/mint gradient ở section, glyph far/near với opacity khác nhau, mask dọc ở mép Hero và radial clear zone quanh copy. Bản đầu hoàn toàn tĩnh; entrance animation hiện có của copy/figure không đổi. Breakpoint hẹp dùng mask rộng hơn và mật độ thấp hơn để copy vẫn sạch.
5. Cập nhật [public landing component test](../tests/components/public-landing.component.test.tsx) để khóa một decorative field duy nhất, `aria-hidden` và không thêm interactive control. Mở rộng [landing E2E](../tests/e2e/landing.spec.ts) tại các test palette/responsive/accessibility hiện có để kiểm tra decoration xuất hiện ở cả locale, không tạo horizontal overflow ở 375px/200% và không làm thay đổi CTA hoặc figure interaction.
6. Sau khi runtime ổn định, cập nhật trạng thái/kết quả thực tế trong ghi chú này, gồm lựa chọn mật độ, mask và kết quả kiểm chứng. Không sửa `DESIGN.md`, ADR-0010/0011, dictionary, global theme tokens, `components/ui`, `package.json` hoặc figure Three.js vì các owner đó không đổi.

Completion criteria: background đọc ra là OHLCV ở mức quan sát thứ hai sau headline, không cạnh tranh với figure, không gây hiểu nhầm là dữ liệu live, không thêm client JavaScript/dependency, không làm đổi layout hoặc accessibility contract. Chạy lint, typecheck, component test landing và Playwright landing tests; visual QA ở 375/768/1024/1440px, zoom 200%, light/dark system preference và reduced motion được ghi dưới dạng user-owned QA.

## Ràng buộc và cách xác minh khi triển khai

[DESIGN.md](design/DESIGN.md) ưu tiên nền tinh tế, typography rõ, Geist/Geist Mono, không trang trí nặng gây xao nhãng. Yêu cầu của người dùng mở phạm vi nghiên cứu hero; không suy rộng thành nền cho admin screens. [Accessibility skill](../.agents/skills/accessibility/SKILL.md) yêu cầu reduced motion và giữ khả năng đọc, focus, target size.

Kiểm tra Codex có thể chạy khi có implementation: lint, typecheck và landing component tests liên quan; xác minh decoration không thêm role/control, không đổi copy/CTA/route hoặc figure contract. Review responsive cần xét 375/768/1024/1440px và zoom 200% theo design contract, cùng trạng thái reduced motion. Motion liên tục nếu được chọn cần đánh giá yêu cầu dừng/ẩn và chi phí khi tab ẩn hoặc hero ngoài viewport, thay vì chỉ thêm animation vô hạn.

User-owned visual QA: cảm giác chiều sâu, độ nhiễu sau headline, cạnh tranh với figure, và trải nghiệm GPU/mobile thực tế.

## Giới hạn nghiên cứu

Chưa triển khai production và chưa đo bundle/frame time cho phương án mới. Mật độ, cỡ glyph, opacity và mask của Signapse cần thử trực quan trong hero thật; thông số của Graphify chỉ mô tả source được quan sát, không phải giá trị tối ưu cho Signapse. Bản đầu đã chốt nền tĩnh; drift/parallax nằm ngoài phạm vi cho tới khi có yêu cầu mới và bằng chứng bản tĩnh chưa đạt mục tiêu.

Xác minh cho ghi chú này: đọc CodeGraph/source, scoped instructions và DESIGN liên quan; kiểm tra nội dung Markdown/UTF-8. Chỉ thêm tài liệu nên không chạy runtime tests.
