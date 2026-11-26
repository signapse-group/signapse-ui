import { Suspense } from "react"

import { getLanguages } from "@/app/api/languages/action"
import {
  getTelegramBotConnections,
  getTelegramDestinations,
  getTelegramFeatureSettings,
  getTelegramMarketAnalysisSchedules,
} from "@/app/api/telegram/action"
import { getWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import {
  canReadTelegramConfiguration,
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
  size: 100,
  sort: [{ field: "assetSymbol", direction: "asc" as const }],
}
// ponytail: preload up to 100 workspace assets; add pagination/search if this ceiling is exceeded.

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

  if (!canReadTelegramConfiguration(permissions)) {
    return (
      <AccessDenied
        description={dictionary.telegram.readDenied}
        permission="telegram-bot-connection:read"
      />
    )
  }

  return (
    <Suspense fallback={<TelegramConfigurationSkeleton />}>
      <TelegramConfigurationContent
        sectionAccess={sectionAccess}
        manageAccess={manageAccess}
        scheduleActions={scheduleActions}
        canReadWorkspace={hasPermission(permissions, "workspace:read")}
      />
    </Suspense>
  )
}

async function TelegramConfigurationContent({
  sectionAccess,
  manageAccess,
  scheduleActions,
  canReadWorkspace,
}: {
  sectionAccess: ReturnType<typeof getTelegramSectionAccess>
  manageAccess: ReturnType<typeof getTelegramManageAccess>
  scheduleActions: ReturnType<typeof getTelegramScheduleActionAccess>
  canReadWorkspace: boolean
}) {
  const currentWorkspacePromise = loadSection(
    canReadWorkspace ? () => getActiveWorkspaceForCurrentUser() : undefined,
    null
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
    sectionAccess.featureSettings
      ? () => getTelegramFeatureSettings()
      : undefined,
    []
  )
  const schedulesPromise = loadSection(
    sectionAccess.schedules
      ? () => getTelegramMarketAnalysisSchedules()
      : undefined,
    []
  )
  const languagesPromise = loadSection(
    sectionAccess.schedules || sectionAccess.featureSettings
      ? () => getLanguages().then((catalog) => catalog.languages)
      : undefined,
    []
  )
  const watchlistAssetsPromise = currentWorkspacePromise.then(
    ({ data: currentWorkspace }) =>
      loadSection(
        sectionAccess.watchlistAssets && currentWorkspace
          ? () =>
              getWorkspaceWatchlistAssets(WATCHLIST_ASSET_SEARCH).then(
                (page) => page.content
              )
          : undefined,
        []
      )
  )

  const [
    currentWorkspaceResult,
    botConnectionsResult,
    destinationsResult,
    featureSettingsResult,
    schedulesResult,
    watchlistAssetsResult,
    languagesResult,
  ] = await Promise.all([
    currentWorkspacePromise,
    botConnectionsPromise,
    destinationsPromise,
    featureSettingsPromise,
    schedulesPromise,
    watchlistAssetsPromise,
    languagesPromise,
  ])

  return (
    <TelegramConfigurationPage
      data={{
        botConnections: botConnectionsResult.data,
        destinations: destinationsResult.data,
        featureSettings: featureSettingsResult.data,
        schedules: schedulesResult.data,
        currentWorkspace: currentWorkspaceResult.data,
        watchlistAssets: watchlistAssetsResult.data,
        languages: languagesResult.data,
        languageCatalogError: languagesResult.error,
        scheduleLoadError: schedulesResult.error,
        botConnectionsLoadError: botConnectionsResult.error,
        destinationsLoadError: destinationsResult.error,
        featureSettingsLoadError: featureSettingsResult.error,
        currentWorkspaceLoadError: currentWorkspaceResult.error,
        watchlistAssetsLoadError: watchlistAssetsResult.error,
        sectionAccess,
        manageAccess,
        scheduleActions,
      }}
    />
  )
}
