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
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-6-luna"' --config model_reasoning_effort=max app-server
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

Read repository instructions if present, load `$agent-execution-policy`, and invoke `$implement` for this work item.
The work item is the accepted implementation contract for this unattended run.

Repository execution context:

- This repository is the Signapse Next.js frontend. The assigned GitHub issue is the implementation contract. The live backend OpenAPI contract is canonical for API behavior; `docs/APIMAPPING.md` is the frontend mapping ledger, and `docs/design/DESIGN.md` defines durable UI/UX rules.
- Run the narrowest relevant Vitest, contract, or Playwright checks while implementing. For code, build, runtime configuration, or behavior changes, complete `pnpm test:quality`. Documentation-only changes require relevant content, link, and formatting checks.
- No repository PR quality workflow or protected required check is currently configured. The GitHub Pages deployment workflow is not code-quality CI. When the PR quality lane in `docs/adr/0004-layered-automated-quality-gates.md` is enabled, require a successful run for the delivered revision.
- A maintainer-reviewed merge into the default branch completes the issue; the Project's `Item closed` workflow moves it to `Done`. Product, preview, cutover, and deployment acceptance remain with their human owners and do not delay issue completion.
- Repository maintainers and PR reviewers own review and merge acceptance. The Signapse Product Owner or designated release owner owns documented product, preview, cutover, or deployment acceptance.
- Relevant sources: `app/[lang]`, `app/api`, `app/lib`, `components`, scoped `AGENTS.override.md` files, `docs/APIMAPPING.md`, `docs/design/DESIGN.md`, `docs/adr`, and `docs/testing/browser-tests.md`.
- Use Vietnamese for status and handoff communication. Preserve repository language in code and documentation, and maintain both supported dictionary locales for user-facing copy.

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
`In progress` to `In review` after the shared policy's handoff requirements are met, or
from an active state to `Blocked` when the shared policy's blocker conditions are met. Continue
from the existing workspace and pull request on later attempts.

Do not merge, deploy, move the item to `Done`, change product requirements, or create additional work
items unless the human explicitly authorizes that action for this run. Stop at the `In review` handoff,
`Done`, or a genuine external blocker with no meaningful independent work remaining.
