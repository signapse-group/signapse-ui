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

{% assign state = issue.state | strip | downcase %}

You are executing Jira Subtask `{{ issue.identifier }}` in `signapse-group/signapse-ui`.
Read `AGENTS.md`, applicable scoped instructions and `$agent-execution-policy`.
Only execute the native SIGN dev-with-PR Subtask profile: valid parent, exactly one
recognized route `route-frontend`, output owned here, PR into `main`, delivery to `dev.signapse.cloud`.
Direct/no-PR operations retain their separately assigned boundary; stop and report
an out-of-profile assignment rather than inventing a PR or extending this grant.
Read live Subtask/parent/accepted decisions/references/native dependencies through
`jira_rest` at start/resume and before mutations/handoff; snapshot below is not live authority.
Repository-owned skills need no Symphony skill-package installation.

Follow AGENTS for Next.js checks and scoped UI/design rules; API work reads the
API consumer policy. Symphony quality/browser checks use the host testing guide
and run-fe-quality wrapper; private live inputs remain external.


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
- Follow-up attempt #{{ attempt }}; retain workspace/branch/PR/output and reread remote state.
{% endif %}

Description:
{% if issue.description and issue.description != "" %}
{{ issue.description }}
{% else %}
Read the missing contract live before dependent work.
{% endif %}

Only execute the phase below. A live phase change ends this session for a fresh
Symphony prompt, preserving workspace/PR/evidence. Ready → Progress ends survey;
do not implement in that session. Open/Blocked/Done or changed route/ownership stops work.
Preserve concurrent content; only edit owned records. Read back ambiguous writes
before retry, saved required feedback/handoff before transition and status afterwards.
Coordinator retains scope, initial dispatch, Blocked resume, parent/QA lifecycle and
acceptance; new tickets, requirement changes, infra/secrets and rollback are outside this grant.

{% if state == "ready" %}
## Phase: Survey

Apply [Khảo sát → Implement](.agents/skills/agent-execution-policy/references/execution-policy.md#khảo-sát--implement).
Read contract/code/design/API and run targeted existing checks on isolated local data.
Only clarify accepted wording/references in the assigned Subtask body without
changing scope/AC/meaning/parent; reread concurrent content and save/read back additions.
Survey comments are conditional. No versioned source/test/config edits, commits,
push/PR, merge/deploy or shared-environment effects; do not use $implement.
At the survey gate transition/read back Ready → Progress, end this session; a fresh
Implement session follows. Ready → Blocked only for a genuine external blocker.

{% elsif state == "progress" %}
## Phase: Implement

Use $implement, consume survey/feedback and reconcile existing output; do not reset Ready.
Grant: scoped edits/checks/commits/push/PR, CI follow-up and own conditional handoff.
Apply [Implement → Review](.agents/skills/agent-execution-policy/references/execution-policy.md#implement--review)
and [PR gate](docs/delivery.md#review-evidence-and-pr-gate).
Local checks/current-head required PR CI precede Progress → In Review/read-back;
end Implement there. Do not require a pre-reviewer or wait for this revision's deploy.
Progress → Blocked only under the external-blocker gate. Review/merge/Done belong
to the fresh In Review session.

{% elsif state == "in review" %}
## Phase: Review

Use $code-review directly as the fresh independent reviewer; do not spawn a replacement
reviewer, edit implementation or resolve conflicts. Report both review axes and
blocking/nonblocking findings from contract/code/checks. Follow [review feedback](.agents/skills/agent-execution-policy/references/execution-policy.md#review--implement-sửa).
Grant: own feedback/handoff, merge this Subtask's PR into main, bounded delivery
recovery to dev.signapse.cloud and In Review → Progress/Blocked/Done under the gates.
Apply [delivery runbook](docs/delivery.md), including current-head PR CI, live build
containing the merge, basic app loading, bounded same-turn wait and saved delivery.
Already merged means reconcile and resume delivery, not merge again. Findings/conflicts
return Progress; optional suggestions do not block. Missing required evidence is not Pass.
Live feature checks require explicit operation/inputs; QA/parent acceptance remains separate.

{% else %}
## Phase: Stop

Snapshot state {{ issue.state }} is outside the granted phases. Stop autonomous work;
do not transition Ready/Progress to manufacture eligibility.
{% endif %}
