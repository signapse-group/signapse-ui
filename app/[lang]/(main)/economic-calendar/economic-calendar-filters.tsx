"use client"

import { ChevronDown, Filter, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { ECONOMIC_CALENDAR_IMPACT_LEVELS } from "@/app/lib/economic-calendar/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  ECONOMIC_CALENDAR_FILTER_PARAMS,
  clearEconomicCalendarFilters,
  setEconomicCalendarFilter,
  type EconomicCalendarControlFilterParam,
} from "./economic-calendar-date"

const FILTERS_PANEL_ID = "economic-calendar-filters-panel"
const CLEAR_FILTER_VALUE = "all"

export function EconomicCalendarFilters({
  currencyCodes,
}: {
  currencyCodes: string[]
}) {
  const { dictionary, formatMessage } = useLocalization()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const filtersTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null)
  const mobileClearFiltersRef = useRef<HTMLButtonElement>(null)
  const currencyFilterTriggerRef = useRef<HTMLButtonElement>(null)
  const impactFilterTriggerRef = useRef<HTMLButtonElement>(null)

  const currencyCode =
    searchParams.get(ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode) ?? ""
  const impactParam =
    searchParams
      .get(ECONOMIC_CALENDAR_FILTER_PARAMS.impact)
      ?.trim()
      .toUpperCase() ?? ""
  const impact = ECONOMIC_CALENDAR_IMPACT_LEVELS.find(
    (level) => level === impactParam
  )
  const activeFilterCount =
    Number(Boolean(currencyCode)) + Number(Boolean(impact))
  const currencyOptions = useMemo(() => {
    const options = new Set(
      currencyCodes.map((code) => code.trim()).filter(Boolean)
    )
    if (currencyCode) options.add(currencyCode)
    return [...options]
  }, [currencyCode, currencyCodes])

  const navigateWithParams = (params: URLSearchParams) => {
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? pathname + "?" + query : pathname, {
        scroll: false,
      })
    })
  }

  const setFilter = (
    key: EconomicCalendarControlFilterParam,
    value: string
  ) => {
    navigateWithParams(
      setEconomicCalendarFilter(new URLSearchParams(searchParams), key, value)
    )
  }

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false)
    filtersTriggerRef.current?.focus()
  }

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return

    const layoutBreakpoint = window.matchMedia("(min-width: 768px)")
    const moveFocusToVisibleFilter = (event: MediaQueryListEvent) => {
      const activeElement = document.activeElement

      if (
        event.matches &&
        (activeElement === filtersTriggerRef.current ||
          activeElement === mobileCloseButtonRef.current ||
          activeElement === mobileClearFiltersRef.current)
      ) {
        currencyFilterTriggerRef.current?.focus()
        return
      }

      if (
        !event.matches &&
        !mobileFiltersOpen &&
        (activeElement === currencyFilterTriggerRef.current ||
          activeElement === impactFilterTriggerRef.current)
      ) {
        filtersTriggerRef.current?.focus()
      }
    }

    layoutBreakpoint.addEventListener("change", moveFocusToVisibleFilter)
    return () =>
      layoutBreakpoint.removeEventListener("change", moveFocusToVisibleFilter)
  }, [mobileFiltersOpen])

  const selectClasses =
    "min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-[140px]"

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center">
      <Button
        ref={filtersTriggerRef}
        type="button"
        variant="outline"
        className="min-h-11 w-full justify-between min-[768px]:hidden"
        aria-expanded={mobileFiltersOpen}
        aria-controls={FILTERS_PANEL_ID}
        aria-busy={isPending}
        onClick={() => setMobileFiltersOpen((open) => !open)}
      >
        <span className="flex items-center gap-2">
          <Filter data-icon="inline-start" />
          {formatMessage(dictionary.economicCalendar.filtersLabel, {
            count: activeFilterCount,
          })}
        </span>
        <ChevronDown
          data-icon="inline-end"
          aria-hidden="true"
          className={cn(
            "transition-transform",
            mobileFiltersOpen && "rotate-180"
          )}
        />
      </Button>

      <div
        id={FILTERS_PANEL_ID}
        role="group"
        aria-labelledby="economic-calendar-filters-title"
        className={cn(
          "hidden w-full flex-col gap-3 rounded-xl border border-border bg-card p-3",
          mobileFiltersOpen && "flex",
          "min-[768px]:flex min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center min-[768px]:gap-2 min-[768px]:border-0 min-[768px]:bg-transparent min-[768px]:p-0"
        )}
      >
        <div className="flex items-center justify-between min-[768px]:hidden">
          <h2
            id="economic-calendar-filters-title"
            className="text-base font-semibold"
          >
            {dictionary.economicCalendar.filtersTitle}
          </h2>
          <Button
            ref={mobileCloseButtonRef}
            type="button"
            variant="ghost"
            className="size-11 min-[768px]:size-8"
            aria-label={dictionary.economicCalendar.closeFilters}
            onClick={closeMobileFilters}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="flex w-full flex-col gap-3 min-[768px]:w-auto min-[768px]:flex-row min-[768px]:gap-2">
          <div className="flex flex-col gap-1 min-[768px]:contents">
            <span
              id="economic-calendar-currency-filter-label"
              className="text-sm text-muted-foreground min-[768px]:sr-only"
            >
              {dictionary.economicCalendar.currencyFilterLabel}
            </span>
            <Select
              items={[
                {
                  label: dictionary.economicCalendar.allCurrencies,
                  value: CLEAR_FILTER_VALUE,
                },
                ...currencyOptions.map((code) => ({
                  label: code,
                  value: code,
                })),
              ]}
              value={currencyCode || null}
              onValueChange={(value) =>
                setFilter(
                  ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode,
                  value === CLEAR_FILTER_VALUE ? "" : (value ?? "")
                )
              }
              disabled={isPending}
            >
              <SelectTrigger
                ref={currencyFilterTriggerRef}
                className={selectClasses}
                aria-labelledby="economic-calendar-currency-filter-label"
                aria-busy={isPending}
              >
                <SelectValue
                  placeholder={dictionary.economicCalendar.currencyFilterLabel}
                />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value={CLEAR_FILTER_VALUE}>
                    {dictionary.economicCalendar.allCurrencies}
                  </SelectItem>
                  {currencyOptions.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-[768px]:contents">
            <span
              id="economic-calendar-impact-filter-label"
              className="text-sm text-muted-foreground min-[768px]:sr-only"
            >
              {dictionary.economicCalendar.impactFilterLabel}
            </span>
            <Select
              items={[
                {
                  label: dictionary.economicCalendar.allImpacts,
                  value: CLEAR_FILTER_VALUE,
                },
                ...ECONOMIC_CALENDAR_IMPACT_LEVELS.map((level) => ({
                  label: dictionary.economicCalendar.impactLabels[level],
                  value: level,
                })),
              ]}
              value={impact ?? null}
              onValueChange={(value) =>
                setFilter(
                  ECONOMIC_CALENDAR_FILTER_PARAMS.impact,
                  (value as string | null) === CLEAR_FILTER_VALUE
                    ? ""
                    : (value ?? "")
                )
              }
              disabled={isPending}
            >
              <SelectTrigger
                ref={impactFilterTriggerRef}
                className={selectClasses}
                aria-labelledby="economic-calendar-impact-filter-label"
                aria-busy={isPending}
              >
                <SelectValue
                  placeholder={dictionary.economicCalendar.impactFilterLabel}
                />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value={CLEAR_FILTER_VALUE}>
                    {dictionary.economicCalendar.allImpacts}
                  </SelectItem>
                  {ECONOMIC_CALENDAR_IMPACT_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {dictionary.economicCalendar.impactLabels[level]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          ref={mobileClearFiltersRef}
          type="button"
          variant="secondary"
          className="min-h-11 w-fit min-[768px]:hidden"
          onClick={() =>
            navigateWithParams(
              clearEconomicCalendarFilters(new URLSearchParams(searchParams))
            )
          }
          disabled={isPending || activeFilterCount === 0}
        >
          <X data-icon="inline-start" aria-hidden="true" />
          {dictionary.economicCalendar.clearFilters}
        </Button>
      </div>
    </div>
  )
}
