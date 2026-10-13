import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { appendFile } from "node:fs/promises"
import { resolve } from "node:path"
import { promisify } from "node:util"
import { pathToFileURL } from "node:url"

const repo = "repos/signapse-group/signapse-ui"
const shaPattern = /^[a-f0-9]{40}$/
const run = promisify(execFile)

async function github(path) {
  try {
    const { stdout } = await run("gh", ["api", `${repo}/${path}`], {
      timeout: 15_000,
      maxBuffer: 4 * 1024 * 1024,
    })
    return JSON.parse(stdout)
  } catch {
    throw new Error(`GitHub read failed: ${path}`)
  }
}

async function contains(base, head, api) {
  return (
    base === head ||
    ["identical", "ahead"].includes(
      (await api(`compare/${base}...${head}`)).status
    )
  )
}

async function qualityPassed(sha, api) {
  const runs = await api(
    `actions/workflows/verify.yml/runs?head_sha=${sha}&branch=main&event=push&per_page=100`
  )
  assert(Array.isArray(runs.workflow_runs), "Invalid workflow run response.")
  for (const workflow of runs.workflow_runs) {
    if (
      workflow.head_sha !== sha ||
      workflow.event !== "push" ||
      workflow.head_branch !== "main"
    )
      continue
    const jobs = await api(`actions/runs/${workflow.id}/jobs?per_page=100`)
    return (
      jobs.jobs?.some(
        (job) => job.name === "check" && job.conclusion === "success"
      ) === true
    )
  }
  return false
}

export async function findDeployment(expected, api = github) {
  assert(shaPattern.test(expected), "Supply the full 40-character merge SHA.")
  const main = (await api("commits/main")).sha
  assert(shaPattern.test(main), "Invalid main revision.")
  const candidates = new Set([expected])
  if (main !== expected) {
    for (let page = 1; ; page++) {
      const comparison = await api(
        `compare/${expected}...${main}?per_page=100&page=${page}`
      )
      assert(
        ["identical", "ahead"].includes(comparison.status),
        "Merge is not contained in main."
      )
      assert(
        Array.isArray(comparison.commits),
        "Invalid commit comparison response."
      )
      for (const commit of comparison.commits) {
        assert(shaPattern.test(commit.sha), "Invalid comparison revision.")
        candidates.add(commit.sha)
      }
      if (comparison.commits.length < 100) break
    }
  }
  let failure
  let pendingNewer = false
  for (let page = 1; ; page++) {
    const deployments = await api(
      `deployments?environment=Production&per_page=100&page=${page}`
    )
    assert(Array.isArray(deployments), "Invalid deployment list response.")
    for (const deployment of deployments) {
      if (
        deployment.creator?.login !== "vercel[bot]" ||
        deployment.environment !== "Production" ||
        !shaPattern.test(deployment.sha) ||
        !candidates.has(deployment.sha)
      )
        continue
      assert(Number.isSafeInteger(deployment.id), "Invalid deployment ID.")
      if (!(await contains(expected, deployment.sha, api))) continue
      const statuses = await api(
        `deployments/${deployment.id}/statuses?per_page=1`
      )
      assert(Array.isArray(statuses), "Invalid deployment status response.")
      const status = statuses[0]
      // shortcut: observed deployment prefix; update if this Vercel project is renamed.
      if (
        !status ||
        !/^https:\/\/signapse-[a-z0-9]+-signapse\.vercel\.app\/?$/.test(
          status.environment_url ?? ""
        )
      )
        continue
      const commit = await api(`commits/${deployment.sha}/status`)
      if (
        !commit.statuses?.some((item) =>
          /^https:\/\/vercel\.com\/signapse\/signapse-ui\/[^/]+$/.test(
            item.target_url ?? ""
          )
        )
      )
        continue
      if (status.state === "success") {
        if (!(await qualityPassed(deployment.sha, api))) continue
        return {
          status: "PASS",
          merge: expected,
          revision: deployment.sha,
          environment: "Production",
          deployment: status.environment_url,
          checkedAt: new Date().toISOString(),
        }
      }
      if (["queued", "pending", "in_progress"].includes(status.state)) {
        if (!failure) pendingNewer = true
      } else if (["error", "failure"].includes(status.state)) {
        failure ??= `Vercel deployment ${deployment.id} ${status.state} (${deployment.sha}).`
      }
      // Canceled/skipped/inactive is not success; a descendant may still deploy.
    }
    if (deployments.length < 100) break
  }
  if (failure && !pendingNewer) throw new Error(failure)
  return null
}

export async function verifyDeployment(
  expected,
  {
    api = github,
    now = Date.now,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    log = console.log,
  } = {}
) {
  assert(
    shaPattern.test(expected),
    "Usage: pnpm verify:deploy <full-merge-sha>"
  )
  const deadline = now() + 30 * 60_000
  let readFailures = 0
  while (now() < deadline) {
    try {
      const result = await findDeployment(expected, (path) => {
        assert(
          now() < deadline,
          "Timed out: Vercel deployment could not be confirmed within 30 minutes."
        )
        return api(path)
      })
      readFailures = 0
      if (result) {
        assert(
          now() < deadline,
          "Timed out: Vercel deployment could not be confirmed within 30 minutes."
        )
        return result
      }
    } catch (error) {
      if (
        !error.message.startsWith("GitHub read failed:") ||
        ++readFailures >= 3
      )
        throw error
      log("GitHub read unavailable; retrying within the existing wait budget.")
    }
    log(`Waiting for Vercel Production deployment containing ${expected}.`)
    await sleep(Math.min(30_000, Math.max(0, deadline - now())))
  }
  throw new Error(
    "Timed out: Vercel deployment could not be confirmed within 30 minutes."
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    assert(
      process.argv.length === 3,
      "Usage: pnpm verify:deploy <full-merge-sha>"
    )
    const result = await verifyDeployment(process.argv[2])
    console.log(JSON.stringify(result))
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `### Vercel deployment confirmed\n\nMerge: \`${result.merge}\`\n\nDeployed: \`${result.revision}\`\n\nEnvironment: ${result.environment}\n\n[Deployment](${result.deployment})\n\nConfirmed: ${result.checkedAt}\n`
      )
    }
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
