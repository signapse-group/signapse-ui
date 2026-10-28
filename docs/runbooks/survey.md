# Survey — Ready

Read dependencies under the [shared contract](../../CONTRIBUTING.md#reading-jira-dependencies); retain the live tool `dependencies` envelope.

This runbook owns the Survey procedure and is loaded only when `WORKFLOW.md` assigns `Ready`. A direct survey request does not activate Symphony/Jira lifecycle. Read `AGENTS.md`, applicable scoped instructions and [CONTRIBUTING.md](../../CONTRIBUTING.md); select technical skills as needed, without adding permissions or gates.

## Assignment and authority

The profile is a native Jira `SIGN` dev Subtask, parent Story/Task/Bug, exactly one recognized route `route-frontend`, output owned by `signapse-group/signapse-ui`, PR into `main`, product dev environment `https://dev-dashboard.signapse.cloud`. The recognized route set comes from WORKFLOW; business labels may coexist. Direct/no-PR operations retain their separately assigned boundary and are outside this profile.

Ready permits reading contract/code/design/API and targeted existing checks on isolated local data. It permits clarifying accepted wording/references in the assigned Subtask body, an owned conditional survey/blocker comment, and Ready → Progress/Blocked under the gates below. It does not permit edits to versioned source/tests/config, commits/push/PR, merge/deploy or shared-environment effects.

The coordinator retains scope/priority, new tickets, Open → Ready, Blocked resume, parent/QA/Bug lifecycle and acceptance. Business/design/API decisions remain with their owners; infra/secrets/DNS/indexing changes and rollback are outside this grant.

## Receive and survey

1. At start/resume and before mutations/handoff, read live Subtask/parent, relevant accepted comments, references, native dependencies and existing workspace/output through `jira_rest`. Paginate relevant comments; use ADF for REST v3 bodies. Snapshot status is not live authority. Confirm live Ready, project/type/parent, route and deliverable ownership. Stop if phase/route/ownership changes or the assignment is out of profile; preserve output for its owner.
2. Verify native `is blocked by` dependencies before dependent execution. Jira status category `done` satisfies admission; `Resolved` in an active category does not. Unreadable/ambiguous dependencies remain unsatisfied. Parent readiness, assignee and title prefix do not replace Subtask admission.
3. Trace affected code, callers/consumers, reusable patterns, necessary changes and verification seams. Existing code shows current behavior, not expected behavior. For API work, read [API consumer standards](../api-consumer.md) and affected producer contract/publication evidence. For UI work, read and apply the [UI design gate](../design/DESIGN.md#ui-design-gate): follow the native parent's Design references and open the actual approved images/frames, checking version, scope and shared rules before concluding readiness. Attachment metadata alone is insufficient.
4. For a fix under a Bug, read accepted expected/basis and the latest relevant QA report: case/version, actual result, tested build/environment and assigned regression. A FAIL summary may also contain Blocked/Not Run or a different deviation; survey the assigned fix only.
5. Run existing checks only to answer a concrete question on isolated local data, using [test ownership and selection](../../CONTRIBUTING.md#test-ownership-and-selection). Reconcile legacy live-test requirements with the coordinator; missing QA accounts/results alone do not block Survey. No full-green baseline is required when an in-scope failure is grounded for Implement. A baseline does not prove future implementation satisfies AC.
6. Identify the smallest implementation approach and focused acceptance/regression checks. Apply [decision standards](../../CONTRIBUTING.md#decisions-and-evidence) when an edge-case fix would materially change the user experience. Investigate discoverable facts before escalating unresolved requirements or material decisions to the coordinator. Continue meaningful independent survey while only dependent work waits.

## Record only useful handoff information

Clarify Subtask wording/references only from already accepted requirements. Preserve format, meaning, scope, AC, concurrent content and source decisions; do not edit the parent or copy its contract. Reread before mutation and save/read back required additions.

Comment only when technical information must survive into Implement. Separate observations from recommendations, include relevant file/symbol/revision or evidence links, preserve the survey independently of later feedback/delivery records, and omit inapplicable lines:

```text
Hướng làm: <tái sử dụng gì, đổi ở đâu và vì sao — file/symbol tham chiếu>.
Cần kiểm chứng: <case hoặc regression trọng tâm và seam dự kiến>.
Đã kiểm tra: <kết quả có ích cho Implement — dẫn evidence>.
Lưu ý: <giới hạn hoặc điểm cần đối soát trước khi sửa>.
```

No new information means no confirmation comment. Follow [record ownership/evidence standards](../../CONTRIBUTING.md#decisions-and-evidence); a shared account is not ownership. Read back ambiguous writes before retry to avoid duplicates.

## Complete the phase

Before handoff, reread live contract/status/routing/dependencies. Ready → Progress requires a settled contract, matching profile/dependencies, relevant survey, an implementation/verification approach, the UI design gate when applicable, no unanswered required decision, and saved/read-back additions when needed. Missing or unreadable required design prevents Progress; use the blocker procedure below when independent survey is exhausted. Resolve the transition from the live issue by destination; never hardcode its ID. Transition/read back Progress and end this session for a fresh Implement prompt in the same workspace. No extra ticket or manual survey approval is required; no survey comment is not a blocker.

## Blocker and resume

Use Blocked only for required external input/access/decision/dependency when no meaningful independent survey remains. Keep an in-scope diagnosed baseline failure for Implement rather than making it an external blocker. A mutation of synthetic data during an explicitly assigned test-environment integration is not, by itself, external input or a blocker; record the test-data effect and continue the assigned work when implementation and required evidence remain assessable. Before transition, save/read back a separate owned blocker record:

```text
Blocked — <vướng mắc và output/AC/check bị chặn>.
Cần <owner>: <hành động hoặc quyết định cụ thể>.
Tiếp tục tại <live status trước Blocked> khi <điều kiện kiểm chứng được>.
Bằng chứng: <link kết quả kiểm tra liên quan — chỉ khi cần>.
```

Take the previous status from the live issue. Preserve human content and prior evidence; reuse the owned blocker record rather than duplicating it. Resolve/read back Ready → Blocked and stop. Missing ownership/write/readback means report the unconfirmed step; never claim it succeeded. The coordinator owns resolution/resume; verify the resolution condition on the next assigned session, since status alone is not proof. Open/Blocked/Done and changed phase/route/ownership stop autonomous work; do not self-resume or reopen Done.
