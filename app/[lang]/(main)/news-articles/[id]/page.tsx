import { ArrowLeft, ArrowUpRightIcon, Calendar, Globe2 } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getNewsArticleById } from "@/app/api/news-articles/action"
import { EVENT_READ_PERMISSIONS } from "@/app/lib/events/permissions"
import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getRequestLocale, getServerDictionary } from "@/app/lib/i18n/server"
import { getRequestTimeZone } from "@/app/lib/i18n/time-zone-server"
import { formatNewsArticleDateTime } from "@/app/lib/news-articles/date-time"
import type { NewsArticleResponse } from "@/app/lib/news-articles/definitions"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { hasAnyPermission } from "@/app/lib/permissions"
import { AccessDenied } from "@/components/access-denied"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { LocalizedLink as Link } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { NewsArticleMarkdown } from "../news-article-markdown"
import { NewsArticleLinkedEvents } from "../news-article-linked-events"
import { NewsArticleStatusBadge } from "../news-article-status-badge"
import { NewsArticleTimeZoneSync } from "../news-article-time-zone-sync"

interface PageProps {
  params: Promise<{ id: string }>
}

function getImageUrl(article: NewsArticleResponse) {
  return (
    article.featureImage?.urlLarge ||
    article.featureImage?.urlOriginal ||
    article.featureImage?.urlMedium ||
    article.featureImage?.urlThumbnail
  )
}

function getHttpStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined
  const status = (error as { status?: unknown }).status
  return typeof status === "number" ? status : undefined
}

export default async function NewsArticleDetailPage({ params }: PageProps) {
  const permissions = await getCurrentPermissions()
  const locale = await getRequestLocale()
  const dictionary = await getServerDictionary()

  if (!hasAnyPermission(permissions, NEWS_ARTICLE_READ_PERMISSIONS)) {
    return (
      <AccessDenied
        description={dictionary.newsArticles.detailDenied}
        permission={NEWS_ARTICLE_READ_PERMISSIONS[0]}
      />
    )
  }

  const { id } = await params
  const newsArticleId = Number(id)
  if (!Number.isSafeInteger(newsArticleId) || newsArticleId < 1) notFound()

  const { timeZone, known: timeZoneKnown } = await getRequestTimeZone()
  const canReadEvents = hasAnyPermission(permissions, EVENT_READ_PERMISSIONS)

  return (
    <div className="mx-auto flex w-full max-w-[72ch] flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/news-articles"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <Suspense fallback={<NewsArticleDetailSkeleton />}>
        <NewsArticleTimeZoneSync
          timeZone={timeZone}
          timeZoneKnown={timeZoneKnown}
          fallback={<NewsArticleDetailSkeleton />}
        >
          <FetchNewsArticleData
            id={newsArticleId}
            dictionary={dictionary}
            locale={locale}
            timeZone={timeZone}
            canReadEvents={canReadEvents}
          />
        </NewsArticleTimeZoneSync>
      </Suspense>
    </div>
  )
}

async function FetchNewsArticleData({
  id,
  dictionary,
  locale,
  timeZone,
  canReadEvents,
}: {
  id: number
  dictionary: Dictionary
  locale: AppLocale
  timeZone: string
  canReadEvents: boolean
}) {
  let article: NewsArticleResponse
  try {
    article = await getNewsArticleById(id)
  } catch (error) {
    const status = getHttpStatus(error)
    if (status === 404) notFound()
    if (status === 401 || status === 403) {
      return (
        <AccessDenied
          description={dictionary.newsArticles.detailDenied}
          permission={NEWS_ARTICLE_READ_PERMISSIONS[0]}
        />
      )
    }
    throw error
  }

  const imageUrl = getImageUrl(article)
  const description = article.description?.trim()
  const content = article.content?.trim()

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        {article.status ? (
          <NewsArticleStatusBadge
            status={article.status}
            label={dictionary.newsArticles.statusLabels[article.status]}
          />
        ) : null}
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
          {article.title?.trim() || dictionary.newsArticles.titleUnavailable}
        </h1>
        <p className="whitespace-pre-wrap text-muted-foreground">
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
          {article.url ? (
            <Badge
              className="min-h-6"
              render={
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              {dictionary.newsArticles.openOriginalLink}
              <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
            </Badge>
          ) : null}
        </div>
      </header>

      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={article.featureImage?.altText?.trim() || article.title || ""}
          width={1200}
          height={675}
          className="h-auto w-full rounded-lg object-cover"
        />
      ) : null}

      {article.status === "CONTENT_FAILED" ? (
        <p role="status" className="text-muted-foreground">
          {dictionary.newsArticles.contentProcessingFailed}
        </p>
      ) : null}
      {content ? (
        <NewsArticleMarkdown className="max-w-none" content={content} />
      ) : article.status === "CONTENT_FAILED" ? null : (
        <p role="status" className="text-muted-foreground">
          {dictionary.newsArticles.contentUnavailable}
        </p>
      )}

      {Array.isArray(article.linkedEvents) ? (
        <NewsArticleLinkedEvents
          events={article.linkedEvents}
          dictionary={dictionary}
          canReadEvents={canReadEvents}
          locale={locale}
        />
      ) : null}
    </article>
  )
}

function NewsArticleDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-full max-w-80" />
      <div className="flex flex-col gap-8">
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </div>
  )
}
