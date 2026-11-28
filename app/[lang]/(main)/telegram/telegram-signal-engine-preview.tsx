"use client"

import { X } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PreviewLocale = "en" | "vi"

function getPreviewLocale(
  languageIsoCode: string | undefined,
  fallback: PreviewLocale
): PreviewLocale {
  const language = languageIsoCode?.toLowerCase()

  if (language?.startsWith("vi")) return "vi"
  if (language?.startsWith("en")) return "en"
  return fallback
}

export function TelegramSignalEnginePreview({
  languageIsoCode,
}: {
  languageIsoCode?: string
}) {
  const { dictionary, locale } = useLocalization()
  const copy = dictionary.telegram.signalEnginePreview
  const samples = copy.samples[getPreviewLocale(languageIsoCode, locale)]

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="col-span-2 justify-self-end"
            data-testid="signal-engine-preview-trigger"
          />
        }
      >
        {copy.button}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader className="pe-8">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogClose
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute end-2 top-2"
              aria-label={dictionary.common.close}
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
        <div className="grid gap-4">
          <SignalEngineMessageSample sample={samples.buy} />
          <SignalEngineMessageSample sample={samples.sell} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SignalEngineMessageSample({
  sample,
}: {
  sample: {
    header: string
    fields: readonly { label: string; value: string }[]
  }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{sample.header}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2">
          {sample.fields.map((field) => (
            <div
              key={field.label}
              className="grid min-w-0 gap-1 sm:grid-cols-[minmax(7rem,0.4fr)_minmax(0,1fr)] sm:gap-3"
            >
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="min-w-0 text-sm text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
