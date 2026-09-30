import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  nextServerEnvironment,
  readIntegrationEnvironment,
} from "../integration/environment.mjs"

const validEnvironment = {
  API_BASE_URL: "https://api.example.test",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture",
  CLERK_SECRET_KEY: "sk_test_fixture",
  E2E_USER_IDENTIFIER: "test@example.test",
  E2E_USER_PASSWORD: "fixture-password",
}
const directories: string[] = []
afterEach(() =>
  directories
    .splice(0)
    .forEach((directory) => rmSync(directory, { recursive: true, force: true }))
)

describe("integration environment", () => {
  it("parses account values as data and isolates the actual Next server environment", () => {
    const directory = mkdtempSync(join(tmpdir(), "signapse-integration-env-"))
    directories.push(directory)
    const appFile = join(directory, "app.env")
    const accountFile = join(directory, "e2e.env")
    writeFileSync(
      appFile,
      [
        "API_BASE_URL=https://api.example.test",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_fixture",
        "CLERK_SECRET_KEY=sk_test_fixture",
        "GITHUB_TOKEN=must-not-reach-next",
      ].join("\n")
    )
    writeFileSync(
      accountFile,
      'E2E_USER_IDENTIFIER=test@example.test\nE2E_USER_PASSWORD="spaces # $() remain literal"\n'
    )
    const configuration = readIntegrationEnvironment({
      SIGNAPSE_UI_APP_ENV: appFile,
      SIGNAPSE_UI_E2E_ENV: accountFile,
      API_BASE_URL: "https://override.example.test/",
    })
    expect(configuration.testEnvironment.E2E_USER_PASSWORD).toBe(
      "spaces # $() remain literal"
    )
    expect(configuration.testEnvironment.CLERK_PUBLISHABLE_KEY).toBe(
      "pk_test_fixture"
    )
    expect(configuration.appEnvironment.API_BASE_URL).toBe(
      "https://override.example.test"
    )
    const server = nextServerEnvironment(configuration.appEnvironment, {
      PATH: "/runtime/bin",
      E2E_USER_PASSWORD: "must-not-reach-next",
      CLERK_TESTING_TOKEN: "must-not-reach-next",
      GITHUB_TOKEN: "must-not-reach-next",
    })
    expect(server.PATH).toBe("/runtime/bin")
    expect(server.SIGNAPSE_AUTH_MODE).toBe("clerk")
    expect(server).not.toHaveProperty("E2E_USER_PASSWORD")
    expect(server).not.toHaveProperty("CLERK_TESTING_TOKEN")
    expect(server).not.toHaveProperty("GITHUB_TOKEN")
  })

  it.each([
    { SIGNAPSE_AUTH_MODE: "disabled" },
    { SIGNAPSE_E2E_MODE: "fixture" },
    { API_BASE_URL: "http://api.example.test" },
    { API_BASE_URL: "https://127.0.0.1:4100" },
    { API_BASE_URL: "https://localhost" },
    { API_BASE_URL: "https://[::1]" },
    { API_BASE_URL: "https://user:password@api.example.test" },
    { CLERK_SECRET_KEY: "sk_live_fixture" },
    { E2E_BASE_URL: "https://frontend.example.test" },
  ])(
    "refuses fixture, production keys and unexpected test targets: %j",
    (override) => {
      expect(() =>
        readIntegrationEnvironment({ ...validEnvironment, ...override })
      ).toThrow()
    }
  )

  it("checks bypass flags in referenced files even if the parent overrides them", () => {
    const directory = mkdtempSync(join(tmpdir(), "signapse-integration-env-"))
    directories.push(directory)
    const filename = join(directory, "app.env")
    writeFileSync(filename, "SIGNAPSE_AUTH_MODE=disabled\n")
    expect(() =>
      readIntegrationEnvironment({
        ...validEnvironment,
        SIGNAPSE_UI_APP_ENV: filename,
        SIGNAPSE_AUTH_MODE: "clerk",
      })
    ).toThrow(/disabled auth/)
  })

  it("fails before launching a server when credentials are absent", () => {
    const result = spawnSync(
      process.execPath,
      [resolve("tests/integration/run.mjs")],
      {
        env: { PATH: process.env.PATH, NODE_ENV: "test" },
        encoding: "utf8",
      }
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("E2E_USER_PASSWORD")
    expect(result.stderr).toContain("No integration tests were run")
    expect(result.stdout).toBe("")
  })

  it.each(["--config=playwright.config.ts", "--trace=on"])(
    "refuses runner options that change the live contract: %s",
    (option) => {
      const result = spawnSync(
        process.execPath,
        [resolve("tests/integration/run.mjs"), option],
        {
          env: { PATH: process.env.PATH, NODE_ENV: "test" },
          encoding: "utf8",
        }
      )
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("cannot be overridden")
      expect(result.stdout).toBe("")
    }
  )
})
