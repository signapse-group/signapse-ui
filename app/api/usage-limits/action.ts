"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  usageLimitsResponseSchema,
  type UsageLimitsResponse,
} from "@/app/lib/usage-limits/definitions"

export async function getUsageLimits(): Promise<UsageLimitsResponse> {
  const dictionary = await getDictionary(await getRequestLocale())
  const response = await fetchAuthenticated<unknown>("/me/usage-limits")
  const parsedResponse = usageLimitsResponseSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new Error(dictionary.usageLimits.loadErrorDescription)
  }

  return parsedResponse.data
}
