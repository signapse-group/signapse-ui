---
name: code-review
description: Review requirement adherence and correctness against repository standards, including relevant committed and working changes.
---

# Code Review

Read repository instructions and [review standards](../../../CONTRIBUTING.md#review-standards), reusing current context. Assigned execution follows [WORKFLOW.md](../../../WORKFLOW.md); this technique adds no permissions, lifecycle gates or reviewer role. A standalone review is read-only unless the user assigns additional actions. Return **Requirement adherence** and **Correctness & Standards** separately.

## Establish Sources and Scope

Accept the issue/contract and resolved base from the caller. For a PR, resolve its actual base branch; honor an explicit user-specified base. Ask only if the intended base or source cannot be discovered unambiguously. Resolve refs to commit SHAs before reviewing.

Read the live Jira Subtask and native parent, accepted decision comments and references directly. Assess the contribution against parent AC or Bug expected behavior and its own scope/Verification. A local accepted contract is valid for explicitly assigned work without an issue. In ad hoc review without a requirement source, disclose that adherence cannot be assessed; never convert missing required input into a full contribution handoff pass.

For API work, read the [API consumer standards](../../../docs/api-consumer.md)
and current producer contract for the relevant environment. Requirement adherence
uses accepted requirements; Correctness & Standards checks consumer schema, auth,
status/error/media/protocol and business semantics against that contract. Verify
applicable producer publication/revision and local consumer evidence under
[test ownership and selection](../../../CONTRIBUTING.md#test-ownership-and-selection);
live feature evidence belongs to QA/coordinator, not FE review gates.
A structural guard or P0 pass does not prove full integration.
Raise discrepancies to the owner instead of changing expected behavior or inferring
filter scope from generic runtime fields.

Inspect the contribution's committed diff from the resolved base/merge-base to HEAD, staged and unstaged diffs, and relevant untracked output. An empty committed diff is not an empty review if uncommitted work exists. Inspect relevant final code beyond changed lines to understand behavior and callers; for read-only deliverables, inspect the report and source evidence. Record base, HEAD and which working changes/output were inspected.

Exclude unrelated changes only with clear ownership evidence. Report ambiguous scope and whether it prevents a reliable conclusion. Do not silently ignore ambiguous files or assign all worktree changes to this Task.

## Review independence

When independence is required, assess raw contract/code/check evidence directly without a predetermined verdict. The assignment supplies the reviewer role; this skill does not require another reviewer. If independence is unavailable, disclose the unmet requirement rather than calling self-review independent.

## Assess and report

Apply [review standards](../../../CONTRIBUTING.md#review-standards) for the two verdicts, finding severity and completion, and [verification standards](../../../CONTRIBUTING.md#verification) for applicable evidence. Return the assessment in the requested PR/artifact/session under the assignment's boundary.
