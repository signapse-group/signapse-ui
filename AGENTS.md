# AGENTS.md

This document is the active repo-wide instruction file for Codex when working in Signapse UI.

## CodeGraph

- When the user asks about architecture, execution flow, bugs, refactors, impact review, or where code should be changed, prefer CodeGraph before manually opening files or running `rg`.
- Use `codegraph_context` as the default entry point for questions like "how does X work", bug investigation, or identifying related entry points.
- Use `codegraph_trace` when the task needs the path from symbol/interaction A to B, `codegraph_impact` before refactors, `codegraph_search` for fast symbol lookup, and `codegraph_explore` to gather several related symbols/files in one pass.
- Fall back to `rg`, direct file reads, or other tools only when CodeGraph lacks an index, returns insufficient context, or the task requires content outside symbols such as dictionaries, CSS, Markdown, or config.

## Scoped Instructions And Skills

- `AGENTS.md` holds only repo-wide architecture, workflow, verification, and review policy.
- Before implementing or reviewing `app/api/**`, read `app/api/AGENTS.override.md`.
- Before implementing or reviewing `app/lib/**`, read `app/lib/AGENTS.override.md`.
- Before implementing or reviewing any user-visible UI or interaction under `app/[lang]/**` or `components/**`, read both `components/AGENTS.override.md` and `docs/design/DESIGN.md`; DESIGN is the source of truth for UI/UX conventions.
- When a task spans multiple domains, read every applicable scoped instruction file.
- Scoped instructions extend this file; the more specific instruction wins when guidance conflicts.
- Agent Workflow plugin version `0.1.0` owns planning, execution, review, issue, and delivery policy. Load `$workflow` at the start of each session; `.agents/skills` holds only repository-specific or otherwise non-overlapping recipes.
- When a task touches one of the domains below, read the corresponding repository skill before implementation or review.
- `shadcn`: adding, fixing, composing shadcn components, wrappers, CLI, docs, presets, and styling rules.
- `hydration-mismatch`: investigating hydration mismatch on Radix/shadcn overlays.
- `frontend-design`: redesign, UI polish, dashboards/workbenches, or new layouts that need visual direction.
- `accessibility`: keyboard, focus, screen reader, semantic markup, dialog/form accessibility.
- `api-mapping-sync`: when the live dev OpenAPI contract, `docs/APIMAPPING.md`, or backend APIs change.

## Commands

- Prefer slash commands: `/dev`, `/build`, `/lint`, `/format`, `/typecheck`.
- Shell fallbacks: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm typecheck`.
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

- Before non-trivial changes, lock scope with the goal, assumptions, non-goals, and completion criteria.
- Prefer the simplest solution that satisfies the requirement; do not add abstractions, config, or fallbacks without a clear need.
- Make surgical edits: only change directly related files, follow existing style, and do not clean up unrelated code.
- When replacing a library/vendor UI or chart engine, the migration must remove old unused sources completely: dependency, imports/types/helpers, adapters, attribution/vendor copy, active documentation references, and temporary dead components.
- When editing Markdown, TS, or TSX, keep UTF-8 and avoid whole-file rewrites through commands that may change encoding/newlines. Prefer `apply_patch`; if a script/bulk edit is unavoidable, keep it narrow, encoding-aware, and check the diff/readability afterwards.
- Finish agent-owned work with appropriate verification such as lint, typecheck, tests, static search, or deterministic review; if verification cannot run, state why.

## I18n And Locale Routing

- The app uses locale route `app/[lang]` with locales declared in `app/lib/i18n/config.ts`; do not create parallel UI routes outside `[lang]`.
- User-facing copy must come from dictionaries through `getDictionary()`, `getServerDictionary()`, or `useLocalization()`; do not hardcode labels, toasts, placeholders, or menu text in new components.
- When removing or replacing a UI route, remove old redirect compatibility routes in the same change unless the user explicitly asks to keep a legacy redirect.

## UI Change Guardrails

- Shadcn wrapper chrome is owned by the selected Nova preset in `components.json` and `components/ui`; fix feature behavior at the usage site or through a documented narrow extension instead of mutating default wrapper internals. Treat visual overrides that change primitive chrome as review findings; layout-only classes remain allowed.
- If route interception is desired for quick detail, create a separate proposal covering route scope, affected links, Back/Forward behavior, how to avoid reloading the workspace behind it, and source cleanup; do not add global `@quickDetail` under `(main)` as the default pattern.
- Vendor/license attribution must not be silently removed; if it leaves the main surface, replace it with a notice/link in a user-accessible location.
- When a UI change involves focus, keyboard navigation, dialogs, forms, or screen-reader behavior, read the `accessibility` skill.
- For a hydration mismatch on a Base UI/Radix-backed shadcn overlay, investigate server/client divergence first, keep SSR enabled by default, and do not use `suppressHydrationWarning` or mount-only/no-SSR escape hatches as a first fix. Prefer deterministic content IDs at the affected app composition, derive repeated IDs from stable keys, and avoid patching the default shadcn wrapper for a local issue.

## Validation And Typing

- Use Zod v4 or later for schema validation.
- If `zodResolver` has a temporary type issue such as `_zod.version`, use `as any` only as a narrow workaround at the resolver boundary.
- Flag `any` as a review finding unless it is a justified narrow boundary workaround.

## Review Expectations

- Review according to this file, every applicable scoped instruction, `docs/design/DESIGN.md` for UI work, and related skills.
- For UI reviews, use the detailed drift categories in DESIGN; also prioritize API contract hierarchy drift, unsafe destructive actions, and unchecked `any` where applicable.
- For each finding, identify file/line, behavioral or UX risk, and the minimal recommended fix.
- If there are no findings, say that clearly and mention residual risk or checks not run.

## Agent skills

### Issue tracker

Issues are tracked as local Markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default canonical triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.
