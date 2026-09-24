import { getUsageLimits } from "@/app/api/usage-limits/action"
import {
  getRequestLocale,
  getServerDictionary,
} from "@/app/lib/i18n/server"

import { UsageLimitsView } from "./usage-limits-view"

export default async function UsageLimitsPage() {
  const [dictionary, locale] = await Promise.all([
    getServerDictionary(),
    getRequestLocale(),
  ])
  const usageLimits = await getUsageLimits()

  return (
    <UsageLimitsView
      dictionary={dictionary}
      locale={locale}
      usageLimits={usageLimits}
    />
  )
}
