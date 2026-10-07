# Browser and integration tests

The P0 lane is a secret-free, fixture-backed Chromium check for the highest-risk Signapse UI workflows. It runs the real Next.js application in non-production mode and points `API_BASE_URL` at the local fixture HTTP service, so Server Components and server actions use the same request boundary as the application.

## Commands

```text
pnpm test:browser       # run Chromium/Vietnamese browser journeys
pnpm test:browser:update # update selected native screenshot baselines; reviewer approval required
pnpm test:contract      # offline fixture operation consistency; no live API conformance claim
pnpm test:quality       # lint, typecheck, Vitest, fixture guard, build, and browser suite
pnpm test:integration   # live OpenAPI preflight, password auth and dev backend; requires private credentials
```

The Playwright config starts both local services and sets the P0-only process contract:

- `SIGNAPSE_AUTH_MODE=disabled`
- `SIGNAPSE_E2E_MODE=fixture`
- `NODE_ENV=development`
- `API_BASE_URL=http://127.0.0.1:4100`

The fixture mode is a stricter submode of the existing non-production dev-auth mode. It does not initialize Clerk middleware or the Clerk client provider, does not load analytics/insights, and never proves real authorization or external Telegram delivery.

Each test receives a unique `testRunId`. The browser context carries it through the cookie and request header; the fixture resets and namespaces mutable state by that ID. Requests without the ID, authenticated requests, unregistered routes, or unexpected external browser requests fail the P0 test.

## Selecting checks by change scope

| Change                                                | Focused evidence                                                                  | Completion check                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Documentation only                                    | Check the edited content, links, and formatting.                                  | No application test lane is needed unless the documentation change affects a command or contract.              |
| UI behavior or presentation                           | Run the focused Vitest/component test and the narrowest relevant P0 browser spec. | Run `pnpm test:quality` for code or runtime changes. Review any screenshot diff before updating a baseline.    |
| API integration, schema, or server action             | Run the action/schema tests and `pnpm test:contract` when fixture routes change.  | Run `pnpm test:quality`; run live integration only when the assigned operation names its scope and inputs.     |
| Authentication, backend transport, or protected pages | Run the relevant fixture checks for deterministic UI behavior.                    | Run `pnpm test:quality`. A protected page or reused authenticated transport alone does not require live smoke. |

On Symphony, read `/opt/apps/symphony/runtime/README-fe-testing.md` and use `/opt/apps/symphony/runtime/run-fe-quality "$PWD"` for the quality gate. Use the live wrapper only for an explicitly assigned operation, scope, and inputs, and verify it reports the expected workspace suite revision after coordinator activation. Both lanes share the host lock. Fixture-backed P0 success proves frontend behavior only; it does not prove authentication or public backend access.

## Scope and evidence

`dashboard-entry.spec.ts` checks locale-root redirects, application noindex
metadata and 404 responses for retired public articles, editor and dashboard
prototype pages. These fixture checks do not prove real authorization. The live
integration lane additionally checks anonymous redirects, login availability,
authenticated entry and logout with Clerk enabled.

The suite covers the application shell/workspace, canonical list URL/search/pagination/history behavior, Personal Notes save/retry/delete flows, Telegram configuration and Test message states, market-chart controls and SSE recovery, accessibility, and selected stable visual regions. Dynamic chart canvas pixels and full-page snapshots are intentionally excluded.

Failed P0 browser runs retain Playwright traces, screenshots, videos, HTML reports, fixture state, and application/fixture logs under the ignored `test-results/`. A configured P0 CI lane may upload that directory on failure without protected credentials. Live integration artifacts follow the stricter rules below.

P0 does not prove real authentication. The live integration smoke below verifies password
authentication and backend access. The broader disposable-environment permission matrix,
cross-browser release coverage, and Telegram delivery canary remain separate work.

## Runner scopes and evidence

The contract and integration runner is version 2. Full execution is the default; use
`--full` to make that choice explicit. Select contract operations by the exact
`METHOD /path` identity, comma-separated. Select browser cases by the exact
`tests/integration/file:line#title` identity printed by `--list`.

```bash
pnpm test:contract -- --scope "GET /me,GET /me/notes"
pnpm test:contract -- --full
pnpm test:integration -- --version
pnpm test:integration -- --list
pnpm test:integration -- --scope "GET /me,GET /me/usage-limits" \
  --case "tests/integration/auth-and-backend.spec.ts:118#password session reaches the backend, dashboard entry and account page"
pnpm test:integration -- --full
```

Contract scope changes only the offline/live OpenAPI operation checks. Case scope
changes only which discovered Playwright cases run. With only `--scope`, the browser
suite remains full; with only `--case`, the OpenAPI preflight remains full. Combine
them when both parts have a complete narrow scope. Select every operation and case
that covers behavior affected by the change; use full mode when that coverage is
unclear. Empty, malformed, duplicate, unknown, or no-match selectors fail before the
live preflight. Selectors cannot change auth mode, environment, Playwright config,
reporters, traces, screenshots, video, or artifact paths. The authenticated Clerk
setup case remains included when browser cases are selected.

`--version` prints the runner version without reading private files. `--list` discovers
cases from the current workspace suite using test-only placeholder inputs; it does not
fetch OpenAPI, launch the app, authenticate, or run a browser test. Discovery output is
not live evidence. Execution output records runner version, application revision,
suite revision, clean/dirty worktree state, and selected operation/case scope. Record
both revisions in handoff evidence; they can differ when an external wrapper invokes a
separate suite checkout.

The workspace's `tests/integration/run.mjs` and `playwright.integration.config.ts` are
the canonical suite entrypoints. On the Symphony host, the wrapper must invoke that
entrypoint from the workspace under test; it must not force the suite from the stable
runtime checkout. The coordinator performs this wrapper activation after merge. See
[Coordinator activation and rollback](#coordinator-activation-and-rollback).

Visual baseline changes are intentional test changes: run the update command narrowly, inspect the diff, and obtain reviewer approval. A feature or bug fix that changes an interactive state should add the narrowest effective test layer (unit, component, browser, or P1 integration) rather than broadening snapshots.

## Live password and backend integration

`playwright.integration.config.ts` runs a local Next.js server with Clerk auth enabled and the
public HTTPS backend from `API_BASE_URL`. It uses a separate test directory and never loads
the P0 fixture config. Run it only for an explicitly assigned live operation with its scope
and inputs. It is a read-only development smoke, not the full release canary in ADR 0004; it
sends no Telegram message and changes no application data.

After environment validation, the runner fetches `/v3/api-docs` from that backend
and compares fixture operation paths, methods and declared response statuses with
the published OpenAPI. By default it checks every registered operation; `--scope`
checks only the exact selected operations. The selected preflight must pass before
browser integration starts. `--list` only discovers tests from the current workspace
suite with placeholder inputs; it performs no live fetch. Unavailable/invalid contracts
or in-scope mismatches fail without a local fallback. Source/time and discrepancies
are reported separately from P0. This is a structural check; schemas, business
semantics, authorization and delivered revision still need applicable evidence under
the [API consumer policy](../../.agents/skills/agent-execution-policy/references/api-handoff.md).

The same public contract check can run without account credentials:

```bash
API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --live
```

Its success does not prove password authentication, feature acceptance or full API
conformance. P0 keeps using fixture inputs and never fetches OpenAPI from the network.

Use Node 24 or later. Store two files outside the checkout, with owner-only access:

| File                                      | Required variables                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Application file, based on `.env.example` | `API_BASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Account file, based on `.env.e2e.example` | `E2E_USER_IDENTIFIER`, `E2E_USER_PASSWORD`; optional `E2E_BASE_URL`     |

The account must belong to the same Clerk development instance as the keys. Email/password
authentication must be enabled. Password sign-in handles first factor only; an account requiring
MFA cannot pass this smoke. Do not replace password auth with a server-created sign-in ticket.

```bash
export SIGNAPSE_UI_APP_ENV=/absolute/private/path/app.env
export SIGNAPSE_UI_E2E_ENV=/absolute/private/path/e2e.env
pnpm test:integration -- --full
```

The runner parses the referenced files as data. Process environment overrides the corresponding
file values. Protected CI may supply those same variables directly instead of using files.
`CLERK_PUBLISHABLE_KEY` for the testing helper is derived from Next's publishable key. Passwords
containing spaces, `#`, or `$` should be quoted in the account file; they are never sourced by a shell.

`E2E_BASE_URL` defaults to `http://localhost:3110` and must refer to a local HTTP port from
1024 to 65535. The runner starts a fresh server and refuses to reuse an existing process on that
port. Loopback input `127.0.0.1` is normalized to `localhost` for Clerk/Next rewrite handling.
`API_BASE_URL` must use a public HTTPS domain; localhost and IP literals are rejected.
Clerk live keys, disabled auth, fixture mode, unreadable files, and missing variables fail before
test execution. Next.js receives only the application variables and a runtime allowlist; it does
not receive the account password, testing token, or tracker credentials.

The smoke obtains a Clerk Testing Token to handle bot detection, signs in with the supplied
password, checks FE `/api/user`, gets the session's `signapse` JWT, verifies BE `/me` accepts
the token and rejects anonymous access, and loads the real FE account page backed by `/me`.
Traces, video, screenshots, and saved auth state are disabled. The launcher redacts passwords,
Clerk secrets, and JWTs from text output. Inspect any separately collected artifacts before sharing.

On Symphony, application/account files are centrally managed by the operator. The `before_run`
hook snapshots the application file to each workspace's ignored `.env.local`. `--version` and
`--list` do not read those files. A live execution uses:

```bash
/opt/apps/symphony/runtime/run-fe-integration "$PWD"
```

After coordinator activation, the host wrapper validates runner version 2 and invokes
`$PWD/tests/integration/run.mjs`; the stable runtime checkout supplies the consumed workflow,
not the test suite. Config, reporters, and artifact settings remain fixed. Use
`/opt/apps/symphony/runtime/run-fe-quality "$PWD"` for the quality gate on Symphony; it shares
the integration lock so P0/P1 Next and browser processes do not compete for host memory.
`SIGNAPSE_UI_INTEGRATION_LOCK` selects the host-wide `flock` file, serializing account and
local-port use; the lock stays held until Playwright and its Next server exit. The lock file is
not deleted between runs. Other environments must serialize runs sharing an account and port,
for example with CI concurrency controls.

Keep `.env.local`, account files, test results, and `playwright/.auth` outside Git. The previously
tracked `.env` is removed from the current revision. Deleting the file does not remove it from
repository history; key rotation is a separate operator decision and requires updating consumers.

See [Clerk password helpers](https://clerk.com/docs/guides/development/testing/playwright/test-helpers)
and [Clerk Playwright setup](https://clerk.com/docs/guides/development/testing/playwright/overview).

## Coordinator activation and rollback

This host change belongs to the coordinator after the reviewed PR is merged. The
implementation agent updates only repository files. Use the runtime's existing
checkout/activation procedure from `/opt/apps/symphony/runtime/README-fe-testing.md`;
never edit the service checkout or wrapper as part of local handoff.

Before activation, record the merged commit SHA, the current
`runtime/repos/signapse-ui` revision, and the current wrapper's checksum, owner, and
mode. Confirm the consuming checkout is clean before updating it through the existing
runtime procedure. Verify its `WORKFLOW.md` and runner are at the merged revision, and
confirm the runner reports `signapse-fe-integration/2`.

Update `/opt/apps/symphony/runtime/run-fe-integration` so its final dispatch uses the
test runner from the workspace argument after the existing workspace containment and
runtime setup checks:

```sh
runner="$workspace_dir/tests/integration/run.mjs"
runner_version=$(node "$runner" --version)
if [ "$runner_version" != "signapse-fe-integration/2" ]; then
  echo "Workspace integration runner v2 is required." >&2
  exit 1
fi
cd "$workspace_dir"
exec node "$runner" "$@"
```

Keep the existing private app/account env paths, owner-only umask, runtime `PATH`,
temporary/library/font settings, workspace-root guard, shared lock path, and argument
allowlist. The runner owns lock acquisition and credential redaction. Do not dispatch
to `runtime/repos/signapse-ui/tests/integration/run.mjs`; that path uses the stable
checkout's suite and can miss tests added in an issue workspace.

Before enabling live use, check the wrapper with `sh -n`, then run its `--version` and
`--list` forms against a clean, installed workspace at the expected revision. Verify
the output's application and suite revisions, both clean states, and the expected new
case. This is source/discovery evidence only. Check the current workflow consumer using
the runtime's deployment procedure, and retain its source revision evidence. Use live
checks only for separately assigned read-only operations with their required inputs.

For rollback, stop using the wrapper for new executions, restore the exact saved wrapper
and its recorded owner/mode, and return the consuming checkout to its recorded prior
revision through the runtime's existing procedure. Do not reset or clean issue
workspaces. Verify the restored wrapper checksum and shell syntax, then confirm the
consumer reports the prior workflow source. Preserve private env files, lock files,
logs, and account artifacts throughout activation and rollback.
