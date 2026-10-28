import { AppPaginationSkeleton } from "@/components/app-pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"

export default function FeedbackLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-6" role="status" aria-busy="true">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <AppPaginationSkeleton />
    </div>
  )
}
