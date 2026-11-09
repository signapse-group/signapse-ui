import type { ReactNode } from "react"

import { CardAction, CardHeader } from "@/components/ui/card"

export function OverviewModuleHeader({ children }: { children: ReactNode }) {
  return (
    <CardHeader className="max-[1440px]:has-data-[slot=card-action]:grid-cols-1">
      {children}
    </CardHeader>
  )
}

export function OverviewModuleAction({ children }: { children: ReactNode }) {
  return (
    <CardAction className="max-[1440px]:col-start-1 max-[1440px]:row-span-1 max-[1440px]:row-start-3 max-[1440px]:justify-self-start">
      {children}
    </CardAction>
  )
}
