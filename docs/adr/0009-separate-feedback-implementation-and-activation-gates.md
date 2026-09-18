---
status: accepted
---

# Separate feedback implementation and activation gates

The effective runtime semantics recorded in `docs/APIMAPPING.md` may guide feedback implementation when the live OpenAPI is intentionally sparse. Fixture contract approval and production activation remain behind a live dev OpenAPI/API mapping structural cross-check, but documented omissions such as requiredness, nullability, constraints, examples, and lifecycle prose do not block completion. A hard contradiction in paths, methods, authorization scopes, transport fields, response shapes, or statuses still blocks completion. This scoped two-gate model lets frontend and backend documentation proceed in parallel without allowing incompatible contracts through.
