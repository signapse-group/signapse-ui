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
import {
  getCurrentPermissions,
  getCurrentWorkspaceSummary,
} from "@/app/lib/permissions-server"
import {
  canAccessTelegramConfiguration,
  TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION,
  getTelegramManageAccess,
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

export default async function TelegramPage() {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])
  const sectionAccess = getTelegramSectionAccess(permissions)
  const manageAccess = getTelegramManageAccess(permissions)
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
      fallback={<TelegramConfigurationSkeleton sectionAccess={sectionAccess} />}
    >
      <TelegramConfigurationContent
        sectionAccess={sectionAccess}
        manageAccess={manageAccess}
        canReadWorkspace={hasPermission(permissions, "workspace:read")}
        canCreateBotConnections={canCreateBotConnections}
      />
    </Suspense>
  )
}

async function TelegramConfigurationContent({
  sectionAccess,
  manageAccess,
  canReadWorkspace,
  canCreateBotConnections,
}: {
  sectionAccess: ReturnType<typeof getTelegramSectionAccess>
  manageAccess: ReturnType<typeof getTelegramManageAccess>
  canReadWorkspace: boolean
  canCreateBotConnections: boolean
}) {
  const currentWorkspace = canReadWorkspace
    ? await getActiveWorkspaceForCurrentUser()
    : null
  const economicCalendarWorkspace = sectionAccess.economicCalendarRouting
    ? (currentWorkspace ?? (await getCurrentWorkspaceSummary()))
    : null

  const schedulesPromise = sectionAccess.schedules
    ? getTelegramMarketAnalysisSchedules()
        .then((data) => ({ data, error: false }))
        .catch(() => ({ data: [], error: true }))
    : Promise.resolve({ data: [], error: false })

  const languagesPromise =
    sectionAccess.schedules ||
    sectionAccess.marketNewsRouting ||
    sectionAccess.economicCalendarRouting
      ? getLanguages()
          .then((catalog) => ({ data: catalog.languages, error: false }))
          .catch(() => ({ data: [], error: true }))
      : Promise.resolve({ data: [], error: false })

  const destinationsPromise = sectionAccess.destinations
    ? getTelegramDestinations()
        .then((data) => ({ data, error: false }))
        .catch(() => ({ data: [], error: true }))
    : Promise.resolve({ data: [], error: false })

  const marketNewsSettingsPromise = sectionAccess.marketNewsRouting
    ? getTelegramFeatureSettings({ featureKey: "MARKET_NEWS_ALERT" })
        .then((data) => ({ data, error: false }))
        .catch(() => ({ data: [], error: true }))
    : Promise.resolve({ data: [], error: false })

  const economicCalendarSettingsPromise =
    sectionAccess.economicCalendarRouting && economicCalendarWorkspace
      ? getTelegramFeatureSettings({
          workspaceId: economicCalendarWorkspace.id,
          featureKey: "ECONOMIC_CALENDAR_ALERT",
        })
          .then((data) => ({ data, error: false }))
          .catch(() => ({ data: [], error: true }))
      : Promise.resolve({
          data: [],
          error: sectionAccess.economicCalendarRouting,
        })

  const [
    botConnections,
    destinationsResult,
    marketNewsSettingsResult,
    economicCalendarSettingsResult,
    schedulesResult,
    watchlistAssetsPage,
    languagesResult,
  ] = await Promise.all([
    sectionAccess.botConnections ? getTelegramBotConnections() : [],
    destinationsPromise,
    marketNewsSettingsPromise,
    economicCalendarSettingsPromise,
    schedulesPromise,
    sectionAccess.watchlistAssets && currentWorkspace
      ? getWorkspaceWatchlistAssets(WATCHLIST_ASSET_SEARCH)
      : null,
    languagesPromise,
  ])

  return (
    <TelegramConfigurationPage
      data={{
        botConnections,
        destinations: destinationsResult.data,
        destinationsLoadError: destinationsResult.error,
        featureSettings: marketNewsSettingsResult.data,
        featureSettingsLoadError: marketNewsSettingsResult.error,
        economicCalendarSettings: economicCalendarSettingsResult.data,
        economicCalendarWorkspace,
        economicCalendarLoadError: economicCalendarSettingsResult.error,
        schedules: schedulesResult.data,
        currentWorkspace,
        watchlistAssets: watchlistAssetsPage?.content ?? [],
        languages: languagesResult.data,
        languageCatalogError: languagesResult.error,
        scheduleLoadError: schedulesResult.error,
        sectionAccess,
        manageAccess,
      }}
      canCreateBotConnections={canCreateBotConnections}
    />
  )
}
