# API consumer standards

Apply this reference to API integration, contract-sensitive design/review and producer/consumer handoff. Use the assigned Subtask, parent/dependencies or accepted local request to establish scope. It does not activate Jira lifecycle actions. The coordinator owns cross-repository decomposition and acceptance; assigned execution enters through [WORKFLOW.md](../WORKFLOW.md).

## Authority and lookup

[Planning's API policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#contract-api-và-handoff) owns the shared convention. Jira holds accepted requirements, scope and acceptance; the producer's published OpenAPI holds the supported HTTP API schema and consumer-facing business rules. BE publishes [OpenAPI dev](https://dev-api.signapse.cloud/v3/api-docs). Other services own their contracts; non-HTTP protocols use their producer's canonical reference. SSE events, payloads and semantics belong at the HTTP operation.

Fetch the current contract for the actual target environment before concluding API design/integration readiness, on resume and before handoff. Record URL, environment, fetch time and available producer revision/version evidence. Use producer build metadata and deployment evidence to establish revision identity; `info.version` alone does not prove a Git revision. Unpublished API changes remain proposals.

Read affected operations' parameters/headers, request/response schemas, requiredness, nullability/omission, media types, success/error statuses and auth. Read descriptions for ownership/workspace scope, conditional fields, defaults, validation, lifecycle, side effects, quota, retry/idempotency/concurrency, empty or partial results, streaming and limits. Structured rules belong in schema/responses; descriptions explain semantics. Supported filter scope comes from accepted requirements and the producer contract, not every entity/generic resolver field or the currently exposed UI.

Trace impact in FE definitions/Zod schemas, actions/query serialization, permission handling and UI callers. Consumer types and test fixtures implement or verify that contract; they do not redefine it. Keep source references/findings in the requested evidence, without another schema, mapping ledger or contract snapshot.

## Dependencies and discrepancies

For new/changed API delivery, inspect producer handoff and fetch the deployed contract to verify its delivered revision/environment before dependent integration. Native dependency Done is necessary for routed admission when linked, but does not replace publication evidence. Existing APIs need sufficient contract for the affected scope; unrelated producer documentation work does not block every FE contribution. Mocks and P0 success do not prove producer delivery/live integration.

When requirements, OpenAPI and implementation conflict, record the exact operation/rule, expected basis, observation and owner. Investigate facts and apply [material decision handling](../CONTRIBUTING.md#decisions-and-evidence) when unresolved. Continue independent work while dependent work waits. The producer owns its contract and updates it with implementation; FE does not rewrite expected behavior to hide gaps. Missing fields/errors/permissions/revision evidence are unmet inputs, not permission for a fallback contract.

For an accepted BE → FE breaking change **on dev**, use BE deploy/publish OpenAPI → producer handoff → FE integration. The accepted temporary dev mismatch does not establish FE/feature/QA completion or a production rollout policy. Record the changed operation/rule, affected consumer and pending integration.

## Contract lookup and feature acceptance

Reading the published contract and verifying a new/changed API dependency are consumer integration requirements, distinct from executing features against live services. Verify consumer behavior locally at the actual HTTP boundary in its runtime; browser interception alone does not verify SSR fetching. Live feature/hosted acceptance requires the assigned operation, phase, scope and inputs under [verification standards](../CONTRIBUTING.md#verification). Missing in-scope producer schemas, permissions or required publication evidence remains an integration gap.

## Verification and evidence

Use checks appropriate to the changed behavior. Documentation/description work does not itself require a new API suite or QA Subtask. Runtime changes retain repository verification safeguards; expected behavior comes from accepted requirements. The offline fixture guard checks fixture consistency; the live guard checks declared method/path/status only. Schema/semantics, authorization and integration require their applicable review/runtime evidence.

For assigned execution, use the phase selected by [WORKFLOW.md](../WORKFLOW.md); ordinary work uses the requested PR/artifact/session. Identify FE output separately from producer contract revision/environment and local/live evidence. Keep fetch source/time, revision matching and detailed coverage in linked evidence. The short handoff exposes discrepancies, missing publication evidence and pending integration/delivery with its owner. Preserve earlier evidence; later contract changes invalidate affected checks/review without erasing history.
