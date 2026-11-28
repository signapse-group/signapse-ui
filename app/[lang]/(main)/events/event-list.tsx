"use client"

import { Calendar, Eye, GitBranch } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"

import { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { EventListResponse } from "@/app/lib/events/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SortSelect } from "@/components/sort-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EventSearch } from "./event-search"

interface EventListProps {
  eventPage: Page<EventListResponse>
  hasSearch: boolean
}

export function EventList({ eventPage, hasSearch }: EventListProps) {
  const {
    dictionary,
    formatDateTime,
    formatMessage,
    formatNumber,
    formatPercent,
  } = useLocalization()
  const events = eventPage.content

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          <EventSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            options={[
              {
                label: dictionary.events.newestOccurred,
                value: "occurredAt_desc",
              },
              { label: dictionary.events.oldest, value: "occurredAt_asc" },
              {
                label: dictionary.events.confidenceHigh,
                value: "confidence_desc",
              },
              {
                label: dictionary.events.createdDateSort,
                value: "createdDate_desc",
              },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      {events.length > 0 ? (
        <>
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatMessage(dictionary.events.resultsStatus, {
              page: formatNumber(eventPage.number + 1),
              count: formatNumber(eventPage.numberOfElements),
            })}
          </div>

          <div className="hidden md:block">
            <AppListTable>
              <Table>
                <TableHeader>
                  <AppListTableHeaderRow>
                    <AppListTableHead className="w-[44%]">
                      {dictionary.events.eventColumn}
                    </AppListTableHead>
                    <AppListTableHead className="w-44">
                      {dictionary.events.timeColumn}
                    </AppListTableHead>
                    <AppListTableHead className="w-28">
                      {dictionary.events.confidenceColumn}
                    </AppListTableHead>
                    <AppListTableHead className="w-20 text-right">
                      {dictionary.events.actionsColumn}
                    </AppListTableHead>
                  </AppListTableHeaderRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      className="border-border transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-1">
                          <Link
                            href={`/events/${event.id}`}
                            className="line-clamp-1 font-medium break-words hover:underline"
                          >
                            {event.title?.trim() || dictionary.events.untitled}
                          </Link>
                          <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                            {event.description?.trim() ||
                              dictionary.events.noDescription}
                          </span>
                          {event.canonicalKey?.trim() ? (
                            <span className="line-clamp-1 text-xs break-all text-muted-foreground">
                              {dictionary.events.canonicalKey}:{" "}
                              {event.canonicalKey}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="w-44">
                        <AppTimeMetadata icon={Calendar}>
                          {formatDateTime(
                            event.occurredAt,
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                            dictionary.common.notAvailable
                          )}
                        </AppTimeMetadata>
                      </TableCell>
                      <TableCell className="w-28 text-sm text-muted-foreground">
                        {typeof event.confidence === "number"
                          ? formatPercent(event.confidence, {
                              maximumFractionDigits: 0,
                            })
                          : dictionary.common.notAvailable}
                      </TableCell>
                      <TableCell className="w-20 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/events/${event.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                              className:
                                "text-muted-foreground hover:text-foreground",
                            })}
                          >
                            <Eye aria-hidden="true" data-icon="inline-start" />
                            <span className="sr-only">
                              {dictionary.events.viewDetail}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AppListTable>
          </div>

          <ul
            className="mt-4 flex flex-col gap-3 md:hidden"
            aria-label={dictionary.events.eventColumn}
          >
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/events/${event.id}`}
                    className="leading-6 font-medium break-words hover:underline"
                  >
                    {event.title?.trim() || dictionary.events.untitled}
                  </Link>
                  <p className="line-clamp-3 text-xs leading-5 break-words text-muted-foreground">
                    {event.description?.trim() ||
                      dictionary.events.noDescription}
                  </p>
                  {event.canonicalKey?.trim() ? (
                    <p className="line-clamp-1 text-xs break-all text-muted-foreground">
                      {dictionary.events.canonicalKey}: {event.canonicalKey}
                    </p>
                  ) : null}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-muted-foreground">
                      {dictionary.events.timeColumn}
                    </dt>
                    <dd className="mt-1 min-w-0 text-sm">
                      <AppTimeMetadata icon={Calendar}>
                        {formatDateTime(
                          event.occurredAt,
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                          dictionary.common.notAvailable
                        )}
                      </AppTimeMetadata>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      {dictionary.events.confidenceColumn}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {typeof event.confidence === "number"
                        ? formatPercent(event.confidence, {
                            maximumFractionDigits: 0,
                          })
                        : dictionary.common.notAvailable}
                    </dd>
                  </div>
                </dl>

                <div className="mt-2 flex justify-center">
                  <Link
                    href={`/events/${event.id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                      className:
                        "min-h-11 min-w-11 text-muted-foreground hover:text-foreground",
                    })}
                  >
                    <Eye aria-hidden="true" data-icon="inline-start" />
                    <span className="sr-only">
                      {dictionary.events.viewDetail}
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <AppListTable role="status" aria-live="polite" aria-atomic="true">
          <Empty className="min-h-[240px] rounded-none border-0 px-6 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GitBranch
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
              </EmptyMedia>
              <EmptyTitle>
                {hasSearch
                  ? dictionary.events.searchEmptyTitle
                  : dictionary.events.emptyTitle}
              </EmptyTitle>
              <EmptyDescription>
                {hasSearch
                  ? dictionary.events.searchEmptyDescription
                  : dictionary.events.emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </AppListTable>
      )}

      <AppPaginationControls page={eventPage} className="mt-4 md:pr-48" />
    </div>
  )
}
