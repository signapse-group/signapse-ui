import { defineConfig, devices } from "@playwright/test"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { DEFAULT_APP_LOCALE } from "./app/lib/i18n/config"
import { readIntegrationEnvironment } from "./tests/integration/environment.mjs"

const configuration = readIntegrationEnvironment()
Object.assign(process.env, configuration.testEnvironment)
const runnerRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: "./tests/integration",
  outputDir: resolve(process.cwd(), "test-results/integration"),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: "list",
  preserveOutput: "never",
  webServer: {
    command: `node "${resolve(runnerRoot, "tests/integration/next-server.mjs")}"`,
    cwd: process.cwd(),
    url: `${configuration.baseUrl}/${DEFAULT_APP_LOCALE}/sign-in`,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: configuration.baseUrl,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "clerk-setup", testMatch: "clerk.setup.ts" },
    {
      name: "authenticated-backend",
      testMatch: "*.spec.ts",
      dependencies: ["clerk-setup"],
    },
  ],
  metadata: {
    lane: "P1 password authentication and public backend smoke",
    mutations: "none",
  },
})
