"use client"

import { CheckCircle, Clock, Pause, Play, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { CronjobResponse } from "@/app/lib/cronjobs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Badge } from "@/components/ui/badge"

export type CronjobStatusFieldName = "schedule" | "execution" | "latestResult"

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
        variant={cronjob.latestResult === null ? "outline" : "secondary"}
      />
    </dl>
  )
}

export function CronjobStatusField({
  cronjob,
  field,
  className,
  labelClassName,
}: {
  cronjob: Pick<
    CronjobResponse,
    "scheduleStatus" | "executionStatus" | "latestResult"
  >
  field: CronjobStatusFieldName
  className?: string
  labelClassName?: string
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.cronjobs
  const presentation = getStatusPresentation(field, cronjob, t)
  const Icon = presentation.icon

  return (
    <dl
      className={`flex min-w-0 ${className ?? "items-center justify-between gap-2"}`}
    >
      <dt
        className={`max-w-full shrink-0 text-xs whitespace-normal text-muted-foreground ${labelClassName ?? ""}`}
      >
        {presentation.label}
      </dt>
      <dd className="max-w-full min-w-0">
        <Badge
          variant={presentation.variant}
          className={`h-auto max-w-full gap-0.5 overflow-visible px-1 text-left whitespace-normal ${
            presentation.variant === "destructive" ? "text-foreground" : ""
          }`}
        >
          {Icon ? <Icon aria-hidden="true" data-icon="inline-start" /> : null}
          <span className="break-words">{presentation.value}</span>
        </Badge>
      </dd>
    </dl>
  )
}

function getStatusPresentation(
  field: CronjobStatusFieldName,
  cronjob: Pick<
    CronjobResponse,
    "scheduleStatus" | "executionStatus" | "latestResult"
  >,
  t: ReturnType<typeof useLocalization>["dictionary"]["cronjobs"]
): {
  label: string
  value: string
  icon?: LucideIcon
  variant:
    "active" | "destructive" | "info" | "outline" | "secondary" | "warning"
} {
  if (field === "schedule") {
    return {
      label: t.scheduleLabel,
      value: t.scheduleStatuses[cronjob.scheduleStatus] ?? t.unknownStatus,
      icon: cronjob.scheduleStatus === "PAUSED" ? Pause : Clock,
      variant:
        cronjob.scheduleStatus === "PAUSED"
          ? "warning"
          : cronjob.scheduleStatus === "SCHEDULED"
            ? "info"
            : "secondary",
    }
  }

  if (field === "execution") {
    return {
      label: t.executionLabel,
      value:
        cronjob.executionStatus === "NOT_RUNNING"
          ? t.executionIdleStatus
          : (t.executionStatuses[cronjob.executionStatus] ?? t.unknownStatus),
      icon: cronjob.executionStatus === "RUNNING" ? Play : Clock,
      variant: cronjob.executionStatus === "RUNNING" ? "info" : "secondary",
    }
  }

  return {
    label: t.latestResultLabel,
    value:
      cronjob.latestResult === null
        ? t.noLatestResultList
        : (t.latestResults[cronjob.latestResult] ?? t.unknownStatus),
    icon:
      cronjob.latestResult === "SUCCESS"
        ? CheckCircle
        : cronjob.latestResult === "FAILED"
          ? X
          : undefined,
    variant:
      cronjob.latestResult === "SUCCESS"
        ? "active"
        : cronjob.latestResult === "FAILED"
          ? "destructive"
          : "outline",
  }
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
  variant?: "default" | "secondary" | "outline"
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <Badge variant={variant} className="max-w-full">
          {Icon ? <Icon aria-hidden="true" data-icon="inline-start" /> : null}
          <span className="truncate">{value}</span>
        </Badge>
      </dd>
    </div>
  )
}
