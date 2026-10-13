# Signapse UI execution policy

Apply this policy to assigned Jira Subtask runs or an explicitly activated local-contract workflow. Configuration maintenance, skill installation and ordinary requests do not activate tracker lifecycle actions.

## Authority and contract

[Planning's execution workflow](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md) owns hierarchy, routing, dispatch authorization and acceptance. Its [Subtask format](https://github.com/signapse-group/signapse-planing/blob/main/workflow/issue-types/subtask.md) and [tracker policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/issue-tracker.md) define operation completion and handoff. `WORKFLOW.md`, `AGENTS.md`, scoped instructions and these repository-owned skills define UI execution. Symphony supplies runtime orchestration independently of the skills.

The [planning FE/landing profile](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#profile-fe-và-landing) grants three sessions for native dev Subtasks with a PR into main: Survey (Ready) → Implement (Progress) → independent Review/delivery (In Review) → Done. This repository delivers to `https://dev.signapse.cloud`. Ordinary requests and no-PR operations retain their assigned boundary.

Read the live Subtask, its native parent, relevant accepted comments, dependencies and approved references at start, resume and handoff. Verify project `SIGN`, native Subtask type, parent Story/Task/Bug, exactly one recognized route matching `route-frontend`, and Deliverable ownership in `signapse-group/signapse-ui`. Use the routing set in `WORKFLOW.md`; other business labels may coexist. Parent readiness and assignee do not replace the Subtask's dispatch gate or native dependency links.

Confirm native `is blocked by` dependencies are complete before initial or resumed execution. Jira category `done` satisfies the routed admission gate; `Resolved` in an active category does not. Unreadable or ambiguous dependencies remain unsatisfied. Required missing references block dependent work; continue meaningful independent investigation. Raise material requirement gaps to the coordinator instead of defining new scope, API contracts or tickets.

For an explicitly accepted local contract without a Jira issue, use the named contract and requested delivery boundary; do not create a ticket as a prerequisite. Tracker actions below apply only to assigned Jira work and within the prompt's granted permissions.

For API behavior work, follow the [API consumer policy](api-handoff.md) for producer
lookup and discrepancy handling. Run live contract/producer checks when they are part
of the assigned operation; native dependency completion does not replace evidence
that the accepted scope explicitly requires.

## Local handoff and live acceptance

Implement handoff covers required behavior, focused local checks, current-head lightweight PR CI and Vercel Preview build under the delivery runbook. Independent review and Production delivery follow in the new In Review session. CI owns the full lightweight gate; do not repeat full build/browser regression locally for every change. Required failures cannot be converted into a scoped Pass. Missing producer contract, required reference, output/publication access, required comment-save or transition access remains a gap; continue independent work where meaningful.

Done additionally requires approved review, merge and confirmed Vercel Production deployment containing the contribution under the [runbook](../../../../docs/delivery.md). Website/domain/feature verification belongs to owner/QA. Pending QA/parent acceptance or private QA credentials alone does not prevent contribution completion. Metadata/link verification may be coordinator-owned when output exists and is reviewable; report pending rather than claim linkage verified. This does not waive requirement completion or native dependency admission.

Owner/QA executes live website/feature checks under their assigned scope and inputs; these are not a dev delivery gate. Local fixtures prove their observed boundary, not producer publication, authentication, hosted behavior or external effects. Approved design, accessibility and local SSR checks remain mandatory for affected UI. Docs-only output needs artifact/version/review/checks, not app deployment; workflow/runtime activation is required only when assigned.

Use the [testing guide](../../../../docs/testing/browser-tests.md#selecting-checks-by-change-scope) for affected coverage. When browser/live checks are required on Symphony, read the host testing guide and use its existing wrapper/lock. The before_run hook refreshes ignored `.env.local` from `$SIGNAPSE_UI_APP_ENV`; private account inputs stay only in `$SIGNAPSE_UI_E2E_ENV`, never in workspace env/logs/evidence.

## Bug fixes and QA retest

For an assigned fix Subtask under a Bug, reread the accepted expected/basis and latest relevant QA handoff with its report/evidence at start, resume and handoff. Identify case/version, actual, tested build/environment and assigned impacted regression. Apply [QA Retest outcomes](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#qa-retest-outcomes); a FAIL summary can include Blocked/Not Run checks or a different regression deviation. Implement the assigned fix scope without treating every report failure as the same Bug.

Link the Bug and QA run/report addressed in the fix handoff, with corrected coverage, delivered source revision, local checks/regression and required delivery evidence. After deployment, the delivery owner supplies evidence connecting that fix to the tested build/environment for QA; local checks or a build SHA alone do not establish deployment. Pending deployment does not delay a dev In Review handoff whose local gates passed.

The coordinator owns Bug Resolved/Closed/Reopened, QA completion and follow-up assignment. Dev checks do not close the Bug or overwrite QA results/approval. Done is terminal; a later fix/run requires a new coordinator-assigned Subtask. Do not revive a completed contribution or mutate its parent from a QA FAIL summary.

## Execution and review

The autonomous dev-with-PR profile uses three separate sessions. Direct requests and no-PR operations keep their assigned boundary; this profile does not activate their Jira/PR workflow.

### Khảo sát → Implement

Ready authorizes survey only. Read the live contract/parent/decisions, native dependencies, approved references and existing workspace/output. Trace affected code/callers/consumers, reusable patterns, required new work and the smallest implementation/verification approach. Read the API consumer policy for API work and approved visual references for UI work. Existing code is evidence of current behavior, not expected behavior.

Run existing checks only when needed to answer a concrete question on isolated local data. Do not edit versioned source/tests/config, commit/push/create a PR, merge/deploy or affect shared environments. A baseline failure within scope may be handed to Implement with a grounded diagnosis; current code need not pass the new AC before Progress.

You may clarify wording/references in the assigned Subtask body only from already accepted requirements. Preserve format, concurrent content and source decisions; do not change meaning/scope/AC, edit the parent, decide a new business/design rule or copy the parent contract. Reread the live body before mutation, reconcile concurrent edits, save/read back required additions before transition. Unsettled requirements return to the coordinator.

Comment only when code/reuse/verification information must survive into the new session; record file/symbol/revision and separate observed facts from recommendations. No additions means no survey confirmation comment. Preserve the survey record independently of review/delivery records.

Ready → Progress requires settled contract, matching route, dependencies/readiness, relevant survey, an implementation/verification approach, no unanswered required decision, and saved/read-back updates when necessary. Resolve the live destination, transition/read back Progress and end the survey session. No manual survey approval or extra ticket is needed. The fresh Implement session consumes and reconciles this result; absence of a survey comment is not a blocker.

### Implement → Review

Progress authorizes scoped edits, local checks, commits/push/PR and CI follow-up. Reuse the workspace/branch/PR and survey/feedback; reinvestigate only affected changes. Repository-file changes in this profile need a PR into main. Keep one PR for unmerged work; after merge, an in-scope fix before Done uses a follow-up branch/PR from current main with old PR/evidence retained. Stage only contribution-owned files.

Complete applicable local checks and current-head PR CI under the [delivery runbook](../../../../docs/delivery.md#review-evidence-and-pr-gate). The PR/evidence must identify source contract, candidate and actual coverage/results/limits. Include the Subtask key in the PR title and verify Development-panel linkage before claiming it. CI success alone does not establish local checks or AC coverage.

Independent review belongs to the fresh In Review session; Implement does not call a reviewer as an In Review admission gate. If linkage/candidate/evidence is clear and accessible, no Jira handoff comment is required. Comment only for a review-relevant exception, uncertain linkage/candidate/access or concrete owner action; link the detail rather than copying PR checks/logs. A missing mandatory check is not a handoff exception that waives the gate.

Save/read back necessary records, resolve the live transition, Progress → In Review/read back and end Implement. Preview is a PR build gate; do not wait for this contribution's Production deployment or continue Review/delivery in the Implement session.

### Review → Implement sửa

The fresh In Review session directly uses [Code Review](../../code-review/SKILL.md) for separate Requirement adherence and Correctness & Standards verdicts. Inspect final code, callers and required evidence; compare affected rendered UI with approved design when applicable. Implement summaries are input, never an approval verdict. The reviewer does not edit code or resolve conflicts, and does not delegate another reviewer when already assigned this role.

For blocking findings, conflicts or in-scope required check gaps, save/read back actionable PR feedback tied to the assessed candidate: location/check → problem/impact → required outcome. Transition/read back In Review → Progress and end Review. Implement resumes the existing output; do not reset Ready. Optional suggestions do not keep work in execution. An unclear requirement returns to its owner, not to Implement to guess.

Jira comments are conditional on uncertain access/linkage/candidate or separate owner action; do not duplicate review findings. Feedback still must be durably saved/read back before transition even without a Jira comment. After fixes, reassess changed code and affected surrounding behavior; do not repeat unrelated valid checks.

## PR and delivery handoff

PR descriptions own the problem, final change, verification and technical limits; refresh them against the delivered candidate. Jira holds coordination and owner actions. Apply [common comment ownership/history rules](https://github.com/signapse-group/signapse-planing/blob/main/workflow/issue-tracker.md#delivery-handoff-comment): preserve other authors' content and prior candidate/evidence, identify ownership beyond a shared account, reread before edits and read back writes. Ambiguous writes require remote readback before retry; no duplicate comments for pushes, green CI, polls or transitions.

### Review và delivery handoff

Review approves the current candidate, merges and verifies delivery under the [runbook](../../../../docs/delivery.md). PR already merged means reconcile its actual merge/review/checks and resume delivery; do not merge again. A merged candidate without an independent assessment still needs that review before Done. Missing required delivery evidence prevents Done; QA/parent acceptance is separately owned.

Before Done, save/read back the assigned Subtask's delivery handoff:

```text
Đã bàn giao trên <môi trường>: <build/revision đã xác minh>.
Delivery: <link evidence nối contribution với build và các gate áp dụng>.
Lưu ý: <điểm ảnh hưởng trực tiếp integration/test — chỉ khi có>.
Cần <owner>: <hành động cụ thể — chỉ khi có>.
```

Use artifact location/version for output that does not need app deployment. Keep detailed checks, review, CI/run IDs, source/merge/deployed build relation, Vercel environment/URL and confirmation time in linked evidence. Do not claim website/feature verification from deployment status. API handoff distinguishes consumer output from published producer contract/environment/revision, breaking changes and pending integration. Do not keep a parallel API schema in comments. Omit inapplicable lines; do not add generic pending-QA statements.

Resolve the live destination, In Review → Done/read back after every applicable gate. Done confirms this contribution and delivery, not QA/product/parent acceptance. For direct or no-PR operations use their assigned artifact/session/owner without inventing a Jira record or extending this profile's grants.

## Jira lifecycle and writes

| Status | Profile operation and owner |
| --- | --- |
| Open | Outside dispatch; coordinator settles and assigns the contribution. |
| Ready | Survey only; worker may clarify accepted wording/references and transition Progress or Blocked under the survey gate. |
| Progress | Implement, checks, PR/CI, in-scope fixes; worker transitions In Review or Blocked under the applicable gate. |
| In Review | Fresh independent Review, merge and delivery; worker may return Progress, record Blocked or complete Done. |
| Blocked | Stop; coordinator resolves and resumes the actual previous status after verifying the condition. |
| Done | Terminal; new work requires a new coordinator-assigned contribution. |

Coordinator retains priority/scope, new ticket publication, Open → Ready, Blocked resume, parent/QA lifecycle, Bug triage and acceptance. Workers mutate only the assigned Subtask and their own records under WORKFLOW's phase grant. Scope/API/design decisions remain with their owners. No autonomous rollback, infra/secrets/indexing/DNS changes or shared live feature operation beyond assignment.

Use jira_rest in Symphony, current native transitions by destination and ADF for REST v3 bodies; paginate relevant comments. Reread live issue/parent/decisions/references/dependencies at start/resume and before mutation/handoff. Read back status writes. A phase change ends the session so Symphony can render a new prompt in the same workspace; Open/Blocked/Done or changed route/ownership stops work. Prompt rules do not restrict the credential's API permissions.

### Blocker comments and resume

Use Blocked only for required external input/access/decision when no meaningful independent work remains. Implementation/check failures belong in Progress; pending valid delivery stays In Review under the bounded wait procedure. Save/read back a separate blocker record before transition:

```text
Blocked — <vướng mắc và output/AC/check bị chặn>.
Cần <owner>: <hành động hoặc quyết định cụ thể>.
Tiếp tục tại <status trước Blocked> khi <điều kiện kiểm chứng được>.
Bằng chứng: <link tới kết quả liên quan — chỉ khi cần>.
```

Take the previous status from the live issue. Update the same owned blocker, retain history and preserve human content; if ownership/write/readback is unavailable, report the unconfirmed step rather than claiming transition success. Coordinator records resolution with evidence/contract reference, any remaining blocker and the next action; annotate the old blocker only when owned/authorized, otherwise backlink it. Verify resolution on resume; a status change alone does not prove the blocker cleared. Resume In Review continues Review/delivery in a fresh session. Do not self-resume Blocked or reopen Done.

## Contract changes and evidence

Investigate discoverable facts before invoking [decision-gate.md](decision-gate.md). Routine implementation choices stay within accepted scope/repository standards; acceptance-significant changes return to the owner. Accepted changes within the same contribution invalidate affected checks/review. A different deliverable needs a human replacement/cancellation decision.

Reread contracts before handoff. Head/contract changes or specific base impacts require reassessment; main advancing alone does not invalidate unchanged-head evidence. Store evidence in existing session/PR/Jira/durable locations, without mandatory snapshots/fingerprints. Use Vietnamese for collaboration; retain repository document/code language and applicable VI/EN copy rules.
