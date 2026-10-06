---
name: implement
description: Execute assigned Jira Subtasks or accepted local contracts through implementation, verification, independent review and the required delivery handoff.
---

# Implement

Use this skill for implementation requested by a human or assigned by Symphony. Jira lifecycle actions apply only to assigned Subtask runs or a workflow explicitly activated by the human. For those runs, load the repository-owned [agent-execution-policy](../agent-execution-policy/SKILL.md), `WORKFLOW.md`, `AGENTS.md` and applicable scoped instructions. For a standalone human request, implement and verify its scope without imposing tracker status, independent review, PR or CI handoff steps unless requested. Read the [decision gate](../agent-execution-policy/references/decision-gate.md) or [API handoff](../agent-execution-policy/references/api-handoff.md) only when the active workflow needs them. Reuse current repository context; live Jira contracts are reread at start/resume/handoff.

For an activated workflow run, the agent's boundary is a verified output with required checks, both independent-review axes, applicable PR/CI and a saved delivery handoff ready for In Review. Identify pending human merge/deploy/acceptance actions; the coordinator owns Done after the applicable delivery gate. Continue through in-scope fixes to that boundary. Authorization comes from the assignment/request and repository policy; do not select other available work.

## Ground and Plan

Read the live assigned Subtask, native parent, accepted decision comments, references and native dependencies. Verify its project/type, single routing label and Deliverable against this repository before acting. The Subtask owns the contribution; parent AC or Bug expected behavior owns the requirement basis. If assigned an accepted local contract without an issue, use that contract and requested boundary without publishing a ticket. Jira lifecycle actions require an assigned issue and the corresponding authorization.

Inspect the checkout, branch, target branch, existing output/PR and dirty files. Reuse the contribution's workspace, branch and PR on resume; otherwise isolate work on a scoped branch/worktree as needed. Never commit or overwrite unrelated changes. Resolve the review base to a commit from the intended target branch and record it for reproducible review.

Confirm dependencies are fulfilled before dependent execution. Announce a short plan describing changes, verification seams and material risks, then proceed within accepted scope without a plan-approval round. Do not require a plan file, snapshot, fingerprint or verification report in the repository.

## Implement and Verify

Use [tdd](../tdd/SKILL.md) for behavior verification; choose the highest stable public seam using the issue, repository policy and existing code. Follow the repository's diagnostic workflow when investigation is needed. Keep each slice small, run focused checks and fix failures caused by the change.

Run the completion checks required by repository policy for the affected work. Preserve required public contract documentation and handoff evidence. Missing mandatory evidence is a blocker, not a risk note that automatically permits handoff. Do not require manual live acceptance unless the user or repository policy requests it.

## Decisions and Resume

Follow the repository's decision policy. Investigate discoverable facts first. Raise a material unresolved decision promptly; pause its dependent work while continuing meaningful independent work. Resolve human identities from explicit configuration or user context, never guess whom to mention. If a required durable update is unavailable or not authorized, present the decision in chat and report the missing update.

For assigned Jira execution, recheck eligibility and enter Progress from Ready before implementation. Resume Progress on the same operation/output. Follow [blocker comments and resume](../agent-execution-policy/references/execution-policy.md#blocker-comments-and-resume) for genuine external blockers; stop at In Review, Blocked or Done. Use current transitions by destination status, not guessed IDs. Parent lifecycle and contract changes remain coordinator-owned.

Reread the issue on resume and before handoff. Evidence-only updates do not stop work. Accepted requirement changes within the same deliverable update the plan and invalidate affected checks/review. An unaccepted change or different deliverable requires a decision before dependent work continues. Keep the same branch/PR for review fixes within the original boundary.

## Independent Review

Invoke [code-review](../code-review/SKILL.md) with the issue/contract, resolved base, path ownership, working state and check evidence. It uses one independent reviewer for both axes. Do not substitute the implementing agent's own assessment if independent review is unavailable; report that requirement as unmet.

Resolve blocking findings, rerun affected checks, and have the reviewer reassess fixes and adjacent risks. Challenge an incorrect finding with evidence; escalate only unresolved material disagreement. Optional improvements do not expand the Task.

## PR and CI Handoff

For repository-file changes, commit scoped reviewed work, push the contribution's branch and create/update its one PR targeting the default branch. Read-only output does not require a PR; it still needs applicable review/check evidence. Read existing remote state before retrying a mutation to avoid duplicate PRs/comments. For a local-contract workflow without Jira, put the contract, acceptance coverage, commands/results, both review axes, remaining findings and verified output identity in the PR or requested artifact/session.

For assigned Jira work, reread the current Subtask key/title and apply the repository-owned policy's PR title/body format. Verify the saved PR title and Development-panel linkage before claiming a successful link. GitHub for Atlassian links through the Subtask key in the title; Git/PR tooling and credentials are separate from jira_rest. Report unavailable linking verification explicitly.

Keep one agent-owned Jira delivery handoff comment for this Subtask/operation using the [execution policy's format](../agent-execution-policy/references/execution-policy.md#pr-and-delivery-handoff). Update it on resume, verify ownership and read it back after saving. It records revision/output, review, checks/build, deploy or Not applicable, durable evidence and remaining actions/gaps; the Development panel is the PR link/status source. Missing permission or required evidence is unmet, not a readiness pass. Preserve human content and report ownership conflicts instead of overwriting or duplicating comments.

When a PR is used, wait for repository-required CI on its current revision. Fix in-scope failures on the same branch/PR, rerun affected checks/review and refresh handoff evidence after pushing. Use the delivered revision's results; external failures or missing access do not waive required checks.

Hand off only after required checks and both review axes are satisfied for the delivered output and the saved evidence describes that output. Recheck live Jira state/contract, verify the handoff comment and transition Progress → In Review under the prompt's grant. Record human-owned merge/deploy/acceptance as pending when applicable; stop execution at the handoff. The coordinator performs Done and parent acceptance, and a merge does not complete a Jira issue.

Return the PR, scope delivered, verification/review result and concrete remaining human acceptance. A narrow standalone invocation stops at the user's requested boundary rather than implicitly publishing.
