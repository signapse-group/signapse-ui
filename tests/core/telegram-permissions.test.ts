import { describe, expect, it } from "vitest"

import {
  canReadTelegramConfiguration,
  getTelegramManageAccess,
  getTelegramSectionAccess,
} from "@/app/lib/telegram/permissions"

describe("Telegram route permissions", () => {
  it("grants only Economic calendar read access without workspace or list permissions", () => {
    const permissions = ["telegram-economic-calendar-routing:read"]
    const access = getTelegramSectionAccess(permissions)

    expect(canReadTelegramConfiguration(permissions)).toBe(true)
    expect(access.featureSettings).toEqual({
      ECONOMIC_CALENDAR_ALERT: true,
      MARKET_NEWS_ALERT: false,
      SCHEDULED_MARKET_ANALYSIS: false,
    })
    expect(access.botConnections).toBe(false)
    expect(access.destinations).toBe(false)
    expect(access.schedules).toBe(false)
    expect(access.watchlistAssets).toBe(false)
  })

  it("does not grant Economic calendar read from another route or the legacy permission", () => {
    const marketNews = getTelegramSectionAccess([
      "telegram-market-news-routing:read",
    ])
    const legacy = getTelegramSectionAccess(["telegram-feature-setting:read"])

    expect(marketNews.featureSettings).toEqual({
      ECONOMIC_CALENDAR_ALERT: false,
      MARKET_NEWS_ALERT: true,
      SCHEDULED_MARKET_ANALYSIS: false,
    })
    expect(legacy.featureSettings).toEqual({
      ECONOMIC_CALENDAR_ALERT: false,
      MARKET_NEWS_ALERT: false,
      SCHEDULED_MARKET_ANALYSIS: true,
    })
  })

  it("keeps Economic calendar update separate from read and other route updates", () => {
    const permissions = ["telegram-economic-calendar-routing:update"]

    expect(canReadTelegramConfiguration(permissions)).toBe(false)
    expect(getTelegramManageAccess(permissions).featureSettings).toEqual({
      ECONOMIC_CALENDAR_ALERT: true,
      MARKET_NEWS_ALERT: false,
      SCHEDULED_MARKET_ANALYSIS: false,
    })
    expect(
      getTelegramManageAccess(["telegram-feature-setting:update"])
        .featureSettings
    ).toEqual({
      ECONOMIC_CALENDAR_ALERT: false,
      MARKET_NEWS_ALERT: false,
      SCHEDULED_MARKET_ANALYSIS: true,
    })
  })
})
