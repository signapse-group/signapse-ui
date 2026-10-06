# Symphony workflow configuration

Use this reference whenever `$setup-workflow` configures a consuming repository. Invocation of that
skill already establishes that the repository will be run by Symphony.

`WORKFLOW.md` has YAML front matter for Symphony runtime configuration and a Markdown/Liquid body
used as the agent prompt. Derive repository-owned values from the target repository and tracker;
inherit deployment-owned values from the deployed Symphony profile. Consult the installed Symphony
version's documentation or existing valid configuration for supported fields; do not assume one
provider's schema applies to another.

The repository onboarding must establish:

- tracker kind, provider scope, required labels when used, and dispatch/active/terminal states;
- clone/bootstrap hooks needed to produce a usable repository workspace;
- the prompt and repository lifecycle boundary.

The deployed Symphony profile establishes workspace root, polling, concurrency and turn limits,
Codex command and model, approval policy, sandbox/network settings, credentials, and available host
tools. Copy or preserve these values when the workflow format requires them; do not make them new
repository onboarding decisions.

Keep tokens and secrets in environment variables or an existing external credential helper. Clone includes the committed repository-owned skills; no shared Symphony skills installation is required.

Treat `workspace.root` as a deployment-level location for per-issue workspaces. Inspect the
Symphony service environment or deployment configuration for its established value. Prefer an
environment-backed reference such as `$SYMPHONY_WORKSPACE_ROOT` in the workflow, and preserve that
reference when it already exists; do not replace it with a machine-specific absolute path or ask
the repository user to provide the resolved path again. Apply the same inheritance rule to polling,
concurrency, turn limits, Codex command/model, approval, and sandbox settings. When no deployed
profile is accessible, omit absent optional settings so the installed runtime uses its supported
defaults, and report that deployment compatibility remains unverified.

Derive ordinary bootstrap commands from the repository. For example, a committed `pnpm-lock.yaml`
supports `pnpm install --frozen-lockfile` without a separate permission question. Ask only when the
bootstrap would require credentials, destructive host changes, or a material choice the repository
does not settle. Repository requirements such as Node, pnpm, browser binaries, or system libraries
are inputs to the deployment; host installation remains outside `$setup-workflow`.

## Routed Jira configuration and prompt

Use this repository's [WORKFLOW.md](../../../../WORKFLOW.md) as the current FE
profile/prompt, checked against the installed runtime's [Jira guide](https://github.com/signapse-group/signapse-symphony/blob/main/elixir/README.md#routed-jira-subtask-workflows).
Planning's [execution workflow](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md)
owns the accepted routing map and native lifecycle.

- `tracker.kind` selects Jira; provider `base_url`, `email`, `api_token` accept host
  environment references. Provider `project_key` scopes all reads.
- `provider.issue_types` selects native Subtasks. `provider.routing_labels` carries
  the full recognized route set; `required_labels` identifies this worker's single
  route. Runtime verifies native type/parent and rejects conflicting/missing routes.
- Ready and Progress are dispatch/active states. Progress polling recovers already
  authorized output; In Review and Blocked stay idle, Done is terminal.
- Routed dependency admission checks native Blocks links and blocker category done
  before starting/retrying Ready or Progress work; it does not interrupt an already
  running worker merely because a dependency changes.
- The prompt includes ID/key/type/parent plus title/state/URL/labels/description,
  reads live contracts/comments through jira_rest and loads local execution skills.
  It states permissions through In Review; coordinator retains approval/resume/Done
  and parent acceptance. Git/PR tooling is provisioned separately.

Keep behavior details in [execution policy](../../agent-execution-policy/references/execution-policy.md).
Jira key in PR title links to Development panel; delivery evidence goes in one
agent-owned Jira handoff comment. Review/build, merge when required and deployment/
evidence when applicable define the coordinator's Done gate.

Before writing, check these invariants:

- dispatch states select only work that is ready for autonomous implementation;
- active states keep intended continuation attempts running and exclude human-wait states;
- terminal states cannot be redispatched;
- the prompt's authorized state transitions match the tracker configuration and verified repository delivery condition;
- the review handoff state is a non-terminal human-owned boundary and is excluded from
  `active_states` when Symphony should stop there;
- the prompt reads repository/scoped instructions and points to committed local policy/skills;
- the resulting YAML parses and contains no unresolved placeholder in a required runtime field.

Validate configuration and strict Liquid rendering offline with the supported runtime;
this check must not start polling, run clone hooks or send live tracker writes.
From the Symphony Elixir project, run the committed consumer check against the
current UI workflow (supply absolute paths):

```bash
mix run --no-start /path/to/signapse-ui/scripts/check-symphony-workflow.exs /path/to/signapse-ui/WORKFLOW.md
```

The check uses fixture credentials and the runtime's actual YAML, config, Jira
normalization and strict Liquid implementation; it refuses a started application.
Before activation, the operator verifies installed revision, credentials/tools,
workspace separation and prior-worker drain/reconciliation; the coordinator assigns
the canary explicitly. Configuration maintenance alone does not perform that cutover.
