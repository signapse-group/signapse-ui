import { describe, expect, it } from "vitest"

import {
  canAccessTelegramConfiguration,
  getTelegramScheduleActionAccess,
  getTelegramManageAccess,
  getTelegramSectionAccess,
} from "@/app/lib/telegram/permissions"

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

  it.each([
    ["create", "telegram-market-analysis-schedule:create"],
    ["update", "telegram-market-analysis-schedule:update"],
    ["delete", "telegram-market-analysis-schedule:delete"],
  ] as const)(
    "allows the Telegram route for schedule %s alone",
    (action, permission) => {
      const permissions = [permission]

      expect(canAccessTelegramConfiguration(permissions)).toBe(true)
      expect(getTelegramSectionAccess(permissions).schedules).toBe(false)
      expect(getTelegramScheduleActionAccess(permissions)).toEqual({
        create: action === "create",
        update: action === "update",
        delete: action === "delete",
      })
    }
  )
})
