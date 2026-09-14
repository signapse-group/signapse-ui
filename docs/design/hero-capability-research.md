# Nghiên cứu dải 5 năng lực trong Hero

Ngày: 2026-09-14. Phạm vi: nghiên cứu và đề xuất; chưa thay đổi giao diện. Các đề xuất bên dưới là suy luận thiết kế cho Signapse, chưa có thử nghiệm người dùng hoặc số liệu conversion.

## Cơ sở

- Trang [Linear Intake](https://linear.app/intake) ghép thông điệp theo kết quả sử dụng với hình ảnh và ví dụ sản phẩm cụ thể. Đây là tham chiếu về cách chứng minh giá trị; không phải bằng chứng rằng bố cục của Linear sẽ tăng conversion cho Signapse.
- [NN/G: The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/) khuyến nghị chuyển động ngắn, nhẹ và phục vụ feedback hoặc thay đổi trạng thái. Nhiều animation đồng thời có thể cạnh tranh sự chú ý.
- [W3C: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) yêu cầu khả năng điều khiển rotation; nếu tự chạy, phải có nút dừng, dừng khi focus vào và khi hover. Đây là lý do không chọn autoplay cho dải năng lực này.
- [LANDING.md](./LANDING.md) chốt bốn tính năng chính, ưu tiên product proof thật và cấm ngụ ý dự báo hoặc tự động giao dịch. Năm mục Hero không mặc nhiên là năm bước bắt buộc hay một pipeline có quan hệ nhân quả.

## Đề xuất ưu tiên

Đổi dải mô tả thành năm điểm khám phá sản phẩm. Mỗi mục có một hình vector nhỏ mang ý nghĩa riêng, tiêu đề rõ hơn, một câu lợi ích và liên kết tới nội dung tương ứng đã có. Cách này đưa sản phẩm vào dải Hero mà không tạo thêm một preview lớn cạnh market-context figure hiện tại.

1. Giảm vai trò số 01–05; hình minh họa và tên năng lực là điểm nhìn chính. Dùng SVG tĩnh cho thị trường, quan hệ tác động, hội thoại AI, thông báo Telegram và nghiên cứu chiến lược. Minh họa mang tính khái niệm, không dựng giá hoặc hiệu suất tài chính như dữ liệu thật.
2. Tăng độ rõ tiêu đề lên khoảng 16px, giữ mô tả ngắn đủ đọc ở 13–14px; hiệu chỉnh tương phản bằng token landing hiện có. Những kích thước này là điểm xuất phát để thử trên bố cục thật, không phải chuẩn rút ra từ các nguồn nghiên cứu.
3. Mỗi mục có hành động xem phần liên quan; kiểm tra destination trong runtime trước khi gắn link. Mục chiến lược chỉ điều hướng tới surface phân tích đã tồn tại, không quảng bá chức năng chiến lược hoặc execution mới.
4. Chỉ dùng hover/focus và chuyển trạng thái ngắn để xác nhận khả năng tương tác. Không chạy animation liên tục trên cả năm hình; tôn trọng reduced motion.
5. Mobile dùng danh sách dọc gọn, hình nhỏ bên trái và nội dung bên phải. Giữ cả năm mục có thể đọc bằng cuộn trang; tránh ép năm cột, chữ nhỏ, hoặc giấu nội dung sau carousel tự chạy. Đây là lựa chọn thiết kế đề xuất cho diện tích hẹp, chưa được kiểm thử.

## Điều kiện đánh giá khi triển khai

- Nhìn lướt phân biệt được năm năng lực và nhận ra chúng dẫn tới nội dung nào.
- Không làm CTA Hero hoặc market-context figure mất vai trò chính; kiểm tra vị trí dải tại viewport laptop để tránh tiếp tục nằm hoàn toàn dưới fold.
- Các link dùng được bằng keyboard và tap, focus rõ; không tạo page overflow ở mobile.
- Không nối năm mục bằng mũi tên hoặc animation khiến người đọc hiểu Telegram tạo chiến lược, hay hệ thống tự ra quyết định giao dịch.
- So sánh bản trước/sau bằng cùng viewport; chỉ kết luận hiệu quả chuyển đổi sau khi có dữ liệu đo thực tế.
