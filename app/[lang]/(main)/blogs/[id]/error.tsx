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

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useLocalization()

  return (
    <div className="flex h-[400px] w-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive"
          >
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>{dictionary.blogs.errorTitle}</EmptyTitle>
          <EmptyDescription>
            {dictionary.blogs.errorDescription}
          </EmptyDescription>
        </EmptyHeader>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => reset()} variant="outline">
            <RefreshCcw data-icon="inline-start" />
            {dictionary.common.retry}
          </Button>
        </div>
      </Empty>
    </div>
  )
}
