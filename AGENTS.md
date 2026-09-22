# AGENTS.md

This document is the active repo-wide instruction file for Codex when working in Signapse UI.

When framework versions, the UI preset, CI, or repository ownership change, refresh the affected facts and pointers here.

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
- `.agents/skills` holds repository-specific or non-overlapping recipes.
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
