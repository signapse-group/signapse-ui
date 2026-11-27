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
  TELEGRAM_FEATURE_SETTING_UPDATE_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_READ_PERMISSION,
  TELEGRAM_MARKET_NEWS_ROUTING_UPDATE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_CREATE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_DELETE_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_READ_PERMISSION,
  TELEGRAM_MARKET_ANALYSIS_SCHEDULE_UPDATE_PERMISSION,
  TELEGRAM_NAV_PERMISSIONS,
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
  })

  it("keeps read, manage, and delete independent from create", () => {
    const readOnly = [TELEGRAM_BOT_CONNECTION_READ_PERMISSION]
    const manageOnly = [TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION]
    const deleteOnly = [TELEGRAM_BOT_CONNECTION_DELETE_PERMISSION]

    expect(canAccessTelegramConfiguration(readOnly)).toBe(true)
    expect(getTelegramSectionAccess(readOnly).botConnections).toBe(true)
    expect(getTelegramManageAccess(readOnly).botConnections).toBe(false)

    expect(canAccessTelegramConfiguration(manageOnly)).toBe(false)
    expect(getTelegramSectionAccess(manageOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(manageOnly)).toMatchObject({
      botConnections: true,
      botConnectionsDelete: false,
    })

    expect(canAccessTelegramConfiguration(deleteOnly)).toBe(false)
    expect(getTelegramSectionAccess(deleteOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(deleteOnly)).toMatchObject({
      botConnections: false,
      botConnectionsDelete: true,
    })
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
