export const AI_CONVERSATION_DEMO_DURATION = 27
export const AI_CONVERSATION_CURSOR_MOVE_DURATION = 0.35

export const AI_CONVERSATION_DEMO_TIMING = {
  welcome: 0,
  typing: 1.2,
  cursorMove: 3,
  cursorClick: 3.7,
  submitted: 4,
  context: 4.4,
  compare: 5.8,
  crossCheck: 7.2,
  synthesize: 8.6,
  answer: 10,
  evidence: 12.5,
  followUpTyping: 13.4,
  followUpCursorMove: 15.4,
  followUpCursorClick: 16.1,
  followUpSubmitted: 16.35,
  followUpThinking: 16.8,
  followUpCompare: 17.5,
  followUpSynthesize: 18.2,
  followUpAnswer: 19,
  scenarios: 21.8,
  complete: 24.5,
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
  return getAiConversationTypedText(
    prompt,
    seconds,
    AI_CONVERSATION_DEMO_TIMING.typing,
    AI_CONVERSATION_DEMO_TIMING.submitted
  )
}

export function getAiConversationTypedText(
  text: string,
  seconds: number,
  startsAt: number,
  endsAt: number
) {
  if (seconds >= endsAt) return text
  const progress = Math.max(
    0,
    Math.min(1, (seconds - startsAt) / (endsAt - startsAt))
  )
  return text.slice(0, Math.floor(progress * text.length))
}

export function getAiConversationPresentation(seconds: number) {
  const submitted = seconds >= AI_CONVERSATION_DEMO_TIMING.submitted
  const answering = seconds >= AI_CONVERSATION_DEMO_TIMING.answer
  const streamComplete = seconds >= AI_CONVERSATION_DEMO_TIMING.evidence
  const followUpSubmitted =
    seconds >= AI_CONVERSATION_DEMO_TIMING.followUpSubmitted
  const followUpAnswer = seconds >= AI_CONVERSATION_DEMO_TIMING.followUpAnswer
  const followUpStreamComplete =
    seconds >= AI_CONVERSATION_DEMO_TIMING.scenarios

  return {
    showThinking: submitted && !answering,
    showResponse: answering,
    isStreaming: answering && !streamComplete,
    showFollowUpUser: followUpSubmitted,
    showFollowUpThinking: followUpSubmitted && !followUpAnswer,
    showFollowUpResponse: followUpAnswer,
    isFollowUpStreaming: followUpAnswer && !followUpStreamComplete,
  }
}

export function getAiConversationResponseStream(
  heading: string,
  body: string,
  seconds: number
) {
  return getAiConversationStreamedText(
    heading,
    body,
    seconds,
    AI_CONVERSATION_DEMO_TIMING.answer,
    AI_CONVERSATION_DEMO_TIMING.evidence
  )
}

export function getAiConversationFollowUpStream(
  heading: string,
  body: string,
  seconds: number
) {
  return getAiConversationStreamedText(
    heading,
    body,
    seconds,
    AI_CONVERSATION_DEMO_TIMING.followUpAnswer,
    AI_CONVERSATION_DEMO_TIMING.scenarios
  )
}

function getAiConversationStreamedText(
  heading: string,
  body: string,
  seconds: number,
  startsAt: number,
  endsAt: number
) {
  const combined = `${heading}\n${body}`
  const progress = Math.max(
    0,
    Math.min(1, (seconds - startsAt) / (endsAt - startsAt))
  )
  const streamed = combined.slice(0, Math.floor(combined.length * progress))
  const separator = streamed.indexOf("\n")

  if (separator === -1) return { heading: streamed, body: "" }
  return {
    heading: streamed.slice(0, separator),
    body: streamed.slice(separator + 1),
  }
}
