# Kịch bản AI Conversation — SEE THE WORKFLOW

Ngày: 2026-09-16. Trạng thái: nội dung đã được triển khai vào static fallback và DOM animation của landing showcase.

## Phạm vi và kết luận

Mục tiêu: thay phần giới thiệu AI chung chung bằng một hội thoại phân tích có yêu cầu rõ ràng, tổng hợp nhiều lớp thông tin, đối chiếu tín hiệu trái chiều và kết luận có điều kiện. Hoàn thành khi có transcript đầy đủ, bộ dữ liệu demo nhất quán, nguồn nghiên cứu và cách đưa nội dung vào stage.

Giả định: dùng BTC làm tài sản dễ nhận diện; nội dung tiếng Việt là bản gốc để duyệt. Không thay đổi backend, không xác nhận tích hợp nguồn dữ liệu mới và không thay đổi OpenSpec.

Kịch bản khuyến nghị: **“BTC đang tăng: lực mua thực hay đòn bẩy?”** Câu hỏi này cho AI cơ hội giải thích chất lượng của một đợt tăng, thay vì chỉ liệt kê chỉ báo hoặc dự đoán giá.

## Cơ sở nghiên cứu

- [CONTEXT.md](../../CONTEXT.md): AI sử dụng ngữ cảnh Market Knowledge Graph; không hứa tự nhận node/chart đang chọn hoặc luôn có đầy đủ nguồn.
- [Spec hội thoại](../../openspec/specs/ai-assistant-market-conversations/spec.md): hỗ trợ hội thoại và câu hỏi tiếp nối; request hiện đồng bộ, không token streaming.
- [LANDING.md](LANDING.md): AI stage dùng browser-window text-first simulation; server-rendered/static fallback vẫn giữ transcript đầy đủ.
- [Dictionary hiện tại](../../app/lib/i18n/dictionaries/vi.ts): phần AI Conversation mới có title, context và history, chưa chứng minh chất lượng một câu trả lời.
- [Coinbase candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles): cung cấp OHLCV theo khoảng thời gian; dữ liệu có thể thiếu ở khoảng không có giao dịch. Hữu ích cho thiết kế lớp giá/khối lượng, không chứng minh Signapse đã kết nối Coinbase.
- [Binance Futures market data](https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data): tài liệu có open interest và lịch sử funding. Hữu ích cho lớp vị thế phái sinh; dữ liệu một sàn không đại diện toàn thị trường.

Các nguồn API xác nhận loại dữ liệu có thể sử dụng, không xác nhận các con số hoặc kết luận minh họa bên dưới. Không gắn logo/URL nhà cung cấp vào số liệu giả theo cách làm người xem hiểu là số liệu lấy từ họ.

## Bộ dữ liệu kịch bản

Hiện nhãn xuyên suốt: **Demo · Dữ liệu giả lập, không phải thị trường hiện tại**. Các mã D1–D4 là tham chiếu tới dữ liệu mẫu ngay trong demo, không phải nguồn thị trường thật.

| Mã  | Dữ liệu giả lập                                                                                    | Phạm vi                                                |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| D1  | BTC/USD từ 64.000 lên 67.200 USD (+5%); tổng khối lượng spot tăng 24%                              | 7 ngày so với 7 ngày liền trước; tập sàn mẫu cố định   |
| D2  | OI tính theo BTC tăng 18%; funding kỳ 8 giờ gần nhất +0,018%, trung vị kỳ 8 giờ tuần trước +0,006% | Một sàn phái sinh mẫu; không gộp USD và BTC            |
| D3  | Vùng vượt đỉnh 66.000; đáy sau vượt đỉnh 65.200; đỉnh gần nhất 68.000                              | Cấu trúc nến 4 giờ trong snapshot mẫu                  |
| D4  | Một công bố CPI dự kiến sau mốc snapshot 18 giờ; chưa có kết quả                                   | Sự kiện giả lập có liên kết tới BTC trong ngữ cảnh mẫu |

Không gọi khối lượng spot là dòng tiền ròng. OI tăng không tự xác định bên long hay short; funding dương bổ sung bối cảnh nhưng không chứng minh đợt tăng chỉ do đòn bẩy. Không suy ra quan hệ nhân quả từ việc hai sự kiện xảy ra gần nhau.

## Transcript đề xuất

### Người dùng

> Phân tích BTC trong 7 ngày qua. Đợt tăng này có lực mua spot hỗ trợ hay chủ yếu do đòn bẩy? Kết hợp diễn biến giá, vị thế phái sinh và sự kiện vĩ mô; đưa ra kịch bản 24–72 giờ tới và điều kiện khiến nhận định thay đổi.

### Tóm tắt quy trình phân tích

Nhãn: **Cách hình thành nhận định**. Đây là bản tóm tắt phương pháp và bằng chứng, không phải nhật ký suy nghĩ nội bộ hay telemetry chạy thật.

1. **Tổng hợp ngữ cảnh:** giá, khối lượng, vị thế phái sinh và sự kiện liên quan tới BTC trong bộ dữ liệu mẫu.
2. **Đối chiếu dữ liệu:** so sánh hai giai đoạn 7 ngày; phân biệt OI theo BTC với giá trị danh nghĩa USD; giữ đúng kỳ funding 8 giờ.
3. **Kiểm tra đồng thuận và mâu thuẫn:** giá đóng cửa suy yếu trong khi vị thế mở và chi phí giữ long vẫn cao.
4. **Xây dựng kịch bản:** xác định vùng giá, điều kiện xác nhận và điều kiện làm nhận định mất hiệu lực.

### Trợ lý AI

**BTC chưa có một đợt breakout được xác nhận; snapshot phù hợp hơn với một nhịp hồi bị bán ngược.** Giá đóng cửa suy yếu trong khi đòn bẩy vẫn cao, nên chưa đủ bằng chứng để gọi đây là mở rộng bền vững được dẫn dắt bởi spot.

**1. Giá hồi nhưng chưa xác nhận nhu cầu spot**

Giá đóng cửa đi từ 78.259,52 xuống 77.173,80 USD trong khi phiên có lúc chạm 79.818,34 rồi đóng thấp hơn. Nhịp hồi thất bại phù hợp với áp lực cung phía trên hơn là một breakout đã được xác nhận. [D1, D3]

**2. Phái sinh đang làm tăng độ nhạy của thị trường**

OI tính theo BTC tăng 18%, trong khi funding kỳ gần nhất là +0,018%/8 giờ, gấp ba trung vị tuần trước. Vị thế mở tăng cùng chi phí giữ long cao hơn cho thấy rủi ro đòn bẩy cần được chú ý. OI gồm cả hai phía của hợp đồng; dữ liệu này không đủ để xác định tỷ trọng long hoặc lượng vị thế sắp bị thanh lý. [D2]

**3. Sự kiện sắp tới có thể thay đổi bối cảnh**

Snapshot có một công bố CPI sau 18 giờ. Kết quả chưa xuất hiện, nên tôi chưa dùng sự kiện này để giải thích đợt tăng đã xảy ra. Sau công bố, cần đối chiếu số liệu với kỳ vọng và phản ứng thực tế của giá; đây là điểm cần đánh giá lại kịch bản, không phải một hướng giá đã biết trước. [D4]

**4. Ba kịch bản cho 24–72 giờ**

| Kịch bản       | Điều kiện theo dõi                                                                   | Hàm ý                                                                      |
| -------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Tiếp diễn tăng | Lấy lại 79.800; nến 4 giờ giữ trên vùng này với khối lượng spot cao hơn 20 nến trước | Cấu trúc nhịp hồi được sửa; cần xem funding có tiếp tục nóng lên hay không |
| Tích lũy       | Giá dao động 77.000–79.800, funding hạ nhiệt và OI không tăng thêm mạnh              | Đòn bẩy có thể được hấp thụ mà chưa xác nhận breakout                      |
| Suy yếu        | Nến 4 giờ đóng dưới 76.500 và không lấy lại vùng này                                 | Theo dõi 76.000; OI giảm nhanh sẽ gợi ý tháo vị thế                        |

**Điều gì khiến tôi thay đổi nhận định?** Một nến 4 giờ đóng dưới 76.500 USD và không lấy lại vùng này sẽ xác nhận áp lực bán tiếp diễn. Ngược lại, vượt 79.800 với hoạt động spot mạnh hơn và funding hạ nhiệt sẽ sửa được cấu trúc nhịp hồi. Tôi cũng đánh giá lại sau CPI, thay vì giữ nguyên kết luận trước sự kiện. [D1–D4]

**Mức chắc chắn: vừa phải.** Giá và khối lượng đồng thuận, nhưng đòn bẩy là tín hiệu trái chiều; dữ liệu phái sinh chỉ từ một sàn mẫu, chưa có dòng mua/bán chủ động hay ETF để kiểm chứng thêm. Không gán xác suất phần trăm khi chưa có phương pháp hiệu chuẩn.

### Người dùng hỏi tiếp

> Nếu BTC vượt 79.800 nhưng funding vẫn tăng thì sao?

### Trợ lý AI trả lời tiếp

> Khi đó, giá đã vượt vùng cản nhưng chất lượng của nhịp tăng vẫn cần kiểm tra. Tôi sẽ đối chiếu ba điểm: nến 4 giờ có giữ được trên 79.800 không, khối lượng spot có tăng so với 20 nến trước không, và OI có tiếp tục phình lên cùng funding không. Nếu spot không xác nhận trong khi OI và funding cùng tăng, tôi sẽ giảm mức tin cậy vào khả năng tiếp diễn. Nếu giá quay lại dưới 79.800, đó là dấu hiệu breakout chưa được duy trì; vùng 77.000 vẫn là mốc tiếp theo cần theo dõi.

## Cách đưa vào landing

Đây là contract nội dung và presentation cho browser-window demo đã triển khai.

- Tiêu đề conversation lấy từ prompt và được truncate trên một dòng trong header.
- Trật tự nội dung: câu hỏi → user bubble → quy trình tạm thời → heading phản biện → bảng OHLC → evidence trail → kịch bản → câu hỏi tiếp nối.
- Ưu tiên cho người xem đọc được câu hỏi, phương pháp và kết luận ngay; dành phần bên dưới cho các luận cứ và bảng kịch bản. Không thu nhỏ chữ để nhét toàn bộ báo cáo vào một khung thấp.
- Bản tĩnh hiển thị toàn bộ transcript; bản animated mô phỏng gõ, di chuyển con trỏ tới nút gửi, click submit, response reveal và scroll-to-latest.
- D1–D4 có bảng dữ liệu mẫu đi kèm, tránh tạo cảm giác AI trích dẫn nguồn thật nhưng không có nguồn để kiểm tra.
- Animation hiện tại là DOM simulation theo clock cố định: gõ câu hỏi trong composer → submit → tổng hợp → đối chiếu → kết luận → kịch bản. Mỗi trạng thái có nhãn `DEMO`; không hứa backend đang truy vấn bốn nguồn hay đang stream token.
- Bản tiếng Anh khi triển khai phải giữ nguyên con số, kỳ thời gian, điều kiện và mức chắc chắn của bản đã duyệt.

## Tiêu chí nội dung trước khi triển khai

- Có yêu cầu phân tích cụ thể và một câu hỏi tiếp nối thể hiện giữ ngữ cảnh.
- Mỗi kết luận chính liên kết được tới dữ liệu mẫu; dữ kiện, diễn giải và điều kiện được phân biệt.
- Có tín hiệu ủng hộ, tín hiệu phản biện, sự kiện sắp tới, ba kịch bản và điều kiện vô hiệu.
- Mọi con số đều nằm trong snapshot giả lập; không gắn ngày hiện tại hoặc nhãn live.
- Không hứa nguồn/integration, tốc độ, độ chính xác hay khả năng backend chưa được xác nhận.
- Nội dung đã được đưa vào dictionary English/Vietnamese, proof component và model timeline; backend và spec hiện hành không thay đổi.
