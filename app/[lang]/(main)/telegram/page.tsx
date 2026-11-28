import { Suspense } from "react"

import { getLanguages } from "@/app/api/languages/action"
import {
  getTelegramBotConnections,
  getTelegramDestinations,
  getTelegramFeatureSettings,
  getTelegramMarketAnalysisSchedules,
} from "@/app/api/telegram/action"
import { getAllWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import {
  getCurrentPermissions,
  getCurrentWorkspaceSummary,
} from "@/app/lib/permissions-server"
import {
  canAccessTelegramConfiguration,
  TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION,
  getTelegramManageAccess,
  getTelegramScheduleActionAccess,
  getTelegramSectionAccess,
} from "@/app/lib/telegram/permissions"
import { getActiveWorkspaceForCurrentUser } from "@/app/lib/workspaces/current"
import { AccessDenied } from "@/components/access-denied"

import {
  TelegramConfigurationPage,
  TelegramConfigurationSkeleton,
} from "./telegram-configuration"

const WATCHLIST_ASSET_SEARCH = {
  filter: "",
  page: 0,
  size: 2000,
  sort: [],
}

function loadSection<T>(
  load: (() => Promise<T>) | undefined,
  fallback: T
): Promise<{ data: T; error: boolean }> {
  if (!load) return Promise.resolve({ data: fallback, error: false })

  return Promise.resolve()
    .then(load)
    .then((data) => ({ data, error: false }))
    .catch(() => ({ data: fallback, error: true }))
}

export default async function TelegramPage() {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])
  const sectionAccess = getTelegramSectionAccess(permissions)
  const manageAccess = getTelegramManageAccess(permissions)
  const scheduleActions = getTelegramScheduleActionAccess(permissions)
  const canCreateBotConnections = hasPermission(
    permissions,
    TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION
  )

  if (!canAccessTelegramConfiguration(permissions)) {
    return (
      <AccessDenied
        description={dictionary.telegram.readDenied}
        permission="telegram-bot-connection:read"
      />
    )
  }

  return (
    <Suspense
      fallback={
        <TelegramConfigurationSkeleton
          sectionAccess={sectionAccess}
          canReadWorkspace={hasPermission(permissions, "workspace:read")}
          canCreateBotConnections={canCreateBotConnections}
          canManageDestinations={manageAccess.destinations}
        />
      }
    >
      <TelegramConfigurationContent
        sectionAccess={sectionAccess}
        manageAccess={manageAccess}
        scheduleActions={scheduleActions}
        canReadWorkspace={hasPermission(permissions, "workspace:read")}
        canCreateBotConnections={canCreateBotConnections}
      />
    </Suspense>
  )
}

async function TelegramConfigurationContent({
  sectionAccess,
  manageAccess,
  scheduleActions,
  canReadWorkspace,
  canCreateBotConnections,
}: {
  sectionAccess: ReturnType<typeof getTelegramSectionAccess>
  manageAccess: ReturnType<typeof getTelegramManageAccess>
  scheduleActions: ReturnType<typeof getTelegramScheduleActionAccess>
  canReadWorkspace: boolean
  canCreateBotConnections: boolean
}) {
  const currentWorkspacePromise = loadSection(
    canReadWorkspace ? () => getActiveWorkspaceForCurrentUser() : undefined,
    null
  )
  const currentWorkspaceSummaryPromise = loadSection(
    sectionAccess.signalEngineRouting
      ? () => getCurrentWorkspaceSummary()
      : undefined,
    null
  )
  const signalEngineWorkspacePromise = Promise.all([
    currentWorkspacePromise,
    currentWorkspaceSummaryPromise,
  ]).then(([workspace, summary]) => ({
    data: workspace.data ?? summary.data,
    error:
      sectionAccess.signalEngineRouting &&
      workspace.data === null &&
      (workspace.error || summary.error),
  }))
  const economicCalendarWorkspacePromise = currentWorkspacePromise.then(
    ({ data: currentWorkspace }) =>
      loadSection(
        sectionAccess.economicCalendarRouting
          ? async () => currentWorkspace ?? (await getCurrentWorkspaceSummary())
          : undefined,
        null
      )
  )
  const botConnectionsPromise = loadSection(
    sectionAccess.botConnections
      ? () => getTelegramBotConnections()
      : undefined,
    []
  )
  const destinationsPromise = loadSection(
    sectionAccess.destinations ? () => getTelegramDestinations() : undefined,
    []
  )
  const featureSettingsPromise = loadSection(
    sectionAccess.marketNewsRouting
      ? () => getTelegramFeatureSettings({ featureKey: "MARKET_NEWS_ALERT" })
      : undefined,
    []
  )
  const signalEngineSettingsPromise = signalEngineWorkspacePromise.then(
    ({ data: signalEngineWorkspace, error: workspaceError }) =>
      loadSection(
        sectionAccess.signalEngineRouting && signalEngineWorkspace
          ? () =>
              getTelegramFeatureSettings({
                workspaceId: signalEngineWorkspace.id,
                featureKey: "SIGNAL_ENGINE",
              })
          : undefined,
        []
      ).then((settings) => ({
        ...settings,
        error:
          settings.error ||
          (sectionAccess.signalEngineRouting && workspaceError),
      }))
  )
  const economicCalendarSettingsPromise = economicCalendarWorkspacePromise.then(
    ({ data: economicCalendarWorkspace, error: workspaceError }) =>
      loadSection(
        sectionAccess.economicCalendarRouting && economicCalendarWorkspace
          ? () =>
              getTelegramFeatureSettings({
                workspaceId: economicCalendarWorkspace.id,
                featureKey: "ECONOMIC_CALENDAR_ALERT",
              })
          : undefined,
        []
      ).then((settings) => ({
        ...settings,
        error:
          settings.error ||
          (sectionAccess.economicCalendarRouting &&
            (workspaceError || economicCalendarWorkspace === null)),
      }))
  )
  const schedulesPromise = loadSection(
    sectionAccess.schedules
      ? () => getTelegramMarketAnalysisSchedules()
      : undefined,
    []
  )
  const languagesPromise = loadSection(
    sectionAccess.schedules ||
      sectionAccess.marketNewsRouting ||
      sectionAccess.economicCalendarRouting ||
      sectionAccess.signalEngineRouting ||
      scheduleActions.create ||
      scheduleActions.update
      ? () => getLanguages()
      : undefined,
    { currentLanguage: "vi", preferredLanguage: null, languages: [] }
  )
  const watchlistAssetsPromise = currentWorkspacePromise.then(
    ({ data: currentWorkspace }) =>
      loadSection(
        sectionAccess.watchlistAssets && currentWorkspace
          ? () => getAllWorkspaceWatchlistAssets(WATCHLIST_ASSET_SEARCH)
          : undefined,
        []
      )
  )

  const [
    currentWorkspaceResult,
    economicCalendarWorkspaceResult,
    botConnectionsResult,
    destinationsResult,
    featureSettingsResult,
    signalEngineWorkspaceResult,
    signalEngineSettingsResult,
    economicCalendarSettingsResult,
    schedulesResult,
    watchlistAssetsResult,
    languagesResult,
  ] = await Promise.all([
    currentWorkspacePromise,
    economicCalendarWorkspacePromise,
    botConnectionsPromise,
    destinationsPromise,
    featureSettingsPromise,
    signalEngineWorkspacePromise,
    signalEngineSettingsPromise,
    economicCalendarSettingsPromise,
    schedulesPromise,
    watchlistAssetsPromise,
    languagesPromise,
  ])

  return (
    <TelegramConfigurationPage
      data={{
        botConnections: botConnectionsResult.data,
        destinations: destinationsResult.data,
        destinationsLoadError: destinationsResult.error,
        featureSettings: featureSettingsResult.data,
        featureSettingsLoadError: featureSettingsResult.error,
        signalEngineSettings: signalEngineSettingsResult.data,
        signalEngineWorkspace: signalEngineWorkspaceResult.data,
        signalEngineLoadError:
          signalEngineWorkspaceResult.error || signalEngineSettingsResult.error,
        economicCalendarSettings: economicCalendarSettingsResult.data,
        economicCalendarWorkspace: economicCalendarWorkspaceResult.data,
        economicCalendarLoadError: economicCalendarSettingsResult.error,
        schedules: schedulesResult.data,
        currentWorkspace: currentWorkspaceResult.data,
        watchlistAssets: watchlistAssetsResult.data,
        languages: languagesResult.data.languages,
        defaultOutputLanguageIsoCode:
          languagesResult.data.preferredLanguage ??
          languagesResult.data.currentLanguage,
        languageCatalogError: languagesResult.error,
        scheduleLoadError: schedulesResult.error,
        botConnectionsLoadError: botConnectionsResult.error,
        currentWorkspaceLoadError: currentWorkspaceResult.error,
        watchlistAssetsLoadError: watchlistAssetsResult.error,
        sectionAccess,
        manageAccess,
        scheduleActions,
      }}
      canCreateBotConnections={canCreateBotConnections}
    />
  )
}
