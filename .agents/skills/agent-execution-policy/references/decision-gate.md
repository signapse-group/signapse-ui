# Implementation decision gate

Use this gate during assigned execution when a material decision is not settled by the contract, repository policy, verified constraints, or existing authorization.

Investigate discoverable facts first. Present the decision with the accepted outcome, affected behavior, realistic options, recommendation, trade-offs, and the exact dependent work. Ask only what materially changes direction. Continue meaningful independent work while waiting; use Blocked only when none remains.

Apply the [local handoff policy](execution-policy.md#local-handoff-and-live-acceptance) to identify the affected contribution and phase. Pending QA organization or owner acceptance alone does not block dev handoff; missing expected behavior or required verification input still blocks dependent work.

Do not treat elapsed time, a recommendation, or silence as acceptance. Record an accepted decision in the existing contract when authorized. Do not create a new planning artifact or broaden the assigned work. If the owning contract cannot be updated, preserve the decision in the session and report the missing durable update.

After resolution, reread the current contract. Update the execution plan and affected evidence when the decision stays within the deliverable boundary. A changed deliverable requires human replacement or cancellation. Re-run checks and review invalidated by the decision, then continue the same PR where appropriate.
