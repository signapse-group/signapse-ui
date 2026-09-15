import { describe, expect, it } from "vitest"

import {
  HERO_JOURNEY_HREF,
  REQUEST_ACCESS_HREF,
  createLandingAccessModel,
} from "@/app/[lang]/landing-access"
import { buildLandingLocaleHref } from "@/app/[lang]/landing-locale-links"
import {
  buildLandingMetadata,
  resolveLandingDeploymentPolicy,
} from "@/app/lib/public-landing/metadata-policy"
import { isPublicLandingPathname } from "@/app/lib/public-landing/public-path"
import { negotiateLocale } from "@/app/lib/i18n/routing"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi } from "@/app/lib/i18n/dictionaries/vi"

const accessCopy = {
  nav: {
    requestAccess: "Request access",
    signIn: "Sign in",
    openDashboard: "Open dashboard",
  },
  cta: {
    requestAccess: "Request access",
    bookDemo: "Book a demo",
    bookDemoAria: "Book a Signapse demo",
    signIn: "Sign in",
    openDashboard: "Open dashboard",
    requestAccessAria: "Request access to Signapse",
    signInAria: "Sign in to Signapse",
    openDashboardAria: "Open the Signapse dashboard",
    exploreJourney: "Explore the platform",
    exploreJourneyAria: "Explore the Signapse platform",
    requestAccessNote: "This action opens your email application.",
  },
  footer: {
    requestAccessEmail: "access@signapse.cloud",
  },
}

describe("public landing pathname policy", () => {
  it.each([
    "/vi",
    "/vi/",
    "/en",
    "/en/",
    "/vi/sign-in",
    "/en/sign-in/continue",
  ])("allows %s", (pathname) => {
    expect(isPublicLandingPathname(pathname)).toBe(true)
  })

  it.each([
    "/vi/sign-in-evil",
    "/en/sign-in-like",
    "/vi/dashboard",
    "/en/events",
    "/api/user",
    "/trpc/workspaces",
    "/",
  ])("keeps %s protected", (pathname) => {
    expect(isPublicLandingPathname(pathname)).toBe(false)
  })
})

describe("root locale negotiation", () => {
  it("keeps Vietnamese as the fallback and honors supported preferences", () => {
    expect(negotiateLocale(null)).toBe("vi")
    expect(negotiateLocale("fr-FR, en;q=0.8")).toBe("en")
    expect(negotiateLocale("fr-FR")).toBe("vi")
  })
})

describe("landing showcase claim policy", () => {
  it.each([
    ["vi", vi.landing.showcase],
    ["en", en.landing.showcase],
  ] as const)(
    "keeps the %s Telegram simulation labeled and bounded",
    (_, copy) => {
      const serialized = JSON.stringify(copy)

      expect(copy.telegram.demoLabel).toBe("DEMO")
      expect(serialized).not.toMatch(
        /giá chạm vùng theo dõi|price reached the watch zone|delivered|read receipt|public channel|kênh công khai|trading signal/i
      )
      expect(serialized).not.toContain("strategyEyebrow")
      expect(serialized).not.toContain("telegramAlertTitle")
    }
  )
})

describe("landing access model", () => {
  it("uses the locked anonymous destinations", () => {
    const model = createLandingAccessModel("vi", false, accessCopy)

    expect(model.headerPrimary.href).toBe(REQUEST_ACCESS_HREF)
    expect(model.headerSecondary?.href).toBe("/vi/sign-in")
    expect(model.heroPrimary.href).toBe(REQUEST_ACCESS_HREF)
    expect(model.heroSecondary.href).toBe(HERO_JOURNEY_HREF)
    expect(model.finalCta.href).toBe(REQUEST_ACCESS_HREF)
    expect(model.footerAppEntry.href).toBe("/vi/sign-in")
    expect(model.footerRequestAccess.label).toBe("access@signapse.cloud")
  })

  it("uses localized dashboard destinations for authenticated visitors", () => {
    const model = createLandingAccessModel("en", true, accessCopy)

    expect(model.headerPrimary.href).toBe("/en/dashboard")
    expect(model.headerSecondary).toBeNull()
    expect(model.heroPrimary.href).toBe("/en/dashboard")
    expect(model.heroSecondary.href).toBe(HERO_JOURNEY_HREF)
    expect(model.finalCta.href).toBe("/en/dashboard")
    expect(model.footerAppEntry.href).toBe("/en/dashboard")
  })
})

describe("landing locale links", () => {
  it("preserves query and supported hashes in both directions", () => {
    expect(
      buildLandingLocaleHref("/vi", "source=hero", "#how-it-works", "en")
    ).toBe("/en?source=hero#how-it-works")
    expect(
      buildLandingLocaleHref("/en", "source=footer", "#access", "vi")
    ).toBe("/vi?source=footer#access")
    expect(
      buildLandingLocaleHref("/vi", "source=hero", "#knowledge-graph", "en")
    ).toBe("/en?source=hero#knowledge-graph")
  })

  it("drops unsupported hashes while preserving the query", () => {
    expect(
      buildLandingLocaleHref("/vi", "source=hero", "#unsupported", "en")
    ).toBe("/en?source=hero")
    expect(
      buildLandingLocaleHref("/vi", "source=hero", "#workspace-ai", "en")
    ).toBe("/en?source=hero")
  })
})

describe("landing metadata policy", () => {
  const input = {
    locale: "vi" as const,
    title: "Signapse | Market Intelligence Platform",
    description: "Localized description",
    socialImageAlt: "Localized social card",
  }

  it("builds preview metadata with canonical, alternates, and noindex", () => {
    const metadata = buildLandingMetadata(input, {
      publicOrigin: "https://dev.signapse.cloud",
      indexable: false,
    })

    expect(metadata.robots).toEqual({ index: false, follow: true })
    expect(metadata.alternates).toMatchObject({
      canonical: "https://dev.signapse.cloud/vi",
      languages: {
        vi: "https://dev.signapse.cloud/vi",
        en: "https://dev.signapse.cloud/en",
        "x-default": "https://dev.signapse.cloud/",
      },
    })
    expect(metadata.openGraph).toMatchObject({
      url: "https://dev.signapse.cloud/vi",
      images: [
        expect.objectContaining({
          url: "https://dev.signapse.cloud/vi/opengraph-image",
          width: 1200,
          height: 630,
        }),
      ],
    })
  })

  it("omits canonical and alternates for an unknown non-indexable origin", () => {
    const metadata = buildLandingMetadata(input, {
      publicOrigin: "not-an-origin",
      indexable: false,
    })

    expect(metadata.robots).toEqual({ index: false, follow: true })
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.metadataBase).toBeUndefined()
  })

  it("rejects every non-apex indexable origin", () => {
    expect(() =>
      resolveLandingDeploymentPolicy({
        publicOrigin: "https://dev.signapse.cloud",
        indexable: true,
      })
    ).toThrow(/https:\/\/signapse\.cloud/)
    expect(() => resolveLandingDeploymentPolicy({ indexable: true })).toThrow(
      /https:\/\/signapse\.cloud/
    )
  })

  it("allows the exact apex origin without noindex", () => {
    const metadata = buildLandingMetadata(input, {
      publicOrigin: "https://signapse.cloud/",
      indexable: true,
    })

    expect(metadata.robots).toBeUndefined()
    expect(metadata.alternates).toMatchObject({
      canonical: "https://signapse.cloud/vi",
    })
  })
})
