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

Effective 2026-10-28, these rules apply to direct FE work and every Survey, Implement and Review phase in `signapse-ui`. They do not change BE, MDG or landing verification policy.

Run focused unit, component and action/schema tests at existing Vitest seams for changed behavior; select the layers needed rather than requiring every layer for every change. Choose local fixture browser automation only for behavior not adequately established by those checks, such as hydration, routing/SSR, focus/keyboard or browser-specific interactions. When selecting browser checks, record the reason, selected scope, results and limits. Full browser regression is not a default gate. Preserve security, trust-boundary validation, accessibility and fail-closed permissions.

Use sufficient representative design/pattern direction and the delegated detail authority in the [UI design gate](docs/design/DESIGN.md#ui-design-gate). Missing detailed state/viewport mockups alone do not block implementation. Affected local SSR/rendered checks remain required: assess AC, accepted direction/fixed constraints, usability, responsive and accessibility; preserve screenshots tied to the candidate and source/pattern used. Reviewers assess independently and reuse still-valid evidence; changed behavior/direction invalidates affected evidence. Unspecified pixel differences within FE authority are not blocking defects. Do not require a new screenshot-regression suite or baseline for every ticket.

FE does not run or add live feature tests in any phase, including Review. QA owns live UI/API, login/auth, permission, persistence, integration and regression checks within approved scope. For a Task without dedicated QA, the coordinator verifies/accepts under the existing lifecycle; this policy does not create a QA ticket. Missing real accounts or pending QA live results alone do not block FE contribution completion. Handoff identifies the live coverage and receiving QA/coordinator without claiming it ran. FE Done confirms contribution/delivery, independently of feature/parent acceptance.

Keep producer-published OpenAPI lookup and required publication/revision evidence under [API consumer standards](docs/api-consumer.md), lint/typecheck, required CI/build/Preview, independent review and [deployed-revision verification](.agents/skills/code-review/SKILL.md#verify-the-delivered-build). FE owns these contract and delivery checks and resolves defects and missing mandatory local evidence in the assigned phase. Record producer contract gaps as producer dependencies under the [consumer standards](docs/api-consumer.md#dependencies-and-discrepancies) and keep their owners visible in the handoff.

Existing live suite/runner code remains reference material: do not execute or extend it for FE contribution gates. Script availability does not establish a QA entrypoint. Migration/deletion/dependency removal and changes to QA instructions/harness are outside this policy update; only reconcile ticket coverage/handoff through the existing QA workflow when needed.

When resuming an unfinished assignment with legacy live-test wording, reconcile it under [blockers and resume](#blockers-and-resume).

On Symphony, required browser checks use the host testing guide and existing wrapper/lock. Verify that the wrapper runs the suite from the workspace under test. Application inputs use the operator-managed ignored `.env.local`; private accounts remain external. Never commit real `.env` files, passwords, Clerk secrets, JWTs, cookies or auth artifacts; keep them out of logs/evidence.

### Required PR build checks

For the current PR head, require successful `Verify / check` from this PR's `pull_request` event, a successful Vercel Preview build for that head and any additional required GitHub checks. Preview adds no mandatory website/browser check. Preserve the candidate identity and actual command/results/coverage/limits in accessible evidence; green CI alone does not prove local coverage or acceptance criteria.

Changed head/contract or a concrete base impact invalidates affected evidence. The target branch advancing alone does not require rebase, retesting or re-review of unchanged head. Missing/failing mandatory evidence cannot be reported as Pass.

## Review standards

Assess both **Requirement adherence** and **Correctness & Standards**. Map accepted AC/expected behavior to final behavior and evidence; check omissions, scope creep and impacted regression. Existing implementation can satisfy a criterion without appearing in the diff; tests passing alone do not establish coverage. Inspect final code, callers and relevant committed, staged, unstaged and untracked output; exclude unrelated work only with ownership evidence.

Check logic, authorization/security, persistence, concurrency, error handling and repository/scoped standards. UI review uses the drift categories in `docs/design/DESIGN.md`, including approved-reference comparison; prioritize API contract hierarchy drift, unsafe destructive actions and unchecked `any` where applicable.

Each finding identifies its axis, file/line or check, behavioral/UX risk and minimal required outcome. Distinguish blocking defects/missing mandatory evidence from optional suggestions. Naming preferences and speculative abstractions do not automatically block. Report a separate verdict for each axis and one handoff conclusion; optional suggestions do not prevent completion. If there are no findings, say so and disclose checks not run/residual risk. Reassess challenged findings using evidence; unresolved material contract/risk disagreements return to the human.

Reuse evidence valid for the assessed candidate and reassess changed parts and affected surrounding behavior after fixes. Check that scoped selectors cover affected behavior; report baseline gaps, pending QA/owner acceptance and coordinator-owned metadata separately from blocking findings. Run or request missing safe checks, broadening only when changes, failures or unresolved concerns warrant it.

An independent review is performed by a reviewer who did not implement the candidate. The assignment determines how that role is supplied; a technique/skill does not add another reviewer gate. Record base, HEAD and reviewed working output, without requiring a repository report, snapshot or fingerprint.

## Decisions and evidence

Investigate discoverable facts before asking for an unresolved material decision. Present the accepted outcome, affected behavior, realistic options, recommendation/trade-offs and dependent work. Routine implementation choices remain within the accepted scope and repository standards; acceptance-significant changes return to their owner. Continue meaningful independent work while dependent work waits.

When fixing an edge case would materially change a control, interaction or primary journey, compare an approach that preserves the existing experience and check whether the change is within delegated design choices. If broad wording or a newly discovered consequence raises a scope or acceptance question, escalate the unsettled decision to the coordinator with its affected AC and evidence. Retain the accepted requirement and observed evidence; do not change product behavior merely to fit a test's mechanism. Routine changes within the accepted scope need no extra approval.

Silence, elapsed time or a recommendation is not acceptance. Record accepted changes in the existing contract when authorized; otherwise retain the decision in the session and report the missing durable update. Reread the contract, update affected work and invalidate affected checks/review. A different deliverable needs a human replacement/cancellation decision.

PR/artifact evidence owns implementation and verification detail; Jira owns coordination and receiver actions. Preserve previous candidates/evidence and concurrent human content. Edit only records with established ownership; a shared API account does not prove it. Reread before editing and read back writes, especially ambiguous results before retry. Use existing durable evidence locations and link details rather than maintaining parallel reports/schema snapshots.
## Blockers and resume

For an impediment in assigned work, name the affected output and continue meaningful independent work in scope, phase and grant. Collect additional points encountered while doing that work. When a condition is needed only in a later phase, put it in that phase's handoff and finish the current output. A permitted synthetic-data effect in an assigned test environment is not itself a blocker; record the effect.

| Type | Identify and route the point |
| --- | --- |
| Requirement | Missing or conflicting scope, AC, expected behavior or design decision affecting acceptance: coordinator, with Planning when needed. Complete delegated details from the accepted direction. |
| Tooling | Broken script, test, fixture or build tool: fix within grant or identify the tool owner. |
| Vận hành (Operations) | Missing access, credentials, service, runner, mandatory deployed instructions or recovery outside grant: operator, with the coordinator for new authority. Temporary resource contention uses the applicable retry mechanism. |
| Dependency | Required producer output still missing or incorrect: give the producer the specific gap and link its record if available. Check native dependency direction. |

State observed symptoms, evidence and next check when the mechanism is unknown. Name one owner and specific action per point; if unassigned, ask the coordinator to identify the owner. Distinguish the owner of the output from the operator or other actor who must intervene.

Apply all of these conditions before moving an assigned Subtask to Blocked:

1. A required output, AC or check for this phase remains affected. Identify the contract/policy, applicable version, verification owner and why it is needed now.
2. Verify required inputs and try remedies in scope. If a required reference is unavailable, check for an accepted equivalent in the current checkout or at a canonical path/version the source owner confirms. Use it when it supports the same requirement or check. Record the exact gap when no equivalent is available or the sources conflict. List the independent work remaining in the current phase and grant, then complete it before deciding to block. Include scoped fixes, local or fixture checks, evidence and cleanup. The remaining work must require outside input or authority, or have reached the assigned skill's correction or recovery limit.
3. Open the separate blocker comment with the required output/check that cannot proceed in the current phase, the person or role who must do what, and the observable condition for continuing. For multiple points, give these three details for each point before the supporting evidence. Then record the live pre-Blocked status, type and basis of each point, alternatives checked, work completed, unresolved cleanup and why no independent work remains. Reuse existing evidence.
4. Read the live issue, save and read back the record before using an authorized native transition, then read back status. If ownership, write or transition cannot be confirmed, report the actual pending step. Preserve concurrent content and versioned history.

The coordinator owns Blocked resume to the prior native status. On an assigned resumed session, reread live contract, resolution, dependencies and environment before dependent work. For any assigned ticket still unfinished after rollout, update only authorized process/verification wording, record the accepted basis and read it back. Preserve identity, old outcome/evidence and current status. Refer requirement, scope, AC or environment-grant changes to the coordinator; keep unresolved live verification coverage and its owner visible. This does not authorize queueing, self-resume or reopening Done.

## Reading Jira dependencies

For Symphony assignments, use the `dependencies` envelope from live `jira_rest GET /rest/api/3/issue/{key}` with `fields=issuelinks`: `blocked_by` lists prerequisites and `blocks` lists downstream issues. Admission requires `complete=true` and `ready=true`; reread missing data rather than treating an empty list as clearance. Retain the envelope when parsing responses, not only `body`. Before admission, Symphony waits for the native incoming dependencies. After admission, check the output actually needed even if the producer is Done and report the specific missing or incorrect handoff. Do not read a downstream `blocks` link as an incoming prerequisite: Jira supplies both labels. The shared parser and rules are owned by the [Symphony dependency contract](https://github.com/signapse-group/signapse-symphony/blob/main/elixir/README.md#jira-dependency-contract).
