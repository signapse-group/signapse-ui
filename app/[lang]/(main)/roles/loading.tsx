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

export default async function RolesLoading() {
  const dictionary = await getServerDictionary()
  const t = dictionary.roles

  return (
    <>
      <h1 className="sr-only">{dictionary.navigation.roles}</h1>
      <div
        className="min-w-0"
        role="status"
        aria-label={t.loading}
        aria-busy="true"
      >
        <AppListTable className="mt-0">
          <Table>
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-56">
                  {t.roleColumn}
                </AppListTableHead>
                <AppListTableHead className="w-48">
                  {t.keyColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[40%]">
                  {t.descriptionColumn}
                </AppListTableHead>
                <AppListTableHead className="w-28 text-center">
                  {t.permissionsColumn}
                </AppListTableHead>
                <AppListTableHead className="w-44 text-right">
                  {t.actionsColumn}
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell className="w-56 max-w-[14rem] align-top whitespace-normal">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="w-48 max-w-[12rem]">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="w-[40%] align-top">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </TableCell>
                  <TableCell className="w-28">
                    <Skeleton className="mx-auto h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="w-44">
                    <Skeleton className="ml-auto h-8 w-36" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppListTable>
      </div>
    </>
  )
}
