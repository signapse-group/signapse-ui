# API consumer policy

Apply this reference to API integration, design, review and delivery. It does not
activate Jira lifecycle actions for ordinary requests. Use the assigned Subtask,
native parent/dependencies or accepted local request to establish contribution scope.
The coordinator owns cross-repository decomposition and acceptance.

## Authority and lookup

[Planning's API policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#contract-api-và-handoff)
owns the shared convention. Jira holds accepted requirements, scope and acceptance;
the producer's published OpenAPI holds the supported HTTP API schema and
consumer-facing business rules. BE publishes [OpenAPI dev](https://dev-api.signapse.cloud/v3/api-docs).
Other services own their contracts; non-HTTP protocols use their producer's canonical
reference. SSE events, payloads and semantics belong at the HTTP operation.

Fetch the current contract for the actual target environment before concluding API
design/integration readiness, on resume and before handoff. Record URL, environment,
fetch time and the producer revision/version evidence available. Use producer build
metadata and deployment evidence to establish revision identity; `info.version`
alone does not prove a Git revision. Unpublished API changes remain proposals.

Read the affected operations' parameters/headers, request/response schemas,
requiredness, nullability/omission, media types, success/error statuses and auth.
Read descriptions for ownership/workspace scope, conditional fields, defaults,
validation, lifecycle, side effects, quota, retry/idempotency/concurrency, empty or
partial results, streaming behavior and applicable limits. Structured rules belong
in schema/responses; descriptions explain semantics. Supported filter scope comes
from accepted requirements and the producer contract, not every entity/generic
resolver field or the UI currently exposed.

Trace impact in existing FE definitions/Zod schemas, actions/query serialization,
permission handling and UI callers. Consumer types and test fixtures implement or
verify that contract; they do not redefine it. Keep source references and findings
in the requested evidence, without maintaining another schema, mapping ledger or
contract snapshot.

## Dependencies and discrepancies

For new/changed API delivery, inspect the producer handoff and fetch the deployed
contract to verify its delivered revision/environment before dependent integration.
Native dependency Done is necessary for routed admission when linked, but does not
replace publication evidence. Existing APIs need sufficient contract for the affected
scope; unrelated producer documentation work does not block every FE contribution.
Mock behavior and P0 success do not prove producer delivery or live integration.

When accepted requirements, OpenAPI and implementation conflict, record the exact
operation/rule, expected basis, observation and owner. Investigate discoverable facts,
then use the [decision gate](decision-gate.md) for unresolved material decisions.
Pause only dependent work while continuing meaningful independent work. The producer
owns its contract and updates it with implementation; FE does not rewrite producer
rules or expected results to hide a gap. Missing fields/errors/permissions/revision
evidence are unmet inputs, not permission to invent a fallback contract.

For an accepted BE → FE breaking change **on dev**, the sequence is BE deploy/publish
OpenAPI → producer handoff → FE integration. The accepted temporary dev mismatch does
not establish FE/feature/QA completion or a production rollout policy. Record the
changed operation/rule, affected consumer and integration still pending.

## Verification and evidence

Use existing checks appropriate to the changed behavior. Documentation/description
work does not itself require a new API test suite or QA Subtask. Runtime changes
retain repository verification safeguards; expected behavior comes from accepted
requirements. The offline fixture guard checks fixture consistency; the live guard
checks declared method/path/status only. Schema/semantics, authorization and actual
integration need their applicable review and runtime evidence.

Use the [delivery handoff format](execution-policy.md#pr-and-delivery-handoff) for
assigned execution, or the requested PR/artifact/session for ordinary work. Identify
FE output separately from producer contract revision/environment and record the live
fetch result/time, coverage, discrepancy and pending integration/delivery actions.
Keep earlier revision identities and evidence links when refreshing a handoff; a later
contract change invalidates affected checks/review without erasing historical evidence.
