# Contributing to Signapse UI

This document owns shared implementation, verification and review standards for direct requests and assigned contributions. Read `AGENTS.md` and every applicable scoped instruction before changing or reviewing files. Assigned workflow permissions and lifecycle come from `WORKFLOW.md`; these standards do not activate them.

## Scope and implementation

- For changes spanning multiple files, affecting behavior or making architectural decisions, state the goal, material assumptions, non-goals and completion criteria. Reuse the request or accepted contract when it already defines them.
- Prefer the simplest solution that satisfies the requirement. Reuse existing patterns; add abstractions, configuration or fallbacks only for a demonstrated need.
- Change directly related files and follow existing style. Preserve unrelated work and stage only contribution-owned files.
- A library/vendor migration removes unused dependencies, imports/types/helpers, adapters, attribution/vendor copy, active documentation references and temporary dead components.
- Keep Markdown, TS and TSX in UTF-8. Prefer `apply_patch`; narrow encoding-aware bulk edits require a diff/readability check.
- Continue through implementation, applicable verification and fixes caused by the change. Report remaining gaps; repeat only affected checks unless broader evidence was invalidated.
- Use Vietnamese for collaboration; preserve repository document/code language and applicable VI/EN copy rules.

## Feature structure

Keep feature files together when appropriate:

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

Use relative imports within a feature. Add a local `error.tsx` when the feature has a meaningful route/page. Create and update have separate submit-owning forms; share only field primitives/helpers that are not mode-dependent.

## Locale, validation and API contracts

Use `app/[lang]` and the locales in `app/lib/i18n/config.ts`; do not create parallel UI routes outside `[lang]`. User-facing labels, toasts, placeholders and menu text come from dictionaries through `getDictionary()`, `getServerDictionary()` or `useLocalization()`. Remove old redirect compatibility routes when replacing/removing a UI route unless the user explicitly retains them.

Use Zod v4 or later. A temporary `zodResolver` type problem such as `_zod.version` permits `as any` only at the resolver boundary. Flag `any` as a review finding unless it is a justified narrow boundary workaround.

For API integration, contract-sensitive design/review or producer/consumer handoff, read and apply the [API consumer standards](docs/api-consumer.md). Jira/accepted requests own requirements; producer-published contracts own supported API behavior.

## Verification

Use the repository's pnpm scripts (or equivalent slash commands when available); [README](README.md#local-development) lists local commands.

Use the [change-scope matrix](docs/testing/browser-tests.md#selecting-checks-by-change-scope) and its versioned runner selectors. Run focused checks for affected behavior locally. CI owns the full lightweight `pnpm test:quality` gate; use `pnpm test:full` when explicitly requested or affected coverage cannot be narrowed.

For documentation-only work, verify rule/exception preservation, links/anchors, formatting and encoding. Moving/deleting documents also requires checking current references and preserving reachable historical evidence. A `WORKFLOW.md` prompt change requires offline rendering with Symphony's actual parser/template engine: every supported phase, unsupported states, missing optional context and resume/attempt. For organization-only changes, compare YAML before/after and verify that each phase selects only its runbook. Skill changes require valid frontmatter/metadata and preserved invocation policies.

From a compatible Symphony Elixir checkout, run the [offline consumer check](scripts/check-symphony-workflow.exs) with absolute UI paths:

```sh
mix run --no-start /path/to/signapse-ui/scripts/check-symphony-workflow.exs /path/to/signapse-ui/WORKFLOW.md
```

The check uses fixture credentials and the actual config, Jira normalization and strict Liquid implementation; it refuses a started application. Do not start polling, clone hooks or live tracker writes to validate the workflow.

Approved design references, accessibility and local SSR checks remain required for affected UI. Inspect the reference before implementation and compare the affected rendered UI before handoff under scoped instructions and `docs/design/DESIGN.md`.

Run `pnpm test:integration` only when the assignment names a live operation, scope and required inputs. Protected-page changes or reuse of authenticated transport alone do not add live smoke. Report live results separately from fixture P0: local fixtures do not prove producer publication, real authorization, hosted behavior or external effects. A missing mandatory input/check remains a gap; pending owner/QA acceptance alone does not add a developer check.

On Symphony, required browser checks use the host testing guide and existing wrapper/lock. Verify that the wrapper runs the suite from the workspace under test. Application inputs use the operator-managed ignored `.env.local`; private accounts remain external. Never commit real `.env` files, passwords, Clerk secrets, JWTs, cookies or auth artifacts; keep them out of logs/evidence.

### Required PR build checks

For the current PR head, require successful `Verify / check` from this PR's `pull_request` event, a successful Vercel Preview build for that head and any additional required GitHub checks. Preview adds no mandatory website/browser check. Preserve the candidate identity and actual command/results/coverage/limits in accessible evidence; green CI alone does not prove local coverage or acceptance criteria.

Changed head/contract or a concrete base impact invalidates affected evidence. Main advancing alone does not require rebase, retesting or re-review of unchanged head. Missing/failing mandatory evidence cannot be reported as Pass.

## Review standards

Assess both **Requirement adherence** and **Correctness & Standards**. Map accepted AC/expected behavior to final behavior and evidence; check omissions, scope creep and impacted regression. Existing implementation can satisfy a criterion without appearing in the diff; tests passing alone do not establish coverage. Inspect final code, callers and relevant committed, staged, unstaged and untracked output; exclude unrelated work only with ownership evidence.

Check logic, authorization/security, persistence, concurrency, error handling and repository/scoped standards. UI review uses the drift categories in `docs/design/DESIGN.md`, including approved-reference comparison; prioritize API contract hierarchy drift, unsafe destructive actions and unchecked `any` where applicable.

Each finding identifies its axis, file/line or check, behavioral/UX risk and minimal required outcome. Distinguish blocking defects/missing mandatory evidence from optional suggestions. Naming preferences and speculative abstractions do not automatically block. Report a separate verdict for each axis and one handoff conclusion; optional suggestions do not prevent completion. If there are no findings, say so and disclose checks not run/residual risk. Reassess challenged findings using evidence; unresolved material contract/risk disagreements return to the human.

Reuse evidence valid for the assessed candidate and reassess changed parts and affected surrounding behavior after fixes. Check that scoped selectors cover affected behavior; report baseline gaps, pending QA/owner acceptance and coordinator-owned metadata separately from blocking findings. Run or request missing safe checks, broadening only when changes, failures or unresolved concerns warrant it.

An independent review is performed by a reviewer who did not implement the candidate. The assignment determines how that role is supplied; a technique/skill does not add another reviewer gate. Record base, HEAD and reviewed working output, without requiring a repository report, snapshot or fingerprint.

## Decisions and evidence

Investigate discoverable facts before asking for an unresolved material decision. Present the accepted outcome, affected behavior, realistic options, recommendation/trade-offs and dependent work. Routine implementation choices remain within the accepted scope and repository standards; acceptance-significant changes return to their owner. Continue meaningful independent work while dependent work waits.

When fixing an edge case would materially change a control, interaction or primary journey, compare an approach that preserves the existing experience and check whether the change is within delegated design choices. Apply [planning's requirement interpretation guidance](https://github.com/signapse-group/signapse-planing/blob/main/workflow/business-analysis.md#interpret-requirements-in-context) if broad wording or a newly discovered consequence raises a scope or acceptance question. Escalate only the unsettled consequential decision, retaining the accepted requirement and observed evidence; do not change product behavior merely to fit a test's mechanism. Routine changes within the accepted scope need no extra approval.

Silence, elapsed time or a recommendation is not acceptance. Record accepted changes in the existing contract when authorized; otherwise retain the decision in the session and report the missing durable update. Reread the contract, update affected work and invalidate affected checks/review. A different deliverable needs a human replacement/cancellation decision.

PR/artifact evidence owns implementation and verification detail; Jira owns coordination and receiver actions. Preserve previous candidates/evidence and concurrent human content. Edit only records with established ownership; a shared API account does not prove it. Reread before editing and read back writes, especially ambiguous results before retry. Use existing durable evidence locations and link details rather than maintaining parallel reports/schema snapshots.
