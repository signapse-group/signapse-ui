import { getServerDictionary } from "@/app/lib/i18n/server"
import { Skeleton } from "@/components/ui/skeleton"

export default async function UsageLimitsLoading() {
  const dictionary = await getServerDictionary()

  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      role="status"
      aria-busy="true"
      aria-label={dictionary.usageLimits.loading}
    >
      <span className="sr-only">{dictionary.usageLimits.loading}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
