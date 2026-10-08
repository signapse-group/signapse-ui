import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parsePublicBackendUrl } from "../integration/environment.mjs"
import { fixtureContracts } from "./fixtures/contract-registry.mjs"

const normalizePath = (path) => path.replace(/\{[^}]+\}/g, "{param}")

export function selectContractsByScope(contracts, scope) {
  if (scope === undefined) return contracts
  if (typeof scope !== "string" || !scope.trim()) {
    throw new Error("Contract scope selector is empty.")
  }

  const selectors = scope.split(",").map((selector) => selector.trim())
  if (selectors.some((selector) => !selector)) {
    throw new Error("Contract scope contains an empty operation selector.")
  }
  if (
    selectors.some(
      (selector) => !/^(GET|POST|PUT|PATCH|DELETE) \/\S+$/.test(selector)
    )
  ) {
    throw new Error(
      "Contract scope must use exact HTTP operation identities: METHOD /path."
    )
  }
  if (new Set(selectors).size !== selectors.length) {
    throw new Error("Contract scope contains a duplicate operation selector.")
  }

  return selectors.flatMap((selector) => {
    const matches = contracts.filter(
      (contract) => `${contract.method} ${contract.path}` === selector
    )
    if (matches.length === 0) {
      throw new Error(
        `No fixture operation matches scope selector: ${selector}`
      )
    }
    if (matches.length > 1) {
      throw new Error(
        `Scope selector matches more than one fixture operation: ${selector}`
      )
    }
    return matches
  })
}

export function parseContractGuardOptions(args) {
  let live = false
  let full = false
  let scope

  const options = args[0] === "--" ? args.slice(1) : args

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index]
    if (option === "--live") {
      if (live) throw new Error("Contract guard received --live twice.")
      live = true
      continue
    }
    if (option === "--full") {
      if (full) throw new Error("Contract guard received --full twice.")
      full = true
      continue
    }
    if (option === "--scope" || option.startsWith("--scope=")) {
      if (scope !== undefined) {
        throw new Error("Contract guard accepts one --scope selector.")
      }
      if (option === "--scope") {
        if (
          index + 1 >= options.length ||
          options[index + 1].startsWith("--")
        ) {
          throw new Error("--scope requires a non-empty operation selector.")
        }
        scope = options[++index]
      } else {
        scope = option.slice("--scope=".length)
      }
      if (!scope.trim()) throw new Error("Contract scope selector is empty.")
      continue
    }
    throw new Error(`Contract guard does not accept option ${option}.`)
  }

  if (full && scope !== undefined) {
    throw new Error("--full cannot be combined with --scope.")
  }
  return { full: full || scope === undefined, live, scope }
}

export function checkFixtureContracts(contracts) {
  const errors = []
  const keys = new Set()
  for (const contract of contracts) {
    if (!/^(GET|POST|PUT|PATCH|DELETE)$/.test(contract.method)) {
      errors.push(`${contract.mapping}: unsupported method ${contract.method}`)
    }
    if (typeof contract.path !== "string" || !contract.path.startsWith("/")) {
      errors.push(`${contract.mapping}: path must start with /`)
    }
    if (
      !Number.isInteger(contract.status) ||
      contract.status < 100 ||
      contract.status > 599
    ) {
      errors.push(`${contract.mapping}: response status must be an HTTP status`)
    }
    const key = `${contract.method} ${normalizePath(contract.path ?? "")}`
    if (keys.has(key)) errors.push(`duplicate fixture operation: ${key}`)
    keys.add(key)
  }
  return errors
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value)

function dereference(value, spec) {
  const visited = new Set()
  while (isObject(value) && value.$ref) {
    const reference = value.$ref
    if (
      typeof reference !== "string" ||
      !reference.startsWith("#/") ||
      visited.has(reference)
    ) {
      throw new Error(
        "OpenAPI contains an unsupported or cyclic operation reference"
      )
    }
    visited.add(reference)
    value = reference
      .slice(2)
      .split("/")
      .reduce(
        (object, key) => object?.[key.replace(/~1/g, "/").replace(/~0/g, "~")],
        spec
      )
  }
  if (!isObject(value))
    throw new Error("OpenAPI operation/response reference does not resolve")
  return value
}

export function checkPublishedContracts(contracts, spec) {
  if (
    !isObject(spec) ||
    !/^3\.\d+\.\d+$/.test(spec.openapi) ||
    !isObject(spec.info) ||
    typeof spec.info.title !== "string" ||
    typeof spec.info.version !== "string" ||
    !isObject(spec.paths)
  ) {
    throw new Error(
      "Invalid OpenAPI: expected a version 3 document with info and paths"
    )
  }
  const errors = []
  for (const contract of contracts) {
    const entries = Object.entries(spec.paths).filter(
      ([path]) => normalizePath(path) === normalizePath(contract.path)
    )
    const identity = `${contract.mapping}: ${contract.method} ${contract.path}`
    if (entries.length !== 1) {
      errors.push(`${identity}: producer path is missing or ambiguous`)
      continue
    }
    const item = dereference(entries[0][1], spec)
    const operation = item[contract.method.toLowerCase()]
    if (!isObject(operation)) {
      errors.push(`${identity}: producer method is not declared`)
      continue
    }
    const responses = operation.responses
    const response =
      responses?.[contract.status] ??
      responses?.[`${Math.floor(contract.status / 100)}XX`] ??
      responses?.default
    if (!isObject(response)) {
      errors.push(
        `${identity}: fixture status ${contract.status} is not declared by producer`
      )
    } else {
      dereference(response, spec)
    }
  }
  return errors
}

export async function fetchPublishedContract(baseUrl) {
  const url = new URL("/v3/api-docs", parsePublicBackendUrl(baseUrl))
  let response
  try {
    response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error("OpenAPI fetch failed; no live contract was verified")
  }
  if (!response.ok)
    throw new Error(`OpenAPI fetch failed (HTTP ${response.status})`)
  let spec
  try {
    spec = await response.json()
    checkPublishedContracts([], spec)
  } catch {
    throw new Error("Invalid OpenAPI response; no live contract was verified")
  }
  return { spec, url: url.href, fetchedAt: new Date().toISOString() }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const options = parseContractGuardOptions(process.argv.slice(2))
    const contracts = selectContractsByScope(fixtureContracts, options.scope)
    console.log(
      `Scope: ${options.full ? "full" : contracts.map((contract) => `${contract.method} ${contract.path}`).join(", ")}`
    )
    const errors = checkFixtureContracts(contracts)
    if (options.live && errors.length === 0) {
      const contract = await fetchPublishedContract(process.env.API_BASE_URL)
      errors.push(...checkPublishedContracts(contracts, contract.spec))
      console.log(
        `OpenAPI source: ${contract.url}; checked at ${contract.fetchedAt}`
      )
    }
    if (errors.length) {
      console.error(
        `${options.live ? "Live OpenAPI structural check" : "Fixture consistency"} failed with ${errors.length} issue(s):`
      )
      for (const error of errors) console.error(`- ${error}`)
      process.exitCode = 1
    } else {
      console.log(
        `${options.live ? "Live OpenAPI structural check" : "Fixture consistency"} passed for ${contracts.length} operations.`
      )
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
