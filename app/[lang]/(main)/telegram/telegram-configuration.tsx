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
  loadError?: boolean
  readbackUnverified?: boolean
}

const DEFAULT_FEATURE_LANGUAGE_VALUE = "__default__"
const TELEGRAM_CONFIGURATION_LAYOUT_CLASS =
  "grid w-full min-w-0 gap-6 min-[1440px]:grid-cols-[minmax(0,1.5fr)_minmax(22rem,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,1fr)]"

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

function isCompleteEconomicCalendarSetting(
  setting: TelegramFeatureSettingResponse,
  workspaceId: number
) {
  return (
    setting.featureKey === "ECONOMIC_CALENDAR_ALERT" &&
    setting.workspaceId === workspaceId &&
    typeof setting.id === "number" &&
    typeof setting.enabled === "boolean" &&
    (setting.outputLanguage === null ||
      Boolean(setting.outputLanguage?.isoCode?.trim())) &&
    !(setting.enabled && setting.destination === null)
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
  const economicCalendarRoute = getRouteDefinitions(dictionary).find(
    (route) => route.featureKey === "ECONOMIC_CALENDAR_ALERT"
  )
  const economicCalendarSettings = data.economicCalendarSettings.filter(
    (setting) =>
      setting.featureKey === "ECONOMIC_CALENDAR_ALERT" &&
      setting.workspaceId === data.economicCalendarWorkspace?.id
  )
  const singleEconomicCalendarSetting =
    economicCalendarSettings.length === 1
      ? economicCalendarSettings[0]
      : undefined
  const hasUnidentifiedEconomicCalendarSetting =
    data.economicCalendarSettings.some(
      (setting) =>
        setting.featureKey !== "ECONOMIC_CALENDAR_ALERT" ||
        setting.workspaceId !== data.economicCalendarWorkspace?.id
    ) || economicCalendarSettings.length > 1
  const economicCalendarRouteView: FeatureRouteView | null =
    data.sectionAccess.economicCalendarRouting && economicCalendarRoute
      ? {
          ...economicCalendarRoute,
          setting: !hasUnidentifiedEconomicCalendarSetting
            ? singleEconomicCalendarSetting
            : undefined,
          loadError:
            data.economicCalendarLoadError ||
            data.economicCalendarWorkspace === null,
          readbackUnverified:
            !data.economicCalendarLoadError &&
            data.economicCalendarWorkspace !== null &&
            (hasUnidentifiedEconomicCalendarSetting ||
              (singleEconomicCalendarSetting !== undefined &&
                !isCompleteEconomicCalendarSetting(
                  singleEconomicCalendarSetting,
                  data.economicCalendarWorkspace.id
                ))),
        }
      : null
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
        : false
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
        loadError: data.featureSettingsLoadError,
        readbackUnverified: !isCompleteMarketNewsSetting(setting),
      }))
    : []

  if (marketNewsRoute && hasUnidentifiedMarketNewsSetting) {
    marketNewsRoutes.push({
      ...marketNewsRoute,
      setting: undefined,
      loadError: data.featureSettingsLoadError,
      readbackUnverified: true,
    })
  } else if (marketNewsRoute && marketNewsRoutes.length === 0) {
    marketNewsRoutes.push({
      ...marketNewsRoute,
      loadError: data.featureSettingsLoadError,
    })
  }
  const visibleRoutes: FeatureRouteView[] = [
    ...marketNewsRoutes,
    ...(economicCalendarRouteView ? [economicCalendarRouteView] : []),
  ]
  const activeBotConnections = data.botConnections.filter(
    (connection): connection is TelegramBotConnectionResponse =>
      connection.status === "ACTIVE" && connection.id !== undefined
  )
  const activeDestinations = data.destinations.filter(
    (destination) => destination.status === "ACTIVE"
  )

  return (
    <div className={TELEGRAM_CONFIGURATION_LAYOUT_CLASS}>
      <div className="flex min-w-0 flex-col gap-6">
        <FeatureRoutingSection
          routes={visibleRoutes}
          activeDestinations={activeDestinations}
          destinationsLoadError={data.destinationsLoadError}
          languages={data.languages}
          languageCatalogError={data.languageCatalogError}
          canUpdateEconomicCalendarRouting={
            data.manageAccess.economicCalendarRouting
          }
          canUpdateMarketNewsRouting={data.manageAccess.marketNewsRouting}
          canReadDestinations={data.sectionAccess.destinations}
          currentWorkspace={data.currentWorkspace}
          economicCalendarWorkspace={data.economicCalendarWorkspace}
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
              loadError={data.destinationsLoadError}
              activeBotConnections={activeBotConnections}
              canRead={data.sectionAccess.destinations}
              canReadBotConnections={data.sectionAccess.botConnections}
              canManage={data.manageAccess.destinations}
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

export function TelegramConfigurationSkeleton({
  sectionAccess,
  canReadWorkspace = false,
  canCreateBotConnections = false,
  canManageDestinations = false,
}: {
  sectionAccess: TelegramConfigurationData["sectionAccess"]
  canReadWorkspace?: boolean
  canCreateBotConnections?: boolean
  canManageDestinations?: boolean
}) {
  const economicCalendarOnly =
    sectionAccess.economicCalendarRouting &&
    !sectionAccess.botConnections &&
    !sectionAccess.destinations &&
    !sectionAccess.featureSettings &&
    !sectionAccess.marketNewsRouting &&
    !sectionAccess.schedules

  if (economicCalendarOnly) {
    return (
      <div
        className={TELEGRAM_CONFIGURATION_LAYOUT_CLASS}
        data-testid="telegram-configuration-skeleton"
        aria-busy="true"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="space-y-2" aria-hidden="true">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <AppListTable className="mt-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2" aria-hidden="true">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="h-4 w-56 max-w-full" />
                </div>
                <Skeleton
                  className="h-8 w-32 justify-self-end"
                  aria-hidden="true"
                />
                <div
                  className="col-span-2 grid gap-3 md:grid-cols-2"
                  aria-hidden="true"
                >
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </AppListTable>
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <section
            className="flex min-w-0 flex-col gap-4"
            data-testid="telegram-infrastructure-skeleton"
            aria-hidden="true"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="grid min-w-0 gap-4">
              {[canCreateBotConnections, canManageDestinations].map(
                (hasAction, cardIndex) => (
                  <Card key={cardIndex} className="min-w-0">
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full" />
                      {hasAction ? (
                        <CardAction>
                          <Skeleton className="h-9 w-28" />
                        </CardAction>
                      ) : null}
                    </CardHeader>
                    <CardContent className="flex min-w-0 flex-col gap-3">
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>
          {canReadWorkspace ? (
            <div
              className="grid gap-3 min-[1440px]:grid-cols-2"
              data-testid="telegram-readiness-skeleton"
              aria-hidden="true"
            >
              <Card size="sm" className="min-w-0">
                <CardHeader>
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <CardAction>
                    <Skeleton className="h-6 w-20" />
                  </CardAction>
                </CardHeader>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={TELEGRAM_CONFIGURATION_LAYOUT_CLASS}>
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
    !routes.some((route) => route.readbackUnverified || route.loadError)
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
  destinationsLoadError,
  currentWorkspace,
  economicCalendarWorkspace,
  languages,
  languageCatalogError,
  canUpdateEconomicCalendarRouting,
  canUpdateMarketNewsRouting,
  canReadDestinations,
}: {
  routes: FeatureRouteView[]
  activeDestinations: TelegramDestinationResponse[]
  destinationsLoadError: boolean
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  economicCalendarWorkspace: TelegramConfigurationData["economicCalendarWorkspace"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  canUpdateEconomicCalendarRouting: boolean
  canUpdateMarketNewsRouting: boolean
  canReadDestinations: boolean
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
        {routes.length === 0 ? (
          <Table>
            <TableBody>
              <AccessLimitedRow colSpan={1} title={t.routing.accessLimited} />
            </TableBody>
          </Table>
        ) : (
          routes.map((route, index) => {
            const isEconomicCalendarRoute =
              route.featureKey === "ECONOMIC_CALENDAR_ALERT"
            const isMarketNewsRoute = route.featureKey === "MARKET_NEWS_ALERT"
            const routeWorkspace = isEconomicCalendarRoute
              ? economicCalendarWorkspace
              : currentWorkspace
            const workspaceId = routeWorkspace?.id ?? route.setting?.workspaceId
            const workspaceLabel = route.readbackUnverified
              ? (route.setting?.workspaceName ??
                (route.setting?.workspaceId !== undefined
                  ? formatMessage(t.routing.workspaceIdFallback, {
                      id: route.setting.workspaceId,
                    })
                  : t.routing.readbackWorkspaceUnknown))
              : (route.setting?.workspaceName ??
                (isEconomicCalendarRoute
                  ? undefined
                  : currentWorkspace?.name) ??
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
                  isEconomicCalendarRoute
                    ? "economic-calendar-routing-card"
                    : isMarketNewsRoute
                      ? "market-news-routing-card"
                      : undefined
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
                    destinationsLoadError={destinationsLoadError}
                    currentWorkspaceId={workspaceId}
                    canReadDestinations={canReadDestinations}
                    canUpdate={
                      isEconomicCalendarRoute
                        ? canUpdateEconomicCalendarRouting
                        : canUpdateMarketNewsRouting
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
            <EmptyTitle role="alert">{t.schedule.loadError}</EmptyTitle>
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
  destinationsLoadError,
  currentWorkspaceId,
  canReadDestinations,
  canUpdate,
  languages,
  languageCatalogError,
}: {
  route: FeatureRouteView
  activeDestinations: TelegramDestinationResponse[]
  destinationsLoadError: boolean
  currentWorkspaceId?: number
  canReadDestinations: boolean
  canUpdate: boolean
  languages: LanguageResponse[]
  languageCatalogError: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const destinationFocusTarget = useRef<HTMLButtonElement | HTMLElement | null>(
    null
  )
  const languageFocusTarget = useRef<HTMLButtonElement | null>(null)
  const switchFocusTarget = useRef<HTMLButtonElement | null>(null)
  const restoreFocusAfterClear = useRef(false)
  const focusReadbackStatusAfterUpdate = useRef(false)
  const readbackStatusTarget = useRef<HTMLDivElement | null>(null)
  const [unverifiedUpdate, setUnverifiedUpdate] = useState<{
    featureKey: FeatureRouteView["featureKey"]
    workspaceId: number
    routeAtUpdate: FeatureRouteView
  } | null>(null)
  const updateReadbackUnverified = Boolean(
    unverifiedUpdate &&
    (route === unverifiedUpdate.routeAtUpdate ||
      route.loadError ||
      route.readbackUnverified ||
      route.setting?.featureKey !== unverifiedUpdate.featureKey ||
      route.setting?.workspaceId !== unverifiedUpdate.workspaceId)
  )
  const controlId = useId()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const isMarketNewsRoute = route.featureKey === "MARKET_NEWS_ALERT"
  const isEconomicCalendarRoute = route.featureKey === "ECONOMIC_CALENDAR_ALERT"
  const isPersistedRoute = isMarketNewsRoute || isEconomicCalendarRoute
  const persistedDestinationId = route.setting?.destination?.id.toString() ?? ""
  const persistedLanguageIsoCode = route.setting?.outputLanguage?.isoCode ?? ""
  const [destinationId, setDestinationId] = useState(persistedDestinationId)
  const [outputLanguageIsoCode, setOutputLanguageIsoCode] = useState(
    persistedLanguageIsoCode
  )

  useEffect(() => {
    if (!focusReadbackStatusAfterUpdate.current) return

    focusReadbackStatusAfterUpdate.current = false
    readbackStatusTarget.current?.focus()
  }, [updateReadbackUnverified])

  useEffect(() => {
    if (!restoreFocusAfterClear.current) return

    restoreFocusAfterClear.current = false

    for (const focusTarget of [
      destinationFocusTarget.current,
      languageFocusTarget.current,
      switchFocusTarget.current,
    ]) {
      if (
        !focusTarget?.isConnected ||
        (focusTarget instanceof HTMLButtonElement && focusTarget.disabled)
      ) {
        continue
      }

      focusTarget.focus()
      if (document.activeElement === focusTarget) break
    }
  }, [persistedDestinationId, persistedLanguageIsoCode, route.setting?.enabled])

  function setDestinationFocusTarget(element: HTMLElement | null) {
    destinationFocusTarget.current = element
  }

  if (isPersistedRoute && route.loadError) {
    return (
      <div
        className="col-span-2 flex min-w-0 flex-col gap-2 text-sm"
        role="alert"
      >
        <span className="text-destructive">{t.routing.settingsLoadError}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => router.refresh()}
        >
          {t.routing.retry}
        </Button>
      </div>
    )
  }

  if (
    isPersistedRoute &&
    (route.readbackUnverified || updateReadbackUnverified)
  ) {
    return (
      <div className="col-span-2 flex min-w-0 flex-col items-start gap-2">
        <div
          ref={readbackStatusTarget}
          className="min-w-0 text-sm text-muted-foreground"
          role="status"
          tabIndex={-1}
        >
          {isEconomicCalendarRoute
            ? t.routing.economicCalendarReadbackUnverified
            : t.routing.readbackUnverified}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => router.refresh()}
        >
          {t.routing.retry}
        </Button>
      </div>
    )
  }
  const routeSupportsLanguage = route.featureKey !== "SCHEDULED_MARKET_ANALYSIS"
  const savedDestination = route.setting?.destination ?? null
  const savedDestinationLabel = savedDestination
    ? `${getDestinationLabel(savedDestination, dictionary)}${
        isEconomicCalendarRoute && savedDestination.status !== "ACTIVE"
          ? ` — ${t.routing.unavailableDestination}`
          : ""
      }`
    : null
  const selectedDestinationId = isPersistedRoute
    ? persistedDestinationId
    : destinationId
  const hasSelectedActiveDestination = Boolean(
    selectedDestinationId &&
    (canReadDestinations
      ? activeDestinations.some(
          (destination) => destination.id.toString() === selectedDestinationId
        )
      : savedDestination?.status === "ACTIVE") &&
    (!isPersistedRoute || savedDestination?.status === "ACTIVE")
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
    (!isEconomicCalendarRoute &&
      !hasSelectedActiveDestination &&
      (!isMarketNewsRoute || !route.setting?.enabled))
  const languageControlDisabled =
    !canUpdateRoute ||
    (!isPersistedRoute && !hasSelectedActiveDestination) ||
    isPending ||
    languageCatalogError
  const shouldExplainMissingDestination =
    isPersistedRoute &&
    canUpdateRoute &&
    !route.setting?.enabled &&
    !hasSelectedActiveDestination
  const missingDestinationDescription = canReadDestinations
    ? t.routing.enableDestinationRequired
    : t.routing.destinationReadRequired
  const switchDescription =
    isEconomicCalendarRoute && !canUpdate
      ? t.routing.routeReadOnlyDescription
      : isMarketNewsRoute && route.setting && !canUpdate
        ? t.routing.routeReadOnlyDescription
        : shouldExplainMissingDestination
          ? missingDestinationDescription
          : null
  const destinationItems = [
    ...(isPersistedRoute && savedDestination
      ? [
          {
            value: persistedDestinationId,
            label:
              savedDestinationLabel ??
              getDestinationLabel(savedDestination, dictionary),
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
          !isPersistedRoute ||
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
    if (!isPersistedRoute && !destinationId && overrides.destinationId == null)
      return

    const requestInput = isPersistedRoute
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
      getUpdateTelegramFeatureSettingSchema(dictionary).safeParse(requestInput)

    if (!request.success) {
      toast.error(t.routing.updateError)
      return
    }

    startTransition(async () => {
      const result = await updateTelegramFeatureSetting(request.data)

      if (result.success) {
        if ("readbackUnverified" in result.data) {
          focusReadbackStatusAfterUpdate.current = true
          setUnverifiedUpdate({
            featureKey: request.data.featureKey,
            workspaceId: request.data.workspaceId,
            routeAtUpdate: route,
          })
          router.refresh()
          return
        }

        setUnverifiedUpdate(null)
        if (isPersistedRoute && overrides.destinationId === null) {
          restoreFocusAfterClear.current = true
          if (
            destinationFocusTarget.current instanceof HTMLButtonElement &&
            !destinationFocusTarget.current.disabled
          ) {
            destinationFocusTarget.current.focus()
          }
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

    if (!isPersistedRoute) setDestinationId(value)
    updateRoute(
      { destinationId: Number(value) },
      t.routing.destinationUpdateSuccess
    )
  }

  function handleLanguageChange(value: string | null) {
    if (value === null || !routeSupportsLanguage) return

    const nextLanguage = value === DEFAULT_FEATURE_LANGUAGE_VALUE ? "" : value
    if (!isPersistedRoute) setOutputLanguageIsoCode(nextLanguage)
    updateRoute(
      {
        outputLanguageIsoCode: isPersistedRoute
          ? nextLanguage || null
          : nextLanguage || undefined,
      },
      nextLanguage
        ? t.routing.languageUpdateSuccess
        : t.routing.languageClearSuccess
    )
  }

  function handleCheckedChange(enabled: boolean) {
    if (enabled && !hasSelectedActiveDestination && !isEconomicCalendarRoute) {
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
    : !isPersistedRoute && !hasSelectedActiveDestination
      ? t.routing.languageDestinationRequired
      : null
  const switchDescriptionId = `telegram-route-switch-description-${controlId}`
  const clearDestinationButton =
    isPersistedRoute && savedDestination ? (
      <Button
        type="button"
        variant="ghost"
        size={isEconomicCalendarRoute ? "icon-sm" : "icon"}
        className={
          isEconomicCalendarRoute
            ? "size-7 shrink-0"
            : "absolute end-0 top-1/2 z-10 -translate-y-1/2"
        }
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
        <X aria-hidden="true" />
      </Button>
    ) : null
  const destinationControl =
    isEconomicCalendarRoute && !canReadDestinations ? (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm text-muted-foreground">
            {savedDestination ? savedDestinationLabel : t.routing.noDestination}
          </span>
          <span className="text-xs text-muted-foreground" role="status">
            {t.routing.destinationReadOnly}
          </span>
        </div>
        {clearDestinationButton}
      </div>
    ) : isEconomicCalendarRoute && destinationsLoadError ? (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm text-muted-foreground">
            {savedDestination ? savedDestinationLabel : t.routing.noDestination}
          </span>
          <span role="alert" className="text-xs text-destructive">
            {t.destination.loadError}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => router.refresh()}
          >
            {t.routing.retry}
          </Button>
        </div>
        {clearDestinationButton}
      </div>
    ) : !savedDestination && activeDestinations.length === 0 ? (
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
            aria-busy={isPending}
            className={cn(
              "w-full",
              isPersistedRoute && savedDestination && "pe-10"
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
        {clearDestinationButton ? (
          isEconomicCalendarRoute ? (
            <div className="absolute end-0 top-1/2 z-10 -translate-y-1/2">
              {clearDestinationButton}
            </div>
          ) : (
            clearDestinationButton
          )
        ) : null}
      </div>
    )
  const languageControl = routeSupportsLanguage ? (
    <div className="flex min-w-0 flex-col gap-1">
      <Select
        items={languageItems}
        value={
          (isPersistedRoute
            ? persistedLanguageIsoCode
            : outputLanguageIsoCode) || DEFAULT_FEATURE_LANGUAGE_VALUE
        }
        onValueChange={handleLanguageChange}
        disabled={languageControlDisabled}
      >
        <SelectTrigger
          ref={languageFocusTarget}
          className="w-full"
          aria-busy={isPending}
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
          ref={switchFocusTarget}
          checked={Boolean(route.setting?.enabled)}
          disabled={switchDisabled}
          onCheckedChange={handleCheckedChange}
          aria-label={formatMessage(t.routing.switchAria, {
            route: route.label,
          })}
          aria-describedby={switchDescription ? switchDescriptionId : undefined}
          aria-busy={isPending}
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
      {isPending ? (
        <span className="sr-only" role="status">
          {t.routing.saving}
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
