import Link from "next/link"
import { Suspense, type ElementType } from "react"
import {
  ArrowRightIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  Code2Icon,
  Globe2Icon,
  LineChartIcon,
  MenuIcon,
  NetworkIcon,
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
  type LandingAccessAction,
} from "./landing-access"
import styles from "./landing-page.module.css"
import { LandingAudienceSection } from "./landing-audience-section"
import { LandingCapabilityFlowReveal } from "./landing-capability-flow-reveal"
import { LandingContextFigure } from "./landing-context-figure"
import { LandingFeatureShowcase } from "./landing-feature-showcase"
import { LandingHeaderShell } from "./landing-header-shell"
import { LandingProviderMarquee } from "./landing-provider-marquee"
import { LandingLocaleLinks, LandingLocaleMenu } from "./landing-locale-links"
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

type HeaderMenuItemModel = {
  description: string
  href?: string
  label: string
  placeholder?: boolean
}

type HeaderMenuGroupModel = {
  id: string
  label: string
  items: HeaderMenuItemModel[]
}

function HeaderMenuItem({
  item,
  comingSoonLabel,
  mobile = false,
}: {
  item: HeaderMenuItemModel
  comingSoonLabel: string
  mobile?: boolean
}) {
  const content = (
    <>
      <span className={styles.megaMenuItemHeading}>
        <span>{item.label}</span>
        {item.placeholder ? (
          <span className={styles.megaMenuPlaceholder}>{comingSoonLabel}</span>
        ) : null}
      </span>
      <span className={styles.megaMenuItemDescription}>{item.description}</span>
    </>
  )

  if (!item.href || item.placeholder) {
    return (
      <div
        className={`${styles.megaMenuItem} ${mobile ? styles.mobileMegaMenuItem : ""}`}
        aria-disabled="true"
      >
        {content}
      </div>
    )
  }

  return (
    <a
      href={item.href}
      className={`${styles.megaMenuItem} ${mobile ? styles.mobileMegaMenuItem : ""}`}
    >
      {content}
    </a>
  )
}

function DesktopMegaMenu({
  groups,
  label,
  comingSoonLabel,
}: {
  groups: HeaderMenuGroupModel[]
  label: string
  comingSoonLabel: string
}) {
  return (
    <LandingNavigationDisclosure
      className={styles.megaMenuDisclosure}
      name="landing-desktop-menu"
      openOnHover
    >
      <summary
        className={`${styles.headerNavItem} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {label}
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </summary>
      <div className={styles.megaMenuPanel}>
        {groups.map((group) => (
          <section key={group.id} className={styles.megaMenuGroup}>
            <p className={styles.megaMenuGroupLabel}>{group.label}</p>
            <ul className={styles.megaMenuList}>
              {group.items.map((item) => (
                <li key={item.label}>
                  <HeaderMenuItem
                    item={item}
                    comingSoonLabel={comingSoonLabel}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </LandingNavigationDisclosure>
  )
}

function MobileMegaMenu({
  groups,
  label,
  comingSoonLabel,
}: {
  groups: HeaderMenuGroupModel[]
  label: string
  comingSoonLabel: string
}) {
  return (
    <LandingNavigationDisclosure
      className={styles.mobileMenuGroup}
      name="landing-mobile-menu-group"
    >
      <summary className={styles.mobileMenuGroupTrigger}>
        {label}
        <ChevronDownIcon aria-hidden="true" />
      </summary>
      <div className={styles.mobileMenuGroupContent}>
        {groups.map((group) => (
          <section key={group.id}>
            <p className={styles.mobileMenuGroupLabel}>{group.label}</p>
            <div className={styles.mobileMenuItems}>
              {group.items.map((item) => (
                <HeaderMenuItem
                  key={item.label}
                  item={item}
                  comingSoonLabel={comingSoonLabel}
                  mobile
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </LandingNavigationDisclosure>
  )
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
        <ProviderIntegrations dictionary={dictionary} />
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
  const productGroups: HeaderMenuGroupModel[] = [
    {
      id: "analysis",
      label: t.nav.analysisGroup,
      items: [
        {
          href: "#knowledge-graph",
          label: t.nav.knowledgeGraph,
          description: t.nav.knowledgeGraphDescription,
        },
        {
          href: "#live-charts",
          label: t.nav.liveCharts,
          description: t.nav.liveChartsDescription,
        },
      ],
    },
    {
      id: "assistant",
      label: t.nav.assistantGroup,
      items: [
        {
          href: "#ai-assistant",
          label: t.nav.aiAssistant,
          description: t.nav.aiAssistantDescription,
        },
        {
          href: "#strategy-coding",
          label: t.nav.strategyBuilder,
          description: t.nav.strategyBuilderDescription,
        },
      ],
    },
    {
      id: "automation",
      label: t.nav.automationGroup,
      items: [
        {
          href: "#telegram",
          label: t.nav.telegram,
          description: t.nav.telegramDescription,
        },
        {
          href: "#how-it-works",
          label: t.nav.flow,
          description: t.nav.exploreDemoDescription,
        },
      ],
    },
  ]
  const solutionGroups: HeaderMenuGroupModel[] = [
    {
      id: "individuals",
      label: t.nav.solutions,
      items: [
        {
          href: "#audience-trader",
          label: t.nav.trader,
          description: t.nav.traderDescription,
        },
        {
          href: "#audience-analyst",
          label: t.nav.analyst,
          description: t.nav.analystDescription,
        },
      ],
    },
    {
      id: "organizations",
      label: t.nav.solutions,
      items: [
        {
          href: "#audience-strategy-developer",
          label: t.nav.strategyDeveloper,
          description: t.nav.strategyDeveloperDescription,
        },
        {
          href: "#audience-team-fund",
          label: t.nav.teamsAndFunds,
          description: t.nav.teamsAndFundsDescription,
        },
      ],
    },
    {
      id: "explore",
      label: t.nav.exploreGroup,
      items: [
        {
          href: "#showcase",
          label: t.nav.exploreDemo,
          description: t.nav.exploreDemoDescription,
        },
        {
          href: "#access",
          label: t.nav.discussNeeds,
          description: t.nav.discussNeedsDescription,
        },
        {
          label: t.nav.enterpriseSolutions,
          description: t.nav.enterpriseSolutionsDescription,
          placeholder: true,
        },
      ],
    },
  ]
  const resourceGroups: HeaderMenuGroupModel[] = [
    {
      id: "getting-started",
      label: t.nav.gettingStartedGroup,
      items: [
        {
          label: t.nav.userGuide,
          description: t.nav.userGuideDescription,
          placeholder: true,
        },
        {
          label: t.nav.helpCenter,
          description: t.nav.helpCenterDescription,
          placeholder: true,
        },
      ],
    },
    {
      id: "insights",
      label: t.nav.exploreGroup,
      items: [
        {
          label: t.nav.blogInsights,
          description: t.nav.blogInsightsDescription,
          placeholder: true,
        },
        {
          label: t.nav.productUpdates,
          description: t.nav.productUpdatesDescription,
          placeholder: true,
        },
      ],
    },
    {
      id: "connect",
      label: t.nav.connectGroup,
      items: [
        {
          label: t.nav.developers,
          description: t.nav.developersDescription,
          placeholder: true,
        },
        {
          label: t.nav.aboutSignapse,
          description: t.nav.aboutSignapseDescription,
          placeholder: true,
        },
      ],
    },
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
          <DesktopMegaMenu
            label={t.nav.product}
            groups={productGroups}
            comingSoonLabel={t.nav.comingSoon}
          />
          <DesktopMegaMenu
            label={t.nav.solutions}
            groups={solutionGroups}
            comingSoonLabel={t.nav.comingSoon}
          />
          <DesktopMegaMenu
            label={t.nav.resources}
            groups={resourceGroups}
            comingSoonLabel={t.nav.comingSoon}
          />
          <a href="#how-it-works" className={styles.headerNavItem}>
            {t.nav.flow}
          </a>
          <a href="#access" className={styles.headerNavItem}>
            {t.nav.contact}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {access.headerSecondary ? (
            <div className="hidden sm:block">
              <LandingActionButton
                action={access.headerSecondary}
                className={styles.headerAction}
                variant="ghost"
                showArrow={false}
              />
            </div>
          ) : null}
          <LandingActionButton
            action={access.headerPrimary}
            className={styles.headerAction}
            size="lg"
          />
          <div className="hidden xl:block">
            <Suspense
              fallback={
                <LandingLocaleMenuFallback label={t.localeControl.label} />
              }
            >
              <LandingLocaleMenu
                currentLocale={locale}
                labels={{
                  group: t.localeControl.label,
                  vi: t.localeControl.vietnamese,
                  en: t.localeControl.english,
                }}
              />
            </Suspense>
          </div>

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
              <div className="border-b border-border pb-3">
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
                <MobileMegaMenu
                  label={t.nav.product}
                  groups={productGroups}
                  comingSoonLabel={t.nav.comingSoon}
                />
                <MobileMegaMenu
                  label={t.nav.solutions}
                  groups={solutionGroups}
                  comingSoonLabel={t.nav.comingSoon}
                />
                <MobileMegaMenu
                  label={t.nav.resources}
                  groups={resourceGroups}
                  comingSoonLabel={t.nav.comingSoon}
                />
                <a href="#how-it-works" className={styles.headerMenuItem}>
                  {t.nav.flow}
                </a>
                <a href="#access" className={styles.headerMenuItem}>
                  {t.nav.contact}
                </a>
              </nav>
              {access.headerSecondary ? (
                <LandingActionButton
                  action={access.headerSecondary}
                  className={`${styles.headerAction} w-full`}
                  variant="ghost"
                  showArrow={false}
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
          <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
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
              variant="ghost"
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
          <dl className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-1">
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
      icon: NetworkIcon,
    },
    {
      title: t.impactTitle,
      icon: LineChartIcon,
    },
    {
      title: t.aiTitle,
      icon: BrainCircuitIcon,
    },
    {
      title: t.telegramTitle,
      icon: BellRingIcon,
    },
    {
      title: t.strategyTitle,
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
      <LandingCapabilityFlowReveal className={styles.capabilityFlow}>
        <span aria-hidden="true" className={styles.capabilityFlowTrack}>
          <span className={styles.capabilityFlowLight} />
        </span>
        <ul className={styles.capabilityFlowList}>
          {capabilities.map((capability) => {
            const Icon = capability.icon

            return (
              <li key={capability.title} className={styles.capabilityFlowItem}>
                <div className={styles.capabilityRailStep}>
                  <span
                    aria-hidden="true"
                    className={styles.capabilityRailIcon}
                  >
                    <Icon />
                  </span>
                  <span className={styles.capabilityRailTitle}>
                    {capability.title}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </LandingCapabilityFlowReveal>
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
      <div className="mx-auto grid w-full max-w-[100rem] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-8">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
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
            <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
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

        <ol className="min-w-0">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`${styles.analysisStep} grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 py-6`}
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
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex max-w-5xl flex-col gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
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

      <p className="mt-auto pt-6 text-xs font-medium text-muted-foreground">
        {capability.linkLabel}
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
      id="showcase"
      data-landing-section="showcase"
      data-landing-surface="light"
      aria-labelledby="landing-showcase-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto w-full max-w-[100rem] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <LandingFeatureShowcase
          locale={locale}
          labels={t}
          captures={{
            knowledgeGraph: {
              capture: graphCapture,
              labels: {
                alt: product.knowledgeGraphMediaAlt,
                label: product.knowledgeGraphMediaTitle,
                caption: product.knowledgeGraphMediaCaption,
                error: product.media.error,
                annotations: [
                  product.knowledgeGraphAnnotationEvent,
                  product.knowledgeGraphAnnotationAsset,
                  product.knowledgeGraphAnnotationSource,
                ],
              },
            },
            marketChart: {
              capture: chartCapture,
              labels: {
                alt: product.liveChartsMediaAlt,
                label: product.liveChartsMediaTitle,
                caption: product.liveChartsMediaCaption,
                error: product.media.error,
              },
            },
          }}
        />
      </div>
    </section>
  )
}

function ProviderIntegrations({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.landing.trust

  return (
    <section
      id="trust"
      data-landing-section="ai-providers"
      data-landing-surface="light"
      aria-labelledby="landing-provider-heading"
      className={`${styles.lightSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto flex w-full max-w-[100rem] flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <div className="flex max-w-3xl flex-col items-center gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
            {t.eyebrow}
          </p>
          <h2
            id="landing-provider-heading"
            className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
          >
            {t.heading}
          </h2>
          <p className="leading-7 text-muted-foreground">{t.body}</p>
        </div>

        <LandingProviderMarquee label={t.providerListLabel} />
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
      <div className="mx-auto flex w-full max-w-[100rem] justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
            {t.accessLabel}
          </p>
          <h2
            id="landing-access-heading"
            className={`${styles.landingDisplayHeading} text-3xl leading-tight sm:text-4xl`}
          >
            {t.heading}
          </h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">{t.body}</p>
          <LandingActionButton
            action={access.finalCta}
            className={styles.sectionAction}
            size="lg"
          />
          {access.finalCta.kind === "email" ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {t.emailNote}
            </p>
          ) : null}
        </div>
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
          <span className="font-mono text-xs text-muted-foreground">
            {t.footer.requestAccessEmail}
          </span>
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
      className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
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

function LandingLocaleMenuFallback({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      className={`${styles.localeMenuTrigger} pointer-events-none`}
    >
      <Globe2Icon data-icon="inline-start" aria-hidden="true" />
    </span>
  )
}
