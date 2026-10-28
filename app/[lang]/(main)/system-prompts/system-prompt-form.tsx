"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"

import { updateSystemPrompt } from "@/app/api/system-prompts/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  SYSTEM_PROMPT_MAX_CONTENT_LENGTH,
  updateSystemPromptContentRequestSchema,
  type SystemPromptContentResponse,
} from "@/app/lib/system-prompts/definitions"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { useLocalizedPath } from "@/components/localized-link"
import { SystemPromptLifecycleWarning } from "./system-prompt-lifecycle-warning"
import { useSystemPromptDrafts } from "./system-prompt-draft-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

interface SystemPromptFormProps {
  initialData: SystemPromptContentResponse
  readOnly?: boolean
}

export function SystemPromptForm({
  initialData,
  readOnly = false,
}: SystemPromptFormProps) {
  const router = useRouter()
  const promptsPath = useLocalizedPath("/system-prompts")
  const { dictionary, formatNumber, formatMessage } = useLocalization()
  const { drafts, setDraft, clearDraft } = useSystemPromptDrafts()
  const t = dictionary.systemPrompts
  const promptType = initialData.promptType
  const [content, setContent] = useState(
    () => (readOnly ? undefined : drafts[promptType]) ?? initialData.content
  )
  const [error, setError] = useState("")
  const [discardOpen, setDiscardOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDirty = content !== initialData.content
  const contentLength = content.length
  const isOverLimit = contentLength > SYSTEM_PROMPT_MAX_CONTENT_LENGTH
  const missingVariables = initialData.requiredVariables.filter(
    (variable) => !content.includes(`{${variable}}`)
  )

  function leaveEditor() {
    if (isDirty) {
      setDiscardOpen(true)
      return
    }

    router.push(promptsPath)
  }

  function discardDraft() {
    clearDraft(promptType)
    router.push(promptsPath)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) return
    setError("")

    const parsed = updateSystemPromptContentRequestSchema.safeParse({ content })
    if (!parsed.success) {
      setError(
        parsed.error.issues.some((issue) => issue.code === "too_big")
          ? t.contentTooLong
          : t.contentRequired
      )
      textareaRef.current?.focus()
      return
    }

    if (missingVariables.length > 0) {
      setError(
        formatMessage(t.missingPlaceholders, {
          variables: missingVariables
            .map((variable) => `{${variable}}`)
            .join(", "),
        })
      )
      textareaRef.current?.focus()
      return
    }

    startTransition(async () => {
      const result = await updateSystemPrompt(
        initialData.promptType,
        parsed.data
      )

      if (!result.success) {
        setError(result.error)
        textareaRef.current?.focus()
        return
      }

      clearDraft(promptType)
      toast.success(t.updateSuccess)
      router.push(promptsPath)
    })
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={leaveEditor}
        disabled={isPending}
      >
        <ArrowLeft data-icon="inline-start" />
        {t.backToList}
      </Button>

      <div className="mx-auto w-full max-w-[60rem]">
        <AppFormShell
          title={readOnly ? t.viewTitle : t.editorTitle}
          description={
            <>
              <span className="block text-base text-foreground">
                {initialData.name}
              </span>
              <span className="mt-2 block font-mono text-sm text-muted-foreground">
                {initialData.promptType}
              </span>
            </>
          }
          width="lg"
          surface="plain"
          className="max-w-[60rem] [&>header>h1]:text-2xl"
        >
          <form onSubmit={handleSubmit} noValidate>
            <AppFormShellBody surface="plain" className="flex flex-col gap-6">
              <SystemPromptLifecycleWarning editor />

              <section aria-labelledby="required-placeholders-title">
                <h2
                  id="required-placeholders-title"
                  className="font-semibold text-foreground"
                >
                  {t.requiredPlaceholders}
                </h2>
                {initialData.requiredVariables.length > 0 ? (
                  <ul className="mt-2 flex max-w-[32rem] flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground">
                    {initialData.requiredVariables.map((variable) => (
                      <li key={variable}>{`{${variable}}`}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.noRequiredPlaceholders}
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {readOnly
                    ? t.placeholdersReadOnlyDescription
                    : t.placeholdersDescription}
                </p>
              </section>

              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="prompt-content">
                    {t.content}
                    {!readOnly ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </FieldLabel>
                  <Textarea
                    ref={textareaRef}
                    id="prompt-content"
                    name="content"
                    readOnly={readOnly}
                    required={!readOnly}
                    maxLength={SYSTEM_PROMPT_MAX_CONTENT_LENGTH + 1}
                    value={content}
                    onChange={(event) => {
                      const nextContent = event.target.value
                      setContent(nextContent)
                      if (nextContent === initialData.content) {
                        clearDraft(promptType)
                      } else {
                        setDraft(promptType, nextContent)
                      }
                      if (error) setError("")
                    }}
                    aria-invalid={readOnly ? undefined : Boolean(error)}
                    aria-describedby={
                      readOnly
                        ? "prompt-content-counter"
                        : error
                          ? "prompt-content-description prompt-content-counter prompt-content-error"
                          : "prompt-content-description prompt-content-counter"
                    }
                    placeholder={readOnly ? undefined : t.contentPlaceholder}
                    className="min-h-[28rem] resize-y font-mono text-sm leading-6 md:min-h-[50rem]"
                  />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    {!readOnly ? (
                      <FieldDescription id="prompt-content-description">
                        {t.contentDescription}
                      </FieldDescription>
                    ) : null}
                    <p
                      id="prompt-content-counter"
                      className={
                        isOverLimit
                          ? "text-xs text-destructive tabular-nums"
                          : "text-xs text-muted-foreground tabular-nums"
                      }
                      role="status"
                      aria-live="polite"
                    >
                      {formatMessage(t.contentCounter, {
                        count: formatNumber(contentLength),
                      })}
                    </p>
                  </div>
                  {error ? (
                    <p
                      id="prompt-content-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                </Field>
              </FieldGroup>
              {!readOnly ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {t.editorInstructions}
                </p>
              ) : null}
            </AppFormShellBody>

            {!readOnly ? (
              <AppFormShellFooter
                surface="plain"
                className="border-0 px-0 py-0"
              >
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={leaveEditor}
                    disabled={isPending}
                  >
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        {t.updatePending}
                      </>
                    ) : (
                      t.saveHotfix
                    )}
                  </Button>
                </div>
              </AppFormShellFooter>
            ) : null}
          </form>
        </AppFormShell>
      </div>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.discardTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.discardDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              {t.keepEditing}
            </AlertDialogCancel>
            <AlertDialogAction onClick={discardDraft} variant="destructive">
              {t.discardChanges}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
