"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitErrorHandler,
} from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { createAiProviderConfig } from "@/app/api/ai-provider-configs/action"
import {
  aiProviderConfigCreateRequestSchema,
  type AiProviderConfigCreateRequest,
  SUPPORTED_AI_PROVIDER_TYPES,
} from "@/app/lib/ai-provider-configs/definitions"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useLocalizedPath } from "@/components/localized-link"
import { useHasPermission } from "@/components/permission-provider"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import { supportedProviderOptions } from "./ai-provider-config-shared"

function getCreateFormSchema(t: {
  keyRequired: string
  providerRequired: string
}) {
  return z.object({
    providerType: z.enum(SUPPORTED_AI_PROVIDER_TYPES, {
      error: t.providerRequired,
    }),
    baseUrl: z.string(),
    description: z.string(),
    credentials: z
      .array(z.object({ apiKey: z.string() }))
      .min(1, t.keyRequired)
      .refine(
        (credentials) => credentials.some(({ apiKey }) => /\S/.test(apiKey)),
        t.keyRequired
      ),
  })
}

type CreateFormValues = z.infer<ReturnType<typeof getCreateFormSchema>>

const defaultValues: CreateFormValues = {
  providerType: "OPENAI",
  baseUrl: "",
  description: "",
  credentials: [{ apiKey: "" }],
}

export function AiProviderConfigCreateForm() {
  const router = useRouter()
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const canReadConnections = useHasPermission(
    AI_PROVIDER_CONFIG_PERMISSIONS.read
  )
  const destinationPath = useLocalizedPath(
    canReadConnections ? "/ai-provider-configs" : "/dashboard"
  )
  const t = dictionary.aiProviderConfigs
  const [submitError, setSubmitError] = useState("")
  const [createSucceeded, setCreateSucceeded] = useState(false)
  const schema = getCreateFormSchema(t)

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "credentials",
  })

  function clearMessages() {
    setSubmitError("")
    setCreateSucceeded(false)
  }

  async function onSubmit(values: CreateFormValues) {
    clearMessages()

    const request: AiProviderConfigCreateRequest = {
      providerType: values.providerType,
      baseUrl: values.baseUrl.trim() || undefined,
      description: values.description.trim() || undefined,
      credentials: values.credentials
        .map(({ apiKey }) => apiKey)
        .filter((apiKey) => apiKey.trim().length > 0)
        .map((apiKey) => ({ apiKey })),
    }

    const parsedRequest = aiProviderConfigCreateRequestSchema.safeParse(request)
    if (!parsedRequest.success) {
      setSubmitError(t.validationError)
      return
    }

    let result: Awaited<ReturnType<typeof createAiProviderConfig>>
    try {
      result = await createAiProviderConfig(parsedRequest.data)
    } catch {
      setSubmitError(t.createError)
      return
    }

    if (!result.success) {
      setSubmitError(result.error)
      return
    }

    form.reset(defaultValues)
    setCreateSucceeded(true)
    toast.success(t.createSuccess)

    if (canReadConnections) {
      router.push(destinationPath)
    }
  }

  function handleCancel() {
    router.push(destinationPath)
  }

  const handleInvalid: SubmitErrorHandler<CreateFormValues> = (errors) => {
    if (errors.credentials) {
      window.requestAnimationFrame(() => {
        const emptyKeyIndex = form
          .getValues("credentials")
          .findIndex((credential) => credential.apiKey.trim().length === 0)
        const emptyKeyName = `credentials.${emptyKeyIndex}.apiKey` as const
        if (
          emptyKeyIndex >= 0 &&
          document.querySelector(`[name="${emptyKeyName}"]`)
        ) {
          form.setFocus(emptyKeyName)
          return
        }

        document.getElementById("ai-provider-config-add-key")?.focus()
      })
    }
  }

  const isSubmitting = form.formState.isSubmitting
  const credentialsError =
    form.formState.errors.credentials?.root?.message ??
    form.formState.errors.credentials?.message

  return (
    <AppFormShell
      title={t.createTitle}
      description={t.createDescription}
      width="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)} noValidate>
        <AppFormShellBody>
          <FieldGroup>
            <Controller
              name="providerType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="providerType">
                    {t.provider} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={supportedProviderOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value ?? "")
                      clearMessages()
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="providerType"
                      aria-invalid={fieldState.invalid}
                      aria-required="true"
                    >
                      <SelectValue placeholder={t.providerPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {supportedProviderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                  <FieldDescription>
                    {t.supportedProvidersDescription}
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="baseUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="baseUrl">{t.endpoint}</FieldLabel>
                  <Input
                    {...field}
                    id="baseUrl"
                    aria-invalid={fieldState.invalid}
                    autoComplete="url"
                    placeholder={t.endpointPlaceholder}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      field.onChange(event)
                      clearMessages()
                    }}
                  />
                  <FieldDescription>{t.endpointDescription}</FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">{t.description}</FieldLabel>
                  <Input
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder={t.descriptionPlaceholder}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      field.onChange(event)
                      clearMessages()
                    }}
                  />
                  <FieldDescription>
                    {t.descriptionDescription}
                  </FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <FieldSet
              data-invalid={Boolean(credentialsError)}
              aria-invalid={Boolean(credentialsError)}
              aria-describedby={
                credentialsError
                  ? "credentials-description credentials-error"
                  : "credentials-description"
              }
              className="relative gap-4"
            >
              <FieldLegend variant="label">
                {t.apiKeys} <span className="text-destructive">*</span>
              </FieldLegend>
              <Button
                id="ai-provider-config-add-key"
                className="absolute -top-6 right-0"
                type="button"
                variant="outline"
                aria-describedby={
                  credentialsError
                    ? "credentials-description credentials-error"
                    : "credentials-description"
                }
                onClick={() => {
                  append({ apiKey: "" })
                  clearMessages()
                }}
                disabled={isSubmitting}
              >
                <Plus data-icon="inline-start" />
                {t.addKey}
              </Button>

              {fields.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {fields.map((credential, index) => {
                    const apiKeyName = `credentials.${index}.apiKey` as const
                    const inputId = `credential-api-key-${credential.id}`

                    return (
                      <div
                        key={credential.id}
                        className="group relative flex min-w-0 items-end gap-2"
                      >
                        <Controller
                          name={apiKeyName}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              className="min-w-0 flex-1"
                              data-invalid={fieldState.invalid}
                            >
                              <FieldLabel htmlFor={inputId}>
                                {formatMessage(t.apiKeyIndex, {
                                  index: formatNumber(index + 1),
                                })}
                              </FieldLabel>
                              <Input
                                {...field}
                                id={inputId}
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={fieldState.invalid}
                                placeholder={t.apiKeyPlaceholder}
                                disabled={isSubmitting}
                                onChange={(event) => {
                                  field.onChange(event)
                                  clearMessages()
                                }}
                              />
                              {fieldState.invalid ? (
                                <FieldError errors={[fieldState.error]} />
                              ) : null}
                            </Field>
                          )}
                        />
                        <Button
                          className="pointer-events-none absolute right-0 bottom-1 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 max-md:pointer-events-auto max-md:static max-md:size-11 max-md:opacity-100"
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={formatMessage(t.removeKey, {
                            index: formatNumber(index + 1),
                          })}
                          onClick={() => {
                            remove(index)
                            clearMessages()
                          }}
                          disabled={isSubmitting}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noKeysAdded}</p>
              )}
              <FieldDescription id="credentials-description">
                {t.apiKeysDescription}
              </FieldDescription>
              {credentialsError ? (
                <FieldError
                  id="credentials-error"
                  errors={[{ message: credentialsError }]}
                />
              ) : null}
            </FieldSet>

            <aside className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">{t.verifyOnCreateTitle}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t.verifyOnCreateDescription}
              </p>
            </aside>

            {createSucceeded && !canReadConnections ? (
              <p
                role="status"
                className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
              >
                {t.createSuccess}
              </p>
            ) : null}

            {submitError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </p>
            ) : null}
          </FieldGroup>
        </AppFormShellBody>

        <AppFormShellFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {dictionary.common.cancel}
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <span role="status" className="inline-flex items-center gap-2">
                <Spinner data-icon="inline-start" />
                {t.createPending}
              </span>
            ) : (
              t.createConnection
            )}
          </Button>
        </AppFormShellFooter>
      </form>
    </AppFormShell>
  )
}
