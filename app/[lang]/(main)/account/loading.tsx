import { getServerDictionary } from "@/app/lib/i18n/server"
import { AppFormShellSkeleton } from "@/components/app-form-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default async function AccountLoading() {
  const dictionary = await getServerDictionary()

  return (
    <AppFormShellSkeleton
      aria-busy="true"
      aria-label={dictionary.accountProfile.loadingLabel}
      role="status"
      surface="plain"
      width="lg"
    >
      <div className="flex items-center gap-4 pt-6">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-28 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <div className="grid gap-5 py-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="flex flex-col gap-2" key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t py-4 sm:flex-row sm:justify-end">
        <Skeleton className="h-9 w-full sm:w-24" />
        <Skeleton className="h-9 w-full sm:w-32" />
      </div>
      <div aria-hidden="true" className="mt-8 border-t pt-6">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-9 w-full sm:max-w-sm" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <Skeleton className="mt-5 h-8 w-32" />
      </div>
    </AppFormShellSkeleton>
  )
}
