---
name: setup-workflow
description: Configure the Signapse UI Jira Subtask worker in WORKFLOW.md from verified planning, repository, tracker and deployment facts.
---

# Setup Workflow

Run explicitly when configuring or refreshing this repository's Symphony consumer.
The request establishes the intended onboarding scope; reuse approvals already
given. This skill writes only `WORKFLOW.md`, leaving host installation, product
planning, issue publication and runtime activation to their owners. Read
`AGENTS.md` and applicable instructions; configuration work does not activate an
implementation run or Jira lifecycle writes.

## Explore first

Read the repository-owned [agent-execution-policy](../agent-execution-policy/SKILL.md)
and [runtime configuration reference](references/symphony-workflow.md). Compare
the current workflow with [planning's execution policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md)
and the installed Symphony version's Jira guide. Clarify only material unresolved
exceptions; already-approved migration choices need no second confirmation.

Inspect the target repository before proposing any configuration:

- Root/scoped instructions, current `WORKFLOW.md`, Git remote/branch and dirty-file ownership.
- Package scripts, lockfile, CI/required checks and delivery conventions.
- Jira Subtask/parent contracts, native relationships and accepted planning routing/lifecycle.
- Clone/bootstrap and availability of committed repository-owned execution skills after clone.
- Installed Symphony support and host configuration: workspace root, polling,
  concurrency, turn limits, Codex/model, approval, sandbox/network and tool availability.

Preserve existing environment-backed references such as `$SYMPHONY_WORKSPACE_ROOT`
and established host settings. Verify resolved paths/credentials on the host
before activation, rather than asking the user to re-enter discoverable values.
An inaccessible deployment profile is a verification limit; retain existing values
and report it without inventing machine-specific settings.

## Verify the Jira profile

Use authorized read-only Jira operations to verify site/project `SIGN`, native
Subtask type, native Parent/Blocks support and the current statuses/transitions.
Do not infer live options from source code or an empty issue search. Resolve IDs
from current metadata when an API needs them; status and transition names are distinct.

Configure Jira with `issue_types: [Subtask]`, the full recognized routing set from
planning in `provider.routing_labels`, and `required_labels: [route-frontend]`.
Verify native Subtask metadata/parent and exactly one recognized route. Preserve
business labels; title prefix or assignee does not determine repository routing.
Keep malformed or missing profiles unready instead of widening selection.

Map verified states to `dispatch_states: [Ready, Progress]`,
`active_states: [Ready, Progress]`, `review_state: In Review`,
`terminal_states: [Done]`. Open, In Review and Blocked remain outside execution;
Done is terminal. Progress discovery recovers authorized work after restart/review/
blocker resume, reusing its output. Coordinator owns Open → Ready, Blocked resume
to the actual previous status, Done and parent acceptance.

Confirm dependency admission for Ready and Progress: native blockers must be in
Jira category done; unreadable blockers and Resolved in an active category do not
qualify. Source/profile readiness does not establish installed-worker support or
authorize live dispatch. Record a gap if Jira/runtime support differs from the profile.

Use repository/tracker/host evidence for names, commands, CI, delivery conditions
and owners. Derive bootstrap from committed package/lock files and use established
role-based owners. Ask only about an undiscoverable material setting that changes
selection or delivery behavior.

## Configuration boundary

Configure only the project-specific execution context needed by the Symphony entrypoint:

- repository role and contract source;
- focused and completion checks;
- required CI;
- operation-specific handoff/delivery and Jira Development-panel PR linking;
- human acceptance owner;
- relevant architecture, API-contract, and domain-context locations;
- output language.

Map accepted fields/states into supported runtime configuration. Requirements,
hierarchy, routing changes, publication and acceptance remain planning/coordinator-owned.

Keep these ownership boundaries explicit:

- This repository owns its tracker profile, clone/bootstrap, local skills, checks,
  review/handoff policy and unattended prompt.
- The Symphony deployment owns workspace location, polling, concurrency, Codex command, model,
  approval policy, sandbox policy, credentials, and host tool availability.

Preserve or inherit deployment-owned values from the deployed profile. Keep environment-backed
references such as `$SYMPHONY_WORKSPACE_ROOT` instead of resolving them into machine-specific paths.
Do not ask the repository user to choose deployment settings during repository onboarding. If the
deployment profile cannot be inspected, retain existing references and values; for absent optional
fields, rely on supported runtime defaults and report the deployment verification gap. Do not invent
host-specific values merely to make the draft look complete.

Keep detailed execution rules in repository-owned policy and implementation skills.
The prompt states assigned scope, context, permissions and handoff boundary, then
points to those local sources. Do not provision a skills package from Symphony
or add a second policy engine.

For API context, use the repository's [API consumer policy](../agent-execution-policy/references/api-handoff.md):
producer-published contracts own the current API; Jira owns accepted requirements.
Keep its lookup/discrepancy and conditional handoff pointer in refreshed prompts,
with source-code impact analysis rather than a maintained mapping document.

## Draft before writing

Summarize verified facts, gaps and assumptions and show the complete proposed
`WORKFLOW.md` when drafting an unapproved configuration. Its prompt reads repository
instructions, loads local policy and invokes implement, supplies immutable issue
ID/type/parent context, and rereads live contracts through jira_rest. State granted
operations and the non-terminal In Review boundary. Credential values stay in host
environment variables/helpers.

Before showing the `WORKFLOW.md`, summarize the proposed mapping as `dispatch`, `active`,
`review handoff`, and `terminal`. The review handoff must be non-terminal and excluded from
`active_states` when Symphony should stop while a human owns the next action.

Obtain acceptance before writing a new proposal; an explicit request to implement
an already-approved plan supplies that acceptance. Do not ask again for agreed
scope/settings or infer approval from silence. Missing required settings remain
unready; do not write placeholders that could select wrong work. Accepted repository
configuration does not authorize host changes, canaries or Jira writes.

## Write safely

After explicit acceptance:

1. Create or update the root `WORKFLOW.md`. Preserve valid provider-specific and deployment-owned
   settings and unrelated prompt instructions unless they conflict with the accepted execution
   boundary. Never copy credentials into it.
2. Confirm clone includes committed local policy, implement and required companion skills; no Symphony package install is needed. Validate YAML/config and strict Liquid rendering with the supported runtime using offline fixture credentials/metadata. Never start live polling merely to validate a file.
3. Do not overwrite unrelated edits or create or change `AGENTS.md`.

Re-read the resulting `WORKFLOW.md` and report its exact path, the settings written, unresolved items,
and any repository or deployment evidence gap. Validate its YAML. The accepted `WORKFLOW.md` prompt
grants only the unattended actions it states; it does not implicitly authorize merge or deployment.
