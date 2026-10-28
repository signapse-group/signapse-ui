---
name: implement
description: Implement accepted changes with focused verification, reusable code and reviewable evidence.
---

# Implement

Use this technique within the accepted request and repository instructions. Read [CONTRIBUTING.md](../../../CONTRIBUTING.md) for shared standards. For assigned execution, follow [WORKFLOW.md](../../../WORKFLOW.md); this skill adds no lifecycle permissions or gates. Direct work ends at the requested boundary.

## Ground and Plan

Read the accepted requirement source, relevant decisions/references and dependencies. Distinguish parent AC or Bug expected behavior from contribution scope and verification. An accepted local request is a valid source without a ticket.

Inspect checkout, branch/target, existing output and dirty-file ownership. Reuse existing work on resume; isolate it when needed. Resolve the intended review base to a commit and preserve unrelated changes.

Trace affected callers, tests, fixtures, configuration and exports. State the smallest complete change, verification seams and material risks; no mandatory plan file, snapshot or report is needed.

For API integration, apply [API consumer standards](../../../docs/api-consumer.md), inspecting current affected producer operations and consumer callers/types. Fixtures do not prove publication or live integration.

## Implement and Verify

Choose the highest stable public seam reaching the changed behavior; use testing or diagnosis techniques when needed. Keep slices small, run focused checks and fix failures caused by the change.

Apply [verification standards](../../../CONTRIBUTING.md#verification), including [test ownership and selection](../../../CONTRIBUTING.md#test-ownership-and-selection), and the [change-scope matrix](../../../docs/testing/browser-tests.md#selecting-checks-by-change-scope). Preserve required public contract documentation and actual check evidence. Missing mandatory evidence remains a gap.

## Decisions and Resume

Apply [decision/evidence standards](../../../CONTRIBUTING.md#decisions-and-evidence). Resolve human identities from configuration/user context rather than guessing. Reconcile changed requirements and existing feedback/output on resume; reverify affected behavior while retaining valid unrelated evidence.

## Reviewable output

Keep the problem, final change, candidate and actual checks/limits clear in the requested PR/artifact/session. When the assignment requires independent review, provide the contract, resolved base/HEAD, ownership and raw check evidence without a predetermined verdict; the assignment supplies that role. Resolve blocking findings and reverify affected parts. Preserve candidate history and finish the requested scope.
