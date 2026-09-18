"use client"

import * as React from "react"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileImage, FileQuestion, ImagePlus, X } from "lucide-react"

import { createFeedbackSubmission } from "@/app/api/feedback/action"
import type { FeedbackTechnicalContext } from "@/app/lib/feedback/definitions"
import { FEEDBACK_MAX_CONTENT_LENGTH } from "@/app/lib/feedback/definitions"
import {
  getFeedbackTechnicalContext,
  toFeedbackSubmissionContext,
  validateFeedbackScreenshot,
} from "@/app/lib/feedback/validation"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useLocalizedPath } from "@/components/localized-link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface FeedbackComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ComposeValues {
  content: string
}

interface SelectedScreenshot {
  file: File
  previewUrl?: string
}

type ComposeField = keyof ComposeValues

const initialValues: ComposeValues = {
  content: "",
}

function formatFileSize(bytes: number, locale: "vi" | "en") {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: 1,
  }).format(bytes / 1024)} KB`
}

export function FeedbackComposeDialog({
  open,
  onOpenChange,
}: FeedbackComposeDialogProps) {
  const {
    dictionary,
    locale,
    formatMessage: localizeMessage,
  } = useLocalization()
  const t = dictionary.feedback
  const router = useRouter()
  const historyPath = useLocalizedPath("/feedback")
  const [values, setValues] = React.useState<ComposeValues>(initialValues)
  const [errors, setErrors] = React.useState<
    Partial<Record<ComposeField, string>>
  >({})
  const [includeContext, setIncludeContext] = React.useState(true)
  const [technicalContext, setTechnicalContext] =
    React.useState<FeedbackTechnicalContext | null>(null)
  const [screenshot, setScreenshot] = React.useState<SelectedScreenshot | null>(
    null
  )
  const [screenshotError, setScreenshotError] = React.useState<string | null>(
    null
  )
  const [isDiscardOpen, setIsDiscardOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const fieldRefs = React.useRef<
    Partial<
      Record<
        ComposeField,
        HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null
      >
    >
  >({})

  const schema = React.useMemo(
    () =>
      z.object({
        content: z
          .string()
          .trim()
          .min(1, t.contentRequired)
          .max(FEEDBACK_MAX_CONTENT_LENGTH, t.contentTooLong),
      }),
    [t]
  )

  React.useEffect(() => {
    return () => {
      if (screenshot?.previewUrl) {
        URL.revokeObjectURL(screenshot.previewUrl)
      }
    }
  }, [screenshot?.previewUrl])

  React.useEffect(() => {
    if (!open) {
      return
    }

    // Opening a new controlled Dialog starts a fresh draft session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(initialValues)
    setErrors({})
    setIncludeContext(true)
    setTechnicalContext(getFeedbackTechnicalContext(locale))
    setScreenshot(null)
    setScreenshotError(null)
    setIsDiscardOpen(false)
  }, [locale, open])

  const isDirty =
    values.content.trim() !== "" || !includeContext || screenshot !== null

  function requestClose() {
    if (isSubmitting) {
      return
    }

    if (isDirty) {
      setIsDiscardOpen(true)
      return
    }

    onOpenChange(false)
  }

  function updateValue(field: ComposeField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate() {
    const parsed = schema.safeParse(values)
    if (parsed.success) {
      setErrors({})
      return parsed.data
    }

    const nextErrors: Partial<Record<ComposeField, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ComposeField
      if (!nextErrors[field]) {
        nextErrors[field] = issue.message
      }
    }
    setErrors(nextErrors)

    const firstInvalidField = Object.keys(values).find((field) =>
      Boolean(nextErrors[field as ComposeField])
    ) as ComposeField | undefined
    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus()
    }
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const parsed = validate()
    if (!parsed) {
      return
    }

    setIsSubmitting(true)
    const submission = {
      content: parsed.content,
      ...(includeContext && technicalContext
        ? { clientContext: toFeedbackSubmissionContext(technicalContext) }
        : {}),
    }
    const request = new FormData()
    request.append(
      "submission",
      new Blob([JSON.stringify(submission)], { type: "application/json" })
    )
    if (screenshot) {
      request.append("screenshot", screenshot.file, screenshot.file.name)
    }
    try {
      const result = await createFeedbackSubmission(request)
      if (!result.success) {
        toast.error(localizeMessage(result.error, {}))
        return
      }

      toast.success(t.submitSuccess, {
        action: {
          label: t.viewHistoryAction,
          onClick: () => router.push(historyPath),
        },
      })
      setValues(initialValues)
      setErrors({})
      setScreenshot(null)
      setScreenshotError(null)
      onOpenChange(false)
      router.push(`${historyPath}?page=1`)
    } catch {
      toast.error(t.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleScreenshotChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    const validationError = await validateFeedbackScreenshot(file, {
      unsupported: t.screenshotUnsupported,
      tooLarge: t.screenshotTooLarge,
      dimensionsTooLarge: t.screenshotDimensionsTooLarge,
    })
    if (validationError) {
      setScreenshot(null)
      setScreenshotError(validationError)
      return
    }

    setScreenshotError(null)
    const previewUrl = URL.createObjectURL(file)
    setScreenshot({ file, previewUrl })
  }

  function discardDraft() {
    setIsDiscardOpen(false)
    setValues(initialValues)
    setErrors({})
    setScreenshot(null)
    setScreenshotError(null)
    setIncludeContext(true)
    onOpenChange(false)
  }

  const renderError = (field: ComposeField) =>
    errors[field] ? <FieldError>{errors[field]}</FieldError> : null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            onOpenChange(true)
          } else {
            requestClose()
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <DialogTitle>{t.composeTitle}</DialogTitle>
                <DialogDescription>{t.composeDescription}</DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t.closeAction}
                onClick={requestClose}
              >
                <X />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.content)}>
                <FieldLabel htmlFor="feedback-content">
                  {t.contentLabel}
                </FieldLabel>
                <Textarea
                  id="feedback-content"
                  ref={(element) => {
                    fieldRefs.current.content = element
                  }}
                  value={values.content}
                  onChange={(event) =>
                    updateValue("content", event.target.value)
                  }
                  placeholder={t.contentPlaceholder}
                  maxLength={FEEDBACK_MAX_CONTENT_LENGTH}
                  rows={8}
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={
                    errors.content ? "feedback-content-error" : undefined
                  }
                />
                {errors.content ? (
                  <div id="feedback-content-error">
                    {renderError("content")}
                  </div>
                ) : null}
              </Field>

              <Field className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <FieldLabel htmlFor="feedback-technical-context">
                      {t.technicalContextLabel}
                    </FieldLabel>
                    <FieldDescription>
                      {t.technicalContextDescription}
                    </FieldDescription>
                  </div>
                  <Switch
                    id="feedback-technical-context"
                    checked={includeContext}
                    onCheckedChange={setIncludeContext}
                    aria-label={t.technicalContextLabel}
                  />
                </div>
                {includeContext && technicalContext ? (
                  <details className="mt-3 rounded-md border bg-muted/20 p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {t.detailTechnicalContext}
                    </summary>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <ContextValue
                        label={t.technicalContextFields.pagePath}
                        value={technicalContext.pagePath}
                      />
                      <ContextValue
                        label={t.technicalContextFields.appVersion}
                        value={technicalContext.appVersion}
                      />
                      <ContextValue
                        label={t.technicalContextFields.browser}
                        value={technicalContext.browser}
                      />
                      <ContextValue
                        label={t.technicalContextFields.operatingSystem}
                        value={technicalContext.operatingSystem}
                      />
                      <ContextValue
                        label={t.technicalContextFields.locale}
                        value={technicalContext.locale}
                      />
                    </dl>
                  </details>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(screenshotError)}>
                <FieldLabel htmlFor="feedback-screenshot">
                  {t.screenshotLabel}
                </FieldLabel>
                <FieldDescription>{t.screenshotDescription}</FieldDescription>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="feedback-screenshot"
                    className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted"
                  >
                    <ImagePlus className="size-4" />
                    {screenshot ? t.changeScreenshot : t.chooseScreenshot}
                  </label>
                  <Input
                    id="feedback-screenshot"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={handleScreenshotChange}
                    aria-invalid={Boolean(screenshotError)}
                    aria-describedby={
                      screenshotError ? "feedback-screenshot-error" : undefined
                    }
                  />
                  {!screenshot ? (
                    <span className="text-sm text-muted-foreground">
                      {t.screenshotEmpty}
                    </span>
                  ) : null}
                </div>
                {screenshotError ? (
                  <div id="feedback-screenshot-error">
                    <FieldError>{screenshotError}</FieldError>
                  </div>
                ) : null}
                {screenshot ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-start">
                    {screenshot.previewUrl ? (
                      <img
                        src={screenshot.previewUrl}
                        alt={t.screenshotPreviewAlt}
                        className="max-h-40 w-full rounded-md border object-contain sm:w-52"
                      />
                    ) : (
                      <div className="flex size-20 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <FileQuestion aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2 font-medium">
                        {screenshot.previewUrl ? (
                          <FileImage className="size-4" aria-hidden="true" />
                        ) : null}
                        <span className="break-words">
                          {screenshot.file.name}
                        </span>
                      </div>
                      {screenshot.previewUrl ? (
                        <p className="text-sm text-muted-foreground">
                          {localizeMessage(t.screenshotMetadata, {
                            name: screenshot.file.name,
                            type: screenshot.file.type || "file",
                            size: formatFileSize(screenshot.file.size, locale),
                          })}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <span>{t.screenshotUnsupported}</span>
                          <span className="text-xs">
                            {localizeMessage(t.screenshotMetadata, {
                              name: screenshot.file.name,
                              type: screenshot.file.type || "file",
                              size: formatFileSize(
                                screenshot.file.size,
                                locale
                              ),
                            })}
                          </span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 w-fit"
                        onClick={() => setScreenshot(null)}
                      >
                        {t.removeScreenshot}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Field>
            </FieldGroup>

            <div className="mt-4 min-h-6" aria-live="polite" aria-atomic="true">
              {isSubmitting ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> {t.pending}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestClose}>
                {t.cancelAction}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                {isSubmitting ? t.pending : t.submitAction}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.discardTitle}</DialogTitle>
            <DialogDescription>{t.discardDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscardOpen(false)}
            >
              {t.keepEditingAction}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={discardDraft}
            >
              {t.discardAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ContextValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground" title={value}>
        {value}
      </dd>
    </div>
  )
}
