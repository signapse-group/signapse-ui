"use client"

import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import {
  createAiProviderCredential,
  deleteAiProviderConfig,
  deleteAiProviderCredential,
  updateAiProviderConfig,
  updateAiProviderCredential,
} from "@/app/api/ai-provider-configs/action"
import type {
  AiProviderConfigDetailResponse,
  AiProviderCredentialResponse,
} from "@/app/lib/ai-provider-configs/definitions"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { AI_TASK_CONFIGURATION_READ_PERMISSION } from "@/app/lib/ai-task-configurations/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  LocalizedLink as Link,
  useLocalizedPath,
} from "@/components/localized-link"
import { useHasPermission } from "@/components/permission-provider"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

import { getProviderOptionLabel } from "./ai-provider-config-shared"

type PendingDelete =
  | { kind: "credential"; credential: AiProviderCredentialResponse }
  | { kind: "connection" }
  | null

export function AiProviderConfigDetail({
  provider,
}: {
  provider: AiProviderConfigDetailResponse
}) {
  return <AiProviderConfigDetailContent key={provider.id} provider={provider} />
}

function AiProviderConfigDetailContent({
  provider,
}: {
  provider: AiProviderConfigDetailResponse
}) {
  const router = useRouter()
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const connectionsPath = useLocalizedPath("/ai-provider-configs")
  const t = dictionary.aiProviderConfigs
  const providerLabel = getProviderOptionLabel(
    provider.providerType,
    dictionary
  )
  const canUpdate = useHasPermission(AI_PROVIDER_CONFIG_PERMISSIONS.update)
  const canAddKey = useHasPermission(AI_PROVIDER_CONFIG_PERMISSIONS.create)
  const canDelete = useHasPermission(AI_PROVIDER_CONFIG_PERMISSIONS.delete)
  const canReadTaskConfigurations = useHasPermission(
    AI_TASK_CONFIGURATION_READ_PERMISSION
  )
  const [savedProvider, setSavedProvider] = useState(provider)
  const [credentials, setCredentials] = useState(provider.credentials)
  const [endpoint, setEndpoint] = useState(provider.baseUrl ?? "")
  const [description, setDescription] = useState(provider.description ?? "")
  const [newKey, setNewKey] = useState("")
  const [replacementKeys, setReplacementKeys] = useState<
    Record<number, string>
  >({})
  const [pendingOperation, setPendingOperation] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [deleteError, setDeleteError] = useState("")

  const endpointChanged = endpoint !== (savedProvider.baseUrl ?? "")
  const descriptionChanged = description !== (savedProvider.description ?? "")
  const hasReferences = provider.taskReferences.length > 0

  async function saveConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request: { baseUrl?: string; description?: string } = {}
    if (endpointChanged) request.baseUrl = endpoint
    if (descriptionChanged) request.description = description
    if (!Object.keys(request).length) return

    setPendingOperation("connection")
    try {
      const result = await updateAiProviderConfig(provider.id, request)
      if (!result.success) {
        toast.error(result.error || t.updateError)
        return
      }

      setSavedProvider(result.data)
      setEndpoint(result.data.baseUrl ?? "")
      setDescription(result.data.description ?? "")
      toast.success(t.updateSuccess)
      router.refresh()
    } catch {
      toast.error(t.updateError)
    } finally {
      setPendingOperation(null)
    }
  }

  async function addKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/\S/.test(newKey)) {
      toast.error(t.keyValidationError)
      return
    }

    setPendingOperation("add-key")
    try {
      const result = await createAiProviderCredential(provider.id, {
        apiKey: newKey,
      })
      if (!result.success) {
        toast.error(result.error || t.addKeyError)
        return
      }

      setCredentials((current) => [...current, result.data])
      setNewKey("")
      toast.success(t.addKeySuccess)
      router.refresh()
    } catch {
      toast.error(t.addKeyError)
    } finally {
      setPendingOperation(null)
    }
  }

  async function replaceKey(credentialId: number) {
    const apiKey = replacementKeys[credentialId] ?? ""
    if (!/\S/.test(apiKey)) return

    setPendingOperation(`replace-key-${credentialId}`)
    try {
      const result = await updateAiProviderCredential(
        provider.id,
        credentialId,
        {
          apiKey,
        }
      )
      if (!result.success) {
        toast.error(result.error || t.replaceKeyError)
        return
      }

      setCredentials((current) =>
        current.map((credential) =>
          credential.id === credentialId ? result.data : credential
        )
      )
      setReplacementKeys((current) => ({ ...current, [credentialId]: "" }))
      toast.success(t.replaceKeySuccess)
      router.refresh()
    } catch {
      toast.error(t.replaceKeyError)
    } finally {
      setPendingOperation(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleteError("")
    setPendingOperation("delete")

    try {
      const result =
        pendingDelete.kind === "credential"
          ? await deleteAiProviderCredential(
              provider.id,
              pendingDelete.credential.id
            )
          : await deleteAiProviderConfig(provider.id)

      if (!result.success) {
        setDeleteError(
          result.error ||
            (pendingDelete.kind === "credential"
              ? t.deleteKeyError
              : t.deleteConnectionError)
        )
        return
      }

      if (pendingDelete.kind === "credential") {
        setCredentials((current) =>
          current.filter(
            (credential) => credential.id !== pendingDelete.credential.id
          )
        )
        setPendingDelete(null)
        toast.success(t.deleteKeySuccess)
        router.refresh()
      } else {
        toast.success(t.deleteConnectionSuccess)
        router.replace(connectionsPath)
      }
    } catch {
      setDeleteError(
        pendingDelete.kind === "credential"
          ? t.deleteKeyError
          : t.deleteConnectionError
      )
    } finally {
      setPendingOperation(null)
    }
  }

  function updateReplacement(credentialId: number, value: string) {
    setReplacementKeys((current) => ({ ...current, [credentialId]: value }))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/ai-provider-configs"
          className={buttonVariants({ variant: "secondary" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <AppFormShell
        title={t.editTitle}
        description={formatMessage(t.connectionIdentifier, {
          provider: providerLabel,
          id: formatNumber(provider.id),
        })}
        width="lg"
      >
        {canUpdate ? (
          <form onSubmit={saveConnection}>
            <AppFormShellBody>
              <div className="flex flex-col gap-5">
                <Field>
                  <FieldLabel htmlFor="ai-provider-fixed-type">
                    {t.provider}
                  </FieldLabel>
                  <Input
                    id="ai-provider-fixed-type"
                    value={`${providerLabel} · ${t.fixedProviderType}`}
                    readOnly
                    aria-describedby="ai-provider-fixed-type-description"
                  />
                  <FieldDescription id="ai-provider-fixed-type-description">
                    <span className="hidden sm:inline">
                      {t.providerTypeDescription}
                    </span>
                    <span className="sm:hidden">
                      {t.providerTypeDescriptionMobile}
                    </span>
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="ai-provider-endpoint">
                    {t.endpoint}
                  </FieldLabel>
                  <Input
                    id="ai-provider-endpoint"
                    value={endpoint}
                    onChange={(event) => setEndpoint(event.target.value)}
                    placeholder={t.endpointPlaceholder}
                    autoComplete="url"
                    disabled={pendingOperation !== null}
                  />
                  <FieldDescription>
                    <span className="hidden sm:inline">
                      {t.endpointUpdateDescription}
                    </span>
                    <span className="sm:hidden">
                      {t.endpointUpdateDescriptionMobile}
                    </span>
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="ai-provider-description">
                    {t.description}
                  </FieldLabel>
                  <Input
                    id="ai-provider-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    disabled={pendingOperation !== null}
                  />
                </Field>
              </div>
            </AppFormShellBody>
            <AppFormShellFooter>
              <p className="hidden text-sm text-muted-foreground sm:mr-auto sm:block">
                {t.connectionSettingsPersisted}
              </p>
              <Button
                type="submit"
                disabled={
                  pendingOperation !== null ||
                  (!endpointChanged && !descriptionChanged)
                }
              >
                {pendingOperation === "connection" ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    {t.saveConnectionPending}
                  </>
                ) : (
                  t.saveConnection
                )}
              </Button>
            </AppFormShellFooter>
          </form>
        ) : (
          <AppFormShellBody>
            <dl className="grid gap-5">
              <div>
                <dt className="text-sm font-medium">{t.provider}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {providerLabel}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">{t.endpointColumn}</dt>
                <dd className="mt-1 text-sm break-all text-muted-foreground">
                  {provider.baseUrl ||
                    formatMessage(t.defaultEndpointForProvider, {
                      provider: providerLabel,
                    })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">{t.description}</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                  {provider.description || t.referencesNotProvided}
                </dd>
              </div>
            </dl>
          </AppFormShellBody>
        )}
        {canDelete ? (
          <div className="flex flex-col px-6 pb-6">
            <Button
              type="button"
              variant={hasReferences ? "secondary" : "destructive"}
              onClick={() => {
                setDeleteError("")
                setPendingDelete({ kind: "connection" })
              }}
              disabled={hasReferences || pendingOperation !== null}
              aria-describedby={
                hasReferences ? "connection-delete-blocked" : undefined
              }
              className="w-full sm:w-auto sm:self-end"
            >
              <Trash2 data-icon="inline-start" />
              {t.deleteConnection}
            </Button>
          </div>
        ) : null}
      </AppFormShell>

      <section className="w-full rounded-xl border bg-card p-6">
        <header>
          <h2 className="text-base font-semibold">{t.apiKeys}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            <span className="hidden sm:inline">
              {t.connectionKeysDescription}
            </span>
            <span className="sm:hidden">
              {t.connectionKeysDescriptionMobile}
            </span>
          </p>
        </header>

        {credentials.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-4">
            {credentials.map((credential, index) => {
              const replacement = replacementKeys[credential.id] ?? ""
              const isReplacing =
                pendingOperation === `replace-key-${credential.id}`
              const isLastCredential = credentials.length === 1

              return (
                <li key={credential.id} className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-sm">
                      {credential.keyPreview}
                    </span>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant={isLastCredential ? "secondary" : "destructive"}
                        onClick={() => {
                          setDeleteError("")
                          setPendingDelete({ kind: "credential", credential })
                        }}
                        disabled={isLastCredential || pendingOperation !== null}
                        aria-label={formatMessage(t.removeKey, {
                          index: formatNumber(index + 1),
                        })}
                      >
                        <Trash2 data-icon="inline-start" />
                        {t.removeKeyAction}
                      </Button>
                    ) : null}
                  </div>

                  {isLastCredential ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      <span className="hidden sm:inline">
                        {t.lastKeyRemovalBlocked}
                      </span>
                      <span className="sm:hidden">
                        {t.lastKeyRemovalBlockedMobile}
                      </span>
                    </p>
                  ) : null}

                  {canUpdate ? (
                    <form
                      className="mt-5 flex flex-col gap-3"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void replaceKey(credential.id)
                      }}
                    >
                      <Field className="flex-1">
                        <FieldLabel
                          htmlFor={`replacement-key-${credential.id}`}
                        >
                          {t.replacementKey}
                        </FieldLabel>
                        <Input
                          id={`replacement-key-${credential.id}`}
                          type="password"
                          autoComplete="new-password"
                          value={replacement}
                          onChange={(event) =>
                            updateReplacement(credential.id, event.target.value)
                          }
                          placeholder={t.replacementKeyPlaceholder}
                          disabled={pendingOperation !== null}
                        />
                        <FieldDescription>
                          {t.replacementKeyDescription}
                        </FieldDescription>
                      </Field>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full sm:w-auto sm:self-end"
                        disabled={
                          pendingOperation !== null || !/\S/.test(replacement)
                        }
                      >
                        {isReplacing ? (
                          <>
                            <Spinner data-icon="inline-start" />
                            {t.replaceKeyPending}
                          </>
                        ) : (
                          t.replaceKey
                        )}
                      </Button>
                    </form>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t.noKeys}</p>
        )}

        {canAddKey ? (
          <form className="mt-6 flex flex-col gap-3" onSubmit={addKey}>
            <Field className="flex-1">
              <FieldLabel htmlFor="ai-provider-new-key">{t.newKey}</FieldLabel>
              <Input
                id="ai-provider-new-key"
                type="password"
                autoComplete="new-password"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder={t.newKeyPlaceholder}
                disabled={pendingOperation !== null}
              />
            </Field>
            <Button
              type="submit"
              className="w-full sm:w-auto sm:self-end"
              disabled={pendingOperation !== null || !/\S/.test(newKey)}
            >
              {pendingOperation === "add-key" ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {t.addKeyPending}
                </>
              ) : (
                <>
                  <Plus data-icon="inline-start" />
                  {t.addKey}
                </>
              )}
            </Button>
          </form>
        ) : null}
      </section>

      <section className="w-full rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {formatMessage(t.usedByTitle, {
                count: formatNumber(provider.taskReferences.length),
              })}
            </h2>
            {provider.taskReferences.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t.noTaskReferences}
              </p>
            ) : (
              <>
                <p
                  id="connection-delete-blocked"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  <span className="hidden sm:inline">
                    {t.deleteConnectionBlocked}
                  </span>
                  <span className="sm:hidden">
                    {t.deleteConnectionBlockedMobile}
                  </span>
                </p>
                <ul className="mt-3 flex flex-col gap-3">
                  {provider.taskReferences.map((reference, index) => (
                    <li
                      key={`${reference.task ?? "reference"}-${index}`}
                      className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <span className="font-medium">
                        {reference.task
                          ? dictionary.aiTaskConfigurations.taskNames[
                              reference.task
                            ]
                          : t.referencesNotProvided}
                      </span>
                      <span className="text-sm break-all text-muted-foreground">
                        {reference.model ?? t.referencesNotProvided}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {canReadTaskConfigurations ? (
            <Link
              href="/ai-task-configurations"
              className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto sm:self-end`}
            >
              {t.openTaskConfiguration}
            </Link>
          ) : null}
        </div>
      </section>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && pendingOperation !== "delete") {
            setPendingDelete(null)
            setDeleteError("")
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {pendingDelete?.kind === "credential"
                ? t.deleteKeyTitle
                : formatMessage(t.deleteConnectionTitle, {
                    provider: providerLabel,
                    id: formatNumber(provider.id),
                  })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "credential"
                ? formatMessage(t.deleteKeyDescription, {
                    keyPreview: pendingDelete.credential.keyPreview,
                  })
                : t.deleteConnectionDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              disabled={pendingOperation === "delete"}
            >
              {dictionary.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              disabled={pendingOperation === "delete"}
            >
              {pendingOperation === "delete" ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {t.deletePending}
                </>
              ) : (
                dictionary.common.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
