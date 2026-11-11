# Graph View API Contract

Reference schema và semantics HTTP là [OpenAPI producer](https://dev-api.signapse.cloud/v3/api-docs), theo [API consumer standards](api-consumer.md). Requirement/acceptance thuộc [SIGN-16](https://signapse-group.atlassian.net/browse/SIGN-16) và SIGN-257/258/259; design được định danh ở native parent.

Graph được chọn qua watchlist của current workspace, không fallback sang graph toàn thị trường. Bốn loại node hiện hành là Event, Asset, News Article và Narrative; Theme là metadata. Node/cạnh Warm thuộc future proposal, không phải yêu cầu FE bổ sung vào scope hiện tại.

[Planning reference](https://github.com/signapse-group/signapse-planing/blob/main/docs/reference/graph-view-api-contract.md) giữ giải thích và mapping. File này chỉ là điểm dẫn nguồn, không duy trì một bản OpenAPI hoặc requirement riêng.

[Bản trước đồng bộ 2026-10-29](https://github.com/signapse-group/signapse-ui/blob/8b881c19129de880daefad3fd4035638770d7ef3/docs/graph-view-api-contract.md) là lịch sử đã thay thế; không dùng các mô tả global/theme/source-document cũ để triển khai.
