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

Use the [change-scope matrix](docs/testing/browser-tests.md#selecting-checks-by-change-scope) and applicable selectors under the ownership rules below. CI owns the full lightweight `pnpm test:quality` gate; local work runs focused checks without repeating all CI checks. Use `pnpm test:full` only for explicitly requested full fixture regression or when affected coverage cannot be narrowed; explain why broader coverage is needed.

For documentation-only work, verify rule and exception preservation, links and anchors, formatting and encoding. When moving or deleting documents, check current references and preserve reachable historical evidence. For a `WORKFLOW.md` prompt change, use Symphony's actual parser and template engine offline to verify each phase selects only its skill and grant. Cover unsupported states, invalid routing, missing optional context and resume attempts. If runtime configuration moves, compare the effective profile YAML against its baseline. For skill changes, verify frontmatter, metadata and invocation policies.

From a compatible Symphony Elixir checkout, run the [offline consumer check](scripts/check-symphony-workflow.exs) with the absolute worker profile path followed by the checkout prompt path:

```sh
mix run --no-start /path/to/signapse-ui/scripts/check-symphony-workflow.exs /path/to/grouped/workflows/fe.md /path/to/signapse-ui/WORKFLOW.md
```

The check uses fixture credentials and the actual config, Jira normalization and strict Liquid implementation; it refuses a started application. Do not start polling, clone hooks or live tracker writes to validate the workflow.

### Test ownership and selection

These rules apply to direct FE work and all assigned FE phases.

For each changed behavior, identify the state and observable result to verify. Use the smallest check that establishes that result. Start with focused unit, component or action/schema checks at existing Vitest seams. Select local fixture browser cases when evidence depends on the browser, such as keyboard focus, hydration or responsive layout. Record the scope, reason, result and limits of selected cases. Preserve security, trust-boundary validation, accessibility and fail-closed permissions.

After a fix, compare the last verified revision with the current candidate. Include affected callers, fixtures and shared components. Reuse results the diff leaves valid and rerun local checks for the affected outcomes. Widen coverage when a change or failure warrants it.

For UI changes, assess the affected local SSR/render against the [UI design gate](docs/design/DESIGN.md#ui-design-gate). Tie screenshots to the candidate, applicable reference and state. Check the accepted constraints, usability, responsive behavior and accessibility. Use representative designs and delegated judgment for unspecified details.

QA owns live UI/API feature testing, including real login, permissions, persistence, integration and regression. For a Task without dedicated QA, the coordinator verifies and accepts the outcome. Hand off the live coverage to that owner. FE completes its contribution when the applicable local, review and delivery checks pass.

Keep producer-published OpenAPI lookup and required publication/revision evidence under [API consumer standards](docs/api-consumer.md), lint/typecheck, required CI/build/Preview, independent review and [deployed-revision verification](.agents/skills/code-review/SKILL.md#verify-the-delivered-build). FE owns these contract and delivery checks and resolves defects and missing mandatory local evidence in the assigned phase. Record producer contract gaps as producer dependencies under the [consumer standards](docs/api-consumer.md#dependencies-and-discrepancies) and keep their owners visible in the handoff.

Existing live suites and runners are historical references. FE neither runs nor extends them for contribution verification.

When resuming an unfinished assignment with legacy live-test wording, reconcile it under [blockers and resume](#blockers-and-resume).

On Symphony, run selected browser cases from the assigned workspace through the host guide’s wrapper and lock. Application inputs use the operator-managed ignored `.env.local`; private accounts remain external. Never commit real `.env` files, passwords, Clerk secrets, JWTs, cookies or auth artifacts; keep them out of logs/evidence.

### Required PR build checks

For the current PR head, require successful `Verify / check` from this PR's `pull_request` event, a successful Vercel Preview build for that head and any additional required GitHub checks. Preview adds no mandatory website/browser check. Preserve the candidate identity and actual command/results/coverage/limits in accessible evidence; green CI alone does not prove local coverage or acceptance criteria.

Changed head/contract or a concrete base impact invalidates affected evidence. The target branch advancing alone does not require rebase, retesting or re-review of unchanged head. Missing/failing mandatory evidence cannot be reported as Pass.

## Review standards

Assess both **Requirement adherence** and **Correctness & Standards**. Map accepted AC/expected behavior to final behavior and evidence; check omissions, scope creep and impacted regression. Existing implementation can satisfy a criterion without appearing in the diff; tests passing alone do not establish coverage. Inspect final code, callers and relevant committed, staged, unstaged and untracked output; exclude unrelated work only with ownership evidence.

Check logic, authorization/security, persistence, concurrency, error handling and repository/scoped standards. UI review uses the drift categories in `docs/design/DESIGN.md`, including approved-reference comparison; prioritize API contract hierarchy drift, unsafe destructive actions and unchecked `any` where applicable.

Each finding identifies its axis, file/line or check, behavioral/UX risk and minimal required outcome. Distinguish blocking defects/missing mandatory evidence from optional suggestions. Naming preferences and speculative abstractions do not automatically block. Report a separate verdict for each axis and one handoff conclusion; optional suggestions do not prevent completion. If there are no findings, say so and disclose checks not run/residual risk. Reassess challenged findings using evidence; unresolved material contract/risk disagreements return to the human.

For missing FE evidence, name the behavior, state and expected result. Let Implement [select the check](#test-ownership-and-selection). Require a specific tool only when the observation depends on it. Report baseline gaps, pending QA acceptance and coordinator-owned metadata separately.

An independent review is performed by a reviewer who did not implement the candidate. The assignment determines how that role is supplied; a technique/skill does not add another reviewer gate. Record base, HEAD and reviewed working output, without requiring a repository report, snapshot or fingerprint.

## Decisions and evidence

Investigate discoverable facts before asking for an unresolved material decision. Present the accepted outcome, affected behavior, realistic options, recommendation/trade-offs and dependent work. Routine implementation choices remain within the accepted scope and repository standards; acceptance-significant changes return to their owner. Continue meaningful independent work while dependent work waits.

When fixing an edge case would materially change a control, interaction or primary journey, compare an approach that preserves the existing experience and check whether the change is within delegated design choices. If broad wording or a newly discovered consequence raises a scope or acceptance question, escalate the unsettled decision to the coordinator with its affected AC and evidence. Retain the accepted requirement and observed evidence; do not change product behavior merely to fit a test's mechanism. Routine changes within the accepted scope need no extra approval.

Silence, elapsed time or a recommendation is not acceptance. Record accepted changes in the existing contract when authorized; otherwise retain the decision in the session and report the missing durable update. Reread the contract, update affected work and invalidate affected checks/review. A different deliverable needs a human replacement/cancellation decision.

PR/artifact evidence owns implementation and verification detail; Jira owns coordination and receiver actions. Preserve previous candidates/evidence and concurrent human content. Edit only records with established ownership; a shared API account does not prove it. Reread before editing and read back writes, especially ambiguous results before retry. Use existing durable evidence locations and link details rather than maintaining parallel reports/schema snapshots.

## Blockers and resume

For an impediment in assigned work, name the affected output and continue meaningful independent work in scope, phase and grant. Collect additional points encountered while doing that work. When a condition is needed only in a later phase, put it in that phase's handoff and finish the current output. A permitted synthetic-data effect in an assigned test environment is not itself a blocker; record the effect.

| Type                  | Identify and route the point                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement           | Missing or conflicting scope, AC, expected behavior or design decision affecting acceptance: coordinator, with Planning when needed. Complete delegated details from the accepted direction.                                          |
| Tooling               | Broken script, test, fixture or build tool: fix within grant or identify the tool owner.                                                                                                                                              |
| Vận hành (Operations) | Retry temporary runner contention and continue independent work. Escalate missing access, credentials, services, runners, deployed instructions or recovery outside the grant to the operator. The coordinator handles new authority. |
| Dependency            | Required producer output still missing or incorrect: give the producer the specific gap and link its record if available. Check native dependency direction.                                                                          |

State observed symptoms, evidence and next check when the mechanism is unknown. Name one owner and specific action per point; if unassigned, ask the coordinator to identify the owner. Distinguish the owner of the output from the operator or other actor who must intervene.

Apply all of these conditions before moving an assigned Subtask to Blocked:

1. Identify the required outcome, verification owner, applicable contract or policy version, and why this phase needs it. For a verification blocker, name the behavior at risk and the observation still missing after considering existing evidence and narrower checks.
2. Verify required inputs and try remedies in scope. If a required reference is unavailable, check for an accepted equivalent in the current checkout or at a canonical path/version the source owner confirms. Use it when it supports the same requirement or check. Record the exact gap when no equivalent is available or the sources conflict. List the independent work remaining in the current phase and grant, then complete it before deciding to block. Include scoped fixes, local or fixture checks, evidence and cleanup. The remaining work must require outside input or authority, or have reached the assigned skill's correction or recovery limit.
3. Open the separate blocker comment with the required output/check that cannot proceed in the current phase, the person or role who must do what, and the observable condition for continuing. For multiple points, give these three details for each point before the supporting evidence. Then record the live pre-Blocked status, type and basis of each point, alternatives checked, work completed, unresolved cleanup and why no independent work remains. Reuse existing evidence.
4. Read the live issue, save and read back the record before using an authorized native transition, then read back status. If ownership, write or transition cannot be confirmed, report the actual pending step. Preserve concurrent content and versioned history.

The coordinator owns Blocked resume to the prior native status. For runner contention, restored access to the required capability permits resume. The worker completes the outstanding check in the resumed phase before handoff. On an assigned resumed session, reread live contract, resolution, dependencies and environment before dependent work. For any assigned ticket still unfinished after rollout, update only authorized process/verification wording, record the accepted basis and read it back. Preserve identity, old outcome/evidence and current status. Refer requirement, scope, AC or environment-grant changes to the coordinator; keep unresolved live verification coverage and its owner visible. This does not authorize queueing, self-resume or reopening Done.

## Reading Jira dependencies

For Symphony assignments, use the `dependencies` envelope from live `jira_rest GET /rest/api/3/issue/{key}` with `fields=issuelinks`: `blocked_by` lists prerequisites and `blocks` lists downstream issues. Admission requires `complete=true` and `ready=true`; reread missing data rather than treating an empty list as clearance. Retain the envelope when parsing responses, not only `body`. Before admission, Symphony waits for the native incoming dependencies. After admission, check the output actually needed even if the producer is Done and report the specific missing or incorrect handoff. Do not read a downstream `blocks` link as an incoming prerequisite: Jira supplies both labels. The shared parser and rules are owned by the [Symphony dependency contract](https://github.com/signapse-group/signapse-symphony/blob/main/elixir/README.md#jira-dependency-contract).
