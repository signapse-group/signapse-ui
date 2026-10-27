import assert from "node:assert/strict"
import { test } from "node:test"
import {
  readRevision,
  findDeployment,
  verifyDeployment,
} from "./verify-deploy.mjs"
const merge = "a".repeat(40),
  build = "b".repeat(40)
function api({ quality = true, compare = "ahead", latestFail = false } = {}) {
  return async (path) => {
    if (path === "commits/main") return { sha: build }
    if (path.startsWith("compare/")) return { status: compare }
    if (path.startsWith("actions/workflows/"))
      return {
        workflow_runs: [
          { id: 2, head_sha: build, event: "push", head_branch: "main" },
          ...(latestFail
            ? [{ id: 1, head_sha: build, event: "push", head_branch: "main" }]
            : []),
        ],
      }
    if (path.startsWith("actions/runs/"))
      return {
        jobs: [
          {
            name: "check",
            conclusion: quality && !latestFail ? "success" : "failure",
          },
        ],
      }
    assert.fail(path)
  }
}
test("reads only fixed dev URL, disables redirects/cache, sends bypass header", async () => {
  const revision = await readRevision(async (url, opts) => {
    assert.equal(url, "https://dev-dashboard.signapse.cloud/api/build-revision")
    assert.equal(opts.redirect, "manual")
    assert.equal(opts.cache, "no-store")
    assert.equal(opts.headers["x-vercel-protection-bypass"], "private-test")
    return Response.json({ revision: build })
  }, "private-test")
  assert.equal(revision, build)
})
test("rejects redirects, HTML, malformed JSON and missing/invalid revision without leaking response", async () => {
  for (const r of [
    new Response("private-test", {
      status: 302,
      headers: { location: "https://other.example" },
    }),
    new Response("private-test", { headers: { "content-type": "text/html" } }),
    new Response("private-test", {
      headers: { "content-type": "application/json" },
    }),
    Response.json({ revision: null }),
    Response.json({ revision: "unknown" }),
  ]) {
    await assert.rejects(
      readRevision(async () => r),
      (e) => !e.message.includes("private-test")
    )
  }
  for (const status of [429, 503])
    assert.equal(
      await readRevision(async () => new Response("", { status })),
      null
    )
  await assert.rejects(
    readRevision(async () => {
      throw new Error("private-test")
    }),
    /request unavailable/
  )
})
test("accepts checked live descendant; rejects unrelated revision and failed latest quality", async () => {
  assert.equal(
    (await findDeployment(merge, api(), async () => build)).status,
    "PASS"
  )
  assert.equal(
    (await findDeployment(build, api(), async () => build)).revision,
    build
  )
  for (const options of [
    { quality: false },
    { compare: "diverged" },
    { latestFail: true },
  ])
    assert.equal(
      await findDeployment(merge, api(options), async () => build),
      null
    )
  await assert.rejects(
    findDeployment("main", api(), async () => build),
    /40-character/
  )
  assert.equal(await findDeployment(merge, api(), async () => null), null)
})
test("bounds polling and read failures", async () => {
  let time = 0,
    attempts = 0
  const opts = {
    api: api(),
    now: () => time,
    sleep: async (ms) => {
      time += ms
    },
    log: () => {},
  }
  assert.equal(
    (
      await verifyDeployment(merge, {
        ...opts,
        read: async () => (time ? build : null),
      })
    ).status,
    "PASS"
  )
  assert.equal(time, 30000)
  time = 0
  await assert.rejects(
    verifyDeployment(merge, { ...opts, read: async () => null }),
    /30 minutes/
  )
  assert.equal(time, 1800000)
  time = 0
  await assert.rejects(
    verifyDeployment(merge, {
      ...opts,
      read: async () => {
        attempts++
        throw new Error("Dev revision read failed: unavailable")
      },
    }),
    /read failed/
  )
  assert.equal(attempts, 3)
})
