# Plan cập nhật FE theo quy ước contract API

Ngày khảo sát và chốt plan: 2026-10-07. Trạng thái: **đã được người dùng chấp nhận;
đã triển khai thay đổi local và review; verification có giới hạn ghi bên dưới**.

Mục tiêu: FE dùng trực tiếp contract producer đã publish để thiết kế, implement,
review và handoff integration; giữ requirement/acceptance trong Jira và ownership
của từng repo. Phạm vi update gồm instruction, prompt, skills, evidence và sửa
verification đang phụ thuộc tài liệu mapping sẽ bị xóa. Integration feature,
sửa API BE, generated SDK, test suite mới, Jira writes và installed-worker rollout
thuộc công việc được giao riêng.

Điều chỉnh plan theo yêu cầu ngày 2026-10-07: **xóa `docs/APIMAPPING.md` và toàn bộ
`.agents/skills/api-mapping-sync/`**.
Contract kỹ thuật HTTP có một nguồn: OpenAPI producer publish cho đúng môi trường.
Jira vẫn là nguồn requirement/acceptance; source code FE xác định các điểm đang
consume API. Test fixtures là dữ liệu kiểm thử, không phải contract API chuẩn.
Agent đọc contract live rồi tìm usages trong code, thay vì đồng bộ một bản mapping
thứ hai. Handoff chỉ giữ references, kết quả kiểm tra và discrepancy; không tạo
ledger, schema snapshot hay skill thay thế.

## Nguồn đã xác minh

- Planning checkout sạch, HEAD trùng remote HEAD:
  [`03987644910f1b5db65ed0b1331930c458fc80db`][planning-revision]. Quyết định API
  được commit trong [policy contract/handoff][api-policy] và [format comment][handoff-format].
- FE checkout sạch trước khảo sát tại
  [`67d8c17b7a0f867c3a5d5e2c89b07edd3fb3f788`][ui-revision], branch
  `codex/jira-workflow-adaptation`. Đây là baseline sau đợt Jira adaptation.
- Symphony checkout sạch, HEAD trùng remote HEAD:
  [`2a58b987a1eb5b7bc02659fd5a49df8164807a4c`][symphony-revision].
  [Runtime guide][symphony-guide] giao prompt/policy cho consumer repo; runtime
  kiểm tra routing/admission, không xác minh delivery evidence.
- Đã đọc live body, native relationships và toàn bộ comments của
  [SIGN-115][parent-task] và [SIGN-116][producer-task] lúc khoảng 10:15 UTC+7.
  Cả hai đang `Progress`. SIGN-115 giao BE trước, deferred MDG và loại FE khỏi
  scope triển khai của đợt đó; plan FE này là follow-up theo yêu cầu hiện tại.

GET [OpenAPI dev][dev-openapi] lúc **2026-10-07 03:17:46 UTC** trả HTTP 200,
JSON có OpenAPI `3.1.0`, `paths` và `components.schemas`. Bản đọc có 105 paths,
138 operations, 1 operation có description; title `OpenAPI definition`, version
`v0`, server `http://dev-api.signapse.cloud`. Không tìm thấy build/revision
metadata ở root hoặc `info`. Các số này là hiện trạng, không phải target nghiệm thu.
Không khảo sát toàn bộ semantics hoặc chạy authenticated business smoke.

Comment SIGN-116 đã đọc lúc 10:15 ghi còn AC-10, delivered revision/PR/CI và
dev publication evidence. Vì vậy nguồn đã đọc chưa chứng minh contract chuẩn hóa
đã bàn giao trên dev. Không suy status `Progress`, PR sửa quyền workspace hoặc
GET thành công thành bằng chứng hoàn tất API delivery. Các ghi chú migration cũ
trong planning giữ revision/ngày khảo sát riêng, không thay evidence hiện hành.

## Những quyết định đã chốt ở planning

| Quy ước                                                                                                       | Hệ quả đối với FE                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jira giữ requirement/scope/acceptance; producer publish OpenAPI làm nguồn kỹ thuật của HTTP API đang hỗ trợ.  | Đọc cả hai nguồn đúng vai trò. Khi Jira, OpenAPI và implementation lệch nhau, ghi discrepancy và đưa về owner quyết định; không chọn behavior đang chạy làm expected result.                                                                                                                      |
| Contract gồm schema và business semantics ảnh hưởng consumer.                                                 | Đọc parameters/headers, required/nullability/omission, media types, success/error status, auth, ownership/workspace, conditional fields, lifecycle, side effects, quota, retry/idempotency và giới hạn áp dụng. SSE cần event/payload/semantics; WebSocket dùng reference canonical của producer. |
| Consumer fetch contract hiện hành đúng môi trường; API chưa publish còn là đề xuất.                           | Ghi URL, environment và revision/thời điểm kiểm tra. Spec local, comment hoặc ledger không thay contract đã publish hoặc chứng minh producer đã giao.                                                                                                                                             |
| Breaking change BE → FE đã được chấp nhận **trên dev**: BE deploy/publish → handoff → FE integration.         | Chấp nhận lệch tạm trong khoảng chuyển tiếp theo quyết định này; handoff nêu breaking change, consumer và integration còn chờ. Không áp dụng mặc định cho production hoặc coi lệch tạm là feature/QA hoàn tất.                                                                                    |
| Handoff giữ references/evidence, có `API contract` và `Contract live check`; giữ evidence các revision trước. | FE phân biệt revision output của mình với revision API producer và environment. Comment không trở thành bản schema hoặc business-rule spec thứ hai.                                                                                                                                               |
| Hoàn thiện contract documentation không mặc định sinh test suite hay QA Subtask riêng.                        | Dùng checks hiện có theo loại thay đổi. Thay đổi runtime vẫn theo verification policy FE; fixture/mock không chứng minh live integration.                                                                                                                                                         |

Các quy ước trên nằm trong [policy đã commit][api-policy] và [SIGN-115][parent-task].
[Planning to-spec][planning-to-spec] còn quy định mặc định một Subtask UI +
integration, có native dependency tới producer khi cần API mới; chỉ tách khi UI
có deliverable hợp lệ độc lập. FE đề xuất sửa issue map qua coordinator, không tự
tách ticket hoặc bỏ dependency để chạy mock.

SIGN-116 AC-4 đã được coordinator làm rõ ngày 07/10: supported filter scope lấy
từ nghiệp vụ được chấp nhận, không suy mọi field của entity/generic resolver thành
capability. `User.birthday` nằm ngoài contribution đó. FE review cần giữ nguyên
ranh giới này, không đưa exclusion riêng của SIGN-116 thành quy tắc toàn sản phẩm.

## Gap tại baseline trước implementation

| Điểm hiện có                                                                                                                                                                                  | Phần cần xử lý                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [WORKFLOW.md](../WORKFLOW.md) và [AGENTS.md](../AGENTS.md) dẫn APIMAPPING/api-mapping-sync.                                                                                                   | Bỏ pointer đã retire, dùng trực tiếp contract producer và source code FE; làm rõ requirement Jira và trạng thái proposed/published. Lifecycle Jira vẫn chỉ áp dụng khi được giao/activate.              |
| [api-handoff.md](../.agents/skills/agent-execution-policy/references/api-handoff.md) giữ producer ownership và chặn contract thiếu.                                                           | Bổ sung lookup live, coverage semantics/protocol, revision/environment và thứ tự breaking change dev.                                                                                                   |
| [Execution policy](../.agents/skills/agent-execution-policy/references/execution-policy.md) có native blocker admission và một handoff comment.                                               | Dependency Done không tự chứng minh contract đã publish đúng bản. Template thiếu hai field API và yêu cầu giữ evidence revision trước.                                                                  |
| `implement`, `technical-design`, `code-review` đọc linked contracts.                                                                                                                          | Đưa consumer lookup, impact analysis trong source code và review schema/semantics vào các entrypoint hiện có; không cần mapping skill riêng.                                                            |
| `docs/APIMAPPING.md` cùng `api-mapping-sync` duy trì một lớp đồng bộ FE.                                                                                                                      | Xóa cả tài liệu lẫn thư mục skill, gồm metadata và references; bỏ các active pointers. `skills-lock.json` hiện không có entry skill này.                                                                |
| [contract-guard.mjs](../tests/e2e/contract-guard.mjs) đọc APIMAPPING để kiểm tra fixture paths.                                                                                               | Xóa file ngay sẽ làm `pnpm test:contract` và `pnpm test:quality` lỗi. Guard hiện chỉ kiểm tra path xuất hiện trong Markdown, không đối chiếu method/status/schema với producer. Cần sửa guard cùng đợt. |
| [ADR 0009](adr/0009-separate-feedback-implementation-and-activation-gates.md) dùng runtime semantics trong APIMAPPING và miễn một số gap OpenAPI khỏi completion.                             | Đánh dấu quyết định cũ superseded bởi policy producer mới, giữ lịch sử; contract thiếu ảnh hưởng integration cần owner xử lý, không dùng fallback semantics FE.                                         |
| [ADR 0004](adr/0004-layered-automated-quality-gates.md), [browser testing](testing/browser-tests.md) và [Jira adaptation plan](jira-workflow-adaptation-plan.md) còn references ledger/skill. | Refresh hướng dẫn còn hiệu lực; giữ evidence lịch sử có nhãn ngày và pointer tới policy hiện hành.                                                                                                      |
| `setup-workflow` và reference giữ đúng Jira profile/routing.                                                                                                                                  | Refresh prompt dùng pointer chung mới, giữ configuration và permissions.                                                                                                                                |

## Plan update theo thứ tự

### 1. Chốt nguồn chung và policy consumer

Cập nhật [AGENTS.md](../AGENTS.md) bằng pointer ngắn về authority API; sửa phần
API context trong [WORKFLOW.md](../WORKFLOW.md). Dùng
[api-handoff.md](../.agents/skills/agent-execution-policy/references/api-handoff.md)
làm reference local cho chi tiết consumer lookup, discrepancy và dev handoff;
link về policy planning. Reference này sở hữu quy trình consumer, không lưu schema
hoặc business rules API. Các entrypoint trỏ đến nó; nội dung API luôn đọc từ producer.

Cập nhật [execution-policy.md](../.agents/skills/agent-execution-policy/references/execution-policy.md):
native dependency admission giữ nguyên, thêm kiểm tra evidence API khi integration
phụ thuộc producer delivery; refresh contract khi start/resume/handoff và khi bản
publish thay đổi. Chỉ chặn phần phụ thuộc có gap. SIGN-116 chưa Done không mặc định
chặn mọi việc FE hoặc mọi API đã đủ contract; native dependencies/scope quyết định
contribution nào cần chờ. Không bắt mọi task FE đợi hoàn thiện toàn bộ inventory BE.

Handoff thêm hai field conditional theo planning:

```text
- API contract: <producer OpenAPI/protocol URL; producer revision/environment> | Not applicable
- Contract live check: <fetch time; revision match/result and evidence> | Not applicable
```

Output FE vẫn nằm ở `Revision/output`; consumer reference không phải FE publication.
`Remaining` ghi coverage/discrepancy, breaking change, consumer và integration còn
chờ khi áp dụng. `Not applicable` chỉ dùng khi output không liên quan API. Không
đoán SHA từ `info.version` hoặc bắt producer dùng một metadata key chưa được chốt;
liên kết cơ chế trace revision/deployment do producer cung cấp và báo gap nếu
chưa đối chiếu được. Update cùng agent-owned comment giữ references/evidence của
revision trước và không ghi đè nội dung con người.

### 2. Xóa lớp mapping và đồng bộ các entrypoint

Xóa `docs/APIMAPPING.md` và đủ bốn file trong `.agents/skills/api-mapping-sync/`:
`SKILL.md`, `agents/openai.yaml`, `references/change-checklist.md` và
`references/diff-report-template.md`. Không giữ placeholder hoặc tạo skill/ledger
mới cùng chức năng. Lịch sử đã nằm trong Git; decision/delivery evidence còn cần
được giữ ở nguồn hiện có, không copy schema cũ sang file mới.

| File/nhóm file                                                                                                                                                  | Thay đổi đề xuất                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [AGENTS.md](../AGENTS.md), [WORKFLOW.md](../WORKFLOW.md), [app/api/AGENTS.override.md](../app/api/AGENTS.override.md)                                           | Bỏ trigger/pointer APIMAPPING và api-mapping-sync; thay bằng lookup trực tiếp producer theo API reference chung. Giữ các guardrails transport/auth và scoped ownership.                          |
| [agent-execution-policy/SKILL.md](../.agents/skills/agent-execution-policy/SKILL.md)                                                                            | Pointer tải API reference cho integration liên quan, giữ scope activation hiện tại.                                                                                                              |
| [implement/SKILL.md](../.agents/skills/implement/SKILL.md)                                                                                                      | Ground integration từ contract live và handoff producer áp dụng; tìm impact trong actions/definitions/UI, refresh khi resume. Giữ fixture evidence riêng với live verification.                  |
| [technical-design/SKILL.md](../.agents/skills/technical-design/SKILL.md)                                                                                        | Phân biệt published API và proposed change; ghi source/time/revision, affected consumer/dependency và sequence dev. Đối chiếu quy tắc UI + integration của planning.                             |
| [code-review/SKILL.md](../.agents/skills/code-review/SKILL.md)                                                                                                  | Requirement adherence theo accepted AC/expected behavior; Correctness & Standards đối chiếu consumer code với schema/semantics và source evidence producer. Ghi discrepancy để owner quyết định. |
| [setup-workflow/SKILL.md](../.agents/skills/setup-workflow/SKILL.md), [symphony-workflow.md](../.agents/skills/setup-workflow/references/symphony-workflow.md)  | Refresh prompt giữ authority/pointer chung, không tái sinh mapping pointer; bảo toàn YAML, permissions và host settings.                                                                         |
| [ADR 0009](adr/0009-separate-feedback-implementation-and-activation-gates.md)                                                                                   | Mark superseded với nguồn/ngày quyết định mới và giữ text lịch sử. Không còn cho phép APIMAPPING hoặc OpenAPI omissions ảnh hưởng integration thay gate contract hiện hành.                      |
| [ADR 0004](adr/0004-layered-automated-quality-gates.md), [browser-tests.md](testing/browser-tests.md), [Jira adaptation plan](jira-workflow-adaptation-plan.md) | Bỏ hướng dẫn active dùng ledger/skill; giải thích đúng phạm vi fixture guard và live check. Ghi chú supersession cho phần khảo sát cũ, không sửa kết quả/ngày evidence lịch sử.                  |

`app/lib` đã kế thừa AGENTS và yêu cầu DTO/validation theo backend, không cần thêm
policy trùng. Giữ nguyên application behavior, auth/i18n và lockfiles không bị ảnh
hưởng. Giữ safeguards của `tdd`, `diagnosing-bugs`, merge-conflict và UI skills.

Follow-up với owner planning: retire bản `docs/frontend/APIMAPPING.md` ngày 18/9
và refresh `docs/frontend/README.md`, các bản ADR 0004/0009 cùng active references
để agent dùng nguồn producer. Phần cleanup này có diff riêng trong repo planning;
phân biệt implementation local với publication và installed-worker rollout.

### 3. Bỏ phụ thuộc Markdown trong verification

Reuse [contract-guard.mjs](../tests/e2e/contract-guard.mjs) và
[fixture registry](../tests/e2e/fixtures/contract-registry.mjs): bỏ đọc/parsing
APIMAPPING, giữ checks method/path/status và duplicate entries. Lần chạy P0 báo
đúng là fixture consistency, không tuyên bố đã đối chiếu producer. Registry và
fixture backend là test inputs/behavior, không trở thành contract source thay thế.

Để giữ một gate đối chiếu nguồn thực, thêm chế độ live vào guard hiện có và gọi nó
trong [integration runner](../tests/integration/run.mjs), sau khi environment đã
được validate. Fetch OpenAPI của đúng public HTTPS backend được cấu hình và so
method/path/declared response status của fixture operations với bản publish;
report coverage và discrepancy. Canonical identity lấy từ operation của producer,
không chỉ regex dò path trong tài liệu. Review schema/semantics và delivered
revision vẫn theo workflow; một structural check không chứng minh full conformance.
Không tự sửa fixture status/payload để che mismatch hoặc bỏ operation khỏi coverage
chỉ để check xanh; xác minh supported scope và đưa gap về owner.

P0 giữ chạy bằng fixtures, không thêm live dependency vào `pnpm test:quality`.
Lane live giữ read-only, dùng environment/credential safeguards hiện có, không
fallback sang Markdown/cache khi nguồn lỗi. Missing contract/evidence/access phải
được báo là chưa đạt, độc lập với P0 pass. Không tạo snapshot OpenAPI được duy trì
trong Git, framework, dependency hoặc test suite API mới.

### 4. Verify thay đổi rồi áp dụng cho contribution được giao

Đợt update instruction có thể làm trước BE publication. Nội dung đề xuất không
đổi Jira labels/states/dependency admission, YAML runtime hay quyền merge/deploy.
Không kích hoạt installed worker hoặc tạo/chuyển Jira issue trong đợt này.

Kiểm tra UTF-8, local links, Markdown formatting, skill front matter còn giữ lại
và instruction consistency. Search toàn repo để xác nhận không còn import/file
reader hoặc active pointer tới artifact/skill đã xóa; mentions trong evidence/ADR
lịch sử phải ghi rõ superseded. Xác nhận YAML front matter không đổi; reuse
[consumer checker](../scripts/check-symphony-workflow.exs) để parse config/render
strict Liquid offline bằng Symphony tương ứng, không polling/clone/live writes.

Vì đợt này sửa Node verification code, chạy focused guard checks và
`pnpm test:quality`; chạy `pnpm test:integration` để verify live mode và lane
integration thực, giữ read-only và report riêng. Kiểm tra guard bắt mismatch
method/path/status, nguồn unavailable/invalid và không đọc file đã xóa; xác nhận
P0 vẫn chạy khi không truy cập mạng ngoài. Missing private environment hoặc
producer contract gaps là giới hạn cụ thể cần báo, không biến thành live pass.
Không thêm test suite API chỉ để update docs/skills.

Review readiness bằng các tình huống: API đã publish đủ cho scope; API mới còn
proposed; native blocker Done nhưng thiếu publication/revision evidence; schema
hoặc semantics mâu thuẫn requirement; approved breaking change dev; resume gặp
contract mới làm mất hiệu lực checks; task không liên quan API dùng N/A. Assigned
workflow tiếp tục yêu cầu một reviewer độc lập với hai axes như policy hiện tại.

Khi có task FE integration: đọc requirement/native dependencies → fetch contract
liên quan và đối chiếu producer handoff áp dụng → tìm usages/impact trong code FE → implement
và verify behavior đã chấp nhận → review → ghi handoff với contract/evidence đã
đối chiếu. Mock không chứng minh producer readiness hoặc live integration. Không
mark feature/QA hoàn tất chỉ từ contract tồn tại hoặc API documentation được nghiệm thu.

Hoàn tất adaptation khi APIMAPPING và mapping skill đã được xóa đầy đủ, không còn
active pointers/reader phụ thuộc chúng; entrypoints thống nhất lookup/discrepancy,
handoff có hai field mới và giữ evidence history; fixture/live guards hoạt động
đúng scope, review bao phủ semantics và guardrails Jira/runtime được bảo toàn.
Contract kỹ thuật chỉ lấy từ producer; không có ledger/skill/snapshot thay thế.
Đây là completion của adaptation, không phải acceptance SIGN-115/116 hay feature.

## Evidence triển khai ngày 2026-10-07

- FE: đã xóa APIMAPPING và đủ bốn file mapping skill, cập nhật authority/pointers,
  consumer policy, review/design/setup và conditional handoff. YAML runtime giữ nguyên.
- Planning: đã xóa bản mapping cũ, refresh frontend index, ADR 0004/0009 và reference
  rollout trong nghiên cứu Dashboard Market Narratives; diff ở branch riêng
  `codex/api-contract-workflow`, chưa publish hoặc kích hoạt worker.
- Regression trước fix: guard cũ exit 1 khi chạy ở thư mục không có mapping;
  sau fix, offline guard và 26 checks tập trung đạt. Typecheck phát hiện test child
  thiếu `NODE_ENV` theo type Next; đã sửa và typecheck đạt.
- `pnpm test:quality`: lint đạt với 23 warnings ở source không đổi, typecheck đạt,
  269 Vitest tests/49 files đạt, fixture consistency 59 operations đạt và production
  build đạt. Browser run ban đầu: 51 pass, 2 fail, 1 performance opt-in skipped;
  command exit 1. Hai case fail là market-chart timeframe/SSE (timeout chờ stream 4h)
  và profile-menu locale/theme/layout (dev overlay chặn pointer). Rerun đúng hai
  case, output riêng `test-results/api-workflow-rerun`, đạt 2/2 trong 56.2 giây,
  không sửa application code hoặc browser tests. Không tuyên bố command full-run
  ban đầu đã xanh; các transient failures còn là evidence limit của P0.
- Review độc lập một reviewer: Requirement adherence và Correctness & Standards
  đều PASS, không có actionable findings trên contribution này. Reviewer fetch
  riêng lúc 03:58:26 UTC và xác nhận lại cùng 9 API discrepancies. Ba file workflow
  planning phát sinh QA guidance đồng thời không thuộc ownership contribution;
  đã đối chiếu, giữ nguyên và API policy section không thay đổi.
- UTF-8, local links, Markdown/code formatting và YAML syntax của năm skill
  entrypoints đã kiểm tra. `WORKFLOW.md` YAML front matter và toàn bộ Liquid
  expression tokens giữ nguyên so với baseline. Consumer checker Elixir chưa
  rerun được vì local Docker daemon unavailable; chưa thay đổi hay kích hoạt
  installed Symphony worker. Skill `quick_validate.py` không chạy được do Python
  thiếu PyYAML; metadata đã parse bằng YAML parser hiện có và giữ name/description.
  Lockfiles và application behavior không đổi.
- Live guard fetch lúc **2026-10-07 03:41:36 UTC**, từ [OpenAPI dev][dev-openapi]:
  59 fixture operations được so sánh, 9 discrepancies; gate exit 1 đúng thiết kế.
  Read-back các operation liên quan xác nhận các declarations dưới đây.

| Operation                                         | Fixture declaration | Published declaration tại lần kiểm tra |
| ------------------------------------------------- | ------------------- | -------------------------------------- |
| DELETE `/me/feedback-submissions/{id}`            | 204                 | 200                                    |
| DELETE `/feedback-submissions/{id}`               | 204                 | 200                                    |
| GET `/watchlists/assets`                          | GET/200             | Path chỉ có POST                       |
| DELETE `/watchlists/assets/{assetId}`             | 204                 | 200                                    |
| POST `/me/notes`                                  | 200                 | 201                                    |
| DELETE `/me/notes/{id}`                           | 204                 | 200                                    |
| DELETE `/telegram/bot-connections/{id}`           | 204                 | 200                                    |
| DELETE `/telegram/destinations/{id}`              | 204                 | 200                                    |
| DELETE `/telegram/market-analysis-schedules/{id}` | 204                 | 200                                    |

Đây là evidence discrepancy có thời điểm, không phải một mapping/spec được duy trì.
BE/FE owner cần đối chiếu supported scope, implementation và accepted requirements;
chưa sửa fixture hoặc API behavior chỉ để gate xanh. Structural check không xác định
phía nào sai hoặc chứng minh runtime behavior của protected endpoints.

`pnpm test:integration` exit 1 trước browser run vì phiên này thiếu private app/account
environment (`API_BASE_URL`, Clerk dev keys, account/password). Public OpenAPI check
đã chạy riêng; không có authenticated smoke, API mutations hoặc Jira writes.

[planning-revision]: https://github.com/signapse-group/signapse-planing/commit/03987644910f1b5db65ed0b1331930c458fc80db
[api-policy]: https://github.com/signapse-group/signapse-planing/blob/03987644910f1b5db65ed0b1331930c458fc80db/workflow/project-execution-workflow.md#contract-api-và-handoff
[handoff-format]: https://github.com/signapse-group/signapse-planing/blob/03987644910f1b5db65ed0b1331930c458fc80db/workflow/issue-tracker.md#delivery-handoff-comment
[planning-to-spec]: https://github.com/signapse-group/signapse-planing/blob/03987644910f1b5db65ed0b1331930c458fc80db/.agents/skills/to-spec/SKILL.md
[ui-revision]: https://github.com/signapse-group/signapse-ui/commit/67d8c17b7a0f867c3a5d5e2c89b07edd3fb3f788
[symphony-revision]: https://github.com/signapse-group/signapse-symphony/commit/2a58b987a1eb5b7bc02659fd5a49df8164807a4c
[symphony-guide]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/elixir/README.md#routed-jira-subtask-workflows
[parent-task]: https://signapse-group.atlassian.net/browse/SIGN-115
[producer-task]: https://signapse-group.atlassian.net/browse/SIGN-116
[dev-openapi]: https://dev-api.signapse.cloud/v3/api-docs
