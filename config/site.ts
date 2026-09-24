import {
  CalendarClock,
  CalendarDays,
  ChartCandlestick,
  GalleryVerticalEnd,
  Gauge,
  LayoutDashboard,
  MessageSquareWarning,
  Newspaper,
  Settings2,
  UsersRound,
  Waypoints,
} from "lucide-react"

import { ECONOMIC_CALENDAR_NAV_PERMISSIONS } from "@/app/lib/economic-calendar/permissions"
import { EVENT_NAV_PERMISSIONS } from "@/app/lib/events/permissions"
import { GRAPH_VIEW_NAV_PERMISSIONS } from "@/app/lib/graph-view/permissions"
import { MARKET_CHART_NAV_PERMISSIONS } from "@/app/lib/market-charts/permissions"
import { NEWS_ARTICLE_NAV_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { NEWS_OUTLET_NAV_PERMISSIONS } from "@/app/lib/news-outlets/permissions"
import { SYSTEM_PROMPT_NAV_PERMISSIONS } from "@/app/lib/system-prompts/permissions"
import { TELEGRAM_NAV_PERMISSIONS } from "@/app/lib/telegram/permissions"
import { FEEDBACK_READ_PERMISSION } from "@/app/lib/feedback/permissions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export interface NavSubItem {
  id: string
  title: string
  url: string
  permission?: string | readonly string[]
}

export interface NavItem {
  id: string
  title: string
  url: string
  icon?: React.ElementType
  permission?: string | readonly string[]
  items?: NavSubItem[]
}

export interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

function hasPermissionMatch(
  permissions: string[],
  requirement?: string | readonly string[]
): boolean {
  if (!requirement) {
    return true
  }

  if (typeof requirement === "string") {
    return permissions.includes("*") || permissions.includes(requirement)
  }

  return requirement.some(
    (permission) => permissions.includes("*") || permissions.includes(permission)
  )
}

export function createSiteConfig(
  dictionary: Dictionary
) {
  return {
    teams: [
      {
        name: "Signapse",
        logo: GalleryVerticalEnd,
        plan: dictionary.common.adminDashboard,
      },
    ],
    brand: {
      name: "Signapse",
      logo: GalleryVerticalEnd,
      subtitle: dictionary.common.adminDashboard,
    },
    navMain: [
      {
        id: "analysis",
        title: dictionary.navigation.analysis,
        items: [
          {
            id: "overview",
            title: dictionary.navigation.overview,
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "knowledge-graph",
            title: dictionary.navigation.knowledgeGraph,
            url: "/graph-view",
            icon: Waypoints,
            permission: GRAPH_VIEW_NAV_PERMISSIONS,
          },
          {
            id: "market-charts",
            title: dictionary.navigation.marketCharts,
            url: "/market-charts",
            icon: ChartCandlestick,
            permission: MARKET_CHART_NAV_PERMISSIONS,
          },
        ],
      },
      {
        id: "data",
        title: dictionary.navigation.data,
        items: [
          {
            id: "news",
            title: dictionary.navigation.news,
            url: "#",
            icon: Newspaper,
            items: [
              {
                id: "news-articles",
                title: dictionary.navigation.newsArticles,
                url: "/news-articles",
                permission: NEWS_ARTICLE_NAV_PERMISSIONS,
              },
              {
                id: "news-outlets",
                title: dictionary.navigation.newsOutlets,
                url: "/news-outlets",
                permission: NEWS_OUTLET_NAV_PERMISSIONS,
              },
              {
                id: "blogs",
                title: dictionary.navigation.blogs,
                url: "/blogs",
                permission: "blog:read",
              },
            ],
          },
          {
            id: "events",
            title: dictionary.navigation.events,
            url: "/events",
            icon: CalendarDays,
            permission: EVENT_NAV_PERMISSIONS,
          },
          {
            id: "economic-calendar",
            title: dictionary.navigation.economicCalendar,
            url: "/economic-calendar",
            icon: CalendarClock,
            permission: ECONOMIC_CALENDAR_NAV_PERMISSIONS,
          },
        ],
      },
      {
        id: "administration",
        title: dictionary.navigation.administration,
        items: [
          {
            id: "system-configuration",
            title: dictionary.navigation.systemConfiguration,
            url: "#",
            icon: Settings2,
            items: [
              {
                id: "ai-providers",
                title: dictionary.navigation.aiProviders,
                url: "/ai-provider-configs",
                permission: "ai-provider-config:read",
              },
              {
                id: "system-prompts",
                title: dictionary.navigation.systemPrompts,
                url: "/system-prompts",
                permission: SYSTEM_PROMPT_NAV_PERMISSIONS,
              },
              {
                id: "cronjobs",
                title: dictionary.navigation.cronjobs,
                url: "/cronjobs",
                permission: "cronjob:read",
              },
              {
                id: "telegram",
                title: dictionary.navigation.telegram,
                url: "/telegram",
                permission: TELEGRAM_NAV_PERMISSIONS,
              },
            ],
          },
          {
            id: "users-and-permissions",
            title: dictionary.navigation.usersAndPermissions,
            url: "#",
            icon: UsersRound,
            items: [
              {
                id: "users",
                title: dictionary.navigation.users,
                url: "/users",
                permission: "user:update",
              },
              {
                id: "roles",
                title: dictionary.navigation.roles,
                url: "/roles",
                permission: "role:update",
              },
            ],
          },
          {
            id: "feedback-review",
            title: dictionary.navigation.feedbackReview,
            url: "/feedback-submissions",
            icon: MessageSquareWarning,
            permission: FEEDBACK_READ_PERMISSION,
          },
        ],
      },
      {
        id: "account",
        title: dictionary.navigation.account,
        items: [
          {
            id: "usage-limits",
            title: dictionary.navigation.usageLimits,
            url: "/usage-limits",
            icon: Gauge,
          },
        ],
      },
    ] satisfies NavSection[],
  }
}

export function filterNavItemsByPermissions(
  sections: NavSection[],
  permissions: string[]
): NavSection[] {
  return sections.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      const hasDirectPermission = hasPermissionMatch(
        permissions,
        item.permission
      )
      const filteredSubItems = item.items?.filter((subItem) =>
        hasPermissionMatch(permissions, subItem.permission)
      )

      if (filteredSubItems) {
        if (!hasDirectPermission || filteredSubItems.length === 0) {
          return []
        }

        return [{ ...item, items: filteredSubItems }]
      }

      return hasDirectPermission ? [item] : []
    })

    return items.length > 0 ? [{ ...section, items }] : []
  })
}
