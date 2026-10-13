import { spawn, type ChildProcess } from "node:child_process"
import { randomUUID } from "node:crypto"
import { once } from "node:events"
import { createServer } from "node:net"
import { resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"

import { http, passthrough } from "msw"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { server } from "../support/msw"

let fixtureProcess: ChildProcess
let baseUrl: string

beforeAll(async () => {
  const reservation = createServer().listen(0, "127.0.0.1")
  await once(reservation, "listening")
  const address = reservation.address()
  if (!address || typeof address === "string")
    throw new Error("No fixture port")
  await new Promise<void>((done) => reservation.close(() => done()))
  baseUrl = `http://127.0.0.1:${address.port}`
  fixtureProcess = spawn(
    process.execPath,
    [resolve("tests/e2e/fixtures/fixture-server.mjs")],
    {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "test",
        FIXTURE_PORT: String(address.port),
      },
    }
  )
  const [output] = await once(fixtureProcess.stdout!, "data")
  expect(output.toString()).toContain("P0 fixture server listening")
})

beforeEach(() => server.use(http.all(`${baseUrl}/*`, () => passthrough())))

afterAll(async () => {
  if (!fixtureProcess || fixtureProcess.exitCode !== null) return
  const exited = once(fixtureProcess, "exit")
  fixtureProcess.kill()
  await exited
})

function run() {
  const testRunId = randomUUID()
  const headers = { "x-signapse-test-run-id": testRunId }
  return {
    get: (path: string, signal?: AbortSignal) =>
      fetch(`${baseUrl}${path}`, { headers, signal }),
    async control(path: string, data: Record<string, unknown> = {}) {
      const response = await fetch(`${baseUrl}/__test/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      expect(response.ok).toBe(true)
    },
    async state() {
      return (await fetch(`${baseUrl}/__test/state`, { headers })).json()
    },
  }
}

describe("P0 fixture response lifetime", () => {
  it.each(["delayed", "pending"])(
    "holds %s until the test changes its scenario, isolated by run",
    async (scenario) => {
      const fixture = run()
      const other = run()
      const controller = new AbortController()
      const controlPath =
        scenario === "delayed" ? "scenario" : "feedback-scenario"
      const path =
        scenario === "delayed"
          ? "/contact-requests"
          : "/me/feedback-submissions"
      const data = { route: path, method: "GET", scenario }
      await fixture.control(controlPath, data)
      let settled = false
      const response = fixture.get(path, controller.signal).then((result) => {
        settled = true
        return result
      })
      // Attach rejection handling before cleanup aborts a failed assertion.
      void response.catch(() => {})
      try {
        await expect
          .poll(async () => (await fixture.state()).requests.length)
          .toBe(1)
        await delay(500)
        expect(settled).toBe(false)
        expect((await other.get(path)).ok).toBe(true)
        await fixture.control(controlPath, { ...data, scenario: "success" })
        expect((await response).ok).toBe(true)
        expect((await fixture.state()).pendingRequests).toBe(0)
      } finally {
        controller.abort()
      }
    }
  )

  it("removes aborted pending requests and closes them on reset", async () => {
    const fixture = run()
    await fixture.control("scenario", {
      route: "/contact-requests",
      method: "GET",
      scenario: "delayed",
    })
    const controller = new AbortController()
    const response = fixture.get("/contact-requests", controller.signal)
    void response.catch(() => {})
    try {
      await expect
        .poll(async () => (await fixture.state()).pendingRequests)
        .toBe(1)
      controller.abort()
      await expect(response).rejects.toThrow()
      await expect
        .poll(async () => (await fixture.state()).pendingRequests)
        .toBe(0)

      const resetResponse = fixture.get("/contact-requests")
      await expect
        .poll(async () => (await fixture.state()).pendingRequests)
        .toBe(1)
      await fixture.control("reset")
      expect(await (await resetResponse).text()).toBe("")
      expect((await fixture.state()).requests).toEqual([])
    } finally {
      controller.abort()
      await fixture.control("reset")
    }
  })

  it("disconnects once for reconnect, then keeps SSE open until reset", async () => {
    const fixture = run()
    await fixture.control("scenario", {
      route: "/market-charts/live",
      method: "GET",
      scenario: "reconnect",
    })
    const path = "/market-charts/live?assetId=101&timeframe=1h"
    const first = await fixture.get(path)
    expect(await first.text()).toContain("RECONNECTING")
    const controller = new AbortController()
    try {
      const stream = await fixture.get(path, controller.signal)
      const reader = stream.body!.getReader()
      let events = ""
      while (!events.includes("event: price")) {
        const chunk = await reader.read()
        expect(chunk.done).toBe(false)
        events += new TextDecoder().decode(chunk.value)
      }
      expect(events).toContain("CONNECTED")
      let settled = false
      const next = reader.read().then((chunk) => {
        settled = true
        return chunk
      })
      void next.catch(() => {})
      await delay(550)
      expect(settled).toBe(false)
      expect((await fixture.state()).streamConnections).toBe(2)
      await fixture.control("reset")
      expect((await next).done).toBe(true)
    } finally {
      controller.abort()
      await fixture.control("reset")
    }
  })
})
