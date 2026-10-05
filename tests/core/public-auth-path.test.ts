import { describe, expect, it } from "vitest"

import { isPublicAuthPathname } from "@/app/lib/auth/public-path"
import { negotiateLocale } from "@/app/lib/i18n/routing"

describe("public authentication boundary", () => {
  it.each([
    "/vi/sign-in",
    "/en/sign-in/",
    "/vi/sign-in/factor-one",
    "/en/sign-in/sso-callback",
  ])("allows login and its authentication steps: %s", (pathname) => {
    expect(isPublicAuthPathname(pathname)).toBe(true)
  })

  it.each([
    "/",
    "/vi",
    "/en/",
    "/sign-in",
    "/fr/sign-in",
    "/vi/sign-in-evil",
    "/en/sign-up",
    "/vi/dashboard",
    "/en/account",
    "/vi/articles",
    "/en/articles/published-post",
    "/vi/editor",
    "/en/dashboard-prototype",
    "/api/user",
    "/trpc/workspaces",
  ])("requires authentication: %s", (pathname) => {
    expect(isPublicAuthPathname(pathname)).toBe(false)
  })
})

describe("entry locale negotiation", () => {
  it("honors supported preferences and falls back to Vietnamese", () => {
    expect(negotiateLocale(null)).toBe("vi")
    expect(negotiateLocale("fr-FR, en;q=0.8")).toBe("en")
    expect(negotiateLocale("fr-FR")).toBe("vi")
  })
})
