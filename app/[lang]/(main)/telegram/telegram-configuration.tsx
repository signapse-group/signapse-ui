"use client"

import { useEffect, useId, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  CalendarClock,
  MessageCircle,
  RadioTower,
  Trash2,
  X,
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
  TelegramBotConnectionResponse,
  TelegramConfigurationData,
  TelegramDestinationResponse,
  TelegramFeatureKey,
  TelegramFeatureSettingResponse,
  TelegramMarketAnalysisScheduleResponse,
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
  SectionReadError,
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
  readbackUnverified?: boolean
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

function isCompleteMarketNewsSetting(setting: TelegramFeatureSettingResponse) {
  return (
    setting.featureKey === "MARKET_NEWS_ALERT" &&
    typeof setting.workspaceId === "number" &&
    typeof setting.enabled === "boolean"
  )
}

export function TelegramConfigurationPage({
  data,
  canCreateBotConnections = false,
}: {
  data: TelegramConfigurationData
  canCreateBotConnections?: boolean
}) {
  const { dictionary } = useLocalization()
  const featureSettings = data.currentWorkspace
    ? data.featureSettings.filter(
        (setting) => setting.workspaceId === data.currentWorkspace?.id
      )
    : data.sectionAccess.marketNewsRouting
      ? data.featureSettings.filter(
          (setting) => setting.featureKey === "MARKET_NEWS_ALERT"
        )
      : []
  const hasUnidentifiedMarketNewsSetting =
    data.sectionAccess.marketNewsRouting &&
    data.featureSettings.some((setting) => {
      const mayBelongToCurrentWorkspace =
        !data.currentWorkspace ||
        setting.workspaceId == null ||
        setting.workspaceId === data.currentWorkspace.id

      return (
        mayBelongToCurrentWorkspace &&
        (setting.featureKey === undefined ||
          (data.currentWorkspace != null &&
            setting.featureKey === "MARKET_NEWS_ALERT" &&
            setting.workspaceId == null))
      )
    })
  const schedules = data.schedules
  const canShowSchedulePanel =
    data.sectionAccess.schedules ||
    data.scheduleActions.create ||
    data.scheduleActions.update ||
    data.scheduleActions.delete
  const routes = getRouteDefinitions(dictionary)
    .filter((route) =>
      route.featureKey === "MARKET_NEWS_ALERT"
        ? data.sectionAccess.marketNewsRouting
        : data.sectionAccess.featureSettings
    )
    .map((route) => ({
      ...route,
      setting: featureSettings.find(
        (setting) => setting.featureKey === route.featureKey
      ),
    }))
  const marketNewsRoute = routes.find(
    (route) => route.featureKey === "MARKET_NEWS_ALERT"
  )
  const marketNewsSettings = featureSettings.filter(
    (setting) => setting.featureKey === "MARKET_NEWS_ALERT"
  )
  const marketNewsRoutes: FeatureRouteView[] = marketNewsRoute
    ? marketNewsSettings.map((setting) => ({
        ...marketNewsRoute,
        setting,
        readbackUnverified: !isCompleteMarketNewsSetting(setting),
      }))
    : []

  if (marketNewsRoute && hasUnidentifiedMarketNewsSetting) {
    marketNewsRoutes.push({
      ...marketNewsRoute,
      setting: undefined,
      readbackUnverified: true,
    })
  } else if (marketNewsRoute && marketNewsRoutes.length === 0) {
    marketNewsRoutes.push(marketNewsRoute)
  }
  const visibleRoutes: FeatureRouteView[] = [
    ...marketNewsRoutes,
    ...routes.filter((route) => route.featureKey !== "MARKET_NEWS_ALERT"),
  ]
  const activeBotConnections = data.botConnections.filter(
    (connection): connection is TelegramBotConnectionResponse =>
      connection.status === "ACTIVE" && connection.id !== undefined
  )
  const activeDestinations = data.destinations.filter(
    (destination) => destination.status === "ACTIVE"
  )

  return (
    <div className="grid w-full min-w-0 gap-6 min-[1440px]:grid-cols-[minmax(0,1.5fr)_minmax(22rem,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <FeatureRoutingSection
          routes={visibleRoutes}
          activeDestinations={activeDestinations}
          languages={data.languages}
          languageCatalogError={data.languageCatalogError}
          canUpdateFeatureSettings={data.manageAccess.featureSettings}
          canUpdateMarketNewsRouting={data.manageAccess.marketNewsRouting}
          canReadDestinations={data.sectionAccess.destinations}
          currentWorkspace={data.currentWorkspace}
          loadError={
            data.featureSettingsLoadError || data.currentWorkspaceLoadError
          }
        />
        {canShowSchedulePanel ? (
          <MarketAnalysisSchedulePanel
            schedules={schedules}
            activeDestinations={activeDestinations}
            currentWorkspace={data.currentWorkspace}
            watchlistAssets={data.watchlistAssets}
            watchlistAssetsAvailable={
              data.sectionAccess.watchlistAssets &&
              !data.watchlistAssetsLoadError
            }
            languages={data.languages}
            languageCatalogError={data.languageCatalogError}
            scheduleLoadError={data.scheduleLoadError}
            optionsLoadError={
              data.destinationsLoadError ||
              data.currentWorkspaceLoadError ||
              data.watchlistAssetsLoadError
            }
            canReadSchedules={data.sectionAccess.schedules}
            scheduleActions={data.scheduleActions}
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <section
          className="flex min-w-0 flex-col gap-4"
          aria-labelledby="telegram-infrastructure"
        >
          <SectionHeader
            id="telegram-infrastructure"
            title={dictionary.telegram.infrastructureTitle}
            description={dictionary.telegram.infrastructureDescription}
          />
          <div className="grid min-w-0 gap-4">
            <BotConnectionsCard
              botConnections={data.botConnections}
              canRead={data.sectionAccess.botConnections}
              canManage={data.manageAccess.botConnections}
              canCreate={canCreateBotConnections}
              canDelete={data.manageAccess.botConnectionsDelete}
              loadError={data.botConnectionsLoadError}
            />
            <DestinationsCard
              destinations={data.destinations}
              activeBotConnections={activeBotConnections}
              canRead={data.sectionAccess.destinations}
              canReadBotConnections={data.sectionAccess.botConnections}
              canManage={data.manageAccess.destinations}
              loadError={data.destinationsLoadError}
              botConnectionsLoadError={data.botConnectionsLoadError}
            />
          </div>
        </section>
        <ReadinessSummary
          data={data}
          routes={visibleRoutes}
          schedules={schedules}
          activeBotCount={activeBotConnections.length}
          activeDestinationCount={activeDestinations.length}
        />
      </div>
    </div>
  )
}

export function TelegramConfigurationSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-6 min-[1440px]:grid-cols-[minmax(0,1.5fr)_minmax(22rem,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,1fr)]">
      <div className="order-2 flex min-w-0 flex-col gap-6">
        <div className="grid min-w-0 gap-4">
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
                  <Item
                    key={itemIndex}
                    variant="outline"
                    className="items-start"
                  >
                    <ItemContent className="min-w-0 gap-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-56 max-w-full" />
                      <Skeleton className="h-4 w-32" />
                    </ItemContent>
                    <ItemActions
                      className={cn(
                        "ms-auto self-start",
                        cardIndex === 1 &&
                          "basis-full justify-end sm:basis-auto"
                      )}
                    >
                      {cardIndex === 1 ? (
                        <Skeleton className="h-8 w-24" />
                      ) : null}
                      <Skeleton className="size-8" />
                    </ItemActions>
                  </Item>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-3 min-[1440px]:grid-cols-2">
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
      </div>
      <div className="order-1 flex min-w-0 flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
        </div>
        <AppListTable className="mt-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border p-4">
            <div className="min-w-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-56 max-w-full" />
              <Skeleton className="mt-2 h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-32" />
            <div className="col-span-2 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </div>
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
        <div className="flex min-w-0 flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[72rem] grid-cols-8 gap-3">
                {Array.from({ length: 8 }).map((_, columnIndex) => (
                  <Skeleton key={columnIndex} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
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
    ...(data.sectionAccess.botConnections && !data.botConnectionsLoadError
      ? [
          {
            label: t.readiness.bot,
            description: formatMessage(t.readiness.activeBots, {
              count: formatCount(activeBotCount),
            }),
            state:
              activeBotCount > 0 ? t.readiness.ready : t.readiness.needsConfig,
            status:
              activeBotCount > 0 ? ("ready" as const) : ("attention" as const),
            icon: Bot,
          },
        ]
      : []),
    ...(data.sectionAccess.destinations && !data.destinationsLoadError
      ? [
          {
            label: t.readiness.destinations,
            description: formatMessage(t.readiness.activeDestinations, {
              count: formatCount(activeDestinationCount),
            }),
            state:
              activeDestinationCount > 0
                ? t.readiness.ready
                : t.readiness.needsLink,
            status:
              activeDestinationCount > 0
                ? ("ready" as const)
                : ("attention" as const),
            icon: MessageCircle,
          },
        ]
      : []),
    ...(routes.length > 0 &&
    data.currentWorkspace &&
    !data.featureSettingsLoadError &&
    !routes.some((route) => route.readbackUnverified)
      ? [
          {
            label: t.readiness.routing,
            description: formatMessage(t.readiness.configuredRoutes, {
              configured: formatCount(configuredRoutes),
              total: formatCount(routes.length),
              workspace: data.currentWorkspace.name,
            }),
            state:
              configuredRoutes > 0
                ? t.readiness.routesEnabled
                : t.readiness.needsReview,
            status:
              configuredRoutes > 0
                ? ("ready" as const)
                : ("attention" as const),
            icon: RadioTower,
          },
        ]
      : []),
    ...(data.sectionAccess.schedules && !data.scheduleLoadError
      ? [
          {
            label: t.readiness.scheduledAnalysis,
            description: formatMessage(t.readiness.activeSchedules, {
              count: formatCount(activeSchedules),
            }),
            state:
              activeSchedules > 0 ? t.readiness.ready : t.readiness.noSchedules,
            status:
              activeSchedules > 0 ? ("ready" as const) : ("attention" as const),
            icon: CalendarClock,
          },
        ]
      : []),
  ]

  if (readinessItems.length === 0) return null

  return (
    <div
      className="grid gap-3 min-[1440px]:grid-cols-2"
      data-testid="telegram-readiness-summary"
    >
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
  canUpdateFeatureSettings,
  canUpdateMarketNewsRouting,
  canReadDestinations,
  loadError,
}: {
  routes: FeatureRouteView[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  canUpdateFeatureSettings: boolean
  canUpdateMarketNewsRouting: boolean
  canReadDestinations: boolean
  loadError: boolean
}) {
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  return (
    <section className="flex flex-col gap-4" aria-labelledby="telegram-routing">
      <SectionHeader
        id="telegram-routing"
        title={t.routing.sectionTitle}
        description={t.routing.sectionDescription}
      />
      <AppListTable className="mt-0">
        {loadError ? (
          <div className="p-4">
            <SectionReadError />
          </div>
        ) : routes.length === 0 ? (
          <Table>
            <TableBody>
              <AccessLimitedRow colSpan={1} title={t.routing.accessLimited} />
            </TableBody>
          </Table>
        ) : (
          routes.map((route, index) => {
            const isMarketNewsRoute = route.featureKey === "MARKET_NEWS_ALERT"
            const workspaceId =
              currentWorkspace?.id ?? route.setting?.workspaceId
            const workspaceLabel = route.readbackUnverified
              ? (route.setting?.workspaceName ??
                (route.setting?.workspaceId !== undefined
                  ? formatMessage(t.routing.workspaceIdFallback, {
                      id: route.setting.workspaceId,
                    })
                  : t.routing.readbackWorkspaceUnknown))
              : (route.setting?.workspaceName ??
                currentWorkspace?.name ??
                (route.setting?.workspaceId !== undefined
                  ? formatMessage(t.routing.workspaceIdFallback, {
                      id: route.setting.workspaceId,
                    })
                  : t.routing.noSavedWorkspaceSettings))
            const rowId = `${route.featureKey}-${workspaceId ?? index}`
            const titleId = `telegram-route-title-${rowId}`
            const controlRoute =
              isMarketNewsRoute && !currentWorkspace && route.setting
                ? { ...route, label: `${route.label} — ${workspaceLabel}` }
                : route

            return (
              <div
                key={rowId}
                className={cn(
                  "p-4",
                  index < routes.length - 1 && "border-b border-border"
                )}
                data-feature-key={route.featureKey}
                data-testid={
                  isMarketNewsRoute ? "market-news-routing-card" : undefined
                }
                aria-labelledby={titleId}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 id={titleId} className="font-medium text-foreground">
                      {route.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {route.description}
                    </p>
                    {isMarketNewsRoute ? (
                      <span className="mt-2 block text-xs text-muted-foreground">
                        {workspaceLabel}
                      </span>
                    ) : null}
                  </div>
                  <FeatureRouteControls
                    route={controlRoute}
                    activeDestinations={activeDestinations}
                    currentWorkspaceId={workspaceId}
                    canReadDestinations={canReadDestinations}
                    canUpdate={
                      isMarketNewsRoute
                        ? canUpdateMarketNewsRouting
                        : canUpdateFeatureSettings
                    }
                    languages={languages}
                    languageCatalogError={languageCatalogError}
                  />
                </div>
              </div>
            )
          })
        )}
      </AppListTable>
    </section>
  )
}

function MarketAnalysisSchedulePanel({
  schedules,
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  watchlistAssetsAvailable,
  languages,
  languageCatalogError,
  scheduleLoadError,
  optionsLoadError,
  canReadSchedules,
  scheduleActions,
}: {
  schedules: TelegramMarketAnalysisScheduleResponse[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  watchlistAssetsAvailable: boolean
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  scheduleLoadError: boolean
  optionsLoadError: boolean
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
              <StatusBadge
                status={schedule.status}
                label={t.schedule.inactiveStatus}
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatScheduledAsset(schedule, dictionary)} ·{" "}
            {schedule.workspaceName}
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
            watchlistAssetsAvailable={watchlistAssetsAvailable}
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
              <StatusBadge
                status={schedule.status}
                label={t.schedule.inactiveStatus}
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatScheduledAsset(schedule, dictionary)} ·{" "}
            {schedule.workspaceName}
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
          watchlistAssetsAvailable={watchlistAssetsAvailable}
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
            tabIndex={-1}
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
      {optionsLoadError ? (
        <SectionReadError message={t.schedule.optionsLoadError} />
      ) : null}
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
  watchlistAssetsAvailable,
  languages,
  languageCatalogError,
  layout,
}: {
  schedule: TelegramMarketAnalysisScheduleResponse
  scheduleActions: TelegramConfigurationData["scheduleActions"]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  watchlistAssetsAvailable: boolean
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  layout: "mobile" | "desktop"
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const deleteTriggerId =
    "telegram-schedule-delete-" + schedule.id + "-" + layout
  const otherDeleteTriggerId = `telegram-schedule-delete-${schedule.id}-${layout === "mobile" ? "desktop" : "mobile"}`

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
          assetEditable={
            watchlistAssetsAvailable &&
            currentWorkspace?.id === schedule.workspaceId
          }
          assetPreservedReason={
            !watchlistAssetsAvailable
              ? "watchlistUnavailable"
              : currentWorkspace
                ? "otherWorkspace"
                : "workspaceUnavailable"
          }
          canUpdate={scheduleActions.update}
        />
      ) : null}
      {scheduleActions.delete ? (
        <ActionConfirmDialog
          title={t.schedule.deleteTitle}
          description={t.schedule.deleteDescription}
          actionLabel={t.schedule.deleteAction}
          triggerLabel={t.schedule.deleteTrigger}
          triggerTooltip={t.schedule.deleteTrigger}
          restoreFocusId={deleteTriggerId}
          restoreFocusCandidates={[otherDeleteTriggerId]}
          successFocusId="telegram-schedule-heading"
          trigger={
            <Button
              id={deleteTriggerId}
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={t.schedule.deleteTrigger}
              aria-describedby={`${deleteTriggerId}-tooltip`}
              title={t.schedule.deleteTrigger}
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
  canReadDestinations,
  canUpdate,
  languages,
  languageCatalogError,
}: {
  route: FeatureRouteView
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspaceId?: number
  canReadDestinations: boolean
  canUpdate: boolean
  languages: LanguageResponse[]
  languageCatalogError: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const destinationFocusTarget = useRef<HTMLElement | null>(null)
  const restoreFocusAfterClear = useRef(false)
  const controlId = useId()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const isMarketNewsRoute = route.featureKey === "MARKET_NEWS_ALERT"
  const persistedDestinationId = route.setting?.destination?.id.toString() ?? ""
  const persistedLanguageIsoCode = route.setting?.outputLanguage?.isoCode ?? ""
  const [destinationId, setDestinationId] = useState(persistedDestinationId)
  const [outputLanguageIsoCode, setOutputLanguageIsoCode] = useState(
    persistedLanguageIsoCode
  )

  useEffect(() => {
    if (!restoreFocusAfterClear.current) return

    destinationFocusTarget.current?.focus()
    restoreFocusAfterClear.current = false
  }, [persistedDestinationId])

  function setDestinationFocusTarget(element: HTMLElement | null) {
    destinationFocusTarget.current = element
  }

  if (isMarketNewsRoute && route.readbackUnverified) {
    return (
      <div
        className="col-span-2 min-w-0 text-sm text-muted-foreground"
        role="status"
      >
        {t.routing.readbackUnverified}
      </div>
    )
  }
  const routeSupportsLanguage = route.featureKey !== "SCHEDULED_MARKET_ANALYSIS"
  const savedDestination = route.setting?.destination ?? null
  const selectedDestinationId = isMarketNewsRoute
    ? persistedDestinationId
    : destinationId
  const hasSelectedActiveDestination = Boolean(
    canReadDestinations &&
    activeDestinations.some(
      (destination) => destination.id.toString() === selectedDestinationId
    ) &&
    (!isMarketNewsRoute || savedDestination?.status === "ACTIVE")
  )
  const canUpdateRoute = canUpdate && Boolean(currentWorkspaceId)
  const destinationControlDisabled =
    !canUpdateRoute ||
    !canReadDestinations ||
    activeDestinations.length === 0 ||
    isPending
  const switchDisabled =
    !canUpdateRoute ||
    isPending ||
    (!hasSelectedActiveDestination &&
      (!isMarketNewsRoute || !route.setting?.enabled))
  const languageControlDisabled =
    !canUpdateRoute ||
    (!isMarketNewsRoute && !hasSelectedActiveDestination) ||
    isPending ||
    languageCatalogError
  const shouldExplainMissingDestination =
    isMarketNewsRoute &&
    canUpdateRoute &&
    !route.setting?.enabled &&
    !hasSelectedActiveDestination
  const missingDestinationDescription = canReadDestinations
    ? t.routing.enableDestinationRequired
    : t.routing.destinationReadRequired
  const switchDescription =
    isMarketNewsRoute && route.setting && !canUpdate
      ? t.routing.routeReadOnlyDescription
      : shouldExplainMissingDestination
        ? missingDestinationDescription
        : null
  const destinationItems = [
    ...(isMarketNewsRoute && savedDestination
      ? [
          {
            value: persistedDestinationId,
            label: getDestinationLabel(savedDestination, dictionary),
            disabled:
              savedDestination.status !== "ACTIVE" ||
              !canReadDestinations ||
              !activeDestinations.some(
                (destination) => destination.id === savedDestination.id
              ),
          },
        ]
      : []),
    ...activeDestinations
      .filter(
        (destination) =>
          !isMarketNewsRoute ||
          destination.id.toString() !== persistedDestinationId
      )
      .map((destination) => ({
        value: destination.id.toString(),
        label: getDestinationLabel(destination, dictionary),
        disabled: false,
      })),
  ]

  function updateRoute(
    overrides: {
      destinationId?: number | null
      enabled?: boolean
      outputLanguageIsoCode?: string | null
    },
    successMessage: string
  ) {
    if (!currentWorkspaceId) return
    if (!isMarketNewsRoute && !destinationId && overrides.destinationId == null)
      return

    const requestInput = isMarketNewsRoute
      ? {
          featureKey: route.featureKey,
          workspaceId: currentWorkspaceId,
          ...(route.setting ? {} : { enabled: false }),
          ...overrides,
        }
      : {
          featureKey: route.featureKey,
          workspaceId: currentWorkspaceId,
          destinationId: Number(
            typeof overrides.destinationId === "number"
              ? overrides.destinationId
              : destinationId
          ),
          enabled: route.setting?.enabled ?? false,
          outputLanguageIsoCode: outputLanguageIsoCode || undefined,
          ...overrides,
        }
    const request =
      getUpdateTelegramFeatureSettingSchema().safeParse(requestInput)

    if (!request.success) {
      toast.error(t.routing.updateError)
      return
    }

    startTransition(async () => {
      const result = await updateTelegramFeatureSetting(request.data)

      if (result.success) {
        if (isMarketNewsRoute && overrides.destinationId === null) {
          restoreFocusAfterClear.current = true
          destinationFocusTarget.current?.focus()
        }
        toast.success(successMessage)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDestinationChange(value: string | null) {
    if (value === null) return

    if (!isMarketNewsRoute) setDestinationId(value)
    updateRoute(
      { destinationId: Number(value) },
      t.routing.destinationUpdateSuccess
    )
  }

  function handleLanguageChange(value: string | null) {
    if (value === null || !routeSupportsLanguage) return

    const nextLanguage = value === DEFAULT_FEATURE_LANGUAGE_VALUE ? "" : value
    if (!isMarketNewsRoute) setOutputLanguageIsoCode(nextLanguage)
    updateRoute(
      {
        outputLanguageIsoCode: isMarketNewsRoute
          ? nextLanguage || null
          : nextLanguage || undefined,
      },
      nextLanguage
        ? t.routing.languageUpdateSuccess
        : t.routing.languageClearSuccess
    )
  }

  function handleCheckedChange(enabled: boolean) {
    if (enabled && !hasSelectedActiveDestination) {
      toast.error(t.routing.enableDestinationRequired)
      return
    }

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

  const languageDescriptionId = `telegram-route-language-description-${controlId}`
  const languageDescription = languageCatalogError
    ? t.routing.languageCatalogError
    : !isMarketNewsRoute && !hasSelectedActiveDestination
      ? t.routing.languageDestinationRequired
      : null
  const switchDescriptionId = `telegram-route-switch-description-${controlId}`
  const destinationControl =
    !savedDestination && activeDestinations.length === 0 ? (
      <span
        ref={setDestinationFocusTarget}
        className="text-sm text-muted-foreground"
        role="status"
        tabIndex={-1}
      >
        {t.destination.noActiveDestination}
      </span>
    ) : (
      <div className="relative">
        <Select
          items={destinationItems}
          value={selectedDestinationId || null}
          onValueChange={handleDestinationChange}
          disabled={destinationControlDisabled}
        >
          <SelectTrigger
            ref={setDestinationFocusTarget}
            aria-label={formatMessage(t.routing.destinationSelectorAria, {
              route: route.label,
            })}
            className={cn(
              "w-full",
              isMarketNewsRoute && savedDestination && "pe-10"
            )}
          >
            <SelectValue placeholder={t.destination.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {destinationItems.map((destination) => (
                <SelectItem
                  key={destination.value}
                  value={destination.value}
                  disabled={destination.disabled}
                >
                  {destination.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isMarketNewsRoute && savedDestination ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-0 top-1/2 z-10 -translate-y-1/2"
            aria-label={formatMessage(t.routing.destinationClearAria, {
              route: route.label,
            })}
            disabled={!canUpdateRoute || isPending}
            onClick={() =>
              updateRoute(
                { destinationId: null, enabled: false },
                t.routing.destinationClearSuccess
              )
            }
          >
            <X data-icon="inline-start" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    )
  const languageControl = routeSupportsLanguage ? (
    <div className="flex min-w-0 flex-col gap-1">
      <Select
        items={languageItems}
        value={
          (isMarketNewsRoute
            ? persistedLanguageIsoCode
            : outputLanguageIsoCode) || DEFAULT_FEATURE_LANGUAGE_VALUE
        }
        onValueChange={handleLanguageChange}
        disabled={languageControlDisabled}
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
  )
  const switchControl = (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "ms-auto inline-flex h-8 w-32 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs data-[disabled=true]:opacity-60"
        )}
        data-disabled={switchDisabled ? true : undefined}
      >
        <span
          className={cn(
            "min-w-14 text-left text-xs font-medium",
            route.setting?.enabled ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {route.setting?.enabled ? t.common.enabled : t.common.paused}
        </span>
        <Switch
          checked={Boolean(route.setting?.enabled)}
          disabled={switchDisabled}
          onCheckedChange={handleCheckedChange}
          aria-label={formatMessage(t.routing.switchAria, {
            route: route.label,
          })}
          aria-describedby={switchDescription ? switchDescriptionId : undefined}
        />
      </div>
      {switchDescription ? (
        <span
          id={switchDescriptionId}
          className="max-w-32 text-center text-xs text-muted-foreground"
          role="status"
        >
          {switchDescription}
        </span>
      ) : null}
    </div>
  )

  return (
    <div className="contents">
      <div className="col-start-2 row-start-1 justify-self-end">
        {switchControl}
      </div>
      <div className="col-span-2 grid gap-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t.routing.destinationColumn}
          </span>
          {destinationControl}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t.routing.languageColumn}
          </span>
          {languageControl}
        </div>
      </div>
    </div>
  )
}

function formatScheduledAsset(
  schedule: TelegramMarketAnalysisScheduleResponse,
  dictionary: Dictionary
) {
  const asset = schedule.asset

  if (!asset) return dictionary.telegram.schedule.noAsset

  return (
    [asset.assetSymbol, asset.assetName].filter(Boolean).join(" — ") ||
    String(asset.assetId)
  )
}
