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
  searchParams: new URLSearchParams("page=2&size=20&search=market"),
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
    jobGroup: "market",
    scheduleStatus: "SCHEDULED",
    executionStatus: "RUNNING",
    cronExpression: "0 0/5 * * * ?",
    description: "A recurring market refresh.",
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
    nextTriggeredTime: null,
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
    mocks.searchParams = new URLSearchParams("page=2&size=20&search=market")
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
    expect(within(pausedCard).getByText("No result recorded")).toBeVisible()
    expect(within(pausedCard).getByText("No next run scheduled")).toBeVisible()
    expect(
      screen.getByRole("columnheader", { name: "Cron expression (UTC)" })
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole("article", { name: "Immediate trigger not started" })
      ).getByText("Unscheduled")
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

    const detailLink = within(pausedCard).getByRole("link", {
      name: "View details",
    })
    expect(detailLink.getAttribute("href")).toContain("detail=2")
    expect(detailLink.getAttribute("href")).toContain("page=2")
    expect(detailLink.getAttribute("href")).toContain("size=20")
    expect(detailLink.getAttribute("href")).toContain("search=market")
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
})
