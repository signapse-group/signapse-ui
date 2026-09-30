# Browser and integration tests

The P0 lane is a secret-free, fixture-backed Chromium check for the highest-risk Signapse UI workflows. It runs the real Next.js application in non-production mode and points `API_BASE_URL` at the local fixture HTTP service, so Server Components and server actions use the same request boundary as the application.

## Commands

```text
pnpm test:browser       # run Chromium/Vietnamese browser journeys
pnpm test:browser:update # update selected native screenshot baselines; reviewer approval required
pnpm test:contract      # verify fixture routes against docs/APIMAPPING.md
pnpm test:quality       # lint, typecheck, Vitest, contract guard, build, and browser suite
pnpm test:integration   # real password auth and public dev backend; requires private credentials
```

The Playwright config starts both local services and sets the P0-only process contract:

- `SIGNAPSE_AUTH_MODE=disabled`
- `SIGNAPSE_E2E_MODE=fixture`
- `NODE_ENV=development`
- `API_BASE_URL=http://127.0.0.1:4100`

The fixture mode is a stricter submode of the existing non-production dev-auth mode. It does not initialize Clerk middleware or the Clerk client provider, does not load analytics/insights, and never proves real authorization or external Telegram delivery.

Each test receives a unique `testRunId`. The browser context carries it through the cookie and request header; the fixture resets and namespaces mutable state by that ID. Requests without the ID, authenticated requests, unregistered routes, or unexpected external browser requests fail the P0 test.

## Scope and evidence

The suite covers the application shell/workspace, canonical list URL/search/pagination/history behavior, Personal Notes save/retry/delete flows, Telegram configuration and Test message states, market-chart controls and SSE recovery, accessibility, and selected stable visual regions. Dynamic chart canvas pixels and full-page snapshots are intentionally excluded.

Failed P0 browser runs retain Playwright traces, screenshots, videos, HTML reports, fixture state, and application/fixture logs under the ignored `test-results/`. A configured P0 CI lane may upload that directory on failure without protected credentials. Live integration artifacts follow the stricter rules below.

P0 does not prove real authentication. The live integration smoke below verifies password
authentication and backend access. The broader disposable-environment permission matrix,
cross-browser release coverage, and Telegram delivery canary remain separate work.

Visual baseline changes are intentional test changes: run the update command narrowly, inspect the diff, and obtain reviewer approval. A feature or bug fix that changes an interactive state should add the narrowest effective test layer (unit, component, browser, or P1 integration) rather than broadening snapshots.

## Live password and backend integration

`playwright.integration.config.ts` runs a local Next.js server with Clerk auth enabled and the
public HTTPS backend from `API_BASE_URL`. It uses a separate test directory and never loads
the P0 fixture config. This is an operator-authorized, read-only development smoke; it is not
the full release canary in ADR 0004. It sends no Telegram message and changes no application data.

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
pnpm test:integration
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
hook snapshots the application file to each workspace's ignored `.env.local`. Run:

```bash
/opt/apps/symphony/runtime/run-fe-integration "$PWD"
```

The launcher accepts `--list` for discovery; config, reporters, and artifact settings cannot be overridden.
Use `/opt/apps/symphony/runtime/run-fe-quality "$PWD"` for the quality gate on Symphony;
it shares the integration lock so P0/P1 Next and browser processes do not compete for host memory.
The shared deployed suite tests the caller's installed workspace, including older clones whose
`test:integration` command is still the former placeholder. `SIGNAPSE_UI_INTEGRATION_LOCK`
selects a host-wide `flock` file, serializing account and local-port use; the lock stays held until
Playwright and its Next server exit. The lock file is not deleted between runs. Other environments
must serialize runs sharing an account and port, for example with CI concurrency controls.

Keep `.env.local`, account files, test results, and `playwright/.auth` outside Git. The previously
tracked `.env` is removed from the current revision. Deleting the file does not remove it from
repository history; key rotation is a separate operator decision and requires updating consumers.

See [Clerk password helpers](https://clerk.com/docs/guides/development/testing/playwright/test-helpers)
and [Clerk Playwright setup](https://clerk.com/docs/guides/development/testing/playwright/overview).
