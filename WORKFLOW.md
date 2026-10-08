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
  dispatch_states: [Ready, Progress]
  active_states: [Ready, Progress]
  review_state: In Review
  terminal_states: [Done]
polling:
  interval_ms: 10000
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git -c credential.helper=/opt/apps/symphony/runtime/git-credential-github clone --depth 1 https://github.com/signapse-group/signapse-ui.git .
    git config credential.helper /opt/apps/symphony/runtime/git-credential-github
    pnpm install --frozen-lockfile
  before_run: |
    /opt/apps/symphony/runtime/prepare-fe-workspace
  timeout_ms: 900000
agent:
  max_concurrent_agents: 4
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-6-luna"' --config model_reasoning_effort=max app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: dangerFullAccess
---

You are executing the assigned Jira Subtask `{{ issue.identifier }}` in `signapse-group/signapse-ui`.

{% if attempt %}
This is follow-up attempt #{{ attempt }}. Resume the existing workspace, branch, and pull request;
do not restart completed investigation or verification unless later changes invalidated it.
{% endif %}

Read `AGENTS.md` and the applicable scoped instructions, load the repository-owned
`$agent-execution-policy`, and invoke `$implement` for this Subtask. These skills
are committed in this repository and do not require a Symphony skills installation.
Use `jira_rest` to reread the live Subtask, its native parent, relevant comments,
dependencies and approved references at start, resume and handoff. The Subtask
defines this contribution; its parent owns the accepted outcome and requirements.

Repository execution context:

- This repository owns the authenticated dashboard/app. Verify that the Subtask has exactly one recognized routing label, `route-frontend`, and its Deliverable belongs to `signapse-group/signapse-ui`. The producer's published OpenAPI owns the supported HTTP API contract, including consumer-facing business rules; Jira owns accepted requirements. For API work, read the repository's [API consumer policy](.agents/skills/agent-execution-policy/references/api-handoff.md). `docs/design/DESIGN.md` defines durable UI/UX rules.
- For any task with an approved UI reference attachment or link (such as a screenshot, Figma file, mockup, or video), inspect it before implementation and compare the rendered UI against it before handoff. Use the reference with `docs/design/DESIGN.md` as the visual contract; an inaccessible or materially ambiguous reference blocks the affected UI work and must be reported.
- Run the narrowest relevant Vitest, contract, or Playwright checks while implementing. For code, build, runtime configuration, or behavior changes, complete `pnpm test:quality`. Documentation-only changes require relevant content, link, and formatting checks.
- On the Symphony host, read `/opt/apps/symphony/runtime/README-fe-testing.md` and run `/opt/apps/symphony/runtime/run-fe-quality "$PWD"` for that quality gate. Run live integration only for an explicitly assigned operation, scope, and required inputs; auth transport reuse or a protected page alone is not a live gate. Follow the [runner scope and activation guide](docs/testing/browser-tests.md#runner-scopes-and-evidence); P0 fixtures do not prove real authentication or backend access.
- The `before_run` hook refreshes the workspace's ignored `.env.local` from `$SIGNAPSE_UI_APP_ENV`. Account credentials remain in the private file referenced by `$SIGNAPSE_UI_E2E_ENV`; never copy them into the workspace, application environment, logs, commits, or handoff evidence. Keep live integration checks read-only and report sanitized results.
- Inspect the current repository-required CI before delivery. GitHub Pages deployment is not PR quality CI. When the PR quality lane in `docs/adr/0004-layered-automated-quality-gates.md` is enabled, require a successful run for the delivered revision.
- Repository-file changes require a reviewed PR targeting the default branch; read-only investigation/report output does not require a PR. Include the Subtask key in the PR title for Jira Development-panel linking. Follow the repository-owned policy for the PR body and Jira delivery handoff comment.
- Repository maintainers and PR reviewers own merge acceptance. The coordinator owns Jira `Done` after review/checks, merge when required, and deployment/evidence when the deliverable requires them. Record pending human-owned delivery actions at `In Review`; a merge alone does not complete the Jira issue.
- Planning owns hierarchy, routing and acceptance in its [project execution workflow](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md). Symphony owns runtime selection, dependency admission, workspace scheduling and recovery. GitHub retains code, PRs and CI.
- Relevant sources: producer-published contracts, `app/[lang]`, `app/api`, `app/lib`, `components`, scoped `AGENTS.override.md` files, `docs/design/DESIGN.md`, `docs/adr`, and the [browser-testing scope matrix](docs/testing/browser-tests.md#selecting-checks-by-change-scope).
- Use Vietnamese for status and handoff communication. Preserve repository language in code and documentation, and maintain both supported dictionary locales for user-facing copy.

Subtask context (reread live before acting):

- Immutable ID: {{ issue.id }}
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- State: {{ issue.state }}
- URL: {{ issue.url }}
- Labels: {{ issue.labels }}
  {% if issue.native_ref %}
  {% if issue.native_ref.issue_type %}
- Type: {{ issue.native_ref.issue_type.name }} ({{ issue.native_ref.issue_type.id }})
  {% endif %}
  {% if issue.native_ref.parent %}
- Native parent: {{ issue.native_ref.parent.key }} ({{ issue.native_ref.parent.id }})
  {% endif %}
  {% endif %}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

This run authorizes the assigned implementation/investigation, verification,
scoped commits, branch push, PR creation/update when required, required CI follow-up,
and agent-owned comments on this Subtask. Under the repository-owned execution
policy, it also authorizes `Ready → Progress`, `Progress → In Review`, and
`Ready`/`Progress → Blocked` when the corresponding gates are met. Resolve current
transitions by destination status and reread remote state after an ambiguous write.

`Progress` polling resumes the same authorized operation, workspace, branch and
PR. Stop execution at `Open`, `In Review`, `Blocked` or `Done`. Coordinator-owned
Open → Ready, Blocked resume, Done and parent transitions remain with the coordinator.
Do not merge, deploy, change requirements or create additional tickets unless the
human explicitly authorizes that action for this run. `jira_rest` supplies Jira
operations; Git/PR operations require separately configured code-host access.
