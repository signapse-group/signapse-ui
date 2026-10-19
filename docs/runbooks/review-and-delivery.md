# Review and delivery — In Review

Read dependencies under the [shared contract](../../CONTRIBUTING.md#reading-jira-dependencies); retain the live tool `dependencies` envelope.

This runbook owns Review/delivery and is loaded only when `WORKFLOW.md` assigns `In Review`. A direct review request does not activate Symphony/Jira lifecycle. Read `AGENTS.md`, applicable scoped instructions and [CONTRIBUTING.md](../../CONTRIBUTING.md); select technical skills as needed, without adding permissions or gates.

## Assignment and authority

The profile is a native Jira `SIGN` dev Subtask, parent Story/Task/Bug, exactly one recognized route `route-frontend`, output owned by `signapse-group/signapse-ui`, PR into `main`, product dev environment `https://dev-dashboard.signapse.cloud`. Use WORKFLOW's recognized route set; business labels may coexist. Direct/no-PR operations retain their assigned boundary and are outside this profile.

The fresh In Review session is the independent reviewer. It directly assesses contract/code/evidence and does not replace itself with another reviewer. Review permits owned feedback/handoff/blocker records, merge of the assigned PR into main, bounded delivery recovery and In Review → Progress/Blocked/Done under the gates below. The reviewer does not edit implementation or resolve conflicts.

The coordinator retains scope/priority, new tickets, Open → Ready, Blocked resume, parent/QA/Bug lifecycle and acceptance. Business/design/API decisions remain with their owners; infra/secrets/DNS/indexing changes, autonomous rollback and unassigned shared live feature operations are outside this grant.

## Receive and assess the candidate

1. At start/resume and before mutations/handoff, read live Subtask/parent, accepted comments, references and native dependencies through `jira_rest`; paginate relevant comments and use ADF for REST v3 bodies. Confirm live In Review and the assignment profile. Native `is blocked by` dependencies must have Jira category `done`; `Resolved` in an active category and unreadable/ambiguous dependencies do not satisfy admission.
2. Reconcile the actual PR/base/head, branch/workspace/output, previous review, checks and any saved delivery state. Review relevant committed and working output plus final code/callers under [review standards](../../CONTRIBUTING.md#review-standards). Implement summaries are input, never approval. An already merged PR still needs an independent assessment before Done when none exists; assess its actual candidate, then resume delivery rather than merge again.
3. Assess **Requirement adherence** and **Correctness & Standards** separately. Map accepted AC/expected behavior to output/evidence, distinguish blocking findings from optional suggestions, and disclose missing required inputs/checks. Reuse valid evidence; reassess affected code/behavior after fixes, head/contract changes or concrete base impacts.
4. For API work, read [API consumer standards](../api-consumer.md) and the current relevant producer contract/publication evidence. For UI work, inspect approved references and compare affected rendered UI under design/scoped rules. A protected page or reused transport alone does not add live smoke; require only the assigned live operation/scope/inputs.
5. For a fix under a Bug, reconcile accepted expected/basis and latest relevant QA report/case/version, tested build/environment and assigned regression. A FAIL summary can include different deviations or Blocked/Not Run; assess the assigned fix. Dev review does not overwrite QA outcomes or resolve/close/reopen the parent Bug.
6. Verify focused local evidence and [required PR build checks](../../CONTRIBUTING.md#required-pr-build-checks) for the assessed current head. Missing/failing mandatory evidence is not Pass. Pending owner/QA acceptance or coordinator-owned metadata alone does not prevent otherwise complete contribution review; report only concrete receiver actions.

## Return required fixes

For blocking findings, conflicts or in-scope required check gaps, durably save/read back actionable PR feedback tied to the assessed candidate:

```text
Cần sửa:
- <vị trí hoặc check/evidence>: <vấn đề và ảnh hưởng> → <kết quả cần đạt>.
```

Keep detailed findings at the PR/evidence; Jira comments are conditional on uncertain access/linkage/candidate or separate owner action. Preserve other authors' records and old evidence under [record ownership standards](../../CONTRIBUTING.md#decisions-and-evidence). Optional suggestions do not block. Unclear requirements return to their owner; do not send Implement a requirement to guess.

Reread live contract/status/routing/dependencies, resolve the destination from native transitions and transition/read back In Review → Progress after required feedback is saved/read back. End the Review session. Implement resumes existing output, without resetting Ready. Read back ambiguous writes before retry; missing durable feedback/transition access remains an unconfirmed handoff.

## Merge the approved candidate

Only a candidate passing both review axes and applicable checks proceeds. Reread live assignment, approved PR/head, checks, base main, open/non-draft state and mergeability. Pending mergeability permits three reads with 5/10-second backoff. With verified `PR` and `HEAD_SHA`, use the worker's existing `gh` CLI:

```sh
gh pr merge "$PR" --repo signapse-group/signapse-ui --merge --match-head-commit "$HEAD_SHA"
gh pr view "$PR" --repo signapse-group/signapse-ui --json state,url,headRefOid,mergeCommit
```

No admin bypass. Read back ambiguous writes before retry; MERGED and actual merge SHA confirm merge. An already merged candidate proceeds through reconciliation/delivery. Conflicts and in-scope code fixes return Progress; an accepted fix after merge uses a follow-up PR from current main with old evidence retained.

## Verify the delivered build

For app delivery, require a verified live revision on **https://dev-dashboard.signapse.cloud** containing the contribution, with successful main quality checks. Owner/QA verifies website, auth and features; these are not FE developer delivery gates. Deployment confirmation does not certify website behavior or later rollbacks.

Read [CI/Vercel technical setup](../delivery.md#ci-and-vercel-setup) when setup evidence is needed. Local configuration does not prove hosting activation. Required developer delivery evidence connects the reviewed candidate to the actual merge and deployed build; overall green CI, merge or a health check alone is insufficient.

After merge, select the main Verify push run for a SHA containing that merge. Save merge/run/build identity, start time, absolute deadline (30 minutes per tracked run) and retry counter in an existing durable owned delivery record before waiting. Reuse them across restart/resume; neither reconnect nor rerun resets the budget. Require its actual `check` job to succeed:

```sh
gh run watch "$VERIFY_RUN" --repo signapse-group/signapse-ui --interval 30 --exit-status
gh run view "$VERIFY_RUN" --repo signapse-group/signapse-ui --json headSha,status,conclusion,jobs,url
```

Then run the existing verifier from the FE workspace, using the actual full merge SHA from the merged PR. On the Linux worker, cap the process with the remaining saved budget:

```sh
remaining_seconds=$((DELIVERY_WAIT_DEADLINE_EPOCH - $(date +%s)))
test "$remaining_seconds" -gt 0
timeout "${remaining_seconds}s" /opt/apps/symphony/runtime/run-fe-deploy "$PWD" "$MERGE_SHA"
```

`DELIVERY_WAIT_DEADLINE_EPOCH` comes from the saved absolute deadline; do not create a new deadline when starting the verifier. Bound `gh run watch` by that same remaining deadline. Use short tool yields, checking the same terminal every 30–60 seconds during quiet waits. A tool disconnect/timeout is not deployment failure; reread live state and reconnect only within the remaining budget. Do not end merely to obtain a new scheduler attempt/deadline.

Use the [deployment verifier reference](../delivery.md#confirm-live-dev-revision) for prerequisites, candidate validation, polling and read-retry behavior. Its per-invocation timeout does not reset the saved deadline. A skipped/canceled check, overall green CI or merge alone is insufficient. Require verifier exit code 0 and PASS; it also checks main quality success for the actual deployed SHA. Save its merge/deployed SHA, environment/URL and confirmation time with the corresponding Actions quality-run link in existing PR/delivery evidence before handoff. Never infer deployed SHA from local HEAD. A confirmed containing descendant may satisfy delivery.

Docs-only output uses artifact location/version, review and applicable checks rather than mandatory app deployment. Runtime/workflow output still needs activation evidence when the accepted assignment requires it; source edits alone do not establish worker adoption.

## Recovery and external blockers

Pending delivery within budget stays In Review. Reread runs/deployments before retries; reuse existing runs and read back ambiguous writes to avoid duplicates. In-scope code/build/check defects return Progress with saved actionable feedback. Temporary infrastructure failure permits at most two reruns, with reasons/counters saved and the original deadline retained. No autonomous infrastructure repair or rollback is granted.

Use Blocked for required external input/access/decision/dependency or exhausted wait only when no meaningful independent work remains. Save/read back a separate owned blocker record before resolving/readback In Review → Blocked:

```text
Blocked — <vướng mắc và output/AC/check bị chặn>.
Cần <owner>: <hành động hoặc quyết định cụ thể>.
Tiếp tục tại <live status trước Blocked> khi <điều kiện kiểm chứng được>.
Bằng chứng: <link kết quả kiểm tra liên quan — chỉ khi cần>.
```

Take the previous status from the live issue. Preserve human content, review history and saved delivery state; reuse the owned blocker. If ownership/write/readback is unavailable, report the unconfirmed step. The coordinator owns resolution/resume; verify the condition on resume, since status alone is not resolution evidence. Retain deadline/retry counters and resume the actual review/delivery stage. Open/Blocked/Done or changed phase/route/ownership ends work preserving output; do not self-resume or reopen Done.

## Delivery handoff and Done

When every applicable gate is satisfied, save/read back the assigned Subtask's short delivery handoff before transition. Omit inapplicable lines:

```text
Đã bàn giao trên <môi trường>: <build/revision đã xác minh>.
Delivery: <link evidence nối contribution với build và các gate áp dụng>.
Lưu ý: <điểm ảnh hưởng trực tiếp integration/test — chỉ khi có>.
Cần <owner>: <hành động cụ thể — chỉ khi có>.
```

Use artifact location/version for output without app deployment. Keep detailed review, commands/CI run IDs and candidate/merge/deployed-build relation in linked evidence; Jira keeps coordination/actions, not duplicate reports. For API output, distinguish FE output from producer revision/environment/publication and pending integration. For Bug fixes, connect the addressed Bug and QA run/report to the delivered source/build/environment and corrected coverage; dev checks do not close the Bug or replace QA retest.

Reread live contract/status/routing/dependencies and verify review, required PR checks/Preview, merge, applicable main/deployment or artifact/activation gates, and saved/read-back handoff. Resolve live In Review → Done, transition/read back and end the session. Done confirms the contribution and its required delivery, independently of QA/product/parent acceptance. New work after Done needs a new coordinator-assigned contribution.
