import { Suspense } from "react"

import { getNewsArticles } from "@/app/api/news-articles/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getRequestTimeZone } from "@/app/lib/i18n/time-zone-server"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  buildNewsArticleFilter,
  resolveNewsArticleSort,
} from "@/app/lib/news-articles/query"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasAnyPermission } from "@/app/lib/permissions"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildSortQuery } from "@/app/lib/utils"
import { AccessDenied } from "@/components/access-denied"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { AppPaginationSkeleton } from "@/components/app-pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { NewsArticleList } from "./news-article-list"
import { NewsArticleTimeZoneSync } from "./news-article-time-zone-sync"
import { NewsArticleListError } from "./news-article-list-error"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NewsArticlesPage({ searchParams }: PageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasAnyPermission(permissions, NEWS_ARTICLE_READ_PERMISSIONS)) {
    return (
      <AccessDenied
        description={dictionary.newsArticles.readDenied}
        permission={NEWS_ARTICLE_READ_PERMISSIONS[0]}
      />
    )
  }

  const params = await searchParams
  const { timeZone, known: timeZoneKnown } = await getRequestTimeZone()
  const { page, size } = parsePaginationQuery(params)

  return (
    <Suspense fallback={<NewsArticleListSkeleton dictionary={dictionary} />}>
      <NewsArticleTimeZoneSync
        timeZone={timeZone}
        timeZoneKnown={timeZoneKnown}
        fallback={<NewsArticleListSkeleton dictionary={dictionary} />}
      >
        <NewsArticleListContent
          page={page}
          size={size}
          searchParams={params}
          timeZone={timeZone}
          dictionary={dictionary}
        />
      </NewsArticleTimeZoneSync>
    </Suspense>
  )
}

async function NewsArticleListContent({
  page,
  size,
  searchParams,
  timeZone,
  dictionary,
}: {
  page: number
  size: number
  searchParams: { [key: string]: string | string[] | undefined }
  timeZone: string
  dictionary: Dictionary
}) {
  let filter: string
  let sortQuery
  try {
    filter = buildNewsArticleFilter(searchParams, timeZone)
    sortQuery = buildSortQuery(resolveNewsArticleSort(searchParams.sort))
  } catch {
    return <NewsArticleListError kind="query" dictionary={dictionary} />
  }

  let newsArticlePage: Awaited<ReturnType<typeof getNewsArticles>> | undefined
  let fetchError: unknown
  let fetchFailed = false
  try {
    newsArticlePage = await getNewsArticles({
      page: page - 1,
      size,
      filter,
      sort: sortQuery,
    })
  } catch (error) {
    fetchError = error
    fetchFailed = true
  }

  if (fetchFailed || !newsArticlePage) {
    const status = getHttpStatus(fetchError)

    if (status === 401 || status === 403) {
      return (
        <AccessDenied
          description={dictionary.newsArticles.readDenied}
          permission={NEWS_ARTICLE_READ_PERMISSIONS[0]}
        />
      )
    }

    if (status === 400 || status === 422) {
      return <NewsArticleListError kind="query" dictionary={dictionary} />
    }

    return <NewsArticleListError kind="load" dictionary={dictionary} />
  }

  return (
    <NewsArticleList newsArticlePage={newsArticlePage} timeZone={timeZone} />
  )
}

function getHttpStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined
  const status = (error as { status?: unknown }).status
  return typeof status === "number" ? status : undefined
}

function NewsArticleListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 min-[1440px]:flex min-[1440px]:flex-wrap">
        <Skeleton className="col-span-2 row-start-1 h-11 min-[768px]:col-span-1 min-[768px]:row-start-1 min-[1440px]:w-72" />
        <Skeleton className="col-start-1 row-start-2 h-11 min-[768px]:hidden" />
        <Skeleton className="col-start-2 row-start-2 h-11 min-[768px]:row-start-1 min-[768px]:w-[200px] min-[1440px]:order-last" />
        <div className="col-span-2 row-start-3 hidden flex-wrap items-center gap-2 min-[768px]:row-start-2 min-[768px]:flex min-[1440px]:contents">
          <Skeleton className="h-9 w-[170px]" />
          <Skeleton className="h-9 w-[220px]" />
          <Skeleton className="h-9 w-[320px]" />
        </div>
      </div>
      <div className="mb-4">
        <Skeleton className="h-5 w-64" />
      </div>
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
              <AppListTableHead className="w-28 text-right">
                {dictionary.newsArticles.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 gap-3">
                    <Skeleton className="size-14 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-[260px] max-w-full" />
                      <Skeleton className="h-3 w-[220px] max-w-full" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden w-40 max-w-40 min-[1440px]:table-cell">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="hidden w-44 min-[1440px]:table-cell">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="hidden w-36 min-[768px]:table-cell">
                  <Skeleton className="h-6 w-32" />
                </TableCell>
                <TableCell className="w-24 text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationSkeleton className="mt-4" />
    </div>
  )
}
