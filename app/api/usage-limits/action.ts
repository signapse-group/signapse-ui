"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import {
  usageLimitsResponseSchema,
  type UsageLimitsResponse,
} from "@/app/lib/usage-limits/definitions"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { reportValidationFailure } from "@/app/lib/observability/server"
import { OBSERVABILITY_OPERATIONS } from "@/app/lib/observability/semantic"

export async function getUsageLimits(): Promise<UsageLimitsResponse> {
  const dictionary = await getDictionary(await getRequestLocale())
  const response = await fetchAuthenticated<unknown>("/me/usage-limits")
  const parsedResponse = usageLimitsResponseSchema.safeParse(response)

  if (!parsedResponse.success) {
    reportValidationFailure(
      OBSERVABILITY_OPERATIONS.usageLimitsLoad,
      { feature: "usage-limits", route: "/me/usage-limits" },
      parsedResponse.error.issues
    )
    throw new Error(dictionary.usageLimits.responseInvalid)
  }

  return parsedResponse.data
}
