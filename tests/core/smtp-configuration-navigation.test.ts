import { describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import {
  SMTP_CONFIGURATION_MANAGE_PERMISSION,
  SMTP_CONFIGURATION_READ_PERMISSION,
} from "@/app/lib/smtp-configuration/permissions"
import { createSiteConfig, filterNavItemsByPermissions } from "@/config/site"

describe("Email delivery navigation", () => {
  const sections = createSiteConfig(en).navMain

  it("shows the localized route under System configuration for readers", () => {
    const filtered = filterNavItemsByPermissions(sections, [
      SMTP_CONFIGURATION_READ_PERMISSION,
    ])
    const systemConfiguration = filtered
      .flatMap((section) => section.items)
      .find((item) => item.id === "system-configuration")

    expect(systemConfiguration?.items).toContainEqual(
      expect.objectContaining({
        id: "email-delivery",
        title: en.navigation.emailDelivery,
        url: "/email-delivery",
      })
    )
  })

  it("hides the item from manage-only users and users without read permission", () => {
    for (const permissions of [[], [SMTP_CONFIGURATION_MANAGE_PERMISSION]]) {
      const filtered = filterNavItemsByPermissions(sections, permissions)
      const ids = filtered.flatMap((section) =>
        section.items.flatMap((item) => [
          item.id,
          ...(item.items?.map((subItem) => subItem.id) ?? []),
        ])
      )

      expect(ids).not.toContain("email-delivery")
      expect(ids).not.toContain("system-configuration")
    }
  })
})
