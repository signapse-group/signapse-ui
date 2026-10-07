---
status: superseded
---

# Separate feedback implementation and activation gates

Superseded on 2026-10-07 by the accepted [producer API contract policy](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#contract-api-và-handoff)
and its [FE consumer instructions](../../.agents/skills/agent-execution-policy/references/api-handoff.md).
Published producer OpenAPI owns HTTP schema and consumer-facing semantics; Jira
owns accepted requirements. Missing contract details affecting integration require
owner resolution. Fixture checks and live integration retain their distinct evidence
limits; the former mapping document and its omission waiver no longer guide execution.

## Historical decision

The effective runtime semantics recorded in `docs/APIMAPPING.md` may guide feedback implementation when the live OpenAPI is intentionally sparse. Fixture contract approval and production activation remain behind a live dev OpenAPI/API mapping structural cross-check, but documented omissions such as requiredness, nullability, constraints, examples, and lifecycle prose do not block completion. A hard contradiction in paths, methods, authorization scopes, transport fields, response shapes, or statuses still blocks completion. This scoped two-gate model lets frontend and backend documentation proceed in parallel without allowing incompatible contracts through.
