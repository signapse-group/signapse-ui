"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import type { BackendApiError } from "@/app/api/auth/action"
import type { Page } from "@/app/lib/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  FEEDBACK_MAX_SCREENSHOT_BYTES,
  feedbackDetailResponseSchema,
  feedbackListResponseSchema,
  feedbackPageResponseSchema,
  feedbackReviewSchema,
  feedbackSubmissionSchema,
  type FeedbackActionResult,
  type FeedbackDetailResponse,
  type FeedbackListResponse,
  type FeedbackPageResponse,
} from "@/app/lib/feedback/definitions"
import { normalizeFeedbackError } from "@/app/lib/feedback/errors"
import {
  serializeFeedbackPersonalQuery,
  serializeFeedbackModerationQuery,
  type FeedbackPersonalQuery,
  type FeedbackModerationQuery,
} from "@/app/lib/feedback/query"

function assertPositiveId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid feedback id")
  }
}

function parsePageResponse(value: unknown): FeedbackPageResponse {
  return feedbackPageResponseSchema.parse(value)
}

function parseDetailResponse(value: unknown): FeedbackDetailResponse {
  return feedbackDetailResponseSchema.parse(value)
}

function getFailure(
  error: unknown,
  fallback: string
): FeedbackActionResult<never> {
  if (error instanceof Error) {
    const maybeBackendError = error as BackendApiError
    const normalized = normalizeFeedbackError(
      {
        ...maybeBackendError,
        status:
          maybeBackendError.status ??
          (maybeBackendError.name === "ZodError" ? 400 : undefined),
      },
      fallback
    )
    return {
      success: false,
      error: normalized.message,
      status: normalized.status,
      code: normalized.code,
      kind: normalized.kind,
    }
  }

  return { success: false, error: fallback }
}

export async function getPersonalFeedback(
  searchParams: FeedbackPersonalQuery
): Promise<Page<FeedbackListResponse>> {
  const value = await fetchAuthenticated<unknown>(
    `/me/feedback-submissions?${serializeFeedbackPersonalQuery(searchParams)}`
  )
  const parsed = parsePageResponse(value)
  parsed.content.forEach((item) => feedbackListResponseSchema.parse(item))
  return parsed
}

export async function getPersonalFeedbackDetail(
  id: number
): Promise<FeedbackDetailResponse> {
  assertPositiveId(id)
  return parseDetailResponse(
    await fetchAuthenticated<unknown>(`/me/feedback-submissions/${id}`)
  )
}

export async function getModerationFeedback(
  query: FeedbackModerationQuery
): Promise<Page<FeedbackListResponse>> {
  const value = await fetchAuthenticated<unknown>(
    `/feedback-submissions?${serializeFeedbackModerationQuery(query)}`
  )
  const parsed = parsePageResponse(value)
  parsed.content.forEach((item) => feedbackListResponseSchema.parse(item))
  return parsed
}

export async function getModerationFeedbackDetail(
  id: number
): Promise<FeedbackDetailResponse> {
  assertPositiveId(id)
  return parseDetailResponse(
    await fetchAuthenticated<unknown>(`/feedback-submissions/${id}`)
  )
}

async function readSubmissionPart(formData: FormData): Promise<unknown> {
  const part = formData.get("submission")
  if (typeof part === "string") {
    return JSON.parse(part)
  }

  if (part instanceof Blob) {
    return JSON.parse(await part.text())
  }

  throw new Error("Missing feedback submission")
}

function validateScreenshot(formData: FormData): File | null {
  const part = formData.get("screenshot")
  if (!(part instanceof File) || part.size === 0) {
    return null
  }

  if (!(part.type === "image/png" || part.type === "image/jpeg")) {
    throw feedbackValidationError("Unsupported feedback screenshot type")
  }

  if (part.size > FEEDBACK_MAX_SCREENSHOT_BYTES) {
    throw feedbackValidationError("Feedback screenshot is too large")
  }

  return part
}

function feedbackValidationError(message: string): BackendApiError {
  const error = new Error(message) as BackendApiError
  error.status = 400
  return error
}

export async function createFeedbackSubmission(
  formData: FormData
): Promise<FeedbackActionResult<FeedbackDetailResponse>> {
  const dictionary = await getServerDictionary()

  try {
    const submission = feedbackSubmissionSchema.parse(
      await readSubmissionPart(formData)
    )
    const screenshot = validateScreenshot(formData)
    const request = new FormData()
    request.append(
      "submission",
      new Blob([JSON.stringify(submission)], { type: "application/json" })
    )
    if (screenshot) {
      request.append("screenshot", screenshot, screenshot.name)
    }

    const value = await fetchAuthenticated<unknown>(
      "/me/feedback-submissions",
      { method: "POST", body: request }
    )
    const data = parseDetailResponse(value)
    revalidatePath("/feedback")
    revalidatePath("/feedback/[id]", "page")
    return { success: true, data }
  } catch (error: unknown) {
    return getFailure(error, dictionary.feedback.submitError)
  }
}

export async function withdrawFeedback(
  id: number
): Promise<FeedbackActionResult<void>> {
  const dictionary = await getServerDictionary()
  try {
    assertPositiveId(id)
    await fetchAuthenticated<null>(`/me/feedback-submissions/${id}`, {
      method: "DELETE",
    })
    revalidatePath("/feedback")
    revalidatePath(`/feedback/${id}`)
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return getFailure(error, dictionary.feedback.withdrawError)
  }
}

export async function reviewFeedback(
  id: number,
  input: { reviewMessage: string }
): Promise<FeedbackActionResult<FeedbackDetailResponse>> {
  const dictionary = await getServerDictionary()
  const parsed = feedbackReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: dictionary.feedback.reviewError }
  }

  try {
    assertPositiveId(id)
    const value = await fetchAuthenticated<unknown>(
      `/feedback-submissions/${id}/review`,
      { method: "POST", body: JSON.stringify(parsed.data) }
    )
    const data = parseDetailResponse(value)
    revalidatePath("/feedback-submissions")
    revalidatePath(`/feedback-submissions/${id}`)
    return { success: true, data }
  } catch (error: unknown) {
    return getFailure(error, dictionary.feedback.reviewError)
  }
}

export async function deleteFeedback(
  id: number
): Promise<FeedbackActionResult<void>> {
  const dictionary = await getServerDictionary()
  try {
    assertPositiveId(id)
    await fetchAuthenticated<null>(`/feedback-submissions/${id}`, {
      method: "DELETE",
    })
    revalidatePath("/feedback-submissions")
    revalidatePath(`/feedback-submissions/${id}`)
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return getFailure(error, dictionary.feedback.eraseError)
  }
}
