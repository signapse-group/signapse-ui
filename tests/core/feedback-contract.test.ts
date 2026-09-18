import { afterEach, describe, expect, it, vi } from "vitest"

import {
  FEEDBACK_MAX_CONTENT_LENGTH,
  feedbackDetailResponseSchema,
  feedbackListResponseSchema,
  feedbackPageResponseSchema,
  feedbackSubmissionSchema,
} from "@/app/lib/feedback/definitions"
import {
  mapFeedbackDetail,
  mapFeedbackListItem,
} from "@/app/lib/feedback/mappers"
import { normalizeFeedbackError } from "@/app/lib/feedback/errors"
import { validateFeedbackScreenshot } from "@/app/lib/feedback/validation"
import {
  parseFeedbackModerationQuery,
  serializeFeedbackModerationQuery,
} from "@/app/lib/feedback/query"

const listItem = {
  id: 42,
  content: "The chart does not refresh after changing the selected asset.",
  status: "PENDING_REVIEW" as const,
  createdDate: "2026-08-25T09:00:00.000Z",
  lastModifiedDate: "2026-08-25T09:05:00.000Z",
  screenshot: {
    id: 9,
    mimeType: "image/png" as const,
    size: 1024,
  },
}

describe("feedback runtime contract", () => {
  it("accepts additive fields in list, detail, and page responses", () => {
    const list = feedbackListResponseSchema.safeParse({
      ...listItem,
      futureField: "kept for forward compatibility",
    })
    const detail = feedbackDetailResponseSchema.safeParse({
      ...listItem,
      clientContext: {
        pagePath: "/en/dashboard",
        appVersion: "1.2.3",
        browserName: "Chrome",
        browserVersion: "128",
        osName: "Windows",
        osVersion: "11",
        locale: "en",
      },
      reviewMessage: null,
      reporter: null,
      futureField: true,
    })
    const page = feedbackPageResponseSchema.safeParse({
      content: [listItem],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: true,
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      numberOfElements: 1,
      empty: false,
      futurePageField: "allowed",
    })

    expect(list.success).toBe(true)
    expect(detail.success).toBe(true)
    expect(page.success).toBe(true)

    const sparseDetail = feedbackDetailResponseSchema.safeParse({
      id: listItem.id,
      content: listItem.content,
      status: listItem.status,
      createdDate: listItem.createdDate,
      lastModifiedDate: listItem.lastModifiedDate,
      screenshot: null,
    })
    expect(sparseDetail.success).toBe(false)
  })

  it("rejects malformed core response fields", () => {
    expect(
      feedbackListResponseSchema.safeParse({
        ...listItem,
        id: "42",
      }).success
    ).toBe(false)
    expect(
      feedbackListResponseSchema.safeParse({
        ...listItem,
        status: "UNKNOWN",
      }).success
    ).toBe(false)
  })

  it("validates trimmed content and rejects blank, oversized, and legacy fields", () => {
    const parsed = feedbackSubmissionSchema.safeParse({
      content: "  A valid feedback message.  ",
      clientContext: { pagePath: "/en/dashboard" },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        content: "A valid feedback message.",
        clientContext: { pagePath: "/en/dashboard" },
      })
    }

    expect(feedbackSubmissionSchema.safeParse({ content: "   " }).success).toBe(
      false
    )
    expect(
      feedbackSubmissionSchema.safeParse({
        content: "x".repeat(FEEDBACK_MAX_CONTENT_LENGTH + 1),
      }).success
    ).toBe(false)
    expect(
      feedbackSubmissionSchema.safeParse({
        content: "A valid message",
        title: "Legacy title",
      }).success
    ).toBe(false)
    expect(
      feedbackSubmissionSchema.safeParse({
        content: "A valid message",
        clientContext: { observedTime: "2026-08-25T09:04:00.000Z" },
      }).success
    ).toBe(false)
  })
})

describe("feedback query contract", () => {
  it("normalizes moderation filters and clamps unsupported pagination", () => {
    expect(
      parseFeedbackModerationQuery({
        search: "  chart  ",
        status: "REVIEWED",
        sort: "createdDate_asc",
        page: "3",
        size: "50",
      })
    ).toEqual({
      search: "chart",
      status: "REVIEWED",
      sort: "createdDate_asc",
      page: 3,
      size: 50,
    })

    expect(
      parseFeedbackModerationQuery({ page: "0", size: "25", status: "invalid" })
    ).toMatchObject({
      page: 1,
      size: 10,
      status: "PENDING_REVIEW",
    })
  })

  it("serializes OData filters, zero-based pages, and repeated sort params", () => {
    const serialized = serializeFeedbackModerationQuery({
      search: "O'Reilly",
      status: "PENDING_REVIEW",
      sort: "createdDate_desc",
      page: 2,
      size: 20,
    })
    const params = new URLSearchParams(serialized)

    expect(params.get("$filter")).toBe(
      "containsIgnoreCase(content,'O''Reilly') and status eq 'PENDING_REVIEW'"
    )
    expect(params.get("page")).toBe("1")
    expect(params.get("size")).toBe("20")
    expect(params.getAll("sort")).toEqual(["createdDate,desc", "id,desc"])
  })
})

describe("feedback response mappers", () => {
  it("maps backend numeric IDs and context names into UI view models", () => {
    expect(mapFeedbackListItem(listItem)).toMatchObject({
      id: "42",
      createdAt: listItem.createdDate,
      updatedAt: listItem.lastModifiedDate,
      screenshot: { id: 9, mimeType: "image/png" },
    })

    const mapped = mapFeedbackDetail({
      ...listItem,
      clientContext: {
        pagePath: "/en/dashboard",
      },
      reviewMessage: "Queued for implementation.",
      reporter: {
        id: 7,
        email: "reporter@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        active: true,
      },
    })

    expect(mapped).toMatchObject({
      id: "42",
      content: listItem.content,
      clientContext: {
        pagePath: "/en/dashboard",
      },
      sender: { id: "7", displayName: "Ada Lovelace" },
    })
  })
})

describe("feedback error normalization", () => {
  it.each([
    [400, undefined, "validation"],
    [401, undefined, "unauthenticated"],
    [403, undefined, "forbidden"],
    [404, undefined, "missing"],
    [413, undefined, "payload-too-large"],
    [502, undefined, "upstream"],
    [500, undefined, "server"],
  ] as const)("maps HTTP %s to %s", (status, code, kind) => {
    expect(normalizeFeedbackError({ status, code }, "Try again")).toMatchObject(
      {
        status,
        kind,
        message: "Try again",
      }
    )
  })

  it("recognizes lifecycle codes without exposing backend copy", () => {
    expect(
      normalizeFeedbackError(
        {
          status: 409,
          code: "FEEDBACK_ALREADY_REVIEWED",
        },
        "The feedback changed."
      )
    ).toEqual({
      status: 409,
      code: "FEEDBACK_ALREADY_REVIEWED",
      kind: "lifecycle-conflict",
      message: "The feedback changed.",
    })
    expect(
      normalizeFeedbackError({ name: "AbortError" }, "Timed out")
    ).toMatchObject({ kind: "timeout", message: "Timed out" })
    expect(
      normalizeFeedbackError({ status: undefined }, "Offline")
    ).toMatchObject({ kind: "network", message: "Offline" })
  })
})

describe("feedback screenshot input constraints", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("rejects unsupported MIME and byte overflow before decoding", async () => {
    const messages = {
      unsupported: "Unsupported",
      tooLarge: "Too large",
      dimensionsTooLarge: "Too many pixels",
    }
    expect(
      await validateFeedbackScreenshot(
        new File(["x"], "capture.webp", { type: "image/webp" }),
        messages
      )
    ).toBe("Unsupported")
    expect(
      await validateFeedbackScreenshot(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "capture.png", {
          type: "image/png",
        }),
        messages
      )
    ).toBe("Too large")
  })

  it("rejects decoded dimensions above the 25 megapixel limit", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 5000, height: 5001, close: vi.fn() }))
    )
    expect(
      await validateFeedbackScreenshot(
        new File(["image"], "capture.png", { type: "image/png" }),
        {
          unsupported: "Unsupported",
          tooLarge: "Too large",
          dimensionsTooLarge: "Too many pixels",
        }
      )
    ).toBe("Too many pixels")
  })
})
