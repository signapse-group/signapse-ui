export const AI_CONVERSATION_DEMO_DURATION = 20

export const AI_CONVERSATION_DEMO_TIMING = {
  start: 0,
  context: 1.5,
  compare: 3.5,
  crossCheck: 5.5,
  answer: 7.5,
  evidence: 9.5,
  scenarios: 12,
  complete: 15.5,
} as const

export type AiConversationDemoPhase = keyof typeof AI_CONVERSATION_DEMO_TIMING

const frames = Object.entries(AI_CONVERSATION_DEMO_TIMING).map(
  ([phase, at]) => ({
    phase: phase as AiConversationDemoPhase,
    at,
  })
)

export function getAiConversationDemoFrame(seconds: number) {
  return frames.findLast((frame) => seconds >= frame.at) ?? frames[0]
}

export type AiConversationDemoFrame = ReturnType<
  typeof getAiConversationDemoFrame
>

export const AI_CONVERSATION_DEMO_FINAL_FRAME = getAiConversationDemoFrame(
  AI_CONVERSATION_DEMO_DURATION
)
