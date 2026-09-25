export const fixtureContracts = [
  { method: "GET", path: "/me", mapping: "getMe", status: 200 },
  { method: "GET", path: "/me/feedback-submissions", mapping: "getPersonalFeedback", status: 200 },
  { method: "POST", path: "/me/feedback-submissions", mapping: "createFeedbackSubmission", status: 200 },
  { method: "GET", path: "/me/feedback-submissions/{id}", mapping: "getPersonalFeedbackDetail", status: 200 },
  { method: "DELETE", path: "/me/feedback-submissions/{id}", mapping: "withdrawFeedback", status: 204 },
  { method: "GET", path: "/me/feedback-submissions/{id}/screenshot", mapping: "getPersonalFeedbackScreenshot", status: 200 },
  { method: "GET", path: "/feedback-submissions", mapping: "getModerationFeedback", status: 200 },
  { method: "GET", path: "/feedback-submissions/{id}", mapping: "getModerationFeedbackDetail", status: 200 },
  { method: "POST", path: "/feedback-submissions/{id}/review", mapping: "reviewFeedback", status: 200 },
  { method: "GET", path: "/feedback-submissions/{id}/screenshot", mapping: "getModerationFeedbackScreenshot", status: 200 },
  { method: "DELETE", path: "/feedback-submissions/{id}", mapping: "deleteFeedback", status: 204 },
  { method: "GET", path: "/me/workspaces", mapping: "getMyWorkspaces", status: 200 },
  { method: "POST", path: "/me/workspaces", mapping: "createWorkspace", status: 200 },
  { method: "PUT", path: "/me/workspaces/{id}", mapping: "updateWorkspace", status: 200 },
  { method: "PATCH", path: "/me/workspaces/{id}/set-current", mapping: "setCurrentWorkspace", status: 200 },
  { method: "GET", path: "/dashboard/summary", mapping: "getDashboardSummary", status: 200 },
  { method: "GET", path: "/graph-view", mapping: "getGraphView", status: 200 },
  { method: "GET", path: "/watchlists/assets", mapping: "getWorkspaceWatchlistAssets", status: 200 },
  { method: "GET", path: "/watchlists", mapping: "getWorkspaceWatchlistAssets", status: 200 },
  { method: "POST", path: "/watchlists/assets", mapping: "addAssetsToWorkspaceWatchlist", status: 200 },
  { method: "DELETE", path: "/watchlists/assets/{assetId}", mapping: "removeAssetFromWorkspaceWatchlist", status: 204 },
  { method: "GET", path: "/blogs/{id}", mapping: "getBlogPost", status: 200 },
  { method: "GET", path: "/news-articles", mapping: "getNewsArticles", status: 200 },
  { method: "GET", path: "/news-articles/{id}", mapping: "getNewsArticleById", status: 200 },
  { method: "GET", path: "/events", mapping: "getEvents", status: 200 },
  { method: "GET", path: "/events/{id}", mapping: "getEventById", status: 200 },
  { method: "GET", path: "/me/notes", mapping: "getPersonalNotes", status: 200 },
  { method: "GET", path: "/me/notes/{id}", mapping: "getPersonalNote", status: 200 },
  { method: "POST", path: "/me/notes", mapping: "createPersonalNote", status: 200 },
  { method: "PUT", path: "/me/notes/{id}", mapping: "updatePersonalNote", status: 200 },
  { method: "DELETE", path: "/me/notes/{id}", mapping: "deletePersonalNote", status: 204 },
  { method: "GET", path: "/telegram/bot-connections", mapping: "getTelegramBotConnections", status: 200 },
  { method: "POST", path: "/telegram/bot-connections", mapping: "createTelegramBotConnection", status: 200 },
  { method: "PATCH", path: "/telegram/bot-connections/{id}/disable", mapping: "disableTelegramBotConnection", status: 200 },
  { method: "DELETE", path: "/telegram/bot-connections/{id}", mapping: "deleteTelegramBotConnection", status: 204 },
  { method: "GET", path: "/telegram/destinations", mapping: "getTelegramDestinations", status: 200 },
  { method: "POST", path: "/telegram/destinations/link-token", mapping: "createTelegramLinkToken", status: 200 },
  { method: "POST", path: "/telegram/destinations/{id}/test-message", mapping: "sendTelegramTestMessage", status: 204 },
  { method: "PATCH", path: "/telegram/destinations/{id}/disable", mapping: "disableTelegramDestination", status: 200 },
  { method: "DELETE", path: "/telegram/destinations/{id}", mapping: "deleteTelegramDestination", status: 204 },
  { method: "GET", path: "/telegram/feature-settings", mapping: "getTelegramFeatureSettings", status: 200 },
  { method: "PUT", path: "/telegram/feature-settings", mapping: "updateTelegramFeatureSetting", status: 200 },
  { method: "GET", path: "/telegram/market-analysis-schedules", mapping: "getTelegramMarketAnalysisSchedules", status: 200 },
  { method: "POST", path: "/telegram/market-analysis-schedules", mapping: "createTelegramMarketAnalysisSchedule", status: 200 },
  { method: "PUT", path: "/telegram/market-analysis-schedules/{id}", mapping: "updateTelegramMarketAnalysisSchedule", status: 200 },
  { method: "PATCH", path: "/telegram/market-analysis-schedules/{id}/disable", mapping: "disableTelegramMarketAnalysisSchedule", status: 200 },
  { method: "DELETE", path: "/telegram/market-analysis-schedules/{id}", mapping: "deleteTelegramMarketAnalysisSchedule", status: 204 },
  { method: "GET", path: "/languages", mapping: "getLanguages", status: 200 },
  { method: "GET", path: "/market-charts/candles", mapping: "getMarketChartCandles", status: 200 },
  { method: "GET", path: "/market-charts/annotations", mapping: "getMarketChartAnnotations", status: 200 },
  { method: "GET", path: "/market-charts/economic-calendar-events", mapping: "getMarketChartEconomicCalendarEvents", status: 200 },
  { method: "GET", path: "/market-charts/live", mapping: "streamLive", status: 200 },
]

export function contractPathMatches(template, pathname) {
  const templateParts = template.split("/").filter(Boolean)
  const pathParts = pathname.split("/").filter(Boolean)

  return (
    templateParts.length === pathParts.length &&
    templateParts.every((part, index) =>
      part.startsWith("{") && part.endsWith("}")
        ? pathParts[index].length > 0
        : part === pathParts[index]
    )
  )
}
