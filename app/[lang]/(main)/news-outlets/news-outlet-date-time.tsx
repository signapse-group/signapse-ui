"use client"

import { useSyncExternalStore } from "react"

import { useLocalization } from "@/app/lib/i18n/provider"

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

const subscribeClientReady = () => () => {}
const getClientReadySnapshot = () => true
const getServerReadySnapshot = () => false

export function NewsOutletDateTime({
  value,
}: {
  value: string | null | undefined
}) {
  const { dictionary, formatDateTime } = useLocalization()
  const isHydrated = useSyncExternalStore(
    subscribeClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot
  )

  return (
    <time dateTime={value ?? undefined}>
      {formatDateTime(
        value,
        isHydrated ? dateTimeOptions : { ...dateTimeOptions, timeZone: "UTC" },
        dictionary.common.notAvailable
      )}
    </time>
  )
}
