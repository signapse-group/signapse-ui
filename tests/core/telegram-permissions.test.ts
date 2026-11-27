import { describe, expect, it } from "vitest"

import {
  canReadTelegramConfiguration,
  getTelegramManageAccess,
  getTelegramSectionAccess,
  TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION,
  TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION,
} from "@/app/lib/telegram/permissions"

describe("Telegram market-news routing permissions", () => {
  it("allows its dedicated reader into Telegram settings without broad route access", () => {
    const permissions = [TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION]

    expect(canReadTelegramConfiguration(permissions)).toBe(true)
    expect(getTelegramSectionAccess(permissions)).toMatchObject({
      featureSettings: false,
      marketNewsRouting: true,
      schedules: false,
    })
  })

  it("does not grant market-news updates from another route's permission", () => {
    expect(
      getTelegramManageAccess([TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION])
        .marketNewsRouting
    ).toBe(false)
    expect(
      getTelegramManageAccess([TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION])
        .marketNewsRouting
    ).toBe(true)
  })
})

describe("Telegram bot connection permissions", () => {
  it("keeps reading, connecting, and removing independent", () => {
    const manageOnly = ["telegram-bot-connection:manage"]
    const deleteOnly = ["telegram-bot-connection:delete"]
    const readOnly = ["telegram-bot-connection:read"]

    expect(getTelegramSectionAccess(manageOnly).botConnections).toBe(false)
    expect(getTelegramSectionAccess(deleteOnly).botConnections).toBe(false)
    expect(getTelegramSectionAccess(readOnly).botConnections).toBe(true)

    expect(getTelegramManageAccess(manageOnly)).toMatchObject({
      botConnections: true,
      botConnectionsDelete: false,
    })
    expect(getTelegramManageAccess(deleteOnly)).toMatchObject({
      botConnections: false,
      botConnectionsDelete: true,
    })
  })
})
