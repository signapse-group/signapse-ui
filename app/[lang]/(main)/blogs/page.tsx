import { Suspense } from "react"
import { BlogListPage } from "./blog-list"
import { getBlogs } from "@/app/api/blogs/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildSortQuery, buildFilterQuery } from "@/app/lib/utils"
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

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: BlogPageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasPermission(permissions, "blog:read")) {
    return (
      <AccessDenied
        description={dictionary.blogs.readDenied}
        permission="blog:read"
      />
    )
  }

  return (
    <Suspense fallback={<BlogListSkeleton />}>
      <BlogListContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

async function BlogListContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const {
    page: pageParam,
    size: sizeParam,
    sort = "",
    ...filterParams
  } = resolvedParams
  const { page, size } = parsePaginationQuery({
    page: pageParam,
    size: sizeParam,
  })

  const filter = buildFilterQuery(filterParams)

  const blogPage = await getBlogs({
    filter: filter,
    page: page - 1,
    size,
    sort: buildSortQuery(sort as string),
  })

  return <BlogListPage blogPage={blogPage} />
}

function BlogListSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex w-full flex-1 items-center gap-4 sm:w-auto">
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        <Skeleton className="h-9 w-[180px]" />
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[58%]">
                <Skeleton className="h-4 w-32" />
              </AppListTableHead>
              <AppListTableHead className="w-32 text-center">
                <Skeleton className="mx-auto h-4 w-20" />
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                <Skeleton className="mx-auto h-4 w-32" />
              </AppListTableHead>
              <AppListTableHead className="w-28 text-center">
                <Skeleton className="ml-auto h-4 w-20" />
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </TableCell>
                <TableCell className="w-32 text-center">
                  <Skeleton className="mx-auto h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="w-40 text-center">
                  <Skeleton className="mx-auto h-4 w-32" />
                </TableCell>
                <TableCell className="w-28 text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
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
