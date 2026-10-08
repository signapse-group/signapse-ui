---
name: code-review
description: Review issue adherence and technical correctness with one independent reviewer, covering committed and relevant uncommitted changes before handoff.
---

# Code Review

Use [agent-execution-policy](../agent-execution-policy/SKILL.md) when reviewing an explicitly assigned workflow run; a standalone review does not activate the issue lifecycle. Read repository instructions if present, reusing them if already in context. Read linked policies only for the reviewed scope. Return two separate axes in one review: **Requirement adherence** and **Correctness & Standards**. This skill reviews work; it does not edit code, publish remote feedback, commit, or create a PR unless the user explicitly requests those actions.

## Establish Sources and Scope

Accept the issue/contract and resolved base from the caller. For a PR, resolve its actual base branch; honor an explicit user-specified base. Ask only if the intended base or source cannot be discovered unambiguously. Resolve refs to commit SHAs before reviewing.

Read the live Jira Subtask and native parent, accepted decision comments and references directly. Assess the contribution against parent AC or Bug expected behavior and its own scope/Verification. A local accepted contract is valid for explicitly assigned work without an issue. In ad hoc review without a requirement source, disclose that adherence cannot be assessed; never convert missing required input into a full contribution handoff pass.

For API work, read the [API consumer policy](../agent-execution-policy/references/api-handoff.md)
and current producer contract for the relevant environment. Requirement adherence
uses accepted requirements; Correctness & Standards checks consumer schema, auth,
status/error/media/protocol and business semantics against that contract. Verify
applicable producer publication/revision and FE live evidence when those gates are
in the accepted scope. A structural guard or P0 pass does not prove full integration.
Raise discrepancies to the owner instead of changing expected behavior or inferring
filter scope from generic runtime fields.

Inspect the contribution's committed diff from the resolved base/merge-base to HEAD, staged and unstaged diffs, and relevant untracked output. An empty committed diff is not an empty review if uncommitted work exists. Inspect relevant final code beyond changed lines to understand behavior and callers; for read-only deliverables, inspect the report and source evidence. Record base, HEAD and which working changes/output were inspected.

Exclude unrelated changes only with clear ownership evidence. Report ambiguous scope and whether it prevents a reliable conclusion. Do not silently ignore ambiguous files or assign all worktree changes to this Task.

## One Independent Reviewer

The coordinating agent delegates one read-only review to a reviewer that did not implement the change. Provide raw source locations/issue identity, base/HEAD, ownership context and check outputs; do not supply a predetermined verdict. The reviewer reads the source contract and code itself.

The delegated reviewer executes the two axes directly and returns its findings; it must not spawn another review coordinator. If already running as that independent reviewer, do not delegate again. If delegation is unavailable, disclose the unmet independent-review requirement rather than claiming a self-review is independent.

## Review Both Axes

**Requirement adherence:** map Acceptance Criteria or Expected Behavior to the actual final behavior and suitable evidence. Check omissions, scope creep, accepted contract changes, and related regression risks. Existing implementation can satisfy a criterion without appearing in the diff. Tests passing alone do not establish full coverage.

For a local implementation handoff, require only the applicable local checks, review,
and CI. A protected page or reused authenticated transport does not alone add live
smoke; require it when the accepted assignment names the operation, scope, and inputs.
Check that scoped selectors still cover every affected behavior, and report baseline
gaps and pending live acceptance separately from contribution findings.

Assess mandatory evidence at the contribution's operation and phase using the [local handoff policy](../agent-execution-policy/references/execution-policy.md#local-handoff-and-live-acceptance). Pending QA/owner acceptance and coordinator-owned metadata are recorded separately from blocking implementation findings; missing required behavior, local verification, review or CI still prevents handoff readiness.

**Correctness & Standards:** inspect defects in logic, authorization/security, persistence, concurrency, error handling and applicable repository standards. Consider maintainability where it has a concrete impact; naming preferences and speculative abstractions are not automatic blockers. Standards take precedence over generic heuristics.

Use existing check evidence when it applies to the reviewed state. Request or run missing safe checks appropriate to the work; do not broaden testing solely to repeat a green result. Documentation-only work does not require code or build checks unless repository policy says otherwise. Report missing significant required evidence explicitly.

## Findings and Completion

Make each finding actionable and traceable to its axis, location and evidence. Scale explanation to impact; a concise sentence may suffice for a simple nonblocking finding, without a fixed multi-field template. Distinguish:

- **Blocking:** missing/wrong required behavior, correctness/security defects affecting safe delivery, missing mandatory evidence or failing required checks.
- **Nonblocking:** optional naming, refactoring or optimization that does not affect requirements or safety.

Report a separate result for each axis and one handoff conclusion. A nonblocking suggestion does not keep the contribution in execution. The implementer may challenge findings with evidence; reassess them rather than requiring unnecessary changes. Escalate unresolved material contract/risk disagreements to the human.

After fixes, review the changed parts and affected surrounding behavior; broaden only if warranted. A later code, contract or base change invalidates affected evidence. Return the result for the assigned Jira Subtask's delivery handoff comment, or the requested local-contract PR/artifact/session. Identify applicable pending human-owned delivery actions; the reviewer does not transition issues or claim coordinator acceptance. No mandatory repository report, snapshot or fingerprint is needed.
