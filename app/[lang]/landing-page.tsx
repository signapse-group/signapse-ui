import Link from "next/link"
import { Suspense, type ElementType } from "react"
import {
  ArrowRightIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  Code2Icon,
  LineChartIcon,
  MenuIcon,
  NetworkIcon,
  ShieldCheckIcon,
} from "lucide-react"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { withLocalePath } from "@/app/lib/i18n/routing"
import {
  getApprovedLandingProductCapture,
  type LandingProductFeature,
} from "./landing-product-media"
import { LandingOhlcvBackground } from "./landing-ohlcv-background"
import {
  createLandingAccessModel,
  REQUEST_ACCESS_EMAIL,
  type LandingAccessAction,
} from "./landing-access"
import { LandingDemoForm } from "./landing-demo-form"
import styles from "./landing-page.module.css"
import { LandingAudienceSection } from "./landing-audience-section"
import { LandingContextFigure } from "./landing-context-figure"
import { LandingHeaderShell } from "./landing-header-shell"
import { LandingProductCapture } from "./landing-product-capture"
import { LandingLocaleLinks } from "./landing-locale-links"
import { LandingNavigationDisclosure } from "./landing-navigation-disclosure"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"

type LandingPageProps = {
  dictionary: Dictionary
  locale: AppLocale
  isAuthenticated: boolean
}

type LandingActionButtonProps = {
  action: LandingAccessAction
  className?: string
  size?: "default" | "lg"
  variant?: "default" | "ghost" | "outline" | "secondary"
  showArrow?: boolean
}

export function LandingPage({
  dictionary,
  locale,
  isAuthenticated,
}: LandingPageProps) {
  const t = dictionary.landing
  const access = createLandingAccessModel(locale, isAuthenticated, t)

  return (
    <div
      data-landing-theme="fixed-signapse"
      className={`${styles.landingRoot} min-h-svh overflow-x-clip bg-background text-foreground`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        {t.accessibility.skipToContent}
      </a>

      <LandingHeader access={access} dictionary={dictionary} locale={locale} />

      <main id="main-content" tabIndex={-1}>
        <HeroSection access={access} dictionary={dictionary} locale={locale} />
        <ProductStory dictionary={dictionary} />
        <LandingAudienceSection dictionary={dictionary} />
        <AnalysisFlow dictionary={dictionary} />
        <ShowcaseSection dictionary={dictionary} locale={locale} />
        <TrustBoundary access={access} dictionary={dictionary} />
        <FinalAccessCta access={access} dictionary={dictionary} />
      </main>

      <LandingFooter access={access} dictionary={dictionary} locale={locale} />
    </div>
  )
}

function LandingHeader({
  access,
  dictionary,
  locale,
}: {
  access: ReturnType<typeof createLandingAccessModel>
  dictionary: Dictionary
  locale: AppLocale
}) {
  const t = dictionary.landing
  const sectionLinks = [
    { href: "#product", label: t.nav.overview },
    { href: "#knowledge-graph", label: t.nav.knowledgeGraph },
    { href: "#live-charts", label: t.nav.liveCharts },
    { href: "#ai-assistant", label: t.nav.aiAssistant },
    { href: "#telegram", label: t.nav.telegram },
    { href: "#how-it-works", label: t.nav.flow },
  ]

  return (
    <LandingHeaderShell
      data-landing-part="header"
      data-landing-surface="dark"
      className={`${styles.darkSurface} ${styles.header}`}
    >
      <div
        className={`${styles.headerInner} mx-auto w-full max-w-[120rem] px-4 sm:px-6 lg:px-8`}
      >
        <Link
          href={withLocalePath("/", locale)}
          aria-label={dictionary.common.appName}
          className="flex shrink-0 items-center gap-3 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span aria-hidden="true" className="size-8 shrink-0">
            <span className={styles.headerLogoDark}>
              <Logo width={32} height={32} colorScheme="dark" />
            </span>
            <span className={styles.headerLogoLight}>
              <Logo width={32} height={32} colorScheme="light" />
            </span>
          </span>
          <span className="hidden truncate sm:inline">
            {dictionary.common.appName}
          </span>
        </Link>

        <nav
          aria-label={t.accessibility.headerNavigation}
          className="hidden items-center justify-center gap-2 text-sm text-muted-foreground xl:flex"
        >
          <LandingNavigationDisclosure className="group relative">
            <summary
              className={`${styles.headerNavItem} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
            >
              {t.nav.product}
              <ChevronDownIcon
                aria-hidden="true"
                className="size-4 group-open:rotate-180"
              />
            </summary>
            <ul className="absolute top-[calc(100%+0.5rem)] right-0 z-20 flex w-64 flex-col gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.headerMenuItem}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </LandingNavigationDisclosure>
          <a href="#how-it-works" className={styles.headerNavItem}>
            {t.nav.flow}
          </a>
          <a href="#access" className={styles.headerNavItem}>
            {t.nav.access}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <Suspense
              fallback={
                <LandingLocaleLinksFallback
                  locale={locale}
                  labels={t.localeControl}
                />
              }
            >
              <LandingLocaleLinks
                currentLocale={locale}
                labels={{
                  group: t.localeControl.label,
                  vi: t.localeControl.vietnamese,
                  en: t.localeControl.english,
                }}
              />
            </Suspense>
          </div>

          {access.headerSecondary ? (
            <div className="hidden sm:block">
              <LandingActionButton
                action={access.headerSecondary}
                className={`${styles.headerAction} ${styles.headerSecondaryAction}`}
                size="lg"
                variant="ghost"
              />
            </div>
          ) : null}
          <LandingActionButton
            action={access.headerPrimary}
            className={styles.headerAction}
            size="lg"
          />

          <LandingNavigationDisclosure
            className="relative xl:hidden"
            data-mobile-menu
          >
            <summary
              className={`${styles.headerMenuTrigger} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
            >
              <span className="sr-only">{t.nav.openMenu}</span>
              <MenuIcon aria-hidden="true" className="size-5" />
            </summary>
            <div className="absolute top-[calc(100%+0.5rem)] right-0 z-20 flex max-h-[calc(100dvh-6rem)] w-[min(19rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto border border-border bg-background p-3 shadow-lg">
              <div className="border-b border-border pb-3 sm:hidden">
                <Suspense
                  fallback={
                    <LandingLocaleLinksFallback
                      locale={locale}
                      labels={t.localeControl}
                    />
                  }
                >
                  <LandingLocaleLinks
                    currentLocale={locale}
                    labels={{
                      group: t.localeControl.label,
                      vi: t.localeControl.vietnamese,
                      en: t.localeControl.english,
                    }}
                  />
                </Suspense>
              </div>
              <nav
                aria-label={t.accessibility.headerNavigation}
                className="flex flex-col gap-1"
              >
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {t.nav.product}
                </p>
                {sectionLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={styles.headerMenuItem}
                  >
                    {link.label}
                  </a>
                ))}
                <a href="#access" className={styles.headerMenuItem}>
                  {t.nav.access}
                </a>
              </nav>
              {access.headerSecondary ? (
                <LandingActionButton
                  action={access.headerSecondary}
                  className={`${styles.headerAction} ${styles.headerSecondaryAction} w-full`}
                  size="lg"
                  variant="outline"
                />
              ) : null}
            </div>
          </LandingNavigationDisclosure>
        </div>
      </div>
    </LandingHeaderShell>
  )
}

function HeroSection({
  access,
  dictionary,
}: {
  access: ReturnType<typeof createLandingAccessModel>
  dictionary: Dictionary
  locale: AppLocale
}) {
  const t = dictionary.landing

  return (
    <section
      id="top"
      data-landing-section="hero-product-proof"
      data-landing-surface="dark"
      aria-labelledby="landing-hero-heading"
      className={`${styles.darkSurface} ${styles.heroSection} relative flex min-h-svh flex-col overflow-hidden border-b border-border/80 bg-background`}
    >
      <LandingOhlcvBackground />
      <div
        className={`${styles.heroContent} mx-auto grid w-full max-w-[100rem] flex-1 gap-12 px-4 pt-[calc(var(--landing-header-height)+3.5rem)] pb-14 sm:px-6 sm:pt-[calc(var(--landing-header-height)+5rem)] sm:pb-20 lg:grid-cols-[minmax(0,0.88fr)_minmax(32rem,1.12fr)] lg:items-center lg:gap-16 lg:px-8 lg:pt-[calc(var(--landing-header-height)+2rem)] lg:pb-8`}
      >
        <div className={`${styles.heroCopy} flex min-w-0 flex-col gap-7`}>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.hero.eyebrow}
          </p>
          <div className="flex max-w-3xl flex-col gap-5">
            <h1
              id="landing-hero-heading"
              className={`${styles.landingDisplayHeading} max-w-3xl text-4xl leading-[1.02] sm:text-6xl lg:text-7xl`}
            >
              {t.hero.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t.hero.body}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LandingActionButton
              action={access.heroPrimary}
              className={`${styles.sectionAction} w-full sm:w-auto`}
              size="lg"
            />
            <LandingActionButton
              action={access.heroSecondary}
              className={`${styles.sectionAction} w-full sm:w-auto`}
              size="lg"
              variant="outline"
              showArrow={false}
            />
          </div>
          <p className="max-w-xl border-l-2 border-chart-2 pl-4 text-sm leading-6 text-foreground">
            {t.hero.trustNote}
          </p>
        </div>

        <div className={`${styles.heroVisual} flex min-w-0 flex-col gap-6`}>
          <LandingContextFigure
            labels={{
              title: t.hero.contextFigureTitle,
              description: t.hero.contextFigureDescription,
              keyboardHint: t.hero.contextFigureKeyboardHint,
              statusGraph: t.hero.contextFigureStatusGraph,
              statusPrice: t.hero.contextFigureStatusPrice,
              ready: t.hero.contextFigureReady,
              fallback: t.hero.contextFigureFallback,
            }}
          />
          <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-1">
            <ProofPoint
              title={t.hero.proofOneTitle}
              body={t.hero.proofOneBody}
            />
            <ProofPoint
              title={t.hero.proofTwoTitle}
              body={t.hero.proofTwoBody}
            />
          </dl>
        </div>
      </div>
      <CapabilityStrip dictionary={dictionary} />
    </section>
  )
}

function ProofPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-semibold">{title}</dt>
      <dd className="text-sm leading-6 text-muted-foreground">{body}</dd>
    </div>
  )
}

function CapabilityStrip({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.landing.capabilityStrip
  const capabilities = [
    {
      title: t.marketViewTitle,
      body: t.marketViewBody,
      href: "#knowledge-graph",
      icon: NetworkIcon,
    },
    {
      title: t.impactTitle,
      body: t.impactBody,
      href: "#live-charts",
      icon: LineChartIcon,
    },
    {
      title: t.aiTitle,
      body: t.aiBody,
      href: "#ai-assistant",
      icon: BrainCircuitIcon,
    },
    {
      title: t.telegramTitle,
      body: t.telegramBody,
      href: "#telegram",
      icon: BellRingIcon,
    },
    {
      title: t.strategyTitle,
      body: t.strategyBody,
      href: "#strategy-coding",
      icon: Code2Icon,
    },
  ]

  return (
    <section
      id="capability-strip"
      data-landing-section="capability-strip"
      aria-label={dictionary.landing.product.eyebrow}
      className={`${styles.heroContent} ${styles.heroRail} mx-auto w-full max-w-[100rem] px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-4`}
    >
      <ul
        className={`${styles.landingCardGrid} grid sm:grid-cols-2 lg:grid-cols-5`}
      >
        {capabilities.map((capability, index) => {
          const Icon = capability.icon

          return (
            <li
              key={capability.title}
              className={`${styles.landingCardGridItem} ${styles.capabilityRailItem} min-w-0`}
            >
              <a href={capability.href} className={styles.capabilityRailLink}>
                <span className={styles.capabilityRailTopline}>
                  <span
                    aria-hidden="true"
                    className={styles.capabilityRailIcon}
                  >
                    <Icon />
                  </span>
                  <span
                    aria-hidden="true"
                    className={styles.capabilityRailNumber}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className={styles.capabilityRailCopy}>
                  <span className={styles.capabilityRailTitle}>
                    {capability.title}
                  </span>
                  <span className={styles.capabilityRailBody}>
                    {capability.body}
                  </span>
                </span>
                <ArrowRightIcon
                  aria-hidden="true"
                  className={styles.capabilityRailArrow}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AnalysisFlow({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.landing.analysisFlow
  const steps = [
    { title: t.stepOneTitle, body: t.stepOneBody },
    { title: t.stepTwoTitle, body: t.stepTwoBody },
    { title: t.stepThreeTitle, body: t.stepThreeBody },
    { title: t.stepFourTitle, body: t.stepFourBody },
  ]
  const loop = [t.loopNews, t.loopSignal, t.loopStrategy, t.loopDelivery]

  return (
    <section
      id="how-it-works"
      data-landing-section="analysis-flow"
      data-landing-surface="light"
      aria-labelledby="landing-flow-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-8">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {t.eyebrow}
            </p>
            <h2
              id="landing-flow-heading"
              className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
            >
              {t.heading}
            </h2>
            <p className="leading-7 text-muted-foreground">{t.body}</p>
          </div>
          <aside className={`${styles.landingPanel} flex flex-col gap-4`}>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {t.loopEyebrow}
            </p>
            <h3 className="text-2xl leading-tight font-semibold">
              {t.loopTitle}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {t.loopBody}
            </p>
            <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {loop.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="border border-border bg-background px-3 py-2">
                    {item}
                  </span>
                  {index < loop.length - 1 ? (
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="size-3 text-muted-foreground"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <ol className="min-w-0 border-t border-border">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-border py-6"
            >
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="max-w-md leading-7 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

type ProductCapability = {
  id: LandingProductFeature
  title: string
  outcome: string
  body: string
  linkLabel: string
  icon: ElementType
}

function ProductStory({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.landing.product
  const capabilities: ProductCapability[] = [
    {
      id: "knowledge-graph",
      title: t.knowledgeGraphTitle,
      outcome: t.knowledgeGraphOutcome,
      body: t.knowledgeGraphBody,
      linkLabel: t.knowledgeGraphLinkLabel,
      icon: NetworkIcon,
    },
    {
      id: "live-charts",
      title: t.liveChartsTitle,
      outcome: t.liveChartsOutcome,
      body: t.liveChartsBody,
      linkLabel: t.liveChartsLinkLabel,
      icon: LineChartIcon,
    },
    {
      id: "ai-assistant",
      title: t.aiAssistantTitle,
      outcome: t.aiAssistantOutcome,
      body: t.aiAssistantBody,
      linkLabel: t.aiAssistantLinkLabel,
      icon: BrainCircuitIcon,
    },
    {
      id: "telegram",
      title: t.telegramTitle,
      outcome: t.telegramOutcome,
      body: t.telegramBody,
      linkLabel: t.telegramLinkLabel,
      icon: CalendarClockIcon,
    },
    {
      id: "strategy-coding",
      title: t.strategyTitle,
      outcome: t.strategyOutcome,
      body: t.strategyBody,
      linkLabel: t.strategyLinkLabel,
      icon: Code2Icon,
    },
  ]

  return (
    <section
      id="product"
      data-landing-section="product-story"
      data-landing-surface="light"
      aria-labelledby="landing-product-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex max-w-5xl flex-col gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.eyebrow}
          </p>
          <h2
            id="landing-product-heading"
            className={`${styles.landingDisplayHeading} max-w-4xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl`}
          >
            {t.heading}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.body}
          </p>
        </div>

        <div
          className={`${styles.landingCardGrid} grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`}
        >
          {capabilities.map((capability) => (
            <CapabilityCard capability={capability} key={capability.id} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CapabilityCard({ capability }: { capability: ProductCapability }) {
  const Icon = capability.icon

  return (
    <article
      id={capability.id}
      data-product-card
      aria-labelledby={`${capability.id}-title`}
      className={`${styles.landingCardGridItem} flex h-full min-w-0 flex-col gap-0 xl:min-h-[23rem]`}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-chart-1"
      >
        <Icon className="size-5" />
      </span>

      <div className="mt-12 flex min-w-0 flex-col gap-3">
        <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-chart-1 uppercase">
          {capability.title}
        </p>
        <h3
          id={`${capability.id}-title`}
          className="text-xl leading-[1.08] font-semibold tracking-[-0.025em]"
        >
          {capability.outcome}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {capability.body}
        </p>
      </div>

      <p className="mt-auto flex items-center gap-1.5 pt-6 text-xs font-semibold text-chart-1">
        {capability.linkLabel}
        <ArrowRightIcon aria-hidden="true" className="size-3" />
      </p>
    </article>
  )
}

function ShowcaseSection({
  dictionary,
  locale,
}: {
  dictionary: Dictionary
  locale: AppLocale
}) {
  const t = dictionary.landing.showcase
  const product = dictionary.landing.product
  const graphCapture = getApprovedLandingProductCapture(
    locale,
    "knowledge-graph"
  )
  const chartCapture = getApprovedLandingProductCapture(locale, "live-charts")

  return (
    <section
      data-landing-section="showcase"
      data-landing-surface="light"
      aria-labelledby="landing-showcase-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex max-w-3xl flex-col gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.eyebrow}
          </p>
          <h2
            id="landing-showcase-heading"
            className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
          >
            {t.heading}
          </h2>
          <p className="leading-7 text-muted-foreground">{t.body}</p>
        </div>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            {graphCapture ? (
              <LandingProductCapture
                capture={graphCapture}
                labels={{
                  alt: product.knowledgeGraphMediaAlt,
                  label: product.knowledgeGraphMediaTitle,
                  caption: product.knowledgeGraphMediaCaption,
                  error: product.media.error,
                  annotations: [
                    product.knowledgeGraphAnnotationEvent,
                    product.knowledgeGraphAnnotationAsset,
                    product.knowledgeGraphAnnotationSource,
                  ],
                }}
              />
            ) : null}
            {chartCapture ? (
              <LandingProductCapture
                capture={chartCapture}
                labels={{
                  alt: product.liveChartsMediaAlt,
                  label: product.liveChartsMediaTitle,
                  caption: product.liveChartsMediaCaption,
                  error: product.media.error,
                }}
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <article className={`${styles.landingPanel} flex flex-col gap-4`}>
              <div className="flex items-center gap-3">
                <BellRingIcon aria-hidden="true" className="size-5" />
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {t.telegramEyebrow}
                </p>
              </div>
              <h3 className="text-2xl leading-tight font-semibold">
                {t.telegramTitle}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t.telegramBody}
              </p>
              <aside className="flex flex-col gap-2 border-l-2 border-chart-2 bg-background p-4">
                <p className="text-xs font-semibold">{t.telegramAlertTitle}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t.telegramAlertBody}
                </p>
              </aside>
            </article>
            <article
              className={`${styles.darkSurface} ${styles.landingPanel} flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <Code2Icon aria-hidden="true" className="size-5" />
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {t.strategyEyebrow}
                </p>
              </div>
              <h3 className="text-2xl leading-tight font-semibold">
                {t.strategyTitle}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t.strategyBody}
              </p>
              <pre className="overflow-x-auto border border-border bg-muted/30 p-4 font-mono text-xs leading-6">
                <code>{`strategy("Momentum Context")
when price > moving_average
and event_impact == "high"
then emit_signal("watch")`}</code>
              </pre>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustBoundary({
  access,
  dictionary,
}: {
  access: ReturnType<typeof createLandingAccessModel>
  dictionary: Dictionary
}) {
  const t = dictionary.landing.trust

  return (
    <section
      id="trust"
      data-landing-section="trust-boundary"
      data-landing-surface="light"
      aria-labelledby="landing-trust-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:px-8">
        <div className="grid min-w-0 gap-8 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center border border-border bg-muted/30"
          >
            <ShieldCheckIcon className="text-muted-foreground" />
          </div>
          <div className="flex max-w-4xl flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {t.eyebrow}
            </p>
            <h2
              id="landing-trust-heading"
              className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
            >
              {t.heading}
            </h2>
            <p className="leading-7 text-muted-foreground">{t.body}</p>
            <ol className="flex flex-col gap-4 border-t border-border pt-5">
              {[t.pointOne, t.pointTwo, t.pointThree].map((point, index) => (
                <li
                  key={point}
                  className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <aside
          className={`${styles.landingPanel} flex flex-col items-start gap-5`}
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.enterpriseEyebrow}
          </p>
          <h3 className="text-2xl leading-tight font-semibold">
            {t.enterpriseTitle}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {t.enterpriseBody}
          </p>
          <a
            href={access.footerRequestAccess.href}
            aria-label={t.enterpriseCta}
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className: styles.sectionAction,
            })}
          >
            {t.enterpriseCta}
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  )
}

function FinalAccessCta({
  access,
  dictionary,
}: {
  access: ReturnType<typeof createLandingAccessModel>
  dictionary: Dictionary
}) {
  const t = dictionary.landing.finalCta

  return (
    <section
      id="access"
      data-landing-section="final-access-cta"
      data-landing-surface="dark"
      aria-labelledby="landing-access-heading"
      className={`${styles.darkSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:items-center lg:px-8">
        <div className="flex max-w-3xl flex-col items-start gap-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.accessLabel}
          </p>
          <h2
            id="landing-access-heading"
            className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
          >
            {t.heading}
          </h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">{t.body}</p>
          {access.finalCta.kind === "internal" ? (
            <LandingActionButton
              action={access.finalCta}
              className={styles.sectionAction}
              size="lg"
            />
          ) : null}
        </div>
        {access.finalCta.kind === "email" ? (
          <LandingDemoForm email={REQUEST_ACCESS_EMAIL} labels={t} />
        ) : null}
      </div>
    </section>
  )
}

function LandingFooter({
  access,
  dictionary,
  locale,
}: {
  access: ReturnType<typeof createLandingAccessModel>
  dictionary: Dictionary
  locale: AppLocale
}) {
  const t = dictionary.landing

  return (
    <footer
      data-landing-part="footer"
      data-landing-surface="dark"
      className={`${styles.darkSurface} bg-background`}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)] lg:px-8">
        <div className="flex max-w-md flex-col gap-4">
          <Link
            href={withLocalePath("/", locale)}
            aria-label={t.footer.brandLabel}
            className="flex w-fit items-center gap-3 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden="true">
              <Logo width={28} height={28} colorScheme="dark" />
            </span>
            <span>{dictionary.common.appName}</span>
          </Link>
          <p className="text-sm leading-6 text-muted-foreground">
            {t.footer.description}
          </p>
        </div>

        <nav
          aria-label={t.accessibility.footerNavigation}
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="font-semibold text-foreground">
            {t.footer.productHeading}
          </p>
          <a
            href="#knowledge-graph"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.productMarketView}
          </a>
          <a
            href="#live-charts"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.productImpact}
          </a>
          <a
            href="#ai-assistant"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.productAi}
          </a>
          <a
            href="#telegram"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.productTelegram}
          </a>
          <a
            href="#strategy-coding"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.productStrategy}
          </a>
        </nav>

        <nav
          aria-label={t.footer.contactHeading}
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="font-semibold text-foreground">
            {t.footer.contactHeading}
          </p>
          <a
            href="#access"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.demo}
          </a>
          <LandingActionLink
            action={access.footerAppEntry}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <a
            href={access.footerRequestAccess.href}
            aria-label={t.footer.requestAccessEmailLabel}
            className="font-mono text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {access.footerRequestAccess.label}
          </a>
          <a
            href="#how-it-works"
            className="text-muted-foreground hover:text-foreground"
          >
            {t.footer.workflow}
          </a>
        </nav>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 border-t border-border px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <span>{t.footer.copyright}</span>
        <span>{t.footer.disclaimer}</span>
      </div>
    </footer>
  )
}

function LandingActionButton({
  action,
  className,
  size = "default",
  variant = "default",
  showArrow = true,
}: LandingActionButtonProps) {
  const content = (
    <>
      {action.label}
      {showArrow ? (
        <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
      ) : null}
    </>
  )
  const classes = buttonVariants({ variant, size, className })

  if (action.kind === "internal") {
    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        className={classes}
      >
        {content}
      </Link>
    )
  }

  return (
    <a href={action.href} aria-label={action.ariaLabel} className={classes}>
      {content}
    </a>
  )
}

function LandingActionLink({
  action,
  className,
}: {
  action: LandingAccessAction
  className?: string
}) {
  if (action.kind === "internal") {
    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        className={className}
      >
        {action.label}
      </Link>
    )
  }

  return (
    <a href={action.href} aria-label={action.ariaLabel} className={className}>
      {action.label}
    </a>
  )
}

function LandingLocaleLinksFallback({
  locale,
  labels,
}: {
  locale: AppLocale
  labels: {
    label: string
    vietnamese: string
    english: string
  }
}) {
  return (
    <nav
      aria-label={labels.label}
      className="flex items-center gap-1 text-xs text-muted-foreground"
    >
      <Link
        href={withLocalePath("/", "vi")}
        lang="vi"
        hrefLang="vi"
        aria-current={locale === "vi" ? "page" : undefined}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {labels.vietnamese}
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={withLocalePath("/", "en")}
        lang="en"
        hrefLang="en"
        aria-current={locale === "en" ? "page" : undefined}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {labels.english}
      </Link>
    </nav>
  )
}
