import "server-only"

import { cookies } from "next/headers"

import { BROWSER_TIME_ZONE_COOKIE, normalizeTimeZone } from "./time-zone"

export async function getRequestTimeZone() {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(BROWSER_TIME_ZONE_COOKIE)?.value
  const timeZone = normalizeTimeZone(cookieValue)

  return {
    timeZone,
    known: Boolean(cookieValue && cookieValue === timeZone),
  }
}
