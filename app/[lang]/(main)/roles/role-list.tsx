"use client"

import { useLocalization } from "@/app/lib/i18n/provider"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { LocalizedLink } from "@/components/localized-link"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { Badge } from "@/components/ui/badge"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield } from "lucide-react"

interface RoleListPageProps {
  roles: RoleResponse[]
}

export function RoleListPage({ roles }: RoleListPageProps) {
  const { dictionary, formatNumber } = useLocalization()
  const t = dictionary.roles

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight">{t.pageTitle}</h1>

      <AppListTable className="mt-4">
        <Table className="table-fixed">
          <TableCaption className="sr-only">{t.pageTitle}</TableCaption>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead
                scope="col"
                className="w-[44%] whitespace-normal sm:w-[55%]"
              >
                {t.roleColumn}
              </AppListTableHead>
              <AppListTableHead
                scope="col"
                className="w-[30%] whitespace-normal sm:w-[25%]"
              >
                {t.keyColumn}
              </AppListTableHead>
              <AppListTableHead
                scope="col"
                className="w-[26%] text-right whitespace-normal sm:w-[20%]"
              >
                {t.permissionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id} className="border-border">
                  <TableCell className="max-w-0 whitespace-normal">
                    <LocalizedLink
                      href={`/roles/${encodeURIComponent(role.key)}`}
                      className="rounded-sm font-medium text-foreground underline decoration-foreground/60 underline-offset-4 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                    >
                      <span className="break-words">{role.name}</span>
                    </LocalizedLink>
                  </TableCell>
                  <TableCell className="max-w-0 whitespace-normal">
                    <Badge
                      variant="secondary"
                      className="max-w-full font-mono text-xs break-all whitespace-normal"
                    >
                      {role.key}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(role.permissions.length)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={3}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Shield />
                  </EmptyMedia>
                  <EmptyTitle role="heading" aria-level={2}>
                    {t.emptyTitle}
                  </EmptyTitle>
                  <EmptyDescription>{t.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>
    </div>
  )
}
