import type { ReactNode } from "react"
import {
  Calendar,
  ExternalLink,
  FileText,
  GitBranch,
  Layers3,
} from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"

import { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatMessage } from "@/app/lib/i18n/messages"
import {
  formatDateTime as formatLocalizedDateTime,
  formatPercent,
} from "@/app/lib/i18n/format"
import { EventResponse } from "@/app/lib/events/definitions"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { AppTimeMetadata } from "@/components/app-time-metadata"

import {
  getEventStatusLabel,
  getEventStatusVariant,
} from "./event-presentation"

function formatDateTime(
  value: string | null | undefined,
  locale: AppLocale,
  dictionary: Dictionary
) {
  if (!value) {
    return dictionary.common.notAvailable
  }

  return formatLocalizedDateTime(
    value,
    locale,
    {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    dictionary.common.notAvailable
  )
}

function formatConfidence(
  value: number | undefined,
  locale: AppLocale,
  dictionary: Dictionary
) {
  if (typeof value !== "number") {
    return dictionary.common.notAvailable
  }

  return formatPercent(value <= 1 ? value : value / 100, locale, {
    maximumFractionDigits: 0,
  })
}

function QuickFact({
  label,
  value,
  valueNode,
}: {
  label: string
  value?: string
  valueNode?: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1">
        {valueNode ?? (
          <span className="text-sm font-medium text-foreground">{value}</span>
        )}
      </dd>
    </div>
  )
}

export function EventQuickDetailContent({
  canReadNewsArticles,
  dictionary,
  event,
  locale,
}: {
  canReadNewsArticles: boolean
  dictionary: Dictionary
  event: EventResponse
  locale: AppLocale
}) {
  const evidenceItems = event.evidence ?? []
  const assets = event.assets ?? []
  const primaryAssets = assets.slice(0, 4)

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getEventStatusVariant(event.status)}>
            {getEventStatusLabel(event.status, dictionary)}
          </Badge>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {event.description?.trim() || dictionary.events.detailNoDescription}
        </p>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2">
        <QuickFact
          label={dictionary.events.confidence}
          value={formatConfidence(event.confidence, locale, dictionary)}
        />
        <QuickFact
          label={dictionary.events.occurredAt}
          valueNode={
            <AppTimeMetadata icon={Calendar}>
              {formatDateTime(event.occurredAt, locale, dictionary)}
            </AppTimeMetadata>
          }
        />
      </dl>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="size-4 text-muted-foreground" />
          {dictionary.events.mainEvidence}
        </div>

        {evidenceItems.length ? (
          <div className="flex flex-col gap-3">
            {evidenceItems.slice(0, 4).map((evidence, index) => (
              <article
                key={`${evidence.newsArticleId ?? "evidence"}-${index}`}
                className="rounded-lg border bg-background p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {evidence.evidenceRole ? (
                    <Badge variant="secondary">
                      {
                        dictionary.events.evidenceRoleLabels[
                          evidence.evidenceRole
                        ]
                      }
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {formatMessage(dictionary.events.trusted, {
                      value: formatConfidence(
                        evidence.confidence,
                        locale,
                        dictionary
                      ),
                    })}
                  </Badge>
                </div>

                <h3 className="mt-2 line-clamp-2 text-sm font-medium">
                  {evidence.newsArticleTitle ||
                    dictionary.events.evidenceUntitled}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {evidence.sourceName || dictionary.newsArticles.noOutlet}
                  </span>
                  <AppTimeMetadata icon={Calendar}>
                    {formatDateTime(evidence.publishedAt, locale, dictionary)}
                  </AppTimeMetadata>
                </div>
                {evidence.evidenceNote?.trim() ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {evidence.evidenceNote}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {typeof evidence.newsArticleId === "number" &&
                  canReadNewsArticles ? (
                    <Link
                      href={`/news-articles/${evidence.newsArticleId}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      <FileText aria-hidden="true" data-icon="inline-start" />
                      {dictionary.events.viewArticle}
                    </Link>
                  ) : null}
                  {evidence.newsArticleUrl ? (
                    <a
                      href={evidence.newsArticleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      <ExternalLink
                        aria-hidden="true"
                        data-icon="inline-start"
                      />
                      {dictionary.events.openOriginal}
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {dictionary.events.noEvidenceQuick}
          </div>
        )}
      </section>

      {primaryAssets.length ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Layers3 className="size-4 text-muted-foreground" />
            {dictionary.events.relatedAssets}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {primaryAssets.map((asset, index) => (
              <div
                key={`${asset.assetId ?? "asset"}-${index}`}
                className="rounded-lg border bg-muted/20 p-3"
              >
                <div className="flex flex-wrap gap-2">
                  {asset.assetType ? (
                    <Badge variant="outline">
                      {dictionary.events.assetTypeLabels[asset.assetType]}
                    </Badge>
                  ) : null}
                  {asset.relationType ? (
                    <Badge variant="secondary">
                      {
                        dictionary.events.assetRelationLabels[
                          asset.relationType
                        ]
                      }
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 text-sm font-medium">
                  {asset.assetSymbol ||
                    asset.assetName ||
                    dictionary.events.noAssetName}
                </div>
                {asset.assetName ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {asset.assetName}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-muted/20 p-3">
        <AppTimeMetadata icon={Calendar}>
          {formatMessage(dictionary.events.lastUpdated, {
            time: formatDateTime(event.lastModifiedDate, locale, dictionary),
          })}
        </AppTimeMetadata>
      </section>
    </div>
  )
}
