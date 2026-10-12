---
name: implement
description: Execute assigned Jira Subtasks or accepted local contracts through implementation, verification, independent review and the required delivery handoff.
---

# Implement

Use this skill for implementation requested by a human or assigned by Symphony. Jira lifecycle actions apply only to assigned Subtask runs or a workflow explicitly activated by the human. For those runs, load the repository-owned [agent-execution-policy](../agent-execution-policy/SKILL.md), `WORKFLOW.md`, `AGENTS.md` and applicable scoped instructions. For a standalone human request, implement and verify its scope without imposing tracker status, independent review, PR or CI handoff steps unless requested. Read the [decision gate](../agent-execution-policy/references/decision-gate.md) or [API handoff](../agent-execution-policy/references/api-handoff.md) only when the active workflow needs them. Reuse current repository context; live Jira contracts are reread at start/resume/handoff.

For the autonomous dev-with-PR profile, implementation starts in the fresh Progress session after Ready survey. Read the [phase procedure](../agent-execution-policy/references/execution-policy.md#khảo-sát--implement) and reconcile survey/feedback and existing output; no survey comment is not a blocker. Ready does not activate this skill. Other/direct operations keep their assigned scope, checks and delivery boundary.

## Ground and Plan

Read the live assigned Subtask, native parent, accepted decision comments, references and native dependencies. Verify its project/type, single routing label and Deliverable against this repository before acting. The Subtask owns the contribution; parent AC or Bug expected behavior owns the requirement basis. If assigned an accepted local contract without an issue, use that contract and requested boundary without publishing a ticket. Jira lifecycle actions require an assigned issue and the corresponding authorization.

Inspect the checkout, branch, target branch, existing output/PR and dirty files. Reuse the contribution's workspace, branch and PR on resume; otherwise isolate work on a scoped branch/worktree as needed. Never commit or overwrite unrelated changes. Resolve the review base to a commit from the intended target branch and record it for reproducible review.

Confirm dependencies are fulfilled before dependent execution. Announce a short plan describing changes, verification seams and material risks, then proceed within accepted scope without a plan-approval round. Do not require a plan file, snapshot, fingerprint or verification report in the repository.

For API integration, follow the [API consumer policy](../agent-execution-policy/references/api-handoff.md)
for current producer lookup and delivery readiness. Inspect affected operations and
trace their callers/types directly in source. Refresh producer/live evidence on
resume and before handoff when that gate is in the accepted scope; fixtures do not
prove producer publication or live integration.

## Implement and Verify

Use [tdd](../tdd/SKILL.md) for behavior verification; choose the highest stable public seam using the issue, repository policy and existing code. Follow the repository's diagnostic workflow when investigation is needed. Keep each slice small, run focused checks and fix failures caused by the change.

Run the completion checks required by repository policy for the affected work. Preserve required public contract documentation and handoff evidence. Missing evidence required for the assigned operation and phase prevents handoff readiness; keep implementation failures in Progress and reserve Blocked for external input/access under the [local handoff policy](../agent-execution-policy/references/execution-policy.md#local-handoff-and-live-acceptance). Require live acceptance only when the accepted assignment names the operation, scope, and required inputs; see the [runner scope and evidence guide](../../../docs/testing/browser-tests.md#runner-scopes-and-evidence).

## Decisions and Resume

Follow the repository's decision policy. Investigate discoverable facts first. Raise a material unresolved decision promptly; pause its dependent work while continuing meaningful independent work. Resolve human identities from explicit configuration or user context, never guess whom to mention. If a required durable update is unavailable or not authorized, present the decision in chat and report the missing update.

For the autonomous profile, implement only at Progress; [phase handoff](../agent-execution-policy/references/execution-policy.md#implement--review) ends this session at In Review. Review findings resume Progress and existing output, not Ready. Genuine external blockers use the owned blocker record and live destination/readback; do not activate parent lifecycle or change requirements.

Reread the issue on resume and before handoff. Evidence-only updates do not stop work. Accepted requirement changes within the same deliverable update the plan and invalidate affected checks/review. An unaccepted change or different deliverable requires a decision before dependent work continues. Keep the same branch/PR for review fixes within the original boundary.

## Review and handoff

In the autonomous dev-with-PR profile, fresh In Review performs independent review. Prepare code, actual local checks and PR CI under the [delivery PR gate](../../../docs/delivery.md#review-evidence-and-pr-gate), then use [Implement → Review](../agent-execution-policy/references/execution-policy.md#implement--review). Do not invoke a reviewer before that admission or perform Review/merge/delivery/Done in Implement. Save/read back a Jira comment only when the phase procedure requires it; otherwise the status transition is the handoff signal.

For other explicitly assigned workflows requiring independent review, invoke [code-review](../code-review/SKILL.md) with raw contract/base/HEAD/ownership/check evidence, resolve blocking findings and reverify affected parts. Those operations retain their own PR/CI/completion grants; this profile does not extend them. A standalone direct request stops at the requested local boundary without tracker/PR publication unless assigned.

Keep the PR title linked to the Subtask key, refresh its problem/final-change/checks/limits and preserve candidate history. Follow [branch/follow-up rules](../agent-execution-policy/references/execution-policy.md#implement--review) after merge and [API policy](../agent-execution-policy/references/api-handoff.md) for producer evidence when relevant. Continue in-scope fixes to the requested boundary; missing mandatory evidence is not a Pass.
