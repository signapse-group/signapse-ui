export const BROWSER_TIME_ZONE_COOKIE = "signapse-browser-time-zone"

export function normalizeTimeZone(value: string | null | undefined) {
  if (!value) return "UTC"

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return value
  } catch {
    return "UTC"
  }
}

export function getBrowserTimeZone() {
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
}

export function setBrowserTimeZoneCookie(timeZone = getBrowserTimeZone()) {
  document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=${timeZone}; Path=/; Max-Age=31536000; SameSite=Lax`
}
