{% assign state = issue.state | strip | downcase %}
{% assign route_count = 0 %}
{% assign frontend_route = false %}
{% for raw_label in issue.labels %}
{% assign label = raw_label | strip | downcase %}
{% case label %}
{% when "route-frontend" %}
{% assign route_count = route_count | plus: 1 %}
{% assign frontend_route = true %}
{% when "route-backend", "route-quality-assurance", "route-mdg", "route-landing" %}
{% assign route_count = route_count | plus: 1 %}
{% endcase %}
{% endfor %}

Assigned FE context for `signapse-group/signapse-ui`.

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

{% if frontend_route and route_count == 1 %}
{% if state == "ready" or state == "progress" or state == "in review" %}
Confirm the live assignment is a native Jira `SIGN` Subtask under a Story, Task or Bug, with exactly one recognized route `route-frontend` and output owned by `signapse-group/signapse-ui`. Business labels may coexist. Feature/fix work starts from current `origin/dev`, targets `dev` and delivers to `https://dev-dashboard.signapse.cloud`.

Read [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), applicable scoped instructions and the selected skill from this checkout. Retain the live Jira `dependencies` envelope and apply the [dependency contract](CONTRIBUTING.md#reading-jira-dependencies). Use live design, ADR and API references required for the assigned output. Treat Planning policy links as optional maintainer provenance. For a missing required local source, identify the affected output, report deployment drift, complete independent work within the grant and apply the [local blocker gate](CONTRIBUTING.md#blockers-and-resume).

The coordinator owns scope, priority, new tickets, initial dispatch (Open → Ready), Blocked resume, parent/QA/Bug lifecycle and acceptance. Business, design and API decisions remain with their owners. Direct and no-PR work follow their own grant. Infrastructure, secrets, DNS, indexing, rollback, live feature testing, promotion to `main` and product production deployment are outside this profile.
{% endif %}

{% if state == "ready" %}
## Phase: Survey

Grant: Read contract, code, design and API sources and run targeted existing checks on isolated local data. Clarify accepted wording or references in the assigned Subtask body, save an owned survey or blocker comment when needed, and transition Ready → Progress/Blocked when the skill's gates pass. Versioned edits, commits, pushes, PRs, merge, deploy and shared-environment effects are outside Ready.

Invoke [survey-frontend](.agents/skills/survey-frontend/SKILL.md).

{% elsif state == "progress" %}
## Phase: Implement

Grant: Make scoped edits and checks, commit and push the contribution, open or update its PR into `dev`, follow up CI and save owned handoff or blocker records when needed. Transition Progress → In Review/Blocked when the skill's gates pass. Independent review starts in the fresh In Review session, which also owns merge, delivery and Done.

Invoke [implement](.agents/skills/implement/SKILL.md).

{% elsif state == "in review" %}
## Phase: Review

Grant: Independently assess the candidate in this session, save owned feedback, handoff or blocker records, merge the assigned PR into `dev`, and perform bounded delivery recovery. Transition In Review → Progress/Blocked/Done when the skill's gates pass. Return implementation fixes and conflicts to Progress.

Invoke [code-review](.agents/skills/code-review/SKILL.md).

{% else %}
## Phase: Stop

Snapshot state {{ issue.state }} is outside the granted phases. Stop autonomous work;
do not transition Ready/Progress to manufacture eligibility.
{% endif %}
{% else %}
## Phase: Stop

The snapshot is missing a valid exclusive FE route. Stop autonomous work and report the route mismatch to the coordinator. Label and status changes are outside this grant.
{% endif %}
