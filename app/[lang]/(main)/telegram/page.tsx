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
  canReadTelegramConfiguration,
  getTelegramManageAccess,
  getTelegramSectionAccess,
} from "@/app/lib/telegram/permissions"
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

  if (!canReadTelegramConfiguration(permissions)) {
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
      />
    </Suspense>
  )
}

async function TelegramConfigurationContent({
  sectionAccess,
  manageAccess,
  canReadWorkspace,
}: {
  sectionAccess: ReturnType<typeof getTelegramSectionAccess>
  manageAccess: ReturnType<typeof getTelegramManageAccess>
  canReadWorkspace: boolean
}) {
  const currentWorkspace = await getCurrentWorkspaceSummary()
  const canReadAnyFeatureSettings = Object.values(
    sectionAccess.featureSettings
  ).some(Boolean)

  const schedulesPromise = sectionAccess.schedules
    ? getTelegramMarketAnalysisSchedules()
        .then((data) => ({ data, error: false }))
        .catch(() => ({ data: [], error: true }))
    : Promise.resolve({ data: [], error: false })

  const languagesPromise =
    sectionAccess.schedules || (canReadAnyFeatureSettings && currentWorkspace)
      ? getLanguages()
          .then((catalog) => ({ data: catalog.languages, error: false }))
          .catch(() => ({ data: [], error: true }))
      : Promise.resolve({ data: [], error: false })

  const [
    botConnections,
    destinationsResult,
    featureSettingsResult,
    schedulesResult,
    watchlistAssetsPage,
    languagesResult,
  ] = await Promise.all([
    sectionAccess.botConnections ? getTelegramBotConnections() : [],
    sectionAccess.destinations
      ? getTelegramDestinations()
          .then((data) => ({ data, error: false }))
          .catch(() => ({ data: [], error: true }))
      : Promise.resolve({ data: [], error: false }),
    canReadAnyFeatureSettings && currentWorkspace
      ? getTelegramFeatureSettings(currentWorkspace.id)
          .then((data) => ({ data, error: false }))
          .catch(() => ({ data: [], error: true }))
      : Promise.resolve({ data: [], error: false }),
    schedulesPromise,
    canReadWorkspace && sectionAccess.watchlistAssets && currentWorkspace
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
        featureSettings: featureSettingsResult.data,
        featureSettingsLoadError: featureSettingsResult.error,
        schedules: schedulesResult.data,
        currentWorkspace,
        watchlistAssets: watchlistAssetsPage?.content ?? [],
        languages: languagesResult.data,
        languageCatalogError: languagesResult.error,
        scheduleLoadError: schedulesResult.error,
        sectionAccess,
        manageAccess,
      }}
    />
  )
}
