import { LockKeyholeIcon, MaximizeIcon, MinusIcon, XIcon } from "lucide-react"

import { Logo } from "@/components/logo"
import styles from "./landing-feature-showcase.module.css"

type BrowserChromeLabels = {
  workspace: string
  browserUrl: string
}

export function LandingDemoBrowserChrome({
  labels,
}: {
  labels: BrowserChromeLabels
}) {
  return (
    <header className={styles.browserChrome}>
      <span className={styles.browserChromeBrand}>
        <Logo width={22} height={22} colorScheme="light" />
        <strong>{labels.workspace}</strong>
      </span>
      <span className={styles.browserChromeAddress}>
        <LockKeyholeIcon aria-hidden="true" />
        <span>{labels.browserUrl}</span>
      </span>
      <span className={styles.browserChromeActions} aria-hidden="true">
        <span className={styles.browserChromeAction}>
          <MinusIcon />
        </span>
        <span className={styles.browserChromeAction}>
          <MaximizeIcon />
        </span>
        <span className={styles.browserChromeAction}>
          <XIcon />
        </span>
      </span>
    </header>
  )
}
