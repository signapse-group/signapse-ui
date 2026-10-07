import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ContactRequestsLoading() {
  const dictionary = await getServerDictionary()
  const t = dictionary.contactRequests

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      role="status"
      aria-label={t.loading}
      aria-busy="true"
    >
      <h1 className="sr-only">{t.pageTitle}</h1>
      <Skeleton className="h-4 max-w-3xl" />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
      <AppListTable className="mt-0">
        <Table className="min-w-[68rem] table-fixed">
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[14.7%] px-4">
                {t.nameLabel}
              </AppListTableHead>
              <AppListTableHead className="w-[21%] px-4">
                {t.emailColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[35%] px-4">
                {t.messageColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[15%] px-4">
                {t.submittedAtColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[14.3%] px-4">
                <span className="sr-only">{t.messageActions}</span>
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="ml-auto h-8 w-32" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-3 sm:ml-auto">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="size-8" key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
