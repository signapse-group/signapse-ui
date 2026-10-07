import { describe, expect, it } from "vitest"

import { createSiteConfig, filterNavItemsByPermissions } from "@/config/site"
import { vi } from "@/app/lib/i18n/dictionaries/vi"

describe("contact request navigation permissions", () => {
  const sections = createSiteConfig(vi).navMain

  it("shows the destination to any permission holder and hides it otherwise", () => {
    const permissionSections = filterNavItemsByPermissions(sections, [
      "contact-request:read",
    ])
    const deniedSections = filterNavItemsByPermissions(sections, [])
    const allPermissionSections = filterNavItemsByPermissions(sections, ["*"])

    expect(
      permissionSections
        .flatMap((section) => section.items)
        .map((item) => item.id)
    ).toContain("contact-requests")
    expect(
      deniedSections.flatMap((section) => section.items).map((item) => item.id)
    ).not.toContain("contact-requests")
    expect(
      allPermissionSections
        .flatMap((section) => section.items)
        .map((item) => item.id)
    ).toContain("contact-requests")
  })
})
