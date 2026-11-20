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
import type { EventResponse } from "@/app/lib/events/definitions"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { AppTimeMetadata } from "@/components/app-time-metadata"

import {
  getEventAssetRelationVariant,
  selectQuickEventAssets,
} from "./event-presentation"
import { EventSectionEmpty } from "./event-section-empty"

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
  value: number | null | undefined,
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
  watchlistAssetIds = [],
}: {
  canReadNewsArticles: boolean
  dictionary: Dictionary
  event: EventResponse
  locale: AppLocale
  watchlistAssetIds?: readonly number[]
}) {
  const evidenceItems = event.evidence ?? []
  const primaryAssets = selectQuickEventAssets(event.assets, watchlistAssetIds)
  const themes = event.themes ?? []

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <p className="text-sm leading-6 break-words text-muted-foreground">
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
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <GitBranch aria-hidden="true" className="size-4" />
          {dictionary.events.mainEvidence}
        </h3>

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

                <h3 className="mt-2 text-sm font-medium break-words">
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
                  <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
                    {evidence.evidenceNote}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {typeof evidence.newsArticleId === "number" ? (
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
                    ) : null
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {dictionary.events.articleIdentityUnavailable}
                    </span>
                  )}
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
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {dictionary.events.sourceUrlUnavailable}
                    </span>
                  )}
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

      <section className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <Layers3 aria-hidden="true" className="size-4" />
          {dictionary.events.relatedAssets}
        </h3>
        {primaryAssets.length ? (
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
                    <Badge
                      variant={getEventAssetRelationVariant(asset.relationType)}
                    >
                      {
                        dictionary.events.assetRelationLabels[
                          asset.relationType
                        ]
                      }
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 text-sm font-medium break-words">
                  {asset.assetSymbol ||
                    asset.assetName ||
                    dictionary.events.noAssetName}
                </div>
                {asset.assetName ? (
                  <div className="mt-1 text-xs break-words text-muted-foreground">
                    {asset.assetName}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EventSectionEmpty
            title={dictionary.events.noAssetsTitle}
            description={dictionary.events.noAssetsDescription}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <Layers3 aria-hidden="true" className="size-4" />
          {dictionary.events.relatedThemes}
        </h3>
        {themes.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {themes.map((theme, index) => (
              <div
                key={`${theme.themeId}-${index}`}
                className="rounded-lg border bg-muted/20 p-3"
              >
                {theme.relationType ? (
                  <Badge variant="secondary">
                    {dictionary.events.themeRelationLabels[theme.relationType]}
                  </Badge>
                ) : null}
                <div className="mt-2 text-sm font-medium break-words">
                  {theme.themeTitle || dictionary.events.noThemeName}
                </div>
                <div className="mt-1 text-xs break-words text-muted-foreground">
                  {theme.themeSlug || dictionary.events.noThemeSlug}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EventSectionEmpty
            title={dictionary.events.noThemesTitle}
            description={dictionary.events.noThemesDescription}
          />
        )}
      </section>

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
