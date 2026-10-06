---
name: agent-execution-policy
description: Load the Signapse UI implementation, verification, review, and handoff policy for assigned Jira Subtasks or an explicitly activated local-contract workflow.
---

# Agent Execution Policy

Apply this repository-owned policy when the Symphony prompt assigns a Jira Subtask and loads it, or when the user explicitly activates this workflow for an accepted local contract. Installation, configuration maintenance and ordinary requests do not activate tracker lifecycle actions.

Read [references/execution-policy.md](references/execution-policy.md) before workflow-dependent action, together with `WORKFLOW.md`, `AGENTS.md` and applicable scoped instructions. Planning owns hierarchy, routing and acceptance; this repository owns implementation, verification, review and handoff. The skills are maintained here independently of Symphony releases.

If required project-specific configuration is missing, report it before dependent action and continue independent work that remains valid. Do not create or edit `AGENTS.md` merely to activate this workflow.

Load [references/decision-gate.md](references/decision-gate.md) only when execution reaches an unresolved material decision. Load [references/api-handoff.md](references/api-handoff.md) only for producer/consumer API delivery.

This entrypoint reads policy and project configuration. It does not itself authorize implementation, remote writes, merge, or deployment.
