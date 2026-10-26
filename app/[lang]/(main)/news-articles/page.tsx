import { Suspense } from "react"

import { getNewsArticles } from "@/app/api/news-articles/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasAnyPermission } from "@/app/lib/permissions"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildFilterQuery, buildSortQuery } from "@/app/lib/utils"
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
  const { page, size } = parsePaginationQuery(params)
  const sort =
    typeof params.sort === "string" ? params.sort : "publishedAt_desc"

  return (
    <Suspense fallback={<NewsArticleListSkeleton dictionary={dictionary} />}>
      <NewsArticleListContent
        page={page}
        size={size}
        sort={sort}
        searchParams={params}
      />
    </Suspense>
  )
}

async function NewsArticleListContent({
  page,
  size,
  sort,
  searchParams,
}: {
  page: number
  size: number
  sort: string
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filter = buildFilterQuery(searchParams)
  const sortQuery = buildSortQuery(sort)

  const newsArticlePage = await getNewsArticles({
    page: page - 1,
    size,
    filter,
    sort: sortQuery,
  })

  return <NewsArticleList newsArticlePage={newsArticlePage} />
}

function NewsArticleListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 flex-1" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Skeleton className="h-9 w-full sm:w-[200px]" />
          <Skeleton className="h-9 w-full sm:w-[120px]" />
        </div>
      </div>
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
              <AppListTableHead className="w-32">
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
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-[260px]" />
                    <Skeleton className="h-3 w-[220px]" />
                  </div>
                </TableCell>
                <TableCell className="w-44 max-w-[11rem]">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="w-44">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="w-32">
                  <Skeleton className="h-6 w-32" />
                </TableCell>
                <TableCell className="w-28 text-right">
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
