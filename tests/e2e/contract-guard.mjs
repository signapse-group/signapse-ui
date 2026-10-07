import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parsePublicBackendUrl } from "../integration/environment.mjs"
import { fixtureContracts } from "./fixtures/contract-registry.mjs"

const normalizePath = (path) => path.replace(/\{[^}]+\}/g, "{param}")

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
    const options = process.argv.slice(2)
    if (
      options.length > 1 ||
      (options.length === 1 && options[0] !== "--live")
    ) {
      throw new Error("Contract guard supports --live only")
    }
    const errors = checkFixtureContracts(fixtureContracts)
    const live = options[0] === "--live"
    if (live && errors.length === 0) {
      const contract = await fetchPublishedContract(process.env.API_BASE_URL)
      errors.push(...checkPublishedContracts(fixtureContracts, contract.spec))
      console.log(
        `OpenAPI source: ${contract.url}; checked at ${contract.fetchedAt}`
      )
    }
    if (errors.length) {
      console.error(
        `${live ? "Live OpenAPI structural check" : "Fixture consistency"} failed with ${errors.length} issue(s):`
      )
      for (const error of errors) console.error(`- ${error}`)
      process.exitCode = 1
    } else {
      console.log(
        `${live ? "Live OpenAPI structural check" : "Fixture consistency"} passed for ${fixtureContracts.length} operations.`
      )
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
