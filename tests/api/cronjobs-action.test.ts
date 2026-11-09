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
      startError: "Could not start cronjob.",
      pauseError: "Could not pause cronjob.",
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

  it("accepts an API page with omitted optional pagination metadata", async () => {
    mocks.fetchAuthenticated.mockResolvedValue({ content: [cronjob] })

    await expect(
      getCronjobs({ filter: "", page: 0, size: 20, sort: [] })
    ).resolves.toEqual({ content: [cronjob] })
  })

  it("validates mutation responses against the same DTO while keeping callers intact", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(cronjob)

    await expect(pauseCronjob(42)).resolves.toEqual({
      success: true,
      data: cronjob,
    })
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/cronjobs/42/pause",
      { method: "POST" }
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cronjobs")
  })

  it("rejects blank schedule updates before sending a request", async () => {
    await expect(updateCronjob(42, { expression: " " })).resolves.toEqual({
      success: false,
      error: "Cron expression is required.",
    })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("returns localized fallback copy when a mutation response fails validation", async () => {
    mocks.fetchAuthenticated.mockResolvedValue({ invalid: true })

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
