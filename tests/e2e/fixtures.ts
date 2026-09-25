/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture use() is not a React hook. */
import { randomUUID } from "node:crypto"

import { expect, test as base, type Locator } from "@playwright/test"

export async function waitForClientHandler(
  locator: Locator,
  handler: "onClick" | "onChange" = "onClick"
) {
  await expect
    .poll(
      () =>
        locator.evaluate(
          (element, handlerName) =>
            Object.entries(element).some(
              ([key, props]) =>
                key.startsWith("__reactProps$") &&
                typeof (props as Record<string, unknown>)[handlerName] ===
                  "function"
            ),
          handler
        ),
      { timeout: 60_000 }
    )
    .toBe(true)
}

const fixtureBaseUrl = `http://127.0.0.1:${process.env.FIXTURE_PORT ?? "4100"}`
const testRunCookie = "signapse_test_run_id"

type FixtureController = {
  reset(): Promise<void>
  setScenario(
    route: string,
    scenario:
      | "success"
      | "empty"
      | "short"
      | "short-then-empty"
      | "full-then-empty"
      | "short-then-empty-per-timeframe"
      | "validation-error"
      | "timeout"
      | "outage"
      | "mutation-failure"
      | "reconnect"
      | "calendar-empty"
      | "calendar-upcoming"
      | "calendar-awaiting"
      | "calendar-available",
    method?: string
  ): Promise<void>
  state(): Promise<{
    requests: Array<Record<string, unknown>>
    violations: Array<Record<string, unknown>>
    streamConnections: number
  }>
  setFeedbackScenario(
    scenario:
      | "success"
      | "pending"
      | "validation-error"
      | "mutation-failure"
      | "lifecycle-conflict"
      | "not-found"
      | "payload-too-large"
      | "storage-failure"
      | "server-failure"
      | "malformed",
    kind?: "feedback" | "compose" | "withdraw" | "review" | "erase"
  ): Promise<void>
  setPermissions(permissions: string[]): Promise<void>
}

type Fixtures = {
  fixture: FixtureController
  testRunId: string
}

async function expectOk(response: { ok(): boolean; text(): Promise<string> }) {
  if (response.ok()) return
  throw new Error(await response.text())
}

export const test = base.extend<Fixtures>({
  testRunId: async ({}, use, testInfo) => {
    const id = [
      "p0",
      testInfo.workerIndex,
      testInfo.parallelIndex,
      testInfo.testId,
      randomUUID().slice(0, 8),
    ].join("-")
    await use(id)
  },

  fixture: [
    async ({ page, request: apiRequest, testRunId }, use, testInfo) => {
      const externalRequests: string[] = []
      page.on("request", (request) => {
        try {
          const url = new URL(request.url())
          if (url.protocol === "blob:") {
            return
          }
          if (!new Set(["127.0.0.1", "localhost"]).has(url.hostname)) {
            externalRequests.push(request.url())
          }
        } catch {
          externalRequests.push(request.url())
        }
      })

      await page.context().addCookies([
        {
          name: testRunCookie,
          value: testRunId,
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.context().setExtraHTTPHeaders({
        "x-signapse-test-run-id": testRunId,
      })
      const postControl = async (
        path: string,
        data?: Record<string, unknown>
      ) => {
        const response = await apiRequest.post(`${fixtureBaseUrl}${path}`, {
          data,
          headers: { "x-signapse-test-run-id": testRunId },
        })
        await expectOk(response)
        return response
      }

      const fixture: FixtureController = {
        async reset() {
          await postControl("/__test/reset", { testRunId })
        },
        async setScenario(route, scenario, method) {
          await postControl("/__test/scenario", {
            testRunId,
            route,
            scenario,
            ...(method ? { method } : {}),
          })
        },
        async state() {
          const response = await apiRequest.get(
            `${fixtureBaseUrl}/__test/state?testRunId=${encodeURIComponent(testRunId)}`,
            { headers: { "x-signapse-test-run-id": testRunId } }
          )
          await expectOk(response)
          return response.json()
        },
        async setFeedbackScenario(scenario, kind = "feedback") {
          await postControl("/__test/feedback-scenario", {
            testRunId,
            kind,
            scenario,
          })
        },
        async setPermissions(permissions) {
          await postControl("/__test/permissions", {
            testRunId,
            permissions,
          })
        },
      }

      await fixture.reset()
      await use(fixture)

      const state = await fixture.state()
      await testInfo.attach("fixture-state.json", {
        body: JSON.stringify(state, null, 2),
        contentType: "application/json",
      })
      expect(state.violations, "P0 fixture network violations").toEqual([])
      await testInfo.attach("external-requests.json", {
        body: JSON.stringify(externalRequests, null, 2),
        contentType: "application/json",
      })
      expect(externalRequests, "P0 browser external requests").toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
