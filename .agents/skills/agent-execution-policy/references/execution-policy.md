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

Use the versioned workspace runner and exact operation/case selectors described in
the [scope and evidence guide](../../../../docs/testing/browser-tests.md#runner-scopes-and-evidence).
Selectors must cover every behavior affected by the contribution. The runner reports
application revision, suite revision, worktree state, version, and selected scope;
host activation remains a coordinator action after merge.

## Execution and review

1. Read the contract, references, this policy and applicable repository instructions.
2. Inspect branch, base, existing output/PR and ownership of dirty files. State scope, verification seam and material risks.
3. Implement the smallest accepted change and run focused checks, then repository-required completion checks.
4. Have one independent reviewer inspect committed and relevant uncommitted work, reporting Requirement adherence separately from Correctness & Standards.
5. Resolve blocking findings, reverify affected behavior and re-review affected parts.
6. Deliver the verified output, resolve required CI when a PR is used, and read back the saved handoff before entering `In Review`.

Reuse the same workspace, branch and PR for a contribution's retries and review fixes. Repository-file changes require one PR targeting the default branch. Read-only investigation/report output does not require a PR, but still requires applicable review and evidence. Missing required implementation checks, review or access is not a pass. Human-owned merge, deployment and acceptance may remain pending at `In Review`; identify them clearly rather than marking their gates complete.

## PR and delivery handoff

GitHub hosts source, PRs and CI. For assigned Jira work, reread the current Subtask key/title and set the PR title to `[<Jira-key>] <current Subtask title>`. Follow a repository PR template when present; otherwise write a concise change and validation summary. The Jira key links the PR to the Subtask's Development panel through GitHub for Atlassian. Verify the saved title and actual panel linkage before claiming the link is established; report unavailable linking verification explicitly. Git/PR access is configured separately from `jira_rest`.

Keep one agent-owned delivery handoff comment on the Subtask, updated for its latest delivered revision/output. Preserve earlier revision identities and evidence links when updating the same operation; distinct QA runs retain their own records. Identify the existing comment and author before editing; preserve other authors' content. If ownership is unclear, report the conflict instead of overwriting or duplicating the record. Use the planning format:

```text
Delivery handoff

- Repository: signapse-group/signapse-ui
- Revision/output: <verified commit or report/output identity>
- Review: <reviewer; both axes and result>
- Checks/build: <commands/results; runner version, app/suite revisions and scope; contract coverage>
- Deploy: <environment/revision/result or pending owner action> | Not applicable
- API contract: <producer OpenAPI/protocol URL and producer revision/environment> | Not applicable
- Contract live check: <fetch time, revision match/result and evidence> | Not applicable
- Evidence: <durable links and short summary>
- Remaining: <none or explicit gaps and human-owned actions>
```

The Development panel is the PR link/status source; the comment holds delivery evidence. Evidence files stay outside Jira with durable links and limits. Deploy is Not applicable only when the deliverable does not require deployment; otherwise record confirmed evidence or the pending owner/action. `Done` additionally requires the coordinator's review/check acceptance, merge when required and deployment/evidence when applicable. Merge and child completion do not automatically satisfy Subtask or parent acceptance.

The API fields apply when this output integrates or delivers API behavior. Separate
FE output identity from the producer's delivered contract. Use Not applicable for
unrelated output; missing required producer revision/publication evidence is a gap.
Keep schema/business rules at the producer source. Record remaining contract
coverage/discrepancies, breaking changes, affected consumers and pending integration
under Remaining when applicable.

For local-contract workflow work without Jira, record the same applicable evidence in the PR or requested artifact/session. Do not invent a tracker record.

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

Investigate the blocker and required human action before stopping. Reread current status/comments, then create or update this agent's comment for the same blocker. Record the actual pre-Blocked status and read the saved comment back before entering Blocked; verify the resulting status. Use the repository's output language:

```markdown
**Blocked**

- Reason: <What prevents progress.>
- Checked: <Attempts/results; evidence when useful.>
- Needed: <Human action/owner or decision with recommendation.>
- Pre-Blocked: <actual native status before this blocker>
- Resume: <condition to proceed>; coordinator restores <pre-Blocked status>.
```

A hard task or failing implementation test alone is not Blocked. Keep comment items concise; the comment is the notification and needs no separate message channel. If saving or verifying it fails, do not transition to Blocked. If the transition is unconfirmed, preserve the comment and report the uncertainty.

The coordinator records resolution and uses Jira's native most-recent-status rule to resume exactly the pre-Blocked status. On resume, verify the resolution and current contract, then continue existing output; a status change alone does not resolve the blocker. Resume to In Review remains idle. A new operation after Done uses a new Subtask decided by the coordinator.

## Contract changes and evidence

Investigate discoverable facts before invoking [decision-gate.md](decision-gate.md) for a material unresolved decision. Routine implementation choices remain with the implementer. Accepted changes within the same contribution update the plan and invalidate only affected checks/review. A different deliverable requires a human replacement/cancellation decision.

Re-read live contracts before handoff. Code, contract, dependency or base changes invalidate affected evidence; use the delivered revision's results. Evidence belongs in the session, PR and Jira handoff, without a parallel snapshot/fingerprint requirement. Use Vietnamese for status/handoff communication and preserve repository language in code/documents. Ordinary skill invocations retain their requested boundary without implicitly publishing, transitioning or activating this workflow.
