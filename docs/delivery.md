# Review and Vercel delivery

The [execution policy](../.agents/skills/agent-execution-policy/references/execution-policy.md) owns phase authority, feedback and transitions. This runbook owns FE checks, merge and delivery. Decision accepted on 2026-10-13: dev delivery ends when Vercel confirms Production deployment containing the contribution; owner/QA verifies domains, website, authentication and features. Production is Vercel's environment name for this project's product dev environment. Local configuration does not establish hosting or worker activation.

## Review evidence and PR gate

For the current PR head, require successful `Verify / check` for this PR's `pull_request` event, successful Vercel Preview build for that head and any additional required GitHub checks. Review requirement coverage and correctness under [Code Review](../.agents/skills/code-review/SKILL.md#findings-and-completion). Preview adds no mandatory website/browser check.

Run focused local tests under the [testing guide](testing/browser-tests.md#selecting-checks-by-change-scope). CI owns the full lightweight `pnpm test:quality` gate. Full build/browser regression is `pnpm test:full` when requested or affected coverage requires it. Failed required checks remain failures.

Main advancing alone does not require rebase/retesting unchanged head. Changed head/contract or concrete base impact invalidates affected evidence. Conflicts/blocking findings return Progress; optional suggestions do not block.

## Merge and reconcile

Reread live assignment, reviewed PR/head, checks, base main, open/non-draft state and mergeability. Pending mergeability permits three reads with 5/10-second backoff. With verified `PR` and `HEAD_SHA`:

```sh
gh pr merge "$PR" --repo signapse-group/signapse-ui --merge --match-head-commit "$HEAD_SHA"
gh pr view "$PR" --repo signapse-group/signapse-ui --json state,url,headRefOid,mergeCommit
```

No admin bypass. Read back ambiguous writes. MERGED and actual merge SHA confirm merge. Already merged means resume delivery; reviewer does not edit implementation/conflicts. An in-scope fix after merge uses a follow-up PR from main.

## CI and Vercel setup

[Verify](../.github/workflows/verify.yml) runs `check` on PRs into main and main pushes. Branch pushes do not duplicate PR runs. Main additionally runs `deployment` after `check`; it installs Node only and reads GitHub through `gh`. Permissions are contents/deployments/statuses/actions read, with `GH_TOKEN` scoped to that step. No app env, Vercel token, browser installation or release artifact. Main manual dispatch checks existing delivery; it does not deploy.

[vercel.json](../vercel.json) enables Git deployments. Vercel builds Preview from branches and Production from main using hosting env; Production rebuilds merged source. Main concurrency groups include SHA so queued runs for different merges are retained; PR runs still cancel obsolete heads.

Before publication/cutover the operator verifies:
- Correct canonical repo/project/main, Node 24.x, frozen pnpm install, `pnpm build`, valid hosting Clerk/API inputs and automatic domain assignment.
- GitHub requires PRs, `check` and the observed Vercel Preview check, with correct providers/head.
- Vercel Deployment Checks gates publication on `check` only. Do not select `deployment` or overall Verify as a prerequisite: it waits for publication and would deadlock.
- Competing CLI deploy jobs/hooks are removed. Hosting settings are saved and read back; unused deployment secrets may be removed by their owner.

Without the hosting check, Vercel may publish before main CI succeeds. Local YAML cannot enforce hosting settings. Domain configuration is an operator setup responsibility, not a per-ticket website gate.

## Confirm deployment through GitHub

After merge, select the main Verify run for a SHA containing that merge. Persist run/build, start time, deadline and attempt in the existing owned delivery record before waiting. Reuse the run and saved deadline across resume; never reset the wait budget. Agent uses:

```sh
gh run watch "$VERIFY_RUN" --repo signapse-group/signapse-ui --interval 30 --exit-status
gh run view "$VERIFY_RUN" --repo signapse-group/signapse-ui --json headSha,status,conclusion,jobs,url
```

Bound the process by the saved remaining deadline (30 minutes per tracked run). Use short tool yields and read the same terminal every 30–60 seconds during quiet waits. Disconnect/timeout is not proof of deploy failure: reread live run and reconnect within remaining budget.

The `deployment` job calls `node scripts/verify-deploy.mjs "$GITHUB_SHA"`; optional read-only local diagnosis uses `pnpm verify:deploy <full-merge-sha>` with authenticated `gh`. The script:
- Reads canonical GitHub Deployments, latest deployment status and commit/project metadata; requires Vercel creator, Production environment and this project's observed deployment URL prefix. GitHub's `production_environment` boolean is not authoritative for this integration.
- Accepts the merge or a main descendant containing it, with a successful `check` for that deployed SHA. A newer release can contain several tickets; canceled/skipped alone never proves delivery.
- Polls every 30 seconds for up to 30 minutes; retries consecutive GitHub read errors at most three times. Wrong project/Preview/unrelated revisions are not candidates. Failure/error fails unless a replacement is pending or already confirmed; missing evidence times out explicitly.
- Writes PASS with merge/deployed SHA, Vercel environment, deployment URL and confirmation time to logs/Actions summary. No website HTTP request, browser, deployment or rollback.

For handoff require actual success of both `check` and `deployment`, not a skipped job or overall green status alone. Preserve the result's deployed SHA/URL, compare merge to that SHA when watching a descendant run, and link the Actions run in existing evidence. Never infer deployed SHA from local HEAD.

## Recovery and Done

Pending within budget stays In Review. Reread runs/deployments before retries; do not create duplicate runs. Code/build/check defects in scope return Progress with actionable feedback. Temporary infrastructure failure permits at most two reruns with reasons/attempt counters saved; reread ambiguous results and retain deadline. External input/access or exhausted wait goes Blocked only when no meaningful independent work remains. No infra/secrets/DNS changes or rollback outside grant.

After independent review, required PR checks/Preview, merge, successful main quality/deployment and saved/read-back [delivery handoff](../.agents/skills/agent-execution-policy/references/execution-policy.md#review-và-delivery-handoff), transition/read back Done. Handoff states Vercel Production revision and run/deployment evidence. Docs-only uses artifact/version/checks; runtime activation remains required when assigned.

Vercel success is deployment evidence at confirmation time; it does not certify current domain mapping, basic loading, authentication, feature correctness or later rollbacks. Owner/QA checks those under their own scope/inputs. `/api/build-revision` remains available for their diagnosis; it is not a dev delivery gate.

## Worker activation

After publication, operator updates FE service checkout/reused workspace instructions and starts a fresh session under the existing adoption procedure. Keep output/status and existing local browser wrapper/lock for focused tests. Reload does not replace an active session's context; source changes alone do not prove adoption or authorize canary.
