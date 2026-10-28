import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { parseEnv } from "node:util"
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

const revisionUrl = "https://dev-dashboard.signapse.cloud/api/build-revision"

export async function readRevision(request = fetch, secret) {
  let response
  try {
    response = await request(revisionUrl, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: secret ? { "x-vercel-protection-bypass": secret } : {},
    })
  } catch {
    throw new Error("Dev revision read failed: request unavailable")
  }
  if ([429, 503].includes(response.status)) return null
  assert(
    response.status === 200,
    "Dev revision HTTP " + response.status + "; redirects are not followed."
  )
  assert(
    response.headers.get("content-type")?.includes("application/json"),
    "Invalid revision content type."
  )
  let body
  try {
    body = await response.json()
  } catch {
    throw new Error("Invalid revision JSON.")
  }
  assert(shaPattern.test(body?.revision ?? ""), "Invalid live revision.")
  return body.revision
}

export async function findDeployment(
  expected,
  api = github,
  read = readRevision
) {
  assert(shaPattern.test(expected), "Supply the full 40-character merge SHA.")
  const revision = await read()
  if (!revision) return null
  assert(shaPattern.test(revision), "Invalid live revision.")
  const main = (await api("commits/main")).sha
  assert(shaPattern.test(main), "Invalid main revision.")
  if (
    !(await contains(expected, revision, api)) ||
    !(await contains(revision, main, api))
  )
    return null
  if (!(await qualityPassed(revision, api))) return null
  return {
    status: "PASS",
    merge: expected,
    revision,
    environment: "dev",
    deployment: revisionUrl,
    checkedAt: new Date().toISOString(),
  }
}

export async function verifyDeployment(
  expected,
  {
    api = github,
    read = readRevision,
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
      const result = await findDeployment(
        expected,
        (path) => {
          assert(
            now() < deadline,
            "Timed out: Live dev revision could not be confirmed within 30 minutes."
          )
          return api(path)
        },
        read
      )
      readFailures = 0
      if (result) {
        assert(
          now() < deadline,
          "Timed out: Live dev revision could not be confirmed within 30 minutes."
        )
        return result
      }
    } catch (error) {
      if (
        !/^GitHub read failed:|^Dev revision read failed:/.test(
          error.message
        ) ||
        ++readFailures >= 3
      )
        throw error
      log(
        "Delivery read unavailable; retrying within the existing wait budget."
      )
    }
    log(`Waiting for live dev revision containing ${expected}.`)
    await sleep(Math.min(30_000, Math.max(0, deadline - now())))
  }
  throw new Error(
    "Timed out: Live dev revision could not be confirmed within 30 minutes."
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
    let secret
    if (process.env.SIGNAPSE_UI_VERCEL_ENV) {
      try {
        secret = parseEnv(
          await readFile(process.env.SIGNAPSE_UI_VERCEL_ENV, "utf8")
        ).VERCEL_AUTOMATION_BYPASS_SECRET
      } catch {
        throw new Error("Cannot read Vercel bypass input.")
      }
      assert(secret?.trim(), "Vercel bypass input is empty.")
    }
    const result = await verifyDeployment(process.argv[2], {
      read: () => readRevision(fetch, secret),
    })
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
