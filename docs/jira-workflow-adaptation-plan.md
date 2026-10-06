# Kế hoạch adapt Signapse UI với Planning, Jira và Symphony

Khảo sát ngày 2026-10-06; consumer adaptation được người dùng chấp nhận triển khai
ngày 2026-10-06. Workflow và skills UI đã được cập nhật theo phạm vi dưới đây.
Installed-runtime rollout, Jira writes và canary live là bước vận hành riêng.

## Kết luận và phạm vi

Dùng Jira `SIGN` làm nguồn contract và trạng thái công việc. Planning sở hữu
requirement, hierarchy, routing và acceptance; Symphony sở hữu runtime điều phối;
UI sở hữu policy implementation, skills local, checks, review và handoff. GitHub
tiếp tục giữ source, branch, PR và CI. Runtime Jira cần thiết đã có trong source
Symphony; consumer UI đã được adapt, còn bản cài và activation trên host cần xác minh riêng.

Mục tiêu là một FE worker nhận đúng Jira Subtask được coordinator giao, thực thi
đúng parent contract, bàn giao vào `In Review` và để coordinator quyết định `Done`.
Giả định giữ clone/bootstrap và các tham số deployment hiện có cho đến khi kiểm
tra host; không đoán đường dẫn workspace, tài khoản, model hoặc credential mới.

Ngoài phạm vi: sửa tính năng dashboard, thêm tracker adapter/webhook, đồng bộ hai
ticket store, migration worker BE/QA/MDG/LANDING, migration workflow phát triển
Symphony, tự merge/deploy hoặc di chuyển hàng loạt tài liệu giữa các repo.

## Bằng chứng khảo sát trước implementation

| Nguồn               | Revision đối chiếu với remote HEAD         | Kết quả                                                                                                                                                                                 |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signapse-planing`  | `99487c60ee43eaf9b125115efa968e8cc1e097cf` | Worker chỉ nhận Subtask; FE dùng `route-frontend`; merge không hoàn tất Jira issue. [Workflow planning][planning-workflow], [Subtask format][planning-subtask].                         |
| `signapse-symphony` | `2a58b987a1eb5b7bc02659fd5a49df8164807a4c` | Có filter type/routing, parent context, dependency admission, recovery và `jira_rest`; consumer tự sở hữu instructions/skills. [Jira guide][symphony-guide], [client][symphony-client]. |
| `signapse-ui`       | `68aad304964221e95b781e4057ce1747dea653ca` | Còn GitHub Project #1, Task/Bug, lifecycle cũ và merge-only completion ở baseline khảo sát. [WORKFLOW baseline][ui-workflow-baseline], [execution policy baseline][ui-policy-baseline]. |

UI và Symphony sạch lúc bắt đầu khảo sát. Planning có thay đổi local ở design
override, Pen và validation assets; không dùng chúng để suy ra requirement mới
hoặc khả năng runtime. Kết luận workflow dựa trên các file policy đã commit.

Jira live xác nhận project `SIGN` có Epic, Story, Task, Bug và Subtask. Subtask có
`Open`, `Ready`, `Progress`, `In Review`, `Blocked`, `Done`. Đã đọc
[SIGN-114][jira-sample]: đúng route FE, parent [SIGN-111][jira-parent], bị chặn bởi
`SIGN-112`; cả Subtask và blocker đang `Open`. Transition hiện có tới `Ready` mang
tên `Approve and queue implementation`: phải phân biệt tên transition với status
đích. Đây là mẫu kiểm tra read-only, chưa đủ điều kiện dispatch và không phải
canary tự động được phép chạy.

GitHub API của UI hiện liệt kê `pages-build-deployment`, không có PR quality
workflow. ADR quality lane là định hướng; phải xác minh required checks thực tế
trước handoff, không suy CI quality từ Pages. [ADR quality gates](adr/0004-layered-automated-quality-gates.md).

## Những khác biệt tại baseline và cách xử lý

| Hiện trạng UI                                     | Adaptation cần thiết                                                                                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Task/Bug, không có route bắt buộc          | Chỉ Jira Subtask của `SIGN`, native parent hợp lệ và đúng một route FE.                                                                                          |
| Dispatch chỉ `Ready`; active `In progress`        | Dispatch/active gồm `Ready` và `Progress`; loại `In Review`, `Blocked`, `Done`. `Progress` dành cho recovery của operation đã được giao.                         |
| Issue body là toàn bộ contract                    | Đọc live Subtask, parent, accepted comments và references ở start/resume/handoff; Subtask giữ phần đóng góp, parent giữ outcome.                                 |
| Native GitHub closing link, PR body bắt buộc rỗng | PR title chứa Jira key; dùng GitHub for Atlassian Development panel. Bỏ `addCloseIssueReferences`/`closingIssuesReferences` và yêu cầu body rỗng của tracker cũ. |
| Merge và Project `Item closed` hoàn tất issue     | Agent dừng ở `In Review`; coordinator chuyển `Done` sau review/check, merge nếu cần và deploy/evidence khi deliverable yêu cầu.                                  |
| Blocker resume về dispatch state                  | Ghi pre-Blocked status; coordinator resume đúng status trước Blocked qua native Jira rule, không skip gate.                                                      |
| Skills được mô tả là shared package từ Symphony   | Giữ các skills đang có như tài liệu UI sở hữu; cập nhật policy Jira và bỏ metadata đồng bộ tới package đã xóa.                                                   |

Tại baseline, các skills `agent-execution-policy`, `implement`, `setup-workflow`,
`code-review` đã được Git track trong UI nhưng policy còn dùng GitHub;
`skills-lock.json` có chín entry trỏ vào `signapse-symphony/workflow/skills/*` đã bị
gỡ. Adaptation giữ skills local, cập nhật policy và bỏ chín records source đã mất;
không dựng lại package ở Symphony.

## Profile FE đích

Phần tracker đề xuất cho root `WORKFLOW.md`:

```yaml
tracker:
  kind: jira
  provider:
    base_url: $JIRA_BASE_URL
    email: $JIRA_EMAIL
    api_token: $JIRA_API_TOKEN
    project_key: SIGN
    issue_types: [Subtask]
    routing_labels:
      - route-backend
      - route-frontend
      - route-quality-assurance
      - route-mdg
      - route-landing
  required_labels: [route-frontend]
  dispatch_states: [Ready, Progress]
  active_states: [Ready, Progress]
  review_state: In Review
  terminal_states: [Done]
```

Danh sách toàn bộ routing labels giúp runtime loại ticket có hai route; các label
nghiệp vụ khác vẫn được phép. Prefix `FE:` giúp đọc title, không thay label.
Parent Ready, assignee hoặc cùng parent không thay dispatch gate/dependency.
Native `Blocks` phải hoàn tất theo Jira category `done`; blocker `Resolved` trong
category In Progress chưa đáp ứng admission. [Runtime selection/admission][symphony-client].

Giữ `$SYMPHONY_WORKSPACE_ROOT`, clone `signapse-group/signapse-ui`, credential helper,
`pnpm install --frozen-lockfile`, polling, concurrency, turn limits và Codex settings
đang có. Host phải cấp root riêng cho FE và không trộn với workspace của tracker
cũ. Credential Jira nằm ngoài repo; `jira_rest` do Symphony cấp, Git/PR cần quyền
GitHub và tooling riêng. Không giả định tool GitHub tracker còn được cấp khi chọn Jira.

## Kế hoạch thay đổi trong UI

Thực hiện thành một thay đổi consumer hoàn chỉnh; không tách ticket chỉ theo file
hoặc skill. Nếu giao qua Symphony, contribution là Subtask route FE dưới parent
được coordinator định nghĩa. Các bước dưới đây là thứ tự implementation, chưa là
ticket đã publish.

| Bước                           | File/phạm vi                                                                                                                                                           | Output cần có                                                                                                                                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Chốt policy local           | `.agents/skills/agent-execution-policy/SKILL.md`, `references/execution-policy.md` và references liên quan khi bị ảnh hưởng                                            | Đổi authority từ shared package sang repo-owned policy. Quy định Jira contract, lifecycle, permissions, blocker/resume, PR linking và delivery gate. Giữ decision/API guardrails và ranh giới giữa workflow run với yêu cầu ad hoc.                                                      |
| 2. Đồng bộ consumer skills     | `.agents/skills/implement/SKILL.md`, `.agents/skills/code-review/SKILL.md`, `.agents/skills/setup-workflow/SKILL.md`, `setup-workflow/references/symphony-workflow.md` | Implementation/review dùng live Jira Subtask + parent. Setup sinh profile Jira đúng route/states. Bỏ logic GitHub issue/Project/auto-close. Giữ một reviewer độc lập, hai axes và reuse branch/PR.                                                                                       |
| 3. Kiểm tra references còn lại | `.agents/skills/diagnosing-bugs`, `tdd`, `technical-design`, metadata `agents/openai.yaml`                                                                             | Sửa wording hoặc references bị ảnh hưởng; không viết lại thuật toán hay xóa skill không liên quan. Không để nguồn cũ tái tạo workflow GitHub sau migration.                                                                                                                              |
| 4. Bỏ upstream đã mất          | `skills-lock.json`                                                                                                                                                     | Bỏ chín records source Symphony cho `agent-execution-policy`, `code-review`, `codebase-design`, `diagnosing-bugs`, `implement`, `resolving-merge-conflicts`, `setup-workflow`, `tdd`, `technical-design`. Giữ files local và các nguồn third-party khác; không bịa source type/hash mới. |
| 5. Chuyển entrypoint           | `WORKFLOW.md`                                                                                                                                                          | Áp dụng profile trên; context có immutable issue ID, Jira key/type/parent. Prompt tham chiếu policy và skills local đã migrate, không cần installer/shared package trên host. Cấp rõ những Jira writes và Git/PR operations trong scope.                                                 |
| 6. Điều hướng và kiểm chứng    | `AGENTS.md`, `README.md`, docs setup liên quan                                                                                                                         | Trỏ tới workflow UI và policy planning; AGENTS vẫn giữ architecture/verification/review, không chép toàn bộ lifecycle. Hoàn tất checks và review trước rollout.                                                                                                                          |

Không cần đổi `package.json` hoặc thêm dependency chỉ để chuyển tracker. Khi thực
sự sửa skills/AGENTS, áp dụng `writing-for-agents` và skill-authoring validation
phù hợp; việc khảo sát này không kích hoạt `setup-workflow` hay một implementation run.

### Hành vi execution cần giữ trong policy

1. Đọc lại live contract, parent AC/expected behavior, accepted comments, native
   dependencies và approved UI references. Xác nhận Deliverable là dashboard/app
   trong `signapse-ui`; API product do producer sở hữu. Thiếu contract chỉ chặn
   phần phụ thuộc, không cho phép agent tự định nghĩa requirement.
2. `Ready` là coordinator giao operation cụ thể. Kiểm tra lại route/dependencies
   trước transition sang `Progress`; lấy transition hiện có theo status đích,
   không hardcode ID hoặc sửa status field trực tiếp.
3. `Progress` tiếp tục workspace, branch `codex/…` và PR hiện có. Có thể dùng Jira
   key trong branch; không tạo branch/PR khác chỉ vì retry, review return hoặc resume.
4. Thực thi/verify dưới AGENTS và scoped overrides. Review độc lập gồm Requirement
   adherence và Correctness & Standards; xử lý findings blocking trên revision
   cuối cùng, không lấy evidence của revision cũ.
5. Thay đổi source/config/docs đã commit cần PR theo policy UI; output read-only
   không bị ép có PR. Title chứa key của Subtask, ví dụ `[SIGN-<n>] FE: <deliverable>`;
   target default branch hiện là `main`. PR body theo template nếu có, nếu không
   dùng summary/checks ngắn. Không tạo closing reference tới GitHub issue cũ.
6. Duy trì một agent-owned delivery handoff comment theo [format planning][planning-tracker]:
   repository, revision/output, review, checks/build, deploy hoặc Not applicable,
   durable evidence và remaining gaps. Đọc lại sau khi ghi; không sửa comment
   người khác. Jira REST comments dùng ADF theo API; phân trang comments và đọc
   trạng thái hiện tại trước retry một mutation có kết quả không chắc chắn.
7. Chỉ chuyển `Progress → In Review` khi handoff ở boundary được giao đã sẵn sàng.
   Nếu deployment do người khác thực hiện, ghi rõ đang chờ owner; không tự nhận
   delivery gate đầy đủ hoặc `Done`. Khi external input chặn mọi tiến triển, ghi
   và đọc lại blocker comment trước `Blocked`; coordinator giải quyết/resume.
   Agent không tự Open → Ready, Done, parent acceptance, merge/deploy hoặc tạo
   thêm ticket ngoài quyền được giao.

Runtime cưỡng chế structural selection/admission, không cưỡng chế mọi quy tắc
human approval và ownership của mutations. Quyền worker và prompt phải phù hợp;
tài khoản connector của phiên khảo sát không chứng minh quyền tài khoản worker.

## Verification trước activation

| Check                    | Acceptance                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content/skills           | Không còn active rule dùng GitHub làm ticket store, source lock đã mất, native closing reference hoặc merge-only Done. Local skill links, metadata, UTF-8 và Markdown hợp lệ.                                                      |
| Config và prompt offline | Parse YAML bằng runtime tương ứng; validate Jira profile với credential giả trong test, không connect live tracker. Render Liquid với type/parent/attempt/description thực tế; không có biến/filter không được runtime hỗ trợ.     |
| Selection/admission      | FE Subtask hợp lệ được nhận; parent, wrong route, không route, hai route, thiếu parent và dependency chưa Done/Closed không được nhận. Không chỉ kiểm tra JQL: kiểm tra normalized eligibility.                                    |
| Recovery và handoff      | Ready → Progress → In Review; review return và restart ở Progress reuse một workspace/branch/PR; Blocked resume đúng trạng thái trước đó; In Review/Blocked/Done không dispatch.                                                   |
| Boundaries và errors     | Type/route đổi phải dừng đúng scope và giữ workspace; ambiguous Jira write đọc lại trước retry, không tạo duplicate comment/PR; API lỗi không được coi là dependency hoàn tất.                                                     |
| UI quality               | Khi triển khai thay đổi runtime/config, chạy `pnpm test:quality` theo repo policy. Auth/backend transport/protected-page changes còn cần `pnpm test:integration`; migration chỉ workflow không tự đòi live product smoke toàn app. |
| Review/CI                | Một independent reviewer kiểm tra contract và correctness của revision giao. Chỉ yêu cầu checks CI thực sự được cấu hình; không coi Pages là PR quality gate.                                                                      |

Dùng lại các checks Symphony đã có cho Jira profile và recovery; nếu cần thêm,
chỉ thêm test tại seam chưa được phủ, không dựng suite workflow thứ hai trong UI.
[Jira adapter tests][symphony-tests] và [scheduler recovery test][symphony-recovery]
đã có trong source. Báo cáo Symphony ghi local `make -C elixir all` đạt, nhưng đây
là evidence của repo đó; phiên khảo sát này không rerun và không chứng minh
installed runtime hay live canary. [Báo cáo adaptation Symphony][symphony-plan].

## Rollout, dependencies và rollback

1. **UI maintainer:** hoàn tất policy/config/skills, checks và review ở trên; publish
   revision consumer được chấp nhận. Chưa bật dispatch chỉ vì `WORKFLOW.md` đã đổi.
2. **Runtime operator:** xác minh binary/revision Symphony đã cài có hỗ trợ profile
   mới, Jira account/project access, `jira_rest`, GitHub clone/push/PR auth, Node,
   pnpm và browser dependencies. Giữ settings deployment hiện có; cấu hình workspace
   root FE riêng. Source mới trên GitHub không chứng minh host đã cập nhật.
3. **Coordinator + operator:** stop/drain GitHub FE worker, inventory công việc đang
   chạy, map GitHub issue/branch/PR sang Jira Subtask và reconcile thủ công. Giữ
   output cũ; không dispatch cả hai worker, không migrate Done thành Ready. Một
   route chỉ có một instance điều phối vì claim runtime hiện nằm trong memory.
4. **Coordinator:** sau preflight, giao canary Subtask riêng với scope đã chấp nhận.
   Kiểm chứng clone đúng UI, transitions, restart/review/blocker resume, comment
   cập nhật và PR thực sự xuất hiện trong Jira Development panel. Canary live cần
   được giao rõ ràng; không tự queue `SIGN-114` đang bị dependency chặn.
5. **Operator + coordinator:** mở queue FE sau canary đạt. Rollback bằng cách stop
   Jira worker, giữ workspaces/branches/PRs/Jira history và reconcile công việc;
   chỉ bật lại queue cũ sau quyết định của coordinator. Không xóa output để rollback.

## Follow-up thuộc Planning

Planning vẫn mô tả Symphony sở hữu shared execution skills và migration baseline
`77f8c82`; cần owner sửa README, workflow override và mục migration theo revision
mới. Phải ghi riêng source readiness, installed-runtime readiness và activation.
Điều này không yêu cầu đổi hierarchy, route map hoặc lifecycle đã chốt.

Có hai bản DESIGN/APIMAPPING trong UI và planning. So sánh bỏ qua line endings cho
thấy DESIGN khác đường dẫn reference; APIMAPPING planning còn snapshot 18/9 trong
khi UI ghi 28/9 và phản ánh việc tách public landing. Đây là drift tài liệu, chưa là
verification của API live ngày 6/10. Không thay ledger mới bằng bản planning cũ.
Owner cần chốt source/pointers và cách cập nhật theo [frontend docs index][planning-frontend]
và [scoped ownership][planning-policy]; sync API riêng phải dùng `api-mapping-sync`.
Đối soát này là follow-up phối hợp tài liệu, không phải lý do sửa behavior UI hoặc
migration hàng loạt docs trong contribution chuyển tracker.

## Completion và giới hạn evidence

**Consumer adaptation hoàn tất** khi profile/policy/skills không mâu thuẫn,
không còn dependency đồng bộ tới package đã xóa, checks/review revision giao đạt
và rollout requirements rõ ràng. **Operational activation hoàn tất** chỉ khi
installed worker và canary FE đã được xác minh, worker GitHub cũ đã dừng và
coordinator chấp nhận luồng handoff/Done. Không gộp hai mốc này.

Lượt khảo sát ban đầu đã đọc source/policies/tests, remote HEAD, Jira types/statuses, một Subtask
và parent/dependency, cùng danh sách GitHub Actions workflows. Chưa khảo sát
service config trên host, worker credentials/permissions, branch protection,
live Development-panel linking hoặc deployment. Lượt lập plan ban đầu chỉ chạy
content, link và formatting checks; kết quả implementation được ghi riêng bên dưới.

## Kết quả consumer adaptation ngày 2026-10-06

Đã cập nhật `WORKFLOW.md`, local execution policy, implement/setup/review/design
skills, metadata và pointers trong AGENTS/README trên branch
`codex/jira-workflow-adaptation`. Skills còn nguyên trong UI; chín source records
Symphony cũ đã được bỏ, các records nguồn khác không thay đổi. Settings bootstrap,
workspace, polling, agent và Codex ngoài phần tracker được đối chiếu bằng parser
Symphony với baseline và giữ nguyên.

Verification đã hoàn tất:

- [Offline consumer check](../scripts/check-symphony-workflow.exs) chạy bằng Elixir
  1.19.5/OTP 28 trong container với source Symphony `2a58b98`: config/Jira profile,
  native routing/parent, dependency admission và tám strict Liquid fixtures đạt.
  Check dùng credential giả, `mix run --no-start`; không polling, clone hoặc live writes.
- Năm skill frontmatters và Codex metadata được validate bằng YAML parser của
  runtime. Validator Python có sẵn không chạy được do thiếu PyYAML; không thêm
  dependency vào repo để thay thế. UTF-8, Markdown links và lockfile invariants đạt.
- Jira adapter/config/workspace/recovery tests của Symphony: `73` đạt. Lần chạy
  đầu lỗi SSH fixture do checkout Windows CRLF; đã reproduce lỗi shell syntax và
  chuẩn hóa LF riêng file test trong bản copy container. Repo Symphony không đổi.
- `pnpm test:quality` đạt: lint `0` errors/`23` warnings ở files không thay đổi,
  typecheck, `257` Vitest tests, contract guard `59` routes, production build và
  `53` browser tests đạt/`1` performance test opt-in skipped. Không chạy live
  integration lane vì thay đổi này không sửa auth/transport/protected-page behavior.
- Independent review của diff/output liên quan không có findings ở Requirement
  adherence và Correctness & Standards. Formatting và `git diff --check` đạt.

Đây là local consumer readiness, chưa là operational activation. Worker host,
credentials/quyền thật, Development-panel linking, canary và cutover vẫn cần
operator/coordinator thực hiện theo mục rollout; chưa có Jira writes hoặc deploy.

[ui-workflow-baseline]: https://github.com/signapse-group/signapse-ui/blob/68aad304964221e95b781e4057ce1747dea653ca/WORKFLOW.md
[ui-policy-baseline]: https://github.com/signapse-group/signapse-ui/blob/68aad304964221e95b781e4057ce1747dea653ca/.agents/skills/agent-execution-policy/references/execution-policy.md
[planning-workflow]: https://github.com/signapse-group/signapse-planing/blob/99487c60ee43eaf9b125115efa968e8cc1e097cf/workflow/project-execution-workflow.md
[planning-subtask]: https://github.com/signapse-group/signapse-planing/blob/99487c60ee43eaf9b125115efa968e8cc1e097cf/workflow/issue-types/subtask.md
[planning-tracker]: https://github.com/signapse-group/signapse-planing/blob/99487c60ee43eaf9b125115efa968e8cc1e097cf/workflow/issue-tracker.md
[planning-policy]: https://github.com/signapse-group/signapse-planing/blob/99487c60ee43eaf9b125115efa968e8cc1e097cf/workflow/AGENTS.override.md
[planning-frontend]: https://github.com/signapse-group/signapse-planing/blob/99487c60ee43eaf9b125115efa968e8cc1e097cf/docs/frontend/README.md
[symphony-guide]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/elixir/README.md#routed-jira-subtask-workflows
[symphony-client]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/elixir/lib/symphony_elixir/jira/client.ex
[symphony-tests]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/elixir/test/symphony_elixir/jira_adapter_test.exs
[symphony-recovery]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/elixir/test/symphony_elixir/core_test.exs#L354
[symphony-plan]: https://github.com/signapse-group/signapse-symphony/blob/2a58b987a1eb5b7bc02659fd5a49df8164807a4c/docs/jira-workflow-adaptation-plan.md
[jira-sample]: https://signapse-group.atlassian.net/browse/SIGN-114
[jira-parent]: https://signapse-group.atlassian.net/browse/SIGN-111
