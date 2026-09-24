"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  CreateMarketConversationRequest,
  MarketConversationDetailResponse,
  MarketConversationMessagePageResponse,
  MarketConversationSummaryResponse,
  SubmitMarketConversationMessageRequest,
  SubmitMarketConversationMessageResponse,
  getCreateMarketConversationSchema,
  getSubmitMarketConversationMessageSchema,
  marketConversationDetailResponseSchema,
  marketConversationMessagePageResponseSchema,
  marketConversationSummaryResponseSchema,
  pageMarketConversationSummaryResponseSchema,
  submitMarketConversationMessageResponseSchema,
} from "@/app/lib/market-query/definitions"
import { queryParamsToString } from "@/app/lib/utils"

async function getMarketConversationDictionary() {
  return getDictionary(await getRequestLocale())
}

function getActionError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function parseOrThrow<T>(
  schema: {
    safeParse: (
      value: unknown
    ) => { success: true; data: T } | { success: false }
  },
  value: unknown,
  errorMessage: string
): T {
  const parsed = schema.safeParse(value)

  if (!parsed.success) {
    throw new Error(errorMessage)
  }

  return parsed.data
}

export async function getMarketConversations(
  searchParams: SearchParams
): Promise<Page<MarketConversationSummaryResponse>> {
  const dictionary = await getMarketConversationDictionary()
  const response = await fetchAuthenticated<unknown>(
    `/market-conversations?${queryParamsToString(searchParams)}`
  )

  return parseOrThrow(
    pageMarketConversationSummaryResponseSchema,
    response,
    dictionary.marketConversations.responseInvalid
  )
}

export async function createMarketConversation(
  request: CreateMarketConversationRequest
): Promise<ActionResult<MarketConversationSummaryResponse>> {
  const dictionary = await getMarketConversationDictionary()
  const parsedRequest =
    getCreateMarketConversationSchema(dictionary).safeParse(request)

  if (!parsedRequest.success) {
    return {
      success: false,
      error:
        parsedRequest.error.issues[0]?.message ||
        dictionary.marketConversations.validationInvalid,
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      "/market-conversations",
      {
        method: "POST",
        body: JSON.stringify({ title: parsedRequest.data.title }),
      }
    )
    const conversation = parseOrThrow(
      marketConversationSummaryResponseSchema,
      response,
      dictionary.marketConversations.responseInvalid
    )

    return { success: true, data: conversation }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.marketConversations.createError),
    }
  }
}

export async function getMarketConversationById(
  id: number
): Promise<MarketConversationDetailResponse> {
  const dictionary = await getMarketConversationDictionary()
  const response = await fetchAuthenticated<unknown>(
    `/market-conversations/${id}`
  )

  return parseOrThrow(
    marketConversationDetailResponseSchema,
    response,
    dictionary.marketConversations.responseInvalid
  )
}

export async function getMarketConversationMessages(
  conversationId: number,
  beforeMessageId?: number
): Promise<MarketConversationMessagePageResponse> {
  const dictionary = await getMarketConversationDictionary()
  const searchParams = new URLSearchParams({ size: "30" })

  if (typeof beforeMessageId === "number") {
    searchParams.set("beforeMessageId", String(beforeMessageId))
  }

  const response = await fetchAuthenticated<unknown>(
    `/market-conversations/${conversationId}/messages?${searchParams.toString()}`
  )

  return parseOrThrow(
    marketConversationMessagePageResponseSchema,
    response,
    dictionary.marketConversations.responseInvalid
  )
}

export async function submitMarketConversationMessage(
  conversationId: number,
  request: SubmitMarketConversationMessageRequest,
  idempotencyKey: string
): Promise<ActionResult<SubmitMarketConversationMessageResponse>> {
  const dictionary = await getMarketConversationDictionary()
  const parsedRequest =
    getSubmitMarketConversationMessageSchema(dictionary).safeParse(request)

  if (!parsedRequest.success) {
    return {
      success: false,
      error:
        parsedRequest.error.issues[0]?.message ||
        dictionary.marketConversations.validationInvalid,
    }
  }

  const payload: SubmitMarketConversationMessageRequest = {
    message: parsedRequest.data.message,
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      `/market-conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      }
    )
    const messageResult = parseOrThrow(
      submitMarketConversationMessageResponseSchema,
      response,
      dictionary.marketConversations.responseInvalid
    )

    return { success: true, data: messageResult }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.marketConversations.submitError),
    }
  }
}
