# Browser and integration tests

The P0 lane is a secret-free, fixture-backed Chromium check for the highest-risk Signapse UI workflows. It runs the real Next.js application in non-production mode and points `API_BASE_URL` at the local fixture HTTP service, so Server Components and server actions use the same request boundary as the application.

Use [test ownership and selection](../../CONTRIBUTING.md#test-ownership-and-selection) for every FE phase. This file owns command/fixture mechanics, not additional gates. Live suite and host-activation details below are legacy references; FE does not run or extend live feature tests, and these scripts are not an accepted QA entrypoint.

## Commands

```text
pnpm test:browser       # run Chromium/Vietnamese browser journeys
pnpm test:browser:update # update selected native screenshot baselines; reviewer approval required
pnpm test:contract      # offline fixture operation consistency; no live API conformance claim
pnpm test:quality       # lightweight CI: lint, typecheck, Vitest, fixture guard, verifier unit tests
pnpm test:full          # explicit full regression: quality, build, browser suite
pnpm verify:deploy <sha> # confirm live dev revision and GitHub quality
pnpm test:integration   # legacy live suite reference; outside FE contribution gates
```

The Playwright config starts both local services and sets the P0-only process contract:

- `SIGNAPSE_AUTH_MODE=disabled`
- `SIGNAPSE_E2E_MODE=fixture`
- `NODE_ENV=development`
- `API_BASE_URL=http://127.0.0.1:4100`

The fixture mode is a stricter submode of the existing non-production dev-auth mode. It does not initialize Clerk middleware or the Clerk client provider, does not load analytics/insights, and never proves real authorization or external Telegram delivery.

Each test receives a unique `testRunId`. The browser context carries it through the cookie and request header; the fixture resets and namespaces mutable state by that ID. Requests without the ID, authenticated requests, unregistered routes, or unexpected external browser requests fail the P0 test.

The `delayed` HTTP and feedback `pending` scenarios hold responses until the test changes the matching scenario (normally to `success`). Assert the pending UI first, then change the scenario in `finally`; a wall-clock delay does not release it. Reset/teardown closes held responses. Successful SSE connections stay open until the client disconnects or the fixture resets; `reconnect` closes only the first connection deliberately.

## CI and delivery

[Verify](../../.github/workflows/verify.yml) runs lightweight checks on PRs into main and main pushes; the reviewer confirms the live dev revision from the workspace using the existing script under the [Review runbook](../runbooks/review-and-delivery.md#verify-the-delivered-build). Vercel owns builds; use [shared verification standards](../../CONTRIBUTING.md#verification) and [WORKFLOW](../../WORKFLOW.md) for assigned execution. [CI/Vercel setup](../delivery.md) remains an operator/technical reference. Owner/QA verifies the live website and features. The full fixture browser suite is available explicitly, not required for every PR. Fixture P0, deployment evidence and live feature acceptance remain separate evidence.

## Selecting checks by change scope

| Change                                                | Focused evidence                                                                  | Completion check                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Documentation only                                    | Check the edited content, links, and formatting.                                  | No application test lane is needed unless the documentation change affects a command or contract.              |
| UI behavior or presentation                           | Focused Vitest/component checks; select P0 browser cases only for behavior those checks cannot establish. Compare affected local render with design. | Lightweight CI and Vercel Preview build; reuse valid rendered evidence. No new screenshot-regression suite required per ticket. |
| API integration, schema, or server action             | Affected action/schema tests and fixture guard when routes change; local HTTP/browser fixture checks only when runtime behavior needs them. | Lightweight CI and Preview; retain producer OpenAPI/publication checks. Live feature acceptance goes to QA/coordinator. |
| Authentication, backend transport, or protected pages | Affected local auth/permission/action checks; select fixture browser cases only when needed for browser behavior. | Lightweight CI and Preview; fixtures do not prove live auth. Missing QA accounts/results alone do not block FE. |

CI owns the full lightweight gate; local work runs affected checks without repeating all CI checks. When selecting browser checks, record why they are needed and what they cover. Run `pnpm test:full` only under the shared selection rules. Select fixture browser cases with `pnpm test:browser <spec-path> --grep '<case-pattern>'`; these use Playwright selectors, not the legacy integration runner's `--scope`/`--case`. On Symphony, selected browser checks retain the host guide and wrapper/lock; verify the selected workspace tests are actually run. Fixture P0 success does not prove real auth/backend access.

## Scope and evidence

`dashboard-entry.spec.ts` checks locale-root redirects, application noindex
metadata and 404 responses for retired public articles, editor and dashboard
prototype pages. These fixture checks do not prove real authorization. The live
integration lane additionally checks anonymous redirects, login availability,
authenticated entry and logout with Clerk enabled.

The suite covers the application shell/workspace, canonical list URL/search/pagination/history behavior, Personal Notes save/retry/delete flows, Telegram configuration and Test message states, market-chart controls and SSE recovery, accessibility, and selected stable visual regions. Dynamic chart canvas pixels and full-page snapshots are intentionally excluded.

Explicit P0 browser runs retain traces, screenshots, videos, reports and logs under ignored `test-results/`; link required evidence from the run rather than claiming it was uploaded by CI. Verify uploads only the Vitest JUnit report for seven days. Live integration artifacts follow the stricter rules below.

P0 does not prove real authentication. QA/coordinator owns live feature coverage through
the existing QA workflow. The legacy smoke below documents its limited capability;
its presence does not establish approved QA coverage, migration or execution readiness.

## Runner scopes and evidence

The offline/public OpenAPI contract guard remains available to FE under
[API consumer standards](../api-consumer.md). The integration examples in this section
are legacy reference syntax, not FE execution instructions.

The contract and legacy integration runner is version 2. Full execution is the default; use
`--full` to make that choice explicit. Select contract operations by the exact
`METHOD /path` identity, comma-separated. Select browser cases by the exact
`tests/integration/file:line#[project] title` identity printed by `--list`;
cases without a named Playwright project use `[default]`.

```bash
pnpm test:contract -- --scope "GET /me,GET /me/notes"
pnpm test:contract -- --full
pnpm test:integration -- --version
pnpm test:integration -- --list
pnpm test:integration -- --scope "GET /me,GET /me/usage-limits" \
  --case "tests/integration/auth-and-backend.spec.ts:118#[authenticated-backend] password session reaches the backend, dashboard entry and account page"
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

Visual baseline changes are intentional test changes: run the update command narrowly, inspect the diff, and obtain reviewer approval. A feature or bug fix that changes an interactive state uses the narrowest effective local layer under the shared selection rules rather than broadening snapshots or adding FE live tests.

## Live password and backend integration

**Legacy/reference only from 2026-10-28.** Retain the suite, safeguards and setup below;
do not execute or extend it in FE Survey/Implement/Review. It has not been migrated to QA.
The account-free public OpenAPI check documented below remains a consumer contract check.

`playwright.integration.config.ts` runs a local Next.js server with Clerk auth enabled and the
public HTTPS backend from `API_BASE_URL`. It uses a separate test directory and never loads
the P0 fixture config. The historical setup required an explicitly assigned live operation
with its scope and inputs. It is a read-only development smoke, not the full release canary in ADR 0004; it
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
the [API consumer standards](../api-consumer.md).

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
the existing host browser wrapper when P0 checks are explicitly selected; it shares
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

**Historical live-runner activation reference.** This procedure is not required by the
FE test-policy update and does not authorize live testing or QA adoption. Policy rollout
uses [worker activation](../delivery.md#worker-activation), preserving the selected
fixture browser wrapper/lock; it does not require changing this legacy live wrapper.

This host change belonged to the coordinator after the reviewed PR was merged. The
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
