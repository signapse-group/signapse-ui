# Interactive product demo — ví dụ và nguồn sơ cấp

Ngày: 2026-09-15. Nhãn **confirmed** nghĩa là vendor/đội ngũ công bố trong bài kỹ thuật, docs hoặc repo. Nhãn **observed** chỉ mô tả rendered/accessibility tree; không suy ra thư viện nội bộ.

## Ví dụ mạnh

### Linear

[Linear homepage](https://linear.app/) có nội dung UI trong phần trang được đọc: workspace/sidebar, issue list, activity, roadmap, AI output và code review. Chưa tìm thấy source marketing trong nghiên cứu này nên chưa thể khẳng định React/Motion/GSAP/canvas cho từng scene.

Nguồn [release 2021](https://linear.app/releases/2021-06) được liên kết bởi repo recreation [MaximeHeckel/linear-vaporwave-react-three-fiber](https://github.com/MaximeHeckel/linear-vaporwave-react-three-fiber). Bài [Building a Vaporwave scene with Three.js](https://blog.maximeheckel.com/posts/vaporwave-3d-scene-with-threejs/) **confirmed cho recreation, không phải source Linear**: PlaneGeometry nhiều vertex, PerspectiveCamera, OrbitControls+damping, WebGLRenderer, resize, pixel ratio cap 2, requestAnimationFrame; bài còn GPU-tier gate để không auto-run WebGL trên máy yếu. Đây là reference tốt cho 3D fallback/performance, không phải bằng chứng Linear production dùng Three.js.

### Vercel Virtual Product Tour

Bài first-party [Designing the Vercel virtual product tour](https://vercel.com/blog/designing-the-vercel-virtual-product-tour) là case study đầy đủ nhất. Tour dùng real Vercel UI/UX, interactive slideshow, tooltip động, comments; mobile đổi sang card tap-through.

Kiến trúc được công bố: DemoContext là single source of truth với index, subIndex, tooltipRef, slide data/components và modal/survey state; tooltipContentMap tách copy/position/style; index sync query parameter để deep-link. ResizeObserver + repositionTooltip tính vị trí/overflow và throttle; CSS transition/keyframe, transitionEnd và lodash.delay giữ thứ tự animation dù người dùng đi các nhánh khác nhau. Accessibility gồm aria-live + role=status, keyboard navigation, Get Started và Skip to Tooltip.

### Resend + Spline

[Case study chính thức của Spline](https://blog.spline.design/how-resend-uses-spline-for-3d-design) xác nhận Resend dùng Rubik cube 3D tương tác trên homepage, nhúng bằng React integration; Spline event system xử lý mouse/keyboard-triggered animations và cùng asset được cập nhật theo brand. Đây là 3D scene/asset tương tác, không phải video. Caveat: vendor case study không có repo, bundle/perf metrics hay fallback accessibility.

### Liveblocks

[Custom realtime collaboration showcase](https://liveblocks.io/showcase/custom-realtime-collaboration) mô tả demo chọn màu/emoji, dùng useStorage + useMutation, lưu trong LiveObject; [Next.js canvas quickstart](https://liveblocks.io/docs/get-started/nextjs-canvas-custom) và [repo](https://github.com/liveblocks/liveblocks) có code stateful React. Case [Propeller 3D maps](https://liveblocks.io/blog/propeller-used-liveblocks-to-make-their-3d-maps-collaborative-in-just-days) xác nhận React microfrontends + WebGL renderer + Liveblocks state, dựng collaborative drawing trong 45 phút. Marketing showcase không chứng minh backend thật; coi activity là seed/demo data.

### Cursor và Clerk

[Cursor homepage](https://cursor.com/) accessibility tree tự mô tả nhiều element là “interactive demo”, expose UI text/buttons của Desktop, CLI, Agent, Slack. [Motion README](https://github.com/motiondivision/motion) xác nhận Motion drives Cursor homepage animations; không có source Cursor nên không suy ra mọi panel là DOM.

[Clerk homepage](https://clerk.com/) expose live-looking SignUp, SignIn, UserButton, organization switcher, billing và security states. [Clerk quickstart](https://clerk.com/docs/js-frontend/getting-started/quickstart) + [official SDK repo](https://github.com/clerk/javascript) xác nhận component/mount model. Marketing animation engine vẫn chưa công bố.

## Quy tắc chọn renderer

DOM/React cho text, button/input/tab, responsive stateful UI, SEO/a11y; Canvas/WebGL cho shader/3D/particle/pixel scene liên tục và cần GPU gate; video cho sequence cinematic cố định không cần state. Hybrid (DOM semantic overlay + canvas/video visual layer) thường cân bằng nhất. Đây là suy luận triển khai từ các nguồn trên, không phải benchmark vendor.
