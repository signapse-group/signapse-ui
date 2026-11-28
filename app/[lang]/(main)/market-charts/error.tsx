"use client"

import { useEffect } from "react"
import { ChartCandlestick, RotateCcw } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useLocalization()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="-m-5 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
      <Empty className="min-h-0 flex-1 rounded-none border-0 bg-transparent">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive"
          >
            <ChartCandlestick />
          </EmptyMedia>
          <EmptyTitle>{dictionary.marketCharts.errorTitle}</EmptyTitle>
          <EmptyDescription>
            {error.message || dictionary.marketCharts.errorDescription}
          </EmptyDescription>
        </EmptyHeader>

        <Button onClick={() => reset()} variant="outline">
          <RotateCcw data-icon="inline-start" />
          {dictionary.common.retry}
        </Button>
      </Empty>
    </div>
  )
}
