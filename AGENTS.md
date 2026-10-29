# AGENTS.md

This document is the active repo-wide instruction file for Codex when working in Signapse UI.

When framework versions, the UI preset, CI, or repository ownership change, refresh the affected facts and pointers here.

## Scoped Instructions And Skills

- `AGENTS.md` owns architecture, instruction routing and the direct-work boundary. Read [CONTRIBUTING.md](CONTRIBUTING.md) for shared implementation, verification and review standards.
- Before implementing or reviewing `app/api/**`, read `app/api/AGENTS.override.md`.
- Before implementing or reviewing `app/lib/**`, read `app/lib/AGENTS.override.md`.
- For UI implementation or review under `app/[lang]/**` or `components/**`, read `components/AGENTS.override.md`. For changes to visual presentation, interaction, accessibility, or user-facing content, read the relevant sections of `docs/design/DESIGN.md`, the UI/UX source of truth.
- For assigned Jira UI work, read and apply the local [UI design gate](docs/design/DESIGN.md#ui-design-gate). Resolve the approved design from the native parent in every Survey/Implement/Review session, open the actual references and use them with `docs/design/DESIGN.md`; a child attachment is not required. Direct work retains its accepted contract: inspect any supplied approved reference before coding and compare affected rendered UI before handoff. Report inaccessible, ambiguous or conflicting references before coding dependent UI.
- When a task spans multiple domains, read every applicable scoped instruction file.
- Scoped instructions extend this file; the more specific instruction wins when guidance conflicts.
- `.agents/skills` holds repository-specific or non-overlapping recipes.
- For assigned Jira/Symphony work, read and follow the phase selected by [WORKFLOW.md](WORKFLOW.md). Planning owns project hierarchy, routing and acceptance; ordinary requests do not activate tracker lifecycle actions.
- Choose technical skills when the change or review needs them; skills do not grant workflow permissions or add lifecycle gates. Relevant techniques include:
- `shadcn`: adding, fixing, composing shadcn components, wrappers, CLI, docs, presets, and styling rules.
- Overlay hydration mismatches: use the Hydration section in `components/AGENTS.override.md`.
- `frontend-design`: redesign, UI polish, dashboards/workbenches, or new layouts that need visual direction.
- `accessibility`: keyboard, focus, screen reader, semantic markup, dialog/form accessibility.
- For API integration, contract changes or reviews, read the [API consumer standards](docs/api-consumer.md). The producer's published OpenAPI owns the supported HTTP API contract; Jira owns accepted requirements and acceptance.

## Execution inputs

Live Subtask/parent, accepted decisions, dependencies and explicit assignment references supply the requirement. This repository supplies execution authority, standards and phase procedure. Planning policy links are provenance for maintainers, not required reading or a network prerequisite for workers. Do not redo definition/decomposition or block solely because a Planning policy page is unavailable. Approved design/ADR and producer contracts explicitly needed for the assignment still must be accessible; report the affected AC/check and owner when those inputs are missing. Missing mandatory local instructions remains deployment drift; do not substitute legacy/backup policy.

## Dev handoff boundary

CI runs quality checks on PRs and pushes to dev/main. Feature/fix PRs target dev; main is reserved for a future production release. Reviewers confirm dev Vercel delivery from their workspace under [delivery guidance](docs/delivery.md) and the assigned Review runbook.

For direct work, complete the requested output with applicable verification under CONTRIBUTING. An accepted local request needs no Jira ticket as a prerequisite. Tracker/review/PR/CI lifecycle and publication activate only when assigned; ordinary requests and no-PR operations retain their requested boundary. Assigned execution follows WORKFLOW, including its phase-specific permissions and stopping point.

## Architecture

For marketing implementation documentation and current landing ownership, use the [signapse-landing documentation index](../signapse-landing/docs/README.md).

Signapse UI is an admin dashboard built with **Next.js 16 App Router** for an AI-integrated trading signal system.

- **Stack:** Clerk, shadcn/ui, Tailwind CSS v4, Lucide icons, Geist, Geist Mono, and Zod v4.
- **Route groups:** `app/[lang]/(main)/` is the protected app, `app/[lang]/(auth)/` is Clerk auth, and `app/api/[feature]/action.ts` contains server actions by feature.
- **Public scope:** Localized `sign-in/**` pages and the read-only `/api/build-revision` operational endpoint are public. Locale roots redirect to the protected dashboard. Marketing landing and public articles are maintained in a separate repository; do not restore them or standalone editor/dashboard samples here.
