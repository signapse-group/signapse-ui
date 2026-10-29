# CI and Vercel reference

This reference owns CI/Vercel integration facts, operator setup and verifier behavior. Assigned phase permissions, merge, delivery recovery and handoff enter through [WORKFLOW.md](../WORKFLOW.md); shared check standards are in [CONTRIBUTING.md](../CONTRIBUTING.md#verification). Local configuration does not establish hosting or worker activation. Vercel Production is this project's product dev environment, tracking the dev branch. Main is reserved for a future product production release; no product production environment is provisioned yet.

## CI and Vercel setup

[Verify](../.github/workflows/verify.yml) runs `check` on PRs into dev/main and pushes to dev/main. Feature-branch pushes do not duplicate PR runs. Manual dispatch on dev/main reruns quality checks; it does not deploy. Deployment confirmation runs in the reviewer's workspace under the [Review runbook](runbooks/review-and-delivery.md#verify-the-delivered-build), without a waiting GitHub Actions job.

[vercel.json](../vercel.json) disables automatic Git deployments from main. Vercel builds Preview from feature branches and Production from dev using the existing dev hosting inputs; Production rebuilds merged source. Dev/main push concurrency groups include SHA so queued runs for different merges are retained; PR runs still cancel obsolete heads. Keep GitHub's default branch main and explicitly select dev for feature/fix branches, PRs and worker policy sources.

Before publication/cutover the operator verifies:
- Correct canonical repo/project/dev, Node 24.x, frozen pnpm install, `pnpm build`, existing dev Clerk/API inputs and automatic assignment of `dev-dashboard.signapse.cloud`.
- GitHub requires PRs, `check` and the observed Vercel Preview check, with correct providers/head.
- Vercel Deployment Checks gates publication on `check` only. Remove any stale requirement for the retired `deployment` job.
- Competing CLI deploy jobs/hooks are removed. Hosting settings are saved and read back; unused deployment secrets may be removed by their owner.

Without the hosting check, Vercel may publish before dev CI succeeds. Local YAML cannot enforce hosting settings. Domain configuration is an operator setup responsibility, not a per-ticket website gate. Keep current domain, environment variables and deployment protection as dev inputs; production provisioning and promotion to main need a separate coordinator release decision.

## Confirm live dev revision

After merge, the reviewer runs `pnpm verify:deploy <full-merge-sha>` in the FE workspace. Node 24 and authenticated `gh` need repository contents/actions read access. Set `SIGNAPSE_UI_VERCEL_ENV` to the absolute private dotenv file containing `VERCEL_AUTOMATION_BYPASS_SECRET`; parse it as data, never source it. Do not put this secret in Next.js env files, command arguments, logs or Git. Without the file, the verifier attempts the request without bypass.

On the provisioned Symphony host use `/opt/apps/symphony/runtime/run-fe-deploy "$PWD" "$MERGE_SHA"`. The wrapper supplies the private file path and invokes the workspace verifier. Local PowerShell can set `$env:SIGNAPSE_UI_VERCEL_ENV` to the operator's private input then run the same pnpm command.

The script:
- GETs only `https://dev-dashboard.signapse.cloud/api/build-revision`, with a 20-second request timeout, no cache and no redirect following. Bypass is sent only to this fixed origin.
- Requires HTTP 200, JSON and a full 40-character revision. HTTP 429/503 remain pending; redirects, invalid JSON or invalid revisions fail without logging response bodies or secrets.
- Requires the live revision to equal or contain the merge, be contained in dev, and have a successful latest dev-push quality check. Older/unrelated builds, main-only checks or failed checks never pass.
- Polls every 30 seconds for up to 30 minutes; consecutive network/GitHub read errors fail after three attempts. The Review runbook's saved deadline also bounds the process across resumes.
- Prints PASS with merge/live SHA, dev revision URL and confirmation time. Save the result and quality-run link in existing PR/delivery evidence.

This confirms the build served by the dev domain at that time. It does not certify login, feature behavior or later rollbacks; owner/QA acceptance remains separate. Vercel still performs Git builds; deployment-status records alone are not the completion gate.

## Worker activation

After publication, operator drains FE, updates its service checkout to dev, preserves host-specific workflow overrides, updates policy refs in reused workspaces and starts a fresh session under the existing adoption procedure. Keep task branches/output/status and the existing local browser wrapper/lock for focused tests. Reload does not replace an active session's context; source changes alone do not prove adoption or authorize canary.

The current Symphony dashboard's Update workflow button accepts only a clean main checkout. For this dev checkout use the operator rollout procedure; do not promote dev to main or remove host overrides to make that button work. No Symphony binary change is required for the branch migration.
