"use client"

import { Newspaper } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NewsArticleNotFound() {
  const { dictionary } = useLocalization()

  return (
    <Empty
      role="status"
      className="min-h-[320px] rounded-lg border border-dashed"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Newspaper />
        </EmptyMedia>
        <EmptyTitle>{dictionary.newsArticles.notFoundTitle}</EmptyTitle>
        <EmptyDescription>
          {dictionary.newsArticles.notFoundDescription}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
