import { spawnSync } from "node:child_process"
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  nextServerEnvironment,
  readIntegrationEnvironment,
} from "../integration/environment.mjs"
import {
  buildPlaywrightGrep,
  buildPlaywrightSelectionArgs,
  discoverIntegrationCases,
  parseIntegrationOptions,
  parsePlaywrightTestList,
  selectIntegrationCases,
} from "../integration/selection.mjs"

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

  it("parses scoped and full runner options without exposing Playwright config overrides", () => {
    expect(parseIntegrationOptions([])).toEqual({
      cases: [],
      full: true,
      list: false,
      scope: undefined,
    })
    expect(
      parseIntegrationOptions([
        "--scope",
        "GET /me,GET /me/notes",
        "--case",
        "tests/integration/auth-and-backend.spec.ts:118#password session",
      ])
    ).toMatchObject({
      full: false,
      scope: "GET /me,GET /me/notes",
      cases: [
        "tests/integration/auth-and-backend.spec.ts:118#password session",
      ],
    })
    expect(() => parseIntegrationOptions(["--scope", ""])).toThrow(/empty/i)
    expect(() =>
      parseIntegrationOptions(["--scope", "GET /me", "--full"])
    ).toThrow()
    expect(() => parseIntegrationOptions(["--config=other.ts"])).toThrow(
      /only|option/i
    )
    expect(() => parseIntegrationOptions(["--trace=on"])).toThrow()
  })

  it("accepts exact discovered integration cases and rejects empty or missing selectors", () => {
    const discovered = parsePlaywrightTestList(
      [
        "Listing tests:",
        "  [authenticated-backend] › tests/integration/auth-and-backend.spec.ts:10:1 › password session reaches the backend",
        "  [clerk-setup] › tests/integration/clerk.setup.ts:3:1 › configure Clerk testing token",
      ].join("\n"),
      resolve(".")
    )

    expect(
      selectIntegrationCases(discovered, [
        "tests/integration/auth-and-backend.spec.ts:10#[authenticated-backend] password session reaches the backend",
      ])
    ).toHaveLength(1)
    expect(() => selectIntegrationCases(discovered, [""])).toThrow(/empty/i)
    expect(() =>
      selectIntegrationCases(discovered, [
        "tests/integration/missing.spec.ts:1#missing",
      ])
    ).toThrow(/no integration case/i)
    const grep = buildPlaywrightGrep(
      selectIntegrationCases(discovered, [
        "tests/integration/auth-and-backend.spec.ts:10#[authenticated-backend] password session reaches the backend",
      ]),
      discovered
    )
    expect(grep).toContain(
      "^authenticated-backend auth-and-backend\\.spec\\.ts password session reaches the backend$"
    )
    expect(grep).toContain(
      "^clerk-setup clerk\\.setup\\.ts configure Clerk testing token$"
    )
    expect(
      buildPlaywrightSelectionArgs(
        selectIntegrationCases(discovered, [
          "tests/integration/auth-and-backend.spec.ts:10#[authenticated-backend] password session reaches the backend",
        ]),
        resolve(".")
      )
    ).toEqual([
      "--project=authenticated-backend",
      resolve("tests/integration/auth-and-backend.spec.ts:10"),
    ])
  })

  it("preserves project and source-line identity when Playwright cases collide", () => {
    const root = resolve(".")
    const discovered = parsePlaywrightTestList(
      [
        "  [chromium] › duplicate.spec.ts:10:1 › same title",
        "  [firefox] › duplicate.spec.ts:10:1 › same title",
        "  [chromium] › duplicate.spec.ts:18:1 › same title",
      ].join("\n"),
      root
    )

    expect(discovered.map(({ id }) => id)).toEqual([
      "tests/integration/duplicate.spec.ts:10#[chromium] same title",
      "tests/integration/duplicate.spec.ts:10#[firefox] same title",
      "tests/integration/duplicate.spec.ts:18#[chromium] same title",
    ])
    const selected = selectIntegrationCases(discovered, [
      "tests/integration/duplicate.spec.ts:10#[firefox] same title",
    ])
    expect(selected).toMatchObject([{ project: "firefox", lineNumber: 10 }])
    expect(buildPlaywrightSelectionArgs(selected, root)).toEqual([
      "--project=firefox",
      resolve("tests/integration/duplicate.spec.ts:10"),
    ])
    expect(() =>
      parsePlaywrightTestList(
        [
          "  [chromium] › duplicate.spec.ts:10:1 › same title",
          "  [chromium] › duplicate.spec.ts:10:1 › same title",
        ].join("\n"),
        root
      )
    ).toThrow(/duplicate case identity/i)
  })

  it("discovers cases from the workspace suite instead of a stable checkout", () => {
    const root = mkdtempSync(join(tmpdir(), "signapse-integration-suites-"))
    directories.push(root)
    const stableSuite = join(root, "stable-suite")
    const workspaceSuite = join(root, "workspace-suite")
    const nodeModules = resolve("node_modules")
    const playwrightCli = createRequire(import.meta.url).resolve(
      "@playwright/test/cli"
    )

    for (const [suite, caseName] of [
      [stableSuite, "legacy stable case"],
      [workspaceSuite, "new workspace case"],
    ]) {
      mkdirSync(join(suite, "tests/integration"), { recursive: true })
      symlinkSync(nodeModules, join(suite, "node_modules"), "dir")
      writeFileSync(
        join(suite, "playwright.integration.config.ts"),
        "export default { testDir: './tests/integration' }\n"
      )
      writeFileSync(
        join(suite, "tests/integration/workspace.spec.ts"),
        `import { test } from "@playwright/test"\n\ntest(${JSON.stringify(caseName)}, async () => {})\n`
      )
    }

    const cases = discoverIntegrationCases({
      applicationRoot: workspaceSuite,
      environment: { PATH: process.env.PATH },
      playwrightCli,
      suiteRoot: workspaceSuite,
    })

    expect(cases.map(({ id }) => id)).toEqual([
      "tests/integration/workspace.spec.ts:3#[default] new workspace case",
    ])
    expect(cases.map(({ id }) => id)).not.toContain(
      "tests/integration/workspace.spec.ts:3#[default] legacy stable case"
    )
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

  it("lists cases from this workspace without private credentials or a live preflight", () => {
    const result = spawnSync(
      process.execPath,
      [resolve("tests/integration/run.mjs"), "--list"],
      {
        env: { PATH: process.env.PATH, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 30_000,
      }
    )

    expect(result.status).toBe(0)
    expect(result.stdout).toContain("signapse-fe-integration/2")
    expect(result.stdout).toMatch(/Application source: [a-f0-9]{40} \(/)
    expect(result.stdout).toMatch(/Suite source: [a-f0-9]{40} \(/)
    expect(result.stdout).toContain("Live OpenAPI preflight: not run")
    expect(result.stdout).toContain("anonymous visitors")
    expect(result.stdout).toContain(
      "tests/integration/auth-and-backend.spec.ts:99#[authenticated-backend] anonymous visitors can only open the localized login"
    )
    expect(result.stderr).toBe("")
  })

  it("rejects unmatched operation and case selectors before checking live inputs", () => {
    const missingOperation = spawnSync(
      process.execPath,
      [resolve("tests/integration/run.mjs"), "--scope", "GET /missing"],
      {
        env: { PATH: process.env.PATH, NODE_ENV: "test" },
        encoding: "utf8",
      }
    )
    expect(missingOperation.status).toBe(1)
    expect(missingOperation.stderr).toContain("No fixture operation matches")
    expect(missingOperation.stderr).not.toContain("E2E_USER_PASSWORD")

    const missingCase = spawnSync(
      process.execPath,
      [
        resolve("tests/integration/run.mjs"),
        "--case",
        "tests/integration/missing.spec.ts:1#missing case",
      ],
      {
        env: { PATH: process.env.PATH, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 30_000,
      }
    )
    expect(missingCase.status).toBe(1)
    expect(missingCase.stderr).toContain("No integration case matches")
    expect(missingCase.stderr).not.toContain("E2E_USER_PASSWORD")
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
