"use client"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"

interface AiTaskConfigurationsErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AiTaskConfigurationsError({
  reset,
}: AiTaskConfigurationsErrorProps) {
  const { dictionary } = useLocalization()
  const t = dictionary.aiTaskConfigurations

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">{t.loadErrorTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.loadError}</p>
      </div>
      <Button type="button" variant="secondary" onClick={reset}>
        {dictionary.common.retry}
      </Button>
    </div>
  )
}
