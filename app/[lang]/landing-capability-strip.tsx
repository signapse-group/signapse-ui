"use client"

import { useEffect, useState } from "react"
import {
  BellRingIcon,
  BrainCircuitIcon,
  Code2Icon,
  LineChartIcon,
  NetworkIcon,
} from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LandingCapabilityFlowReveal } from "./landing-capability-flow-reveal"
import styles from "./landing-page.module.css"

export function LandingCapabilityStrip() {
  const { dictionary } = useLocalization()
  const t = dictionary.landing.capabilityStrip
  const product = dictionary.landing.product
  const capabilities = [
    {
      id: "knowledge-graph",
      title: t.marketViewTitle,
      icon: NetworkIcon,
      outcome: product.knowledgeGraphOutcome,
      body: product.knowledgeGraphBody,
    },
    {
      id: "live-charts",
      title: t.impactTitle,
      icon: LineChartIcon,
      outcome: product.liveChartsOutcome,
      body: product.liveChartsBody,
    },
    {
      id: "ai-assistant",
      title: t.aiTitle,
      icon: BrainCircuitIcon,
      outcome: product.aiAssistantOutcome,
      body: product.aiAssistantBody,
    },
    {
      id: "telegram",
      title: t.telegramTitle,
      icon: BellRingIcon,
      outcome: product.telegramOutcome,
      body: product.telegramBody,
    },
    {
      id: "strategy-coding",
      title: t.strategyTitle,
      icon: Code2Icon,
      outcome: product.strategyOutcome,
      body: product.strategyBody,
    },
  ]
  const [activeId, setActiveId] = useState("knowledge-graph")
  const [open, setOpen] = useState(false)
  const active = capabilities.find((capability) => capability.id === activeId)!

  useEffect(() => {
    const ids = [
      "knowledge-graph",
      "live-charts",
      "ai-assistant",
      "telegram",
      "strategy-coding",
    ]
    const openHash = (hash: string) => {
      const id = hash.slice(1)
      if (!ids.includes(id)) return
      setActiveId(id)
      setOpen(true)
      document.getElementById(id)?.scrollIntoView({ block: "center" })
    }
    const onHashChange = () => openHash(window.location.hash)
    let frame = 0
    const onAnchorClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
      if (!anchor || !ids.includes(anchor.hash.slice(1))) return
      frame = requestAnimationFrame(() => openHash(anchor.hash))
    }
    onHashChange()
    window.addEventListener("hashchange", onHashChange)
    document.addEventListener("click", onAnchorClick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("hashchange", onHashChange)
      document.removeEventListener("click", onAnchorClick)
    }
  }, [])

  return (
    <section
      id="capability-strip"
      data-landing-section="capability-strip"
      aria-label={t.label}
      className={`${styles.heroContent} ${styles.heroRail} mx-auto w-full max-w-[100rem] px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-4`}
    >
      <Popover
        open={open}
        triggerId={activeId}
        onOpenChange={(nextOpen, details) => {
          const id = details.trigger?.id
          if (id) setActiveId(id)
          setOpen(nextOpen)
        }}
      >
        <LandingCapabilityFlowReveal className={styles.capabilityFlow}>
          <span aria-hidden="true" className={styles.capabilityFlowTrack}>
            <span className={styles.capabilityFlowLight} />
          </span>
          <ul className={styles.capabilityFlowList}>
            {capabilities.map((capability) => {
              const Icon = capability.icon
              return (
                <li key={capability.id} className={styles.capabilityFlowItem}>
                  <PopoverTrigger
                    id={capability.id}
                    data-capability-trigger={capability.id}
                    className={styles.capabilityRailStep}
                    openOnHover
                    closeDelay={150}
                  >
                    <span
                      aria-hidden="true"
                      className={styles.capabilityRailIcon}
                    >
                      <Icon />
                    </span>
                    <span className={styles.capabilityRailTitle}>
                      {capability.title}
                    </span>
                  </PopoverTrigger>
                </li>
              )
            })}
          </ul>
        </LandingCapabilityFlowReveal>
        <PopoverContent
          id="landing-capability-detail"
          data-capability-detail={activeId}
          side="top"
          sideOffset={12}
          className={`${styles.landingRoot} ${styles.darkSurface} w-80 max-w-[calc(100vw-2rem)]`}
        >
          <PopoverTitle id="landing-capability-detail-title">
            {active.outcome}
          </PopoverTitle>
          <PopoverDescription id="landing-capability-detail-description">
            {active.body}
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    </section>
  )
}
