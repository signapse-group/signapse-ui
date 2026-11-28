import { describe, expect, it } from "vitest"

import {
  canAccessTelegramConfiguration,
  getTelegramManageAccess,
  getTelegramScheduleActionAccess,
  getTelegramSectionAccess,
  TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION,
  TELEGRAM_BOT_CONNECTION_DELETE_PERMISSION,
  TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION,
  TELEGRAM_BOT_CONNECTION_READ_PERMISSION,
  TELEGRAM_BOT_CONNECTION_UPDATE_PERMISSION,
  TELEGRAM_ECONOMIC_CALENDAR_ROUTING_READ_PERMISSION,
  TELEGRAM_ECONOMIC_CALENDAR_ROUTING_UPDATE_PERMISSION,
  TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_CREATE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_DELETE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_UPDATE_PERMISSION,
  TELEGRAM_NAV_PERMISSIONS,
  TELEGRAM_SIGNAL_ENGINE_ROUTING_PERMISSION,
} from "@/app/lib/telegram/permissions"

describe("Telegram configuration permissions", () => {
  it("allows create-only users into the page without granting list reads", () => {
    const permissions = [TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION]

    expect(canAccessTelegramConfiguration(permissions)).toBe(true)
    expect(TELEGRAM_NAV_PERMISSIONS).toContain(
      TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION
    )
    expect(getTelegramSectionAccess(permissions).botConnections).toBe(false)
    expect(getTelegramManageAccess(permissions).botConnections).toBe(false)
    expect(getTelegramManageAccess(permissions).botConnectionsUpdate).toBe(false)
  })

  it("keeps read, manage, and delete independent from create", () => {
    const readOnly = [TELEGRAM_BOT_CONNECTION_READ_PERMISSION]
    const manageOnly = [TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION]
    const deleteOnly = [TELEGRAM_BOT_CONNECTION_DELETE_PERMISSION]

    expect(canAccessTelegramConfiguration(readOnly)).toBe(true)
    expect(getTelegramSectionAccess(readOnly).botConnections).toBe(true)
    expect(getTelegramManageAccess(readOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(readOnly).botConnectionsUpdate).toBe(false)

    expect(canAccessTelegramConfiguration(manageOnly)).toBe(false)
    expect(getTelegramSectionAccess(manageOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(manageOnly)).toMatchObject({
      botConnections: true,
      botConnectionsUpdate: false,
      botConnectionsDelete: false,
    })

    expect(canAccessTelegramConfiguration(deleteOnly)).toBe(false)
    expect(getTelegramSectionAccess(deleteOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(deleteOnly)).toMatchObject({
      botConnections: false,
      botConnectionsUpdate: false,
      botConnectionsDelete: true,
    })
  })

  it("keeps Reconnect update separate from read, create, manage, and remove", () => {
    const updateOnly = [TELEGRAM_BOT_CONNECTION_UPDATE_PERMISSION]

    expect(canAccessTelegramConfiguration(updateOnly)).toBe(false)
    expect(getTelegramSectionAccess(updateOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(updateOnly)).toMatchObject({
      botConnections: false,
      botConnectionsUpdate: true,
      botConnectionsDelete: false,
    })

    expect(
      getTelegramManageAccess([
        TELEGRAM_BOT_CONNECTION_READ_PERMISSION,
        TELEGRAM_BOT_CONNECTION_UPDATE_PERMISSION,
      ])
    ).toMatchObject({ botConnectionsUpdate: true })
  })
})

describe("Telegram market-news routing permissions", () => {
  it("allows its dedicated reader into Telegram settings without broad route access", () => {
    const permissions = [TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION]

    expect(canAccessTelegramConfiguration(permissions)).toBe(true)
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

describe("Scheduled analysis permissions", () => {
  it("opens for schedule read without granting mutation actions", () => {
    const permissions = [TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION]

    expect(canAccessTelegramConfiguration(permissions)).toBe(true)
    expect(getTelegramSectionAccess(permissions).schedules).toBe(true)
    expect(getTelegramScheduleActionAccess(permissions)).toEqual({
      create: false,
      update: false,
      delete: false,
    })
  })

  it("keeps create, update, and delete independent", () => {
    for (const [permission, action] of [
      [TELEGRAM_MARKET_ANALYSIS_SCHEDULE_CREATE_PERMISSION, "create"],
      [TELEGRAM_MARKET_ANALYSIS_SCHEDULE_UPDATE_PERMISSION, "update"],
      [TELEGRAM_MARKET_ANALYSIS_SCHEDULE_DELETE_PERMISSION, "delete"],
    ] as const) {
      expect(TELEGRAM_NAV_PERMISSIONS).toContain(permission)
      expect(canAccessTelegramConfiguration([permission])).toBe(true)
      expect(getTelegramScheduleActionAccess([permission])).toEqual({
        create: action === "create",
        update: action === "update",
        delete: action === "delete",
      })
    }
  })

  it("does not use the legacy manage grant", () => {
    const legacy = ["telegram-market-analysis-schedule:manage"]

    expect(canAccessTelegramConfiguration(legacy)).toBe(false)
    expect(getTelegramScheduleActionAccess(legacy)).toEqual({
      create: false,
      update: false,
      delete: false,
    })
  })
})

describe("Telegram Economic calendar routing permissions", () => {
  it("grants route read without workspace, destination-list, schedule, or other-route access", () => {
    const permissions = [TELEGRAM_ECONOMIC_CALENDAR_ROUTING_READ_PERMISSION]

    expect(canAccessTelegramConfiguration(permissions)).toBe(true)
    expect(getTelegramSectionAccess(permissions)).toMatchObject({
      economicCalendarRouting: true,
      featureSettings: false,
      marketNewsRouting: false,
      botConnections: false,
      destinations: false,
      schedules: false,
      watchlistAssets: false,
    })
    expect(getTelegramManageAccess(permissions).economicCalendarRouting).toBe(
      false
    )
  })

  it("does not grant Economic calendar access from another route or the legacy permission", () => {
    for (const permission of [
      TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION,
      "telegram-feature-setting:read",
    ]) {
      expect(
        getTelegramSectionAccess([permission]).economicCalendarRouting
      ).toBe(false)
    }

    expect(
      getTelegramManageAccess([TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION])
        .economicCalendarRouting
    ).toBe(false)
  })

  it("keeps Economic calendar update separate from route read and other update permissions", () => {
    const updateOnly = [TELEGRAM_ECONOMIC_CALENDAR_ROUTING_UPDATE_PERMISSION]

    expect(canAccessTelegramConfiguration(updateOnly)).toBe(false)
    expect(getTelegramManageAccess(updateOnly).economicCalendarRouting).toBe(
      true
    )
    expect(
      getTelegramManageAccess([TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION])
        .economicCalendarRouting
    ).toBe(false)
    expect(
      getTelegramSectionAccess([TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION])
        .economicCalendarRouting
    ).toBe(false)
  })
})

describe("Telegram Signal Engine routing permissions", () => {
  it("opens routing for the dedicated permission and uses it for updates", () => {
    const permissions = [TELEGRAM_SIGNAL_ENGINE_ROUTING_PERMISSION]

    expect(canAccessTelegramConfiguration(permissions)).toBe(true)
    expect(TELEGRAM_NAV_PERMISSIONS).toContain(
      TELEGRAM_SIGNAL_ENGINE_ROUTING_PERMISSION
    )
    expect(getTelegramSectionAccess(permissions)).toMatchObject({
      signalEngineRouting: true,
      featureSettings: false,
      marketNewsRouting: false,
      economicCalendarRouting: false,
      destinations: false,
    })
    expect(getTelegramManageAccess(permissions).signalEngineRouting).toBe(true)
  })

  it("does not grant Signal Engine routing from another route's permission", () => {
    expect(
      getTelegramSectionAccess([TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION])
        .signalEngineRouting
    ).toBe(false)
    expect(
      getTelegramManageAccess([TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION])
        .signalEngineRouting
    ).toBe(false)
  })
})
