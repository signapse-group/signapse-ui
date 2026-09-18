---
status: accepted
---

# Adopt layered automated quality gates

Signapse will use GitHub Actions to make deterministic Vitest coverage and Chromium browser journeys against a resettable fixture backend required for every pull request. A separate disposable Clerk test instance and backend test environment will run permission checks, selected visual assertions, Firefox/WebKit coverage, and a Telegram Test message canary nightly and before release; this keeps merge feedback isolated and fast without treating mock-mode success as proof of authorization or external delivery. PR authors remediate failures, a required reviewer approves intentional visual changes, and the release owner handles failed canaries.

## Consequences

- Test traffic and data must never target development or production systems.
- P0 is delivered within Signapse UI as a secret-free PR lane; P1 is a cross-system dependency for the disposable backend, Clerk tenant, and external canary.
- P0 exposes a runnable browser-test command to agents and developers; the separate P1 command fails closed with a clear missing-environment error rather than silently skipping integration coverage.
- Future work is split into a P0 UI/browser-test foundation task followed by a P1 authenticated-quality-canary task.
- A browser fixture backend is required because server-rendered actions call the backend independently of browser request interception.
- Fixture behavior is contract-first: backend OpenAPI is canonical, with `docs/APIMAPPING.md` as the UI ledger, and contract drift must fail rather than silently diverge.
- The required PR journeys cover the app shell/workspace, a canonical list, Personal Notes, Telegram configuration and scheduled asset analysis, market-chart controls/SSE, and representative destructive and failure states; they do not duplicate authentication integration checks.
- Authorization tests use anonymous, denied, Telegram reader, and Telegram operator capability personas rather than backend role names.
- Chromium desktop and Vietnamese run on each PR; mobile Chromium, Firefox, WebKit, English, and selected visual assertions run nightly and before release.
- Fixture and integration state must be namespaced and reset idempotently so parallel tests cannot share mutable data.
- The backend test environment exposes network-restricted, test-only seed and reset operations keyed by `testRunId`; direct database access and manually shared test state are excluded.
- A Telegram Test message is an isolated external canary, not a per-PR side effect.
- The initial Test message canary succeeds only when the P1 backend test environment records a traceable Telegram-accepted delivery audit; it does not claim that a recipient read the message.
- The canary runs through the Telegram operator browser workflow before it reads the test-only delivery audit; it therefore covers UI, authorization, server action, backend, and Telegram acceptance together.
- The normal Test message endpoint remains `204 No Content`. A network-restricted test-only delivery-audit query, keyed by `testRunId`, reports destination, operation, timestamp, and `TELEGRAM_ACCEPTED`, `FAILED`, or `UNKNOWN` status; only `TELEGRAM_ACCEPTED` passes the canary.
- The completed Test message restoration task must be merged before test automation treats that behavior as the current contract.
- All test data is synthetic. Clerk, backend, and Telegram credentials are protected GitHub Environment secrets and are unavailable to fork pull requests.
- A designated release/provisioning owner configures external test resources and protected GitHub settings; repository automation must not create or expose credentials.
- A failed PR lane blocks merge. A failed pre-release canary blocks release unless the release owner records a third-party-outage waiver; nightly failures alert that owner.
- Axe serious or critical violations block the P0 journeys, while keyboard and focus assertions cover dialogs and sheets. Stable native Playwright screenshot baselines are committed and require reviewer approval when intentionally changed.
- Existing routes are backfilled by risk when changed or after a regression; every new feature or bug fix adds the test layer appropriate to its risk.
