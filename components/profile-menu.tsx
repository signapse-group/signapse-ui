"use client"

import * as React from "react"
import { SignOutButton } from "@clerk/nextjs"
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ChevronsUpDownIcon,
  Gauge,
  KeyRound,
  LogOutIcon,
  MessageSquareText,
  RotateCcw,
} from "lucide-react"

import { getUsageLimits } from "@/app/api/usage-limits/action"
import type { UsageLimitsResponse } from "@/app/lib/usage-limits/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime, formatNumber } from "@/app/lib/i18n/format"
import { formatMessage } from "@/app/lib/i18n/messages"
import { useLocalization } from "@/app/lib/i18n/provider"
import { withLocalePath } from "@/app/lib/i18n/routing"
import { FeedbackComposeDialog } from "@/components/feedback/feedback-compose-dialog"
import { LocalizedLink as Link } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuContentInOverlay } from "@/components/ui/dropdown-menu-content-in-overlay"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const USER_MENU_TRIGGER_ID = "app-sidebar-user-menu-trigger"

export type ProfileMenuUser = {
  imageUrl: string
  fullName: string | null
  username: string | null
} | null

interface ProfileMenuProps {
  user: ProfileMenuUser
  isP0FixtureMode: boolean
  isMobile: boolean
}

type UsageLoadState =
  | { status: "idle" | "loading" | "error" }
  | { status: "loaded"; data: UsageLimitsResponse }

export function ProfileMenu({
  user,
  isP0FixtureMode,
  isMobile,
}: ProfileMenuProps) {
  const { dictionary, locale } = useLocalization()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [usageExpanded, setUsageExpanded] = React.useState(false)
  const [usageState, setUsageState] = React.useState<UsageLoadState>({
    status: "idle",
  })
  const [composeOpen, setComposeOpen] = React.useState(false)
  const usageRequestId = React.useRef(0)
  const usageDetailsId = React.useId()
  const usageTriggerId = React.useId()

  const loadUsageLimits = React.useCallback(async () => {
    const requestId = ++usageRequestId.current
    setUsageState({ status: "loading" })

    try {
      const data = await getUsageLimits()
      if (usageRequestId.current === requestId) {
        setUsageState({ status: "loaded", data })
      }
    } catch {
      if (usageRequestId.current === requestId) {
        setUsageState({ status: "error" })
      }
    }
  }, [])

  const handleUsageToggle = () => {
    if (usageExpanded) {
      usageRequestId.current += 1
      setUsageExpanded(false)
      setUsageState({ status: "idle" })
      return
    }

    setUsageExpanded(true)
    void loadUsageLimits()
  }

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open)
    if (!open) {
      usageRequestId.current += 1
      setUsageExpanded(false)
      setUsageState({ status: "idle" })
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
            id={USER_MENU_TRIGGER_ID}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user?.imageUrl ?? ""}
                alt={user?.fullName ?? ""}
              />
              <AvatarFallback className="rounded-lg text-foreground">
                CN
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user?.fullName ?? ""}
              </span>
              <span className="truncate text-xs">{user?.username ?? ""}</span>
            </div>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContentInOverlay
            className="w-[21rem] max-w-[calc(100vw-1rem)] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            aria-labelledby={USER_MENU_TRIGGER_ID}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.imageUrl ?? ""}
                      alt={user?.fullName ?? ""}
                    />
                    <AvatarFallback className="rounded-lg text-foreground">
                      CN
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName ?? ""}
                    </span>
                    <span className="truncate text-xs">
                      {user?.username ?? ""}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLinkItem render={<Link href="/account" />}>
                <BadgeCheckIcon aria-hidden="true" />
                {dictionary.auth.account}
              </DropdownMenuLinkItem>
              <DropdownMenuLinkItem render={<Link href="/developer-token" />}>
                <KeyRound aria-hidden="true" />
                {dictionary.navigation.apiAccessToken}
              </DropdownMenuLinkItem>
              <DropdownMenuItem>
                <BellIcon aria-hidden="true" />
                {dictionary.auth.notifications}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                id={usageTriggerId}
                closeOnClick={false}
                aria-expanded={usageExpanded}
                aria-controls={menuOpen ? usageDetailsId : undefined}
                onClick={handleUsageToggle}
              >
                <Gauge aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  {dictionary.usageLimits.title}
                </span>
                {usageExpanded ? (
                  <ChevronDownIcon aria-hidden="true" />
                ) : (
                  <ChevronRightIcon aria-hidden="true" />
                )}
              </DropdownMenuItem>
              <UsageLimitsDetails
                data={usageState.status === "loaded" ? usageState.data : null}
                dictionary={dictionary}
                hidden={!usageExpanded}
                id={usageDetailsId}
                locale={locale}
                status={usageState.status}
                triggerId={usageTriggerId}
              />
              {usageExpanded && usageState.status === "error" ? (
                <DropdownMenuItem
                  closeOnClick={false}
                  onClick={() => void loadUsageLimits()}
                >
                  <RotateCcw aria-hidden="true" />
                  {dictionary.common.retry}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setComposeOpen(true)}>
                <MessageSquareText aria-hidden="true" />
                {dictionary.feedback.composeAction}
              </DropdownMenuItem>
              <DropdownMenuLinkItem render={<Link href="/feedback" />}>
                <ClipboardListIcon aria-hidden="true" />
                {dictionary.feedback.historyAction}
              </DropdownMenuLinkItem>
            </DropdownMenuGroup>
            {isP0FixtureMode ? null : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <SignOutButton
                      redirectUrl={withLocalePath("/sign-in", locale)}
                    >
                      <div className="flex w-full items-center gap-2 px-1 py-1.5">
                        <LogOutIcon aria-hidden="true" />
                        <span>{dictionary.auth.signOut}</span>
                      </div>
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContentInOverlay>
        </DropdownMenu>
        <FeedbackComposeDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UsageLimitsDetails({
  data,
  dictionary,
  hidden,
  id,
  locale,
  status,
  triggerId,
}: {
  data: UsageLimitsResponse | null
  dictionary: Dictionary
  hidden: boolean
  id: string
  locale: "en" | "vi"
  status: UsageLoadState["status"]
  triggerId: string
}) {
  return (
    <div
      id={id}
      role="group"
      aria-labelledby={triggerId}
      aria-busy={status === "loading"}
      aria-live={status === "loaded" ? "polite" : undefined}
      hidden={hidden}
      className="min-w-0 py-1 pr-3 pl-8"
    >
      {status === "loading" ? (
        <div role="status" className="flex flex-col gap-2 py-2">
          <span className="text-xs text-muted-foreground">
            {dictionary.usageLimits.loadingLabel}
          </span>
          <span aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </span>
        </div>
      ) : null}
      {status === "error" ? (
        <div role="alert" className="flex flex-col gap-1 py-2 text-xs">
          <span className="font-medium text-foreground">
            {dictionary.usageLimits.errorTitle}
          </span>
          <span className="text-muted-foreground">
            {dictionary.usageLimits.errorDescription}
          </span>
        </div>
      ) : null}
      {status === "loaded" && data ? (
        <UsageLimitsSummary
          data={data}
          dictionary={dictionary}
          locale={locale}
        />
      ) : null}
    </div>
  )
}

function UsageLimitsSummary({
  data,
  dictionary,
  locale,
}: {
  data: UsageLimitsResponse
  dictionary: Dictionary
  locale: "en" | "vi"
}) {
  const resetAt = formatDateTime(
    data.conversationTurns.resetAtUtc,
    locale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    },
    dictionary.usageLimits.invalidResetTime
  )

  return (
    <div className="flex min-w-0 flex-col gap-1.5 py-2 text-xs">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b pb-1.5">
        <span className="min-w-0 font-semibold text-foreground">
          {dictionary.usageLimits.title}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {dictionary.usageLimits.usedLimit}
        </span>
      </div>
      <UsageMetricLine
        dictionary={dictionary}
        locale={locale}
        metric={data.workspace}
        title={dictionary.usageLimits.workspaceTitle}
      />
      <UsageMetricLine
        dictionary={dictionary}
        locale={locale}
        metric={data.conversationTurns}
        title={dictionary.usageLimits.conversationTurnsTitle}
      />
      <p className="text-muted-foreground">
        {dictionary.usageLimits.conversationTurnsDescription}
      </p>
      <p className="text-muted-foreground">
        {dictionary.usageLimits.resetAtLabel}:{" "}
        <time dateTime={data.conversationTurns.resetAtUtc}>
          {resetAt} {dictionary.usageLimits.utc}
        </time>
      </p>
      <UsageMetricLine
        dictionary={dictionary}
        locale={locale}
        metric={data.activeSchedules}
        title={dictionary.usageLimits.activeSchedulesTitle}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">
            {dictionary.usageLimits.watchlistTitle}
          </span>
          <span className="text-muted-foreground">
            {formatMessage(dictionary.usageLimits.perWorkspace, {
              limit: formatNumber(data.watchlist.limit, locale),
            })}
          </span>
        </div>
        {data.watchlist.workspaces.length === 0 ? (
          <p className="py-1 text-muted-foreground">
            {dictionary.usageLimits.noWorkspaces}
          </p>
        ) : (
          <div className="flex min-w-0 flex-col gap-1">
            {data.watchlist.workspaces.map((workspace) => (
              <div
                key={workspace.workspaceId}
                data-watchlist-workspace={workspace.workspaceId}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2"
              >
                <span className="min-w-0 break-words text-muted-foreground">
                  {formatMessage(dictionary.usageLimits.workspaceLabel, {
                    id: workspace.workspaceId,
                  })}
                </span>
                <span className="min-w-0 text-right font-mono break-all tabular-nums">
                  {formatNumber(workspace.used, locale)} /{" "}
                  {formatNumber(data.watchlist.limit, locale)}
                </span>
                {workspace.used > data.watchlist.limit ? (
                  <Badge
                    variant="outline"
                    className="col-span-2 justify-self-end"
                  >
                    {dictionary.usageLimits.overLimit}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UsageMetricLine({
  dictionary,
  locale,
  metric,
  title,
}: {
  dictionary: Dictionary
  locale: "en" | "vi"
  metric: { used: number; limit: number }
  title: string
}) {
  const percentage =
    metric.limit === 0
      ? metric.used === 0
        ? 0
        : 100
      : Math.min((metric.used / metric.limit) * 100, 100)

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
        <span className="min-w-0 font-medium break-words">{title}</span>
        <span className="min-w-0 text-right font-mono break-all tabular-nums">
          {formatNumber(metric.used, locale)} /{" "}
          {formatNumber(metric.limit, locale)}
        </span>
        {metric.used > metric.limit ? (
          <Badge variant="outline" className="col-span-2 justify-self-end">
            {dictionary.usageLimits.overLimit}
          </Badge>
        ) : null}
      </div>
      <Progress
        aria-label={title}
        aria-valuetext={`${formatNumber(metric.used, locale)} / ${formatNumber(metric.limit, locale)}`}
        aria-hidden="true"
        className="gap-0"
        value={percentage}
      />
    </div>
  )
}
