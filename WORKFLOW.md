---
tracker:
  kind: github
  provider:
    repo: signapse-group/signapse-ui
    project_owner: signapse-group
    project_number: 1
    issue_types:
      - Task
      - Bug
  required_labels: []
  dispatch_states:
    - Ready
  active_states:
    - Ready
    - In progress
  review_state: In review
  terminal_states:
    - Done
polling:
  interval_ms: 10000
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git -c credential.helper=/opt/apps/symphony/runtime/git-credential-github clone --depth 1 https://github.com/signapse-group/signapse-ui.git .
    git config credential.helper /opt/apps/symphony/runtime/git-credential-github
    pnpm install --frozen-lockfile
agent:
  max_concurrent_agents: 4
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-5.6-luna"' --config model_reasoning_effort=xhigh app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
    networkAccess: true
---

You are working on assigned GitHub Project work item `{{ issue.identifier }}` in `signapse-group/signapse-ui`.

{% if attempt %}
This is follow-up attempt #{{ attempt }}. Resume the existing workspace, branch, and pull request;
do not restart completed investigation or verification unless later changes invalidated it.
{% endif %}

Read the root `AGENTS.md`, load `$agent-execution-policy`, and invoke `$implement` for this work item.
The work item is the accepted implementation contract for this unattended run.

Issue context:

- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- State: {{ issue.state }}
- URL: {{ issue.url }}
- Labels: {{ issue.labels }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

Use this tracker lifecycle:

- `Open`: outside autonomous dispatch.
- `Ready`: ready for autonomous work; move it to `In progress` before implementation.
- `In progress`: implementation, verification, review fixes, pull-request delivery, and required CI are agent-owned.
- `In review`: non-terminal human handoff. Do not modify code or merge while the item remains in this state; human-requested changes return it to `In progress`.
- `Blocked`: use only when material external input or access is required and no meaningful independent work remains.
- `Done`: terminal; do nothing and stop.

This run authorizes implementation, verification, scoped commits, branch push, pull-request creation or
update, required CI follow-up, and GitHub Project transitions from `Ready` to `In progress`, from
`In progress` to `In review`, or from an active state to `Blocked` when the shared policy's blocker
conditions are met. Continue from the existing workspace and pull request on later attempts.

Move to `In review` only after `$implement`'s completion checks, independent review, pull-request
evidence, and configured required CI are satisfied for the delivered revision.

Do not merge, deploy, move the item to `Done`, change product requirements, or create additional work
items unless the root `AGENTS.md` explicitly authorizes that action. Stop at the `In review` handoff,
`Done`, or a genuine external blocker with no meaningful independent work remaining.
