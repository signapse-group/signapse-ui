"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  CalendarClock,
  MessageCircle,
  RadioTower,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import { isSelectableLanguage } from "@/app/lib/languages/definitions"
import type { LanguageResponse } from "@/app/lib/languages/definitions"
import {
  TelegramConfigurationData,
  TelegramDestinationResponse,
  TelegramFeatureKey,
  TelegramFeatureSettingResponse,
  TelegramMarketAnalysisScheduleResponse,
  UpdateTelegramFeatureSettingRequest,
  getUpdateTelegramFeatureSettingSchema,
} from "@/app/lib/telegram/definitions"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Item, ItemActions, ItemContent } from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { BotConnectionsCard } from "./telegram-bot-connections"
import { DestinationsCard } from "./telegram-destinations"
import {
  CreateTelegramScheduleDialog,
  UpdateTelegramScheduleDialog,
} from "./telegram-schedule-form"
import {
  ActionConfirmDialog,
  AccessLimitedRow,
  getDestinationLabel,
  ReadinessBadge,
  SectionHeader,
  StatusBadge,
} from "./telegram-configuration-shared"

type RouteDefinition = {
  featureKey: TelegramFeatureKey
  label: string
  description: string
}

type FeatureRouteView = RouteDefinition & {
  setting?: TelegramFeatureSettingResponse
}

const DEFAULT_FEATURE_LANGUAGE_VALUE = "__default__"

function getRouteDefinitions(dictionary: Dictionary): RouteDefinition[] {
  const routes = dictionary.telegram.routeDefinitions

  return [
    {
      featureKey: "ECONOMIC_CALENDAR_ALERT",
      label: routes.ECONOMIC_CALENDAR_ALERT.label,
      description: routes.ECONOMIC_CALENDAR_ALERT.description,
    },
    {
      featureKey: "MARKET_NEWS_ALERT",
      label: routes.MARKET_NEWS_ALERT.label,
      description: routes.MARKET_NEWS_ALERT.description,
    },
  ]
}

export function TelegramConfigurationPage({
  data,
}: {
  data: TelegramConfigurationData
}) {
  const { dictionary } = useLocalization()
  const featureSettings = data.currentWorkspace
    ? data.featureSettings.filter(
        (setting) => setting.workspaceId === data.currentWorkspace?.id
      )
    : []
  const schedules = data.schedules
  const routes = getRouteDefinitions(dictionary).map((route) => ({
    ...route,
    setting: featureSettings.find(
      (setting) => setting.featureKey === route.featureKey
    ),
  }))
  const activeBotConnections = data.botConnections.filter(
    (connection) => connection.status === "ACTIVE"
  )
  const activeDestinations = data.destinations.filter(
    (destination) => destination.status === "ACTIVE"
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <ReadinessSummary
        data={data}
        routes={routes}
        schedules={schedules}
        activeBotCount={activeBotConnections.length}
        activeDestinationCount={activeDestinations.length}
      />
      <section
        className="flex min-w-0 flex-col gap-4"
        aria-labelledby="telegram-infrastructure"
      >
        <SectionHeader
          id="telegram-infrastructure"
          title={dictionary.telegram.infrastructureTitle}
          description={dictionary.telegram.infrastructureDescription}
        />
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <BotConnectionsCard
            botConnections={data.botConnections}
            canRead={data.sectionAccess.botConnections}
            canManage={data.manageAccess.botConnections}
          />
          <DestinationsCard
            destinations={data.destinations}
            activeBotConnections={activeBotConnections}
            canRead={data.sectionAccess.destinations}
            canReadBotConnections={data.sectionAccess.botConnections}
            canManage={data.manageAccess.destinations}
          />
        </div>
      </section>
      <FeatureRoutingSection
        routes={routes}
        activeDestinations={activeDestinations}
        currentWorkspace={data.currentWorkspace}
        languages={data.languages}
        languageCatalogError={data.languageCatalogError}
        canReadFeatureSettings={data.sectionAccess.featureSettings}
        canUpdateFeatureSettings={data.manageAccess.featureSettings}
      />
      <MarketAnalysisSchedulePanel
        schedules={schedules}
        activeDestinations={activeDestinations}
        currentWorkspace={data.currentWorkspace}
        watchlistAssets={data.watchlistAssets}
        languages={data.languages}
        languageCatalogError={data.languageCatalogError}
        scheduleLoadError={data.scheduleLoadError}
        canReadSchedules={data.sectionAccess.schedules}
        scheduleActions={data.scheduleActions}
      />
    </div>
  )
}

export function TelegramConfigurationSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, cardIndex) => (
          <Card key={cardIndex} className="min-w-0">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <CardAction>
                <Skeleton className="h-9 w-28" />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((__, itemIndex) => (
                <Item key={itemIndex} variant="outline" className="items-start">
                  <ItemContent className="min-w-0 gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-4 w-32" />
                  </ItemContent>
                  <ItemActions
                    className={cn(
                      "ms-auto self-start",
                      cardIndex === 1 && "basis-full justify-end sm:basis-auto"
                    )}
                  >
                    {cardIndex === 1 ? <Skeleton className="h-8 w-24" /> : null}
                    <Skeleton className="size-8" />
                  </ItemActions>
                </Item>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <AppListTable className="mt-0">
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead>
                <Skeleton className="h-4 w-24" />
              </AppListTableHead>
              <AppListTableHead>
                <Skeleton className="h-4 w-28" />
              </AppListTableHead>
              <AppListTableHead>
                <Skeleton className="h-4 w-20" />
              </AppListTableHead>
              <AppListTableHead>
                <Skeleton className="h-4 w-16" />
              </AppListTableHead>
              <AppListTableHead>
                <Skeleton className="h-4 w-24" />
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 2 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <Skeleton className="h-5 w-44" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="mx-auto h-5 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <AppListTable className="mt-0 md:hidden">
          {Array.from({ length: 2 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b p-4 last:border-b-0"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-5 w-36 max-w-full" />
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-32 max-w-full" />
              </div>
              <Skeleton className="size-8" />
            </div>
          ))}
        </AppListTable>
        <AppListTable className="mt-0 hidden md:block">
          <Table>
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead>
                  <Skeleton className="h-4 w-24" />
                </AppListTableHead>
                <AppListTableHead>
                  <Skeleton className="h-4 w-24" />
                </AppListTableHead>
                <AppListTableHead className="w-20 text-right">
                  <Skeleton className="ms-auto h-4 w-16" />
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 2 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell>
                    <Skeleton className="h-5 w-48 max-w-full" />
                    <Skeleton className="mt-1 h-4 w-40 max-w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-44 max-w-full" />
                    <Skeleton className="mt-1 h-4 w-36 max-w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ms-auto size-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppListTable>
      </div>
    </div>
  )
}

function ReadinessSummary({
  data,
  routes,
  schedules,
  activeBotCount,
  activeDestinationCount,
}: {
  data: TelegramConfigurationData
  routes: FeatureRouteView[]
  schedules: TelegramMarketAnalysisScheduleResponse[]
  activeBotCount: number
  activeDestinationCount: number
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.telegram
  const formatCount = (value: number) => formatNumber(value)
  const configuredRoutes = routes.filter(
    (route) => route.setting?.destination && route.setting.enabled
  ).length
  const activeSchedules = schedules.filter(
    (schedule) => schedule.status === "ACTIVE"
  ).length
  const readinessItems = [
    {
      label: t.readiness.bot,
      description: data.sectionAccess.botConnections
        ? formatMessage(t.readiness.activeBots, {
            count: formatCount(activeBotCount),
          })
        : t.readiness.noBotPermission,
      state: activeBotCount > 0 ? t.readiness.ready : t.readiness.needsConfig,
      status: activeBotCount > 0 ? ("ready" as const) : ("attention" as const),
      icon: Bot,
    },
    {
      label: t.readiness.destinations,
      description: data.sectionAccess.destinations
        ? formatMessage(t.readiness.activeDestinations, {
            count: formatCount(activeDestinationCount),
          })
        : t.readiness.noDestinationPermission,
      state:
        activeDestinationCount > 0 ? t.readiness.ready : t.readiness.needsLink,
      status:
        activeDestinationCount > 0
          ? ("ready" as const)
          : ("attention" as const),
      icon: MessageCircle,
    },
    {
      label: t.readiness.routing,
      description: data.currentWorkspace
        ? formatMessage(t.readiness.configuredRoutes, {
            configured: formatCount(configuredRoutes),
            total: formatCount(routes.length),
            workspace: data.currentWorkspace.name,
          })
        : t.readiness.noWorkspace,
      state:
        configuredRoutes > 0
          ? t.readiness.routesEnabled
          : t.readiness.needsReview,
      status:
        configuredRoutes > 0 ? ("ready" as const) : ("attention" as const),
      icon: RadioTower,
    },
    {
      label: t.readiness.scheduledAnalysis,
      description: data.sectionAccess.schedules
        ? formatMessage(t.readiness.activeSchedules, {
            count: formatCount(activeSchedules),
          })
        : t.readiness.noSchedulePermission,
      state: activeSchedules > 0 ? t.readiness.ready : t.readiness.noSchedules,
      status: activeSchedules > 0 ? ("ready" as const) : ("attention" as const),
      icon: CalendarClock,
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {readinessItems.map((item) => {
        const Icon = item.icon

        return (
          <Card key={item.label} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
              <CardAction>
                <ReadinessBadge status={item.status}>
                  {item.state}
                </ReadinessBadge>
              </CardAction>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

function FeatureRoutingSection({
  routes,
  activeDestinations,
  currentWorkspace,
  languages,
  languageCatalogError,
  canReadFeatureSettings,
  canUpdateFeatureSettings,
}: {
  routes: FeatureRouteView[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  canReadFeatureSettings: boolean
  canUpdateFeatureSettings: boolean
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.telegram

  return (
    <section className="flex flex-col gap-4" aria-labelledby="telegram-routing">
      <SectionHeader
        id="telegram-routing"
        title={t.routing.sectionTitle}
        description={t.routing.sectionDescription}
      />
      <AppListTable className="mt-0">
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[32%]">
                {t.routing.featureColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {t.routing.workspaceColumn}
              </AppListTableHead>
              <AppListTableHead className="w-52">
                {t.routing.destinationColumn}
              </AppListTableHead>
              <AppListTableHead className="w-64">
                {t.routing.languageColumn}
              </AppListTableHead>
              <AppListTableHead className="w-32 text-center">
                {t.routing.enabledColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {!canReadFeatureSettings ? (
              <AccessLimitedRow colSpan={5} title={t.routing.accessLimited} />
            ) : (
              routes.map((route) => (
                <TableRow
                  key={route.featureKey}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top whitespace-normal">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {route.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {route.description}
                      </span>
                      <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                        {route.featureKey}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {currentWorkspace?.name ?? t.routing.noWorkspaceSelected}
                  </TableCell>
                  <FeatureRouteControls
                    key={`${route.featureKey}:${route.setting?.destination?.id ?? "none"}:${route.setting?.outputLanguage?.isoCode ?? "default"}`}
                    route={route}
                    activeDestinations={activeDestinations}
                    currentWorkspaceId={currentWorkspace?.id}
                    canUpdate={canUpdateFeatureSettings}
                    languages={languages}
                    languageCatalogError={languageCatalogError}
                  />
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AppListTable>
    </section>
  )
}

function MarketAnalysisSchedulePanel({
  schedules,
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  languages,
  languageCatalogError,
  scheduleLoadError,
  canReadSchedules,
  scheduleActions,
}: {
  schedules: TelegramMarketAnalysisScheduleResponse[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  scheduleLoadError: boolean
  canReadSchedules: boolean
  scheduleActions: TelegramConfigurationData["scheduleActions"]
}) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const operationalSchedules = schedules.filter(
    (schedule) => schedule.status !== "REMOVED"
  )
  const hasScheduleActions = Object.values(scheduleActions).some(Boolean)

  const renderDesktopState = () => {
    if (!canReadSchedules) {
      return <AccessLimitedRow colSpan={3} title={t.schedule.accessLimited} />
    }

    if (scheduleLoadError) {
      return (
        <AppListTableEmptyState colSpan={3}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>{t.schedule.loadError}</EmptyTitle>
            <EmptyDescription>
              {t.schedule.loadErrorDescription}
            </EmptyDescription>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.refresh()}
            >
              {t.schedule.retry}
            </Button>
          </EmptyHeader>
        </AppListTableEmptyState>
      )
    }

    if (operationalSchedules.length === 0) {
      return (
        <AppListTableEmptyState colSpan={3}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>{t.schedule.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.schedule.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </AppListTableEmptyState>
      )
    }

    return operationalSchedules.map((schedule) => (
      <TableRow key={schedule.id} className="border-border hover:bg-muted/50">
        <TableCell className="align-top whitespace-normal">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{schedule.name}</span>
            {schedule.status === "DISABLED" ? (
              <StatusBadge status={schedule.status} />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatScheduledAsset(schedule)} · {schedule.workspaceName}
          </p>
        </TableCell>
        <TableCell className="align-top text-sm whitespace-normal text-muted-foreground">
          <div className="flex min-w-0 flex-col gap-1">
            <span>
              {schedule.localTimes.join(", ")} · {schedule.timezone}
            </span>
            <span>
              {schedule.destination
                ? getDestinationLabel(schedule.destination, dictionary)
                : t.schedule.noDestination}
              {" · "}
              {schedule.outputLanguage?.name ??
                schedule.outputLanguage?.isoCode ??
                t.schedule.defaultLanguage}
            </span>
          </div>
        </TableCell>
        <TableCell className="align-top">
          <ScheduleActionButtons
            schedule={schedule}
            scheduleActions={scheduleActions}
            activeDestinations={activeDestinations}
            currentWorkspace={currentWorkspace}
            watchlistAssets={watchlistAssets}
            languages={languages}
            languageCatalogError={languageCatalogError}
            layout="desktop"
          />
        </TableCell>
      </TableRow>
    ))
  }

  const renderMobileState = () => {
    if (!canReadSchedules) {
      return (
        <p role="status" className="p-4 text-sm text-muted-foreground">
          {t.schedule.accessLimited}
        </p>
      )
    }

    if (scheduleLoadError) {
      return (
        <div className="flex flex-col items-start gap-3 p-4">
          <div>
            <p role="alert" className="font-medium">
              {t.schedule.loadError}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.schedule.loadErrorDescription}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
          >
            {t.schedule.retry}
          </Button>
        </div>
      )
    }

    if (operationalSchedules.length === 0) {
      return (
        <div className="p-4">
          <p className="font-medium">{t.schedule.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.schedule.emptyDescription}
          </p>
        </div>
      )
    }

    return operationalSchedules.map((schedule) => (
      <article
        key={schedule.id}
        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b p-4 last:border-b-0"
      >
        <div className="min-w-0 break-words">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{schedule.name}</span>
            {schedule.status === "DISABLED" ? (
              <StatusBadge status={schedule.status} />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatScheduledAsset(schedule)} · {schedule.workspaceName}
          </p>
          <div className="mt-2 flex min-w-0 flex-col gap-1 text-sm text-muted-foreground">
            <span>
              {schedule.localTimes.join(", ")} · {schedule.timezone}
            </span>
            <span>
              {schedule.destination
                ? getDestinationLabel(schedule.destination, dictionary)
                : t.schedule.noDestination}
              {" · "}
              {schedule.outputLanguage?.name ??
                schedule.outputLanguage?.isoCode ??
                t.schedule.defaultLanguage}
            </span>
          </div>
        </div>
        <ScheduleActionButtons
          schedule={schedule}
          scheduleActions={scheduleActions}
          activeDestinations={activeDestinations}
          currentWorkspace={currentWorkspace}
          watchlistAssets={watchlistAssets}
          languages={languages}
          languageCatalogError={languageCatalogError}
          layout="mobile"
        />
      </article>
    ))
  }

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="telegram-schedule-heading"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="telegram-schedule-heading"
            className="text-lg font-semibold text-foreground"
          >
            {t.schedule.panelTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.schedule.panelDescription}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 md:ms-auto md:items-end">
          {scheduleActions.create ? (
            <CreateTelegramScheduleDialog
              activeDestinations={activeDestinations}
              currentWorkspace={currentWorkspace}
              watchlistAssets={watchlistAssets}
              languages={languages}
              languageCatalogError={languageCatalogError}
              canCreate={scheduleActions.create}
            />
          ) : !hasScheduleActions ? (
            <span className="text-sm text-muted-foreground">
              {t.schedule.readOnlyDescription}
            </span>
          ) : null}
        </div>
      </div>
      <AppListTable className="mt-0 md:hidden">
        {renderMobileState()}
      </AppListTable>
      <AppListTable className="mt-0 hidden md:block">
        <Table className="w-full table-fixed">
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-1/2">
                {t.schedule.scheduleColumn}
              </AppListTableHead>
              <AppListTableHead>{t.schedule.deliveryColumn}</AppListTableHead>
              <AppListTableHead className="w-20 text-right">
                {t.common.actions}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>{renderDesktopState()}</TableBody>
        </Table>
      </AppListTable>
    </section>
  )
}

function ScheduleActionButtons({
  schedule,
  scheduleActions,
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  languages,
  languageCatalogError,
  layout,
}: {
  schedule: TelegramMarketAnalysisScheduleResponse
  scheduleActions: TelegramConfigurationData["scheduleActions"]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  layout: "mobile" | "desktop"
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const deleteTriggerId =
    "telegram-schedule-delete-" + schedule.id + "-" + layout

  return (
    <div
      className={
        layout === "mobile"
          ? "flex shrink-0 items-start gap-2"
          : "flex flex-wrap justify-end gap-1"
      }
    >
      {scheduleActions.update && schedule.status === "ACTIVE" ? (
        <UpdateTelegramScheduleDialog
          schedule={schedule}
          activeDestinations={activeDestinations}
          watchlistAssets={watchlistAssets}
          languages={languages}
          languageCatalogError={languageCatalogError}
          assetEditable={currentWorkspace?.id === schedule.workspaceId}
          canUpdate={scheduleActions.update}
        />
      ) : null}
      {scheduleActions.delete ? (
        <ActionConfirmDialog
          title={t.schedule.deleteTitle}
          description={t.schedule.deleteDescription}
          actionLabel={t.schedule.deleteAction}
          triggerLabel={t.schedule.deleteTrigger}
          restoreFocusId={deleteTriggerId}
          trigger={
            <Button
              id={deleteTriggerId}
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={t.schedule.deleteTrigger}
            >
              <Trash2 data-icon="inline-start" />
            </Button>
          }
          action={() => deleteTelegramMarketAnalysisSchedule(schedule.id)}
          successMessage={t.schedule.deleteSuccess}
        />
      ) : null}
    </div>
  )
}

function FeatureRouteControls({
  route,
  activeDestinations,
  currentWorkspaceId,
  canUpdate,
  languages,
  languageCatalogError,
}: {
  route: FeatureRouteView
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspaceId?: number
  canUpdate: boolean
  languages: LanguageResponse[]
  languageCatalogError: boolean
}) {
  const router = useRouter()
  const persistedDestinationId = route.setting?.destination?.id.toString() ?? ""
  const persistedLanguageIsoCode = route.setting?.outputLanguage?.isoCode ?? ""
  const [destinationId, setDestinationId] = useState(persistedDestinationId)
  const [outputLanguageIsoCode, setOutputLanguageIsoCode] = useState(
    persistedLanguageIsoCode
  )
  const [isPending, startTransition] = useTransition()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const routeSupportsLanguage = route.featureKey !== "SCHEDULED_MARKET_ANALYSIS"
  const hasDestination = activeDestinations.some(
    (destination) => destination.id.toString() === destinationId
  )
  const destinationControlDisabled =
    !canUpdate || !currentWorkspaceId || isPending
  const controlsDisabled =
    !canUpdate || !currentWorkspaceId || !hasDestination || isPending

  function updateRoute(
    overrides: Partial<UpdateTelegramFeatureSettingRequest>,
    successMessage: string
  ) {
    const nextDestinationId =
      overrides.destinationId?.toString() ?? destinationId

    if (!currentWorkspaceId || !nextDestinationId) return

    const request = getUpdateTelegramFeatureSettingSchema().safeParse({
      featureKey: route.featureKey,
      workspaceId: currentWorkspaceId,
      destinationId: Number(nextDestinationId),
      enabled: route.setting?.enabled ?? false,
      outputLanguageIsoCode: outputLanguageIsoCode || undefined,
      ...overrides,
    })

    if (!request.success) {
      toast.error(t.routing.updateError)
      return
    }

    startTransition(async () => {
      const result = await updateTelegramFeatureSetting(request.data)

      if (result.success) {
        toast.success(successMessage)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDestinationChange(value: string | null) {
    if (value === null) return

    setDestinationId(value)
    updateRoute(
      { destinationId: Number(value) },
      t.routing.destinationUpdateSuccess
    )
  }

  function handleLanguageChange(value: string | null) {
    if (value === null || !routeSupportsLanguage) return

    const nextLanguage = value === DEFAULT_FEATURE_LANGUAGE_VALUE ? "" : value
    setOutputLanguageIsoCode(nextLanguage)
    updateRoute(
      { outputLanguageIsoCode: nextLanguage || undefined },
      nextLanguage
        ? t.routing.languageUpdateSuccess
        : t.routing.languageClearSuccess
    )
  }

  function handleCheckedChange(enabled: boolean) {
    updateRoute(
      { enabled },
      enabled ? t.routing.enabledSuccess : t.routing.disabledSuccess
    )
  }

  const languageOptions = languages.filter(isSelectableLanguage)
  const currentOutputLanguage = route.setting?.outputLanguage
  const hasCurrentLanguageInCatalog = currentOutputLanguage?.isoCode
    ? languages.some(
        (language) => language.isoCode === currentOutputLanguage.isoCode
      )
    : true

  if (
    currentOutputLanguage &&
    isSelectableLanguage(currentOutputLanguage) &&
    !hasCurrentLanguageInCatalog
  ) {
    languageOptions.unshift(currentOutputLanguage)
  }

  const languageItems = [
    {
      value: DEFAULT_FEATURE_LANGUAGE_VALUE,
      label: t.routing.defaultLanguage,
    },
    ...languageOptions.map((language) => ({
      value: language.isoCode,
      label: `${language.name || language.isoCode} (${language.isoCode})${
        !hasCurrentLanguageInCatalog &&
        language.isoCode === currentOutputLanguage?.isoCode
          ? ` — ${t.routing.languageUnavailable}`
          : ""
      }`,
    })),
  ]

  const languageDescriptionId = `telegram-route-${route.featureKey}-language-description`
  const languageDescription = languageCatalogError
    ? t.routing.languageCatalogError
    : !hasDestination
      ? t.routing.languageDestinationRequired
      : null

  return (
    <>
      <TableCell className="align-top whitespace-normal">
        {activeDestinations.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            {t.destination.noActiveDestination}
          </span>
        ) : (
          <Select
            items={activeDestinations.map((destination) => ({
              value: destination.id.toString(),
              label: getDestinationLabel(destination, dictionary),
            }))}
            value={destinationId || null}
            onValueChange={handleDestinationChange}
            disabled={destinationControlDisabled}
          >
            <SelectTrigger aria-label={route.label} className="w-full">
              <SelectValue placeholder={t.destination.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {activeDestinations.map((destination) => (
                  <SelectItem
                    key={destination.id}
                    value={destination.id.toString()}
                  >
                    {getDestinationLabel(destination, dictionary)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        {routeSupportsLanguage ? (
          <div className="flex min-w-0 flex-col gap-1">
            <Select
              items={languageItems}
              value={outputLanguageIsoCode || DEFAULT_FEATURE_LANGUAGE_VALUE}
              onValueChange={handleLanguageChange}
              disabled={
                controlsDisabled ||
                languageCatalogError ||
                !routeSupportsLanguage
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={formatMessage(t.routing.languageAria, {
                  route: route.label,
                })}
                aria-describedby={
                  languageDescription ? languageDescriptionId : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={DEFAULT_FEATURE_LANGUAGE_VALUE}>
                    {t.routing.defaultLanguage}
                  </SelectItem>
                  {languageOptions.map((language) => (
                    <SelectItem key={language.isoCode} value={language.isoCode}>
                      {language.name || language.isoCode} ({language.isoCode})
                      {!hasCurrentLanguageInCatalog &&
                      language.isoCode === currentOutputLanguage?.isoCode
                        ? ` — ${t.routing.languageUnavailable}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {languageDescription ? (
              <span
                id={languageDescriptionId}
                className="text-xs text-muted-foreground"
                role="status"
              >
                {languageDescription}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t.routing.languageNotApplicable}
          </span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <div
          className="mx-auto inline-flex h-8 w-32 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs data-[disabled=true]:opacity-60"
          data-disabled={controlsDisabled ? true : undefined}
        >
          <span
            className={cn(
              "min-w-14 text-left text-xs font-medium",
              route.setting?.enabled
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {route.setting?.enabled ? t.common.enabled : t.common.paused}
          </span>
          <Switch
            checked={Boolean(route.setting?.enabled)}
            disabled={controlsDisabled}
            onCheckedChange={handleCheckedChange}
            aria-label={formatMessage(t.routing.switchAria, {
              route: route.label,
            })}
          />
        </div>
      </TableCell>
    </>
  )
}

function formatScheduledAsset(
  schedule: TelegramMarketAnalysisScheduleResponse
) {
  const asset = schedule.asset

  return (
    [asset.assetSymbol, asset.assetName].filter(Boolean).join(" — ") ||
    String(asset.assetId)
  )
}
