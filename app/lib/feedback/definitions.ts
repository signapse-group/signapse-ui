import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { z } from "zod"

export const FEEDBACK_STATUSES = ["PENDING_REVIEW", "REVIEWED"] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const FEEDBACK_MAX_CONTENT_LENGTH = 5_000
export const FEEDBACK_MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
export const FEEDBACK_MAX_SCREENSHOT_PIXELS = 25_000_000
export const FEEDBACK_PAGE_SIZE = 10
export const FEEDBACK_MODERATION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const feedbackStatusSchema = z.enum(FEEDBACK_STATUSES)

export const feedbackSubmissionSchema = z
  .object({
    content: z.string().trim().min(1).max(FEEDBACK_MAX_CONTENT_LENGTH),
    clientContext: z
      .object({
        pagePath: z.string().trim().max(500).optional(),
        appVersion: z.string().trim().max(100).optional(),
        browserName: z.string().trim().max(100).optional(),
        browserVersion: z.string().trim().max(100).optional(),
        osName: z.string().trim().max(100).optional(),
        osVersion: z.string().trim().max(100).optional(),
        locale: z.string().trim().max(20).optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict()

export const feedbackReviewMessageSchema = z.string().trim().min(1).max(1000)

export const feedbackReviewSchema = z
  .object({
    reviewMessage: feedbackReviewMessageSchema,
  })
  .strict()

export interface FeedbackScreenshotMetadata {
  id: number
  mimeType: "image/png" | "image/jpeg"
  size: number
}

export interface FeedbackClientContextResponse {
  pagePath?: string | null
  appVersion?: string | null
  browserName?: string | null
  browserVersion?: string | null
  osName?: string | null
  osVersion?: string | null
  locale?: string | null
}

export interface FeedbackReporterResponse {
  id: number
  email: string | null
  firstName: string | null
  lastName: string | null
  active: boolean | null
}

export interface FeedbackListResponse {
  id: number
  content: string
  status: FeedbackStatus
  createdDate: string
  lastModifiedDate: string
  screenshot: FeedbackScreenshotMetadata | null
}

export interface FeedbackDetailResponse extends FeedbackListResponse {
  clientContext: FeedbackClientContextResponse | null
  reviewMessage: string | null
  reporter?: FeedbackReporterResponse | null
}

export interface FeedbackPageResponse {
  content: FeedbackListResponse[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface FeedbackBackendError {
  code?: string
  message?: string
  timestamp?: string
}

export const FEEDBACK_LIFECYCLE_ERROR_CODES = [
  "FEEDBACK_ALREADY_REVIEWED",
  "FEEDBACK_NO_LONGER_WITHDRAWABLE",
] as const
export type FeedbackLifecycleErrorCode =
  (typeof FEEDBACK_LIFECYCLE_ERROR_CODES)[number]

export type FeedbackErrorKind =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "missing"
  | "lifecycle-conflict"
  | "payload-too-large"
  | "upstream"
  | "network"
  | "timeout"
  | "server"

export type FeedbackActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      status?: number
      code?: FeedbackLifecycleErrorCode
      kind?: FeedbackErrorKind
    }

const feedbackScreenshotMetadataSchema = z
  .object({
    id: z.number().int().positive(),
    mimeType: z.enum(["image/png", "image/jpeg"]),
    size: z.number().int().nonnegative(),
  })
  .passthrough()

const feedbackClientContextResponseSchema = z
  .object({
    pagePath: z.string().nullable().optional(),
    appVersion: z.string().nullable().optional(),
    browserName: z.string().nullable().optional(),
    browserVersion: z.string().nullable().optional(),
    osName: z.string().nullable().optional(),
    osVersion: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
  })
  .passthrough()

export const feedbackListResponseSchema = z
  .object({
    id: z.number().int().positive(),
    content: z.string(),
    status: feedbackStatusSchema,
    createdDate: z.string().datetime(),
    lastModifiedDate: z.string().datetime(),
    screenshot: feedbackScreenshotMetadataSchema.nullable(),
  })
  .passthrough()

export const feedbackDetailResponseSchema = feedbackListResponseSchema
  .extend({
    clientContext: feedbackClientContextResponseSchema.nullable(),
    reviewMessage: z.string().nullable(),
    reporter: z
      .object({
        id: z.number().int().positive(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        active: z.boolean().nullable(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough()

export const feedbackPageResponseSchema = z
  .object({
    content: z.array(feedbackListResponseSchema),
    pageable: z
      .object({
        pageNumber: z.number().int().nonnegative(),
        pageSize: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        paged: z.boolean(),
        unpaged: z.boolean(),
      })
      .passthrough(),
    last: z.boolean(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
    empty: z.boolean(),
  })
  .passthrough()

export const feedbackBackendErrorSchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
  })
  .passthrough()

export interface FeedbackTechnicalContext {
  pagePath: string
  appVersion: string
  browser: string
  operatingSystem: string
  locale: AppLocale
}

export function getFeedbackStatusLabel(
  status: FeedbackStatus,
  dictionary: Dictionary
): string {
  return dictionary.feedback.statuses[status]
}

export function getFeedbackStatusDescription(
  status: FeedbackStatus,
  dictionary: Dictionary
): string {
  return dictionary.feedback.statusDescriptions[status]
}

export function isFeedbackStatus(
  value: string | null | undefined
): value is FeedbackStatus {
  return value !== null && FEEDBACK_STATUSES.includes(value as FeedbackStatus)
}
