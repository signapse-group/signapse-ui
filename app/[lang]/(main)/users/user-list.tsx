"use client"

import { SquarePen, Users } from "lucide-react"
import { useState } from "react"

import type { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import type { UserResponse } from "@/app/lib/users/definitions"
import {
  AppListToolbar,
  AppListToolbarLeading,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"

import { UserFormDialog } from "./user-form-dialog"
import { UserSearch } from "./user-search"

interface UserListPageProps {
  roles: RoleResponse[]
  rolesAvailable: boolean
  userPage: Page<UserResponse>
}

function getDisplayName(user: UserResponse, fallback: string) {
  const displayName = [user.lastName, user.firstName]
    .filter(Boolean)
    .join(" ")
    .trim()
  return displayName || fallback
}

function getAvatarFallback(name: string, email: string) {
  const source = name || email
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")

  return initials || "U"
}

function getAvatarUrl(user: UserResponse) {
  return (
    user.mainImage?.urlThumbnail ??
    user.mainImage?.urlMedium ??
    user.mainImage?.urlOriginal ??
    ""
  )
}

export function UserListPage({
  roles,
  rolesAvailable,
  userPage,
}: UserListPageProps) {
  const { dictionary } = useLocalization()
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const users = userPage.content ?? []

  function openUpdateDialog(user: UserResponse) {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading className="lg:items-start">
          <UserSearch />
        </AppListToolbarLeading>
      </AppListToolbar>

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
            {users.length > 0 ? (
              users.map((user) => {
                const displayName = getDisplayName(
                  user,
                  dictionary.users.noName
                )
                const email = user.email || dictionary.users.noEmail

                return (
                  <TableRow
                    key={user.id}
                    className="border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 rounded-lg">
                          <AvatarImage
                            src={getAvatarUrl(user)}
                            alt={displayName}
                          />
                          <AvatarFallback className="rounded-lg">
                            {getAvatarFallback(displayName, email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="line-clamp-1 font-medium break-words text-foreground">
                            {displayName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-40 max-w-[10rem]">
                      <span className="block truncate text-sm">
                        {user.phone === null || user.phone === undefined
                          ? dictionary.users.noPhone
                          : String(user.phone)}
                      </span>
                    </TableCell>
                    <TableCell className="w-44 max-w-[11rem]">
                      {user.role_name ? (
                        <Badge variant="secondary" className="max-w-full">
                          <span className="truncate">{user.role_name}</span>
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {dictionary.users.noRole}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="w-48 max-w-[12rem]">
                      <span className="block truncate text-sm text-muted-foreground">
                        {user.currentWorkspace?.name ||
                          dictionary.users.noWorkspace}
                      </span>
                    </TableCell>
                    <TableCell className="w-28 text-center">
                      <div className="flex justify-center">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openUpdateDialog(user)}
                                aria-label={dictionary.users.edit}
                              />
                            }
                          >
                            <SquarePen data-icon="inline-start" />
                            <span className="sr-only">
                              {dictionary.users.edit}
                            </span>
                          </TooltipTrigger>
                          <TooltipContentInOverlay>
                            {dictionary.users.editTooltip}
                          </TooltipContentInOverlay>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <AppListTableEmptyState colSpan={5}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.users.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.users.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={userPage} className="mt-4" />

      <UserFormDialog
        open={dialogOpen}
        roles={roles}
        rolesAvailable={rolesAvailable}
        user={selectedUser}
        onOpenChange={(open) => {
          setDialogOpen(open)

          if (!open) {
            setSelectedUser(null)
          }
        }}
      />
    </div>
  )
}
