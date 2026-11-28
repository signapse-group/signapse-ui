import { getServerDictionary } from "@/app/lib/i18n/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function RoleDetailLoading() {
  const dictionary = await getServerDictionary()

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0">
      <h1 className="sr-only">{dictionary.roles.detailPageTitle}</h1>
      <div
        role="status"
        aria-busy="true"
        className="flex min-w-0 flex-col gap-5"
      >
        <span className="sr-only">{dictionary.roles.loadingRole}</span>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="grid gap-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
