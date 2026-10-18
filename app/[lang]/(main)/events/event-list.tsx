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
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { buttonVariants } from "@/components/ui/button"
import {
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
}

export function EventList({ eventPage }: EventListProps) {
  const { dictionary, formatDateTime, formatPercent } = useLocalization()
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
            {events.length > 0 ? (
              events.map((event) => (
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
                        {event.title}
                      </Link>
                      <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                        {event.description?.trim() ||
                          dictionary.events.noDescription}
                      </span>
                      {event.canonicalKey ? (
                        <span className="line-clamp-1 text-xs break-all text-muted-foreground">
                          {dictionary.events.canonicalKey}: {event.canonicalKey}
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
                        <Eye data-icon="inline-start" />
                        <span className="sr-only">
                          {dictionary.events.viewDetail}
                        </span>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={4}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <GitBranch className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.events.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.events.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={eventPage} className="mt-4" />
    </div>
  )
}
