"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  EconomicCalendarListResponse,
  EconomicCalendarResponse,
  EconomicCalendarSyncResponse,
} from "@/app/lib/economic-calendar/definitions"
import { queryParamsToString } from "@/app/lib/utils"

const ECONOMIC_CALENDAR_PAGE_SIZE = 2000

function revalidateEconomicCalendarRoutes(id?: number) {
  revalidatePath("/economic-calendar")

  if (typeof id === "number") {
    revalidatePath(`/economic-calendar/${id}`)
    return
  }

  revalidatePath("/economic-calendar/[id]", "page")
}

export async function getEconomicCalendarEntries(
  searchParams: SearchParams
): Promise<Page<EconomicCalendarListResponse>> {
  return fetchAuthenticated<Page<EconomicCalendarListResponse>>(
    `/economic-calendar?${queryParamsToString(searchParams)}`
  )
}

export async function getAllEconomicCalendarEntries(
  searchParams: Pick<SearchParams, "filter" | "sort">
): Promise<EconomicCalendarListResponse[]> {
  let pageNumber = 0
  let page = await getEconomicCalendarEntries({
    ...searchParams,
    page: pageNumber,
    size: ECONOMIC_CALENDAR_PAGE_SIZE,
  })
  const entries = [...page.content]

  while (!page.last) {
    pageNumber += 1
    page = await getEconomicCalendarEntries({
      ...searchParams,
      page: pageNumber,
      size: ECONOMIC_CALENDAR_PAGE_SIZE,
    })
    entries.push(...page.content)
  }

  return entries
}

export async function getEconomicCalendarEntryById(
  id: number
): Promise<EconomicCalendarResponse> {
  return fetchAuthenticated<EconomicCalendarResponse>(
    `/economic-calendar/${id}`
  )
}

export async function syncEconomicCalendarEntries(): Promise<
  ActionResult<EconomicCalendarSyncResponse>
> {
  try {
    const data = await fetchAuthenticated<EconomicCalendarSyncResponse>(
      "/economic-calendar/sync",
      {
        method: "POST",
      }
    )

    revalidateEconomicCalendarRoutes()

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.economicCalendar.syncError,
    }
  }
}
