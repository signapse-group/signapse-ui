import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { StringDecoder } from "node:string_decoder"
import { fileURLToPath } from "node:url"

import { fixtureContracts } from "../e2e/fixtures/contract-registry.mjs"
import {
  parseContractGuardOptions,
  selectContractsByScope,
} from "../e2e/contract-guard.mjs"
import { readIntegrationEnvironment } from "./environment.mjs"
import {
  buildPlaywrightGrep,
  discoverIntegrationCases,
  integrationRunnerVersion,
  parseIntegrationOptions,
  readSourceIdentity,
  selectIntegrationCases,
} from "./selection.mjs"

const runnerRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const applicationRoot = resolve(process.cwd())
const processOptions = process.argv.slice(2)
const rawOptions =
  processOptions[0] === "--" ? processOptions.slice(1) : processOptions

function createDiscoveryEnvironment() {
  return {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    TMPDIR: process.env.TMPDIR ?? "",
    CI: process.env.CI ?? "",
    NODE_ENV: "development",
    API_BASE_URL: "https://contract-discovery.invalid",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_discovery",
    CLERK_SECRET_KEY: "sk_test_discovery",
    E2E_USER_IDENTIFIER: "discovery@example.invalid",
    E2E_USER_PASSWORD: "discovery-only",
    E2E_BASE_URL: "http://localhost:3110",
    SIGNAPSE_AUTH_MODE: "clerk",
    SIGNAPSE_E2E_MODE: "integration",
  }
}

if (rawOptions.length === 1 && rawOptions[0] === "--version") {
  console.log(`signapse-fe-integration/${integrationRunnerVersion}`)
  process.exit(0)
}
if (rawOptions.length === 1 && rawOptions[0] === "--help") {
  console.log(
    [
      `Signapse FE integration runner v${integrationRunnerVersion}`,
      "Usage: pnpm test:integration [--full | --scope 'METHOD /path'] [--case 'tests/integration/file#title'] [--list]",
      "Selectors are exact. Runner config, auth environment, and artifacts are fixed.",
    ].join("\n")
  )
  process.exit(0)
}

let options
let configuration
let applicationIdentity
let suiteIdentity
let selectedCases = []
let discoveredCases = []
let playwrightCli
try {
  options = parseIntegrationOptions(rawOptions)
  selectContractsByScope(fixtureContracts, options.scope)
  if (options.scope !== undefined) {
    parseContractGuardOptions(["--scope", options.scope])
  }
  if (
    !existsSync(resolve(applicationRoot, "node_modules/next/dist/bin/next"))
  ) {
    throw new Error(
      "Run integration tests from an installed Signapse UI workspace."
    )
  }
  applicationIdentity = readSourceIdentity(applicationRoot)
  suiteIdentity = readSourceIdentity(runnerRoot)
  playwrightCli = createRequire(import.meta.url).resolve("@playwright/test/cli")
  discoveredCases = discoverIntegrationCases({
    applicationRoot,
    environment: createDiscoveryEnvironment(),
    playwrightCli,
    suiteRoot: runnerRoot,
  })
  selectedCases = selectIntegrationCases(discoveredCases, options.cases)
  if (!options.list) configuration = readIntegrationEnvironment()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const contractScope = selectContractsByScope(fixtureContracts, options.scope)
console.log(
  `Integration runner: signapse-fe-integration/${integrationRunnerVersion}`
)
console.log(
  `Application source: ${applicationIdentity.revision} (${applicationIdentity.worktree})`
)
console.log(
  `Suite source: ${suiteIdentity.revision} (${suiteIdentity.worktree})`
)
console.log(
  `Contract scope: ${options.scope === undefined ? `full (${contractScope.length} operations)` : contractScope.map((contract) => `${contract.method} ${contract.path}`).join(", ")}`
)
console.log(
  `Browser cases: ${options.cases.length ? selectedCases.map(({ id }) => id).join(", ") : `full (${discoveredCases.length || "not listed"})`}`
)
if (options.list) {
  console.log("Discovered browser case selectors:")
  for (const { id } of discoveredCases) console.log(`- ${id}`)
}

const environment = options.list
  ? createDiscoveryEnvironment()
  : { ...process.env, ...configuration.testEnvironment }
if (!options.list) {
  const contractOptions = [
    "--live",
    ...(options.scope === undefined ? ["--full"] : ["--scope", options.scope]),
  ]
  const contractCheck = spawnSync(
    process.execPath,
    [resolve(runnerRoot, "tests/e2e/contract-guard.mjs"), ...contractOptions],
    {
      env: {
        ...process.env,
        API_BASE_URL: configuration.appEnvironment.API_BASE_URL,
      },
      stdio: "inherit",
      timeout: 30_000,
    }
  )
  if (contractCheck.error || contractCheck.status !== 0) {
    console.error(
      "Live OpenAPI verification did not pass. No browser integration tests were run."
    )
    process.exit(1)
  }
} else {
  console.log("Live OpenAPI preflight: not run (case discovery only).")
}

const args = [
  playwrightCli,
  "test",
  "--config",
  resolve(runnerRoot, "playwright.integration.config.ts"),
  ...(selectedCases.length
    ? ["--grep", buildPlaywrightGrep(selectedCases, discoveredCases)]
    : []),
  ...(options.list ? ["--list"] : []),
]
const lock = environment.SIGNAPSE_UI_INTEGRATION_LOCK
const child = spawn(
  lock ? "flock" : process.execPath,
  lock ? ["-x", "-w", "900", lock, process.execPath, ...args] : args,
  {
    cwd: applicationRoot,
    env: environment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  }
)

// Keep credential-bearing test output redacted, including when a secret is split across chunks.
const secrets = [
  environment.E2E_USER_PASSWORD,
  environment.CLERK_SECRET_KEY,
].filter(Boolean)
function redact(value) {
  for (const secret of secrets) value = value.split(secret).join("[REDACTED]")
  return value.replace(
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    "[REDACTED JWT]"
  )
}
function forward(source, destination) {
  const decoder = new StringDecoder("utf8")
  let pending = ""
  source.on("data", (chunk) => {
    pending += decoder.write(chunk)
    const boundary = pending.lastIndexOf("\n")
    if (boundary >= 0) {
      destination.write(redact(pending.slice(0, boundary + 1)))
      pending = pending.slice(boundary + 1)
    }
  })
  source.on("end", () => destination.write(redact(pending + decoder.end())))
}
forward(child.stdout, process.stdout)
forward(child.stderr, process.stderr)
child.on("error", () => {
  console.error(
    "Unable to start integration runner or acquire the configured host lock."
  )
  process.exitCode = 1
})
child.on("close", (code) => {
  process.exitCode = code ?? 1
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.pid) return
    try {
      if (process.platform === "win32") child.kill(signal)
      else process.kill(-child.pid, signal)
    } catch {
      /* The child may have already exited. */
    }
  })
}
