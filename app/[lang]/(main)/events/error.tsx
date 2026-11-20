"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <div
      className="flex min-h-[400px] items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
    >
      <Card className="max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold">
            {dictionary.events.errorTitle}
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            {dictionary.events.errorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" data-icon="inline-start" />
            {dictionary.common.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
