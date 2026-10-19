# CI and Vercel reference

This reference owns CI/Vercel integration facts, operator setup and verifier behavior. Assigned phase permissions, merge, delivery recovery and handoff enter through [WORKFLOW.md](../WORKFLOW.md); shared check standards are in [CONTRIBUTING.md](../CONTRIBUTING.md#verification). Local configuration does not establish hosting or worker activation. Vercel Production is this project's product dev environment.

## CI and Vercel setup

[Verify](../.github/workflows/verify.yml) runs `check` on PRs into main and main pushes. Branch pushes do not duplicate PR runs. Main manual dispatch reruns quality checks; it does not deploy. Deployment confirmation runs in the reviewer's workspace under the [Review runbook](runbooks/review-and-delivery.md#verify-the-delivered-build), without a waiting GitHub Actions job.

[vercel.json](../vercel.json) enables Git deployments. Vercel builds Preview from branches and Production from main using hosting env; Production rebuilds merged source. Main concurrency groups include SHA so queued runs for different merges are retained; PR runs still cancel obsolete heads.

Before publication/cutover the operator verifies:
- Correct canonical repo/project/main, Node 24.x, frozen pnpm install, `pnpm build`, valid hosting Clerk/API inputs and automatic domain assignment.
- GitHub requires PRs, `check` and the observed Vercel Preview check, with correct providers/head.
- Vercel Deployment Checks gates publication on `check` only. Remove any stale requirement for the retired `deployment` job.
- Competing CLI deploy jobs/hooks are removed. Hosting settings are saved and read back; unused deployment secrets may be removed by their owner.

Without the hosting check, Vercel may publish before main CI succeeds. Local YAML cannot enforce hosting settings. Domain configuration is an operator setup responsibility, not a per-ticket website gate.

## Confirm deployment through GitHub

The reviewer runs `pnpm verify:deploy <full-merge-sha>` in the FE workspace after merge, using Node and authenticated `gh` with repository contents/deployments/statuses/actions read access. No application environment, Vercel token or browser installation is needed. The same command supports read-only local diagnosis. The script:
- Reads canonical GitHub Deployments, latest deployment status and commit/project metadata; requires Vercel creator, Production environment and this project's observed deployment URL prefix. GitHub's `production_environment` boolean is not authoritative for this integration.
- Accepts the merge or a main descendant containing it, with a successful `check` for that deployed SHA. A newer release can contain several tickets; canceled/skipped alone never proves delivery.
- Polls every 30 seconds for up to 30 minutes; retries consecutive GitHub read errors at most three times. Wrong project/Preview/unrelated revisions are not candidates. Failure/error fails unless a replacement is pending or already confirmed; missing evidence times out explicitly.
- Prints PASS with merge/deployed SHA, Vercel environment, deployment URL and confirmation time. Save this result with the main quality-run link in existing PR/delivery evidence. No website HTTP request, browser, deployment or rollback.

Vercel success is deployment evidence at confirmation time; it does not certify current domain mapping, basic loading, authentication, feature correctness or later rollbacks. Owner/QA checks those under their own scope/inputs. `/api/build-revision` remains available for their diagnosis; it is not a dev delivery gate.

## Worker activation

After publication, operator updates FE service checkout/reused workspace instructions and starts a fresh session under the existing adoption procedure. Keep output/status and existing local browser wrapper/lock for focused tests. Reload does not replace an active session's context; source changes alone do not prove adoption or authorize canary.
