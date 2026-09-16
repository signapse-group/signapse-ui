"use client"

import { useEffect, useState } from "react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { LandingAudienceFigure } from "./landing-audience-figure"
import styles from "./landing-page.module.css"

const AUDIENCE_IDS = [
  "audience-trader",
  "audience-analyst",
  "audience-strategy-developer",
  "audience-team-fund",
] as const

export function LandingAudienceSection({
  dictionary,
}: {
  dictionary: Dictionary
}) {
  const t = dictionary.landing.audiences
  const audiences = [
    {
      id: AUDIENCE_IDS[0],
      label: t.traderLabel,
      title: t.traderTitle,
      body: t.traderBody,
    },
    {
      id: AUDIENCE_IDS[1],
      label: t.analystLabel,
      title: t.analystTitle,
      body: t.analystBody,
    },
    {
      id: AUDIENCE_IDS[2],
      label: t.developerLabel,
      title: t.developerTitle,
      body: t.developerBody,
    },
    {
      id: AUDIENCE_IDS[3],
      label: t.teamLabel,
      title: t.teamTitle,
      body: t.teamBody,
    },
  ]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    function selectHashAudience() {
      const index = AUDIENCE_IDS.findIndex(
        (audienceId) => `#${audienceId}` === window.location.hash
      )
      if (index >= 0) setActiveIndex(index)
    }

    selectHashAudience()
    window.addEventListener("hashchange", selectHashAudience)
    return () => window.removeEventListener("hashchange", selectHashAudience)
  }, [])

  return (
    <section
      id="audiences"
      data-landing-section="audiences"
      data-landing-surface="dark"
      aria-labelledby="landing-audiences-heading"
      className={`${styles.darkSurface} border-b border-border/80 bg-background`}
    >
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <header className="flex max-w-5xl flex-col gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-chart-1 uppercase">
            {t.eyebrow}
          </p>
          <h2
            id="landing-audiences-heading"
            className={`${styles.landingDisplayHeading} max-w-4xl text-4xl leading-[1.04] sm:text-5xl lg:text-6xl`}
          >
            {t.heading}
          </h2>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.body}
          </p>
        </header>

        <div className={styles.audienceInteractive}>
          <div className={styles.audienceList}>
            {audiences.map((audience, index) => {
              const isActive = index === activeIndex

              return (
                <div
                  key={audience.label}
                  className={styles.audienceRow}
                  style={{
                    gridRow: index + 1 + (index > activeIndex ? 1 : 0),
                  }}
                >
                  <button
                    id={audience.id}
                    type="button"
                    aria-pressed={isActive}
                    data-audience-option={index + 1}
                    className={`${styles.audienceItem} ${isActive ? styles.audienceItemActive : ""}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className={styles.audienceItemLabel}>
                      {audience.label}
                    </span>
                    <span className={styles.audienceItemTitle}>
                      {audience.title}
                    </span>
                    {isActive ? (
                      <span className={styles.audienceItemBody}>
                        {audience.body}
                      </span>
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
          <div
            className={styles.audienceVisualMobile}
            style={{ gridRow: activeIndex + 2 }}
          >
            <LandingAudienceFigure activeIndex={activeIndex} />
          </div>
        </div>
      </div>
    </section>
  )
}
