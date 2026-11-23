import { describe, expect, it } from "vitest"

import {
  canAccessTelegramConfiguration,
  getTelegramManageAccess,
  getTelegramSectionAccess,
  TELEGRAM_BOT_CONNECTION_CREATE_PERMISSION,
  TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION,
  TELEGRAM_BOT_CONNECTION_READ_PERMISSION,
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

  it("keeps read and manage independent from create", () => {
    const readOnly = [TELEGRAM_BOT_CONNECTION_READ_PERMISSION]
    const manageOnly = [TELEGRAM_BOT_CONNECTION_MANAGE_PERMISSION]

    expect(canAccessTelegramConfiguration(readOnly)).toBe(true)
    expect(getTelegramSectionAccess(readOnly).botConnections).toBe(true)
    expect(getTelegramManageAccess(readOnly).botConnections).toBe(false)

    expect(canAccessTelegramConfiguration(manageOnly)).toBe(false)
    expect(getTelegramSectionAccess(manageOnly).botConnections).toBe(false)
    expect(getTelegramManageAccess(manageOnly).botConnections).toBe(true)
  })
})
