// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  pauseCronjob: vi.fn(),
  resumeCronjob: vi.fn(),
  startCronjob: vi.fn(),
  getCronjobById: vi.fn(),
  updateCronjob: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
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
  getCronjobById: mocks.getCronjobById,
  pauseCronjob: mocks.pauseCronjob,
  resumeCronjob: mocks.resumeCronjob,
  startCronjob: mocks.startCronjob,
  updateCronjob: mocks.updateCronjob,
}))
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
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
  cronjobPage: ComponentProps<typeof CronjobListPage>["cronjobPage"] = page,
  locale: "en" | "vi" = "en"
) {
  return render(
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "en" ? en : viDictionary}
    >
      <PermissionProvider permissions={permissions}>
        <CronjobListPage cronjobPage={cronjobPage} />
      </PermissionProvider>
    </LocalizationProvider>
  )
}

describe("CronjobListPage", () => {
  beforeEach(() => {
    mocks.searchParams = new URLSearchParams("page=2&size=20&search=market")
    mocks.startCronjob.mockResolvedValue({ success: true, data: undefined })
    mocks.getCronjobById.mockResolvedValue(cronjobs[3])
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
    renderCronjobList([
      "cronjob:read",
      "cronjob:pause",
      "cronjob:resume",
      "cronjob:start",
    ])

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

  it("requires read permission before exposing Start", () => {
    renderCronjobList(["cronjob:start"])

    expect(screen.queryByRole("button", { name: "Start" })).toBeNull()
  })

  it("announces acceptance and updates the mobile card from the readback after keyboard activation", async () => {
    const user = userEvent.setup()
    const readback: CronjobResponse = {
      ...cronjobs[3],
      executionStatus: "RUNNING",
    }
    mocks.getCronjobById.mockResolvedValue(readback)
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    const start = within(card).getByRole("button", { name: "Start" })
    expect(start).toHaveTextContent("Start")
    start.focus()
    await user.keyboard("{Enter}")

    await waitFor(() => {
      expect(mocks.startCronjob).toHaveBeenCalledWith(4)
      expect(mocks.getCronjobById).toHaveBeenCalledWith(4)
      expect(within(card).queryByRole("button", { name: "Start" })).toBeNull()
    })
    expect(
      within(
        screen.getByRole("row", { name: /Immediate trigger not started/ })
      ).queryByRole("button", { name: "Start" })
    ).toBeNull()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Start request accepted.")
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Unscheduled")).toBeVisible()
    expect(within(card).getByText("No next run scheduled")).toBeVisible()
  })

  it("localizes the accepted feedback on the mobile card", async () => {
    const user = userEvent.setup()
    renderCronjobList(["cronjob:read", "cronjob:start"], page, "vi")

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    await user.click(within(card).getByRole("button", { name: "Khởi chạy" }))

    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(4))
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Đã tiếp nhận yêu cầu chạy ngay."
    )
  })

  it("reports a rejected start and still applies the wide row readback", async () => {
    const user = userEvent.setup()
    mocks.startCronjob.mockResolvedValue({
      success: false,
      error: "Cronjob 4 is already running.",
    })
    mocks.getCronjobById.mockResolvedValue({
      ...cronjobs[3],
      executionStatus: "RUNNING",
    })
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const row = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    await user.click(within(row).getByRole("button", { name: "Start" }))

    await waitFor(() => {
      expect(within(row).queryByRole("button", { name: "Start" })).toBeNull()
      expect(within(row).getByText("Running")).toBeVisible()
    })
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Cronjob 4 is already running."
    )
  })

  it("reads the latest state if the Start action call rejects", async () => {
    const user = userEvent.setup()
    mocks.startCronjob.mockRejectedValue(new Error("Network error"))
    mocks.getCronjobById.mockResolvedValue({
      ...cronjobs[3],
      executionStatus: "RUNNING",
    })
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    await user.click(within(card).getByRole("button", { name: "Start" }))

    await waitFor(() => {
      expect(mocks.getCronjobById).toHaveBeenCalledWith(4)
      expect(within(card).queryByRole("button", { name: "Start" })).toBeNull()
    })
    expect(mocks.toastError).toHaveBeenCalledWith("Could not start cronjob.")
  })

  it("locks Start while sending the request", async () => {
    const user = userEvent.setup()
    let resolveStart!: (result: { success: true; data: undefined }) => void
    mocks.startCronjob.mockReturnValue(
      new Promise((resolve) => {
        resolveStart = resolve
      })
    )
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    const row = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    const start = within(card).getByRole("button", { name: "Start" })
    await user.click(start)

    expect(start).toBeDisabled()
    expect(start).toHaveTextContent("Starting…")
    expect(
      within(row).getByRole("button", { name: "Starting…" })
    ).toBeDisabled()
    resolveStart({ success: true, data: undefined })
    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(4))
  })

  it("announces a readback failure and marks displayed mobile data as outdated", async () => {
    const user = userEvent.setup()
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    const row = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    await user.click(within(card).getByRole("button", { name: "Start" }))

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent(
      "Could not load the latest cronjob status. Displayed values may be outdated."
    )
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "Could not load the latest cronjob status. Displayed values may be outdated."
    )
    expect(within(card).getByText("Not running")).toBeVisible()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Start request accepted.")
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
