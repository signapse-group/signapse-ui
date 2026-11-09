"use client"

import { AlertTriangle } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NewsArticleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useLocalization()

  return (
    <Empty
      role="alert"
      aria-live="assertive"
      className="min-h-[320px] rounded-lg border border-dashed"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>{dictionary.newsArticles.errorTitle}</EmptyTitle>
        <EmptyDescription>
          {dictionary.newsArticles.errorDescription}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" variant="outline" onClick={reset}>
          {dictionary.common.retry}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
