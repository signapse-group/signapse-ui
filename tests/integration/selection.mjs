import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { basename, relative, resolve, sep } from "node:path"

export function parseIntegrationOptions(args) {
  let full = false
  let list = false
  let scope
  const cases = []

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index]
    if (option === "--full") {
      if (full) throw new Error("Integration runner received --full twice.")
      full = true
      continue
    }
    if (option === "--list") {
      if (list) throw new Error("Integration runner received --list twice.")
      list = true
      continue
    }
    if (option === "--scope") {
      if (scope !== undefined)
        throw new Error("Integration runner accepts one --scope selector.")
      if (index + 1 >= args.length || args[index + 1].startsWith("--")) {
        throw new Error("--scope requires a non-empty operation selector.")
      }
      scope = args[++index]
      if (!scope.trim()) throw new Error("Integration scope selector is empty.")
      continue
    }
    if (option === "--case") {
      if (index + 1 >= args.length || args[index + 1].startsWith("--")) {
        throw new Error("--case requires a non-empty discovered case selector.")
      }
      const selector = args[++index]
      if (!selector.trim())
        throw new Error("Integration case selector is empty.")
      cases.push(selector)
      continue
    }
    throw new Error(
      `Integration runner does not accept option ${option}; runner configuration and artifacts cannot be overridden.`
    )
  }

  if (full && (scope !== undefined || cases.length > 0)) {
    throw new Error("--full cannot be combined with --scope or --case.")
  }

  return {
    cases,
    full: full || (scope === undefined && cases.length === 0),
    list,
    scope,
  }
}

export function parsePlaywrightTestList(output, suiteRoot) {
  const cases = []
  const seen = new Set()

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(?:\[([^\]]+)\]\s+›\s+)?(.+?):(\d+):\d+\s+›\s+(.+?)\s*$/u
    )
    if (!match) continue

    const listedPath = resolve(suiteRoot, match[2])
    const integrationPath = resolve(suiteRoot, "tests/integration", match[2])
    const file = existsSync(listedPath) ? listedPath : integrationPath
    const path = relative(suiteRoot, file).split(sep).join("/")
    if (!path || path === ".." || path.startsWith("../")) {
      throw new Error("Playwright listed a case outside the selected suite.")
    }
    const lineNumber = Number(match[3])
    const title = match[4]
    const id = `${path}:${lineNumber}#${title}`
    if (seen.has(id)) continue
    seen.add(id)
    const grepTitle = [match[1], basename(path), title.replace(/\s+›\s+/g, " ")]
      .filter(Boolean)
      .join(" ")
    cases.push({ grepTitle, id, lineNumber, path, title })
  }

  return cases
}

export function discoverIntegrationCases({
  applicationRoot,
  environment,
  playwrightCli,
  suiteRoot,
}) {
  const config = resolve(suiteRoot, "playwright.integration.config.ts")
  const result = spawnSync(
    process.execPath,
    [playwrightCli, "test", "--config", config, "--list"],
    {
      cwd: applicationRoot,
      encoding: "utf8",
      env: environment,
      timeout: 30_000,
    }
  )
  if (result.error || result.status !== 0) {
    throw new Error(
      "Could not discover cases from the selected workspace integration suite."
    )
  }

  const cases = parsePlaywrightTestList(result.stdout, suiteRoot)
  if (cases.length === 0) {
    throw new Error("The selected workspace integration suite has no cases.")
  }
  return cases
}

export function selectIntegrationCases(discovered, selectors) {
  if (!Array.isArray(selectors)) {
    throw new Error("Integration case selectors must be provided as a list.")
  }
  const seen = new Set()
  const selected = []
  for (const selector of selectors) {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new Error("Integration case selector is empty.")
    }
    if (seen.has(selector)) {
      throw new Error(`Duplicate integration case selector: ${selector}`)
    }
    seen.add(selector)
    const match = discovered.find((testCase) => testCase.id === selector)
    if (!match) {
      throw new Error(`No integration case matches selector: ${selector}`)
    }
    selected.push(match)
  }
  return selected
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function buildPlaywrightGrep(selected, discovered) {
  const setup = discovered.filter((testCase) =>
    testCase.path.endsWith("/clerk.setup.ts")
  )
  const required = [...selected, ...setup]
  const patterns = required.map(
    ({ grepTitle }) => `^${escapeRegex(grepTitle)}$`
  )
  return `(?:${patterns.join("|")})`
}

export const integrationRunnerVersion = "2"

export function readSourceIdentity(root) {
  const revisionResult = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
  const statusResult = spawnSync(
    "git",
    ["-C", root, "status", "--porcelain", "--untracked-files=normal"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  )
  if (
    revisionResult.error ||
    revisionResult.status !== 0 ||
    statusResult.error ||
    statusResult.status !== 0
  ) {
    throw new Error("Could not identify the application and suite revisions.")
  }
  return {
    revision: revisionResult.stdout.trim(),
    worktree: statusResult.stdout.trim() ? "dirty" : "clean",
  }
}
