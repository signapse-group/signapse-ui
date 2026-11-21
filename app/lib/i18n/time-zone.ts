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

export function formatTimeZoneOffset(
  value: string | null | undefined,
  timeZone: string
) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  try {
    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value

    if (offset === "GMT") return "UTC+00:00"

    const match = offset?.match(/^GMT([+-])(\d{1,2}):(\d{2})$/)
    if (!match) return null

    return `UTC${match[1]}${match[2].padStart(2, "0")}:${match[3]}`
  } catch {
    return null
  }
}

export function getBrowserTimeZone() {
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
}

export function setBrowserTimeZoneCookie(timeZone = getBrowserTimeZone()) {
  document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=${timeZone}; Path=/; Max-Age=31536000; SameSite=Lax`
}
