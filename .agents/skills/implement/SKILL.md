---
name: implement
description: Implement and hand off a Symphony FE Subtask in Progress when selected by WORKFLOW.md.
---

# Implement

Start only when the rendered Symphony [workflow](../../../WORKFLOW.md) selects this skill in Progress. Outside that assignment, use the repository instructions for the task. Use the Progress grant and read [CONTRIBUTING.md](../../../CONTRIBUTING.md) for shared standards.

## Ground and Plan

Read the accepted requirement source, relevant decisions/references and dependencies. Distinguish parent AC or Bug expected behavior from contribution scope and verification.

For Symphony, at start, resume and before mutations or handoff, read the live Subtask, parent, accepted comments, references and native dependencies through `jira_rest`. Paginate relevant comments and use ADF for REST v3 bodies. Retain the [dependencies envelope](../../../CONTRIBUTING.md#reading-jira-dependencies). Confirm live Progress, project/type/parent, route and deliverable ownership. Preserve existing output and stop if the assignment falls outside the grant. Only Jira category `done` satisfies a native `is blocked by` prerequisite. Treat unreadable, ambiguous and active-category prerequisites as unsatisfied. Parent readiness and assignee do not establish dependency readiness.

Inspect checkout, branch/target, existing output and dirty-file ownership. Reuse existing work on resume; isolate it when needed. Resolve the intended review base to a commit and preserve unrelated changes.

In Progress, reconcile Survey, review feedback, branch/PR and previous evidence. Reinvestigate the affected changes and continue in Progress. An absent Survey comment is allowed. For a Bug fix, reconcile accepted expected behavior and basis with the latest relevant QA report, case/version, actual result, tested build/environment and assigned regression. Fix the assigned deviation. The coordinator owns Bug and QA lifecycle.

Trace affected callers, tests, fixtures, configuration and exports. State the smallest complete change, verification seams and material risks; no mandatory plan file, snapshot or report is needed.

For API integration, apply [API consumer standards](../../../docs/api-consumer.md), inspecting current affected producer operations and consumer callers/types. Fixtures do not prove publication or live integration.

For UI changes, apply the scoped instructions and [UI design gate](../../../docs/design/DESIGN.md#ui-design-gate). Reconcile changes since Survey or review when applicable. Before editing, identify observable behavior and any fixed constraints on reused components. Continue independent work while resolving producer or input gaps.

## Implement and Verify

Select checks for changed behavior and reruns after fixes under [test ownership and selection](../../../CONTRIBUTING.md#test-ownership-and-selection). Fix failures caused by the change.

Keep required public contract documentation and check results with the PR. Use the [change-scope matrix](../../../docs/testing/browser-tests.md#selecting-checks-by-change-scope) for fixture and command details.

For Symphony UI changes, record the [rendered comparison](../../../docs/design/DESIGN.md#ui-design-gate) in the existing PR or handoff before In Review.

## Decisions and Resume

Apply [decision/evidence standards](../../../CONTRIBUTING.md#decisions-and-evidence). Resolve human identities from configuration/user context rather than guessing. Reconcile changed requirements and existing feedback/output on resume.

Keep the existing contract and output for changes within the accepted contribution. A different deliverable requires the owner's replacement or cancellation decision.

## Reviewable output

Keep the problem, final change, candidate and actual checks/limits clear in the requested PR/artifact/session. When the assignment requires independent review, provide the contract, resolved base/HEAD, ownership and raw check evidence without a predetermined verdict; the assignment supplies that role. Resolve blocking findings and reverify affected parts. Preserve candidate history and finish the requested scope.

## Symphony PR and handoff

### Prepare output and PR evidence

Keep one PR for unmerged work, targeting `dev`; stage only contribution-owned files. After a merge, an in-scope fix before Done uses a follow-up branch/PR from current dev, retaining previous PR/evidence. Do not overwrite or revive completed contributions.

The PR owns the concrete problem, final change, source contract, candidate, actual checks/results/coverage and technical limits. Refresh it against the final candidate. Include the Subtask key in its title; verify Jira Development-panel linkage before claiming it. Coordinator-owned metadata/link verification may be reported pending when output is accessible/reviewable; this does not waive publication/check/access requirements.

Complete applicable local checks and [required PR build checks](../../../CONTRIBUTING.md#required-pr-build-checks) for the current head. Required CI/Preview evidence precedes In Review. The Preview build supplies build evidence. Production deployment and website checks are outside this gate. For docs-only output, use the same PR/review/check boundary with artifact/version evidence. Follow the assignment for runtime/workflow activation evidence.

For a Bug fix, link the addressed Bug and QA run/report with corrected coverage and local regression evidence in the PR/evidence. Review/delivery later supplies the connection to the delivered build/environment; local checks or source SHA alone do not prove deployment.

### Handoff to Review

Reread live contract/status/routing/dependencies and confirm candidate/evidence accessibility. If linkage/output/candidate are clear, no Jira handoff comment is required. Comment only for a review-relevant exception, uncertain linkage/candidate/access or concrete owner action; link detail rather than duplicating PR logs. Omit inapplicable lines:

```text
Lưu ý: <ngoại lệ ảnh hưởng review hoặc cần owner xử lý — link tới chi tiết>.
PR cần review: <PR link> — <lý do cần chỉ rõ candidate/linkage>.
```

Require every mandatory check before handoff. Follow [record ownership/evidence standards](../../../CONTRIBUTING.md#decisions-and-evidence). Save/read back necessary records, read back ambiguous writes before retry, resolve the live transition by destination, transition/read back In Review and end this session. The new reviewer owns assessment and delivery.

### Failure, blocker and resume

Fix implementation, test and required local render/check failures in Progress. Record future-phase prerequisites in the handoff. If a required Implement output is still blocked, apply the [shared blocker gate](../../../CONTRIBUTING.md#blockers-and-resume). When met, save/read back the consolidated record, resolve/read back Progress → Blocked and end the session. On a fresh assigned turn, reconcile existing output and applicable feedback/resolution before continuing.
