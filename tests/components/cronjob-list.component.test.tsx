// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  pauseCronjob: vi.fn(),
  resumeCronjob: vi.fn(),
  startCronjob: vi.fn(),
  updateCronjob: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  routerRefresh: vi.fn(),
  searchParams: new URLSearchParams(
    "page=2&size=20&jobName%5BcontainsIgnoreCase%5D=market"
  ),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/cronjobs",
  useRouter: () => ({
    push: mocks.routerPush,
    replace: mocks.routerReplace,
    refresh: mocks.routerRefresh,
  }),
  useSearchParams: () => mocks.searchParams,
}))
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("@/app/api/cronjobs/action", () => ({
  pauseCronjob: mocks.pauseCronjob,
  resumeCronjob: mocks.resumeCronjob,
  startCronjob: mocks.startCronjob,
  updateCronjob: mocks.updateCronjob,
}))

import { en } from "@/app/lib/i18n/dictionaries/en"
import type { CronjobResponse } from "@/app/lib/cronjobs/definitions"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { CronjobListPage } from "@/app/[lang]/(main)/cronjobs/cronjob-list"
import { PermissionProvider } from "@/components/permission-provider"

const cronjobs = [
  {
    id: 1,
    jobName: "Scheduled and running",
    jobGroup: "MarketIntelligencePipelineJobGroupWithLongMetadata",
    scheduleStatus: "SCHEDULED",
    executionStatus: "RUNNING",
    cronExpression: "0 15,30 4,10 * JAN,MAR,SEP MON-FRI 2026/2",
    description:
      "This description contains the full operational context, recovery behavior, and source system information for the scheduled job.",
    latestResult: "SUCCESS",
    lastExecutedTime: "2026-11-05T07:00:00Z",
    nextTriggeredTime: "2026-11-05T07:05:00Z",
  },
  {
    id: 2,
    jobName: "Paused during execution",
    jobGroup: "market",
    scheduleStatus: "PAUSED",
    executionStatus: "RUNNING",
    cronExpression: "0 0/5 * * * ?",
    description: null,
    latestResult: null,
    lastExecutedTime: "2026-11-05T07:00:00Z",
    nextTriggeredTime: "2026-11-05T08:00:00Z",
  },
  {
    id: 3,
    jobName: "Paused after execution",
    jobGroup: "market",
    scheduleStatus: "PAUSED",
    executionStatus: "NOT_RUNNING",
    cronExpression: "0 0/5 * * * ?",
    description: "The last attempt failed.",
    latestResult: "FAILED",
    lastExecutedTime: "2026-11-05T06:55:00Z",
    nextTriggeredTime: null,
  },
  {
    id: 4,
    jobName: "Immediate trigger not started",
    jobGroup: "manual",
    scheduleStatus: "UNSCHEDULED",
    executionStatus: "NOT_RUNNING",
    cronExpression: "0 0/5 * * * ?",
    description: null,
    latestResult: null,
    lastExecutedTime: null,
    nextTriggeredTime: null,
  },
] satisfies CronjobResponse[]

const page = {
  content: cronjobs,
  number: 0,
  numberOfElements: cronjobs.length,
  size: 20,
  totalElements: cronjobs.length,
  totalPages: 1,
}

function renderCronjobList(
  permissions: string[],
  cronjobPage: ComponentProps<typeof CronjobListPage>["cronjobPage"] = page
) {
  return render(
    <LocalizationProvider locale="en" dictionary={en}>
      <PermissionProvider permissions={permissions}>
        <CronjobListPage cronjobPage={cronjobPage} />
      </PermissionProvider>
    </LocalizationProvider>
  )
}

describe("CronjobListPage", () => {
  beforeEach(() => {
    mocks.searchParams = new URLSearchParams(
      "page=2&size=20&jobName%5BcontainsIgnoreCase%5D=market"
    )
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders separate statuses, UTC timing, actual empty values, and both responsive compositions", () => {
    renderCronjobList(["cronjob:read"])

    const pausedCard = screen.getByRole("article", {
      name: "Paused during execution",
    })
    expect(within(pausedCard).getByText("Paused")).toBeVisible()
    expect(within(pausedCard).getByText("Running")).toBeVisible()
    expect(within(pausedCard).getByText("No result yet")).toBeVisible()
    expect(within(pausedCard).getByText("No next run")).toBeVisible()
    expect(
      screen.getByRole("columnheader", { name: "Cron expression (UTC)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Schedule" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Execution" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Latest result" })
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole("article", { name: "Immediate trigger not started" })
      ).getByText("Unscheduled")
    ).toBeVisible()
    expect(
      within(
        screen.getByRole("article", { name: "Immediate trigger not started" })
      ).queryByText("Running")
    ).toBeNull()

    const scheduledCard = screen.getByRole("article", {
      name: "Scheduled and running",
    })
    expect(
      within(scheduledCard).getByText(
        "This description contains the full operational context, recovery behavior, and source system information for the scheduled job.",
        { exact: true }
      )
    ).toBeVisible()
    expect(
      within(scheduledCard).getByText(
        "MarketIntelligencePipelineJobGroupWithLongMetadata",
        { exact: true }
      )
    ).toBeVisible()
    expect(
      within(scheduledCard).getByText(
        "0 15,30 4,10 * JAN,MAR,SEP MON-FRI 2026/2",
        { exact: true }
      )
    ).toBeVisible()

    const mobileCards = document.querySelector(".grid.md\\:hidden")
    const wideTable = document.querySelector(".hidden.md\\:block")
    expect(mobileCards).toBeInTheDocument()
    expect(wideTable).toBeInTheDocument()
    expect(
      within(pausedCard).queryByRole("button", { name: "Resume" })
    ).toBeNull()
    expect(
      within(pausedCard).queryByRole("button", { name: "Pause" })
    ).toBeNull()

    expect(
      screen.queryByRole("link", { name: "View details" })
    ).not.toBeInTheDocument()
  })

  it("shows only individually permitted controls and respects paused execution", () => {
    renderCronjobList(["cronjob:pause", "cronjob:resume", "cronjob:start"])

    const pausedRunning = screen.getByRole("article", {
      name: "Paused during execution",
    })
    const pausedStopped = screen.getByRole("article", {
      name: "Paused after execution",
    })
    const scheduledRunning = screen.getByRole("article", {
      name: "Scheduled and running",
    })
    const queued = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })

    expect(
      within(pausedRunning).getByRole("button", { name: "Resume" })
    ).toBeEnabled()
    expect(
      within(pausedStopped).getByRole("button", { name: "Resume" })
    ).toBeEnabled()
    expect(
      within(scheduledRunning).getByRole("button", { name: "Pause" })
    ).toBeEnabled()
    expect(
      within(scheduledRunning).queryByRole("button", { name: "Start" })
    ).toBeNull()
    expect(within(queued).getByRole("button", { name: "Start" })).toBeEnabled()
    expect(within(queued).queryByRole("button", { name: "Pause" })).toBeNull()
  })

  it("keeps loaded rows visible and labels missing pagination metadata", () => {
    renderCronjobList(["cronjob:read"], { content: [cronjobs[0]] })

    expect(
      screen.getByRole("article", { name: "Scheduled and running" })
    ).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Pagination details are unavailable"
    )
    expect(
      document.querySelector('[data-slot="app-pagination-footer"]')
    ).not.toBeInTheDocument()
  })

  it("distinguishes a no-match search from a genuinely empty list", () => {
    const emptyPage = {
      ...page,
      content: [],
      numberOfElements: 0,
      totalElements: 0,
      totalPages: 0,
    }

    mocks.searchParams = new URLSearchParams()
    const emptyRender = renderCronjobList(["cronjob:read"], emptyPage)
    expect(screen.getAllByText("No cronjobs yet")).toHaveLength(2)
    emptyRender.unmount()

    mocks.searchParams = new URLSearchParams(
      "jobName%5BcontainsIgnoreCase%5D=unmatched"
    )
    renderCronjobList(["cronjob:read"], emptyPage)
    expect(screen.getAllByText("No cronjobs match your search")).toHaveLength(2)
    expect(screen.queryByText("No cronjobs yet")).not.toBeInTheDocument()
  })
})
