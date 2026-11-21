"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  EventEnrichmentResult,
  EventListResponse,
  EventMarketReactionDerivationResult,
  EventResponse,
  PendingEventMarketReactionDerivationBatchResult,
  PendingEventEnrichmentBatchResult,
} from "@/app/lib/events/definitions"
import { queryParamsToString } from "@/app/lib/utils"

function revalidateEventRoutes(id?: number) {
  revalidatePath("/events")

  if (typeof id === "number") {
    revalidatePath(`/events/${id}`)
    return
  }

  revalidatePath("/events/[id]", "page")
}

export async function getEvents(
  searchParams: SearchParams
): Promise<Page<EventListResponse>> {
  return fetchAuthenticated<Page<EventListResponse>>(
    `/events?${queryParamsToString(searchParams)}`
  )
}

export async function getEventById(id: number): Promise<EventResponse> {
  return fetchAuthenticated<EventResponse>(`/events/${id}`)
}

function getQuickDetailErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null
  }

  return typeof error.status === "number" ? error.status : null
}

export async function getEventByIdForQuickDetail(
  id: number
): Promise<
  | { success: true; data: EventResponse }
  | { success: false; status: number | null }
> {
  try {
    return { success: true, data: await getEventById(id) }
  } catch (error: unknown) {
    return { success: false, status: getQuickDetailErrorStatus(error) }
  }
}

export async function enrichEventAssetsAndThemes(
  id: number
): Promise<ActionResult<EventEnrichmentResult>> {
  try {
    const data = await fetchAuthenticated<EventEnrichmentResult>(
      `/events/${id}/enrich-assets-and-themes`,
      {
        method: "POST",
      }
    )

    revalidateEventRoutes(id)

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error ? error.message : dictionary.events.enrichError,
    }
  }
}

export async function enrichPendingEventAssetsAndThemes(
  batchSize?: number
): Promise<ActionResult<PendingEventEnrichmentBatchResult>> {
  try {
    const query = typeof batchSize === "number" ? `?batchSize=${batchSize}` : ""
    const data = await fetchAuthenticated<PendingEventEnrichmentBatchResult>(
      `/events/enrich-pending-assets-and-themes${query}`,
      {
        method: "POST",
      }
    )

    revalidateEventRoutes()

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.events.enrichPendingError,
    }
  }
}

export async function deriveEventMarketReactions(
  id: number
): Promise<ActionResult<EventMarketReactionDerivationResult>> {
  try {
    const data = await fetchAuthenticated<EventMarketReactionDerivationResult>(
      `/events/${id}/derive-market-reactions`,
      {
        method: "POST",
      }
    )

    revalidateEventRoutes(id)

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.events.marketReactionError,
    }
  }
}

export async function derivePendingEventMarketReactions(
  batchSize?: number
): Promise<ActionResult<PendingEventMarketReactionDerivationBatchResult>> {
  try {
    const query = typeof batchSize === "number" ? `?batchSize=${batchSize}` : ""
    const data =
      await fetchAuthenticated<PendingEventMarketReactionDerivationBatchResult>(
        `/events/derive-pending-market-reactions${query}`,
        {
          method: "POST",
        }
      )

    revalidateEventRoutes()

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.events.marketReactionPendingError,
    }
  }
}
