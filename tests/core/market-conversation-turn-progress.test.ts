import { describe, expect, it } from "vitest"

import {
  parseMarketConversationTurnProgressStep,
  upsertMarketConversationTurnProgressStep,
} from "@/app/lib/market-query/turn-progress"

describe("market conversation turn progress", () => {
  it("ignores payloads that do not contain the fields needed to identify a step", () => {
    expect(
      parseMarketConversationTurnProgressStep({ sequenceNumber: 1 })
    ).toBeNull()
    expect(
      parseMarketConversationTurnProgressStep({
        stepId: "tool-a",
        sequenceNumber: 1,
        stepType: "TOOL",
      })
    ).toBeNull()
  })

  it("accepts a static step with no public detail", () => {
    const step = parseMarketConversationTurnProgressStep({
      stepId: "tool-a",
      sequenceNumber: 1,
      stepType: "TOOL",
      status: "COMPLETED",
    })
    expect(step).toMatchObject({
      stepId: "tool-a",
      status: "COMPLETED",
    })
    expect(step?.publicMessage).toBeUndefined()
  })

  it("keeps one row per step and orders rows by the latest backend sequence", () => {
    const first = parseMarketConversationTurnProgressStep({
      stepId: "tool-a",
      sequenceNumber: 2,
      stepType: "TOOL",
      status: "IN_PROGRESS",
      publicMessage: "Checking events",
    })
    const second = parseMarketConversationTurnProgressStep({
      stepId: "tool-b",
      sequenceNumber: 3,
      stepType: "TOOL",
      status: "IN_PROGRESS",
      publicMessage: "Checking sources",
    })
    const update = parseMarketConversationTurnProgressStep({
      stepId: "tool-a",
      sequenceNumber: 4,
      stepType: "TOOL",
      status: "COMPLETED",
      publicMessage: "Events checked",
    })

    const rows = upsertMarketConversationTurnProgressStep(
      upsertMarketConversationTurnProgressStep(
        upsertMarketConversationTurnProgressStep([], first),
        second
      ),
      update
    )

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.stepId)).toEqual(["tool-b", "tool-a"])
    expect(rows[1]).toMatchObject({
      sequenceNumber: 4,
      status: "COMPLETED",
      publicMessage: "Events checked",
    })
  })

  it("does not let a repeated older event roll a row back", () => {
    const completed = parseMarketConversationTurnProgressStep({
      stepId: "tool-a",
      sequenceNumber: 4,
      stepType: "TOOL",
      status: "COMPLETED",
      publicMessage: "Done",
    })
    const stale = parseMarketConversationTurnProgressStep({
      stepId: "tool-a",
      sequenceNumber: 2,
      stepType: "TOOL",
      status: "IN_PROGRESS",
      publicMessage: "Working",
    })

    expect(
      upsertMarketConversationTurnProgressStep([completed!], stale)
    ).toEqual([completed])
  })
})
