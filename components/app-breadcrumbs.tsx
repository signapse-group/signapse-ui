"use client"

import React from "react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { usePathname } from "next/navigation"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import { stripLocaleFromPathname } from "@/app/lib/i18n/routing"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"

function getFriendlySegmentNames(
  dictionary: Dictionary
): Record<string, string> {
  return {
    account: dictionary.accountProfile.title,
    categories: dictionary.navigation.categories,
    create: dictionary.common.create,
    "ai-provider-configs": dictionary.navigation.aiProviders,
    blogs: dictionary.navigation.blogs,
    cronjobs: dictionary.navigation.cronjobs,
    dashboard: dictionary.navigation.overview,
    "dashboard-prototype": dictionary.dashboardPrototype.routeLabel,
    "developer-token": dictionary.navigation.apiAccessToken,
    "economic-calendar": dictionary.navigation.economicCalendar,
    events: dictionary.navigation.events,
    feedback: dictionary.feedback.pageTitle,
    "feedback-submissions": dictionary.feedback.moderationTitle,
    "graph-view": dictionary.navigation.knowledgeGraph,
    "graph-view-g6-baseline": dictionary.graphView.demo.baselineTitle,
    "graph-view-sigma-demo": dictionary.graphView.demo.title,
    "market-charts": dictionary.navigation.marketCharts,
    "news-articles": dictionary.navigation.newsArticles,
    "news-outlets": dictionary.navigation.newsOutlets,
    roles: dictionary.navigation.roles,
    "source-documents": dictionary.navigation.sourceDocuments,
    "system-prompts": dictionary.navigation.systemPrompts,
    users: dictionary.navigation.users,
    "usage-limits": dictionary.navigation.usageLimits,
  }
}

function formatSegment(segment: string, index: number, dictionary: Dictionary) {
  const decodedSegment = decodeURIComponent(segment)
  const friendlySegmentNames = getFriendlySegmentNames(dictionary)

  if (friendlySegmentNames[decodedSegment]) {
    return friendlySegmentNames[decodedSegment]
  }

  if (index > 0) {
    return dictionary.common.detail
  }

  return decodedSegment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const { dictionary } = useLocalization()
  const segments = stripLocaleFromPathname(pathname).split("/").filter(Boolean)
  const overviewLabel = dictionary.navigation.overview
  const isDashboardRoute = segments.length === 1 && segments[0] === "dashboard"
  const showOverviewCrumb = !(
    segments.length === 1 && segments[0] === "graph-view"
  )
  const visibleSegments = isDashboardRoute ? [] : segments

  return (
    <Breadcrumb
      className="min-w-0"
      aria-label={dictionary.navigation.breadcrumb}
    >
      <BreadcrumbList className="flex-nowrap">
        {showOverviewCrumb ? (
          <BreadcrumbItem className="hidden md:block">
            {segments.length === 0 || isDashboardRoute ? (
              <BreadcrumbPage>{overviewLabel}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Link href="/dashboard" />}>
                {overviewLabel}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ) : null}

        {visibleSegments.map((segment, index) => {
          const href = `/${visibleSegments.slice(0, index + 1).join("/")}`
          const isLast = index === visibleSegments.length - 1
          const title = formatSegment(segment, index, dictionary)
          const showSeparator = showOverviewCrumb || index > 0

          return (
            <React.Fragment key={href}>
              {showSeparator ? (
                <BreadcrumbSeparator className="hidden md:block" />
              ) : null}
              <BreadcrumbItem
                className={!isLast ? "hidden md:block" : "min-w-0"}
              >
                {isLast ? (
                  <BreadcrumbPage className="max-w-[45vw] truncate md:max-w-[36rem]">
                    {title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
