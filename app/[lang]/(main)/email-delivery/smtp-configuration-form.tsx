"use client"

import { useRef, useState } from "react"
import type { FormEvent, InputHTMLAttributes } from "react"
import { useRouter } from "next/navigation"
import { Check, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  deleteSmtpConfiguration,
  disableSmtpConfiguration,
  enableSmtpConfiguration,
  saveSmtpConfiguration,
  testSmtpConfiguration,
} from "@/app/api/smtp-configuration/action"
import {
  getSmtpConfigurationRequestSchema,
  SMTP_CONFIGURATION_VERSION_CONFLICT,
  type SmtpConfigurationActionResult,
  type SmtpConfigurationRequest,
  type SmtpConfigurationResponse,
  type SmtpSecurityMode,
} from "@/app/lib/smtp-configuration/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { AlertDialog } from "@/components/ui/alert-dialog"
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

type Draft = {
  host: string
  port: string
  username: string
  securityMode: SmtpSecurityMode
  fromAddress: string
  fromName: string
  password: string
}

type DraftField = keyof Draft
type FieldErrors = Partial<Record<DraftField, string>>
type Operation = "save" | "test" | "enable" | "disable" | "delete"

const EMPTY_DRAFT: Draft = {
  host: "",
  port: "",
  username: "",
  securityMode: "STARTTLS",
  fromAddress: "",
  fromName: "",
  password: "",
}

function toDraft(configuration: SmtpConfigurationResponse): Draft {
  return {
    host: configuration.host ?? "",
    port: configuration.port?.toString() ?? "",
    username: configuration.username ?? "",
    securityMode: configuration.securityMode ?? "STARTTLS",
    fromAddress: configuration.fromAddress ?? "",
    fromName: configuration.fromName ?? "",
    password: "",
  }
}

function isConflict(
  result:
    | SmtpConfigurationActionResult<unknown>
    | { success: false; error: string; code?: string }
) {
  return !result.success && result.code === SMTP_CONFIGURATION_VERSION_CONFLICT
}

function TextField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  type = "text",
  placeholder,
  description,
  error,
  autoComplete,
  inputMode,
}: {
  id: DraftField
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  required?: boolean
  type?: "text" | "email" | "number" | "password"
  placeholder?: string
  description?: string
  error?: string
  autoComplete?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [description ? helpId : null, error ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {description ? (
        <p id={helpId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SmtpConfigurationForm({
  configuration,
  canManage,
}: {
  configuration: SmtpConfigurationResponse
  canManage: boolean
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.smtpConfiguration
  const router = useRouter()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [configurationOverride, setConfigurationOverride] =
    useState<SmtpConfigurationResponse | null>(null)
  const savedConfiguration = configurationOverride ?? configuration
  const [draft, setDraft] = useState(() => toDraft(configuration))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [operation, setOperation] = useState<Operation | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isPending = operation !== null
  const canUseVersion =
    !savedConfiguration.configured ||
    typeof savedConfiguration.version === "number"

  function updateDraft(field: DraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError("")
  }

  function validateDraft(
    requireVersion: boolean
  ): SmtpConfigurationRequest | null {
    setErrors({})
    setFormError("")

    if (
      requireVersion &&
      savedConfiguration.configured &&
      typeof savedConfiguration.version !== "number"
    ) {
      setFormError(t.validation.versionRequired)
      return null
    }

    const candidate = {
      host: draft.host,
      port: draft.port === "" ? Number.NaN : Number(draft.port),
      username: draft.username,
      securityMode: draft.securityMode,
      fromAddress: draft.fromAddress,
      fromName: draft.fromName,
      ...(draft.password !== "" ? { password: draft.password } : {}),
      ...(typeof savedConfiguration.version === "number"
        ? { version: savedConfiguration.version }
        : {}),
    }
    const parsed = getSmtpConfigurationRequestSchema(t.validation, {
      requirePassword: !savedConfiguration.configured,
    }).safeParse(candidate)

    if (!parsed.success) {
      const nextErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (
          typeof field === "string" &&
          field in draft &&
          !nextErrors[field as DraftField]
        ) {
          nextErrors[field as DraftField] = issue.message
        }
      }
      setErrors(nextErrors)
      const firstInvalidField = Object.keys(nextErrors)[0]
      if (firstInvalidField) {
        requestAnimationFrame(() => {
          document.getElementById(firstInvalidField)?.focus()
        })
      }
      return null
    }

    return parsed.data
  }

  function showActionError(
    result: { success: false; error: string; code?: string },
    fallback: string
  ) {
    const conflict = isConflict(result)
    const message = result.error || fallback
    if (conflict) {
      setConfigurationOverride(null)
      toast.error(message, {
        description: `${result.code}. ${t.conflictRecovery}`,
      })
      router.refresh()
    } else {
      toast.error(message)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canManage) return
    const request = validateDraft(true)
    if (!request) return

    setOperation("save")
    try {
      const result = await saveSmtpConfiguration(request)
      if (result.success) {
        setConfigurationOverride(result.data)
        setDraft((current) => ({ ...current, password: "" }))
        toast.success(t.saveSuccess)
        router.refresh()
      } else {
        showActionError(result, t.saveError)
      }
    } catch {
      toast.error(t.saveError)
    } finally {
      setOperation(null)
    }
  }

  async function handleTest() {
    if (isPending || !canManage) return
    const request = validateDraft(false)
    if (!request) return

    setOperation("test")
    try {
      const result = await testSmtpConfiguration(request)
      if (result.success) {
        toast.success(t.testSuccess)
      } else {
        showActionError(result, t.testError)
      }
    } catch {
      toast.error(t.testError)
    } finally {
      setOperation(null)
    }
  }

  async function handleDeliveryChange(enabled: boolean) {
    if (
      isPending ||
      !canManage ||
      !savedConfiguration.configured ||
      typeof savedConfiguration.version !== "number"
    ) {
      return
    }

    const nextOperation = enabled ? "enable" : "disable"
    setOperation(nextOperation)
    try {
      const result = enabled
        ? await enableSmtpConfiguration({ version: savedConfiguration.version })
        : await disableSmtpConfiguration({
            version: savedConfiguration.version,
          })

      if (result.success) {
        setConfigurationOverride(result.data)
        toast.success(enabled ? t.enableSuccess : t.disableSuccess)
        router.refresh()
      } else {
        showActionError(result, enabled ? t.enableError : t.disableError)
      }
    } catch {
      toast.error(enabled ? t.enableError : t.disableError)
    } finally {
      setOperation(null)
    }
  }

  async function handleDelete() {
    if (
      isPending ||
      !canManage ||
      !savedConfiguration.configured ||
      savedConfiguration.enabled ||
      typeof savedConfiguration.version !== "number"
    ) {
      return
    }

    setOperation("delete")
    try {
      const result = await deleteSmtpConfiguration({
        version: savedConfiguration.version,
      })
      if (result.success) {
        setConfigurationOverride({
          configured: false,
          enabled: false,
          passwordConfigured: false,
          version: null,
        })
        setDraft(EMPTY_DRAFT)
        setDeleteOpen(false)
        toast.success(t.deleteSuccess)
        router.refresh()
        requestAnimationFrame(() => headingRef.current?.focus())
      } else {
        showActionError(result, t.deleteError)
      }
    } catch {
      toast.error(t.deleteError)
    } finally {
      setOperation(null)
    }
  }

  const deliveryLabel = savedConfiguration.enabled
    ? t.deliveryOn
    : t.deliveryOff

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          {t.pageTitle}
        </h1>
        <p className="text-muted-foreground">{t.pageDescription}</p>
      </header>

      {!canUseVersion && canManage ? (
        <p role="alert" className="text-sm text-destructive">
          {t.validation.versionRequired}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSave} noValidate>
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(19rem,0.9fr)]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{t.formTitle}</CardTitle>
              <CardDescription>{t.formDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <h2 className="text-base font-semibold">{t.connectionSection}</h2>
              <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2">
                <TextField
                  id="host"
                  label={t.host}
                  value={draft.host}
                  onChange={(value) => updateDraft("host", value)}
                  disabled={!canManage || isPending}
                  required
                  placeholder={t.hostPlaceholder}
                  autoComplete="url"
                  error={errors.host}
                />
                <TextField
                  id="port"
                  label={t.port}
                  value={draft.port}
                  onChange={(value) => updateDraft("port", value)}
                  disabled={!canManage || isPending}
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder={t.portPlaceholder}
                  description={t.portHelper}
                  error={errors.port}
                />
                <TextField
                  id="username"
                  label={t.username}
                  value={draft.username}
                  onChange={(value) => updateDraft("username", value)}
                  disabled={!canManage || isPending}
                  required
                  placeholder={t.usernamePlaceholder}
                  autoComplete="username"
                  error={errors.username}
                />
                <div className="flex min-w-0 flex-col gap-2">
                  <Label htmlFor="securityMode">
                    {t.securityMode} <span aria-hidden="true">*</span>
                  </Label>
                  <Select
                    value={draft.securityMode}
                    onValueChange={(value) => {
                      if (value === "STARTTLS" || value === "TLS") {
                        updateDraft("securityMode", value)
                      }
                    }}
                    disabled={!canManage || isPending}
                  >
                    <SelectTrigger id="securityMode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="STARTTLS">STARTTLS</SelectItem>
                        <SelectItem value="TLS">TLS</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {canManage ? (
                  <div className="md:col-span-2">
                    <TextField
                      id="password"
                      label={t.password}
                      value={draft.password}
                      onChange={(value) => updateDraft("password", value)}
                      disabled={isPending}
                      required={!savedConfiguration.configured}
                      type="password"
                      placeholder={
                        savedConfiguration.configured
                          ? t.passwordPlaceholder
                          : t.passwordRequiredPlaceholder
                      }
                      autoComplete="new-password"
                      description={
                        savedConfiguration.configured
                          ? t.passwordHelper
                          : t.passwordRequiredHelper
                      }
                      error={errors.password}
                    />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.deliveryTitle}</CardTitle>
                <CardDescription>
                  {savedConfiguration.enabled
                    ? t.deliveryOnDescription
                    : t.deliveryOffDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="delivery-switch">{t.deliveryTitle}</Label>
                  <div className="flex flex-col items-end gap-1">
                    <Switch
                      id="delivery-switch"
                      checked={savedConfiguration.enabled}
                      disabled={
                        !canManage ||
                        isPending ||
                        !savedConfiguration.configured ||
                        typeof savedConfiguration.version !== "number"
                      }
                      onCheckedChange={handleDeliveryChange}
                    />
                    <span className="text-sm text-muted-foreground">
                      {deliveryLabel}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.enableHelper}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-sm">
                  <dt className="text-muted-foreground">{t.configured}</dt>
                  <dd>
                    <Badge
                      variant={
                        savedConfiguration.configured ? "secondary" : "outline"
                      }
                    >
                      {savedConfiguration.configured
                        ? t.configured
                        : t.notConfigured}
                    </Badge>
                  </dd>
                  <dt className="text-muted-foreground">
                    {t.passwordStatusLabel}
                  </dt>
                  <dd>
                    {savedConfiguration.passwordConfigured
                      ? t.passwordConfigured
                      : t.passwordNotConfigured}
                  </dd>
                  <dt className="text-muted-foreground">{t.version}</dt>
                  <dd className="tabular-nums">
                    {savedConfiguration.version ?? "—"}
                  </dd>
                </dl>
                {!canManage ? (
                  <p className="text-sm text-muted-foreground">{t.readOnly}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.senderTitle}</CardTitle>
                <CardDescription>{t.senderDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <TextField
                  id="fromAddress"
                  label={t.fromAddress}
                  value={draft.fromAddress}
                  onChange={(value) => updateDraft("fromAddress", value)}
                  disabled={!canManage || isPending}
                  required
                  type="email"
                  placeholder={t.fromAddressPlaceholder}
                  autoComplete="email"
                  error={errors.fromAddress}
                />
                <TextField
                  id="fromName"
                  label={t.fromName}
                  value={draft.fromName}
                  onChange={(value) => updateDraft("fromName", value)}
                  disabled={!canManage || isPending}
                  placeholder={t.fromNamePlaceholder}
                  autoComplete="name"
                  error={errors.fromName}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              {savedConfiguration.enabled ? t.saveOnHelper : t.saveOffHelper}
            </p>
            <p>{t.testHelper}</p>
          </div>
          {canManage ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                aria-busy={operation === "test"}
                onClick={() => void handleTest()}
              >
                {operation === "test" ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {operation === "test" ? t.testPending : t.test}
              </Button>
              <Button
                type="submit"
                disabled={isPending || !canUseVersion}
                aria-busy={operation === "save"}
              >
                {operation === "save" ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Check data-icon="inline-start" />
                )}
                {operation === "save" ? t.savePending : t.save}
              </Button>
            </div>
          ) : null}
        </div>
      </form>

      {canManage ? (
        <section className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t.delete}</h2>
            <p className="text-sm text-muted-foreground">
              {t.deleteDescription}
            </p>
          </div>
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              if (!isPending) setDeleteOpen(open)
            }}
          >
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  disabled={
                    isPending ||
                    !savedConfiguration.configured ||
                    savedConfiguration.enabled ||
                    typeof savedConfiguration.version !== "number"
                  }
                />
              }
            >
              <Trash2 data-icon="inline-start" />
              {t.delete}
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive">
                  <Trash2 />
                </AlertDialogMedia>
                <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deleteDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  {dictionary.common.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isPending}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleDelete()
                  }}
                >
                  {operation === "delete" ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <Trash2 data-icon="inline-start" />
                  )}
                  {operation === "delete" ? t.deletePending : t.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      ) : null}
    </div>
  )
}
