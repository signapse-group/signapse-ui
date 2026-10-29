---
tracker:
  kind: jira
  provider:
    base_url: $JIRA_BASE_URL
    email: $JIRA_EMAIL
    api_token: $JIRA_API_TOKEN
    project_key: SIGN
    issue_types: [Subtask]
    routing_labels:
      - route-backend
      - route-frontend
      - route-quality-assurance
      - route-mdg
      - route-landing
  required_labels: [route-frontend]
  dispatch_states: [Ready, Progress, In Review]
  active_states: [Ready, Progress, In Review]
  review_state: In Review
  session_boundary_states: [Ready]
  terminal_states: [Done]
polling:
  interval_ms: 10000
runtime_control:
  enabled: true
  path: /opt/apps/symphony/runtime/state/runtime-control.sqlite3
  id: fe
  members: [be, fe, landing]
  quota_check_timeout_ms: 15000
  heartbeat_interval_ms: 1000
  heartbeat_timeout_ms: 10000
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git -c credential.helper=/opt/apps/symphony/runtime/git-credential-github clone --depth 1 https://github.com/signapse-group/signapse-ui.git .
    git config credential.helper /opt/apps/symphony/runtime/git-credential-github
    pnpm install --frozen-lockfile
  before_run: |
    git fetch --no-tags origin +refs/heads/main:refs/remotes/origin/main
    /opt/apps/symphony/runtime/prepare-fe-workspace
  timeout_ms: 900000
agent:
  max_concurrent_agents: 1
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-6-luna"' --config model_reasoning_effort=max app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: dangerFullAccess
---

{% assign state = issue.state | strip | downcase %}

You are executing Jira Subtask `{{ issue.identifier }}` in `signapse-group/signapse-ui`.
Read `AGENTS.md`, `CONTRIBUTING.md` and applicable scoped instructions from the current `origin/main` policy revision using `git show origin/main:<path>`. Resolve relative policy links at that same revision, including the phase runbook selected below. The before_run fetch updates policy refs without changing the task branch or working output.

- Immutable ID: {{ issue.id }}
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- Snapshot state: {{ issue.state }}
- URL: {{ issue.url }}
- Labels: {{ issue.labels }}
{% if issue.native_ref %}
{% if issue.native_ref.issue_type %}
- Native type: {{ issue.native_ref.issue_type.name }}
{% endif %}
{% if issue.native_ref.parent %}
- Native parent: {{ issue.native_ref.parent.key }}
{% endif %}
{% endif %}
{% if attempt %}
- Follow-up attempt #{{ attempt }}
{% endif %}

Description:
{% if issue.description and issue.description != "" %}
{{ issue.description }}
{% else %}
Description not provided in the snapshot.
{% endif %}

Retain the live Jira `dependencies` envelope and apply the [dependency contract](https://github.com/signapse-group/signapse-symphony/blob/main/elixir/README.md#jira-dependency-contract). Use the current origin/main instruction/runbook sources specified above. Planning policy links are maintainer provenance, not execution prerequisites; live assignment design/ADR/API references remain required when relevant. Do not fetch Planning policy to manufacture an additional admission gate. If a required local source is missing, report deployment drift and stop the affected phase instead of searching legacy checkouts or backups for substitute policy.

{% if state == "ready" %}
## Phase: Survey

Read and execute the [Survey runbook](docs/runbooks/survey.md).

{% elsif state == "progress" %}
## Phase: Implement

Read and execute the [Implement runbook](docs/runbooks/implement.md).

{% elsif state == "in review" %}
## Phase: Review

Read and execute the [Review and delivery runbook](docs/runbooks/review-and-delivery.md).

{% else %}
## Phase: Stop

Snapshot state {{ issue.state }} is outside the granted phases. Stop autonomous work;
do not transition Ready/Progress to manufacture eligibility.
{% endif %}
