# AGENTS.md

This document is the active repo-wide instruction file for Codex when working in Signapse UI.

When framework versions, the UI preset, CI, or repository ownership change, refresh the affected facts and pointers here.

## Scoped Instructions And Skills

- `AGENTS.md` owns architecture, instruction routing and the direct-work boundary. Read [CONTRIBUTING.md](CONTRIBUTING.md) for shared implementation, verification and review standards.
- Before implementing or reviewing `app/api/**`, read `app/api/AGENTS.override.md`.
- Before implementing or reviewing `app/lib/**`, read `app/lib/AGENTS.override.md`.
- For UI implementation or review under `app/[lang]/**` or `components/**`, read `components/AGENTS.override.md`. For changes to visual presentation, interaction, accessibility, or user-facing content, read the relevant sections of `docs/design/DESIGN.md`, the UI/UX source of truth.
- For assigned Jira UI work, apply the local [UI design gate](docs/design/DESIGN.md#ui-design-gate): read the native parent's accepted direction and view the representative reference/pattern in each phase. FE may complete routine detail under that gate; missing detailed mockups alone do not block implementation. Direct work keeps its accepted contract and supplied references. Verify affected rendered UI before handoff; escalate only consequential gaps outside FE authority.
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

Live Subtask/parent, accepted decisions, dependencies and explicit assignment references supply the requirement. This repository supplies execution authority, standards and phase procedure. Planning policy links are provenance for maintainers, not required reading or a network prerequisite for workers. Do not redo definition/decomposition or block solely because a Planning policy page is unavailable. Apply the local UI design gate for sufficient direction and alternatives; an inaccessible detail reference alone is not a blocker. ADRs, producer contracts and inputs necessary for consequential decisions must remain accessible; report the affected AC/check and owner when missing. Missing mandatory local instructions remains deployment drift; do not substitute legacy/backup policy.

## Dev handoff boundary

CI runs quality checks on PRs and main; reviewers confirm Vercel delivery from their workspace under [delivery guidance](docs/delivery.md) and the assigned Review runbook.

For direct work, complete the requested output with applicable verification under CONTRIBUTING. An accepted local request needs no Jira ticket as a prerequisite. Tracker/review/PR/CI lifecycle and publication activate only when assigned; ordinary requests and no-PR operations retain their requested boundary. Assigned execution follows WORKFLOW, including its phase-specific permissions and stopping point.

## Architecture

For marketing implementation documentation and current landing ownership, use the [signapse-landing documentation index](../signapse-landing/docs/README.md).

Signapse UI is an admin dashboard built with **Next.js 16 App Router** for an AI-integrated trading signal system.

- **Stack:** Clerk, shadcn/ui, Tailwind CSS v4, Lucide icons, Geist, Geist Mono, and Zod v4.
- **Route groups:** `app/[lang]/(main)/` is the protected app, `app/[lang]/(auth)/` is Clerk auth, and `app/api/[feature]/action.ts` contains server actions by feature.
- **Public scope:** Localized `sign-in/**` pages and the read-only `/api/build-revision` operational endpoint are public. Locale roots redirect to the protected dashboard. Marketing landing and public articles are maintained in a separate repository; do not restore them or standalone editor/dashboard samples here.
