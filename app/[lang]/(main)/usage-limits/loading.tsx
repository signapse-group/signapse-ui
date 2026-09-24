import { Skeleton } from "@/components/ui/skeleton"
import { getServerDictionary } from "@/app/lib/i18n/server"

export default async function UsageLimitsLoading() {
  const dictionary = await getServerDictionary()

  return (
    <div
      aria-busy="true"
      aria-label={dictionary.usageLimits.loadingLabel}
      className="flex min-w-0 flex-col gap-6"
      role="status"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full max-w-3xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="flex min-h-52 flex-col gap-4 rounded-xl ring-1 ring-foreground/10"
            key={index}
          >
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
        <div className="flex min-h-52 flex-col gap-4 rounded-xl ring-1 ring-foreground/10 md:col-span-2">
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <div className="flex flex-col gap-3 px-4 pb-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton className="h-11 w-full" key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
