"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import { LocalizedLink as Link } from "@/components/localized-link"

import {
  getAiTaskModelCatalog,
  updateAiTaskOutputTokens,
  updateAiTaskSelection,
} from "@/app/api/ai-task-configurations/action"
import {
  type AiTaskConfiguration,
  type AiTaskConnectionOption,
  type AiTaskModelCatalog,
  type AiTaskType,
} from "@/app/lib/ai-task-configurations/definitions"
import type { AiProviderType } from "@/app/lib/ai-provider-configs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { isSystemPromptContentType } from "@/app/lib/system-prompts/definitions"
import { AppListTable } from "@/components/app-list-table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProviderOptionLabel } from "../ai-provider-configs/ai-provider-config-shared"

const TOKEN_LIMIT_MAX = 2_147_483_647

type GroupKey =
  | "newsProcessing"
  | "economicCalendar"
  | "eventIntelligence"
  | "warmKnowledge"
  | "aiAssistant"
  | "scheduledTelegramAnalysis"

const TASK_GROUPS: {
  key: GroupKey
  taskTypes: readonly AiTaskType[]
  note?: "aiAssistant" | "scheduledTelegramAnalysis"
}[] = [
  {
    key: "newsProcessing",
    taskTypes: ["NEWS_CONTENT_NORMALIZATION", "NEWS_EVENT_EXTRACTION"],
  },
  {
    key: "economicCalendar",
    taskTypes: ["ECONOMIC_CALENDAR_DESCRIPTION_TRANSLATION"],
  },
  {
    key: "eventIntelligence",
    taskTypes: [
      "EVENT_ASSET_THEME_ENRICHMENT",
      "MARKET_REACTION_ANALYSIS",
      "MARKET_REACTION_SUMMARY",
      "EVENT_NARRATIVE_REFRESH",
    ],
  },
  {
    key: "warmKnowledge",
    taskTypes: ["WARM_ABSORPTION_DECISION"],
  },
  {
    key: "aiAssistant",
    taskTypes: [
      "MARKET_QUESTION_UNDERSTANDING",
      "MARKET_CONVERSATION_RESPONSE",
    ],
    note: "aiAssistant",
  },
  {
    key: "scheduledTelegramAnalysis",
    taskTypes: ["SCHEDULED_TELEGRAM_ANALYSIS"],
    note: "scheduledTelegramAnalysis",
  },
]

type CatalogState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; catalog: AiTaskModelCatalog }
  | { status: "error"; message: string }

interface AiTaskConfigurationsListProps {
  configurations: AiTaskConfiguration[]
  connections: AiTaskConnectionOption[]
  connectionLoadError?: string
  canUpdate: boolean
  canReadConnections: boolean
  canReadModelCatalog: boolean
  canReadPrompts: boolean
}

export function AiTaskConfigurationsList({
  configurations: initialConfigurations,
  connections,
  connectionLoadError,
  canUpdate,
  canReadConnections,
  canReadModelCatalog,
  canReadPrompts,
}: AiTaskConfigurationsListProps) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiTaskConfigurations
  const [configurations, setConfigurations] = useState(initialConfigurations)
  const configurationsByTask = useMemo(
    () =>
      new Map(
        configurations.map((configuration) => [
          configuration.task,
          configuration,
        ])
      ),
    [configurations]
  )
  const unconfiguredCount = configurations.filter(
    (configuration) => !configuration.configured
  ).length

  const handleSaved = useCallback((updated: AiTaskConfiguration) => {
    setConfigurations((current) =>
      current.map((configuration) =>
        configuration.task === updated.task ? updated : configuration
      )
    )
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.pageTitle}</h1>
      <p className="-mt-4 max-w-3xl text-muted-foreground">
        {t.pageDescription}
      </p>

      {unconfiguredCount > 0 ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 px-4 py-4"
        >
          <p className="font-medium">
            {formatMessage(t.unconfiguredSummary, {
              count: formatNumber(unconfiguredCount),
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.unconfiguredDescription}
          </p>
        </div>
      ) : null}

      {connectionLoadError ? (
        <p role="alert" className="text-sm text-destructive">
          {connectionLoadError}
        </p>
      ) : canUpdate && canReadConnections && connections.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t.noConnections}
        </p>
      ) : null}

      {canUpdate && (!canReadConnections || !canReadModelCatalog) ? (
        <p className="text-sm text-muted-foreground" role="note">
          {t.selectionPermissionNote}
        </p>
      ) : null}

      <AppListTable className="mt-0">
        {TASK_GROUPS.map((group) => (
          <section key={group.key} aria-labelledby={`task-group-${group.key}`}>
            <div className="flex flex-col gap-1 border-y border-border bg-muted/40 px-4 py-2.5 md:px-6">
              <h2
                id={`task-group-${group.key}`}
                className="font-semibold text-foreground"
              >
                {t.groups[group.key]}
              </h2>
              {group.note ? (
                <p className="text-sm text-muted-foreground">
                  {t.groupNotes[group.note]}
                </p>
              ) : null}
            </div>
            <div className="divide-y divide-border">
              {group.taskTypes.map((taskType) => {
                const configuration = configurationsByTask.get(taskType)
                if (!configuration) {
                  return null
                }

                return (
                  <AiTaskConfigurationRow
                    key={taskType}
                    configuration={configuration}
                    connections={connections}
                    canUpdate={canUpdate}
                    canReadConnections={canReadConnections}
                    canReadModelCatalog={canReadModelCatalog}
                    canReadPrompts={canReadPrompts}
                    onSaved={handleSaved}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </AppListTable>

      <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <h2 className="font-medium">{t.configurationScopeTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.configurationScopeDescription}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">{t.saveSettingsNote}</p>
    </div>
  )
}

interface AiTaskConfigurationRowProps {
  configuration: AiTaskConfiguration
  connections: AiTaskConnectionOption[]
  canUpdate: boolean
  canReadConnections: boolean
  canReadModelCatalog: boolean
  canReadPrompts: boolean
  onSaved: (configuration: AiTaskConfiguration) => void
}

function AiTaskConfigurationRow({
  configuration: initialConfiguration,
  connections,
  canUpdate,
  canReadConnections,
  canReadModelCatalog,
  canReadPrompts,
  onSaved,
}: AiTaskConfigurationRowProps) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiTaskConfigurations
  const [savedConfiguration, setSavedConfiguration] =
    useState(initialConfiguration)
  const [connectionId, setConnectionId] = useState<number | null>(
    initialConfiguration.selectedConnectionId
  )
  const [model, setModel] = useState(initialConfiguration.selectedModel ?? "")
  const [tokenInput, setTokenInput] = useState(
    initialConfiguration.customOutputTokens?.toString() ?? ""
  )
  const [catalogs, setCatalogs] = useState<Record<number, CatalogState>>({})
  const [selectionError, setSelectionError] = useState<string>()
  const [tokenAttempted, setTokenAttempted] = useState(false)
  const [tokenSaveError, setTokenSaveError] = useState<string>()
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | undefined
  >()
  const [isSaving, setIsSaving] = useState(false)
  const [focusAfterSubmit, setFocusAfterSubmit] = useState<{
    controlId: string
  } | null>(null)

  useEffect(() => {
    if (isSaving || focusAfterSubmit === null) return

    document.getElementById(focusAfterSubmit.controlId)?.focus()
  }, [focusAfterSubmit, isSaving])

  const connectionControlId = `${initialConfiguration.task}-connection`
  const modelControlId = `${initialConfiguration.task}-model`
  const tokenControlId = `${initialConfiguration.task}-output-tokens`
  const titleId = `${initialConfiguration.task}-title`
  const descriptionId = `${initialConfiguration.task}-description`
  const tokenHelpId = `${initialConfiguration.task}-token-help`
  const tokenErrorId = `${initialConfiguration.task}-token-error`

  const catalogState =
    connectionId === null ? undefined : catalogs[connectionId]
  const models =
    catalogState?.status === "loaded" ? catalogState.catalog.models : []
  const connectionIsDirty =
    connectionId !== savedConfiguration.selectedConnectionId ||
    model !== (savedConfiguration.selectedModel ?? "")
  const parsedToken = parseTokenInput(tokenInput)
  const tokenIsInvalid = parsedToken === undefined
  const tokenIsDirty =
    !tokenIsInvalid && parsedToken !== savedConfiguration.customOutputTokens
  const isDirty = connectionIsDirty || tokenIsDirty || tokenIsInvalid

  const loadModelCatalog = useCallback(
    async (requestedConnectionId: number, force = false) => {
      const cachedCatalog = catalogs[requestedConnectionId]
      if (
        !force &&
        (cachedCatalog?.status === "loading" ||
          cachedCatalog?.status === "loaded")
      ) {
        return
      }

      setCatalogs((current) => ({
        ...current,
        [requestedConnectionId]: { status: "loading" },
      }))
      const result = await getAiTaskModelCatalog(requestedConnectionId).catch(
        () => ({ success: false as const, error: t.modelCatalogError })
      )
      setCatalogs((current) => ({
        ...current,
        [requestedConnectionId]: result.success
          ? { status: "loaded", catalog: result.data }
          : { status: "error", message: result.error },
      }))
    },
    [catalogs, t.modelCatalogError]
  )

  function handleConnectionChange(value: string | null) {
    const nextConnectionId = value ? Number(value) : null
    if (nextConnectionId !== null && !Number.isSafeInteger(nextConnectionId)) {
      return
    }
    setConnectionId(nextConnectionId)
    setModel("")
    setSelectionError(undefined)
    setFeedback(undefined)
  }

  function handleModelChange(value: string | null) {
    setModel(value ?? "")
    setSelectionError(undefined)
    setFeedback(undefined)
  }

  function getConnectionLabel(
    id: number,
    providerType?: AiProviderType | null
  ) {
    const connection = connections.find((item) => item.id === id)
    const resolvedProviderType = connection?.providerType ?? providerType
    const providerLabel = getProviderOptionLabel(
      resolvedProviderType ?? undefined,
      dictionary
    )
    return `${providerLabel} · #${formatNumber(id)}`
  }

  function getTokenDefaultLabel() {
    if (savedConfiguration.defaultOutputTokens === null) {
      return formatMessage(t.defaultLabel, { value: t.sdkProviderDefault })
    }

    const value = formatNumber(savedConfiguration.defaultOutputTokens)
    return initialConfiguration.task === "SCHEDULED_TELEGRAM_ANALYSIS"
      ? formatMessage(t.defaultPerRequest, { value })
      : formatMessage(t.defaultLabel, { value })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canUpdate || isSaving || !isDirty) return

    setIsSaving(true)
    setSelectionError(undefined)
    setTokenAttempted(true)
    setTokenSaveError(undefined)
    setFeedback(undefined)

    try {
      let latestSavedConfiguration = savedConfiguration
      let selectionWasSaved = false
      let tokenWasSaved = false
      let firstInvalidControlId: string | undefined
      const failures: { field: string; message: string }[] = []

      if (connectionIsDirty) {
        if (connectionId === null || !model.trim()) {
          const message =
            connectionId === null ? t.connectionRequired : t.modelRequired
          setSelectionError(message)
          firstInvalidControlId =
            connectionId === null ? connectionControlId : modelControlId
          failures.push({
            field: `${t.connection} / ${t.model}`,
            message,
          })
        } else {
          const selectionResult = await updateAiTaskSelection(
            initialConfiguration.task,
            { connectionId, model }
          ).catch(() => ({ success: false as const, error: t.rowSaveError }))

          if (selectionResult.success) {
            latestSavedConfiguration = selectionResult.data
            setConnectionId(selectionResult.data.selectedConnectionId)
            setModel(selectionResult.data.selectedModel ?? "")
            selectionWasSaved = true
          } else {
            setSelectionError(selectionResult.error)
            firstInvalidControlId ??= modelControlId
            failures.push({
              field: `${t.connection} / ${t.model}`,
              message: selectionResult.error,
            })
          }
        }
      }

      if (tokenIsInvalid || tokenIsDirty) {
        if (tokenIsInvalid) {
          firstInvalidControlId ??= tokenControlId
          failures.push({
            field: t.outputTokenLimit,
            message: getTokenInputError(),
          })
        } else {
          const tokenResult = await updateAiTaskOutputTokens(
            initialConfiguration.task,
            { maxOutputTokens: parsedToken }
          ).catch(() => ({ success: false as const, error: t.rowSaveError }))

          if (tokenResult.success) {
            latestSavedConfiguration = tokenResult.data
            setTokenInput(tokenResult.data.customOutputTokens?.toString() ?? "")
            tokenWasSaved = true
          } else {
            setTokenSaveError(tokenResult.error)
            firstInvalidControlId ??= tokenControlId
            failures.push({
              field: t.outputTokenLimit,
              message: tokenResult.error,
            })
          }
        }
      }

      setFocusAfterSubmit(
        firstInvalidControlId ? { controlId: firstInvalidControlId } : null
      )

      if (selectionWasSaved || tokenWasSaved) {
        setSavedConfiguration(latestSavedConfiguration)
        onSaved(latestSavedConfiguration)
      }

      if (failures.length > 0) {
        const savedFields = [
          selectionWasSaved ? `${t.connection} / ${t.model}` : undefined,
          tokenWasSaved ? t.outputTokenLimit : undefined,
        ].filter((value): value is string => Boolean(value))
        const message =
          savedFields.length > 0
            ? `${formatMessage(t.partialSave, {
                saved: savedFields.join(", "),
                failed: failures.map(({ field }) => field).join(", "),
              })} ${failures.map(({ message }) => message).join(" ")}`
            : failures.map(({ message }) => message).join(" ")
        setFeedback({ type: "error", message })
      } else if (selectionWasSaved || tokenWasSaved) {
        setFeedback({ type: "success", message: t.saveSuccess })
      }
    } finally {
      setIsSaving(false)
    }
  }

  function getTokenInputError() {
    const numericValue = Number(tokenInput)
    if (
      !/^\d+$/.test(tokenInput) ||
      !Number.isSafeInteger(numericValue) ||
      numericValue < 1
    ) {
      return t.tokenPositiveError
    }
    return formatMessage(t.tokenMaximumError, {
      max: formatNumber(TOKEN_LIMIT_MAX),
    })
  }

  const promptTypes = savedConfiguration.promptTypes.filter(
    isSystemPromptContentType
  )
  const selectedConnectionLabel =
    savedConfiguration.selectedConnectionId === null
      ? t.noSelection
      : getConnectionLabel(
          savedConfiguration.selectedConnectionId,
          savedConfiguration.selectedProviderType
        )
  const tokenError =
    tokenAttempted && tokenIsInvalid ? getTokenInputError() : tokenSaveError
  const catalogError =
    catalogState?.status === "error" ? catalogState.message : undefined
  const connectionSelectionError =
    selectionError && connectionId === null ? selectionError : undefined
  const modelSelectionError =
    selectionError && connectionId !== null ? selectionError : undefined
  const modelCatalogErrorId = `${modelControlId}-catalog-error`
  const modelSelectionErrorId = `${modelControlId}-selection-error`
  const modelDescribedBy = [
    `${modelControlId}-help`,
    modelSelectionError ? modelSelectionErrorId : undefined,
    catalogError ? modelCatalogErrorId : undefined,
  ]
    .filter((id): id is string => Boolean(id))
    .join(" ")

  return (
    <form
      noValidate
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onSubmit={handleSubmit}
      aria-busy={isSaving}
      className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.25fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(10rem,1.1fr)_auto]"
    >
      <div className="flex min-w-0 flex-col gap-1 sm:col-span-2 xl:col-span-1">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="leading-snug font-semibold">
            {t.taskNames[savedConfiguration.task]}
          </h3>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {t.taskDescriptions[savedConfiguration.task]}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {savedConfiguration.configured ? t.configured : t.notConfigured}
        </p>
        {canReadPrompts && promptTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label={t.prompts}>
            {promptTypes.map((promptType) => (
              <Link
                key={promptType}
                href={`/system-prompts/${encodeURIComponent(promptType)}/view`}
                prefetch={false}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {promptTypes.length === 1
                  ? t.openPrompt
                  : t.promptTypeLabels[promptType]}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={connectionControlId}>
          {t.connection} <span aria-hidden="true">*</span>
          <span className="sr-only"> {t.connectionRequired}</span>
        </Label>
        <Select
          value={connectionId === null ? undefined : String(connectionId)}
          onValueChange={handleConnectionChange}
          disabled={
            !canUpdate ||
            !canReadConnections ||
            !canReadModelCatalog ||
            connections.length === 0 ||
            isSaving
          }
        >
          <SelectTrigger
            id={connectionControlId}
            className="w-full min-w-0"
            aria-required="true"
            aria-invalid={connectionSelectionError ? true : undefined}
            aria-describedby={
              connectionSelectionError
                ? `${connectionControlId}-help ${connectionControlId}-error`
                : `${connectionControlId}-help`
            }
          >
            <SelectValue placeholder={t.connectionPlaceholder}>
              {(value) => {
                if (!value) return t.connectionPlaceholder

                const id = Number(value)
                const selectedConnection = connections.find(
                  (connection) => connection.id === id
                )

                return getConnectionLabel(
                  id,
                  selectedConnection?.providerType ??
                    (id === savedConfiguration.selectedConnectionId
                      ? savedConfiguration.selectedProviderType
                      : null)
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {getConnectionLabel(connection.id, connection.providerType)}
                </SelectItem>
              ))}
              {savedConfiguration.selectedConnectionId !== null &&
              !connections.some(
                (connection) =>
                  connection.id === savedConfiguration.selectedConnectionId
              ) ? (
                <SelectItem
                  value={String(savedConfiguration.selectedConnectionId)}
                  disabled
                >
                  {selectedConnectionLabel}
                </SelectItem>
              ) : null}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p
          id={`${connectionControlId}-help`}
          className="text-xs text-muted-foreground"
        >
          {canUpdate && !canReadConnections
            ? t.connectionPermissionNote
            : canUpdate && !canReadModelCatalog
              ? t.modelPermissionNote
              : t.connectionHelp}
        </p>
        {connectionSelectionError ? (
          <p
            id={`${connectionControlId}-error`}
            role="alert"
            className="text-xs text-destructive"
          >
            {connectionSelectionError}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={modelControlId}>
          {t.model} <span aria-hidden="true">*</span>
          <span className="sr-only"> {t.modelRequired}</span>
        </Label>
        <Select
          value={model || undefined}
          onValueChange={handleModelChange}
          onOpenChange={(open) => {
            if (
              open &&
              connectionId !== null &&
              canReadModelCatalog &&
              !isSaving
            ) {
              void loadModelCatalog(connectionId)
            }
          }}
          disabled={
            !canUpdate ||
            !canReadModelCatalog ||
            connectionId === null ||
            isSaving
          }
        >
          <SelectTrigger
            id={modelControlId}
            className="w-full min-w-0"
            aria-required="true"
            aria-invalid={modelSelectionError ? true : undefined}
            aria-describedby={modelDescribedBy}
          >
            <SelectValue placeholder={t.modelPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {catalogState?.status === "loading" ? (
                <SelectItem value="__loading" disabled>
                  {t.loadingModels}
                </SelectItem>
              ) : null}
              {catalogState?.status === "loaded" && models.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  {t.noModels}
                </SelectItem>
              ) : null}
              {catalogState?.status === "error" ? (
                <SelectItem value="__error" disabled>
                  {catalogState.message}
                </SelectItem>
              ) : null}
              {model && !models.some((option) => option.id === model) ? (
                <SelectItem value={model} disabled>
                  {model}
                </SelectItem>
              ) : null}
              {models.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p
          id={`${modelControlId}-help`}
          className="text-xs text-muted-foreground"
        >
          {canUpdate && !canReadModelCatalog
            ? t.modelPermissionNote
            : t.modelHelp}
        </p>
        {modelSelectionError ? (
          <p
            id={modelSelectionErrorId}
            role="alert"
            className="text-xs text-destructive"
          >
            {modelSelectionError}
          </p>
        ) : null}
        {catalogError ? (
          <div className="flex flex-wrap items-center gap-2">
            <p
              id={modelCatalogErrorId}
              role="alert"
              className="text-xs text-destructive"
            >
              {catalogError}
            </p>
            {canUpdate && canReadModelCatalog ? (
              <Button
                type="button"
                variant="link"
                disabled={catalogState?.status === "loading"}
                onClick={() => {
                  if (connectionId !== null) {
                    void loadModelCatalog(connectionId, true)
                  }
                }}
              >
                {t.retryModels}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={tokenControlId}>{t.outputTokenLimit}</Label>
        <Input
          id={tokenControlId}
          type="number"
          inputMode="numeric"
          min={1}
          max={TOKEN_LIMIT_MAX}
          step={1}
          value={tokenInput}
          placeholder={t.tokenPlaceholder}
          aria-describedby={
            tokenError ? `${tokenHelpId} ${tokenErrorId}` : tokenHelpId
          }
          aria-invalid={tokenError ? true : undefined}
          disabled={!canUpdate || isSaving}
          onChange={(event) => {
            setTokenInput(event.target.value)
            setTokenAttempted(false)
            setTokenSaveError(undefined)
            setFeedback(undefined)
          }}
        />
        <p id={tokenHelpId} className="text-xs text-muted-foreground">
          {getTokenDefaultLabel()}
        </p>
        {tokenError ? (
          <p
            id={tokenErrorId}
            role="alert"
            className="text-xs text-destructive"
          >
            {tokenError}
          </p>
        ) : null}
      </div>

      {canUpdate ? (
        <div className="flex items-end xl:items-center">
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving ? <Spinner aria-hidden="true" /> : null}
            {isSaving ? t.saving : t.save}
          </Button>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`sm:col-span-2 xl:col-span-5 ${
            feedback.type === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  )
}

function parseTokenInput(value: string): number | null | undefined {
  if (value.trim() === "") return null
  if (!/^\d+$/.test(value)) return undefined

  const numericValue = Number(value)
  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 1 ||
    numericValue > TOKEN_LIMIT_MAX
  ) {
    return undefined
  }

  return numericValue
}
