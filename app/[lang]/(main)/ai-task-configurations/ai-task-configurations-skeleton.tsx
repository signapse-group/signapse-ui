import { AppListTable } from "@/components/app-list-table"
import { Skeleton } from "@/components/ui/skeleton"

const TASKS_BY_GROUP = [2, 1, 4, 1, 2, 1]

export function AiTaskConfigurationsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-full max-w-3xl" />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-4">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <AppListTable className="mt-0">
        {TASKS_BY_GROUP.map((taskCount, groupIndex) => (
          <section key={groupIndex}>
            <div className="flex flex-col gap-2 border-y border-border px-4 py-3 md:px-6">
              <Skeleton className="h-5 w-48" />
              {groupIndex > 3 ? (
                <Skeleton className="h-4 w-96 max-w-full" />
              ) : null}
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: taskCount }, (_, taskIndex) => (
                <div
                  key={`${groupIndex}-${taskIndex}`}
                  className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.25fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(10rem,1.1fr)_auto]"
                >
                  <div className="flex flex-col gap-1 sm:col-span-2 xl:col-span-1">
                    <Skeleton className="h-5 w-52" />
                    <Skeleton className="h-4 w-full max-w-xs" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="flex items-end xl:items-center">
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </AppListTable>

      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  )
}
