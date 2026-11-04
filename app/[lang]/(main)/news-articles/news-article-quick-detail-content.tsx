import { ArrowUpRightIcon, Calendar, Globe2 } from "lucide-react"
import Image from "next/image"

import { AppLocale } from "@/app/lib/i18n/config"
import { useBrowserTimeZone } from "@/app/lib/i18n/browser-time-zone"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatNewsArticleDateTime } from "@/app/lib/news-articles/date-time"
import type { NewsArticleResponse } from "@/app/lib/news-articles/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Badge } from "@/components/ui/badge"

import { NewsArticleMarkdown } from "./news-article-markdown"
import { NewsArticleStatusBadge } from "./news-article-status-badge"

function getImageUrl(article: NewsArticleResponse) {
  return (
    article.featureImage?.urlMedium ||
    article.featureImage?.urlLarge ||
    article.featureImage?.urlOriginal ||
    article.featureImage?.urlThumbnail
  )
}

export function NewsArticleQuickDetailContent({
  article,
  dictionary,
  locale,
}: {
  article: NewsArticleResponse
  dictionary: Dictionary
  locale: AppLocale
}) {
  const timeZone = useBrowserTimeZone()
  const imageUrl = getImageUrl(article)
  const description = article.description?.trim() ? article.description : null
  const title =
    article.title?.trim() || dictionary.newsArticles.titleUnavailable
  const content = article.content?.trim() ? article.content : null
  const contentFailed = article.status === "CONTENT_FAILED"
  const originalUrl = article.url?.trim() ? article.url : null

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {article.status ? (
        <NewsArticleStatusBadge
          status={article.status}
          label={dictionary.newsArticles.statusLabels[article.status]}
        />
      ) : null}

      <p className="break-words whitespace-pre-wrap text-muted-foreground">
        {description || dictionary.newsArticles.descriptionUnavailable}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AppTimeMetadata icon={Globe2}>
          {article.sourceName?.trim() || dictionary.newsArticles.noOutlet}
        </AppTimeMetadata>
        <AppTimeMetadata icon={Calendar}>
          {formatNewsArticleDateTime(
            article.publishedAt,
            locale,
            timeZone,
            dictionary.common.notAvailable
          )}
        </AppTimeMetadata>
        {originalUrl ? (
          <Badge
            className="min-h-6"
            render={
              <a href={originalUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            {dictionary.newsArticles.openOriginalLink}
            <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
          </Badge>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            {dictionary.newsArticles.sourceUrlUnavailable}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.featureImage?.altText?.trim() || title}
            width={800}
            height={450}
            className="h-auto max-w-full object-contain"
          />
        ) : null}

        {contentFailed ? (
          <p role="status" className="max-w-[72ch] text-muted-foreground">
            {dictionary.newsArticles.contentProcessingFailed}
          </p>
        ) : null}

        {content ? <NewsArticleMarkdown content={content} /> : null}

        {!content && !contentFailed ? (
          <p role="status" className="max-w-[72ch] text-muted-foreground">
            {dictionary.newsArticles.contentUnavailable}
          </p>
        ) : null}
      </div>
    </div>
  )
}
