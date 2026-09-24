"use client"

import { AlertCircle, RefreshCcw } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function UsageLimitsError({ reset }: { reset: () => void }) {
  const { dictionary } = useLocalization()

  return (
    <Empty className="min-h-[360px] border">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive text-destructive-foreground"
        >
          <AlertCircle aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{dictionary.usageLimits.loadErrorTitle}</EmptyTitle>
        <EmptyDescription>
          {dictionary.usageLimits.loadErrorDescription}
        </EmptyDescription>
      </EmptyHeader>
      <Button type="button" variant="outline" onClick={reset}>
        <RefreshCcw data-icon="inline-start" />
        {dictionary.usageLimits.retry}
      </Button>
    </Empty>
  )
}
