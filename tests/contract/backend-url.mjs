import { isIP } from "node:net"

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

export function parsePublicBackendUrl(value) {
  const url = parseUrl(value, "API_BASE_URL")
  if (
    url.protocol !== "https:" ||
    isIP(url.hostname.replace(/^\[|\]$/g, "")) ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local")
  ) {
    throw new Error("API_BASE_URL must use a public HTTPS backend hostname.")
  }
  return url
}
