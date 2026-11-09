import type { NewsArticleStatus } from "@/app/lib/news-articles/definitions"
import { Badge } from "@/components/ui/badge"

export function NewsArticleStatusBadge({
  status,
  label,
}: {
  status: NewsArticleStatus
  label: string
}) {
  const className =
    status === "EVENT_RESOLVED"
      ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "CONTENT_FAILED" || status === "DERIVATION_FAILED"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : status === "DERIVATION_PENDING"
          ? "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-border bg-muted text-foreground"

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
