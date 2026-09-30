import { readFileSync } from "node:fs"
import { isIP } from "node:net"
import { isAbsolute } from "node:path"
import { parseEnv } from "node:util"

const appKeys = [
  "API_BASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
]
const accountKeys = ["E2E_USER_IDENTIFIER", "E2E_USER_PASSWORD", "E2E_BASE_URL"]
const runtimeKeys = [
  "PATH",
  "HOME",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "LD_LIBRARY_PATH",
  "FONTCONFIG_FILE",
  "NODE_EXTRA_CA_CERTS",
  "SSL_CERT_FILE",
  "CI",
]

/** @param {Record<string, string | undefined>} environment
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
function pick(environment, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => environment[key] !== undefined)
      .map((key) => [key, environment[key]])
  )
}

function readEnvFile(environment, key) {
  const filename = environment[key]
  if (!filename) return {}
  if (!isAbsolute(filename)) throw new Error(`${key} must be an absolute path.`)
  try {
    return parseEnv(readFileSync(filename, "utf8"))
  } catch {
    throw new Error(`Cannot read or parse the file referenced by ${key}.`)
  }
}

function parseUrl(value, key) {
  try {
    const url = new URL(value)
    if (url.username || url.password || url.search || url.hash)
      throw new Error()
    return url
  } catch {
    throw new Error(
      `${key} must be a URL without credentials, query or fragment.`
    )
  }
}

/** @param {Record<string, string | undefined>} environment */
export function readIntegrationEnvironment(environment = process.env) {
  const appFile = readEnvFile(environment, "SIGNAPSE_UI_APP_ENV")
  const accountFile = readEnvFile(environment, "SIGNAPSE_UI_E2E_ENV")

  for (const source of [appFile, accountFile, environment]) {
    if (
      source.SIGNAPSE_AUTH_MODE === "disabled" ||
      source.SIGNAPSE_E2E_MODE === "fixture"
    ) {
      throw new Error(
        "Integration tests refuse disabled auth and fixture mode."
      )
    }
  }

  const appEnvironment = {
    ...pick(appFile, appKeys),
    ...pick(environment, appKeys),
  }
  const accountEnvironment = {
    E2E_BASE_URL: "http://localhost:3110",
    ...pick(accountFile, accountKeys),
    ...pick(environment, accountKeys),
  }
  const required = [
    "API_BASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "E2E_USER_IDENTIFIER",
    "E2E_USER_PASSWORD",
  ]
  const values = { ...appEnvironment, ...accountEnvironment }
  const missing = required.filter((key) => !values[key]?.trim())
  if (missing.length) {
    throw new Error(
      `Missing integration environment variables: ${missing.join(", ")}. No integration tests were run.`
    )
  }

  const backendUrl = parseUrl(appEnvironment.API_BASE_URL, "API_BASE_URL")
  if (
    backendUrl.protocol !== "https:" ||
    isIP(backendUrl.hostname.replace(/^\[|\]$/g, "")) ||
    backendUrl.hostname === "localhost" ||
    backendUrl.hostname.endsWith(".localhost") ||
    backendUrl.hostname.endsWith(".local")
  ) {
    throw new Error("API_BASE_URL must use a public HTTPS backend hostname.")
  }
  if (
    !appEnvironment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_") ||
    !appEnvironment.CLERK_SECRET_KEY.startsWith("sk_test_")
  ) {
    throw new Error(
      "Integration tests require Clerk development instance keys."
    )
  }

  const baseUrl = parseUrl(accountEnvironment.E2E_BASE_URL, "E2E_BASE_URL")
  const port = Number(baseUrl.port)
  if (
    baseUrl.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(baseUrl.hostname) ||
    baseUrl.pathname !== "/" ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  ) {
    throw new Error(
      "E2E_BASE_URL must use HTTP on localhost or 127.0.0.1, with a port between 1024 and 65535."
    )
  }

  appEnvironment.API_BASE_URL = backendUrl.href.replace(/\/$/, "")
  // Clerk normalizes loopback request URLs to localhost when decorating Next rewrites.
  baseUrl.hostname = "localhost"
  /** @type {Record<string, string>} */
  const testEnvironment = {
    ...appEnvironment,
    ...accountEnvironment,
    E2E_BASE_URL: baseUrl.origin,
    CLERK_PUBLISHABLE_KEY: appEnvironment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    SIGNAPSE_AUTH_MODE: "clerk",
    SIGNAPSE_E2E_MODE: "integration",
  }
  return {
    appEnvironment,
    baseUrl: baseUrl.origin,
    port,
    testEnvironment,
  }
}

/** @returns {Record<string, string>}
 * @param {Record<string, string>} appEnvironment
 * @param {Record<string, string | undefined>} environment
 */
export function nextServerEnvironment(
  appEnvironment,
  environment = process.env
) {
  return {
    ...pick(environment, runtimeKeys),
    ...pick(appEnvironment, appKeys),
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    SIGNAPSE_AUTH_MODE: "clerk",
    SIGNAPSE_E2E_MODE: "integration",
    SIGNAPSE_TELEMETRY_ENABLED: "false",
    NEXT_PUBLIC_SIGNAPSE_PERFORMANCE_EVENTS_ENABLED: "false",
    SIGNAPSE_LANDING_INDEXABLE: "false",
  }
}
