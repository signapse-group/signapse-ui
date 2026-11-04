"use client"

import { Calendar, Eye, ExternalLink, Newspaper } from "lucide-react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/localized-link"

import type { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { formatNewsArticleDateTime } from "@/app/lib/news-articles/date-time"
import type { NewsArticleListResponse } from "@/app/lib/news-articles/definitions"
import { useHasAnyPermission } from "@/components/permission-provider"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { NEWS_ARTICLE_DELETE_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { NewsArticleDeleteButton } from "./news-article-delete-button"
import { NewsArticleFilters } from "./news-article-filters"
import { NewsArticleStatusBadge } from "./news-article-status-badge"

interface NewsArticleListProps {
  newsArticlePage: Page<NewsArticleListResponse>
  timeZone: string
}

function getListImageUrl(article: NewsArticleListResponse) {
  return (
    article.featureImage?.urlThumbnail ||
    article.featureImage?.urlMedium ||
    article.featureImage?.urlLarge ||
    article.featureImage?.urlOriginal
  )
}

export function NewsArticleList({
  newsArticlePage,
  timeZone,
}: NewsArticleListProps) {
  const { dictionary, locale } = useLocalization()
  const articles = newsArticlePage.content ?? []
  const canDelete = useHasAnyPermission(NEWS_ARTICLE_DELETE_PERMISSIONS)

  return (
    <div className="w-full">
      <NewsArticleFilters timeZone={timeZone} />

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="min-w-64">
                {dictionary.newsArticles.articleColumn}
              </AppListTableHead>
              <AppListTableHead className="hidden w-40 min-[1440px]:table-cell">
                {dictionary.newsArticles.outletColumn}
              </AppListTableHead>
              <AppListTableHead className="hidden w-44 min-[1440px]:table-cell">
                {dictionary.newsArticles.timeColumn}
              </AppListTableHead>
              <AppListTableHead className="hidden w-36 min-[768px]:table-cell">
                {dictionary.newsArticles.statusColumn}
              </AppListTableHead>
              <AppListTableHead className="w-24 text-right">
                {dictionary.newsArticles.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {articles.length > 0 ? (
              articles.map((article, index) => {
                const imageUrl = getListImageUrl(article)
                const title =
                  article.title?.trim() ||
                  dictionary.newsArticles.titleUnavailable
                const articleHref =
                  article.id === undefined
                    ? null
                    : `/news-articles/${article.id}`

                return (
                  <TableRow
                    key={article.id ?? `news-article-${index}`}
                    className="border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="min-w-64 align-top whitespace-normal">
                      <div className="flex min-w-0 gap-3">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={article.featureImage?.altText?.trim() || ""}
                            width={72}
                            height={56}
                            className="size-14 shrink-0 rounded-md object-cover"
                          />
                        ) : null}
                        <div className="flex min-w-0 flex-col gap-1">
                          {articleHref ? (
                            <Link
                              href={articleHref}
                              className="line-clamp-2 font-medium break-words hover:underline"
                            >
                              {title}
                            </Link>
                          ) : (
                            <span className="line-clamp-2 font-medium break-words">
                              {title}
                            </span>
                          )}
                          <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                            {article.description?.trim() ||
                              dictionary.newsArticles.descriptionUnavailable}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground min-[1440px]:hidden">
                            <span className="max-w-full truncate">
                              {article.sourceName?.trim() ||
                                dictionary.newsArticles.noOutlet}
                            </span>
                            <span>
                              {formatNewsArticleDateTime(
                                article.publishedAt,
                                locale,
                                timeZone,
                                dictionary.common.notAvailable
                              )}
                            </span>
                          </div>
                          {article.status ? (
                            <div className="min-[768px]:hidden">
                            <NewsArticleStatusBadge
                              status={article.status}
                              label={
                                dictionary.newsArticles.statusLabels[
                                  article.status
                                ]
                              }
                            />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden w-40 max-w-40 text-sm text-muted-foreground min-[1440px]:table-cell">
                      <span className="block truncate">
                        {article.sourceName?.trim() ||
                          dictionary.newsArticles.noOutlet}
                      </span>
                    </TableCell>
                    <TableCell className="hidden w-44 min-[1440px]:table-cell">
                      <AppTimeMetadata icon={Calendar}>
                        {formatNewsArticleDateTime(
                          article.publishedAt,
                          locale,
                          timeZone,
                          dictionary.common.notAvailable
                        )}
                      </AppTimeMetadata>
                    </TableCell>
                    <TableCell className="hidden w-36 min-[768px]:table-cell">
                      {article.status ? (
                        <NewsArticleStatusBadge
                          status={article.status}
                          label={
                            dictionary.newsArticles.statusLabels[article.status]
                          }
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="w-24 text-right">
                      <div className="flex justify-end gap-1">
                        {articleHref ? (
                          <Link
                            href={articleHref}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                              className:
                                "text-muted-foreground hover:text-foreground",
                            })}
                          >
                            <Eye aria-hidden="true" />
                            <span className="sr-only">
                              {dictionary.newsArticles.viewDetail}
                            </span>
                          </Link>
                        ) : null}
                        {article.url?.trim() ? (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                              className:
                                "text-muted-foreground hover:text-foreground",
                            })}
                          >
                            <ExternalLink aria-hidden="true" />
                            <span className="sr-only">
                              {dictionary.newsArticles.openOriginalLink}
                            </span>
                          </a>
                        ) : null}
                        {canDelete && article.id !== undefined ? (
                          <NewsArticleDeleteButton
                            id={article.id}
                            title={title}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <AppListTableEmptyState colSpan={5}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Newspaper className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.newsArticles.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.newsArticles.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={newsArticlePage} className="mt-4" />
    </div>
  )
}
