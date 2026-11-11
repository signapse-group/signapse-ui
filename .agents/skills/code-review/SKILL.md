---
name: code-review
description: Rà soát thay đổi FE trong phiên Review được giao hoặc theo yêu cầu trực tiếp. Đánh giá độc lập mức độ đáp ứng yêu cầu và tính đúng đắn, kể cả UI bị ảnh hưởng.
---

# Rà soát mã nguồn

Đọc hướng dẫn repo và [chuẩn review](../../../CONTRIBUTING.md#review-standards). Với việc được giao theo workflow, dùng quyền và điều kiện chuyển pha của [WORKFLOW.md](../../../WORKFLOW.md). Review trực tiếp mặc định chỉ đọc.

## Chốt đầu vào

Xác định ticket hoặc yêu cầu đã chốt, base và SHA của `HEAD`. Với PR, dùng nhánh đích thực tế, hoặc base do người dùng chỉ định. Chỉ hỏi khi không thể xác định rõ base hoặc nguồn yêu cầu.

Với Jira, đọc Subtask, parent, quyết định đã chốt và tài liệu tham chiếu hiện hành. Với review trực tiếp, dùng yêu cầu được giao. Xác định phạm vi từ diff đã commit giữa base hoặc merge-base đã xác định và `HEAD`, diff đã stage và chưa stage, cùng đầu ra liên quan chưa được Git theo dõi. Chỉ loại thay đổi khi có căn cứ rõ về phạm vi sở hữu. Ghi đầu vào còn thiếu hoặc phần việc chưa xác định được trước khi đánh giá.

## Giao hai trục song song

Khởi tạo hai subagent chỉ đọc trước khi chờ kết quả. Giao một trục cho mỗi subagent:

- **Đáp ứng yêu cầu** (Requirement adherence). Dùng [checklist Requirement](references/requirement-checklist.md).
- **Tính đúng đắn và tuân thủ chuẩn** (Correctness & Standards). Dùng [checklist Code](references/code-checklist.md). Khi thay đổi có thể ảnh hưởng giao diện, kể cả qua mã dùng chung, dùng thêm [checklist UI](references/ui-checklist.md).

Gửi cùng nguồn yêu cầu, base, `HEAD`, phạm vi thay đổi, bằng chứng sẵn có và đường dẫn checklist tương ứng. Yêu cầu mỗi subagent đọc hướng dẫn repo và đánh giá các mục thuộc trục được giao từ bằng chứng gốc. Giới hạn subagent ở việc khảo sát và trả kết quả cho reviewer chính trong phiên này.

Mỗi subagent trả một dòng cho mỗi mục thuộc trục được giao, gồm tên mục, trạng thái `Đạt`, `Không đạt`, `Thiếu bằng chứng` hoặc `Không áp dụng`, và đường dẫn tới bằng chứng hoặc lý do. Dùng `Không áp dụng` cho mục nằm ngoài phạm vi có căn cứ. Dùng `Thiếu bằng chứng` cho mục trong phạm vi chưa đủ căn cứ kết luận. Với phát hiện cần sửa, nêu vị trí, tác động và kết quả tối thiểu cần đạt. Nếu công cụ subagent không khả dụng hoặc một lượt trả kết quả không đủ, reviewer chính trực tiếp hoàn tất phần còn thiếu theo cùng checklist.

## Đối chiếu và kết luận

Reviewer chính trong phiên Review đọc trực tiếp các nguồn cần thiết để xác nhận kết luận của cả hai trục, xử lý kết quả mâu thuẫn và bổ sung phép kiểm local phù hợp khi còn thiếu bằng chứng. Nêu rõ nếu điều kiện review độc lập chưa được đáp ứng.

Báo cáo riêng kết luận của hai trục, kèm base, `HEAD`, phần đầu ra đã kiểm tra, phát hiện chặn bàn giao, góp ý tùy chọn và bằng chứng còn thiếu. Mục bắt buộc `Không đạt` hoặc `Thiếu bằng chứng` khiến trục tương ứng chưa thể đạt. Áp dụng [chuẩn review](../../../CONTRIBUTING.md#review-standards) để phân loại phát hiện và trả kết quả tại PR, tài liệu bàn giao hoặc phiên làm việc theo phạm vi được giao.
