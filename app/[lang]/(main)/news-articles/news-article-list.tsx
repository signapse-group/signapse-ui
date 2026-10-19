"use client"

import { Calendar, Eye, ExternalLink, Newspaper } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"

import { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { NewsArticleListResponse } from "@/app/lib/news-articles/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
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
import { SortSelect } from "@/components/sort-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { NewsArticleDeleteButton } from "./news-article-delete-button"
import { NewsArticleSearch } from "./news-article-search"

interface NewsArticleListProps {
  newsArticlePage: Page<NewsArticleListResponse>
}

export function NewsArticleList({ newsArticlePage }: NewsArticleListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const articles = newsArticlePage.content ?? []

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          <NewsArticleSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            options={[
              {
                label: dictionary.newsArticles.newest,
                value: "publishedAt_desc",
              },
              {
                label: dictionary.newsArticles.oldest,
                value: "publishedAt_asc",
              },
              {
                label: dictionary.newsArticles.createdDateSort,
                value: "createdDate_desc",
              },
              { label: dictionary.newsArticles.titleAsc, value: "title_asc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[44%]">
                {dictionary.newsArticles.articleColumn}
              </AppListTableHead>
              <AppListTableHead className="w-44">
                {dictionary.newsArticles.outletColumn}
              </AppListTableHead>
              <AppListTableHead className="w-44">
                {dictionary.newsArticles.timeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-right">
                {dictionary.newsArticles.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {articles.length > 0 ? (
              articles.map((article) => (
                <TableRow
                  key={article.id}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top whitespace-normal">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link
                        href={`/news-articles/${article.id}`}
                        className="line-clamp-1 font-medium break-words hover:underline"
                      >
                        {article.title}
                      </Link>
                      <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                        {article.description?.trim() ||
                          dictionary.newsArticles.noDescription}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-44 max-w-[11rem] text-sm text-muted-foreground">
                    <span className="block truncate">
                      {article.sourceName?.trim() ||
                        dictionary.newsArticles.noOutlet}
                    </span>
                  </TableCell>
                  <TableCell className="w-44">
                    <AppTimeMetadata icon={Calendar}>
                      {formatDateTime(
                        article.publishedAt,
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                        dictionary.common.notAvailable
                      )}
                    </AppTimeMetadata>
                  </TableCell>
                  <TableCell className="w-28 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/news-articles/${article.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                          className:
                            "text-muted-foreground hover:text-foreground",
                        })}
                      >
                        <Eye data-icon="inline-start" />
                        <span className="sr-only">
                          {dictionary.newsArticles.viewDetail}
                        </span>
                      </Link>
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
                        <ExternalLink data-icon="inline-start" />
                        <span className="sr-only">
                          {dictionary.newsArticles.openOriginalLink}
                        </span>
                      </a>
                      <NewsArticleDeleteButton
                        id={article.id}
                        title={article.title}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={4}>
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
