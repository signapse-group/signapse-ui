# Checklist Requirement

Áp dụng cho trục **Đáp ứng yêu cầu** theo [chuẩn review](../../../../CONTRIBUTING.md#review-standards).

| Mục | Khi áp dụng | Điều kiện đạt | Bằng chứng cần xem |
| --- | --- | --- | --- |
| Nguồn yêu cầu và phạm vi | Mọi lượt review. | Xác định yêu cầu đã chốt, phạm vi được giao và các AC, quy tắc hoặc ràng buộc liên quan. Nếu thiếu nguồn hoặc các nguồn mâu thuẫn, ghi mục bị ảnh hưởng và điều cần xác nhận. | Subtask và parent trên Jira, quyết định đã chốt, tài liệu được dẫn chiếu hoặc yêu cầu trực tiếp. |
| Đối chiếu từng yêu cầu | Mỗi AC, quy tắc nghiệp vụ, ngoại lệ hoặc hành vi mong đợi trong phạm vi. | Hành vi quan sát được khớp yêu cầu, gồm luồng chính và các ngoại lệ được giao. Ghi kết quả và bằng chứng cho từng yêu cầu. | Mục nguồn, code cuối cùng và nơi gọi, kết quả quan sát hoặc phép kiểm trên phiên bản đang review. Với đầu ra chỉ đọc, đối chiếu báo cáo và bằng chứng gốc. |
| Phạm vi và hồi quy | Mọi lượt review, theo các luồng chịu ảnh hưởng. | Đầu ra đủ phần được giao. Các luồng liên quan giữ hành vi đã chốt và thay đổi ngoài phạm vi có căn cứ được chấp nhận. | Scope, diff, code cuối cùng, nơi gọi và kết quả kiểm tra hồi quy liên quan. |
| Sai lệch cần sửa | Bản sửa dưới Bug. | Bản sửa xử lý đúng sai lệch được giao theo hành vi mong đợi và căn cứ đã chốt. Kết quả Fail được dùng làm căn cứ thuộc đúng sai lệch. Phạm vi hồi quy được giao có bằng chứng phù hợp. | Bug, báo cáo QA liên quan mới nhất, ca kiểm thử và phiên bản, build và môi trường đã test, bằng chứng xác minh bản sửa. Giữ nguyên kết quả QA và trạng thái Bug. |
| Yêu cầu về UI | Thay đổi ảnh hưởng đến thiết kế hoặc hành vi UI đã chốt, kể cả qua mã dùng chung. | Vị trí, nhóm và đường vào của control khớp hướng thiết kế và ràng buộc đã duyệt. Luồng thao tác, nội dung, trạng thái và ngoại lệ khớp AC. | Nguồn thiết kế hoặc pattern đã duyệt, bản render tương ứng theo [UI Design Gate](../../../../docs/design/DESIGN.md#ui-design-gate), quan sát thao tác hoặc test xác nhận hành vi. |

Nếu yêu cầu còn mơ hồ hoặc mâu thuẫn, nêu mục bị ảnh hưởng và bên có thẩm quyền làm rõ.
