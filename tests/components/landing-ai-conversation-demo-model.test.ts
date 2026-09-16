import { describe, expect, it } from "vitest"

import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  AI_CONVERSATION_DEMO_TIMING,
  getAiConversationDemoFrame,
} from "@/app/[lang]/landing-ai-conversation-demo-model"

describe("AI conversation automatic timeline", () => {
  it("collects context, cross-checks evidence, and ends with scenarios", () => {
    const phases = [
      0,
      AI_CONVERSATION_DEMO_TIMING.context,
      AI_CONVERSATION_DEMO_TIMING.compare,
      AI_CONVERSATION_DEMO_TIMING.crossCheck,
      AI_CONVERSATION_DEMO_TIMING.answer,
      AI_CONVERSATION_DEMO_TIMING.evidence,
      AI_CONVERSATION_DEMO_TIMING.scenarios,
      AI_CONVERSATION_DEMO_DURATION,
    ].map((time) => getAiConversationDemoFrame(time).phase)

    expect(phases).toEqual([
      "start",
      "context",
      "compare",
      "crossCheck",
      "answer",
      "evidence",
      "scenarios",
      "complete",
    ])
    expect(getAiConversationDemoFrame(AI_CONVERSATION_DEMO_DURATION)).toBe(
      AI_CONVERSATION_DEMO_FINAL_FRAME
    )
  })

  it("keeps the final state stable after the timeline completes", () => {
    expect(getAiConversationDemoFrame(AI_CONVERSATION_DEMO_DURATION + 10)).toBe(
      AI_CONVERSATION_DEMO_FINAL_FRAME
    )
  })
})
