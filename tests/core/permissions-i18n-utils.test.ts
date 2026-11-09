import { describe, expect, it } from "vitest"

import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/app/lib/i18n/format"
import {
  getIntlLocale,
  isAppLocale,
  parseAppLocale,
} from "@/app/lib/i18n/config"
import {
  getPathLocale,
  negotiateLocale,
  replacePathLocale,
  stripLocaleFromPathname,
  withLocalePath,
} from "@/app/lib/i18n/routing"
import { formatMessage } from "@/app/lib/i18n/messages"
import { hasAnyPermission, hasPermission } from "@/app/lib/permissions"
import { canReadNewsArticles } from "@/app/lib/news-articles/permissions"
import {
  buildFilterQuery,
  buildSortQuery,
  convertSearchCondition,
  queryParamsToString,
} from "@/app/lib/utils"
import { FIXED_LOCALE } from "@/tests/support/fixtures"

describe("permission boundaries", () => {
  it("fails closed for a required permission when the collection is absent", () => {
    expect(hasPermission([], "market-query:execute")).toBe(false)
    expect(hasPermission(["news:read"], "market-query:execute")).toBe(false)
  })

  it("supports wildcard, optional permissions, and any-of checks", () => {
    expect(hasPermission(["*"], "market-query:execute")).toBe(true)
    expect(hasPermission([], undefined)).toBe(true)
    expect(hasPermission([], null)).toBe(true)
    expect(
      hasAnyPermission(["news:read"], ["market-query:execute", "news:read"])
    ).toBe(true)
    expect(hasAnyPermission([], ["market-query:execute"])).toBe(false)
  })

  it("requires only the canonical Article read permission", () => {
    expect(canReadNewsArticles(["news-article:read"])).toBe(true)
    expect(canReadNewsArticles(["news-outlet:read"])).toBe(false)
    expect(canReadNewsArticles(["source-document:read"])).toBe(false)
    expect(canReadNewsArticles(["USER", "ADMIN"])).toBe(false)
  })
})

describe("locale configuration and routing", () => {
  it("normalizes supported and unsupported locale inputs", () => {
    expect(isAppLocale("vi")).toBe(true)
    expect(isAppLocale("fr")).toBe(false)
    expect(parseAppLocale("en")).toBe("en")
    expect(parseAppLocale("fr")).toBe(FIXED_LOCALE)
    expect(getIntlLocale("en")).toBe("en-US")
  })

  it("handles locale-aware paths without duplicating a locale segment", () => {
    expect(getPathLocale("/en/dashboard")).toBe("en")
    expect(getPathLocale("/dashboard")).toBeNull()
    expect(stripLocaleFromPathname("/en/dashboard/")).toBe("/dashboard")
    expect(stripLocaleFromPathname("/en")).toBe("/")
    expect(withLocalePath("dashboard", "en")).toBe("/en/dashboard")
    expect(withLocalePath("/vi/dashboard", "en")).toBe("/en/dashboard")
    expect(replacePathLocale("/dashboard", "en")).toBe("/en/dashboard")
  })

  it("negotiates the highest-quality supported language and falls back", () => {
    expect(negotiateLocale("fr-CA, en-US;q=0.9, vi;q=0.8")).toBe("en")
    expect(negotiateLocale("vi-VN, en;q=0.1")).toBe("vi")
    expect(negotiateLocale(null)).toBe("vi")
  })

  it("keeps formatting and message interpolation deterministic", () => {
    expect(formatDate("2026-07-29T00:00:00.000Z", "en")).toContain("2026")
    expect(formatDate("not-a-date", "en", "Fallback")).toBe("Fallback")
    expect(formatNumber(1234.5, "en")).toBe("1,234.5")
    expect(formatNumber(1234.5, FIXED_LOCALE)).toBe("1.234,5")
    expect(formatPercent(0.125, "en")).toBe("12.5%")
    expect(formatCurrency(1250000, "vi", "VND")).toContain("1.250.000")
    expect(
      formatMessage("{count} items in {name}", { count: 2, name: "Inbox" })
    ).toBe("2 items in Inbox")
  })
})

describe("query serialization", () => {
  it("escapes search values and formats supported operators", () => {
    expect(
      convertSearchCondition("title", "containsIgnoreCase", "O'Brien")
    ).toBe("containsIgnoreCase(title,'O''Brien')")
    expect(convertSearchCondition("id", "gt", "12")).toBe("id gt 12")
    expect(convertSearchCondition("status", "in", ["ACTIVE", "O'K"])).toBe(
      "status in ('ACTIVE','O''K')"
    )
    expect(() => convertSearchCondition("status", "unsupported", "x")).toThrow(
      "Unsupported operator"
    )
  })

  it("builds filters, sorts, and URL query parameters", () => {
    expect(
      buildFilterQuery({
        "title[containsIgnoreCase]": "inflation",
        "status[in]": ["ACTIVE", "PAUSED"],
      })
    ).toBe(
      "containsIgnoreCase(title,'inflation') and status in ('ACTIVE','PAUSED')"
    )
    expect(
      buildFilterQuery({
        "name[containsIgnoreCase],symbol[containsIgnoreCase]": "gold",
      })
    ).toBe(
      "(containsIgnoreCase(name,'gold') or containsIgnoreCase(symbol,'gold'))"
    )
    expect(buildFilterQuery({ "name[containsIgnoreCase]": "" })).toBe("")
    expect(buildSortQuery("name_desc,createdDate")).toEqual([
      { field: "name", direction: "desc" },
      { field: "createdDate", direction: "asc" },
    ])
    expect(
      queryParamsToString({
        filter: "status eq 'ACTIVE'",
        page: 2,
        size: 20,
        sort: [{ field: "createdDate", direction: "desc" }],
      })
    ).toBe(
      "%24filter=status+eq+%27ACTIVE%27&page=2&size=20&sort=createdDate%2Cdesc"
    )
  })
})
