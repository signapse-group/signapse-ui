"use client"

import * as React from "react"
import {
  CircleCheck,
  CircleDashed,
  FileQuestion,
  Image as ImageIcon,
} from "lucide-react"

import type { FeedbackStatus } from "@/app/lib/feedback/definitions"
import type { FeedbackScreenshotViewModel } from "@/app/lib/feedback/mappers"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const statusIcons: Record<FeedbackStatus, typeof CircleDashed> = {
  PENDING_REVIEW: CircleDashed,
  REVIEWED: CircleCheck,
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const { dictionary } = useLocalization()
  const Icon = statusIcons[status]
  const variant = status === "REVIEWED" ? "default" : "outline"

  return (
    <Badge variant={variant} className="gap-1.5 whitespace-nowrap">
      <Icon className="size-3.5" aria-hidden="true" />
      {dictionary.feedback.statuses[status]}
    </Badge>
  )
}

export function FeedbackScreenshotView({
  screenshot,
  compact = false,
  screenshotUrl,
}: {
  screenshot: FeedbackScreenshotViewModel | null
  compact?: boolean
  screenshotUrl?: string
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const [failed, setFailed] = React.useState(false)
  const [retryNonce, setRetryNonce] = React.useState(0)

  if (!screenshot) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ImageIcon className="size-4" aria-hidden="true" />
        {dictionary.feedback.screenshotAbsent}
      </span>
    )
  }

  const previewUrl = screenshotUrl
    ? `${screenshotUrl}${retryNonce ? `?retry=${retryNonce}` : ""}`
    : undefined
  const metadata = {
    name: dictionary.feedback.screenshotPresent,
    mimeType: screenshot.mimeType,
    size: screenshot.size,
  }

  if (compact && !screenshotUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ImageIcon className="size-4" aria-hidden="true" />
        {dictionary.feedback.screenshotPresent}
      </span>
    )
  }

  if (previewUrl && !failed) {
    return (
      <div
        className={compact ? "flex items-center gap-2" : "flex flex-col gap-3"}
      >
        <img
          src={previewUrl}
          alt={dictionary.feedback.screenshotPreviewAlt}
          onError={() => setFailed(true)}
          className={
            compact
              ? "size-10 rounded object-cover"
              : "max-h-72 w-full rounded-lg border object-contain"
          }
        />
        {!compact ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {formatMessage(dictionary.feedback.screenshotMetadata, {
                name: metadata.name,
                type: metadata.mimeType,
                size: `${formatNumber(metadata.size)} B`,
              })}
            </span>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <span className="inline-flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
      <FileQuestion className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0" title={metadata.name}>
        <span className="block truncate">
          {failed
            ? dictionary.feedback.screenshotUnavailable
            : dictionary.feedback.screenshotUnsupported}
        </span>
        {!compact ? (
          <>
            <span className="mt-1 block text-xs">
              {formatMessage(dictionary.feedback.screenshotMetadata, {
                name: metadata.name,
                type: metadata.mimeType,
                size: `${formatNumber(metadata.size)} B`,
              })}
            </span>
            {failed && screenshotUrl ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1 h-auto px-0"
                onClick={() => {
                  setFailed(false)
                  setRetryNonce((current) => current + 1)
                }}
              >
                {dictionary.feedback.screenshotRetry}
              </Button>
            ) : null}
          </>
        ) : null}
      </span>
    </span>
  )
}
