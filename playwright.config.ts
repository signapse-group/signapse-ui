import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

const fixturePort = 4100
const appPort = 3100
const resultsDir = resolve(process.cwd(), "test-results")

// These values are intentionally set in the runner process so both webServer
// children inherit the same secret-free, non-production contract.
process.env.API_BASE_URL = `http://127.0.0.1:${fixturePort}`
process.env.SIGNAPSE_AUTH_MODE = "disabled"
process.env.SIGNAPSE_E2E_MODE = "fixture"
process.env.SIGNAPSE_PUBLIC_ORIGIN = "https://dev.signapse.cloud"
process.env.SIGNAPSE_LANDING_INDEXABLE = "false"
Object.assign(process.env, { NODE_ENV: "development" })
process.env.P0_APP_PORT = String(appPort)
process.env.FIXTURE_PORT = String(fixturePort)
process.env.FIXTURE_LOG_FILE = resolve(resultsDir, "fixture.log")
process.env.APP_LOG_FILE = resolve(resultsDir, "application.log")

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/report", open: "never" }],
  ],
  webServer: [
    {
      command: "node tests/e2e/fixtures/fixture-server.mjs",
      url: `http://127.0.0.1:${fixturePort}/__test/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "node tests/e2e/next-server.mjs",
      url: `http://127.0.0.1:${appPort}/api/user`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
  use: {
    baseURL: `http://127.0.0.1:${appPort}`,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "chromium-vi",
      use: {
        ...devices["Desktop Chrome"],
        locale: "vi-VN",
        timezoneId: "Asia/Ho_Chi_Minh",
      },
    },
  ],
  metadata: {
    lane: "P0 fixture-backed functional browser coverage",
    authorization: "not-proven",
    externalDelivery: "not-tested",
  },
})
