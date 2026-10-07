import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { StringDecoder } from "node:string_decoder"
import { fileURLToPath } from "node:url"

import { readIntegrationEnvironment } from "./environment.mjs"

const runnerRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const options = process.argv.slice(2)
if (options.some((option) => option !== "--list")) {
  console.error(
    "Integration runner supports --list only; auth config and artifact settings cannot be overridden."
  )
  process.exit(1)
}
let configuration
try {
  configuration = readIntegrationEnvironment()
  if (!existsSync(resolve("node_modules/next/dist/bin/next"))) {
    throw new Error(
      "Run integration tests from an installed Signapse UI workspace."
    )
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const environment = { ...process.env, ...configuration.testEnvironment }
if (!options.includes("--list")) {
  const contractCheck = spawnSync(
    process.execPath,
    [resolve(runnerRoot, "tests/e2e/contract-guard.mjs"), "--live"],
    {
      env: {
        ...process.env,
        API_BASE_URL: configuration.appEnvironment.API_BASE_URL,
      },
      stdio: "inherit",
      timeout: 30000,
    }
  )
  if (contractCheck.error || contractCheck.status !== 0) {
    console.error(
      "Live OpenAPI verification did not pass. No browser integration tests were run."
    )
    process.exit(1)
  }
}
const cli = createRequire(import.meta.url).resolve("@playwright/test/cli")
const args = [
  cli,
  "test",
  "--config",
  resolve(runnerRoot, "playwright.integration.config.ts"),
  ...options,
]
const lock = environment.SIGNAPSE_UI_INTEGRATION_LOCK
const child = spawn(
  lock ? "flock" : process.execPath,
  lock ? ["-x", "-w", "900", lock, process.execPath, ...args] : args,
  {
    env: environment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  }
)

// Only text reports are retained. Redact credentials and JWTs even on SDK errors.
const secrets = [environment.E2E_USER_PASSWORD, environment.CLERK_SECRET_KEY]
function forward(source, destination) {
  const decoder = new StringDecoder("utf8")
  let pending = ""
  function write(value) {
    for (const secret of secrets) value = value.split(secret).join("[REDACTED]")
    destination.write(
      value.replace(
        /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
        "[REDACTED JWT]"
      )
    )
  }
  source.on("data", (chunk) => {
    pending += decoder.write(chunk)
    const boundary = pending.lastIndexOf("\n")
    if (boundary >= 0) {
      write(pending.slice(0, boundary + 1))
      pending = pending.slice(boundary + 1)
    }
  })
  source.on("end", () => write(pending + decoder.end()))
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
