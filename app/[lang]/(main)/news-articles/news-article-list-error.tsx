"use client"

import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function NewsArticleListError({
  kind,
  dictionary,
}: {
  kind: "query" | "load"
  dictionary: Dictionary
}) {
  const router = useRouter()
  const isQueryError = kind === "query"

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
        <EmptyTitle>
          {isQueryError
            ? dictionary.newsArticles.queryErrorTitle
            : dictionary.newsArticles.loadErrorTitle}
        </EmptyTitle>
        <EmptyDescription>
          {isQueryError
            ? dictionary.newsArticles.queryErrorDescription
            : dictionary.newsArticles.loadErrorDescription}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
        >
          {dictionary.common.retry}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
