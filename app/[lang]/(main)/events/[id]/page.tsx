import { Suspense, type ElementType, type ReactNode } from "react"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
  Hash,
  Layers3,
  RefreshCcw,
  TrendingUp,
} from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { notFound } from "next/navigation"

import { getEventById } from "@/app/api/events/action"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatMessage } from "@/app/lib/i18n/messages"
import {
  formatDateTime as formatLocalizedDateTime,
  formatNumber,
  formatPercent,
} from "@/app/lib/i18n/format"
import { getRequestLocale, getServerDictionary } from "@/app/lib/i18n/server"
import {
  EventMarketReactionDirection,
  EventMarketReactionSummaryResponse,
  EventResponse,
} from "@/app/lib/events/definitions"
import { EVENT_READ_PERMISSIONS } from "@/app/lib/events/permissions"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { AccessDenied } from "@/components/access-denied"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { EventEnrichButton } from "../event-enrich-button"
import { EventMarketReactionButton } from "../event-market-reaction-button"
import { EventSectionEmpty } from "../event-section-empty"
import {
  getEventAssetRelationVariant,
  getEventMarketReactionDirectionLabel,
  getEventMarketReactionDirectionVariant,
  getEventMarketReactionTimeHorizonLabel,
  getEventStatusLabel,
  getEventStatusVariant,
} from "../event-presentation"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

type ApiLikeError = Error & { status?: number }

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  if ((error as ApiLikeError).status === 404) {
    return true
  }

  return /(?:^|\b)(?:404|not[\s-]?found)(?:\b|$)/i.test(error.message)
}

function DetailCard({
  title,
  value,
  valueNode,
  icon: Icon,
}: {
  title: string
  value?: string
  valueNode?: ReactNode
  icon: ElementType
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="mt-2">
        {valueNode ?? (
          <p className="font-medium break-words text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string
  icon: ElementType
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
    </div>
  )
}

function countMarketReactionDirections(
  reactions: EventMarketReactionSummaryResponse[]
) {
  return reactions.reduce<
    Partial<Record<EventMarketReactionDirection, number>>
  >((counts, reaction) => {
    counts[reaction.direction] = (counts[reaction.direction] ?? 0) + 1
    return counts
  }, {})
}

function MarketReactionCard({
  reaction,
  dictionary,
  locale,
}: {
  reaction: EventMarketReactionSummaryResponse
  dictionary: Dictionary
  locale: AppLocale
}) {
  const assetSymbol = reaction.assetSymbol.trim()
  const assetName = reaction.assetName.trim()
  const assetLabel =
    assetSymbol ||
    assetName ||
    formatMessage(dictionary.events.assetIdFallback, { id: reaction.assetId })
  const showAssetName = assetName.length > 0 && assetName !== assetLabel

  return (
    <Card size="sm">
      <CardHeader className="gap-1 md:gap-3">
        <div className="col-span-full flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {dictionary.events.assetTypeLabels[reaction.assetType]}
          </Badge>
          <Badge
            variant={getEventMarketReactionDirectionVariant(reaction.direction)}
          >
            {getEventMarketReactionDirectionLabel(
              reaction.direction,
              dictionary
            )}
          </Badge>
          <Badge variant="secondary">
            {getEventMarketReactionTimeHorizonLabel(
              reaction.timeHorizon,
              dictionary
            )}
          </Badge>
        </div>

        <CardTitle>{assetLabel}</CardTitle>
        {showAssetName ? <CardDescription>{assetName}</CardDescription> : null}

        <CardAction className="row-span-1 row-start-2 text-right text-xs text-muted-foreground">
          <div>{dictionary.events.confidence}</div>
          <div className="font-medium text-foreground">
            {formatConfidence(reaction.confidence, locale, dictionary)}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 md:gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {dictionary.events.marketReactionReasoning}
          </p>
          <p className="text-sm leading-6 whitespace-pre-wrap text-foreground/90">
            {reaction.reasoning?.trim() || dictionary.events.noReasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function EventDetailPage({ params }: PageProps) {
  const permissions = await getCurrentPermissions()
  const locale = await getRequestLocale()
  const dictionary = await getServerDictionary()

  if (!hasAnyPermission(permissions, EVENT_READ_PERMISSIONS)) {
    return (
      <AccessDenied
        description={dictionary.events.detailDenied}
        permission={EVENT_READ_PERMISSIONS[0]}
      />
    )
  }

  const { id } = await params
  const eventId = Number(id)
  const canReadNewsArticles = hasAnyPermission(
    permissions,
    NEWS_ARTICLE_READ_PERMISSIONS
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/events"
          className={buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "gap-2",
          })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <Suspense fallback={<EventDetailSkeleton />}>
        <FetchEventData
          id={eventId}
          canReadNewsArticles={canReadNewsArticles}
          dictionary={dictionary}
          locale={locale}
        />
      </Suspense>
    </div>
  )
}

async function FetchEventData({
  id,
  canReadNewsArticles,
  dictionary,
  locale,
}: {
  id: number
  canReadNewsArticles: boolean
  dictionary: Dictionary
  locale: AppLocale
}) {
  let event: EventResponse

  try {
    event = await getEventById(id)
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }

    throw error
  }

  const assets = event.assets ?? []
  const themes = event.themes ?? []
  const evidenceItems = event.evidence ?? []
  const marketReactions = Array.isArray(event.marketReactions)
    ? event.marketReactions
    : null
  const marketReactionCounts: Partial<
    Record<EventMarketReactionDirection, number>
  > = marketReactions ? countMarketReactionDirections(marketReactions) : {}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getEventStatusVariant(event.status)}>
                {getEventStatusLabel(event.status, dictionary)}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl leading-tight font-semibold text-foreground">
                {event.title}
              </h1>
              <p className="max-w-4xl pt-1 text-sm leading-6 text-muted-foreground">
                {event.description?.trim() ||
                  dictionary.events.detailNoDescription}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
            <EventEnrichButton id={event.id} variant="outline" />
            <EventMarketReactionButton id={event.id} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailCard
            title={dictionary.events.confidence}
            value={formatConfidence(event.confidence, locale, dictionary)}
            icon={Layers3}
          />
          <DetailCard
            title={dictionary.events.occurredAt}
            valueNode={
              <AppTimeMetadata icon={Calendar}>
                {formatDateTime(event.occurredAt, locale, dictionary)}
              </AppTimeMetadata>
            }
            icon={Calendar}
          />
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeading title={dictionary.events.evidence} icon={GitBranch} />

          {evidenceItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              {evidenceItems.map((evidence, index) => (
                <div
                  key={`${evidence.newsArticleId ?? "evidence"}-${index}`}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-col gap-2">
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
                      </div>
                      <p className="font-medium text-foreground">
                        {evidence.newsArticleTitle ||
                          dictionary.events.articleUntitled}
                      </p>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span>
                          {dictionary.events.newsOutlet}:{" "}
                          {evidence.sourceName ||
                            dictionary.common.notAvailable}
                        </span>
                        <AppTimeMetadata icon={Calendar}>
                          {formatMessage(dictionary.events.publishedAt, {
                            time: formatDateTime(
                              evidence.publishedAt,
                              locale,
                              dictionary
                            ),
                          })}
                        </AppTimeMetadata>
                        <span>
                          {formatMessage(dictionary.events.confidencePrefix, {
                            value: formatConfidence(
                              evidence.confidence,
                              locale,
                              dictionary
                            ),
                          })}
                        </span>
                      </div>
                      {evidence.evidenceNote?.trim() ? (
                        <p className="text-sm leading-6 whitespace-pre-wrap text-foreground/90">
                          {evidence.evidenceNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {typeof evidence.newsArticleId === "number" &&
                      canReadNewsArticles ? (
                        <Link
                          href={`/news-articles/${evidence.newsArticleId}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "gap-2",
                          })}
                        >
                          <FileText data-icon="inline-start" />
                          {dictionary.events.viewArticle}
                        </Link>
                      ) : null}
                      {evidence.newsArticleUrl ? (
                        <a
                          href={evidence.newsArticleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "gap-2",
                          })}
                        >
                          <ExternalLink data-icon="inline-start" />
                          {dictionary.events.openOriginalLink}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EventSectionEmpty
              title={dictionary.events.noEvidenceTitle}
              description={dictionary.events.noEvidenceDescription}
            />
          )}
        </section>

        <section className="flex flex-col gap-2 md:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title={dictionary.events.marketReactions}
              icon={TrendingUp}
            />
            {marketReactions && marketReactions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatMessage(dictionary.events.reactionCount, {
                    count: formatNumber(marketReactions.length, locale),
                  })}
                </Badge>
                {(["BULLISH", "NEUTRAL", "BEARISH", "MIXED"] as const).map(
                  (direction) => {
                    const count = marketReactionCounts[direction] ?? 0

                    if (count === 0) {
                      return null
                    }

                    return (
                      <Badge
                        key={direction}
                        variant={getEventMarketReactionDirectionVariant(
                          direction
                        )}
                      >
                        {formatMessage(
                          dictionary.events.reactionCountByDirection,
                          {
                            count: formatNumber(count, locale),
                            direction: getEventMarketReactionDirectionLabel(
                              direction,
                              dictionary
                            ).toLowerCase(),
                          }
                        )}
                      </Badge>
                    )
                  }
                )}
              </div>
            ) : null}
          </div>

          {marketReactions === null ? (
            <div
              role="alert"
              className="flex flex-col gap-1 border-l-2 border-destructive pl-3 text-sm"
            >
              <p className="font-medium text-destructive">
                {dictionary.events.marketReactionsUnavailableTitle}
              </p>
              <p className="text-muted-foreground">
                {dictionary.events.marketReactionsUnavailableDescription}
              </p>
            </div>
          ) : marketReactions.length > 0 ? (
            <>
              <p className="text-sm leading-5 text-muted-foreground md:leading-6">
                {dictionary.events.marketReactionsDisclosure}
              </p>
              <div className="grid gap-2 min-[1440px]:grid-cols-4 md:gap-4 md:max-[1440px]:grid-cols-2">
                {marketReactions.map((reaction) => (
                  <MarketReactionCard
                    key={reaction.id}
                    reaction={reaction}
                    dictionary={dictionary}
                    locale={locale}
                  />
                ))}
              </div>
            </>
          ) : (
            <EventSectionEmpty
              title={dictionary.events.noMarketReactionsTitle}
              description={dictionary.events.noMarketReactionsDescription}
            />
          )}
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading
            title={dictionary.events.relatedAssets}
            icon={Layers3}
          />

          {assets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset, index) => (
                <div
                  key={`${asset.assetId ?? "asset"}-${index}`}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.assetType ? (
                      <Badge variant="outline">
                        {dictionary.events.assetTypeLabels[asset.assetType]}
                      </Badge>
                    ) : null}
                    {asset.relationType ? (
                      <Badge
                        variant={getEventAssetRelationVariant(
                          asset.relationType
                        )}
                      >
                        {
                          dictionary.events.assetRelationLabels[
                            asset.relationType
                          ]
                        }
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="font-medium text-foreground">
                      {asset.assetName || dictionary.events.noAssetName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {asset.assetSymbol || dictionary.events.noAssetSymbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMessage(dictionary.events.weight, {
                        value:
                          typeof asset.weight === "number"
                            ? formatNumber(asset.weight, locale, {
                                maximumFractionDigits: 2,
                              })
                            : dictionary.common.notAvailable,
                      })}
                    </p>
                  </div>
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

        <section className="flex flex-col gap-4">
          <SectionHeading
            title={dictionary.events.relatedThemes}
            icon={Layers3}
          />

          {themes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {themes.map((theme, index) => (
                <div
                  key={`${theme.themeId ?? "theme"}-${index}`}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {theme.relationType ? (
                      <Badge variant="secondary">
                        {
                          dictionary.events.themeRelationLabels[
                            theme.relationType
                          ]
                        }
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="font-medium text-foreground">
                      {theme.themeTitle || dictionary.events.noThemeName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {theme.themeSlug || dictionary.events.noThemeSlug}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMessage(dictionary.events.weight, {
                        value:
                          typeof theme.weight === "number"
                            ? formatNumber(theme.weight, locale, {
                                maximumFractionDigits: 2,
                              })
                            : dictionary.common.notAvailable,
                      })}
                    </p>
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

        <section className="rounded-lg border border-dashed bg-muted/10">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2 tracking-wide uppercase">
                <Hash className="h-4 w-4" />
                {dictionary.events.technicalInfo}
              </span>
              <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailCard
                title={dictionary.events.canonicalKey}
                value={event.canonicalKey || dictionary.common.notAvailable}
                icon={GitBranch}
              />
              <DetailCard
                title={dictionary.events.createdAt}
                valueNode={
                  <AppTimeMetadata icon={Clock3}>
                    {formatDateTime(event.createdDate, locale, dictionary)}
                  </AppTimeMetadata>
                }
                icon={Clock3}
              />
              <DetailCard
                title={dictionary.events.updatedAt}
                valueNode={
                  <AppTimeMetadata icon={RefreshCcw}>
                    {formatDateTime(event.lastModifiedDate, locale, dictionary)}
                  </AppTimeMetadata>
                }
                icon={RefreshCcw}
              />
            </div>
          </details>
        </section>
      </div>
    </div>
  )
}

function EventDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-5 w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  )
}
