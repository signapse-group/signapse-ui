import type { CSSProperties } from "react"

import styles from "./landing-page.module.css"

const PROVIDERS = [
  {
    name: "OpenAI",
    logo: "/images/providers/openai.svg",
    paint: "#0d0d0d",
  },
  {
    name: "Gemini",
    logo: "/images/providers/gemini.svg",
    paint: "linear-gradient(135deg, #078efb 12%, #a855f7 54%, #ea80b0 88%)",
  },
  {
    name: "Anthropic",
    logo: "/images/providers/anthropic.svg",
    paint: "#d97757",
  },
  {
    name: "DeepSeek",
    logo: "/images/providers/deepseek.svg",
    paint: "#4d6bfe",
  },
  { name: "Groq", logo: "/images/providers/groq.svg", paint: "#f55036" },
  { name: "Z.AI", logo: "/images/providers/zai.svg", paint: "#0d0d0d" },
] as const

type LandingProviderMarqueeProps = {
  label: string
}

export function LandingProviderMarquee({ label }: LandingProviderMarqueeProps) {
  return (
    <div className={styles.providerRail}>
      <div className={styles.providerMarquee}>
        <div className={styles.providerTrack}>
          {[false, true].map((isDuplicate) => (
            <ul
              key={String(isDuplicate)}
              aria-label={isDuplicate ? undefined : label}
              aria-hidden={isDuplicate || undefined}
              className={styles.providerList}
            >
              {PROVIDERS.map((provider) => (
                <li
                  key={provider.name}
                  data-provider-item={isDuplicate ? undefined : provider.name}
                  className={styles.providerItem}
                >
                  <span
                    aria-hidden="true"
                    data-provider-logo={provider.name}
                    className={styles.providerLogo}
                    style={
                      {
                        "--provider-logo": `url(${provider.logo})`,
                        "--provider-paint": provider.paint,
                      } as CSSProperties
                    }
                  />
                  <span>{provider.name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
