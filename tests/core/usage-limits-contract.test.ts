import { describe, expect, it } from "vitest"

import { usageLimitsResponseSchema } from "@/app/lib/usage-limits/definitions"

describe("usage limits response contract", () => {
  it("preserves zero usage and values above the effective limit", () => {
    const response = usageLimitsResponseSchema.parse({
      workspace: { used: 0, limit: 5 },
      watchlist: {
        limit: 3,
        workspaces: [
          { workspaceId: 101, used: 0 },
          { workspaceId: 102, used: 4 },
        ],
      },
      conversationTurns: {
        used: 1001,
        limit: 1000,
        periodStartUtc: "2026-09-01T00:00:00Z",
        resetAtUtc: "2026-10-01T00:00:00Z",
      },
      activeSchedules: { used: 1, limit: 1 },
    })

    expect(response.workspace.used).toBe(0)
    expect(response.watchlist.workspaces[1]?.used).toBe(4)
    expect(response.conversationTurns.used).toBe(1001)
  })

  it("rejects an incomplete payload instead of treating it as empty usage", () => {
    const result = usageLimitsResponseSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})
