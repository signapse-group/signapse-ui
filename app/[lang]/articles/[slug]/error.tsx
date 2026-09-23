"use client"

import { AlertCircle, RefreshCcw } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function ArticleDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useLocalization()
  void error

  return (
    <div
      role="alert"
      className="flex min-h-[28rem] w-full items-center justify-center px-4 py-12"
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive"
          >
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>{dictionary.articles.detailLoadErrorTitle}</EmptyTitle>
          <EmptyDescription>
            {dictionary.articles.detailLoadErrorDescription}
          </EmptyDescription>
        </EmptyHeader>
        <div className="mt-4 flex justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCcw data-icon="inline-start" />
            {dictionary.articles.retry}
          </Button>
        </div>
      </Empty>
    </div>
  )
}
