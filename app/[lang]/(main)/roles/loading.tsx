import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  AppListTable,
  AppListTableHeaderRow,
  AppListTableHead,
} from "@/components/app-list-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default async function RolesLoading() {
  const dictionary = await getServerDictionary()

  return (
    <div role="status" aria-busy="true" className="min-w-0">
      <span className="sr-only">{dictionary.roles.loadingRoles}</span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.roles.pageTitle}
      </h1>
      <AppListTable className="mt-4">
        <Table className="table-fixed">
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[44%] sm:w-[55%]">
                <Skeleton className="h-4 w-16" />
              </AppListTableHead>
              <AppListTableHead className="w-[30%] sm:w-[25%]">
                <Skeleton className="h-4 w-12" />
              </AppListTableHead>
              <AppListTableHead className="w-[26%] sm:w-[20%]">
                <Skeleton className="ml-auto h-4 w-20" />
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {[0, 1, 2].map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <Skeleton className="h-4 w-3/4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-2/3 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>
    </div>
  )
}
