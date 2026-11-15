{% assign state = issue.state | strip | downcase %}

You are executing Jira Subtask `{{ issue.identifier }}` in `signapse-group/signapse-ui`.
Feature/fix work starts from current origin/dev and targets dev. Promotion to main and product production deployment are outside this worker profile.
Read [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), applicable scoped instructions and the selected runbook from this checkout. Resolve local links here and use the repository skills under `.agents/skills` when the task needs them.

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

Retain the live Jira `dependencies` envelope and apply the [dependency contract](https://github.com/signapse-group/signapse-symphony/blob/main/elixir/README.md#jira-dependency-contract). Planning policy links are maintainer provenance, not execution prerequisites; live assignment design/ADR/API references remain required when relevant. Do not fetch Planning policy to manufacture an additional admission gate. If a required local source is missing, report deployment drift and stop the affected phase instead of searching legacy checkouts or backups for substitute policy.

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
