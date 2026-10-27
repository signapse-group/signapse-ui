import { Suspense } from "react"

import { getRoles } from "@/app/api/roles/action"
import { getUsers } from "@/app/api/user/action"
import type { Page } from "@/app/lib/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import type {
  UserResponse,
  UserSearchResponse,
} from "@/app/lib/users/definitions"
import { buildFilterQuery } from "@/app/lib/utils"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
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

import { UserListPage } from "./user-list"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function buildClientPage(
  users: UserResponse[],
  page: number,
  size: number
): Page<UserResponse> {
  const totalElements = users.length
  const totalPages = totalElements > 0 ? Math.ceil(totalElements / size) : 0
  const pageIndex = Math.max(0, page - 1)
  const start = pageIndex * size
  const content = users.slice(start, start + size)

  return {
    content,
    empty: content.length === 0,
    first: pageIndex <= 0,
    last: totalPages === 0 || pageIndex >= totalPages - 1,
    number: pageIndex,
    numberOfElements: content.length,
    pageable: {
      offset: start,
      pageNumber: pageIndex,
      pageSize: size,
      paged: true,
      unpaged: false,
    },
    size,
    totalElements,
    totalPages,
  }
}

function isUserPageResponse(
  response: UserSearchResponse
): response is Page<UserResponse> {
  return !Array.isArray(response) && Array.isArray(response.content)
}

function normalizeUserPage(
  response: UserSearchResponse,
  page: number,
  size: number
) {
  return isUserPageResponse(response)
    ? response
    : buildClientPage(response, page, size)
}

async function getRoleOptions(permissions: string[]): Promise<{
  roles: RoleResponse[]
  rolesAvailable: boolean
}> {
  if (!hasPermission(permissions, "role:update")) {
    return { roles: [], rolesAvailable: false }
  }

  try {
    return { roles: await getRoles(), rolesAvailable: true }
  } catch (error) {
    console.error("Failed to load user management roles:", error)
    return { roles: [], rolesAvailable: false }
  }
}

export default async function UsersPage({ searchParams }: PageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, "user:search")) {
    return (
      <AccessDenied
        description={dictionary.users.accessDeniedDescription}
        permission="user:search"
      />
    )
  }

  return (
    <Suspense fallback={<ListSkeleton dictionary={dictionary} />}>
      <UserListContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

async function UserListContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const { page: pageParam, size: sizeParam, ...filterParams } = resolvedParams
  const { page, size } = parsePaginationQuery({
    page: pageParam,
    size: sizeParam,
  })
  const filter = buildFilterQuery(filterParams)
  const permissions = await getCurrentPermissions()
  const userResponse = await getUsers({
    filter,
    page: page - 1,
    size,
    sort: [],
  })
  const { roles, rolesAvailable } = await getRoleOptions(permissions)
  const userPage = normalizeUserPage(userResponse, page, size)

  return (
    <UserListPage
      userPage={userPage}
      roles={roles}
      rolesAvailable={rolesAvailable}
    />
  )
}

function ListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-8 w-full sm:w-[160px]" />
          <Skeleton className="h-8 w-full sm:w-80 lg:w-96" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Skeleton className="h-8 w-full sm:w-[120px]" />
        </div>
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[38%]">
                {dictionary.users.userColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {dictionary.users.phoneColumn}
              </AppListTableHead>
              <AppListTableHead className="w-44">
                {dictionary.users.roleColumn}
              </AppListTableHead>
              <AppListTableHead className="w-48">
                {dictionary.users.workspaceColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-center">
                {dictionary.users.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-40">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="w-44">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="w-48">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="w-28 text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
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
