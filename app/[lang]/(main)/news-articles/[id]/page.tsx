import { ArrowLeft, ArrowUpRightIcon, Calendar, Globe2 } from "lucide-react"
import { NewsArticleMarkdown } from "../news-article-markdown"
import { LocalizedLink as Link } from "@/components/localized-link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getNewsArticleById } from "@/app/api/news-articles/action"
import { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime as formatLocalizedDateTime } from "@/app/lib/i18n/format"
import { getRequestLocale, getServerDictionary } from "@/app/lib/i18n/server"
import { NewsArticleResponse } from "@/app/lib/news-articles/definitions"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

interface PageProps {
  params: Promise<{ id: string }>
}

type ApiLikeError = Error & { status?: number }

function formatDateTime(
  value: string | null | undefined,
  locale: AppLocale,
  dictionary: Dictionary
) {
  if (!value) {
    return dictionary.common.notAvailable
  }

  return formatLocalizedDateTime(
    value,
    locale,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
    dictionary.common.notAvailable
  )
}

function getImageUrl(article: NewsArticleResponse) {
  return (
    article.featureImage?.urlMedium ||
    article.featureImage?.urlLarge ||
    article.featureImage?.urlOriginal
  )
}

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  if ((error as ApiLikeError).status === 404) {
    return true
  }

  return /(?:^|\b)(?:404|not[\s-]?found)(?:\b|$)/i.test(error.message)
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
        <FetchNewsArticleData
          id={newsArticleId}
          dictionary={dictionary}
          locale={locale}
        />
      </Suspense>
    </div>
  )
}

async function FetchNewsArticleData({
  id,
  dictionary,
  locale,
}: {
  id: number
  dictionary: Dictionary
  locale: AppLocale
}) {
  let article: NewsArticleResponse

  try {
    article = await getNewsArticleById(id)
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }

    throw error
  }

  const imageUrl = getImageUrl(article)
  const title = article.title ?? dictionary.newsArticles.titleUnavailable
  const description = article.description?.trim()
  const content = article.content?.trim()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-xl leading-tight font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <AppTimeMetadata icon={Globe2}>
              {article.sourceName?.trim() || dictionary.newsArticles.noOutlet}
            </AppTimeMetadata>
            <AppTimeMetadata icon={Calendar}>
              {formatDateTime(article.publishedAt, locale, dictionary)}
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
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.featureImage?.altText?.trim() || title}
            width={800}
            height={450}
          />
        ) : null}

        <NewsArticleMarkdown
          className="max-w-none"
          content={content || dictionary.newsArticles.contentEmpty}
        />
      </div>
    </div>
  )
}

function NewsArticleDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full max-w-80" />
        </div>
        <Skeleton className="size-8 shrink-0" />
      </div>
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
