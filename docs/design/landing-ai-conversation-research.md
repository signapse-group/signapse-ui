# Kịch bản AI Conversation — SEE THE WORKFLOW

Ngày: 2026-09-16. Trạng thái: nội dung đã được triển khai vào static fallback và DOM animation của landing showcase.

## Phạm vi và kết luận

Mục tiêu: thay phần giới thiệu AI chung chung bằng một hội thoại phân tích có yêu cầu rõ ràng, tổng hợp nhiều lớp thông tin, đối chiếu tín hiệu trái chiều và kết luận có điều kiện. Hoàn thành khi có transcript đầy đủ, bộ dữ liệu demo nhất quán, nguồn nghiên cứu và cách đưa nội dung vào stage.

Giả định: dùng BTC làm tài sản dễ nhận diện; nội dung tiếng Việt là bản gốc để duyệt. Không thay đổi backend, không xác nhận tích hợp nguồn dữ liệu mới và không thay đổi OpenSpec.

Kịch bản khuyến nghị: **“BTC đang tăng: lực mua thực hay đòn bẩy?”** Câu hỏi này cho AI cơ hội giải thích chất lượng của một đợt tăng, thay vì chỉ liệt kê chỉ báo hoặc dự đoán giá.

## Cơ sở nghiên cứu

- [CONTEXT.md](../../CONTEXT.md): AI sử dụng ngữ cảnh Market Knowledge Graph; không hứa tự nhận node/chart đang chọn hoặc luôn có đầy đủ nguồn.
- [Spec hội thoại](../../openspec/specs/ai-assistant-market-conversations/spec.md): hỗ trợ hội thoại và câu hỏi tiếp nối; request hiện đồng bộ, không token streaming.
- [LANDING.md](LANDING.md): AI stage hiện là static text-first proof. Kịch bản dưới đây có thể hiển thị tĩnh; chuyển sang demo tương tác là thay đổi riêng.
- [Dictionary hiện tại](../../app/lib/i18n/dictionaries/vi.ts): phần AI Conversation mới có title, context và history, chưa chứng minh chất lượng một câu trả lời.
- [Coinbase candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles): cung cấp OHLCV theo khoảng thời gian; dữ liệu có thể thiếu ở khoảng không có giao dịch. Hữu ích cho thiết kế lớp giá/khối lượng, không chứng minh Signapse đã kết nối Coinbase.
- [Binance Futures market data](https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data): tài liệu có open interest và lịch sử funding. Hữu ích cho lớp vị thế phái sinh; dữ liệu một sàn không đại diện toàn thị trường.

Các nguồn API xác nhận loại dữ liệu có thể sử dụng, không xác nhận các con số hoặc kết luận minh họa bên dưới. Không gắn logo/URL nhà cung cấp vào số liệu giả theo cách làm người xem hiểu là số liệu lấy từ họ.

## Bộ dữ liệu kịch bản

Hiện nhãn xuyên suốt: **Demo · Dữ liệu giả lập, không phải thị trường hiện tại**. Các mã D1–D4 là tham chiếu tới dữ liệu mẫu ngay trong demo, không phải nguồn thị trường thật.

| Mã | Dữ liệu giả lập | Phạm vi |
| --- | --- | --- |
| D1 | BTC/USD từ 64.000 lên 67.200 USD (+5%); tổng khối lượng spot tăng 24% | 7 ngày so với 7 ngày liền trước; tập sàn mẫu cố định |
| D2 | OI tính theo BTC tăng 18%; funding kỳ 8 giờ gần nhất +0,018%, trung vị kỳ 8 giờ tuần trước +0,006% | Một sàn phái sinh mẫu; không gộp USD và BTC |
| D3 | Vùng vượt đỉnh 66.000; đáy sau vượt đỉnh 65.200; đỉnh gần nhất 68.000 | Cấu trúc nến 4 giờ trong snapshot mẫu |
| D4 | Một công bố CPI dự kiến sau mốc snapshot 18 giờ; chưa có kết quả | Sự kiện giả lập có liên kết tới BTC trong ngữ cảnh mẫu |

Không gọi khối lượng spot là dòng tiền ròng. OI tăng không tự xác định bên long hay short; funding dương bổ sung bối cảnh nhưng không chứng minh đợt tăng chỉ do đòn bẩy. Không suy ra quan hệ nhân quả từ việc hai sự kiện xảy ra gần nhau.

## Transcript đề xuất

### Người dùng

> Phân tích BTC trong 7 ngày qua. Đợt tăng này có lực mua spot hỗ trợ hay chủ yếu do đòn bẩy? Kết hợp diễn biến giá, vị thế phái sinh và sự kiện vĩ mô; đưa ra kịch bản 24–72 giờ tới và điều kiện khiến nhận định thay đổi.

### Tóm tắt quy trình phân tích

Nhãn: **Cách hình thành nhận định**. Đây là bản tóm tắt phương pháp và bằng chứng, không phải nhật ký suy nghĩ nội bộ hay telemetry chạy thật.

1. **Tổng hợp ngữ cảnh:** giá, khối lượng, vị thế phái sinh và sự kiện liên quan tới BTC trong bộ dữ liệu mẫu.
2. **Đối chiếu dữ liệu:** so sánh hai giai đoạn 7 ngày; phân biệt OI theo BTC với giá trị danh nghĩa USD; giữ đúng kỳ funding 8 giờ.
3. **Kiểm tra đồng thuận và mâu thuẫn:** giá và hoạt động spot cùng tăng, nhưng vị thế mở và chi phí giữ long cũng tăng.
4. **Xây dựng kịch bản:** xác định vùng giá, điều kiện xác nhận và điều kiện làm nhận định mất hiệu lực.

### Trợ lý AI

**BTC đang có động lượng tăng được hỗ trợ bởi hoạt động spot, nhưng mức độ tham gia của đòn bẩy khiến nhịp tăng dễ bị gián đoạn hơn.** Trong snapshot này, tôi nghiêng về khả năng duy trì xu hướng nếu vùng 66.000 USD được giữ; chưa đủ bằng chứng để gọi đây là một đợt tăng bền vững trên toàn thị trường.

**1. Giá tăng đi cùng hoạt động giao dịch spot**

BTC tăng 5%, từ 64.000 lên 67.200 USD trong 7 ngày. Khối lượng spot của tập sàn mẫu cao hơn 24% so với 7 ngày trước; giá đã vượt vùng 66.000 USD. Điều này hỗ trợ nhận định đợt tăng có sự tham gia của giao dịch spot. Tuy nhiên, tổng khối lượng không cho biết dòng tiền mua ròng, nên chưa thể kết luận lực mua chủ động hoàn toàn chi phối. [D1, D3]

**2. Phái sinh đang làm tăng độ nhạy của thị trường**

OI tính theo BTC tăng 18%, trong khi funding kỳ gần nhất là +0,018%/8 giờ, gấp ba trung vị tuần trước. Vị thế mở tăng cùng chi phí giữ long cao hơn cho thấy rủi ro đòn bẩy cần được chú ý. OI gồm cả hai phía của hợp đồng; dữ liệu này không đủ để xác định tỷ trọng long hoặc lượng vị thế sắp bị thanh lý. [D2]

**3. Sự kiện sắp tới có thể thay đổi bối cảnh**

Snapshot có một công bố CPI sau 18 giờ. Kết quả chưa xuất hiện, nên tôi chưa dùng sự kiện này để giải thích đợt tăng đã xảy ra. Sau công bố, cần đối chiếu số liệu với kỳ vọng và phản ứng thực tế của giá; đây là điểm cần đánh giá lại kịch bản, không phải một hướng giá đã biết trước. [D4]

**4. Ba kịch bản cho 24–72 giờ**

| Kịch bản | Điều kiện theo dõi | Hàm ý |
| --- | --- | --- |
| Tiếp diễn tăng | Giữ 66.000; nến 4 giờ đóng trên 68.000 với khối lượng spot cao hơn trung bình 20 nến 4 giờ trước | Luận điểm tăng được củng cố; cần xem funding có tiếp tục nóng lên hay không |
| Tích lũy | Giá dao động 66.000–68.000, funding giảm về gần mức tham chiếu và OI không tăng thêm mạnh | Áp lực đòn bẩy có thể dịu lại; chưa có xác nhận vượt đỉnh |
| Suy yếu | Nến 4 giờ đóng dưới 66.000 và không lấy lại vùng này trong nến kế tiếp | Ưu tiên theo dõi đáy 65.200; nếu OI cùng giảm nhanh, kiểm tra khả năng tháo vị thế |

**Điều gì khiến tôi thay đổi nhận định?** Một nến 4 giờ đóng dưới 65.200 USD phá vỡ cấu trúc đáy đang hỗ trợ luận điểm tăng. Ngược lại, vượt 68.000 với hoạt động spot mạnh hơn và funding hạ nhiệt sẽ làm nhận định tích cực thuyết phục hơn. Tôi cũng đánh giá lại sau CPI, thay vì giữ nguyên kết luận trước sự kiện. [D1–D4]

**Mức chắc chắn: vừa phải.** Giá và khối lượng đồng thuận, nhưng đòn bẩy là tín hiệu trái chiều; dữ liệu phái sinh chỉ từ một sàn mẫu, chưa có dòng mua/bán chủ động hay ETF để kiểm chứng thêm. Không gán xác suất phần trăm khi chưa có phương pháp hiệu chuẩn.

### Người dùng hỏi tiếp

> Nếu BTC vượt 68.000 nhưng funding vẫn tăng thì sao?

### Trợ lý AI trả lời tiếp

> Khi đó, giá đã xác nhận vượt vùng cản nhưng chất lượng của nhịp tăng vẫn cần kiểm tra. Tôi sẽ đối chiếu ba điểm: nến 4 giờ có giữ được trên 68.000 không, khối lượng spot có tăng so với 20 nến trước không, và OI có tiếp tục phình lên cùng funding không. Nếu spot không xác nhận trong khi OI và funding cùng tăng, tôi sẽ giảm mức tin cậy vào khả năng tiếp diễn. Nếu giá quay lại dưới 68.000, đó là dấu hiệu vượt cản chưa được duy trì; vùng 66.000 vẫn là mốc tiếp theo cần theo dõi.

## Cách đưa vào landing

Đây là đề xuất biên tập, không phải thay đổi thiết kế đã triển khai.

- Tiêu đề: **Từ câu hỏi thị trường đến nhận định có cơ sở.**
- Dòng dẫn: **Kết nối dữ liệu, đối chiếu tín hiệu trái chiều và biết khi nào cần thay đổi nhận định.**
- Trật tự nội dung: nhãn Demo → câu hỏi → bốn bước phương pháp → kết luận nổi bật → phân tích đầy đủ → câu hỏi tiếp nối.
- Ưu tiên cho người xem đọc được câu hỏi, phương pháp và kết luận ngay; dành phần bên dưới cho các luận cứ và bảng kịch bản. Không thu nhỏ chữ để nhét toàn bộ báo cáo vào một khung thấp.
- Bản tĩnh có thể hiển thị toàn bộ transcript. Nếu cần thu gọn, đề xuất riêng control “Đọc phân tích đầy đủ”; không dùng animation như điều kiện để nội dung xuất hiện.
- D1–D4 có bảng dữ liệu mẫu đi kèm, tránh tạo cảm giác AI trích dẫn nguồn thật nhưng không có nguồn để kiểm tra.
- Animation hiện tại là DOM simulation theo clock cố định: câu hỏi → tổng hợp → đối chiếu → kết luận → kịch bản. Mỗi trạng thái có nhãn `DEMO`; không hứa backend đang truy vấn bốn nguồn hay đang stream token.
- Bản tiếng Anh khi triển khai phải giữ nguyên con số, kỳ thời gian, điều kiện và mức chắc chắn của bản đã duyệt.

## Tiêu chí nội dung trước khi triển khai

- Có yêu cầu phân tích cụ thể và một câu hỏi tiếp nối thể hiện giữ ngữ cảnh.
- Mỗi kết luận chính liên kết được tới dữ liệu mẫu; dữ kiện, diễn giải và điều kiện được phân biệt.
- Có tín hiệu ủng hộ, tín hiệu phản biện, sự kiện sắp tới, ba kịch bản và điều kiện vô hiệu.
- Mọi con số đều nằm trong snapshot giả lập; không gắn ngày hiện tại hoặc nhãn live.
- Không hứa nguồn/integration, tốc độ, độ chính xác hay khả năng backend chưa được xác nhận.
- Nội dung đã được đưa vào dictionary English/Vietnamese, proof component và model timeline; backend và spec hiện hành không thay đổi.
