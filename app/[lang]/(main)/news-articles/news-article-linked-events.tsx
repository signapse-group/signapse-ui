import { ArrowUpRightIcon } from "lucide-react"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatPercent } from "@/app/lib/i18n/format"
import { formatMessage } from "@/app/lib/i18n/messages"
import type { LinkedEventSummaryResponse } from "@/app/lib/news-articles/definitions"
import { LocalizedLink as Link } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export function NewsArticleLinkedEvents({
  events,
  dictionary,
  canReadEvents,
  locale,
}: {
  events: LinkedEventSummaryResponse[]
  dictionary: Dictionary
  canReadEvents: boolean
  locale: AppLocale
}) {
  return (
    <section
      aria-labelledby="news-article-related-events"
      className="flex flex-col gap-3"
    >
      <h2
        id="news-article-related-events"
        className="text-lg font-semibold tracking-tight"
      >
        {dictionary.newsArticles.relatedEventsTitle}
      </h2>
      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {dictionary.newsArticles.linkedEventsEmptyTitle}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event, index) => {
            const eventTitle =
              event.eventTitle?.trim() ||
              event.eventCanonicalKey?.trim() ||
              dictionary.newsArticles.relatedEventUnavailable
            const canOpen =
              canReadEvents &&
              typeof event.eventId === "number" &&
              event.eventId > 0

            return (
              <li
                key={`${event.eventId ?? event.eventCanonicalKey ?? "event"}-${index}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {event.evidenceRole ? (
                    <Badge variant="secondary">
                      {
                        dictionary.newsArticles.evidenceRoleLabels[
                          event.evidenceRole
                        ]
                      }
                    </Badge>
                  ) : null}
                  {event.eventStatus ? (
                    <Badge variant="outline">
                      {dictionary.events.statusLabels[event.eventStatus]}
                    </Badge>
                  ) : null}
                </div>
                <p className="font-medium">{eventTitle}</p>
                {event.eventCanonicalKey ? (
                  <p className="text-sm text-muted-foreground">
                    {event.eventCanonicalKey}
                  </p>
                ) : null}
                {typeof event.evidenceConfidence === "number" ? (
                  <p className="text-sm text-muted-foreground">
                    {formatMessage(dictionary.events.confidencePrefix, {
                      value: formatPercent(
                        event.evidenceConfidence <= 1
                          ? event.evidenceConfidence
                          : event.evidenceConfidence / 100,
                        locale,
                        { maximumFractionDigits: 0 }
                      ),
                    })}
                  </p>
                ) : null}
                {event.evidenceNote?.trim() ? (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {event.evidenceNote}
                  </p>
                ) : null}
                {canOpen ? (
                  <Link
                    href={`/events/${event.eventId}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "self-start",
                    })}
                  >
                    {dictionary.newsArticles.openEvent}
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      data-icon="inline-end"
                    />
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
