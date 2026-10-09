# Signapse UI execution policy

Apply this policy to assigned Jira Subtask runs or an explicitly activated local-contract workflow. Configuration maintenance, skill installation and ordinary requests do not activate tracker lifecycle actions.

## Authority and contract

[Planning's execution workflow](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md) owns hierarchy, routing, dispatch authorization and acceptance. Its [Subtask format](https://github.com/signapse-group/signapse-planing/blob/main/workflow/issue-types/subtask.md) and [tracker policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/issue-tracker.md) define operation completion and handoff. `WORKFLOW.md`, `AGENTS.md`, scoped instructions and these repository-owned skills define UI execution. Symphony supplies runtime orchestration independently of the skills.

Assigned Subtask and accepted parent requirements → implementation/investigation and verification → independent review → findings resolved → delivery handoff → coordinator acceptance.

Read the live Subtask, its native parent, relevant accepted comments, dependencies and approved references at start, resume and handoff. Verify project `SIGN`, native Subtask type, parent Story/Task/Bug, exactly one recognized route matching `route-frontend`, and Deliverable ownership in `signapse-group/signapse-ui`. Use the routing set in `WORKFLOW.md`; other business labels may coexist. Parent readiness and assignee do not replace the Subtask's dispatch gate or native dependency links.

Confirm native `is blocked by` dependencies are complete before initial or resumed execution. Jira category `done` satisfies the routed admission gate; `Resolved` in an active category does not. Unreadable or ambiguous dependencies remain unsatisfied. Required missing references block dependent work; continue meaningful independent investigation. Raise material requirement gaps to the coordinator instead of defining new scope, API contracts or tickets.

For an explicitly accepted local contract without a Jira issue, use the named contract and requested delivery boundary; do not create a ticket as a prerequisite. Tracker actions below apply only to assigned Jira work and within the prompt's granted permissions.

For API behavior work, follow the [API consumer policy](api-handoff.md) for producer
lookup and discrepancy handling. Run live contract/producer checks when they are part
of the assigned operation; native dependency completion does not replace evidence
that the accepted scope explicitly requires.

## Local handoff and live acceptance

The default agent handoff covers the assigned implementation with applicable local
checks, independent review, required PR/CI, and saved evidence. A protected page or
reuse of authenticated transport does not by itself require private live smoke.
Require live execution only when the accepted assignment names the operation, scope,
and inputs needed to run it. Report local fixture evidence separately from live
acceptance; fixtures never count as an authentication or backend pass.

Separate contribution failures from baseline gaps, pending live acceptance, and
missing live inputs. A baseline mismatch outside a selected scope remains visible in
full-mode results without failing an unrelated scoped result. Block only when an
explicitly assigned operation cannot proceed for lack of input/access and no useful
independent work remains. A required output that does not exist is still a gap. When
the revision/output exists and is reviewable, the coordinator may own metadata or
link verification that the agent cannot write; record that action as pending and do
not claim verification succeeded.

QA case preparation/approval/runs, merge/deployment of this contribution and owner acceptance are separate gates; record their owner and next action as pending. Parent acceptance or an unfinished QA ticket does not by itself block an authorized dev contribution. An unresolved choice solely about who performs QA goes to the coordinator without stopping independent implementation; a choice changing expected behavior or required dev verification blocks the affected work. This does not waive planning's requirement-completion gate before ticket publication or native dependency admission.

Required behavior, local checks, independent review and required CI remain handoff gates. Fix contribution failures in Progress; use Blocked only for necessary external input/access when no meaningful independent work remains. Record the affected output/AC/check and resume condition. Baseline failures outside the selected scope remain visible; a failed required full check or CI is never converted into a scoped pass. Missing mandatory output, publication access, saved handoff or status-write access remains a gap; metadata pending does not establish a successful transition.

Use the versioned workspace runner and exact operation/case selectors described in
the [scope and evidence guide](../../../../docs/testing/browser-tests.md#runner-scopes-and-evidence).
Selectors must cover every behavior affected by the contribution. The runner reports
application revision, suite revision, worktree state, version, and selected scope;
host activation remains a coordinator action after merge.

## Bug fixes and QA retest

For an assigned fix Subtask under a Bug, reread the accepted expected/basis and latest relevant QA handoff with its report/evidence at start, resume and handoff. Identify case/version, actual, tested build/environment and assigned impacted regression. Apply [QA Retest outcomes](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#qa-retest-outcomes); a FAIL summary can include Blocked/Not Run checks or a different regression deviation. Implement the assigned fix scope without treating every report failure as the same Bug.

Link the Bug and QA run/report addressed in the fix handoff, with corrected coverage, delivered source revision, local checks/regression and pending merge/deploy owner/action. After deployment, the delivery owner supplies evidence connecting that fix to the tested build/environment for QA; local checks or a build SHA alone do not establish deployment. Pending deployment does not delay a dev In Review handoff whose local gates passed.

The coordinator owns Bug Resolved/Closed/Reopened, QA completion and follow-up assignment. Dev checks do not close the Bug or overwrite QA results/approval. Done is terminal; a later fix/run requires a new coordinator-assigned Subtask. Do not revive a completed contribution or mutate its parent from a QA FAIL summary.

## Execution and review

1. Read the contract, references, this policy and applicable repository instructions.
2. Inspect branch, base, existing output/PR and ownership of dirty files. State scope, verification seam and material risks.
3. Implement the smallest accepted change and run focused checks, then repository-required completion checks.
4. Have one independent reviewer inspect committed and relevant uncommitted work, reporting Requirement adherence separately from Correctness & Standards.
5. Resolve blocking findings, reverify affected behavior and re-review affected parts.
6. Deliver the verified output, resolve required CI when a PR is used, and read back the saved handoff before entering `In Review`.

Reuse the same workspace, branch and PR for a contribution's retries and review fixes. Repository-file changes require one PR targeting the default branch. Read-only investigation/report output does not require a PR, but still requires applicable review and evidence. Missing required implementation checks, review or access is not a pass. Human-owned merge, deployment and acceptance may remain pending at `In Review`; identify them clearly rather than marking their gates complete.

## PR and delivery handoff

GitHub hosts source, PRs and CI. For assigned Jira work, reread the current Subtask key/title and set the PR title to `[<Jira-key>] <current Subtask title>`. Follow the repository PR template/conventions: explain the problem, final change, verification and technical limits, and refresh the body against the delivered revision before handoff. Jira records current coordination and pending owner actions. Verify the title and actual Development-panel linkage before claiming it established; Git/PR access is separate from `jira_rest`.

Write the handoff for the coordinator's next decision, normally 4–6 content lines. Add lines for material gaps, multiple blockers or API phases when needed; there is no length gate. Omit inapplicable fields. Keep detailed commands, counts, logs, hashes and investigation history in the linked PR/report/evidence.

Keep one agent-owned comment for the same deliverable, updated to its current output. Verify ownership beyond a shared API account, reread live content before editing, preserve human content and read back after saving. If ownership is unclear, report the conflict instead of overwriting or duplicating the record. Preserve earlier output identities with their evidence in linked, versioned history before replacing the summary; an earlier revision's checks do not establish the current result. Distinct QA runs retain separate records. Evidence retains its existing storage, access and retention rules.

```text
Bàn giao dev — <verified outcome>
- Output: signapse-group/signapse-ui · <revision> · <PR/artifact link>.
- Xác minh: <local checks/result>; <reviewer/both axes/result>; <required CI result>.
- Tiếp theo: <owner> — <specific action, including pending delivery when applicable>.
- Còn lại: <material gap/limit, or no remaining mandatory gap>.
- Chi tiết: <durable evidence/history link if not covered by the output link>.
```

For API work, identify the producer contract/environment/revision separately from the FE output and distinguish local verification from live delivery. Link the contract and fetch/revision-match evidence; summarize missing required publication evidence, coverage/discrepancies, breaking changes, affected consumers and pending integration. Schema/business rules stay at the producer. Omit API fields for unrelated work. Runner version, app/suite revisions and selected scope stay in linked check evidence.

The Development panel is the PR link/status source. Pending human merge/deploy/acceptance has an owner and next action; it does not itself block dev handoff. Required behavior/checks/review/CI remain gates. `Done` additionally needs coordinator acceptance, merge when required and deployment/evidence when applicable; merge/child completion does not establish it.

For a local-contract workflow without Jira, put the applicable summary/evidence in the requested PR/artifact/session; do not invent a tracker record.

## Jira lifecycle and writes

| Status    | Meaning and next-action owner                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Open      | Outside dispatch; coordinator defines and approves the operation.                                                     |
| Ready     | Coordinator-authorized queue; agent rechecks contract/route/dependencies, then enters Progress before implementation. |
| Progress  | Agent executes/resumes the same contribution, verification and review fixes.                                          |
| In Review | Human handoff; stop execution. Coordinator/reviewer may return feedback to Progress.                                  |
| Blocked   | External input/access prevents all meaningful independent progress; coordinator resolves and resumes.                 |
| Done      | Terminal; coordinator completes the applicable delivery gate. Stop.                                                   |

Use `jira_rest` in Symphony or the authorized Jira connector in other sessions. Resolve the current available transition by destination status and operation; never guess IDs or bypass native workflow conditions. The unattended prompt permits Ready → Progress, Progress → In Review and active-state → Blocked under their gates. Coordinator-owned Open → Ready, Blocked resume, Done and parent transitions remain outside that grant. Merge, deployment, requirement edits and additional tickets require explicit authorization for the current scope.

Paginate relevant comments and use supported rich text; REST v3 comment bodies use ADF. Verify saved comments and status writes. After a timeout or ambiguous mutation, reread the remote issue/comment/PR before retrying so an already-successful write does not create a duplicate. Credentials remain outside Git and evidence. Prompt rules do not reduce the Jira credential's API permissions.

### Blocker comments and resume

Keep the blocker separate from delivery handoff. Investigate missing input/access and finish meaningful independent work first. Reread status/comments and update this agent's record for the same blocker; put the affected output/AC/check and human action first, with concise checks and a detail link. Record actual pre-Blocked status, save/read back before entering Blocked and verify the resulting status under the assigned grant.

```text
Blocked — <reason and affected output/AC/check>
- Cần <owner>: <specific action or decision>.
- Đã kiểm tra: <short result>; <evidence link>.
- Tiếp tục khi: <verifiable condition>.
- Pre-Blocked: <actual native status>; coordinator resumes to this step.
```

A hard task or implementation/test failure alone is not Blocked. If saving/verifying the comment fails, do not transition; report an unconfirmed transition accurately. A retry is not a reason to append another investigation journal.

Coordinator resolution names the blocker that is resolved/superseded, links the owning contract decision/evidence and identifies any remaining blocker and next action. Mark the original blocker's first line with a resolution link only when ownership/edit permission is established; otherwise use an authorized resolution with a backlink. The next handoff identifies the old blocker as resolved, preserving history and human content.

```text
Đã giải quyết blocker — <blocker comment link>
- Quyết định/bằng chứng: <result>; <contract/evidence link>.
- Còn lại: <other blocker, or none for this operation>.
- Tiếp theo: <owner> — <action/status under the existing gate>.
```

The coordinator uses Jira's most-recent-status rule to resume exactly the pre-Blocked status. Verify resolution and current contract on resume; a status change alone does not resolve the blocker. Resume to In Review remains idle. A new operation after Done uses a new Subtask decided by the coordinator.

## Contract changes and evidence

Investigate discoverable facts before invoking [decision-gate.md](decision-gate.md) for a material unresolved decision. Routine implementation choices remain with the implementer. Accepted changes within the same contribution update the plan and invalidate only affected checks/review. A different deliverable requires a human replacement/cancellation decision.

Re-read live contracts before handoff. Code, contract, dependency or base changes invalidate affected evidence; use the delivered revision's results. Evidence belongs in the session, PR and Jira handoff, without a parallel snapshot/fingerprint requirement. Use Vietnamese for status/handoff communication and preserve repository language in code/documents. Ordinary skill invocations retain their requested boundary without implicitly publishing, transitioning or activating this workflow.
