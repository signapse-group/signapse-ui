"use client"

import { AlertCircle } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function ContactRequestsError({ reset }: { reset: () => void }) {
  const { dictionary } = useLocalization()
  const t = dictionary.contactRequests

  return (
    <Empty className="min-h-[360px] border">
      <h1 className="sr-only">{t.pageTitle}</h1>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle>{t.errorTitle}</EmptyTitle>
        <EmptyDescription>{t.errorDescription}</EmptyDescription>
      </EmptyHeader>
      <Button type="button" variant="outline" onClick={reset}>
        {t.retry}
      </Button>
    </Empty>
  )
}
