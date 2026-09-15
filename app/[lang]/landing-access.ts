import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { withLocalePath } from "@/app/lib/i18n/routing"

export const REQUEST_ACCESS_EMAIL = "access@signapse.cloud"
export const REQUEST_ACCESS_HREF = `mailto:${REQUEST_ACCESS_EMAIL}?subject=Signapse%20access%20request`
export const HERO_JOURNEY_HREF = "#product"

type LandingActionKind = "email" | "internal" | "anchor"

export type LandingAccessAction = {
  href: string
  kind: LandingActionKind
  label: string
  ariaLabel: string
}

export type LandingAccessModel = {
  headerPrimary: LandingAccessAction
  headerSecondary: LandingAccessAction | null
  heroPrimary: LandingAccessAction
  heroSecondary: LandingAccessAction
  finalCta: LandingAccessAction
  footerAppEntry: LandingAccessAction
  footerRequestAccess: LandingAccessAction
}

type LandingAccessCopy = {
  cta: Dictionary["landing"]["cta"]
  footer: Pick<Dictionary["landing"]["footer"], "requestAccessEmail">
}

export function createLandingAccessModel(
  locale: AppLocale,
  isAuthenticated: boolean,
  copy: LandingAccessCopy
): LandingAccessModel {
  const requestAccess: LandingAccessAction = {
    href: REQUEST_ACCESS_HREF,
    kind: "email",
    label: copy.cta.requestAccess,
    ariaLabel: copy.cta.requestAccessAria,
  }
  const bookDemo: LandingAccessAction = {
    href: REQUEST_ACCESS_HREF,
    kind: "email",
    label: copy.cta.bookDemo,
    ariaLabel: copy.cta.bookDemoAria,
  }
  const dashboard: LandingAccessAction = {
    href: withLocalePath("/dashboard", locale),
    kind: "internal",
    label: copy.cta.openDashboard,
    ariaLabel: copy.cta.openDashboardAria,
  }
  const signIn: LandingAccessAction = {
    href: withLocalePath("/sign-in", locale),
    kind: "internal",
    label: copy.cta.signIn,
    ariaLabel: copy.cta.signInAria,
  }
  const journey: LandingAccessAction = {
    href: HERO_JOURNEY_HREF,
    kind: "anchor",
    label: copy.cta.exploreJourney,
    ariaLabel: copy.cta.exploreJourneyAria,
  }

  return {
    headerPrimary: isAuthenticated ? dashboard : requestAccess,
    headerSecondary: isAuthenticated ? null : signIn,
    heroPrimary: isAuthenticated ? dashboard : bookDemo,
    heroSecondary: journey,
    finalCta: isAuthenticated ? dashboard : bookDemo,
    footerAppEntry: isAuthenticated ? dashboard : signIn,
    footerRequestAccess: {
      ...requestAccess,
      label: copy.footer.requestAccessEmail,
    },
  }
}
