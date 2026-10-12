# Review and delivery to dev.signapse.cloud

The [execution policy](../.agents/skills/agent-execution-policy/references/execution-policy.md) owns phase authority, feedback, handoff and transitions. This runbook owns technical PR/CI/merge/deployment gates for the native `route-frontend` dev-with-PR profile, PR into `signapse-group/signapse-ui` main. Direct/no-PR operations use their assigned delivery scope.

## Review evidence and PR gate

Read the independent [Code Review](../.agents/skills/code-review/SKILL.md#findings-and-completion) verdict for the current head/contract. Both review axes and required local checks must be satisfied. Require the `check` job from `.github/workflows/verify.yml`, event `pull_request` for this PR/current head, successful run/job, plus actual required checks discovered on GitHub. A same-named check from another workflow/event/head, Vercel status or Pages deployment is insufficient.

Main advancing alone does not force rebase, CI rerun or another review of unchanged head. Changed head/contract or a specific base impact invalidates affected evidence. Conflict/required gap returns Progress with saved feedback; optional advice does not block. Main may temporarily be red, but post-merge quality must pass before publishing. Never waive a failed required check.

## Merge and reconcile

Reread Jira/PR/evidence. Confirm contribution, exact repo, target main, non-draft open PR, reviewed head, no blocking findings, mergeable and current PR CI. GitHub still calculating mergeability is pending: retry reads at most three times with 5/10-second backoff, then investigate; do not guess conflict or merge while unknown. With verified `PR` and `HEAD_SHA`:

```sh
gh pr merge "$PR" --repo signapse-group/signapse-ui --merge --match-head-commit "$HEAD_SHA"
gh pr view "$PR" --repo signapse-group/signapse-ui --json state,url,headRefOid,mergeCommit
```

No `--admin` or gate-bypassing `--auto`. Read back after ambiguous merge; only MERGED plus actual merge SHA confirms it. Already merged means reconcile and resume delivery without merging again. Missing independent review of a merged candidate must be completed before Done. A required fix after merge uses a new branch/PR from current main within the same unfinished contribution, retaining all earlier identities/evidence.

## CI and Vercel setup

[Verify](../.github/workflows/verify.yml) runs secret-free `pnpm test:quality` for PRs/pushes. On main push or main-only manual dispatch, deploy depends on that exact revision's successful check, pulls the existing Vercel Production environment, builds and deploys the prebuilt output. PRs/other branches never receive deploy credentials. The Vercel environment name Production here serves the accepted product **dev** domain; it is not a grant to deploy elsewhere.

Immediately before publishing, the pipeline reads main and skips `Publish checked revision` if this run is obsolete. An unavailable/invalid main read fails the gate. With serialized main runs, an old queued rerun cannot overwrite a newer release. Releases can coalesce: reconcile a checked descendant run containing this contribution when main has advanced. Keep the current phase/output; this does not add a PR rebase, review or base-SHA gate. A newer main failure can delay delivery until its owner resolves it.

[vercel.json](../vercel.json) disables Git integration auto-deploy so it cannot publish in parallel before Actions checks. See [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled) and the [Actions/prebuilt procedure](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel). CLI is pinned in the workflow, not added to application dependencies.

Before the first push/cutover, the release owner prepares GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for the existing project; verifies its Production alias is `dev.signapse.cloud`, environment/build inputs and CLI access, and removes any competing deploy hook/auto-publish path. No credentials go in source or evidence. Confirm deployed Git config and observed trigger behavior before autonomous activation; local YAML does not establish host settings. Main deploy fails closed when credentials are absent. `.vercel/` stays ignored; do not upload pulled env/build files as evidence. Existing Clerk/API inputs remain producer/hosting-owned and never enter the fixture quality lane.

This setup retains Vercel. A hosting change, new infrastructure grant or missing alias decision returns to the owner. Before activation the operator also verifies worker `gh` read/push/merge/Actions-rerun and Jira own-body/comment/transition access; interactive access does not prove service credentials.

## Wait in the same turn

Select the main run from `verify.yml` whose head build contains this merge; read event/head/jobs, not a same-named PR run. Record run ID, build, start/deadline (30 minutes), attempt and retry counter in an existing durable owned record before watching. Reconnect/restart/rerun never reset this run's total wait budget. Use short initial exec yield to get a terminal session, then `write_stdin` with empty input every 30–60 seconds, shorter than the installed watchdog, even when output is quiet. Keep the same process/turn while budget remains; CLI polling alone is not an activity signal to Symphony.

```sh
set -eu
: "${DEPLOY_RUN:?}" "${DEPLOY_WAIT_DEADLINE_EPOCH:?}"
remaining_seconds=$((DEPLOY_WAIT_DEADLINE_EPOCH - $(date +%s)))
test "$remaining_seconds" -gt 0
timeout "${remaining_seconds}s" gh run watch "$DEPLOY_RUN" --repo signapse-group/signapse-ui --interval 30 --exit-status
```

On exit/disconnect, read the run again:

```sh
gh run view "$DEPLOY_RUN" --repo signapse-group/signapse-ui --json headSha,event,status,conclusion,jobs,url,updatedAt
```

Only completed/success with successful check and a non-skipped successful **Publish checked revision step**, plus its actual Vercel deployment evidence, satisfies pipeline delivery. The deploy job can succeed with publishing skipped. Exit 124, tool failure or disconnection does not prove deploy failed. If still pending and within budget, watch/reconnect that run, not a duplicate dispatch. At deadline, investigate/classify and recover finitely; do not end the turn to obtain another unlimited scheduler budget.

## Live revision and basic loading

Build injects `SIGNAPSE_BUILD_REVISION` into Next's compiled config. Public GET `https://dev.signapse.cloud/api/build-revision` bypasses Clerk/session/backend middleware and returns only a full 40-character build SHA with no-store; absent/invalid identity returns 503/null. The workflow uses its checked `github.sha`; local uncommitted builds are not delivered evidence. Vercel CLI deployment metadata `signapseRevision` supplements this live boundary, not replaces it.

Fetch the domain identity fresh. It must match the successful checked/deployed build; verify `gh api repos/signapse-group/signapse-ui/compare/<merge>...<build>` is `identical` or `ahead`, proving build contains the merge. HEAD/merge/build can differ. Record domain/build, Vercel deployment URL/metadata from the deploy step, GitHub run/head/results, ancestry and fetch time.

Check localized sign-in HTML and referenced same-origin JS/CSS assets load, preferably in a fresh browser context, without secret-bearing evidence. This is basic application loading, not authenticated feature/QA Pass. Live feature requests, writes and external effects require the assigned operation/inputs; use producer contract/publication evidence for consumer integration when applicable. Fixtures or HTTP 200 alone do not establish full delivery.

If successful run is not yet served, store a propagation deadline 30 minutes after its completion timestamp (`updatedAt` read back after terminal completion), poll in bounded tool intervals within the same turn. Restart does not reset it. Old/missing live revision or failed basic loading prevents Done.

## Recovery and Done

Read failures retry at most three times with 5/10-second backoff. Before retrying an ambiguous mutation, read PR/run/Jira. Before a rerun, reconcile newer main runs and served identity: Actions reruns retain the original SHA/ref. Reuse a suitable checked/running descendant run containing the contribution; never rerun an obsolete release to republish an ancestor over a newer served build. A skipped obsolete publish needs descendant deployment evidence, not another rerun of that old SHA. Transient pipeline infrastructure failure permits at most two `gh run rerun` attempts for that failure/run; save counter/attempt/reason first and reread run after mutation. Restart cannot reset counters/deadlines.

Code/build/CI defects within scope return Progress via saved feedback; external input/access/decision or exhausted recovery goes Blocked only when no meaningful independent work remains. Do not repair other tickets, alter secrets/infra/DNS or rollback code/data outside grant. Main/site can remain faulty until the assigned fix or owner action; never call a failed required check a scoped Pass.

Once all applicable review/PR/local/CI/merge/deployment/live-identity/basic-load gates pass, link source → merge → run/build → environment evidence and [save/read back delivery](../.agents/skills/agent-execution-policy/references/execution-policy.md#review-và-delivery-handoff) before Done/readback. QA/parent acceptance remains separate. Docs-only output uses applicable artifact/version/checks, not automatic app-deploy requirements; an assigned runtime activation gate still applies.
