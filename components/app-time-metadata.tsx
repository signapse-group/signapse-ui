import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface AppTimeMetadataProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  icon: LucideIcon
  iconClassName?: string
}

function AppTimeMetadata({
  children,
  className,
  contentClassName,
  icon: Icon,
  iconClassName,
}: AppTimeMetadataProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs leading-5 font-normal text-muted-foreground tabular-nums",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3 shrink-0", iconClassName)}
      />
      <span className={contentClassName}>{children}</span>
    </span>
  )
}

export { AppTimeMetadata }
