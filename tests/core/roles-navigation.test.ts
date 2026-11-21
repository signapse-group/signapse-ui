import { describe, expect, it } from "vitest"

import { createSiteConfig, filterNavItemsByPermissions } from "@/config/site"
import { vi } from "@/app/lib/i18n/dictionaries/vi"

describe("roles navigation permissions", () => {
  const sections = createSiteConfig(vi).navMain

  function roleLinkFor(permissions: string[]) {
    return filterNavItemsByPermissions(sections, permissions)
      .flatMap((section) => section.items)
      .flatMap((item) => item.items ?? [])
      .find((item) => item.id === "roles")
  }

  it.each(["role:read", "role:create"])(
    "shows Roles to a holder of %s",
    (permission) => {
      expect(roleLinkFor([permission])).toMatchObject({
        id: "roles",
        url: "/roles",
      })
    }
  )

  it("does not show Roles to a holder of role:update only", () => {
    expect(roleLinkFor(["role:update"])).toBeUndefined()
  })

  it("shows Roles when either read or create is present", () => {
    expect(roleLinkFor(["role:read", "role:create"])).toBeDefined()
  })
})
