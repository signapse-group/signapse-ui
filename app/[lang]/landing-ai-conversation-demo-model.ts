export const AI_CONVERSATION_DEMO_DURATION = 20
export const AI_CONVERSATION_CURSOR_MOVE_DURATION = 0.35

export const AI_CONVERSATION_DEMO_TIMING = {
  typing: 0,
  cursorMove: 2.65,
  cursorClick: 3.35,
  submitted: 3.6,
  context: 4.8,
  compare: 7,
  crossCheck: 9,
  answer: 11,
  evidence: 13,
  scenarios: 15,
  complete: 17.5,
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

export function getAiConversationPromptText(prompt: string, seconds: number) {
  if (seconds >= AI_CONVERSATION_DEMO_TIMING.submitted) return prompt

  const progress = Math.max(
    0,
    Math.min(
      1,
      seconds /
        (AI_CONVERSATION_DEMO_TIMING.submitted -
          AI_CONVERSATION_DEMO_TIMING.typing)
    )
  )
  return prompt.slice(0, Math.floor(progress * prompt.length))
}
