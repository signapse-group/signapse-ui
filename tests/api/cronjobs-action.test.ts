import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getDictionary: vi.fn(),
  getRequestLocale: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: mocks.getRequestLocale,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import {
  getCronjobById,
  getCronjobs,
  pauseCronjob,
  startCronjob,
  updateCronjob,
} from "@/app/api/cronjobs/action"

const cronjob = {
  id: 42,
  jobName: "Refresh market data",
  jobGroup: "market-data",
  scheduleStatus: "PAUSED",
  executionStatus: "RUNNING",
  cronExpression: "0 0/5 * * * ?",
  description: null,
  latestResult: null,
  lastExecutedTime: "2026-11-05T07:00:00Z",
  nextTriggeredTime: null,
}

const page = {
  content: [cronjob],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  numberOfElements: 1,
  empty: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getRequestLocale.mockResolvedValue("en")
  mocks.getDictionary.mockResolvedValue({
    cronjobs: {
      cronRequired: "Cron expression is required.",
      cronUpdateError: "Could not update the cron schedule.",
      invalidCronjobId: "Invalid cronjob ID.",
      startError: "Could not start cronjob.",
      pauseError: "Could not pause cronjob.",
      pausePermissionDenied: "No permission to pause cronjob.",
      pauseProvisioningRejected: "Account is not provisioned for this action.",
      pauseNotFound: "Cronjob no longer exists.",
    },
  })
})

describe("cronjob API actions", () => {
  it("reads the list through the authenticated transport and validates its page", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(page)

    await expect(
      getCronjobs({ filter: "", page: 0, size: 20, sort: [] })
    ).resolves.toEqual(page)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/cronjobs?page=0&size=20"
    )
  })

  it("reads a detail with the shared DTO, including paused-running state", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(cronjob)

    await expect(getCronjobById(42)).resolves.toEqual(cronjob)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/cronjobs/42",
      undefined
    )
  })

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
    "42",
  ])("rejects invalid detail ID %s before sending a request", async (id) => {
    await expect(getCronjobById(id as number)).rejects.toThrow(
      "Invalid cronjob ID."
    )
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("accepts an API page with omitted optional pagination metadata", async () => {
    mocks.fetchAuthenticated.mockResolvedValue({ content: [cronjob] })

    await expect(
      getCronjobs({ filter: "", page: 0, size: 20, sort: [] })
    ).resolves.toEqual({ content: [cronjob] })
  })

  it("returns the validated Pause response without refreshing before readback", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(cronjob)

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: true,
      data: cronjob,
    })
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/cronjobs/42/pause",
      { method: "POST" }
    )
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid pause ID %s before sending a request", async (id) => {
    await expect(pauseCronjob(id)).resolves.toEqual({
      success: false,
      error: "Invalid cronjob ID.",
      ambiguous: false,
    })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
  })

  it.each([
    {
      status: 403,
      backendMessage: "Cronjob pause permission denied.",
      expected: "No permission to pause cronjob.",
    },
    {
      status: 404,
      backendMessage: "Cronjob not found.",
      expected: "Cronjob no longer exists.",
    },
    {
      status: 409,
      backendMessage: "Cronjob schedule is not active.",
      expected: "Could not pause cronjob.",
    },
    {
      status: 409,
      backendMessage: "Quartz did not pause schedule for cronjob sample.",
      expected: "Could not pause cronjob.",
    },
    {
      status: 409,
      backendCode: "USER_PROVISIONING_REJECTED",
      backendMessage: "Provisioning was rejected.",
      expected: "Account is not provisioned for this action.",
    },
    {
      status: 409,
      backendCode: "UNEXPECTED_CONFLICT",
      backendMessage: "Unexpected conflict.",
      expected: "Could not pause cronjob.",
    },
  ])(
    "returns localized API refusal for pause status $status",
    async ({ status, backendCode, backendMessage, expected }) => {
      const backendError = Object.assign(new Error(backendMessage), {
        status,
        code: backendCode,
      })
      mocks.fetchAuthenticated.mockRejectedValue(backendError)

      await expect(pauseCronjob(42)).resolves.toEqual({
        success: false,
        error: expected,
        ambiguous: false,
      })
    }
  )

  it("maps permission refusals through the active Vietnamese dictionary", async () => {
    mocks.getRequestLocale.mockResolvedValue("vi")
    mocks.getDictionary.mockResolvedValue({
      cronjobs: {
        pausePermissionDenied: "Bạn không có quyền tạm dừng cronjob này.",
      },
    })
    mocks.fetchAuthenticated.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 })
    )

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: false,
      error: "Bạn không có quyền tạm dừng cronjob này.",
      ambiguous: false,
    })
  })

  it("localizes a provisioning rejection in Vietnamese", async () => {
    mocks.getRequestLocale.mockResolvedValue("vi")
    mocks.getDictionary.mockResolvedValue({
      cronjobs: {
        pauseProvisioningRejected:
          "Tài khoản chưa được cấp cấu hình cho thao tác này.",
      },
    })
    mocks.fetchAuthenticated.mockRejectedValue(
      Object.assign(new Error("Provisioning rejected."), {
        status: 409,
        code: "USER_PROVISIONING_REJECTED",
      })
    )

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: false,
      error: "Tài khoản chưa được cấp cấu hình cho thao tác này.",
      ambiguous: false,
    })
  })

  it("uses the localized fallback when the pause transport fails", async () => {
    mocks.fetchAuthenticated.mockRejectedValue(new Error("fetch failed"))

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: false,
      error: "Could not pause cronjob.",
      ambiguous: true,
    })
  })

  it("marks HTTP 500 pause failures as ambiguous because the API may have applied the pause", async () => {
    mocks.fetchAuthenticated.mockRejectedValue(
      Object.assign(new Error("Scheduler readback failed."), { status: 500 })
    )

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: false,
      error: "Could not pause cronjob.",
      ambiguous: true,
    })
  })

  it("rejects blank schedule updates before sending a request", async () => {
    await expect(updateCronjob(42, { expression: " " })).resolves.toEqual({
      success: false,
      error: "Cron expression is required.",
    })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("treats POST success as acceptance without relying on its execution state", async () => {
    mocks.fetchAuthenticated.mockResolvedValue({
      ...cronjob,
      executionStatus: "NOT_RUNNING",
    })

    await expect(startCronjob(42)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/cronjobs/42/start",
      { method: "POST" }
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cronjobs")
  })

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid start ID %s before sending a request", async (id) => {
    await expect(startCronjob(id)).resolves.toEqual({
      success: false,
      error: "Could not start cronjob.",
    })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("returns a localized backend refusal when the start request fails", async () => {
    const backendError = Object.assign(
      new Error("Cronjob 42 is already running."),
      { status: 409 }
    )
    mocks.fetchAuthenticated.mockRejectedValue(backendError)

    await expect(startCronjob(42)).resolves.toEqual({
      success: false,
      error: "Cronjob 42 is already running.",
    })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("uses localized fallback copy for transport failures", async () => {
    mocks.fetchAuthenticated.mockRejectedValue(new Error("fetch failed"))

    await expect(startCronjob(42)).resolves.toEqual({
      success: false,
      error: "Could not start cronjob.",
    })
  })

  it("rejects an invalid read response instead of treating it as an empty list", async () => {
    mocks.fetchAuthenticated.mockResolvedValue({ content: [{}] })

    await expect(
      getCronjobs({ filter: "", page: 0, size: 20, sort: [] })
    ).rejects.toThrow()
  })
})
