import type { ReactNode } from "react"

import { Badge } from "./ui/badge"

const categoryVariants = new Map<string, "info" | "emerging" | "warning">([
  ["EQUITY", "info"],
  ["ETF", "emerging"],
  ["COMMODITY", "warning"],
])

export function AssetCategoryBadge({
  type,
  children,
}: {
  type: string
  children: ReactNode
}) {
  return (
    <Badge variant={categoryVariants.get(type) ?? "secondary"}>
      {children}
    </Badge>
  )
}
