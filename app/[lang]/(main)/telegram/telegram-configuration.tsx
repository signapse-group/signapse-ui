"use client"

import { Fragment, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  CalendarClock,
  CircleAlert,
  MessageCircle,
  RadioTower,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
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
  TelegramFeatureSettingReadback,
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
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import { Badge } from "@/components/ui/badge"
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
  setting?: TelegramFeatureSettingReadback
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
    {
      featureKey: "SCHEDULED_MARKET_ANALYSIS",
      label: routes.SCHEDULED_MARKET_ANALYSIS.label,
      description: routes.SCHEDULED_MARKET_ANALYSIS.description,
    },
  ]
}

export function TelegramConfigurationPage({
  data,
}: {
  data: TelegramConfigurationData
}) {
  const { dictionary } = useLocalization()
  const featureSettings =
    data.currentWorkspace && !data.featureSettingsLoadError
      ? data.featureSettings.filter(
          (setting) => setting.workspaceId === data.currentWorkspace?.id
        )
      : []
  const schedules = data.currentWorkspace
    ? data.schedules.filter(
        (schedule) => schedule.workspaceId === data.currentWorkspace?.id
      )
    : []
  const routes = data.currentWorkspace
    ? getRouteDefinitions(dictionary)
        .map((route) => ({
          ...route,
          setting: featureSettings.find(
            (setting) => setting.featureKey === route.featureKey
          ),
        }))
        .filter((route) => data.sectionAccess.featureSettings[route.featureKey])
    : []
  const activeBotConnections = data.botConnections.filter(
    (connection) => connection.status === "ACTIVE"
  )
  const activeDestinations = data.destinations.filter(
    (destination) => destination.status === "ACTIVE"
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <FeatureRoutingSection
        routes={routes}
        schedules={schedules}
        activeDestinations={activeDestinations}
        currentWorkspace={data.currentWorkspace}
        watchlistAssets={data.watchlistAssets}
        languages={data.languages}
        languageCatalogError={data.languageCatalogError}
        scheduleLoadError={data.scheduleLoadError}
        featureSettingsLoadError={data.featureSettingsLoadError}
        destinationLoadError={data.destinationsLoadError}
        canReadDestinations={data.sectionAccess.destinations}
        canUpdateFeatureSettings={data.manageAccess.featureSettings}
        canReadSchedules={data.sectionAccess.schedules}
        canManageSchedules={data.manageAccess.schedules}
      />
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
            loadError={data.destinationsLoadError}
            activeBotConnections={activeBotConnections}
            canRead={data.sectionAccess.destinations}
            canReadBotConnections={data.sectionAccess.botConnections}
            canManage={data.manageAccess.destinations}
          />
        </div>
      </section>
    </div>
  )
}

export function TelegramConfigurationSkeleton({
  sectionAccess,
}: {
  sectionAccess: TelegramConfigurationData["sectionAccess"]
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const routes = getRouteDefinitions(dictionary).filter(
    (route) => sectionAccess.featureSettings[route.featureKey]
  )
  const economicCalendarOnly =
    routes.length === 1 && routes[0]?.featureKey === "ECONOMIC_CALENDAR_ALERT"

  return (
    <div className="flex w-full flex-col gap-6">
      <section
        aria-labelledby="telegram-routing-skeleton"
        aria-busy="true"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="telegram-routing-skeleton"
            className="text-base font-semibold text-foreground"
          >
            {t.routing.sectionTitle}
          </h2>
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        {routes.length === 0 ? (
          <p
            role="status"
            className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
          >
            {t.routing.accessLimited}
          </p>
        ) : null}
        {routes.length > 0 || sectionAccess.schedules ? (
          <AppListTable className="mt-0">
            <Table>
              {routes.length > 0 ? (
                <TableHeader
                  className={economicCalendarOnly ? "hidden" : undefined}
                >
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
              ) : null}
              <TableBody>
                {routes.map((route) => {
                  const cardLayout =
                    economicCalendarOnly &&
                    route.featureKey === "ECONOMIC_CALENDAR_ALERT"

                  return (
                    <TableRow
                      key={route.featureKey}
                      data-route-key={route.featureKey}
                      className={cn(
                        "border-border",
                        cardLayout &&
                          "grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 rounded-xl border bg-card p-3 md:grid-cols-2"
                      )}
                    >
                      <TableCell
                        className={cn(
                          "block align-top whitespace-normal",
                          cardLayout
                            ? "col-start-1 row-start-1 min-w-0 border-b-0 px-1 py-2"
                            : "md:table-cell"
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="flex items-center gap-2">
                            {cardLayout ? (
                              <Skeleton className="size-4 rounded-full" />
                            ) : null}
                            <Skeleton className="h-5 w-40" />
                          </span>
                          <Skeleton
                            className={cn(
                              "h-4 w-56",
                              cardLayout
                                ? "sr-only"
                                : "sr-only md:not-sr-only md:block"
                            )}
                          />
                          <Skeleton
                            className={cn(
                              "h-4 w-32",
                              !cardLayout && "hidden md:block"
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "block align-top text-sm text-muted-foreground",
                          cardLayout ? "hidden" : "md:table-cell"
                        )}
                      >
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "block align-top whitespace-normal",
                          cardLayout
                            ? "col-span-2 row-start-2 min-w-0 border-b-0 px-1 py-2 md:col-span-1 md:col-start-1 md:px-2"
                            : "md:table-cell"
                        )}
                      >
                        {cardLayout ? (
                          <span className="mb-1 block text-xs font-medium text-muted-foreground">
                            {t.routing.destinationColumn}
                          </span>
                        ) : null}
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "block align-top whitespace-normal",
                          cardLayout
                            ? "col-span-2 row-start-3 min-w-0 border-b-0 px-1 py-2 md:col-span-1 md:col-start-2 md:row-start-2 md:px-2"
                            : "md:table-cell"
                        )}
                      >
                        {cardLayout ? (
                          <span className="mb-1 block text-xs font-medium text-muted-foreground">
                            {t.routing.languageColumn}
                          </span>
                        ) : null}
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "block align-top",
                          cardLayout
                            ? "col-start-2 row-start-1 flex justify-end border-b-0 px-1 py-2 md:px-2"
                            : "md:table-cell"
                        )}
                      >
                        <div
                          className={cn(
                            "inline-flex h-8 w-32 items-center justify-between gap-2 rounded-lg border border-input px-2.5",
                            cardLayout ? "mx-0" : "mx-auto"
                          )}
                        >
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="size-4 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {sectionAccess.schedules ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-4">
                      <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                        <div className="overflow-x-auto">
                          <div className="grid min-w-[72rem] grid-cols-8 gap-3">
                            {Array.from({ length: 8 }).map((_, index) => (
                              <Skeleton key={index} className="h-10 w-full" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </AppListTable>
        ) : null}
      </section>
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
  const canReadRoutes = Object.values(data.sectionAccess.featureSettings).some(
    Boolean
  )
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
      state: !data.sectionAccess.botConnections
        ? t.readiness.accessLimited
        : activeBotCount > 0
          ? t.readiness.ready
          : t.readiness.needsConfig,
      status:
        data.sectionAccess.botConnections && activeBotCount > 0
          ? ("ready" as const)
          : ("attention" as const),
      icon: Bot,
    },
    {
      label: t.readiness.destinations,
      description: data.sectionAccess.destinations
        ? formatMessage(t.readiness.activeDestinations, {
            count: formatCount(activeDestinationCount),
          })
        : t.readiness.noDestinationPermission,
      state: !data.sectionAccess.destinations
        ? t.readiness.accessLimited
        : activeDestinationCount > 0
          ? t.readiness.ready
          : t.readiness.needsLink,
      status:
        data.sectionAccess.destinations && activeDestinationCount > 0
          ? ("ready" as const)
          : ("attention" as const),
      icon: MessageCircle,
    },
    {
      label: t.readiness.routing,
      description: data.featureSettingsLoadError
        ? t.readiness.routingLoadError
        : !data.currentWorkspace
          ? t.readiness.noWorkspace
          : !canReadRoutes
            ? t.readiness.noRoutingPermission
            : formatMessage(t.readiness.configuredRoutes, {
                configured: formatCount(configuredRoutes),
                total: formatCount(routes.length),
                workspace: data.currentWorkspace.name,
              }),
      state: data.featureSettingsLoadError
        ? t.readiness.accessLimited
        : !data.currentWorkspace || !canReadRoutes
          ? t.readiness.accessLimited
          : configuredRoutes > 0
            ? t.readiness.routesEnabled
            : t.readiness.needsReview,
      status:
        !data.featureSettingsLoadError && canReadRoutes && configuredRoutes > 0
          ? ("ready" as const)
          : ("attention" as const),
      icon: RadioTower,
    },
    {
      label: t.readiness.scheduledAnalysis,
      description: data.sectionAccess.schedules
        ? formatMessage(t.readiness.activeSchedules, {
            count: formatCount(activeSchedules),
          })
        : t.readiness.noSchedulePermission,
      state: !data.sectionAccess.schedules
        ? t.readiness.accessLimited
        : activeSchedules > 0
          ? t.readiness.ready
          : t.readiness.noSchedules,
      status:
        data.sectionAccess.schedules && activeSchedules > 0
          ? ("ready" as const)
          : ("attention" as const),
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
  schedules,
  activeDestinations,
  currentWorkspace,
  watchlistAssets,
  languages,
  languageCatalogError,
  scheduleLoadError,
  featureSettingsLoadError,
  destinationLoadError,
  canReadDestinations,
  canUpdateFeatureSettings,
  canReadSchedules,
  canManageSchedules,
}: {
  routes: FeatureRouteView[]
  schedules: TelegramMarketAnalysisScheduleResponse[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  scheduleLoadError: boolean
  featureSettingsLoadError: boolean
  destinationLoadError: boolean
  canReadDestinations: boolean
  canUpdateFeatureSettings: TelegramConfigurationData["manageAccess"]["featureSettings"]
  canReadSchedules: boolean
  canManageSchedules: boolean
}) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const economicCalendarOnly =
    routes.length === 1 && routes[0]?.featureKey === "ECONOMIC_CALENDAR_ALERT"

  return (
    <section className="flex flex-col gap-4" aria-labelledby="telegram-routing">
      <div className="flex flex-col gap-1">
        <h2
          id="telegram-routing"
          className="text-base font-semibold text-foreground"
        >
          {t.routing.sectionTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {currentWorkspace
            ? `${currentWorkspace.name} · ${t.common.currentWorkspaceScope}`
            : t.routing.noWorkspaceSelected}
        </p>
      </div>
      {!currentWorkspace ? (
        <p
          role="status"
          className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          {t.routing.noWorkspaceSelected}
        </p>
      ) : featureSettingsLoadError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {t.routing.settingsLoadError}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.routing.settingsLoadErrorDescription}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
          >
            {t.routing.retry}
          </Button>
        </div>
      ) : routes.length > 0 ? (
        <AppListTable className="mt-0">
          <Table>
            <TableHeader
              className={economicCalendarOnly ? "hidden" : undefined}
            >
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
              {routes.map((route) => (
                <TableRow
                  key={route.featureKey}
                  data-route-key={route.featureKey}
                  className={cn(
                    "border-border transition-colors hover:bg-muted/50",
                    economicCalendarOnly &&
                      "grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 rounded-xl border bg-card p-3 md:grid-cols-2"
                  )}
                >
                  <TableCell
                    className={cn(
                      "block align-top whitespace-normal",
                      economicCalendarOnly
                        ? "col-start-1 row-start-1 min-w-0 border-b-0 px-1 py-2"
                        : "md:table-cell"
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {economicCalendarOnly ? (
                          <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                        ) : null}
                        {route.label}
                      </span>
                      <span
                        className={cn(
                          "text-sm text-muted-foreground",
                          economicCalendarOnly
                            ? "sr-only"
                            : "sr-only md:not-sr-only md:block"
                        )}
                      >
                        {route.description}
                      </span>
                      <code
                        className={cn(
                          "hidden w-fit rounded bg-muted px-1.5 py-0.5 text-xs text-foreground",
                          !economicCalendarOnly && "md:block"
                        )}
                      >
                        {route.featureKey}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "block align-top text-sm text-muted-foreground",
                      economicCalendarOnly ? "hidden" : "md:table-cell"
                    )}
                  >
                    {currentWorkspace?.name ?? t.routing.noWorkspaceSelected}
                  </TableCell>
                  {route.featureKey === "ECONOMIC_CALENDAR_ALERT" ? (
                    <EconomicCalendarRouteControls
                      route={route}
                      cardLayout={economicCalendarOnly}
                      activeDestinations={activeDestinations}
                      canReadDestinations={canReadDestinations}
                      destinationLoadError={destinationLoadError}
                      currentWorkspaceId={currentWorkspace?.id}
                      canUpdate={canUpdateFeatureSettings[route.featureKey]}
                      languages={languages}
                      languageCatalogError={languageCatalogError}
                    />
                  ) : (
                    <FeatureRouteControls
                      key={`${route.featureKey}:${route.setting?.destination?.id ?? "none"}:${route.setting?.outputLanguage?.isoCode ?? "default"}`}
                      route={route}
                      activeDestinations={activeDestinations}
                      currentWorkspaceId={currentWorkspace?.id}
                      canUpdate={canUpdateFeatureSettings[route.featureKey]}
                      languages={languages}
                      languageCatalogError={languageCatalogError}
                    />
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppListTable>
      ) : (
        <p
          role="status"
          className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          {t.routing.accessLimited}
        </p>
      )}
      {canReadSchedules ? (
        <MarketAnalysisSchedulePanel
          schedules={schedules}
          activeDestinations={activeDestinations}
          currentWorkspace={currentWorkspace}
          watchlistAssets={watchlistAssets}
          languages={languages}
          languageCatalogError={languageCatalogError}
          scheduleLoadError={scheduleLoadError}
          canReadSchedules={canReadSchedules}
          canManageSchedules={canManageSchedules}
        />
      ) : null}
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
  canManageSchedules,
}: {
  schedules: TelegramMarketAnalysisScheduleResponse[]
  activeDestinations: TelegramDestinationResponse[]
  currentWorkspace: TelegramConfigurationData["currentWorkspace"]
  watchlistAssets: TelegramConfigurationData["watchlistAssets"]
  languages: TelegramConfigurationData["languages"]
  languageCatalogError: boolean
  scheduleLoadError: boolean
  canReadSchedules: boolean
  canManageSchedules: boolean
}) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const t = dictionary.telegram
  const operationalSchedules = schedules.filter(
    (schedule) => schedule.status !== "REMOVED"
  )

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-background p-4">
      <AppListToolbar>
        <AppListToolbarLeading>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t.schedule.panelTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.schedule.panelDescription}
            </p>
          </div>
          {!canReadSchedules ? null : canManageSchedules ? (
            <CreateTelegramScheduleDialog
              activeDestinations={activeDestinations}
              currentWorkspace={currentWorkspace}
              watchlistAssets={watchlistAssets}
              languages={languages}
              languageCatalogError={languageCatalogError}
              canManage={canManageSchedules}
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {t.schedule.readOnlyDescription}
            </span>
          )}
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <Badge variant="outline">{t.common.currentWorkspaceScope}</Badge>
        </AppListToolbarTrailing>
      </AppListToolbar>
      <AppListTable className="mt-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[72rem]">
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-[20%]">
                  {t.schedule.scheduleColumn}
                </AppListTableHead>
                <AppListTableHead className="w-44">
                  {t.schedule.workspaceColumn}
                </AppListTableHead>
                <AppListTableHead className="w-52">
                  {t.schedule.destinationColumn}
                </AppListTableHead>
                <AppListTableHead className="w-44">
                  {t.schedule.localTimesColumn}
                </AppListTableHead>
                <AppListTableHead className="w-44">
                  {t.schedule.assetColumn}
                </AppListTableHead>
                <AppListTableHead className="w-44">
                  {t.schedule.languageColumn}
                </AppListTableHead>
                <AppListTableHead className="w-32">
                  {t.schedule.statusColumn}
                </AppListTableHead>
                <AppListTableHead className="w-32 text-right">
                  {t.common.actions}
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {!canReadSchedules ? (
                <AccessLimitedRow
                  colSpan={8}
                  title={t.schedule.accessLimited}
                />
              ) : scheduleLoadError ? (
                <AppListTableEmptyState colSpan={8}>
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
              ) : operationalSchedules.length > 0 ? (
                operationalSchedules.map((schedule) => {
                  const disableTriggerId = `telegram-schedule-disable-${schedule.id}`
                  const deleteTriggerId = `telegram-schedule-delete-${schedule.id}`

                  return (
                    <TableRow
                      key={schedule.id}
                      className="border-border transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="align-top break-words whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {schedule.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {schedule.timezone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {schedule.workspaceName ??
                          currentWorkspace?.name ??
                          t.schedule.currentWorkspaceFallback}
                      </TableCell>
                      <TableCell className="align-top text-sm break-words whitespace-normal text-muted-foreground">
                        {schedule.destination
                          ? getDestinationLabel(
                              schedule.destination,
                              dictionary
                            )
                          : t.schedule.noDestination}
                      </TableCell>
                      <TableCell className="align-top text-sm whitespace-normal text-muted-foreground">
                        {schedule.localTimes.join(", ")}
                      </TableCell>
                      <TableCell className="align-top text-sm break-words whitespace-normal text-muted-foreground">
                        {formatScheduledAsset(schedule, dictionary)}
                      </TableCell>
                      <TableCell className="align-top text-sm break-words whitespace-normal text-muted-foreground">
                        {schedule.outputLanguage?.name ??
                          schedule.outputLanguage?.isoCode ??
                          t.schedule.defaultLanguage}
                      </TableCell>
                      <TableCell className="align-top">
                        <StatusBadge status={schedule.status} />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap justify-end gap-1">
                          {canManageSchedules &&
                          schedule.status === "ACTIVE" ? (
                            <UpdateTelegramScheduleDialog
                              schedule={schedule}
                              activeDestinations={activeDestinations}
                              currentWorkspace={currentWorkspace}
                              watchlistAssets={watchlistAssets}
                              languages={languages}
                              languageCatalogError={languageCatalogError}
                              canManage={canManageSchedules}
                            />
                          ) : null}
                          {canManageSchedules &&
                          schedule.status === "ACTIVE" ? (
                            <ActionConfirmDialog
                              intent="warning"
                              title={t.schedule.disableTitle}
                              description={t.schedule.disableDescription}
                              actionLabel={t.common.disable}
                              triggerLabel={t.schedule.disableTrigger}
                              restoreFocusId={disableTriggerId}
                              trigger={
                                <Button
                                  id={disableTriggerId}
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={t.schedule.disableTrigger}
                                >
                                  <CircleAlert data-icon="inline-start" />
                                </Button>
                              }
                              action={() =>
                                disableTelegramMarketAnalysisSchedule(
                                  schedule.id
                                )
                              }
                              successMessage={t.schedule.disableSuccess}
                            />
                          ) : null}
                          {canManageSchedules ? (
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
                              action={() =>
                                deleteTelegramMarketAnalysisSchedule(
                                  schedule.id
                                )
                              }
                              successMessage={t.schedule.deleteSuccess}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <AppListTableEmptyState colSpan={8}>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarClock />
                    </EmptyMedia>
                    <EmptyTitle>{t.schedule.emptyTitle}</EmptyTitle>
                    <EmptyDescription>
                      {t.schedule.emptyDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                </AppListTableEmptyState>
              )}
            </TableBody>
          </Table>
        </div>
      </AppListTable>
    </div>
  )
}
function EconomicCalendarRouteControls({
  route,
  cardLayout,
  activeDestinations,
  canReadDestinations,
  destinationLoadError,
  currentWorkspaceId,
  canUpdate,
  languages,
  languageCatalogError,
}: {
  route: FeatureRouteView
  cardLayout: boolean
  activeDestinations: TelegramDestinationResponse[]
  canReadDestinations: boolean
  destinationLoadError: boolean
  currentWorkspaceId?: number
  canUpdate: boolean
  languages: LanguageResponse[]
  languageCatalogError: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const selectedDestination = route.setting?.destination ?? null
  const selectedDestinationValue = selectedDestination?.id.toString() ?? ""
  const destinationTriggerRef = useRef<HTMLButtonElement>(null)
  const languageTriggerRef = useRef<HTMLButtonElement>(null)
  const enabledSwitchRef = useRef<HTMLButtonElement>(null)
  const focusAfterClear = useRef(false)
  const persistedLanguage = route.setting?.outputLanguage ?? null
  const persistedLanguageCode = persistedLanguage?.isoCode ?? ""
  const canMutate = canUpdate && Boolean(currentWorkspaceId) && !isPending
  const hasActiveDestinations = activeDestinations.length > 0
  const destinationItems = [...activeDestinations]

  useEffect(() => {
    if (!focusAfterClear.current || selectedDestination) return

    focusAfterClear.current = false

    for (const focusTarget of [
      destinationTriggerRef.current,
      languageTriggerRef.current,
      enabledSwitchRef.current,
    ]) {
      if (!focusTarget?.isConnected || focusTarget.disabled) continue

      focusTarget.focus()
      if (document.activeElement === focusTarget) break
    }
  }, [selectedDestination])

  if (
    canReadDestinations &&
    selectedDestination &&
    !destinationItems.some(
      (destination) => destination.id === selectedDestination.id
    )
  ) {
    destinationItems.push(selectedDestination)
  }

  const languageOptions = languages.filter(isSelectableLanguage)
  const hasCurrentLanguageInCatalog = persistedLanguageCode
    ? languageOptions.some(
        (language) => language.isoCode === persistedLanguageCode
      )
    : true

  if (
    persistedLanguage &&
    isSelectableLanguage(persistedLanguage) &&
    !hasCurrentLanguageInCatalog
  ) {
    languageOptions.unshift(persistedLanguage)
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
        language.isoCode === persistedLanguageCode
          ? ` — ${t.routing.languageUnavailable}`
          : ""
      }`,
    })),
  ]

  function updateRoute(
    overrides: Partial<UpdateTelegramFeatureSettingRequest>,
    successMessage: string
  ) {
    if (!currentWorkspaceId) return

    const request = getUpdateTelegramFeatureSettingSchema(dictionary).safeParse(
      {
        featureKey: route.featureKey,
        workspaceId: currentWorkspaceId,
        enabled: route.setting?.enabled ?? false,
        ...overrides,
      }
    )

    if (!request.success) {
      toast.error(t.routing.updateError)
      return
    }

    startTransition(async () => {
      try {
        const result = await updateTelegramFeatureSetting(request.data)

        if (result.success) {
          if (overrides.destinationId === null && overrides.enabled === false) {
            focusAfterClear.current = true
          }
          toast.success(successMessage)
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error(t.routing.updateError)
      }
    })
  }

  const destinationLabel = selectedDestination
    ? getDestinationLabel(selectedDestination, dictionary)
    : t.routing.noDestination
  const clearDestinationButton =
    selectedDestination && canUpdate ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0"
        aria-label={formatMessage(t.routing.clearDestination, {
          route: route.label,
        })}
        disabled={!canMutate}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          updateRoute(
            { destinationId: null, enabled: false },
            t.routing.destinationClearSuccess
          )
        }}
      >
        <X />
      </Button>
    ) : null
  const destinationDescription = destinationLoadError
    ? t.destination.loadError
    : !canReadDestinations
      ? t.routing.destinationReadOnly
      : !hasActiveDestinations
        ? t.destination.noActiveDestination
        : null

  return (
    <>
      <TableCell
        className={cn(
          "block align-top whitespace-normal",
          cardLayout
            ? "col-span-2 row-start-2 min-w-0 border-b-0 px-1 py-2 md:col-span-1 md:col-start-1 md:px-2"
            : "md:table-cell"
        )}
      >
        {cardLayout ? (
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t.routing.destinationColumn}
          </span>
        ) : null}
        {destinationLoadError ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-start gap-2">
              <span role="alert" className="text-sm text-destructive">
                {t.destination.loadError}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.refresh()}
              >
                {t.routing.retry}
              </Button>
            </div>
            {clearDestinationButton}
          </div>
        ) : canReadDestinations ? (
          hasActiveDestinations || selectedDestination ? (
            <div className="relative">
              <Select
                items={destinationItems.map((destination) => ({
                  value: destination.id.toString(),
                  label: `${getDestinationLabel(destination, dictionary)}${
                    destination.status === "ACTIVE"
                      ? ""
                      : ` — ${t.routing.unavailableDestination}`
                  }`,
                }))}
                value={selectedDestinationValue || null}
                onValueChange={(value) => {
                  if (value === null) return
                  updateRoute(
                    { destinationId: Number(value) },
                    t.routing.destinationUpdateSuccess
                  )
                }}
                disabled={!canMutate || !hasActiveDestinations}
              >
                <SelectTrigger
                  ref={destinationTriggerRef}
                  aria-label={t.routing.destinationColumn + ": " + route.label}
                  className={cn(
                    "w-full",
                    selectedDestination && canUpdate && "pe-16"
                  )}
                  aria-busy={isPending}
                >
                  <SelectValue placeholder={t.destination.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {destinationItems.map((destination) => (
                      <SelectItem
                        key={destination.id}
                        value={destination.id.toString()}
                        disabled={destination.status !== "ACTIVE"}
                      >
                        {getDestinationLabel(destination, dictionary)}
                        {destination.status !== "ACTIVE"
                          ? ` — ${t.routing.unavailableDestination}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {clearDestinationButton ? (
                <div className="absolute top-1/2 right-7 z-10 -translate-y-1/2">
                  {clearDestinationButton}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-8 items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {t.destination.noActiveDestination}
              </span>
              {clearDestinationButton}
            </div>
          )
        ) : (
          <div className="flex min-h-8 items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {destinationLabel}
            </span>
            {clearDestinationButton}
          </div>
        )}
        {destinationDescription && !destinationLoadError ? (
          <p className="mt-1 text-xs text-muted-foreground" role="status">
            {destinationDescription}
          </p>
        ) : null}
      </TableCell>
      <TableCell
        className={cn(
          "block align-top whitespace-normal",
          cardLayout
            ? "col-span-2 row-start-3 min-w-0 border-b-0 px-1 py-2 md:col-span-1 md:col-start-2 md:row-start-2 md:px-2"
            : "md:table-cell"
        )}
      >
        {cardLayout ? (
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t.routing.languageColumn}
          </span>
        ) : null}
        <Select
          items={languageItems}
          value={persistedLanguageCode || DEFAULT_FEATURE_LANGUAGE_VALUE}
          onValueChange={(value) => {
            if (value === null) return
            const language =
              value === DEFAULT_FEATURE_LANGUAGE_VALUE ? null : value
            updateRoute(
              { outputLanguageIsoCode: language },
              language
                ? t.routing.languageUpdateSuccess
                : t.routing.languageClearSuccess
            )
          }}
          disabled={!canMutate || languageCatalogError}
        >
          <SelectTrigger
            ref={languageTriggerRef}
            className="w-full"
            aria-label={formatMessage(t.routing.languageAria, {
              route: route.label,
            })}
            aria-busy={isPending}
            aria-describedby={
              languageCatalogError
                ? `telegram-route-${route.featureKey}-language-description`
                : undefined
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
                  language.isoCode === persistedLanguageCode
                    ? ` — ${t.routing.languageUnavailable}`
                    : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {languageCatalogError ? (
          <span
            id={`telegram-route-${route.featureKey}-language-description`}
            className="mt-1 block text-xs text-muted-foreground"
            role="status"
          >
            {t.routing.languageCatalogError}
          </span>
        ) : null}
      </TableCell>
      <TableCell
        className={cn(
          "block align-top",
          cardLayout
            ? "col-start-2 row-start-1 flex justify-end border-b-0 px-1 py-2 md:px-2"
            : "md:table-cell"
        )}
      >
        <div
          className={cn(
            "inline-flex h-8 w-32 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs data-[disabled=true]:opacity-60",
            cardLayout ? "mx-0" : "mx-auto"
          )}
          data-disabled={!canMutate ? true : undefined}
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
            ref={enabledSwitchRef}
            checked={Boolean(route.setting?.enabled)}
            disabled={!canMutate}
            onCheckedChange={(enabled) =>
              updateRoute(
                { enabled },
                enabled ? t.routing.enabledSuccess : t.routing.disabledSuccess
              )
            }
            aria-label={formatMessage(t.routing.switchAria, {
              route: route.label,
            })}
            aria-busy={isPending}
          />
        </div>
        {isPending ? (
          <span className="sr-only" role="status">
            {t.routing.saving}
          </span>
        ) : null}
      </TableCell>
    </>
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

    const request = getUpdateTelegramFeatureSettingSchema(dictionary).safeParse(
      {
        featureKey: route.featureKey,
        workspaceId: currentWorkspaceId,
        destinationId: Number(nextDestinationId),
        enabled: route.setting?.enabled ?? false,
        outputLanguageIsoCode: outputLanguageIsoCode || undefined,
        ...overrides,
      }
    )

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
            <SelectTrigger
              aria-label={t.routing.destinationColumn + ": " + route.label}
              className="w-full"
            >
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
