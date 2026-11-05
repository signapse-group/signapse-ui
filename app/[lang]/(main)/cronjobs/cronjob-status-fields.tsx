"use client"

import { CheckCircle, Clock, Pause, Play, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { CronjobResponse } from "@/app/lib/cronjobs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Badge } from "@/components/ui/badge"

export function CronjobStatusFields({
  cronjob,
  className,
}: {
  cronjob: Pick<
    CronjobResponse,
    "scheduleStatus" | "executionStatus" | "latestResult"
  >
  className?: string
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.cronjobs

  return (
    <dl className={className ?? "flex flex-col gap-1.5"}>
      <StatusField
        label={t.scheduleLabel}
        value={t.scheduleStatuses[cronjob.scheduleStatus] ?? t.unknownStatus}
        icon={cronjob.scheduleStatus === "PAUSED" ? Pause : Clock}
      />
      <StatusField
        label={t.executionLabel}
        value={t.executionStatuses[cronjob.executionStatus] ?? t.unknownStatus}
        icon={cronjob.executionStatus === "RUNNING" ? Play : Clock}
        variant={
          cronjob.executionStatus === "RUNNING" ? "default" : "secondary"
        }
      />
      <StatusField
        label={t.latestResultLabel}
        value={
          cronjob.latestResult === null
            ? t.noLatestResult
            : (t.latestResults[cronjob.latestResult] ?? t.unknownStatus)
        }
        icon={
          cronjob.latestResult === "SUCCESS"
            ? CheckCircle
            : cronjob.latestResult === "FAILED"
              ? X
              : undefined
        }
        variant={
          cronjob.latestResult === "FAILED"
            ? "destructive"
            : cronjob.latestResult === "SUCCESS"
              ? "secondary"
              : "outline"
        }
      />
    </dl>
  )
}

function StatusField({
  label,
  value,
  icon: Icon,
  variant = "secondary",
}: {
  label: string
  value: string
  icon?: LucideIcon
  variant?: "default" | "secondary" | "outline" | "destructive"
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <Badge
          variant={variant}
          className={`max-w-full ${
            variant === "destructive"
              ? "bg-destructive text-white dark:text-black"
              : ""
          }`}
        >
          {Icon ? <Icon aria-hidden="true" data-icon="inline-start" /> : null}
          <span className="truncate">{value}</span>
        </Badge>
      </dd>
    </div>
  )
}
