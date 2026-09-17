"use client"

import { Globe2Icon } from "lucide-react"
import { type MouseEvent, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import type { AppLocale } from "@/app/lib/i18n/config"
import { replacePathLocale } from "@/app/lib/i18n/routing"
import styles from "./landing-page.module.css"
import { LandingNavigationDisclosure } from "./landing-navigation-disclosure"

const SUPPORTED_LANDING_HASHES = new Set([
  "top",
  "product",
  "knowledge-graph",
  "live-charts",
  "ai-assistant",
  "telegram",
  "how-it-works",
  "trust",
  "access",
])

type LandingLocaleLinksProps = {
  currentLocale: AppLocale
  labels: {
    group: string
    vi: string
    en: string
  }
}

type LandingLocaleMenuProps = LandingLocaleLinksProps

function getSupportedHash(): string {
  if (typeof window === "undefined") return ""

  const hash = window.location.hash
  return SUPPORTED_LANDING_HASHES.has(hash.slice(1)) ? hash : ""
}

export function buildLandingLocaleHref(
  pathname: string,
  query: string,
  hash: string,
  locale: AppLocale
): string {
  const supportedHash = SUPPORTED_LANDING_HASHES.has(hash.replace(/^#/, ""))
    ? `#${hash.replace(/^#/, "")}`
    : ""
  const nextPath = replacePathLocale(pathname, locale)

  return `${nextPath}${query ? `?${query}` : ""}${supportedHash}`
}

export function LandingLocaleLinks({
  currentLocale,
  labels,
}: LandingLocaleLinksProps) {
  const { buildHref, hash, navigateToLocale } = useLandingLocaleNavigation()

  const handleLocaleClick = (
    locale: AppLocale,
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    const currentHash = getSupportedHash()
    if (hash || !currentHash) return

    event.preventDefault()
    navigateToLocale(locale)
  }

  return (
    <nav
      aria-label={labels.group}
      className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
      data-locale-links
    >
      <a
        href={buildHref("vi")}
        lang="vi"
        hrefLang="vi"
        aria-current={currentLocale === "vi" ? "page" : undefined}
        data-current-locale={currentLocale === "vi" ? "true" : "false"}
        data-locale-link="vi"
        onClick={(event) => handleLocaleClick("vi", event)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {labels.vi}
      </a>
      <span aria-hidden="true">/</span>
      <a
        href={buildHref("en")}
        lang="en"
        hrefLang="en"
        aria-current={currentLocale === "en" ? "page" : undefined}
        data-current-locale={currentLocale === "en" ? "true" : "false"}
        data-locale-link="en"
        onClick={(event) => handleLocaleClick("en", event)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {labels.en}
      </a>
    </nav>
  )
}

export function LandingLocaleMenu({
  currentLocale,
  labels,
}: LandingLocaleMenuProps) {
  const { buildHref } = useLandingLocaleNavigation()

  return (
    <LandingNavigationDisclosure className={styles.localeMenu}>
      <summary
        data-locale-menu-trigger
        aria-label={labels.group}
        className={`${styles.localeMenuTrigger} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <Globe2Icon data-icon="inline-start" aria-hidden="true" />
      </summary>
      <nav aria-label={labels.group} className={styles.localeMenuPanel}>
        <a
          href={buildHref("vi")}
          lang="vi"
          hrefLang="vi"
          aria-current={currentLocale === "vi" ? "page" : undefined}
          className={styles.localeMenuItem}
        >
          {labels.vi}
        </a>
        <a
          href={buildHref("en")}
          lang="en"
          hrefLang="en"
          aria-current={currentLocale === "en" ? "page" : undefined}
          className={styles.localeMenuItem}
        >
          {labels.en}
        </a>
      </nav>
    </LandingNavigationDisclosure>
  )
}

function useLandingLocaleNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState("")

  useEffect(() => {
    const updateHash = () => setHash(getSupportedHash())
    updateHash()
    window.addEventListener("hashchange", updateHash)

    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  const query = searchParams.toString()
  const buildHref = (locale: AppLocale) =>
    buildLandingLocaleHref(pathname ?? "/", query, hash, locale)
  const navigateToLocale = (locale: AppLocale) => {
    window.location.assign(
      buildLandingLocaleHref(pathname ?? "/", query, getSupportedHash(), locale)
    )
  }

  return { buildHref, hash, navigateToLocale }
}
