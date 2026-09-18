# AGENTS.md

This document is the active repo-wide instruction file for Codex when working in Signapse UI.

When framework versions, the UI preset, CI, workflow plugin, or repository ownership change, refresh the affected facts and pointers here.

## CodeGraph

- When available, prefer CodeGraph for architecture, execution flow, bugs, refactors, impact review, or locating code to change.
- Use `codegraph_context` as the default entry point for questions like "how does X work", bug investigation, or identifying related entry points.
- Use `codegraph_trace` when the task needs the path from symbol/interaction A to B, `codegraph_impact` before refactors, `codegraph_search` for fast symbol lookup, and `codegraph_explore` to gather several related symbols/files in one pass.
- Use `rg` or direct reads when CodeGraph is unavailable, lacks an index, returns insufficient context, or the task concerns non-symbol content such as dictionaries, CSS, Markdown, or config.

## Scoped Instructions And Skills

- `AGENTS.md` holds only repo-wide architecture, workflow, verification, and review policy.
- Before implementing or reviewing `app/api/**`, read `app/api/AGENTS.override.md`.
- Before implementing or reviewing `app/lib/**`, read `app/lib/AGENTS.override.md`.
- For UI implementation or review under `app/[lang]/**` or `components/**`, read `components/AGENTS.override.md`. For changes to visual presentation, interaction, accessibility, or user-facing content, read the relevant sections of `docs/design/DESIGN.md`, the UI/UX source of truth.
- When a task spans multiple domains, read every applicable scoped instruction file.
- Scoped instructions extend this file; the more specific instruction wins when guidance conflicts.
- Workflow bootstrap and FE configuration are defined under Agent Workflow adoption below; `.agents/skills` holds repository-specific or non-overlapping recipes.
- Load the corresponding repository skill when the change or review matches its trigger:
- `shadcn`: adding, fixing, composing shadcn components, wrappers, CLI, docs, presets, and styling rules.
- Overlay hydration mismatches: use the Hydration section in `components/AGENTS.override.md`.
- `frontend-design`: redesign, UI polish, dashboards/workbenches, or new layouts that need visual direction.
- `accessibility`: keyboard, focus, screen reader, semantic markup, dialog/form accessibility.
- `api-mapping-sync`: when the live dev OpenAPI contract, `docs/APIMAPPING.md`, or backend APIs change.

## Commands

- Use `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, and `pnpm typecheck`.
- Equivalent slash commands may be used when available in the current environment.
- Run the production server with `pnpm start`.

## Architecture

Signapse UI is an admin dashboard built with **Next.js 16 App Router** for an AI-integrated trading signal system.

- **Stack:** Clerk, shadcn/ui, Tailwind CSS v4, Lucide icons, Geist, Geist Mono, and Zod v4.
- **Route groups:** `app/[lang]/(main)/` is the protected app, `app/[lang]/(auth)/` is Clerk auth, and `app/api/[feature]/action.ts` contains server actions by feature.

## Feature Structure

Each feature should live in its own folder when appropriate:

```text
app/[lang]/(main)/[feature]/
├── page.tsx              # Server Component + Suspense boundary
├── [id]/page.tsx         # Detail page
├── error.tsx             # Local error boundary
├── [feature]-list.tsx    # Client Component: table/list + toolbar
├── [feature]-create-form.tsx
├── [feature]-update-form.tsx
└── [feature]-search.tsx
```

- Use relative imports such as `./component-name` for components inside the same feature.
- Add `error.tsx` for local server errors when the feature has a meaningful route/page.
- Create and update must not share one submit-owning form component; share only field primitives/helpers that are not mode-dependent.

## Implementation Guardrails

- For changes spanning multiple files, affecting behavior, or making architectural decisions, state the goal, material assumptions, non-goals, and completion criteria. Use the existing request or contract when it already defines them.
- Prefer the simplest solution that satisfies the requirement; do not add abstractions, config, or fallbacks without a clear need.
- Make surgical edits: only change directly related files, follow existing style, and do not clean up unrelated code.
- When replacing a library/vendor UI or chart engine, the migration must remove old unused sources completely: dependency, imports/types/helpers, adapters, attribution/vendor copy, active documentation references, and temporary dead components.
- When editing Markdown, TS, or TSX, keep UTF-8 and avoid whole-file rewrites through commands that may change encoding/newlines. Prefer `apply_patch`; if a script/bulk edit is unavoidable, keep it narrow, encoding-aware, and check the diff/readability afterwards.
- Continue through implementation, applicable verification, and fixes for failures caused by the change; report any remaining blocker. Use the completion checks below and rerun only affected checks unless broader evidence was invalidated.

## I18n And Locale Routing

- The app uses locale route `app/[lang]` with locales declared in `app/lib/i18n/config.ts`; do not create parallel UI routes outside `[lang]`.
- User-facing copy must come from dictionaries through `getDictionary()`, `getServerDictionary()`, or `useLocalization()`; do not hardcode labels, toasts, placeholders, or menu text in new components.
- When removing or replacing a UI route, remove old redirect compatibility routes in the same change unless the user explicitly asks to keep a legacy redirect.

## Validation And Typing

- Use Zod v4 or later for schema validation.
- If `zodResolver` has a temporary type issue such as `_zod.version`, use `as any` only as a narrow workaround at the resolver boundary.
- Flag `any` as a review finding unless it is a justified narrow boundary workaround.

## Review Expectations

- Review according to this file, applicable scoped instructions, and the task-specific references routed above.
- For UI reviews, use the detailed drift categories in DESIGN; also prioritize API contract hierarchy drift, unsafe destructive actions, and unchecked `any` where applicable.
- For each finding, identify file/line, behavioral or UX risk, and the minimal recommended fix.
- If there are no findings, say that clearly and mention residual risk or checks not run.

## Agent Workflow adoption

This repository adopts `agent-workflow` from marketplace `signapse-workflow` as its default workflow. At the start of every new session and before workflow-dependent action, load the installed `agent-workflow:workflow` skill (`$workflow` in the skill picker) and read its shared policy. Resolve resources from the installed skill location, never a hardcoded cache path. If the plugin is unavailable or required repository configuration is missing, report the blocked portion and continue independent valid work.

- Planning repository for Epic/Story and backend execution: `https://github.com/signapse-group/signapse`.
- Frontend Task/Bug execution repository: `https://github.com/signapse-group/signapse-ui`.
- GitHub Project: `https://github.com/orgs/signapse-group/projects/1`, owner `signapse-group`, number `1`. Resolve IDs and verify access, native issue types, relationships, and status fields before mutation.
- Use the plugin's native GitHub issue workflow and `to-ticket` entrypoint; existing local planning documents are historical references.
- Focused checks: `pnpm exec vitest run <test-file>` for behavior under test; use targeted lint/typecheck or contract checks as appropriate to the change.
- Run local checks, fix failures caused by the requested change, and rerun affected checks without asking for approval at each step. `pnpm test:browser` uses the local backend fixture configured in `playwright.config.ts`; this authorization does not extend to production mutations or live integration checks outside the assigned scope.
- Completion checks for application changes: `pnpm test:quality`, the existing aggregate of lint, typecheck, Vitest, API contract checks, build, and Chromium browser tests. Documentation-only changes require relevant content/link/format checks and review, not the application suite.
- Test seams keep participating FE components, state, routing, and API mapping real. Mock external HTTP/backend boundaries as appropriate; fixture-mode tests do not establish live backend delivery or real authorization.
- FE delivery defaults to human-reviewed merge with `Closes`; use `Refs` when the contract requires post-merge acceptance. BE deployment is not a default FE delivery condition.
- API integration: `docs/APIMAPPING.md` is the local mapping reference; link the producer's exact API contract and delivery evidence.
- Domain documentation uses `CONTEXT.md` and `docs/adr/` in this repository. Read relevant existing content and create documents lazily for accepted terms/decisions using the plugin's domain guidance.

Shared policy and issue templates live only in the plugin. Keep FE architecture, UI/i18n rules, scoped instructions, and application verification standards in this repository. Do not copy plugin skills back into `.agents/skills`.
