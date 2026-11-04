"use client"

import { CalendarDays, ChevronDown, Filter, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"

import { getNewsArticlePublisherOptions } from "@/app/api/news-articles/action"
import {
  getBrowserTimeZone,
  setBrowserTimeZoneCookie,
} from "@/app/lib/i18n/time-zone"
import {
  NEWS_ARTICLE_STATUSES,
  type NewsArticleStatus,
} from "@/app/lib/news-articles/definitions"
import {
  clearNewsArticleFilters,
  NEWS_ARTICLE_SEARCH_PARAMS,
  removeNewsArticleFilter,
  type NewsArticleFilterKey,
} from "@/app/lib/news-articles/query"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SortSelect } from "@/components/sort-select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { NewsArticleSearch } from "./news-article-search"

const PUBLISHER_SEARCH_DEBOUNCE_MS = 250

function formatCalendarDate(value: string, locale: string) {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

export function NewsArticleFilters({ timeZone }: { timeZone: string }) {
  const { dictionary, formatMessage, intlLocale } = useLocalization()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [publisherOpen, setPublisherOpen] = useState(false)
  const [publisherSearch, setPublisherSearch] = useState("")
  const [publisherOptions, setPublisherOptions] = useState<string[]>([])
  const [isLoadingPublishers, setIsLoadingPublishers] = useState(false)
  const [publisherLoadError, setPublisherLoadError] = useState(false)
  const [dateRangeInvalid, setDateRangeInvalid] = useState(false)
  const publisherRequestId = useRef(0)

  const status = searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.status) ?? ""
  const sourceName =
    searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.sourceName) ?? ""
  const publishedFrom =
    searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom) ?? ""
  const publishedTo =
    searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.publishedTo) ?? ""
  const activeFilterCount =
    Number(Boolean(status)) +
    Number(Boolean(sourceName)) +
    Number(Boolean(publishedFrom || publishedTo))

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString()
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        })
      })
    },
    [pathname, router]
  )

  const setFilter = (key: NewsArticleFilterKey, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    navigateWithParams(params)
  }

  const loadPublisherOptions = useCallback(async (searchTerm: string) => {
    const requestId = ++publisherRequestId.current
    setIsLoadingPublishers(true)
    setPublisherLoadError(false)
    setPublisherOptions([])

    try {
      const options = await getNewsArticlePublisherOptions(searchTerm)
      if (requestId === publisherRequestId.current) {
        setPublisherOptions(options)
      }
    } catch {
      if (requestId === publisherRequestId.current) {
        setPublisherLoadError(true)
      }
    } finally {
      if (requestId === publisherRequestId.current) {
        setIsLoadingPublishers(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!publisherOpen) return

    const timeoutId = window.setTimeout(
      () => void loadPublisherOptions(publisherSearch.trim()),
      PUBLISHER_SEARCH_DEBOUNCE_MS
    )

    return () => {
      window.clearTimeout(timeoutId)
      publisherRequestId.current += 1
    }
  }, [loadPublisherOptions, publisherOpen, publisherSearch])

  const selectPublisher = (value: string) => {
    setFilter(NEWS_ARTICLE_SEARCH_PARAMS.sourceName, value)
    setPublisherOpen(false)
    setPublisherSearch("")
  }

  const updateDate = (
    key:
      | typeof NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom
      | typeof NEWS_ARTICLE_SEARCH_PARAMS.publishedTo,
    value: string
  ) => {
    const nextFrom =
      key === NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom ? value : publishedFrom
    const nextTo =
      key === NEWS_ARTICLE_SEARCH_PARAMS.publishedTo ? value : publishedTo

    if (nextFrom && nextTo && nextFrom > nextTo) {
      setDateRangeInvalid(true)
      return
    }

    setDateRangeInvalid(false)
    setBrowserTimeZoneCookie(getBrowserTimeZone())
    setFilter(key, value)
  }

  const removeFilter = (key: NewsArticleFilterKey) => {
    navigateWithParams(
      removeNewsArticleFilter(new URLSearchParams(searchParams), key)
    )
  }

  const clearFilters = () => {
    setDateRangeInvalid(false)
    navigateWithParams(
      clearNewsArticleFilters(new URLSearchParams(searchParams))
    )
  }

  const filterFieldsClassName = cn(
    "col-span-2 row-start-3 flex flex-wrap items-center gap-2",
    !mobileFiltersOpen && "hidden",
    "min-[768px]:row-start-2 min-[768px]:flex min-[1440px]:contents"
  )

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 min-[768px]:grid-cols-[minmax(0,1fr)_auto] min-[1440px]:flex min-[1440px]:flex-wrap">
        <NewsArticleSearch className="col-span-2 row-start-1 min-[768px]:col-span-1 min-[768px]:row-start-1 min-[1440px]:w-72 min-[1440px]:shrink-0" />
        <Button
          type="button"
          variant="outline"
          className="col-start-1 row-start-2 min-h-11 min-[768px]:hidden"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((open) => !open)}
        >
          <Filter data-icon="inline-start" />
          {dictionary.newsArticles.filtersLabel}
          <span>({activeFilterCount})</span>
          <ChevronDown
            data-icon="inline-end"
            className={cn(
              "transition-transform",
              mobileFiltersOpen && "rotate-180"
            )}
          />
        </Button>

        <SortSelect
          className="col-start-2 row-start-2 w-full min-[768px]:row-start-1 min-[768px]:w-auto min-[1440px]:order-last min-[1440px]:shrink-0"
          defaultValue="publishedAt_desc"
          options={[
            {
              label: dictionary.newsArticles.newest,
              value: "publishedAt_desc",
            },
            {
              label: dictionary.newsArticles.oldest,
              value: "publishedAt_asc",
            },
            {
              label: dictionary.newsArticles.createdDateSort,
              value: "createdDate_desc",
            },
          ]}
          triggerClassName="w-full min-[768px]:w-[200px] min-[1440px]:w-[180px]"
        />

        <div className={filterFieldsClassName}>
          <Select
            items={[
              {
                label: dictionary.newsArticles.allStatuses,
                value: "all",
              },
              ...NEWS_ARTICLE_STATUSES.map((articleStatus) => ({
                label: dictionary.newsArticles.statusLabels[articleStatus],
                value: articleStatus,
              })),
            ]}
            value={status || "all"}
            onValueChange={(value) =>
              setFilter(
                NEWS_ARTICLE_SEARCH_PARAMS.status,
                value === "all" ? "" : (value ?? "")
              )
            }
            disabled={isPending}
          >
            <SelectTrigger
              className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-[170px] min-[1440px]:w-[150px]"
              aria-label={dictionary.newsArticles.statusFilterLabel}
              aria-busy={isPending}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">
                  {dictionary.newsArticles.allStatuses}
                </SelectItem>
                {NEWS_ARTICLE_STATUSES.map((articleStatus) => (
                  <SelectItem key={articleStatus} value={articleStatus}>
                    {dictionary.newsArticles.statusLabels[articleStatus]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Popover
            open={publisherOpen}
            onOpenChange={(open) => {
              setPublisherOpen(open)
              if (!open) setPublisherSearch("")
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full justify-between gap-2 min-[768px]:min-h-9 min-[768px]:w-[220px] min-[1440px]:w-[205px]"
                  aria-label={
                    sourceName
                      ? `${dictionary.newsArticles.publisherFilterLabel}: ${sourceName}`
                      : dictionary.newsArticles.publisherFilterLabel
                  }
                  aria-expanded={publisherOpen}
                  disabled={isPending}
                />
              }
            >
              <span className="min-w-0 truncate">
                {sourceName
                  ? `${dictionary.newsArticles.publisherFilterLabel}: ${sourceName}`
                  : dictionary.newsArticles.publisherFilterLabel}
              </span>
              <ChevronDown data-icon="inline-end" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(18rem,calc(100vw-2rem))] overflow-hidden p-0"
            >
              <div className="border-b p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => selectPublisher("")}
                >
                  {dictionary.newsArticles.allPublishers}
                </Button>
              </div>
              <Command shouldFilter={false}>
                <CommandInput
                  value={publisherSearch}
                  onValueChange={setPublisherSearch}
                  placeholder={dictionary.newsArticles.publisherSearch}
                  aria-label={dictionary.newsArticles.publisherSearch}
                />
                <CommandList aria-busy={isLoadingPublishers}>
                  <CommandGroup>
                    {publisherOptions.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        aria-selected={sourceName === option}
                        onSelect={() => selectPublisher(option)}
                      >
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {isLoadingPublishers ? (
                    <div
                      role="status"
                      className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
                    >
                      <Spinner />
                      {dictionary.newsArticles.publisherOptionsLoading}
                    </div>
                  ) : null}
                  {publisherLoadError ? (
                    <div
                      role="alert"
                      className="flex flex-col items-start gap-2 px-3 py-3 text-sm"
                    >
                      <span>
                        {dictionary.newsArticles.publisherOptionsError}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void loadPublisherOptions(publisherSearch.trim())
                        }
                      >
                        {dictionary.newsArticles.publisherOptionsRetry}
                      </Button>
                    </div>
                  ) : null}
                  {!isLoadingPublishers &&
                  !publisherLoadError &&
                  publisherOptions.length === 0 ? (
                    <div
                      role="status"
                      className="px-3 py-3 text-sm text-muted-foreground"
                    >
                      {dictionary.newsArticles.publisherOptionsEmpty}
                    </div>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex min-w-0 items-center gap-1 rounded-lg border border-input px-2">
            <CalendarDays
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <label htmlFor="news-article-published-from" className="sr-only">
              {dictionary.newsArticles.startDateLabel}
            </label>
            <input
              id="news-article-published-from"
              type="date"
              value={publishedFrom}
              max={publishedTo || undefined}
              aria-invalid={dateRangeInvalid}
              aria-describedby={
                dateRangeInvalid ? "news-article-date-range-error" : undefined
              }
              className="h-9 w-[7.75rem] min-w-0 bg-transparent px-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
              onChange={(event) =>
                updateDate(
                  NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom,
                  event.target.value
                )
              }
            />
            <span
              aria-hidden="true"
              className="shrink-0 text-xs text-muted-foreground"
            >
              {dictionary.newsArticles.dateRangeSeparator}
            </span>
            <label htmlFor="news-article-published-to" className="sr-only">
              {dictionary.newsArticles.endDateLabel}
            </label>
            <input
              id="news-article-published-to"
              type="date"
              value={publishedTo}
              min={publishedFrom || undefined}
              aria-invalid={dateRangeInvalid}
              aria-describedby={
                dateRangeInvalid ? "news-article-date-range-error" : undefined
              }
              className="h-9 w-[7.75rem] min-w-0 bg-transparent px-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
              onChange={(event) =>
                updateDate(
                  NEWS_ARTICLE_SEARCH_PARAMS.publishedTo,
                  event.target.value
                )
              }
            />
          </div>
        </div>
      </div>

      {dateRangeInvalid ? (
        <p
          id="news-article-date-range-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {dictionary.newsArticles.dateRangeInvalid}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {formatMessage(dictionary.newsArticles.publishedDatesTimeZone, {
            timeZone,
          })}
        </span>
        {status ? (
          <FilterChip
            label={
              dictionary.newsArticles.statusLabels[status as NewsArticleStatus]
            }
            removeLabel={formatMessage(dictionary.newsArticles.removeFilter, {
              value:
                dictionary.newsArticles.statusLabels[
                  status as NewsArticleStatus
                ],
            })}
            onRemove={() => removeFilter(NEWS_ARTICLE_SEARCH_PARAMS.status)}
          />
        ) : null}
        {sourceName ? (
          <FilterChip
            label={`${dictionary.newsArticles.publisherFilterLabel}: ${sourceName}`}
            removeLabel={formatMessage(dictionary.newsArticles.removeFilter, {
              value: `${dictionary.newsArticles.publisherFilterLabel}: ${sourceName}`,
            })}
            onRemove={() => removeFilter(NEWS_ARTICLE_SEARCH_PARAMS.sourceName)}
          />
        ) : null}
        {publishedFrom ? (
          <FilterChip
            label={`${dictionary.newsArticles.startDateLabel}: ${formatCalendarDate(publishedFrom, intlLocale)}`}
            removeLabel={dictionary.newsArticles.clearStartDate}
            onRemove={() =>
              removeFilter(NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom)
            }
          />
        ) : null}
        {publishedTo ? (
          <FilterChip
            label={`${dictionary.newsArticles.endDateLabel}: ${formatCalendarDate(publishedTo, intlLocale)}`}
            removeLabel={dictionary.newsArticles.clearEndDate}
            onRemove={() =>
              removeFilter(NEWS_ARTICLE_SEARCH_PARAMS.publishedTo)
            }
          />
        ) : null}
        {activeFilterCount === 0 ? (
          <span>{dictionary.newsArticles.activeFiltersEmpty}</span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isPending}
            onClick={clearFilters}
          >
            {dictionary.newsArticles.clearFilters}
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  removeLabel,
  onRemove,
}: {
  label: string
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-md border border-border px-2 py-1 text-foreground">
      <span className="truncate">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6 shrink-0"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <X aria-hidden="true" />
      </Button>
    </span>
  )
}
