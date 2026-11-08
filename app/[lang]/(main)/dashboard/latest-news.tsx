import { ArrowRightIcon, CircleSlashIcon, NewspaperIcon } from "lucide-react"
import Image from "next/image"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime } from "@/app/lib/i18n/format"
import type { NewsArticleListResponse } from "@/app/lib/news-articles/definitions"
import { LocalizedLink } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"

import { DashboardQuickDetailButton } from "./dashboard-quick-detail"
import {
  OverviewModuleAction,
  OverviewModuleHeader,
} from "./overview-module-header"

export function LatestNews({
  articles,
  denied = false,
  dictionary,
  error,
  locale,
  timeZone,
}: {
  articles: NewsArticleListResponse[]
  denied?: boolean
  dictionary: Dictionary
  error: string | null
  locale: AppLocale
  timeZone: string
}) {
  const t = dictionary.workspaceOverview.latestNews
  const hasArticles = articles.length > 0

  return (
    <section aria-labelledby="dashboard-latest-news-title">
      <Card className="min-w-0">
        <OverviewModuleHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <h2 id="dashboard-latest-news-title">{t.title}</h2>
            <Badge variant="secondary">{t.globalScope}</Badge>
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
          {!denied ? (
            <OverviewModuleAction>
              <LocalizedLink
                href="/news-articles"
                aria-label={t.viewAll}
                className={buttonVariants({ variant: "ghost" })}
              >
                {t.viewAll}
                <ArrowRightIcon data-icon="inline-end" />
              </LocalizedLink>
            </OverviewModuleAction>
          ) : null}
        </OverviewModuleHeader>
        <CardContent>
          {denied ? (
            <Empty className="min-h-48 border" role="status">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleSlashIcon />
                </EmptyMedia>
                <EmptyTitle>{t.deniedTitle}</EmptyTitle>
                <EmptyDescription>{t.deniedDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : error ? (
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleSlashIcon />
                </EmptyMedia>
                <EmptyTitle>{t.errorTitle}</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : hasArticles ? (
            <LatestNewsItems
              articles={articles}
              dictionary={dictionary}
              locale={locale}
              timeZone={timeZone}
            />
          ) : (
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <NewspaperIcon />
                </EmptyMedia>
                <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                <EmptyDescription>{t.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function LatestNewsSkeleton() {
  return (
    <section aria-hidden="true">
      <Card className="min-w-0">
        <OverviewModuleHeader>
          <CardTitle>
            <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-56 max-w-full motion-reduce:animate-none" />
          </CardDescription>
          <OverviewModuleAction>
            <Skeleton className="h-9 w-28 motion-reduce:animate-none" />
          </OverviewModuleAction>
        </OverviewModuleHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="flex items-start gap-3" key={index}>
                <Skeleton className="size-10 shrink-0 motion-reduce:animate-none" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-full motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-full max-w-xl motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-2/3 motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function LatestNewsItems({
  articles,
  dictionary,
  locale,
  timeZone,
}: {
  articles: NewsArticleListResponse[]
  dictionary: Dictionary
  locale: AppLocale
  timeZone: string
}) {
  const t = dictionary.workspaceOverview.latestNews

  return (
    <ItemGroup className="gap-0">
      {articles.map((article, index) => {
        const description =
          article.description?.trim() || dictionary.newsArticles.noDescription
        const title =
          article.title?.trim() || dictionary.newsArticles.titleUnavailable
        const source =
          article.sourceName?.trim() || dictionary.newsArticles.noOutlet
        const publishedAt = article.publishedAt
          ? formatDateTime(
              article.publishedAt,
              locale,
              {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone,
              },
              t.invalidDate
            )
          : dictionary.workspaceOverview.noData
        const imageUrl =
          article.featureImage?.urlThumbnail ||
          article.featureImage?.urlMedium ||
          article.featureImage?.urlLarge ||
          article.featureImage?.urlOriginal

        return (
          <div key={article.id ?? `news-article-${index}`} role="listitem">
            {index > 0 ? <ItemSeparator /> : null}
            <Item>
              <ItemMedia variant={imageUrl ? "image" : "icon"}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={article.featureImage?.altText?.trim() || title}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <NewspaperIcon aria-hidden="true" />
                )}
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>
                  <h3 className="line-clamp-2">
                    {article.id !== undefined ? (
                      <DashboardQuickDetailButton
                        className="cursor-pointer text-left font-medium underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                        entity={{ id: article.id, kind: "news-article" }}
                        aria-label={`${t.openArticle}: ${title}`}
                      >
                        {title}
                      </DashboardQuickDetailButton>
                    ) : (
                      <span className="font-medium">{title}</span>
                    )}
                  </h3>
                </ItemTitle>
                <ItemDescription className="line-clamp-2">
                  {description}
                </ItemDescription>
                <p className="text-xs text-muted-foreground">
                  <span>{source}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{publishedAt}</span>
                </p>
              </ItemContent>
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )
}
