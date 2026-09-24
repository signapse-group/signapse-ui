import { getUsageLimits } from "@/app/api/usage-limits/action"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { getServerDictionary } from "@/app/lib/i18n/server"

import { UsageLimitsView } from "./usage-limits-view"

export default async function UsageLimitsPage() {
  const [usageLimits, dictionary, locale] = await Promise.all([
    getUsageLimits(),
    getServerDictionary(),
    getRequestLocale(),
  ])

  return (
    <UsageLimitsView
      dictionary={dictionary}
      locale={locale}
      usageLimits={usageLimits}
    />
  )
}
