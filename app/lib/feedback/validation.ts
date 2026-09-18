import type { AppLocale } from "@/app/lib/i18n/config"

import {
  FEEDBACK_MAX_SCREENSHOT_BYTES,
  FEEDBACK_MAX_SCREENSHOT_PIXELS,
  type FeedbackTechnicalContext,
} from "./definitions"

export interface FeedbackScreenshotValidationMessages {
  unsupported: string
  tooLarge: string
  dimensionsTooLarge: string
}

export async function validateFeedbackScreenshot(
  file: File,
  messages: FeedbackScreenshotValidationMessages
): Promise<string | null> {
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    return messages.unsupported
  }
  if (file.size > FEEDBACK_MAX_SCREENSHOT_BYTES) {
    return messages.tooLarge
  }

  try {
    const dimensions = await decodeImageDimensions(file)
    if (!dimensions) return messages.unsupported
    const pixels = dimensions.width * dimensions.height
    return pixels > FEEDBACK_MAX_SCREENSHOT_PIXELS
      ? messages.dimensionsTooLarge
      : null
  } catch {
    return messages.unsupported
  }
}

async function decodeImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }

  if (typeof Image === "undefined" || typeof URL === "undefined") {
    return null
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    return await new Promise<{ width: number; height: number } | null>(
      (resolve) => {
        const image = new Image()
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => resolve(null)
        image.src = objectUrl
      }
    )
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function browserDetails(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return "Edge"
  if (/Chrome\//i.test(userAgent)) return "Chrome"
  if (/Firefox\//i.test(userAgent)) return "Firefox"
  if (/Safari\//i.test(userAgent)) return "Safari"
  return "Unknown browser"
}

function operatingSystem(platform: string, userAgent: string): string {
  if (/Win/i.test(platform) || /Windows/i.test(userAgent)) return "Windows"
  if (/Mac/i.test(platform) || /Mac OS/i.test(userAgent)) return "macOS"
  if (/Linux/i.test(platform) || /Linux/i.test(userAgent)) return "Linux"
  if (/Android/i.test(userAgent)) return "Android"
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS"
  return "Unknown operating system"
}

export function getFeedbackTechnicalContext(
  locale: AppLocale
): FeedbackTechnicalContext {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent
  const platform = typeof navigator === "undefined" ? "" : navigator.platform
  const pagePath =
    typeof window === "undefined" ? "/" : window.location.pathname || "/"

  return {
    pagePath: pagePath.startsWith("/") ? pagePath : "/",
    appVersion: "web",
    browser: browserDetails(userAgent),
    operatingSystem: operatingSystem(platform, userAgent),
    locale,
  }
}

export function toFeedbackSubmissionContext(
  context: FeedbackTechnicalContext | undefined
) {
  if (!context) return undefined

  return {
    pagePath: context.pagePath || undefined,
    appVersion: context.appVersion || undefined,
    browserName: context.browser || undefined,
    osName: context.operatingSystem || undefined,
    locale: context.locale || undefined,
  }
}
