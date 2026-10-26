# Implement — Progress

This runbook owns the Implement procedure and is loaded only when `WORKFLOW.md` assigns `Progress`. A direct implementation request does not activate Symphony/Jira lifecycle. Read `AGENTS.md`, applicable scoped instructions and [CONTRIBUTING.md](../../CONTRIBUTING.md); select technical skills as needed, without adding permissions or gates.

## Assignment and authority

The profile is a native Jira `SIGN` dev Subtask, parent Story/Task/Bug, exactly one recognized route `route-frontend`, output owned by `signapse-group/signapse-ui`, PR into `main`, product dev environment `https://dev-dashboard.signapse.cloud`. Use the recognized routes in WORKFLOW; business labels may coexist. Direct/no-PR operations retain their separately assigned boundary and are outside this profile.

Progress permits scoped edits/checks, commits/push/PR, CI follow-up, owned conditional handoff/blocker records and Progress → In Review/Blocked under the gates below. Independent review, merge, Production delivery and Done belong to the fresh In Review session. Implement does not call a reviewer as an In Review admission gate.

The coordinator retains scope/priority, new tickets, Open → Ready, Blocked resume, parent/QA/Bug lifecycle and acceptance. Business/design/API decisions remain with their owners; infra/secrets/DNS/indexing changes, rollback and unassigned shared live feature operations are outside this grant.

## Receive existing work

1. At start/resume and before mutations/handoff, read live Subtask/parent, accepted comments, references and native dependencies through `jira_rest`; paginate relevant comments and use ADF for REST v3 bodies. Confirm live Progress, project/type/parent, route and deliverable ownership. Verify native `is blocked by` dependencies: only Jira category `done` satisfies admission; unreadable/ambiguous/active-category blockers do not. Parent readiness or assignee does not substitute for this gate.
2. Reconcile survey, review feedback, branch/PR, workspace, dirty-file ownership and previous output/evidence. Reinvestigate affected changes only; do not reset Ready or survey the entire task again. Absence of a survey comment is not a blocker. Preserve unrelated work and resolve the intended review base to a commit.
3. For API changes, apply [API consumer standards](../api-consumer.md), including current producer contract/publication evidence. For UI changes, read and apply the [UI design gate](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#ui-design-gate) and scoped instructions: reopen the native parent's designated design in this session, reconcile changes since Survey/review and stop dependent UI work on a required design gap. Missing necessary producer/input access is a contribution gap; continue independent work where meaningful.
4. For a fix under a Bug, reconcile accepted expected/basis and latest QA report, case/version, actual, tested build/environment and assigned regression. Work on that accepted fix, without treating every FAIL/Blocked/Not Run result as the same Bug. Bug/QA lifecycle remains coordinator-owned.

## Implement and verify

State the goal, material assumptions, boundaries and completion criteria from the accepted contract. Trace affected callers/tests/fixtures/exports/config and make the smallest complete change. Follow [implementation standards](../../CONTRIBUTING.md#scope-and-implementation) and [focused verification](../../CONTRIBUTING.md#verification); fix failures caused by the contribution. For UI handoff, satisfy the UI design comparison/evidence gate in PR/artifact evidence, including rendered screenshots tied to the candidate and parent design version/frame. Missing comparison evidence or an unaccepted deviation prevents In Review.

Use [material decision handling](../../CONTRIBUTING.md#decisions-and-evidence) for unresolved acceptance-significant choices. Keep the existing contract/output when an accepted change remains within this contribution; invalidate affected evidence. A different deliverable requires the owner's replacement/cancellation decision. Missing behavior or required evidence cannot be downgraded to a scoped Pass.

## Prepare output and PR evidence

Keep one PR for unmerged work, targeting `main`; stage only contribution-owned files. After a merge, an in-scope fix before Done uses a follow-up branch/PR from current main, retaining previous PR/evidence. Do not overwrite or revive completed contributions.

The PR owns the concrete problem, final change, source contract, candidate, actual checks/results/coverage and technical limits. Refresh it against the final candidate. Include the Subtask key in its title; verify Jira Development-panel linkage before claiming it. Coordinator-owned metadata/link verification may be reported pending when output is accessible/reviewable; this does not waive publication/check/access requirements.

Complete applicable local checks and [required PR build checks](../../CONTRIBUTING.md#required-pr-build-checks) for the current head. Required CI/Preview evidence precedes In Review. Preview is a build gate without a mandatory website check; do not wait for this revision's Production deployment. Docs-only still has this profile's PR/review/check boundary, with artifact/version evidence instead of an app delivery requirement; assigned runtime/workflow activation remains separate.

For a Bug fix, link the addressed Bug and QA run/report with corrected coverage and local regression evidence in the PR/evidence. Review/delivery later supplies the connection to the delivered build/environment; local checks or source SHA alone do not prove deployment.

## Handoff to Review

Reread live contract/status/routing/dependencies and confirm candidate/evidence accessibility. If linkage/output/candidate are clear, no Jira handoff comment is required. Comment only for a review-relevant exception, uncertain linkage/candidate/access or concrete owner action; link detail rather than duplicating PR logs. Omit inapplicable lines:

```text
Lưu ý: <ngoại lệ ảnh hưởng review hoặc cần owner xử lý — link tới chi tiết>.
PR cần review: <PR link> — <lý do cần chỉ rõ candidate/linkage>.
```

A missing mandatory check is not an exception that waives the gate. Follow [record ownership/evidence standards](../../CONTRIBUTING.md#decisions-and-evidence). Save/read back necessary records, read back ambiguous writes before retry, resolve the live transition by destination, transition/read back In Review and end this session. The new reviewer owns assessment and delivery; do not continue that work here.

## Failure, blocker and resume

Implementation/check failures remain in Progress for repair. Blocked is reserved for required external input/access/decision/dependency when no meaningful independent work remains. Save/read back a separate owned blocker record before transition:

```text
Blocked — <vướng mắc và output/AC/check bị chặn>.
Cần <owner>: <hành động hoặc quyết định cụ thể>.
Tiếp tục tại <live status trước Blocked> khi <điều kiện kiểm chứng được>.
Bằng chứng: <link kết quả kiểm tra liên quan — chỉ khi cần>.
```

Take the previous status from the live issue, retain human content/history and reuse the owned blocker. Resolve/read back Progress → Blocked and stop. If ownership/write/readback is unavailable, report the unconfirmed step. Coordinator owns resolution/resume; verify its condition on resume, not status alone. Feedback resumes existing output in Progress. Any phase/route/ownership change ends this session preserving workspace/PR/evidence; Open/Blocked/Done stops autonomous work. Do not self-resume Blocked or reopen Done.
