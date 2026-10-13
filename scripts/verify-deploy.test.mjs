import assert from "node:assert/strict"
import { test } from "node:test"
import { findDeployment, verifyDeployment } from "./verify-deploy.mjs"

const merge = "a".repeat(40)
const build = "b".repeat(40)
const url = "https://signapse-build-signapse.vercel.app"
const deployment = (sha = merge, id = 1) => ({
  id,
  sha,
  environment: "Production",
  production_environment: false,
  creator: { login: "vercel[bot]" },
})

function fixture({
  deployments = [deployment()],
  states = {},
  quality = true,
  project = true,
  compare = "ahead",
  pages = [],
} = {}) {
  const requests = []
  const api = async (path) => {
    requests.push(path)
    if (path === "commits/main") return { sha: build }
    if (path.startsWith("compare/"))
      return { status: compare, commits: [{ sha: build }] }
    if (path.startsWith("deployments?")) {
      const page = Number(new URLSearchParams(path.split("?")[1]).get("page"))
      return pages.length ? (pages[page - 1] ?? []) : deployments
    }
    if (/deployments\/\d+\/statuses/.test(path)) {
      const id = Number(path.split("/")[1])
      return [{ state: states[id] ?? "success", environment_url: url }]
    }
    if (/commits\/.+\/status/.test(path))
      return {
        statuses: project
          ? [
              {
                target_url:
                  "https://vercel.com/signapse/signapse-ui/deployment",
              },
            ]
          : [],
      }
    if (path.startsWith("actions/workflows/")) {
      const sha = new URLSearchParams(path.split("?")[1]).get("head_sha")
      return {
        workflow_runs: [
          {
            id: 10,
            head_sha: sha,
            head_branch: "main",
            event: "push",
          },
        ],
      }
    }
    if (path.startsWith("actions/runs/"))
      return {
        jobs: [
          {
            name: "check",
            conclusion: quality ? "success" : "failure",
          },
        ],
      }
    assert.fail(`Unexpected request: ${path}`)
  }
  return { api, requests }
}

test("confirms exact merge and checked descendant using GitHub only", async () => {
  for (const sha of [merge, build]) {
    const { api, requests } = fixture({ deployments: [deployment(sha)] })
    const result = await findDeployment(merge, api)
    assert.equal(result.revision, sha)
    assert.equal(result.deployment, url)
    assert.equal(result.status, "PASS")
    assert(requests.every((path) => !path.includes("build-revision")))
  }
})

test("rejects invalid identity, unrelated ancestry, Preview and other projects", async () => {
  await assert.rejects(findDeployment("main", fixture().api), /40-character/)
  await assert.rejects(
    findDeployment(merge, fixture({ compare: "diverged" }).api),
    /not contained/
  )
  for (const candidate of [
    { ...deployment(), environment: "Preview" },
    { ...deployment(), creator: { login: "someone" } },
    { ...deployment(), sha: "unknown" },
  ])
    assert.equal(
      await findDeployment(merge, fixture({ deployments: [candidate] }).api),
      null
    )
  assert.equal(
    await findDeployment(merge, fixture({ project: false }).api),
    null
  )
  const { api } = fixture({ deployments: [deployment("c".repeat(40))] })
  assert.equal(
    await findDeployment(merge, (path) =>
      path.includes(`...${"c".repeat(40)}`) ? { status: "behind" } : api(path)
    ),
    null
  )
})

test("never accepts failed quality or canceled/skipped/inactive deployment", async () => {
  assert.equal(
    await findDeployment(merge, fixture({ quality: false }).api),
    null
  )
  for (const state of [
    "pending",
    "queued",
    "in_progress",
    "inactive",
    "canceled",
    "skipped",
  ]) {
    assert.equal(
      await findDeployment(merge, fixture({ states: { 1: state } }).api),
      null
    )
  }
  for (const state of ["failure", "error"]) {
    await assert.rejects(
      findDeployment(merge, fixture({ states: { 1: state } }).api),
      /Vercel deployment/
    )
  }
})

test("handles a newer pending build and succeeds when it contains a canceled merge", async () => {
  const deployments = [deployment(build, 2), deployment(merge, 1)]
  assert.equal(
    await findDeployment(
      merge,
      fixture({
        deployments,
        states: { 1: "error", 2: "pending" },
      }).api
    ),
    null
  )
  const result = await findDeployment(
    merge,
    fixture({
      deployments,
      states: { 1: "canceled", 2: "success" },
    }).api
  )
  assert.equal(result.revision, build)
})

test("finds deployment beyond the first page", async () => {
  const { api, requests } = fixture({
    pages: [
      Array.from({ length: 100 }, () => ({ environment: "Preview" })),
      [deployment()],
    ],
  })
  assert.equal((await findDeployment(merge, api)).revision, merge)
  assert(requests.some((path) => path.endsWith("page=2")))
})

test("paginates ancestry and excludes a side-branch commit that does not contain the merge", async () => {
  const side = "c".repeat(40)
  const { api } = fixture({ deployments: [deployment(side)] })
  assert.equal(
    await findDeployment(merge, async (path) => {
      if (path.includes("per_page=100&page=1") && path.startsWith("compare/")) {
        return {
          status: "ahead",
          commits: Array.from({ length: 100 }, () => ({ sha: build })),
        }
      }
      if (path.includes("per_page=100&page=2") && path.startsWith("compare/")) {
        return { status: "ahead", commits: [{ sha: side }] }
      }
      if (path === `compare/${merge}...${side}`) return { status: "diverged" }
      return api(path)
    }),
    null
  )
})

test("uses the latest quality run and never passes from an older successful run", async () => {
  const { api } = fixture()
  assert.equal(
    await findDeployment(merge, async (path) => {
      if (path.startsWith("actions/workflows/"))
        return {
          workflow_runs: [
            { id: 11, head_sha: merge, event: "push", head_branch: "main" },
            { id: 10, head_sha: merge, event: "push", head_branch: "main" },
          ],
        }
      if (path.startsWith("actions/runs/11/"))
        return { jobs: [{ name: "check", conclusion: "failure" }] }
      return api(path)
    }),
    null
  )
})

test("fails a newer deployment error even if an older deployment is still pending", async () => {
  await assert.rejects(
    findDeployment(
      merge,
      fixture({
        deployments: [deployment(build, 2), deployment(merge, 1)],
        states: { 2: "error", 1: "pending" },
      }).api
    ),
    /Vercel deployment/
  )
})

test("wait is bounded, transitions pending to success, and retries reads at most three times", async () => {
  let time = 0
  const pending = fixture({ deployments: [] }).api
  const success = fixture().api
  const options = {
    now: () => time,
    sleep: async (ms) => {
      time += ms
    },
    log: () => {},
  }
  const result = await verifyDeployment(merge, {
    ...options,
    api: (path) => (time ? success : pending)(path),
  })
  assert.equal(result.status, "PASS")
  assert.equal(time, 30_000)
  time = 0
  await assert.rejects(
    verifyDeployment(merge, { ...options, api: pending }),
    /30 minutes/
  )
  assert.equal(time, 30 * 60_000)
  time = 0
  let attempts = 0
  await assert.rejects(
    verifyDeployment(merge, {
      ...options,
      api: async () => {
        attempts++
        throw new Error("GitHub read failed: commits/main")
      },
    }),
    /GitHub read failed/
  )
  assert.equal(attempts, 3)
})
