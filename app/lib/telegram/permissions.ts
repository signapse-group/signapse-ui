import {
  hasAnyPermission,
  hasPermission,
  type PermissionCollection,
} from "@/app/lib/permissions"
import {
  TelegramManageAccess,
  TelegramSectionAccess,
} from "@/app/lib/telegram/definitions"

export const TELEGRAM_BOT_CONNECTION_READ_PERMISSION =
  "telegram-bot-connection:read"
export const TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION =
  "telegram-bot-connection:create"
export const TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION =
  "telegram-bot-connection:manage"
export const TELEGRAM_BOT_CONNECTION_DELETE_PERMISSION =
  "telegram-bot-connection:delete"
export const TELEGRAM_DESTINATION_READ_PERMISSION = "telegram-destination:read"
export const TELEGRAM_DESTINATION_MANAGE_PERMISSION =
  "telegram-destination:manage"
export const TELEGRAM_FEATURE_SETTING_READ_PERMISSION =
  "telegram-feature-setting:read"
export const TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION =
  "telegram-feature-setting:update"
export const TELEGRAM_ECONOMIC_CALENDAR_ROUTING_READ_PERMISSION =
  "telegram-economic-calendar-routing:read"
export const TELEGRAM_ECONOMIC_CALENDAR_ROUTING_UPDATE_PERMISSION =
  "telegram-economic-calendar-routing:update"
export const TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION =
  "telegram-market-news-routing:read"
export const TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION =
  "telegram-market-news-routing:update"
export const TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION =
  "telegram-market-analysis-schedule:read"
export const TELEGRAM_MARKET_ANALYSIS_SCHEDULE_MANAGE_PERMISSION =
  "telegram-market-analysis-schedule:manage"

export const TELEGRAM_READ_PERMISSIONS = [
  TELEGRAM_BOT_CONNECTION_READ_PERMISSION,
  TELEGRAM_DESTINATION_READ_PERMISSION,
  TELEGRAM_FEATURE_SETTING_READ_PERMISSION,
  TELEGRAM_ECONOMIC_CALENDAR_ROUTING_READ_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION,
] as const

export const TELEGRAM_NAV_PERMISSIONS = [
  ...TELEGRAM_READ_PERMISSIONS,
  TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION,
] as const

export function canAccessTelegramConfiguration(
  permissions: PermissionCollection
): boolean {
  return hasAnyPermission(permissions, TELEGRAM_NAV_PERMISSIONS)
}

export function getTelegramSectionAccess(
  permissions: PermissionCollection
): TelegramSectionAccess {
  return {
    botConnections: hasPermission(
      permissions,
      TELEGRAM_BOT_CONNECTION_READ_PERMISSION
    ),
    destinations: hasPermission(
      permissions,
      TELEGRAM_DESTINATION_READ_PERMISSION
    ),
    featureSettings: hasPermission(
      permissions,
      TELEGRAM_FEATURE_SETTING_READ_PERMISSION
    ),
    economicCalendarRouting: hasPermission(
      permissions,
      TELEGRAM_ECONOMIC_CALENDAR_ROUTING_READ_PERMISSION
    ),
    marketNewsRouting: hasPermission(
      permissions,
      TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION
    ),
    schedules: hasPermission(
      permissions,
      TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION
    ),
    watchlistAssets: hasPermission(permissions, "watchlist:read"),
  }
}

export function getTelegramManageAccess(
  permissions: PermissionCollection
): TelegramManageAccess {
  return {
    botConnections: hasPermission(
      permissions,
      TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION
    ),
    botConnectionsDelete: hasPermission(
      permissions,
      TELEGRAM_BOT_CONNECTION_DELETE_PERMISSION
    ),
    destinations: hasPermission(
      permissions,
      TELEGRAM_DESTINATION_MANAGE_PERMISSION
    ),
    featureSettings: hasPermission(
      permissions,
      TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION
    ),
    economicCalendarRouting: hasPermission(
      permissions,
      TELEGRAM_ECONOMIC_CALENDAR_ROUTING_UPDATE_PERMISSION
    ),
    marketNewsRouting: hasPermission(
      permissions,
      TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION
    ),
    schedules: hasPermission(
      permissions,
      TELEGRAM_MARKET_ANALYSIS_SCHEDULE_MANAGE_PERMISSION
    ),
  }
}
