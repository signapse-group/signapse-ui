"use client"

import type { Dispatch, FormEvent, SetStateAction } from "react"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  GlobeIcon,
  Pencil,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  createTelegramMarketAnalysisSchedule,
  updateTelegramMarketAnalysisSchedule,
} from "@/app/api/telegram/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import { isSelectableLanguage } from "@/app/lib/languages/definitions"
import type { LanguageResponse } from "@/app/lib/languages/definitions"
import {
  getSaveTelegramMarketAnalysisScheduleSchema,
  normalizeSaveTelegramMarketAnalysisScheduleRequest,
  ScheduledAssetResponse,
  TelegramDestinationResponse,
  TelegramMarketAnalysisScheduleResponse,
} from "@/app/lib/telegram/definitions"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"
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
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { getDestinationLabel } from "./telegram-configuration-shared"

const DEFAULT_LANGUAGE_VALUE = "__default__"
const TIMEZONE_GROUP_ORDER = [
  "Africa",
  "America",
  "Antarctica",
  "Asia",
  "Atlantic",
  "Australia",
  "Europe",
  "Indian",
  "Pacific",
  "Etc",
] as const

type ScheduleFormValues = {
  name: string
  destinationId: string
  assetId: string
  timezone: string
  localTimes: string[]
  outputLanguageIsoCode: string
}

type ScheduleFormErrors = Partial<Record<keyof ScheduleFormValues, string>>

type ScheduleFormFieldsProps = {
  idPrefix: string
  values: ScheduleFormValues
  errors: ScheduleFormErrors
  activeDestinations: TelegramDestinationResponse[]
  currentDestination?: TelegramDestinationResponse
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  currentAsset?: ScheduledAssetResponse
  languages: LanguageResponse[]
  currentOutputLanguage?: LanguageResponse
  languageCatalogError: boolean
  disabled: boolean
  dictionary: Dictionary
  onChange: (field: keyof ScheduleFormValues, value: string | string[]) => void
}

type AssetOption = {
  assetId: number
  assetSymbol?: string
  assetName?: string
  unavailable?: boolean
}

type DestinationOption = {
  destination: TelegramDestinationResponse
  unavailable?: boolean
}

type LanguageOption = LanguageResponse & {
  isoCode: string
  unavailable?: boolean
}

type TimezoneItem = {
  value: string
  label: string
}

type TimezoneGroup = {
  value: string
  label: string
  items: TimezoneItem[]
}

function getScheduleFieldId(idPrefix: string, field: keyof ScheduleFormValues) {
  if (field === "localTimes") return `${idPrefix}-local-time-0`
  return `${idPrefix}-${field}`
}

function getInitialScheduleValues(
  schedule: TelegramMarketAnalysisScheduleResponse | undefined,
  activeDestinations: TelegramDestinationResponse[]
): ScheduleFormValues {
  return {
    name: schedule?.name ?? "",
    destinationId:
      schedule?.destination?.id.toString() ??
      activeDestinations[0]?.id.toString() ??
      "",
    assetId: schedule?.asset?.assetId.toString() ?? "",
    timezone: schedule?.timezone ?? "Asia/Bangkok",
    localTimes: schedule?.localTimes.length ? [...schedule.localTimes] : [""],
    outputLanguageIsoCode: schedule?.outputLanguage?.isoCode ?? "",
  }
}

function formatAssetOption(asset: AssetOption, unavailableLabel: string) {
  const label = [asset.assetSymbol, asset.assetName].filter(Boolean).join(" — ")
  return asset.unavailable
    ? `${label || asset.assetId} — ${unavailableLabel}`
    : label || String(asset.assetId)
}

function getTimezoneGroupLabel(value: string, dictionary: Dictionary): string {
  const schedule = dictionary.telegram.schedule

  switch (value) {
    case "Africa":
      return schedule.timezoneGroupAfrica
    case "America":
      return schedule.timezoneGroupAmericas
    case "Asia":
      return schedule.timezoneGroupAsia
    case "Australia":
      return schedule.timezoneGroupAustralia
    case "Europe":
      return schedule.timezoneGroupEurope
    case "Pacific":
      return schedule.timezoneGroupPacific
    case "Etc":
      return schedule.timezoneGroupEtc
    default:
      return value
  }
}

function getTimezoneOffset(timeZone: string) {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date())
      .find((item) => item.type === "timeZoneName")?.value

    if (!part || part === "GMT") return "GMT+00:00"

    const match = part.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/)
    if (!match) return part

    return `GMT${match[1]}${match[2].padStart(2, "0")}:${match[3] ?? "00"}`
  } catch {
    return "GMT+00:00"
  }
}

function getTimezoneLocation(timeZone: string) {
  const parts = timeZone.split("/")
  return (parts[parts.length - 1] ?? timeZone).replaceAll("_", " ")
}

function getTimezoneGroups(dictionary: Dictionary): TimezoneGroup[] {
  const zones = new Set<string>(["Asia/Bangkok", "UTC"])

  if (typeof Intl.supportedValuesOf === "function") {
    Intl.supportedValuesOf("timeZone").forEach((timeZone) =>
      zones.add(timeZone)
    )
  }

  const groups = new Map<string, TimezoneItem[]>()

  Array.from(zones)
    .sort()
    .forEach((timeZone) => {
      const group = timeZone.includes("/") ? timeZone.split("/")[0] : "Etc"
      const label = getTimezoneLocation(timeZone)
      const offset = getTimezoneOffset(timeZone)
      const item = {
        value: timeZone,
        label: `(${offset}) ${label} — ${timeZone}`,
      }

      groups.set(group, [...(groups.get(group) ?? []), item])
    })

  return Array.from(groups.entries())
    .sort(
      ([left], [right]) =>
        TIMEZONE_GROUP_ORDER.indexOf(
          left as (typeof TIMEZONE_GROUP_ORDER)[number]
        ) -
        TIMEZONE_GROUP_ORDER.indexOf(
          right as (typeof TIMEZONE_GROUP_ORDER)[number]
        )
    )
    .map(([value, items]) => ({
      value,
      label: getTimezoneGroupLabel(value, dictionary),
      items,
    }))
}

function getSelectableLanguageIsoCodes(
  languages: LanguageResponse[],
  currentOutputLanguage?: LanguageResponse
): string[] {
  return [
    ...languages
      .filter(isSelectableLanguage)
      .map((language) => language.isoCode),
    ...(currentOutputLanguage && isSelectableLanguage(currentOutputLanguage)
      ? [currentOutputLanguage.isoCode]
      : []),
  ]
}

function getScheduleFormErrors(
  values: ScheduleFormValues,
  currentWorkspaceId: number | undefined,
  activeDestinations: TelegramDestinationResponse[],
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[],
  languages: LanguageResponse[],
  languageCatalogError: boolean,
  dictionary: Dictionary,
  currentOutputLanguage?: LanguageResponse
): ScheduleFormErrors {
  const errors: ScheduleFormErrors = {}

  if (!currentWorkspaceId) {
    errors.name = dictionary.telegram.schedule.noWorkspaceDescription
  }

  if (!values.destinationId) {
    errors.destinationId = dictionary.telegram.destinationRequired
  } else if (
    !activeDestinations.some(
      (destination) => destination.id.toString() === values.destinationId
    )
  ) {
    errors.destinationId = dictionary.telegram.schedule.destinationUnavailable
  }

  if (!values.assetId) {
    errors.assetId = dictionary.telegram.assetRequired
  } else if (
    !watchlistAssets.some(
      (asset) => asset.assetId.toString() === values.assetId
    )
  ) {
    errors.assetId = dictionary.telegram.schedule.assetUnavailable
  }

  const request = normalizeSaveTelegramMarketAnalysisScheduleRequest({
    name: values.name,
    workspaceId: currentWorkspaceId ?? 0,
    destinationId: Number(values.destinationId),
    assetId: Number(values.assetId),
    timezone: values.timezone,
    localTimes: values.localTimes,
    outputLanguageIsoCode: values.outputLanguageIsoCode || undefined,
  })
  const parsed = getSaveTelegramMarketAnalysisScheduleSchema(
    dictionary,
    languageCatalogError
      ? undefined
      : getSelectableLanguageIsoCodes(languages, currentOutputLanguage)
  ).safeParse(request)

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      const field =
        typeof issue.path[0] === "number" ? "localTimes" : issue.path[0]
      if (typeof field === "string" && field in values && !(field in errors)) {
        errors[field as keyof ScheduleFormValues] = issue.message
      }
    })
  }

  return errors
}

function getValidatedRequest(
  values: ScheduleFormValues,
  workspaceId: number,
  languages: LanguageResponse[],
  languageCatalogError: boolean,
  dictionary: Dictionary,
  currentOutputLanguage?: LanguageResponse
) {
  const request = normalizeSaveTelegramMarketAnalysisScheduleRequest({
    name: values.name,
    workspaceId,
    destinationId: Number(values.destinationId),
    assetId: Number(values.assetId),
    timezone: values.timezone,
    localTimes: values.localTimes,
    outputLanguageIsoCode: values.outputLanguageIsoCode || undefined,
  })

  return getSaveTelegramMarketAnalysisScheduleSchema(
    dictionary,
    languageCatalogError
      ? undefined
      : getSelectableLanguageIsoCodes(languages, currentOutputLanguage)
  ).safeParse(request)
}

function focusFirstScheduleError(idPrefix: string, errors: ScheduleFormErrors) {
  const firstField = [
    "name",
    "destinationId",
    "assetId",
    "timezone",
    "localTimes",
    "outputLanguageIsoCode",
  ].find((field) => errors[field as keyof ScheduleFormValues]) as
    | keyof ScheduleFormValues
    | undefined

  if (!firstField) return

  requestAnimationFrame(() => {
    document.getElementById(getScheduleFieldId(idPrefix, firstField))?.focus()
  })
}

function updateScheduleField(
  setValues: Dispatch<SetStateAction<ScheduleFormValues>>,
  setErrors: Dispatch<SetStateAction<ScheduleFormErrors>>,
  setDirty: Dispatch<SetStateAction<boolean>>,
  field: keyof ScheduleFormValues,
  value: string | string[]
) {
  setValues((current) => {
    if (field === "localTimes") {
      return {
        ...current,
        localTimes: Array.isArray(value) ? value : [value],
      }
    }

    return {
      ...current,
      [field]: Array.isArray(value) ? (value[0] ?? "") : value,
    }
  })
  setErrors((current) => ({ ...current, [field]: undefined }))
  setDirty(true)
}

function ScheduleFormFields({
  idPrefix,
  values,
  errors,
  activeDestinations,
  currentDestination,
  watchlistAssets,
  currentAsset,
  languages,
  currentOutputLanguage,
  languageCatalogError,
  disabled,
  dictionary,
  onChange,
}: ScheduleFormFieldsProps) {
  const t = dictionary.telegram
  const timezoneGroups = useMemo(
    () => getTimezoneGroups(dictionary),
    [dictionary]
  )
  const assetOptions = useMemo<AssetOption[]>(() => {
    const options: AssetOption[] = watchlistAssets.map((asset) => ({
      assetId: asset.assetId,
      assetName: asset.assetName,
      assetSymbol: asset.assetSymbol,
    }))

    if (
      currentAsset &&
      !watchlistAssets.some((asset) => asset.assetId === currentAsset.assetId)
    ) {
      options.unshift({
        assetId: currentAsset.assetId,
        assetName: currentAsset.assetName,
        assetSymbol: currentAsset.assetSymbol,
        unavailable: true,
      })
    }

    return options
  }, [currentAsset, watchlistAssets])
  const destinationOptions = useMemo<DestinationOption[]>(() => {
    const options: DestinationOption[] = activeDestinations.map(
      (destination) => ({ destination })
    )

    if (
      currentDestination &&
      !activeDestinations.some(
        (destination) => destination.id === currentDestination.id
      )
    ) {
      options.unshift({ destination: currentDestination, unavailable: true })
    }

    return options
  }, [activeDestinations, currentDestination])
  const languageOptions = useMemo<LanguageOption[]>(() => {
    const options: LanguageOption[] = languages
      .filter(isSelectableLanguage)
      .map((language) => ({ ...language }))

    if (
      currentOutputLanguage &&
      isSelectableLanguage(currentOutputLanguage) &&
      !languages.some(
        (language) => language.isoCode === currentOutputLanguage.isoCode
      )
    ) {
      options.unshift({ ...currentOutputLanguage, unavailable: true })
    }

    return options
  }, [currentOutputLanguage, languages])
  const selectedTimezone =
    timezoneGroups
      .flatMap((group) => group.items)
      .find((item) => item.value === values.timezone) ?? null

  const descriptionId = (field: string) => `${idPrefix}-${field}-description`
  const errorId = (field: string) => `${idPrefix}-${field}-error`
  const describedBy = (field: string, hasDescription = true) => {
    const ids = hasDescription ? [descriptionId(field)] : []
    if (errors[field as keyof ScheduleFormValues]) ids.push(errorId(field))
    return ids.length ? ids.join(" ") : undefined
  }

  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor={getScheduleFieldId(idPrefix, "name")}>
          {t.schedule.nameLabel}
        </FieldLabel>
        <Input
          id={getScheduleFieldId(idPrefix, "name")}
          value={values.name}
          placeholder={t.schedule.namePlaceholder}
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name", false)}
          onChange={(event) => onChange("name", event.target.value)}
        />
        <FieldError id={errorId("name")}>{errors.name}</FieldError>
      </Field>

      <FieldSet>
        <FieldLegend>{t.schedule.scopeLegend}</FieldLegend>
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.destinationId)}>
            <FieldLabel htmlFor={getScheduleFieldId(idPrefix, "destinationId")}>
              {t.schedule.destinationLabel}
            </FieldLabel>
            <Select
              items={destinationOptions.map(({ destination, unavailable }) => ({
                value: destination.id.toString(),
                label: `${getDestinationLabel(destination, dictionary)}${
                  unavailable ? ` — ${t.schedule.destinationUnavailable}` : ""
                }`,
              }))}
              value={values.destinationId || null}
              onValueChange={(value) => onChange("destinationId", value ?? "")}
              disabled={disabled}
            >
              <SelectTrigger
                id={getScheduleFieldId(idPrefix, "destinationId")}
                className="w-full"
                aria-invalid={Boolean(errors.destinationId)}
                aria-describedby={describedBy("destinationId")}
              >
                <SelectValue placeholder={t.destination.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {destinationOptions.map(({ destination, unavailable }) => (
                    <SelectItem
                      key={destination.id}
                      value={destination.id.toString()}
                    >
                      {getDestinationLabel(destination, dictionary)}
                      {unavailable
                        ? ` — ${t.schedule.destinationUnavailable}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription id={descriptionId("destinationId")}>
              {t.schedule.destinationDescription}
            </FieldDescription>
            <FieldError id={errorId("destinationId")}>
              {errors.destinationId}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.assetId)}>
            <FieldLabel htmlFor={getScheduleFieldId(idPrefix, "assetId")}>
              {t.schedule.assetLabel}
            </FieldLabel>
            <Select
              items={assetOptions.map((asset) => ({
                value: asset.assetId.toString(),
                label: formatAssetOption(asset, t.schedule.assetUnavailable),
              }))}
              value={values.assetId || null}
              onValueChange={(value) => onChange("assetId", value ?? "")}
              disabled={disabled}
            >
              <SelectTrigger
                id={getScheduleFieldId(idPrefix, "assetId")}
                className="w-full"
                aria-invalid={Boolean(errors.assetId)}
                aria-describedby={describedBy("assetId")}
              >
                <SelectValue placeholder={t.schedule.assetPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {assetOptions.map((asset) => (
                    <SelectItem
                      key={asset.assetId}
                      value={asset.assetId.toString()}
                    >
                      {formatAssetOption(asset, t.schedule.assetUnavailable)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription id={descriptionId("assetId")}>
              {t.schedule.assetDescription}
            </FieldDescription>
            <FieldError id={errorId("assetId")}>{errors.assetId}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t.schedule.scheduleLegend}</FieldLegend>
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.timezone)}>
            <FieldLabel htmlFor={getScheduleFieldId(idPrefix, "timezone")}>
              {t.schedule.timezoneLabel}
            </FieldLabel>
            <Combobox
              items={timezoneGroups}
              value={selectedTimezone}
              onValueChange={(item) => onChange("timezone", item?.value ?? "")}
              disabled={disabled}
            >
              <ComboboxInput
                id={getScheduleFieldId(idPrefix, "timezone")}
                placeholder={t.schedule.timezonePlaceholder}
                aria-invalid={Boolean(errors.timezone)}
                aria-describedby={describedBy("timezone")}
              >
                <InputGroupAddon>
                  <GlobeIcon />
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent alignOffset={-28} className="w-60">
                <ComboboxEmpty>{t.schedule.timezoneEmpty}</ComboboxEmpty>
                <ComboboxList>
                  {(group) => (
                    <ComboboxGroup key={group.value} items={group.items}>
                      <ComboboxLabel>{group.label}</ComboboxLabel>
                      <ComboboxCollection>
                        {(item) => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldDescription id={descriptionId("timezone")}>
              {t.schedule.timezoneDescription}
            </FieldDescription>
            <FieldError id={errorId("timezone")}>{errors.timezone}</FieldError>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">
              {t.schedule.localTimesLabel}
            </FieldLegend>
            <FieldDescription id={descriptionId("localTimes")}>
              {t.schedule.localTimesDescription}
            </FieldDescription>
            <FieldGroup className="gap-3">
              {values.localTimes.map((time, index) => {
                const inputId = `${idPrefix}-local-time-${index}`
                return (
                  <Field
                    key={inputId}
                    data-invalid={Boolean(errors.localTimes)}
                  >
                    <FieldLabel htmlFor={inputId}>
                      {t.schedule.localTimeRowLabel.replace(
                        "{index}",
                        String(index + 1)
                      )}
                    </FieldLabel>
                    <div className="flex min-w-0 items-center gap-2">
                      <Input
                        id={inputId}
                        type="time"
                        step="60"
                        value={time}
                        disabled={disabled}
                        className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        aria-invalid={Boolean(errors.localTimes)}
                        aria-describedby={describedBy("localTimes")}
                        onChange={(event) => {
                          const localTimes = [...values.localTimes]
                          localTimes[index] = event.target.value
                          onChange("localTimes", localTimes)
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        disabled={disabled || values.localTimes.length === 1}
                        aria-label={t.schedule.removeLocalTime.replace(
                          "{index}",
                          String(index + 1)
                        )}
                        onClick={() =>
                          onChange(
                            "localTimes",
                            values.localTimes.filter(
                              (_, itemIndex) => itemIndex !== index
                            )
                          )
                        }
                      >
                        <X data-icon="inline-start" />
                      </Button>
                    </div>
                  </Field>
                )
              })}
            </FieldGroup>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled || values.localTimes.length >= 4}
                onClick={() =>
                  onChange("localTimes", [...values.localTimes, ""])
                }
              >
                <Plus data-icon="inline-start" />
                {t.schedule.addLocalTime}
              </Button>
              <FieldError id={errorId("localTimes")}>
                {errors.localTimes}
              </FieldError>
            </div>
          </FieldSet>

          <Field data-invalid={Boolean(errors.outputLanguageIsoCode)}>
            <FieldLabel
              htmlFor={getScheduleFieldId(idPrefix, "outputLanguageIsoCode")}
            >
              {t.schedule.outputLanguageLabel}
            </FieldLabel>
            <Select
              items={[
                {
                  value: DEFAULT_LANGUAGE_VALUE,
                  label: t.schedule.defaultLanguage,
                },
                ...languageOptions.map((language) => ({
                  value: language.isoCode,
                  label: `${language.name || language.isoCode} (${language.isoCode})${
                    language.unavailable
                      ? ` — ${t.schedule.languageUnavailable}`
                      : ""
                  }`,
                })),
              ]}
              value={values.outputLanguageIsoCode || DEFAULT_LANGUAGE_VALUE}
              onValueChange={(value) =>
                onChange(
                  "outputLanguageIsoCode",
                  value === DEFAULT_LANGUAGE_VALUE ? "" : (value ?? "")
                )
              }
              disabled={disabled}
            >
              <SelectTrigger
                id={getScheduleFieldId(idPrefix, "outputLanguageIsoCode")}
                className="w-full"
                aria-invalid={Boolean(errors.outputLanguageIsoCode)}
                aria-describedby={describedBy("outputLanguageIsoCode")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={DEFAULT_LANGUAGE_VALUE}>
                    {t.schedule.defaultLanguage}
                  </SelectItem>
                  {languageOptions.map((language) => (
                    <SelectItem key={language.isoCode} value={language.isoCode}>
                      {language.name || language.isoCode} ({language.isoCode})
                      {language.unavailable
                        ? ` — ${t.schedule.languageUnavailable}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription
              id={descriptionId("outputLanguageIsoCode")}
              role={languageCatalogError ? "status" : undefined}
            >
              {languageCatalogError
                ? t.schedule.languageCatalogError
                : t.schedule.outputLanguageDescription}
            </FieldDescription>
            <FieldError id={errorId("outputLanguageIsoCode")}>
              {errors.outputLanguageIsoCode}
            </FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  )
}

function ScheduleDiscardDialog({
  open,
  onOpenChange,
  onDiscard,
  disabled,
  dictionary,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
  disabled: boolean
  dictionary: Dictionary
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dictionary.telegram.schedule.discardTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dictionary.telegram.schedule.discardDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disabled}>
            {dictionary.telegram.schedule.keepEditing}
          </AlertDialogCancel>
          <AlertDialogAction disabled={disabled} onClick={onDiscard}>
            {dictionary.telegram.schedule.discardAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getCreateDisabledReason(
  currentWorkspace: { id: number } | null,
  activeDestinations: TelegramDestinationResponse[],
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[],
  dictionary: Dictionary
) {
  if (!currentWorkspace)
    return dictionary.telegram.schedule.createDisabledNoWorkspace
  if (activeDestinations.length === 0) {
    return dictionary.telegram.schedule.createDisabledNoDestination
  }
  if (watchlistAssets.length === 0) {
    return dictionary.telegram.schedule.createDisabledNoAsset
  }
  return null
}

export function CreateTelegramScheduleDialog({
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  languages,
  languageCatalogError,
  canManage,
}: {
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: { id: number; name: string } | null
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  languages: LanguageResponse[]
  languageCatalogError: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const [open, setOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [backendError, setBackendError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ScheduleFormErrors>({})
  const initialValues = useMemo(
    () => getInitialScheduleValues(undefined, activeDestinations),
    [activeDestinations]
  )
  const [values, setValues] = useState(initialValues)
  const disabledReason = getCreateDisabledReason(
    currentWorkspace,
    activeDestinations,
    watchlistAssets,
    dictionary
  )
  const canOpen = canManage && !disabledReason

  function resetForm() {
    setValues(initialValues)
    setErrors({})
    setBackendError(null)
    setIsDirty(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetForm()
      setOpen(true)
      return
    }

    if (isPending) return
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentWorkspace) return

    const nextErrors = getScheduleFormErrors(
      values,
      currentWorkspace.id,
      activeDestinations,
      watchlistAssets,
      languages,
      languageCatalogError,
      dictionary
    )

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      focusFirstScheduleError("telegram-schedule-create", nextErrors)
      return
    }

    const request = getValidatedRequest(
      values,
      currentWorkspace.id,
      languages,
      languageCatalogError,
      dictionary
    )

    if (!request.success) {
      const nextRequestErrors = {
        name:
          request.error.issues[0]?.message ??
          dictionary.telegram.schedule.invalidData,
      }
      setErrors(nextRequestErrors)
      focusFirstScheduleError("telegram-schedule-create", nextRequestErrors)
      return
    }

    setBackendError(null)
    startTransition(async () => {
      const result = await createTelegramMarketAnalysisSchedule(request.data)

      if (result.success) {
        toast.success(dictionary.telegram.schedule.createSuccess)
        setIsDirty(false)
        setOpen(false)
        router.refresh()
      } else {
        setBackendError(result.error)
        toast.error(result.error)
      }
    })
  }

  if (!canManage) return null

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Dialog
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          if (
            !nextOpen &&
            eventDetails.reason === "outside-press" &&
            eventDetails.event.target instanceof Element &&
            eventDetails.event.target.closest('[data-slot="popover-content"]')
          ) {
            eventDetails.cancel()
            return
          }

          if (
            !nextOpen &&
            (eventDetails.reason === "escape-key" ||
              eventDetails.reason === "outside-press") &&
            (isPending || isDirty)
          ) {
            eventDetails.cancel()
            if (isDirty) setDiscardOpen(true)
            return
          }

          handleOpenChange(nextOpen)
        }}
      >
        <DialogTrigger render={<Button disabled={!canOpen} />}>
          <Plus data-icon="inline-start" />
          {dictionary.telegram.schedule.createSchedule}
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {dictionary.telegram.schedule.dialogCreateTitle}
            </DialogTitle>
            <DialogDescription>
              {dictionary.telegram.schedule.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <ScheduleFormFields
              idPrefix="telegram-schedule-create"
              values={values}
              errors={errors}
              activeDestinations={activeDestinations}
              watchlistAssets={watchlistAssets}
              languages={languages}
              languageCatalogError={languageCatalogError}
              disabled={isPending}
              dictionary={dictionary}
              onChange={(field, value) =>
                updateScheduleField(
                  setValues,
                  setErrors,
                  setIsDirty,
                  field,
                  value
                )
              }
            />
            {backendError ? (
              <p role="alert" className="text-sm text-destructive">
                {backendError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                {dictionary.common.close}
              </Button>
              <Button type="submit" disabled={isPending || !currentWorkspace}>
                {isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CalendarClock data-icon="inline-start" />
                )}
                {dictionary.telegram.schedule.createSchedule}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {disabledReason ? (
        <span className="text-xs text-muted-foreground">{disabledReason}</span>
      ) : null}
      <ScheduleDiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          resetForm()
          setDiscardOpen(false)
          setOpen(false)
        }}
        disabled={isPending}
        dictionary={dictionary}
      />
    </div>
  )
}

export function UpdateTelegramScheduleDialog({
  schedule,
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  languages,
  languageCatalogError,
  canManage,
}: {
  schedule: TelegramMarketAnalysisScheduleResponse
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: { id: number; name: string } | null
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  languages: LanguageResponse[]
  languageCatalogError: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const idPrefix = `telegram-schedule-update-${schedule.id}`
  const initialValues = useMemo(
    () => getInitialScheduleValues(schedule, activeDestinations),
    [activeDestinations, schedule]
  )
  const [open, setOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [backendError, setBackendError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ScheduleFormErrors>({})
  const [values, setValues] = useState(initialValues)

  function resetForm() {
    setValues(initialValues)
    setErrors({})
    setBackendError(null)
    setIsDirty(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetForm()
      setOpen(true)
      return
    }

    if (isPending) return
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentWorkspace) return

    const nextErrors = getScheduleFormErrors(
      values,
      currentWorkspace.id,
      activeDestinations,
      watchlistAssets,
      languages,
      languageCatalogError,
      dictionary,
      schedule.outputLanguage
    )

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      focusFirstScheduleError(idPrefix, nextErrors)
      return
    }

    const request = getValidatedRequest(
      values,
      currentWorkspace.id,
      languages,
      languageCatalogError,
      dictionary,
      schedule.outputLanguage
    )

    if (!request.success) {
      const nextRequestErrors = {
        name:
          request.error.issues[0]?.message ??
          dictionary.telegram.schedule.invalidData,
      }
      setErrors(nextRequestErrors)
      focusFirstScheduleError(idPrefix, nextRequestErrors)
      return
    }

    setBackendError(null)
    startTransition(async () => {
      const result = await updateTelegramMarketAnalysisSchedule(
        schedule.id,
        request.data
      )

      if (result.success) {
        toast.success(dictionary.telegram.schedule.updateSuccess)
        setIsDirty(false)
        setOpen(false)
        router.refresh()
      } else {
        setBackendError(result.error)
        toast.error(result.error)
      }
    })
  }

  if (!canManage || schedule.status !== "ACTIVE") return null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          if (
            !nextOpen &&
            eventDetails.reason === "outside-press" &&
            eventDetails.event.target instanceof Element &&
            eventDetails.event.target.closest('[data-slot="popover-content"]')
          ) {
            eventDetails.cancel()
            return
          }

          if (
            !nextOpen &&
            (eventDetails.reason === "escape-key" ||
              eventDetails.reason === "outside-press") &&
            (isPending || isDirty)
          ) {
            eventDetails.cancel()
            if (isDirty) setDiscardOpen(true)
            return
          }

          handleOpenChange(nextOpen)
        }}
      >
        <DialogTrigger
          render={
            <Button
              id={`${idPrefix}-trigger`}
              variant="ghost"
              size="icon-sm"
              aria-label={dictionary.telegram.schedule.editTrigger}
            />
          }
        >
          <Pencil data-icon="inline-start" />
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {dictionary.telegram.schedule.dialogEditTitle}
            </DialogTitle>
            <DialogDescription>
              {dictionary.telegram.schedule.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <ScheduleFormFields
              idPrefix={idPrefix}
              values={values}
              errors={errors}
              activeDestinations={activeDestinations}
              currentDestination={schedule.destination}
              watchlistAssets={watchlistAssets}
              currentAsset={schedule.asset}
              languages={languages}
              currentOutputLanguage={schedule.outputLanguage}
              languageCatalogError={languageCatalogError}
              disabled={isPending}
              dictionary={dictionary}
              onChange={(field, value) =>
                updateScheduleField(
                  setValues,
                  setErrors,
                  setIsDirty,
                  field,
                  value
                )
              }
            />
            {backendError ? (
              <p role="alert" className="text-sm text-destructive">
                {backendError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                {dictionary.common.close}
              </Button>
              <Button type="submit" disabled={isPending || !currentWorkspace}>
                {isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CalendarClock data-icon="inline-start" />
                )}
                {dictionary.telegram.schedule.saveSchedule}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ScheduleDiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          resetForm()
          setDiscardOpen(false)
          setOpen(false)
        }}
        disabled={isPending}
        dictionary={dictionary}
      />
    </>
  )
}
