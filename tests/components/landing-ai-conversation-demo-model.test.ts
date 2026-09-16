import { describe, expect, it } from "vitest"

import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  AI_CONVERSATION_DEMO_TIMING,
  getAiConversationDemoFrame,
  getAiConversationFollowUpStream,
  getAiConversationPresentation,
  getAiConversationPromptText,
  getAiConversationResponseStream,
  getAiConversationTypedText,
} from "@/app/[lang]/landing-ai-conversation-demo-model"

describe("AI conversation automatic timeline", () => {
  it("runs two question-and-answer rounds", () => {
    const phases = [
      0,
      AI_CONVERSATION_DEMO_TIMING.typing,
      AI_CONVERSATION_DEMO_TIMING.submitted,
      AI_CONVERSATION_DEMO_TIMING.context,
      AI_CONVERSATION_DEMO_TIMING.compare,
      AI_CONVERSATION_DEMO_TIMING.crossCheck,
      AI_CONVERSATION_DEMO_TIMING.synthesize,
      AI_CONVERSATION_DEMO_TIMING.answer,
      AI_CONVERSATION_DEMO_TIMING.evidence,
      AI_CONVERSATION_DEMO_TIMING.followUpTyping,
      AI_CONVERSATION_DEMO_TIMING.followUpSubmitted,
      AI_CONVERSATION_DEMO_TIMING.followUpThinking,
      AI_CONVERSATION_DEMO_TIMING.followUpCompare,
      AI_CONVERSATION_DEMO_TIMING.followUpSynthesize,
      AI_CONVERSATION_DEMO_TIMING.followUpAnswer,
      AI_CONVERSATION_DEMO_TIMING.scenarios,
      AI_CONVERSATION_DEMO_DURATION,
    ].map((time) => getAiConversationDemoFrame(time).phase)

    expect(phases).toEqual([
      "welcome",
      "typing",
      "submitted",
      "context",
      "compare",
      "crossCheck",
      "synthesize",
      "answer",
      "evidence",
      "followUpTyping",
      "followUpSubmitted",
      "followUpThinking",
      "followUpCompare",
      "followUpSynthesize",
      "followUpAnswer",
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

  it("types the prompt into the composer before submitting it", () => {
    const prompt = "Why has XAUUSD risen recently?"
    const partial = getAiConversationPromptText(
      prompt,
      (AI_CONVERSATION_DEMO_TIMING.typing +
        AI_CONVERSATION_DEMO_TIMING.submitted) /
        2
    )

    expect(partial.length).toBeGreaterThan(0)
    expect(partial.length).toBeLessThan(prompt.length)
    expect(
      getAiConversationPromptText(prompt, AI_CONVERSATION_DEMO_TIMING.submitted)
    ).toBe(prompt)
  })

  it("holds the welcome state before typing begins", () => {
    expect(getAiConversationPromptText("Analyze XAUUSD", 1)).toBe("")
    expect(getAiConversationDemoFrame(1).phase).toBe("welcome")
  })

  it("moves the cursor to send before the prompt is submitted", () => {
    expect(
      getAiConversationDemoFrame(AI_CONVERSATION_DEMO_TIMING.cursorMove).phase
    ).toBe("cursorMove")
    expect(
      getAiConversationDemoFrame(AI_CONVERSATION_DEMO_TIMING.cursorClick).phase
    ).toBe("cursorClick")
    expect(AI_CONVERSATION_DEMO_TIMING.cursorClick).toBeLessThan(
      AI_CONVERSATION_DEMO_TIMING.submitted
    )
  })

  it("hands off from thinking to a streaming response", () => {
    expect(
      getAiConversationPresentation(AI_CONVERSATION_DEMO_TIMING.submitted)
    ).toMatchObject({
      showThinking: true,
      showResponse: false,
      isStreaming: false,
    })
    expect(
      getAiConversationPresentation(AI_CONVERSATION_DEMO_TIMING.answer)
    ).toMatchObject({
      showThinking: false,
      showResponse: true,
      isStreaming: true,
    })
    expect(
      getAiConversationPresentation(AI_CONVERSATION_DEMO_TIMING.evidence)
    ).toMatchObject({
      showThinking: false,
      showResponse: true,
      isStreaming: false,
    })
  })

  it("types and submits a second question before the follow-up response", () => {
    const prompt = "What are the next scenarios?"
    const partial = getAiConversationTypedText(
      prompt,
      (AI_CONVERSATION_DEMO_TIMING.followUpTyping +
        AI_CONVERSATION_DEMO_TIMING.followUpSubmitted) /
        2,
      AI_CONVERSATION_DEMO_TIMING.followUpTyping,
      AI_CONVERSATION_DEMO_TIMING.followUpSubmitted
    )

    expect(partial.length).toBeGreaterThan(0)
    expect(partial.length).toBeLessThan(prompt.length)
    expect(
      getAiConversationPresentation(
        AI_CONVERSATION_DEMO_TIMING.followUpSubmitted
      )
    ).toMatchObject({
      showFollowUpUser: true,
      showFollowUpThinking: true,
      showFollowUpResponse: false,
    })
    expect(
      getAiConversationPresentation(AI_CONVERSATION_DEMO_TIMING.followUpAnswer)
    ).toMatchObject({
      showFollowUpThinking: false,
      showFollowUpResponse: true,
      isFollowUpStreaming: true,
    })
  })

  it("streams the answer progressively and completes before evidence", () => {
    const heading = "Market conclusion"
    const body = "The rally was not supported by durable spot demand."
    const midway = getAiConversationResponseStream(
      heading,
      body,
      (AI_CONVERSATION_DEMO_TIMING.answer +
        AI_CONVERSATION_DEMO_TIMING.evidence) /
        2
    )

    expect(midway.heading.length + midway.body.length).toBeGreaterThan(0)
    expect(midway.heading.length + midway.body.length).toBeLessThan(
      heading.length + body.length
    )
    expect(
      getAiConversationResponseStream(
        heading,
        body,
        AI_CONVERSATION_DEMO_TIMING.evidence
      )
    ).toEqual({ heading, body })
  })

  it("streams the second answer before revealing scenarios", () => {
    const heading = "Three paths matter"
    const body = "Watch the range boundaries."
    const midway = getAiConversationFollowUpStream(
      heading,
      body,
      (AI_CONVERSATION_DEMO_TIMING.followUpAnswer +
        AI_CONVERSATION_DEMO_TIMING.scenarios) /
        2
    )

    expect(midway.heading.length + midway.body.length).toBeGreaterThan(0)
    expect(midway.heading.length + midway.body.length).toBeLessThan(
      heading.length + body.length
    )
    expect(
      getAiConversationFollowUpStream(
        heading,
        body,
        AI_CONVERSATION_DEMO_TIMING.scenarios
      )
    ).toEqual({ heading, body })
  })
})
