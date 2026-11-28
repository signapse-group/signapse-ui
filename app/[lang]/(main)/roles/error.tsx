"use client"

import { useParams } from "next/navigation"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"

interface RolesErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RolesError({ reset }: RolesErrorProps) {
  const { roleKey } = useParams<{ roleKey?: string }>()
  const { dictionary } = useLocalization()
  const t = dictionary.roles
  const detailWidth = roleKey ? "mx-auto w-full max-w-2xl" : ""

  function retry() {
    reset()
    window.location.reload()
  }

  return (
    <section
      role="alert"
      className={`flex min-w-0 flex-col items-start gap-4 rounded-lg border border-destructive/40 bg-card p-6 ${detailWidth}`}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">{t.loadErrorTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {t.loadErrorDescription}
        </p>
      </div>
      <Button type="button" variant="outline" onClick={retry}>
        {t.retry}
      </Button>
    </section>
  )
}
