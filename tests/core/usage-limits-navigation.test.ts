import { describe, expect, it } from "vitest"

import { createSiteConfig, filterNavItemsByPermissions } from "@/config/site"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

describe("usage limits navigation cleanup", () => {
  it.each([
    ["en", en],
    ["vi", viDictionary],
  ] as const)("does not expose a separate route in %s", (_, dictionary) => {
    const sections = filterNavItemsByPermissions(
      createSiteConfig(dictionary).navMain,
      []
    )
    const navigationItems = sections.flatMap((section) =>
      section.items.flatMap((item) => [item, ...(item.items ?? [])])
    )

    expect(
      navigationItems.some(
        (item) => item.id === "usage-limits" || item.url === "/usage-limits"
      )
    ).toBe(false)
  })
})
