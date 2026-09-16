# Nghiên cứu rút gọn form đăng ký xem demo

> Ngày kiểm chứng: 2026-09-16  
> Phạm vi: landing public `/vi` và `/en`; flow tối giản đã áp dụng sau nghiên cứu.

## Kết luận

Với flow hiện tại, phương án ngắn nhất và đúng bản chất nhất là **không dùng form**. Một CTA `Yêu cầu truy cập` mở email soạn sẵn tới `access@signapse.cloud` chỉ còn một thao tác để người dùng liên hệ.

Lý do: form hiện tại không gửi dữ liệu tới Signapse. Nó lấy `name`, `email` và `need`, ghép chúng vào `mailto:` rồi mở ứng dụng email. Người dùng vẫn có thể sửa hoặc không gửi email, nên Signapse chưa có contact nào trước khi người dùng thực sự gửi thư. RFC 6068 cũng quy định `mailto:` chỉ tạo một email nháp; người dùng có thể sửa, gửi hoặc hủy nó. [RFC 6068, mục 3](https://www.rfc-editor.org/rfc/rfc6068.html#section-3)

Điều này cũng đưa landing về đúng CTA contract hiện hành: `docs/design/LANDING.md` khóa request-access vào `mailto:` và yêu cầu proposal riêng trước khi thêm form có data owner, storage, abuse protection, privacy notice và success state.

## Hiện trạng trước khi cập nhật

| Thành phần      | Hiện tại                           | Giá trị cho mục tiêu lấy contact nhanh                                        |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Họ và tên       | Bắt buộc, được chép vào body email | Không cần để mở cuộc liên hệ đầu tiên                                         |
| Email công việc | Bắt buộc, được chép vào body email | Trùng với địa chỉ gửi thư khi người dùng gửi mail; không được lưu bởi landing |
| Nhu cầu chính   | Bắt buộc, được chép vào body email | Hữu ích để phân loại, nhưng nên hỏi sau khi đã có contact                     |
| Submit          | Mở mail client                     | Không xác nhận Signapse đã nhận contact                                       |

Ghi nhận này dựa trên form trước khi thay bằng CTA email tối giản vào ngày 2026-09-16.

## Mức rút gọn khả dụng

| Mô hình                       | Trường bắt buộc | Khi nào Signapse có contact             | Khuyến nghị                                             |
| ----------------------------- | --------------- | --------------------------------------- | ------------------------------------------------------- |
| CTA email hiện có             | 0               | Khi người dùng gửi email từ mail client | **Dùng ngay**. Ít ma sát nhất, không cần hạ tầng mới.   |
| Form nhận lead                | 1: email        | Ngay khi submit thành công vào endpoint | Dùng khi cần CRM/lead capture đo được.                  |
| Form nhận lead có cá nhân hóa | 2: tên, email   | Ngay khi submit thành công vào endpoint | Chỉ dùng khi sales cần gọi tên trong phản hồi đầu tiên. |

Không nên yêu cầu `Nhu cầu chính`, số điện thoại, công ty hay role ở bước đầu. Những dữ liệu này không cần để bắt đầu trao đổi; có thể lấy qua reply email, trang đặt lịch hoặc câu hỏi tiếp theo sau khi submit.

## Đề xuất UI hiện tại

Thay card ba trường bằng một CTA cùng microcopy rõ nghĩa:

```text
Yêu cầu truy cập
Mở email tới access@signapse.cloud để bắt đầu trao đổi.
```

Subject có thể giữ `Signapse access request`; không thêm body dài. Điều này khớp `docs/design/LANDING.md:284-340`, đồng thời không đặt kỳ vọng rằng click CTA đã gửi thành công.

## Nếu cần capture lead thật

Trước khi triển khai form submit, cần chốt một flow khác với `mailto:`:

1. Một ô `Email công việc`, `type="email"`, `autocomplete="email"`, label hiển thị và nút submit.
2. Endpoint chịu trách nhiệm lưu/chuyển lead, chống spam, trả trạng thái thành công/lỗi và có privacy notice.
3. Gửi `locale`, trang nguồn và CTA source như metadata hệ thống; không hỏi người dùng.
4. Thu thập tên và nhu cầu sau submit hoặc trong email/scheduler follow-up.

Label vẫn phải gắn rõ với input, không dùng placeholder thay cho label, theo [W3C Technique H44](https://www.w3.org/WAI/WCAG22/Techniques/html/H44.html). `autocomplete="email"` là token tiêu chuẩn của HTML để browser/autofill nhận diện field email, theo [WHATWG HTML Standard](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill).

## Quyết định đề xuất

Áp dụng ngay CTA email không có form. Nếu mục tiêu thay đổi sang đo và xử lý lead trong hệ thống, tạo proposal riêng cho form một trường email cùng backend contract; không giữ form ba trường chỉ để tạo `mailto:`.

## Nguồn

- Form landing trước thay đổi ngày 2026-09-16 — hành vi form cũ.
- `app/[lang]/landing-access.ts:5-6` — email đích và request-access URI.
- `docs/design/LANDING.md:284-340` — CTA contract và điều kiện cho request form.
- [IETF RFC 6068: The `mailto` URI Scheme](https://www.rfc-editor.org/rfc/rfc6068.html) — semantics của mailto.
- [W3C WCAG Technique H44](https://www.w3.org/WAI/WCAG22/Techniques/html/H44.html) — label cho form control.
- [WHATWG HTML: Autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill) — token autocomplete.
