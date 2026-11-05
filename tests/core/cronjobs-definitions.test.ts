import { describe, expect, it } from "vitest"

import {
  CronjobPageResponseSchema,
  CronjobRequestSchema,
  CronjobResponseSchema,
} from "@/app/lib/cronjobs/definitions"

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

describe("cronjob read contract schemas", () => {
  it("accepts an execution that continues after its schedule is paused", () => {
    expect(CronjobResponseSchema.parse(cronjob)).toEqual(cronjob)
  })

  it("preserves not-started and missing-result/next-run values", () => {
    const notStarted = {
      ...cronjob,
      scheduleStatus: "UNSCHEDULED",
      executionStatus: "NOT_RUNNING",
      latestResult: null,
      lastExecutedTime: null,
      nextTriggeredTime: null,
    }

    expect(CronjobResponseSchema.parse(notStarted)).toEqual(notStarted)
  })

  it("rejects the old combined jobStatus shape and unknown schedule states", () => {
    const legacyResponse: Record<string, unknown> = { ...cronjob }
    delete legacyResponse.scheduleStatus
    expect(CronjobResponseSchema.safeParse(legacyResponse).success).toBe(false)
    expect(
      CronjobResponseSchema.safeParse({
        ...cronjob,
        scheduleStatus: "COMPLETE",
      }).success
    ).toBe(false)
  })

  it("accepts a valid empty page and parses each row against the read DTO", () => {
    expect(CronjobPageResponseSchema.parse(page)).toEqual(page)
    expect(
      CronjobPageResponseSchema.parse({ ...page, content: [], empty: true })
        .content
    ).toEqual([])
    expect(
      CronjobPageResponseSchema.safeParse({ ...page, content: [{}] }).success
    ).toBe(false)
  })

  it("trims required schedule updates and rejects a blank expression", () => {
    expect(
      CronjobRequestSchema.parse({ expression: "  0 0 * * * ?  " })
    ).toEqual({ expression: "0 0 * * * ?" })
    expect(CronjobRequestSchema.safeParse({ expression: "  " }).success).toBe(
      false
    )
  })
})
