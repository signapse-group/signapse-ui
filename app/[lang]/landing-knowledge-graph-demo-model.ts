export const KNOWLEDGE_GRAPH_DEMO_DURATION = 22.5

export const KNOWLEDGE_GRAPH_DEMO_TIMING = {
  start: 0,
  incoming: 3,
  reading: 4,
  extracting: 5.5,
  resolving: 7,
  linking: 8.5,
  graphUpdated: 11,
  selectNarrative: 12,
  inspectNarrative: 12.5,
  selectEvent: 15.5,
  inspectEvent: 16,
  selectNews: 19,
  inspectNews: 19.5,
  complete: 22.5,
} as const

export type KnowledgeGraphDemoPhase = keyof typeof KNOWLEDGE_GRAPH_DEMO_TIMING

const frames = Object.entries(KNOWLEDGE_GRAPH_DEMO_TIMING).map(
  ([phase, at]) => ({
    phase: phase as KnowledgeGraphDemoPhase,
    at,
  })
)

export function getKnowledgeGraphDemoFrame(seconds: number) {
  return frames.findLast((frame) => seconds >= frame.at) ?? frames[0]
}

export type KnowledgeGraphDemoFrame = ReturnType<
  typeof getKnowledgeGraphDemoFrame
>

export const KNOWLEDGE_GRAPH_DEMO_FINAL_FRAME = getKnowledgeGraphDemoFrame(
  KNOWLEDGE_GRAPH_DEMO_DURATION
)
