import { getCronjobById } from "@/app/api/cronjobs/action"
import type { CronjobResponse } from "@/app/lib/cronjobs/definitions"
import { formatDateTime } from "@/app/lib/i18n/format"
import { getRequestLocale, getServerDictionary } from "@/app/lib/i18n/server"
import { AccessDenied } from "@/components/access-denied"
import { LocalizedLink } from "@/components/localized-link"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileClock, X } from "lucide-react"
import type { ReactNode } from "react"

import { CronjobStatusFields } from "./cronjob-status-fields"

const UTC_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
}

export async function CronjobDetailContent({
  id,
  closeHref,
}: {
  id: string
  closeHref: string
}) {
  const dictionary = await getServerDictionary()
  const cronjobId = Number(id)

  if (!Number.isSafeInteger(cronjobId) || cronjobId < 1) {
    return (
      <CronjobNotFound
        closeHref={closeHref}
        title={dictionary.cronjobs.detailNotFoundTitle}
        description={dictionary.cronjobs.detailNotFoundDescription}
        closeLabel={dictionary.cronjobs.closeDetails}
      />
    )
  }

  let cronjob: CronjobResponse | undefined
  let responseErrorStatus: number | undefined

  try {
    cronjob = await getCronjobById(cronjobId)
  } catch (error) {
    responseErrorStatus = getBackendStatus(error)
    if (responseErrorStatus !== 403 && responseErrorStatus !== 404) {
      throw error
    }
  }

  if (responseErrorStatus === 403) {
    return (
      <section id="cronjob-detail-panel">
        <AccessDenied
          description={dictionary.cronjobs.readDenied}
          permission="cronjob:read"
        />
      </section>
    )
  }

  if (responseErrorStatus === 404) {
    return (
      <CronjobNotFound
        closeHref={closeHref}
        title={dictionary.cronjobs.detailNotFoundTitle}
        description={dictionary.cronjobs.detailNotFoundDescription}
        closeLabel={dictionary.cronjobs.closeDetails}
      />
    )
  }

  if (!cronjob) {
    throw new Error("Cronjob detail response was unavailable")
  }

  const locale = await getRequestLocale()

  return (
    <section
      id="cronjob-detail-panel"
      aria-labelledby="cronjob-detail-heading"
      className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="cronjob-detail-heading"
            className="text-lg font-semibold tracking-tight break-words"
          >
            {cronjob.jobName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dictionary.cronjobs.detailTitle}
          </p>
        </div>
        <LocalizedLink
          href={closeHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <X aria-hidden="true" data-icon="inline-start" />
          {dictionary.cronjobs.closeDetails}
        </LocalizedLink>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)]">
        <section aria-labelledby="cronjob-detail-status-heading">
          <h3
            id="cronjob-detail-status-heading"
            className="text-sm font-medium"
          >
            {dictionary.cronjobs.statusColumn}
          </h3>
          <CronjobStatusFields
            cronjob={cronjob}
            className="mt-3 flex flex-col gap-2"
          />
        </section>

        <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
          <DetailField
            label={dictionary.cronjobs.descriptionLabel}
            value={cronjob.description || dictionary.common.notAvailable}
            className="sm:col-span-2"
          />
          <DetailField
            label={dictionary.cronjobs.groupColumn}
            value={cronjob.jobGroup}
          />
          <DetailField
            label={dictionary.cronjobs.cronExpressionColumn}
            value={
              <code className="font-mono text-sm break-all">
                {cronjob.cronExpression}
              </code>
            }
          />
          <DetailField
            label={dictionary.cronjobs.lastExecutedTimeLabel}
            value={
              cronjob.lastExecutedTime ? (
                <time dateTime={cronjob.lastExecutedTime}>
                  {formatDateTime(
                    cronjob.lastExecutedTime,
                    locale,
                    UTC_DATE_TIME_OPTIONS,
                    dictionary.cronjobs.noPreviousExecution
                  )}
                </time>
              ) : (
                dictionary.cronjobs.noPreviousExecution
              )
            }
          />
          <DetailField
            label={dictionary.cronjobs.nextRunColumn}
            value={
              cronjob.nextTriggeredTime ? (
                <time dateTime={cronjob.nextTriggeredTime}>
                  {formatDateTime(
                    cronjob.nextTriggeredTime,
                    locale,
                    UTC_DATE_TIME_OPTIONS,
                    dictionary.cronjobs.noNextRun
                  )}
                </time>
              ) : (
                dictionary.cronjobs.noNextRun
              )
            }
          />
        </dl>
      </div>
    </section>
  )
}

function getBackendStatus(error: unknown): number | undefined {
  return error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : undefined
}

export function CronjobDetailSkeleton({ label }: { label: string }) {
  return (
    <section
      id="cronjob-detail-panel"
      role="status"
      aria-busy="true"
      aria-label={label}
      className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-6 w-56 max-w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full sm:col-span-2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </section>
  )
}

function CronjobNotFound({
  closeHref,
  title,
  description,
  closeLabel,
}: {
  closeHref: string
  title: string
  description: string
  closeLabel: string
}) {
  return (
    <Empty
      id="cronjob-detail-panel"
      role="status"
      className="min-h-[220px] rounded-xl border border-border bg-card px-6 py-10"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileClock aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <LocalizedLink
        href={closeHref}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <X aria-hidden="true" data-icon="inline-start" />
        {closeLabel}
      </LocalizedLink>
    </Empty>
  )
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 break-words">{value}</dd>
    </div>
  )
}
