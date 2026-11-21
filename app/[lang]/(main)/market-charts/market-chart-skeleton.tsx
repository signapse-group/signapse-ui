import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function MarketChartToolbarSkeleton() {
  return (
    <div className="border-b bg-card p-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-8 w-full rounded-lg sm:max-w-md" />
          <div className="flex max-w-full gap-1 overflow-hidden rounded-lg p-px">
            {["w-10", "w-10", "w-12", "w-12", "w-10", "w-10"].map(
              (width, index) => (
                <Skeleton
                  key={`${width}-${index}`}
                  className={cn("h-7 rounded-lg", width)}
                />
              )
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function MarketChartDrawingToolbarSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="market-chart-drawing-toolbar-skeleton"
      className="flex shrink-0 flex-col items-center gap-1 overflow-hidden border-r bg-card p-1"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className="size-8 rounded-lg" />
      ))}
    </div>
  )
}

function MarketChartPlotSkeleton() {
  return (
    <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-card">
      <div className="absolute inset-x-0 top-1/4 h-px bg-border/70" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/70" />
      <div className="absolute inset-x-0 top-3/4 h-px bg-border/70" />
      <div className="absolute inset-y-0 left-1/4 w-px bg-border/70" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-border/70" />
      <div className="absolute inset-y-0 left-3/4 w-px bg-border/70" />
      <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
        <Skeleton className="h-3 w-8 rounded-full" />
        <Skeleton className="h-3 w-8 rounded-full" />
        <Skeleton className="h-3 w-8 rounded-full" />
        <Skeleton className="h-3 w-8 rounded-full" />
      </div>
      <Skeleton className="absolute top-[28%] left-[14%] h-16 w-24 rounded-lg opacity-60" />
      <Skeleton className="absolute top-[42%] left-[36%] h-24 w-28 rounded-lg opacity-70" />
      <Skeleton className="absolute top-[24%] right-[18%] h-20 w-24 rounded-lg opacity-60" />
      <div className="absolute inset-y-0 right-0 flex w-16 flex-col items-center justify-evenly border-l border-border/60 py-6">
        <Skeleton className="h-3 w-10 rounded-full" />
        <Skeleton className="h-3 w-10 rounded-full" />
        <Skeleton className="h-3 w-10 rounded-full" />
        <Skeleton className="h-3 w-10 rounded-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-around border-t border-border/60">
        <Skeleton className="h-3 w-12 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
    </div>
  )
}

function MarketChartStatusRailSkeleton() {
  return (
    <div className="border-t bg-muted/10 px-3 py-1.5">
      <div className="flex min-h-7 items-center gap-2">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-3 w-40 rounded-full" />
      </div>
    </div>
  )
}

function MarketChartSkeletonContent({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}>
      <MarketChartPlotSkeleton />
    </div>
  )
}

function MarketChartSurfaceSkeleton({
  className,
  embedded = false,
  showStatusRail = true,
}: {
  className?: string
  embedded?: boolean
  showStatusRail?: boolean
}) {
  if (embedded) {
    return (
      <div className={cn("flex h-full min-h-0 min-w-0", className)}>
        <MarketChartDrawingToolbarSkeleton />
        <MarketChartSkeletonContent className="min-w-0 flex-1" />
      </div>
    )
  }

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card",
        className
      )}
    >
      <MarketChartToolbarSkeleton />
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-card">
        <div className="flex h-full min-h-0 min-w-0">
          <MarketChartDrawingToolbarSkeleton />
          <MarketChartSkeletonContent className="flex-1" />
        </div>
      </div>
      {showStatusRail ? <MarketChartStatusRailSkeleton /> : null}
    </section>
  )
}

export { MarketChartSurfaceSkeleton }
