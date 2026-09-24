import { describe, expect, it } from "vitest"

import { createSiteConfig, filterNavItemsByPermissions } from "@/config/site"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

describe("usage limits navigation", () => {
  it.each([
    ["en", en],
    ["vi", viDictionary],
  ] as const)("exposes the protected route in %s", (_, dictionary) => {
    const sections = filterNavItemsByPermissions(
      createSiteConfig(dictionary).navMain,
      []
    )
    const usageLimits = sections
      .flatMap((section) => section.items)
      .find((item) => item.id === "usage-limits")

    expect(usageLimits).toMatchObject({
      title: dictionary.navigation.usageLimits,
      url: "/usage-limits",
    })
  })
})
