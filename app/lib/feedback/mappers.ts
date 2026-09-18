import type {
  FeedbackClientContextResponse,
  FeedbackDetailResponse,
  FeedbackListResponse,
  FeedbackReporterResponse,
} from "./definitions"

export interface FeedbackScreenshotViewModel {
  id: number
  mimeType: "image/png" | "image/jpeg"
  size: number
}

export interface FeedbackTechnicalContextViewModel {
  pagePath?: string
  appVersion?: string
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
  locale?: string
}

export interface FeedbackSenderViewModel {
  id: string
  email?: string
  displayName: string
  active?: boolean
}

export interface FeedbackListItemViewModel {
  id: string
  content: string
  status: FeedbackListResponse["status"]
  createdAt: string
  updatedAt: string
  screenshot: FeedbackScreenshotViewModel | null
}

export interface FeedbackDetailViewModel extends FeedbackListItemViewModel {
  clientContext: FeedbackTechnicalContextViewModel | null
  reviewMessage: string | null
  sender?: FeedbackSenderViewModel
}

function mapScreenshot(
  screenshot: FeedbackListResponse["screenshot"]
): FeedbackScreenshotViewModel | null {
  return screenshot
    ? {
        id: screenshot.id,
        mimeType: screenshot.mimeType,
        size: screenshot.size,
      }
    : null
}

function mapContext(
  context: FeedbackClientContextResponse | null | undefined
): FeedbackTechnicalContextViewModel | null {
  if (!context) return null

  return {
    pagePath: context.pagePath ?? undefined,
    appVersion: context.appVersion ?? undefined,
    browserName: context.browserName ?? undefined,
    browserVersion: context.browserVersion ?? undefined,
    osName: context.osName ?? undefined,
    osVersion: context.osVersion ?? undefined,
    locale: context.locale ?? undefined,
  }
}

function mapReporter(
  reporter: FeedbackReporterResponse | null | undefined
): FeedbackSenderViewModel | undefined {
  if (!reporter) return undefined

  const name = [reporter.firstName, reporter.lastName].filter(Boolean).join(" ")

  return {
    id: String(reporter.id),
    email: reporter.email ?? undefined,
    displayName: name || reporter.email || `#${reporter.id}`,
    active: reporter.active ?? undefined,
  }
}

export function mapFeedbackListItem(
  response: FeedbackListResponse
): FeedbackListItemViewModel {
  return {
    id: String(response.id),
    content: response.content,
    status: response.status,
    createdAt: response.createdDate,
    updatedAt: response.lastModifiedDate,
    screenshot: mapScreenshot(response.screenshot),
  }
}

export function mapFeedbackDetail(
  response: FeedbackDetailResponse
): FeedbackDetailViewModel {
  return {
    ...mapFeedbackListItem(response),
    clientContext: mapContext(response.clientContext),
    reviewMessage: response.reviewMessage ?? null,
    sender: mapReporter(response.reporter),
  }
}
