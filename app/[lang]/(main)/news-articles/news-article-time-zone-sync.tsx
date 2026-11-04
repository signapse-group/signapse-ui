"use client"

import type { ReactNode } from "react"
import { useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"

import {
  getBrowserTimeZone,
  setBrowserTimeZoneCookie,
} from "@/app/lib/i18n/time-zone"

const subscribe = () => () => {}
const getServerTimeZone = () => null
const getClientTimeZone = () =>
  typeof window === "undefined" ? null : getBrowserTimeZone()

export function NewsArticleTimeZoneSync({
  timeZone,
  timeZoneKnown,
  children,
  fallback,
}: {
  timeZone: string
  timeZoneKnown: boolean
  children: ReactNode
  fallback: ReactNode
}) {
  const router = useRouter()
  const browserTimeZone = useSyncExternalStore(
    subscribe,
    getClientTimeZone,
    getServerTimeZone
  )

  useEffect(() => {
    if (!browserTimeZone) return

    setBrowserTimeZoneCookie(browserTimeZone)

    if (!timeZoneKnown || browserTimeZone !== timeZone) {
      router.refresh()
    }
  }, [browserTimeZone, router, timeZone, timeZoneKnown])

  if (!timeZoneKnown || browserTimeZone !== timeZone) return fallback

  return children
}
