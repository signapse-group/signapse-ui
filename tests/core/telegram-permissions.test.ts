import { describe, expect, it } from "vitest"

import {
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
})
