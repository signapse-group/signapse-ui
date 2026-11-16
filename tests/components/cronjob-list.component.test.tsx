// @vitest-environment jsdom

import {
  act,
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

type UpdateCronjobResult =
  | { success: true; data: CronjobResponse }
  | {
      success: false
      error: string
      data?: CronjobResponse
      ambiguous?: boolean
    }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function mockCronjobBreakpoint() {
  let isWide = false
  const listeners = new Set<() => void>()
  const mediaQueryList = {
    get matches() {
      return isWide
    },
    media: "(min-width: 48rem)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener)
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList)
  )

  return {
    setWide(value: boolean) {
      isWide = value
      listeners.forEach((listener) => listener())
    },
  }
}

function renderCronjobList(
  permissions: string[],
  cronjobPage: ComponentProps<typeof CronjobListPage>["cronjobPage"] = page,
  locale: "en" | "vi" = "en"
) {
  return render(
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "vi" ? viDictionary : en}
    >
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
    mocks.startCronjob.mockResolvedValue({ success: true, data: undefined })
    mocks.resumeCronjob.mockResolvedValue({
      success: true,
      data: cronjobs[1],
    })
    mocks.getCronjobById.mockResolvedValue(cronjobs[3])
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
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

  it("distinguishes idle execution from a job with no previous result in Vietnamese", () => {
    renderCronjobList(["cronjob:read"], page, "vi")

    const completedJob = screen.getByRole("article", {
      name: "Paused after execution",
    })
    expect(within(completedJob).getByText("Không chạy")).toBeVisible()
    expect(within(completedJob).getByText("Thất bại")).toBeVisible()

    const notStartedJob = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    expect(within(notStartedJob).getByText("Không chạy")).toBeVisible()
    expect(within(notStartedJob).getByText("Chưa có kết quả")).toBeVisible()
  })

  it("offers schedule editing only to update-permitted operators for idle jobs", () => {
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const pausedIdleCard = screen.getByRole("article", {
      name: "Paused after execution",
    })
    const pausedRunningCard = screen.getByRole("article", {
      name: "Paused during execution",
    })
    const runningCard = screen.getByRole("article", {
      name: "Scheduled and running",
    })

    expect(
      within(pausedIdleCard).getByRole("button", {
        name: "Edit cron expression",
      })
    ).toBeVisible()
    expect(
      within(pausedRunningCard).queryByRole("button", {
        name: "Edit cron expression",
      })
    ).toBeNull()
    expect(
      within(runningCard).queryByRole("button", {
        name: "Edit cron expression",
      })
    ).toBeNull()

    const pausedIdleRow = screen.getByRole("row", {
      name: /Paused after execution/,
    })
    const runningRow = screen.getByRole("row", {
      name: /Scheduled and running/,
    })
    expect(
      within(pausedIdleRow).getByRole("button", {
        name: "Edit cron expression",
      })
    ).toBeVisible()
    expect(
      within(runningRow).queryByRole("button", {
        name: "Edit cron expression",
      })
    ).toBeNull()
  })

  it("does not offer schedule editing without cronjob:update", () => {
    renderCronjobList(["cronjob:read"])

    expect(
      screen.queryAllByRole("button", { name: "Edit cron expression" })
    ).toHaveLength(0)
  })

  it("supports keyboard editing and cancels back to the saved schedule", async () => {
    const user = userEvent.setup()
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    const edit = within(card).getByRole("button", {
      name: "Edit cron expression",
    })
    edit.focus()
    await user.keyboard("{Enter}")

    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveValue("0 0/5 * * * ?")
    expect(
      within(card).getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent?.includes("Saved schedule") === true
      )
    ).toBeVisible()
    expect(
      within(card).getByText("0 0/5 * * * ?", { exact: true })
    ).toBeVisible()

    await user.clear(input)
    await user.type(input, "0 5 * * * ?")
    await user.tab()
    expect(
      within(card).getByRole("button", { name: "Save cron expression" })
    ).toHaveFocus()
    await user.tab()
    const cancel = within(card).getByRole("button", { name: "Cancel edit" })
    expect(cancel).toHaveFocus()
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(
        within(card).queryByRole("textbox", { name: "Cron expression (UTC)" })
      ).not.toBeInTheDocument()
    )
    expect(
      within(card).getByText("0 0/5 * * * ?", { exact: true })
    ).toBeVisible()
    expect(
      within(card).getByRole("button", { name: "Edit cron expression" })
    ).toHaveFocus()
    expect(mocks.updateCronjob).not.toHaveBeenCalled()
  })

  it("keeps the draft and displays the actual saved schedule after an update error", async () => {
    const user = userEvent.setup()
    const actual = {
      ...cronjobs[2],
      cronExpression: "0 10 * * * ?",
      scheduleStatus: "PAUSED" as const,
      executionStatus: "NOT_RUNNING" as const,
    }
    mocks.updateCronjob.mockResolvedValue({
      success: false,
      error:
        "The requested schedule was not confirmed. The latest schedule readback is shown.",
      data: actual,
      ambiguous: true,
    })
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await user.clear(input)
    await user.type(input, "0 0 8 * * ?")
    await user.keyboard("{Enter}")

    const error = await within(card).findByRole("alert")
    expect(error).toHaveTextContent(
      "The requested schedule was not confirmed. The latest schedule readback is shown."
    )
    expect(input).toHaveValue("0 0 8 * * ?")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("aria-describedby", error.id)
    expect(input).toHaveFocus()
    expect(
      within(card).getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent?.includes("Saved schedule") === true
      )
    ).toBeVisible()
    expect(
      within(card).getByText("0 10 * * * ?", { exact: true })
    ).toBeVisible()
    expect(within(card).getByText("Paused")).toBeVisible()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.routerRefresh).toHaveBeenCalled()
  })

  it("restores focus to the error when a 409 readback reports the job is running", async () => {
    const user = userEvent.setup()
    const actual = {
      ...cronjobs[2],
      cronExpression: "0 10 * * * ?",
      executionStatus: "RUNNING" as const,
    }
    mocks.updateCronjob.mockResolvedValue({
      success: false,
      error: en.cronjobs.cronUpdateConflict,
      data: actual,
      ambiguous: true,
    })
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await user.clear(input)
    await user.type(input, "0 0 8 * * ?")
    await user.keyboard("{Enter}")

    const error = await within(card).findByRole("alert")
    await waitFor(() => expect(error).toHaveFocus())
    expect(input).toBeDisabled()
    expect(input).toHaveValue("0 0 8 * * ?")
    expect(input).toHaveAttribute("aria-describedby", error.id)
    expect(
      within(card).getByText("0 10 * * * ?", { exact: true })
    ).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it("labels the last confirmed schedule and says when the effective schedule is unverified", async () => {
    const user = userEvent.setup()
    mocks.updateCronjob.mockResolvedValue({
      success: false,
      error:
        "Could not confirm whether the requested schedule took effect. The effective schedule is unverified. Reload to check its current value.",
      ambiguous: true,
    })
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await user.clear(input)
    await user.type(input, "0 0 8 * * ?")
    await user.keyboard("{Enter}")

    expect(await within(card).findByRole("alert")).toHaveTextContent(
      "The effective schedule is unverified."
    )
    expect(input).toHaveValue("0 0 8 * * ?")
    expect(within(card).getByText(/Last confirmed schedule/)).toBeVisible()
    expect(
      within(card).getByText("Effective schedule unverified.")
    ).toBeVisible()
    expect(
      within(card).getByText("0 0/5 * * * ?", { exact: true })
    ).toBeVisible()

    const row = screen.getByRole("row", { name: /Paused after execution/ })
    expect(within(row).getByText(/Last confirmed schedule/)).toBeVisible()
    expect(
      within(row).getByText("Effective schedule unverified.")
    ).toBeVisible()
    expect(
      within(row).getByText("0 0/5 * * * ?", { exact: true })
    ).toBeVisible()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it.each(["success", "failure"] as const)(
    "restores focus to the visible Wide control after a pending Mobile save (%s)",
    async (outcome) => {
      const user = userEvent.setup()
      const breakpoint = mockCronjobBreakpoint()
      const pending = deferred<UpdateCronjobResult>()
      const updated = {
        ...cronjobs[2],
        cronExpression: "0 0 8 * * ?",
        scheduleStatus: "PAUSED" as const,
        executionStatus: "NOT_RUNNING" as const,
      }
      mocks.updateCronjob.mockReturnValue(pending.promise)
      renderCronjobList(["cronjob:read", "cronjob:update"])

      const card = screen.getByRole("article", {
        name: "Paused after execution",
      })
      await user.click(
        within(card).getByRole("button", { name: "Edit cron expression" })
      )
      const mobileInput = within(card).getByRole("textbox", {
        name: "Cron expression (UTC)",
      })
      await user.clear(mobileInput)
      await user.type(mobileInput, "0 0 8 * * ?")
      await user.keyboard("{Enter}")
      await waitFor(() => expect(mobileInput).toBeDisabled())
      expect(
        within(mobileInput.closest("form")!).getByRole("status")
      ).toHaveTextContent("Saving")

      act(() => breakpoint.setWide(true))

      pending.resolve(
        outcome === "success"
          ? { success: true, data: updated }
          : {
              success: false,
              error:
                "The requested schedule was not confirmed. The latest schedule readback is shown.",
              data: cronjobs[2],
              ambiguous: true,
            }
      )

      const row = screen.getByRole("row", { name: /Paused after execution/ })
      if (outcome === "success") {
        await waitFor(() =>
          expect(
            within(row).getByRole("button", { name: "Edit cron expression" })
          ).toHaveFocus()
        )
      } else {
        await waitFor(() =>
          expect(
            within(row).getByRole("textbox", {
              name: "Cron expression (UTC)",
            })
          ).toHaveFocus()
        )
      }
    }
  )

  it("restores focus to the input after a same-surface save failure settles", async () => {
    const user = userEvent.setup()
    const pending = deferred<UpdateCronjobResult>()
    mocks.updateCronjob.mockReturnValue(pending.promise)
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await user.clear(input)
    await user.type(input, "0 0 8 * * ?")
    await user.keyboard("{Enter}")
    await waitFor(() => expect(input).toBeDisabled())

    pending.resolve({
      success: false,
      error:
        "The requested schedule was not confirmed. The latest schedule readback is shown.",
      data: cronjobs[2],
      ambiguous: true,
    })

    await waitFor(() => {
      expect(input).toBeEnabled()
      expect(input).toHaveFocus()
    })
  })

  it("uses a successful PATCH response to update the expression and paused state", async () => {
    const user = userEvent.setup()
    const updated = {
      ...cronjobs[2],
      cronExpression: "0 0 8 * * ?",
      scheduleStatus: "PAUSED" as const,
      executionStatus: "NOT_RUNNING" as const,
    }
    mocks.updateCronjob.mockResolvedValue({ success: true, data: updated })
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    await user.clear(input)
    await user.type(input, "0 0 8 * * ?")
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(
        within(card).getByText("0 0 8 * * ?", { exact: true })
      ).toBeVisible()
    )
    expect(within(card).getByText("Paused")).toBeVisible()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Cron schedule updated.")
    expect(mocks.routerRefresh).toHaveBeenCalled()
  })

  it("sends long values to the producer because the API has no max length", async () => {
    const user = userEvent.setup()
    mocks.updateCronjob.mockResolvedValue({
      success: false,
      error:
        "Enter a valid Quartz cron expression. The saved schedule was not changed.",
      data: cronjobs[2],
      ambiguous: false,
    })
    renderCronjobList(["cronjob:read", "cronjob:update"])

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    await user.click(
      within(card).getByRole("button", { name: "Edit cron expression" })
    )
    const input = within(card).getByRole("textbox", {
      name: "Cron expression (UTC)",
    })
    const expression = "0".repeat(101)
    await user.clear(input)
    await user.type(input, expression)
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(mocks.updateCronjob).toHaveBeenCalledWith(3, { expression })
    )
    expect(input).toHaveValue(expression)
    expect(within(card).getByRole("alert").textContent).toContain(
      "Enter a valid Quartz cron expression."
    )
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
    expect(
      within(scheduledRunning).queryByRole("button", { name: "Resume" })
    ).toBeNull()
    expect(within(queued).getByRole("button", { name: "Start" })).toBeEnabled()
    expect(within(queued).queryByRole("button", { name: "Pause" })).toBeNull()
    expect(within(queued).queryByRole("button", { name: "Resume" })).toBeNull()
  })

  it("requires read permission before exposing Pause or Start", () => {
    renderCronjobList(["cronjob:start", "cronjob:pause"])

    expect(screen.queryByRole("button", { name: "Start" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull()
  })

  it("hides Pause without pause permission while keeping other permitted actions", () => {
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const scheduled = screen.getByRole("article", {
      name: "Scheduled and running",
    })
    const unscheduled = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    expect(
      within(scheduled).queryByRole("button", { name: "Pause" })
    ).toBeNull()
    expect(within(scheduled).getByRole("status")).toHaveTextContent(
      "You do not have permission to pause this cronjob."
    )
    expect(
      within(unscheduled).getByRole("button", { name: "Start" })
    ).toBeEnabled()
  })

  it("localizes the missing Pause permission explanation", () => {
    renderCronjobList(["cronjob:read"], page, "vi")

    const scheduled = screen.getByRole("article", {
      name: "Scheduled and running",
    })
    expect(within(scheduled).getByRole("status")).toHaveTextContent(
      "Bạn không có quyền tạm dừng cronjob này."
    )
    expect(
      within(scheduled).queryByRole("button", { name: "Tạm dừng" })
    ).toBeNull()
  })

  it("locks Pause while pending, reads back a paused running job, and focuses Resume", async () => {
    const user = userEvent.setup()
    const pausedRunning: CronjobResponse = {
      ...cronjobs[0],
      scheduleStatus: "PAUSED",
      executionStatus: "RUNNING",
      nextTriggeredTime: null,
    }
    let resolvePause!: (result: {
      success: true
      data: CronjobResponse
    }) => void
    mocks.pauseCronjob.mockReturnValue(
      new Promise((resolve) => {
        resolvePause = resolve
      })
    )
    mocks.getCronjobById.mockResolvedValue(pausedRunning)
    renderCronjobList(["cronjob:read", "cronjob:pause", "cronjob:resume"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    const pause = within(card).getByRole("button", { name: "Pause" })
    pause.focus()
    await user.keyboard("{Enter}")

    expect(pause).toBeDisabled()
    expect(pause).toHaveAccessibleName("Pausing…")
    expect(mocks.getCronjobById).not.toHaveBeenCalled()

    resolvePause({ success: true, data: pausedRunning })

    const resume = await within(card).findByRole("button", { name: "Resume" })
    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(1))
    expect(within(card).getByText("Paused")).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Succeeded")).toBeVisible()
    expect(within(card).getByText("No next run")).toBeVisible()
    expect(resume).toHaveFocus()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Cronjob paused.")
  })

  it("keeps the completed result separate and focuses the updated schedule without Resume permission", async () => {
    const user = userEvent.setup()
    const pausedAfterExecution: CronjobResponse = {
      ...cronjobs[0],
      scheduleStatus: "PAUSED",
      executionStatus: "NOT_RUNNING",
      latestResult: "FAILED",
      lastExecutedTime: "2026-11-14T12:00:00Z",
      nextTriggeredTime: null,
    }
    mocks.pauseCronjob.mockResolvedValue({
      success: true,
      data: pausedAfterExecution,
    })
    mocks.getCronjobById.mockResolvedValue(pausedAfterExecution)
    renderCronjobList(["cronjob:read", "cronjob:pause"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    const pause = within(card).getByRole("button", { name: "Pause" })
    pause.focus()
    await user.keyboard("{Enter}")

    const updatedSchedule =
      await within(card).findByLabelText("Schedule: Paused")
    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(1))
    expect(within(card).getByText("Idle")).toBeVisible()
    expect(within(card).getByText("Failed")).toBeVisible()
    expect(within(card).getByText("No next run")).toBeVisible()
    expect(updatedSchedule).toHaveFocus()
    expect(within(card).queryByRole("button", { name: "Resume" })).toBeNull()
  })

  it("shows the pause refusal and uses the successful readback after a failed request", async () => {
    const user = userEvent.setup()
    mocks.pauseCronjob.mockResolvedValue({
      success: false,
      error: "Cronjob schedule is not active.",
      ambiguous: false,
    })
    mocks.getCronjobById.mockResolvedValue(cronjobs[0])
    renderCronjobList(["cronjob:read", "cronjob:pause"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    await user.click(within(card).getByRole("button", { name: "Pause" }))

    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(1))
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Cronjob schedule is not active."
    )
    expect(within(card).getByText("Scheduled")).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).queryByText("No next run")).toBeNull()
    expect(within(card).getByRole("button", { name: "Pause" })).toBeEnabled()
  })

  it("reports success when a fresh read confirms Pause after an ambiguous request failure", async () => {
    const user = userEvent.setup()
    const pausedRunning: CronjobResponse = {
      ...cronjobs[0],
      scheduleStatus: "PAUSED",
      nextTriggeredTime: null,
    }
    mocks.pauseCronjob.mockResolvedValue({
      success: false,
      error: "Could not pause cronjob.",
      ambiguous: true,
    })
    mocks.getCronjobById.mockResolvedValue(pausedRunning)
    renderCronjobList(["cronjob:read", "cronjob:pause", "cronjob:resume"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    await user.click(within(card).getByRole("button", { name: "Pause" }))

    expect(
      await within(card).findByRole("button", { name: "Resume" })
    ).toBeVisible()
    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(1))
    expect(within(card).getByText("Paused")).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Succeeded")).toBeVisible()
    expect(within(card).getByText("No next run")).toBeVisible()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Cronjob paused.")
    expect(mocks.toastError).not.toHaveBeenCalled()
  })

  it("preserves a known pause refusal when the fresh read shows a concurrent pause", async () => {
    const user = userEvent.setup()
    const pausedRunning: CronjobResponse = {
      ...cronjobs[0],
      scheduleStatus: "PAUSED",
      nextTriggeredTime: null,
    }
    mocks.pauseCronjob.mockResolvedValue({
      success: false,
      error: "Your account is not provisioned for this action.",
      ambiguous: false,
    })
    mocks.getCronjobById.mockResolvedValue(pausedRunning)
    renderCronjobList(["cronjob:read", "cronjob:pause", "cronjob:resume"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    await user.click(within(card).getByRole("button", { name: "Pause" }))

    expect(
      await within(card).findByRole("button", { name: "Resume" })
    ).toBeVisible()
    await waitFor(() => expect(mocks.getCronjobById).toHaveBeenCalledWith(1))
    expect(within(card).getByText("Paused")).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Succeeded")).toBeVisible()
    expect(within(card).getByText("No next run")).toBeVisible()
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Your account is not provisioned for this action."
    )
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it("marks the previous values unverified when the pause readback fails", async () => {
    const user = userEvent.setup()
    mocks.pauseCronjob.mockResolvedValue({
      success: true,
      data: { ...cronjobs[0], scheduleStatus: "PAUSED" },
    })
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:pause"])

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    await user.click(within(card).getByRole("button", { name: "Pause" }))

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent("Current status is unknown.")
    expect(readError).toHaveTextContent("displayed values may be outdated.")
    expect(within(card).getByText("Scheduled")).toBeVisible()
    expect(within(card).getByRole("button", { name: "Pause" })).toBeDisabled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(within(card).getByRole("alert")).toHaveFocus()
  })

  it("localizes Pause readback failure feedback in Vietnamese", async () => {
    const user = userEvent.setup()
    mocks.pauseCronjob.mockResolvedValue({
      success: true,
      data: { ...cronjobs[0], scheduleStatus: "PAUSED" },
    })
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:pause"], page, "vi")

    const card = screen.getByRole("article", { name: "Scheduled and running" })
    await user.click(within(card).getByRole("button", { name: "Tạm dừng" }))

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent(
      "Chưa xác nhận được trạng thái hiện tại."
    )
    expect(readError).toHaveTextContent("thông tin đang hiển thị có thể đã cũ.")
    expect(readError).toHaveTextContent("UTC")
  })

  it.each([["cronjob:resume"], ["cronjob:read"]])(
    "requires both read and resume permission before exposing Resume",
    (permission) => {
      renderCronjobList([permission])

      expect(screen.queryByRole("button", { name: "Resume" })).toBeNull()
    }
  )

  it.each([
    ["en", "Resume", "You do not have permission to resume this cronjob."],
    ["vi", "Tiếp tục", "Bạn không có quyền tiếp tục cronjob này."],
  ])(
    "explains missing Resume permission on paused jobs in %s",
    (locale, resumeLabel, explanation) => {
      renderCronjobList(["cronjob:read"], page, locale as "en" | "vi")

      const pausedRunning = screen.getByRole("article", {
        name: "Paused during execution",
      })
      expect(
        within(pausedRunning).queryByRole("button", { name: resumeLabel })
      ).toBeNull()
      expect(within(pausedRunning).getByRole("status")).toHaveTextContent(
        explanation
      )
      expect(
        within(
          screen.getByRole("article", { name: "Paused after execution" })
        ).getByRole("status")
      ).toHaveTextContent(explanation)
    }
  )

  it("updates the wide row and mobile card from the effective Resume response", async () => {
    const user = userEvent.setup()
    const resumed: CronjobResponse = {
      ...cronjobs[1],
      scheduleStatus: "SCHEDULED",
      executionStatus: "RUNNING",
      latestResult: "FAILED",
      cronExpression: "0 10 * * * ?",
      nextTriggeredTime: "2026-11-17T00:10:00Z",
    }
    let resolveResume!: (result: {
      success: true
      data: CronjobResponse
    }) => void
    mocks.resumeCronjob.mockReturnValue(
      new Promise((resolve) => {
        resolveResume = resolve
      })
    )
    renderCronjobList(["cronjob:read", "cronjob:resume"])

    const card = screen.getByRole("article", {
      name: "Paused during execution",
    })
    const row = screen.getByRole("row", {
      name: /Paused during execution/,
    })
    const resume = within(card).getByRole("button", { name: "Resume" })
    resume.focus()
    await user.keyboard("{Enter}")

    expect(mocks.resumeCronjob).toHaveBeenCalledWith(2)
    expect(resume).toBeDisabled()
    expect(resume).toHaveAttribute("aria-busy", "true")
    expect(resume).toHaveAccessibleName("Resuming…")
    expect(
      within(row).getByRole("button", { name: "Resuming…" })
    ).toBeDisabled()

    resolveResume({ success: true, data: resumed })
    await waitFor(() => {
      expect(within(card).queryByRole("button", { name: "Resume" })).toBeNull()
      expect(within(card).getByRole("group", { name: "Actions" })).toHaveFocus()
    })

    expect(within(card).getByText("Scheduled")).toBeVisible()
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Failed")).toBeVisible()
    expect(within(card).getByText("0 10 * * * ?")).toBeVisible()
    expect(card.querySelector("time")).toHaveAttribute(
      "dateTime",
      "2026-11-17T00:10:00Z"
    )
    expect(within(row).getByText("Scheduled")).toBeVisible()
    expect(within(row).getByText("Running")).toBeVisible()
    expect(within(row).getByText("Failed")).toBeVisible()
    expect(within(row).getByText("0 10 * * * ?")).toBeVisible()
    expect(row.querySelector("time")).toHaveAttribute(
      "dateTime",
      "2026-11-17T00:10:00Z"
    )
    expect(mocks.getCronjobById).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Cronjob resumed.")
  })

  it("localizes Resume pending and success feedback", async () => {
    const user = userEvent.setup()
    const resumed: CronjobResponse = {
      ...cronjobs[2],
      scheduleStatus: "SCHEDULED",
      nextTriggeredTime: "2026-11-18T00:00:00Z",
    }
    let resolveResume!: (result: {
      success: true
      data: CronjobResponse
    }) => void
    mocks.resumeCronjob.mockReturnValue(
      new Promise((resolve) => {
        resolveResume = resolve
      })
    )
    renderCronjobList(["cronjob:read", "cronjob:resume"], page, "vi")

    const card = screen.getByRole("article", {
      name: "Paused after execution",
    })
    const resume = within(card).getByRole("button", { name: "Tiếp tục" })
    await user.click(resume)

    expect(resume).toBeDisabled()
    expect(resume).toHaveAttribute("aria-busy", "true")
    expect(resume).toHaveAccessibleName("Đang tiếp tục…")
    resolveResume({ success: true, data: resumed })
    await waitFor(() =>
      expect(
        within(card).queryByRole("button", { name: "Tiếp tục" })
      ).toBeNull()
    )
    expect(within(card).getByText("Đã lên lịch")).toBeVisible()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Đã tiếp tục cronjob.")
  })

  it.each([403, 404, 409, 500, 503])(
    "reads the actual state after Resume fails with HTTP %i",
    async (status) => {
      const user = userEvent.setup()
      const readback: CronjobResponse = {
        ...cronjobs[1],
        scheduleStatus: "SCHEDULED",
        executionStatus: "RUNNING",
        cronExpression: `0 ${status} * * * ?`,
        nextTriggeredTime: "2026-11-19T00:00:00Z",
      }
      mocks.resumeCronjob.mockResolvedValue({
        success: false,
        error: `Resume refused (${status}).`,
        ambiguous: status >= 500,
      })
      mocks.getCronjobById.mockResolvedValue(readback)
      renderCronjobList(["cronjob:read", "cronjob:resume"])

      const card = screen.getByRole("article", {
        name: "Paused during execution",
      })
      const row = screen.getByRole("row", {
        name: /Paused during execution/,
      })
      await user.click(within(card).getByRole("button", { name: "Resume" }))

      await waitFor(() => {
        expect(within(card).getByText(`0 ${status} * * * ?`)).toBeVisible()
        expect(within(card).getByText("Scheduled")).toBeVisible()
      })
      expect(mocks.resumeCronjob).toHaveBeenCalledWith(2)
      expect(mocks.getCronjobById).toHaveBeenCalledWith(2)
      expect(within(card).getByText("Running")).toBeVisible()
      expect(within(row).getByText(`0 ${status} * * * ?`)).toBeVisible()
      expect(within(row).getByText("Scheduled")).toBeVisible()
      if (status >= 500) {
        expect(mocks.toastSuccess).toHaveBeenCalledWith("Cronjob resumed.")
        expect(mocks.toastError).not.toHaveBeenCalled()
      } else {
        expect(mocks.toastError).toHaveBeenCalledWith(
          `Resume refused (${status}).`
        )
        expect(mocks.toastSuccess).not.toHaveBeenCalled()
      }
    }
  )

  it.each([
    [
      "en",
      "Resume",
      "Paused",
      "Resume was not confirmed. The latest schedule status is shown.",
    ],
    [
      "vi",
      "Tiếp tục",
      "Tạm dừng",
      "Chưa xác nhận được thao tác tiếp tục. Trạng thái lịch mới nhất đang được hiển thị.",
    ],
  ])(
    "does not report success when an ambiguous Resume readback is still paused in %s",
    async (locale, resumeLabel, pausedLabel, feedback) => {
      const user = userEvent.setup()
      const pausedReadback = {
        ...cronjobs[1],
        scheduleStatus: "PAUSED" as const,
      }
      mocks.resumeCronjob.mockResolvedValue({
        success: false,
        error: "Could not resume cronjob.",
        ambiguous: true,
      })
      mocks.getCronjobById.mockResolvedValue(pausedReadback)
      renderCronjobList(
        ["cronjob:read", "cronjob:resume"],
        page,
        locale as "en" | "vi"
      )

      const card = screen.getByRole("article", {
        name: "Paused during execution",
      })
      await user.click(within(card).getByRole("button", { name: resumeLabel }))

      await waitFor(() =>
        expect(mocks.getCronjobById).toHaveBeenCalledWith(pausedReadback.id)
      )
      expect(within(card).getByText(pausedLabel)).toBeVisible()
      expect(mocks.toastSuccess).not.toHaveBeenCalled()
      expect(mocks.toastError).toHaveBeenCalledWith(feedback)
    }
  )

  it("waits for Resume readback before reporting an ambiguous failure", async () => {
    const user = userEvent.setup()
    const resumed: CronjobResponse = {
      ...cronjobs[1],
      scheduleStatus: "SCHEDULED",
      cronExpression: "0 10 * * * ?",
      nextTriggeredTime: "2026-11-17T00:10:00Z",
    }
    let resolveReadback!: (cronjob: CronjobResponse) => void
    mocks.resumeCronjob.mockResolvedValue({
      success: false,
      error: "Could not resume cronjob.",
      ambiguous: true,
    })
    mocks.getCronjobById.mockReturnValue(
      new Promise((resolve) => {
        resolveReadback = resolve
      })
    )
    renderCronjobList(["cronjob:read", "cronjob:resume"])

    const card = screen.getByRole("article", {
      name: "Paused during execution",
    })
    await user.click(within(card).getByRole("button", { name: "Resume" }))

    await waitFor(() =>
      expect(mocks.getCronjobById).toHaveBeenCalledWith(resumed.id)
    )
    expect(mocks.toastError).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()

    resolveReadback(resumed)

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith("Cronjob resumed.")
    )
    expect(mocks.toastError).not.toHaveBeenCalled()
    expect(within(card).getByText("Scheduled")).toBeVisible()
    expect(within(card).getByText("0 10 * * * ?")).toBeVisible()
  })

  it("keeps a known Resume refusal when readback also fails", async () => {
    const user = userEvent.setup()
    mocks.resumeCronjob.mockResolvedValue({
      success: false,
      error: "You do not have permission to resume this cronjob.",
      ambiguous: false,
    })
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:resume"])

    const card = screen.getByRole("article", {
      name: "Paused during execution",
    })
    await user.click(within(card).getByRole("button", { name: "Resume" }))

    expect(await within(card).findByRole("alert")).toHaveTextContent(
      "Current status is unknown."
    )
    expect(mocks.toastError).toHaveBeenCalledWith(
      "You do not have permission to resume this cronjob."
    )
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it("marks Resume state unverified and locks actions when readback fails", async () => {
    const user = userEvent.setup()
    mocks.resumeCronjob.mockRejectedValue(new Error("Network error"))
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:resume"], page, "vi")

    const card = screen.getByRole("article", {
      name: "Paused during execution",
    })
    const row = screen.getByRole("row", {
      name: /Paused during execution/,
    })
    await user.click(within(card).getByRole("button", { name: "Tiếp tục" }))

    const alert = await within(card).findByRole("alert")
    expect(alert).toHaveTextContent("Chưa xác nhận được trạng thái hiện tại.")
    expect(alert).toHaveTextContent("thông tin đang hiển thị có thể đã cũ.")
    expect(within(card).getByText("Tạm dừng")).toBeVisible()
    expect(within(card).getByText("0 0/5 * * * ?")).toBeVisible()
    expect(
      within(card).getByRole("button", { name: "Tiếp tục" })
    ).toBeDisabled()
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "Chưa xác nhận được trạng thái hiện tại."
    )
    expect(mocks.toastError).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
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
    expect(start).toHaveClass("bg-positive-action")
    start.focus()
    await user.keyboard("{Enter}")

    await waitFor(() => {
      expect(mocks.startCronjob).toHaveBeenCalledWith(4)
      expect(mocks.getCronjobById).toHaveBeenCalledWith(4)
      expect(within(card).queryByRole("button", { name: "Start" })).toBeNull()
      expect(within(card).getByRole("group", { name: "Actions" })).toHaveFocus()
    })
    expect(
      within(
        screen.getByRole("row", { name: /Immediate trigger not started/ })
      ).queryByRole("button", { name: "Start" })
    ).toBeNull()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Start request accepted.")
    expect(within(card).getByText("Running")).toBeVisible()
    expect(within(card).getByText("Unscheduled")).toBeVisible()
    expect(within(card).getByText("No next run", { exact: true })).toBeVisible()
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
    const startButton = within(card).getByRole("button", { name: "Start" })
    startButton.focus()
    await user.keyboard("{Enter}")

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

  it("announces an unknown status with the read failure time and disables Start", async () => {
    const user = userEvent.setup()
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:start"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    const row = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    const startButton = within(card).getByRole("button", { name: "Start" })
    startButton.focus()
    await user.keyboard("{Enter}")

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent(
      "Current status is unknown. The latest read failed at"
    )
    expect(readError).toHaveTextContent("UTC")
    expect(readError).toHaveTextContent("displayed values may be outdated.")
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "Current status is unknown. The latest read failed at"
    )
    expect(within(card).getByText("Idle")).toBeVisible()
    expect(within(card).getByRole("button", { name: "Start" })).toBeDisabled()
    expect(within(card).getByRole("group", { name: "Actions" })).toHaveFocus()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Start request accepted.")
  })

  it("localizes the unknown status and timestamp after a mobile readback failure", async () => {
    const user = userEvent.setup()
    mocks.getCronjobById.mockRejectedValue(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:start"], page, "vi")

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    const row = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    await user.click(within(card).getByRole("button", { name: "Khởi chạy" }))

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent(
      "Chưa xác nhận được trạng thái hiện tại."
    )
    expect(readError).toHaveTextContent("Lần đọc thất bại lúc")
    expect(readError).toHaveTextContent("UTC")
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "Chưa xác nhận được trạng thái hiện tại."
    )
    expect(
      within(card).getByRole("button", { name: "Khởi chạy" })
    ).toBeDisabled()
  })

  it("marks an earlier readback stale and disables status actions after a later read fails", async () => {
    const user = userEvent.setup()
    const previouslyRead: CronjobResponse = {
      ...cronjobs[3],
      scheduleStatus: "SCHEDULED",
      latestResult: "FAILED",
      lastExecutedTime: "2026-11-14T12:00:00Z",
    }
    mocks.getCronjobById
      .mockResolvedValueOnce(previouslyRead)
      .mockRejectedValueOnce(new Error("HTTP 500"))
    renderCronjobList(["cronjob:read", "cronjob:start", "cronjob:pause"])

    const card = screen.getByRole("article", {
      name: "Immediate trigger not started",
    })
    await user.click(within(card).getByRole("button", { name: "Start" }))
    await waitFor(() => expect(within(card).getByText("Failed")).toBeVisible())

    await user.click(within(card).getByRole("button", { name: "Start" }))

    const readError = await within(card).findByRole("alert")
    expect(readError).toHaveTextContent("Current status is unknown.")
    expect(within(card).getByText("Failed")).toBeVisible()
    expect(within(card).getByRole("button", { name: "Start" })).toBeDisabled()
    expect(within(card).getByRole("button", { name: "Pause" })).toBeDisabled()
  })

  it("does not restore previous-page readbacks after a Start readback fails", async () => {
    const user = userEvent.setup()
    const secondCronjob: CronjobResponse = {
      ...cronjobs[3],
      id: 5,
      jobName: "Second immediate trigger",
    }
    const initialPage = {
      ...page,
      content: [cronjobs[3], secondCronjob],
      numberOfElements: 2,
      totalElements: 2,
    }
    const refreshedPage = {
      ...initialPage,
      content: [
        { ...cronjobs[3], executionStatus: "NOT_RUNNING" as const },
        secondCronjob,
      ],
    }
    mocks.getCronjobById
      .mockResolvedValueOnce({ ...cronjobs[3], executionStatus: "RUNNING" })
      .mockRejectedValueOnce(new Error("HTTP 500"))
    const view = renderCronjobList(
      ["cronjob:read", "cronjob:start"],
      initialPage
    )

    const firstRow = screen.getByRole("row", {
      name: /Immediate trigger not started/,
    })
    await user.click(within(firstRow).getByRole("button", { name: "Start" }))
    await waitFor(() =>
      expect(
        within(firstRow).queryByRole("button", { name: "Start" })
      ).toBeNull()
    )

    view.rerender(
      <LocalizationProvider locale="en" dictionary={en}>
        <PermissionProvider permissions={["cronjob:read", "cronjob:start"]}>
          <CronjobListPage cronjobPage={refreshedPage} />
        </PermissionProvider>
      </LocalizationProvider>
    )

    const secondRow = screen.getByRole("row", {
      name: /Second immediate trigger/,
    })
    await user.click(within(secondRow).getByRole("button", { name: "Start" }))
    await within(secondRow).findByRole("alert")

    expect(within(firstRow).getByText("Idle")).toBeVisible()
    expect(
      within(firstRow).getByRole("button", { name: "Start" })
    ).toBeEnabled()
  })

  it("keeps loaded rows visible and labels missing pagination metadata", () => {
    renderCronjobList(["cronjob:read"], { content: [cronjobs[0]] })

    expect(
      screen.getByRole("article", { name: "Scheduled and running" })
    ).toBeVisible()
    expect(
      screen.getByText("Pagination details are unavailable.")
    ).toBeVisible()
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
