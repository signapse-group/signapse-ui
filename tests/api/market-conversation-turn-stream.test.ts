import { describe, expect, it, vi } from "vitest"

import {
  readMarketConversationSseStream,
  streamMarketConversationTurn,
} from "@/components/market-conversation-assistant/turn-stream"

function createStream(chunks: string[], close = true) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      if (close) controller.close()
    },
  })
}

const savedResult = {
  userMessage: {
    id: 501,
    role: "USER",
    status: "COMPLETED",
    content: "Summarize this market move.",
    failureReason: null,
  },
  assistantMessage: {
    id: 502,
    role: "ASSISTANT",
    status: "COMPLETED",
    content: "The market moved after the release.",
    failureReason: null,
  },
}

describe("market conversation turn event stream", () => {
  it("parses split event frames, CRLF, comments, and multiple data lines", async () => {
    const events: Array<{ event: string; data: string }> = []

    await readMarketConversationSseStream(
      createStream([
        ': keepalive\r\nevent: progress\r\ndata: {"stepId":\r\n',
        'data: "tool-a",\r\ndata: "status":"IN_PROGRESS"}\r\n\r\n',
      ]),
      (event) => events.push(event)
    )

    expect(events).toEqual([
      {
        event: "progress",
        data: '{"stepId":\n"tool-a",\n"status":"IN_PROGRESS"}',
      },
    ])
  })

  it("requests a same-origin stream with the progress cursor and waits past 60 seconds", async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response(
                  createStream([
                    `event: result\ndata: ${JSON.stringify(savedResult)}\n\n`,
                  ])
                )
              ),
            61_000
          )
        })
    )
    const onProgress = vi.fn()
    const resultPromise = streamMarketConversationTurn(
      {
        conversationId: 42,
        submissionId: 108,
        afterSequence: 3,
        onProgress,
        fetcher,
      },
      "Could not read the stream"
    )

    await vi.advanceTimersByTimeAsync(61_000)
    await expect(resultPromise).resolves.toEqual(savedResult)
    expect(fetcher).toHaveBeenCalledWith(
      "/api/market-conversations/42/turns/108/events?afterSequence=3",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "text/event-stream" },
      })
    )
    vi.useRealTimers()
  })

  it("replays progress without a cursor and delivers sequence zero", async () => {
    const progress = {
      stepId: "tool-zero",
      sequenceNumber: 0,
      stepType: "TOOL",
      status: "IN_PROGRESS",
    }
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        createStream([
          `event: progress\ndata: ${JSON.stringify(progress)}\n\n`,
          `event: result\ndata: ${JSON.stringify(savedResult)}\n\n`,
        ])
      )
    )
    const onProgress = vi.fn()

    await expect(
      streamMarketConversationTurn(
        { conversationId: 42, submissionId: 108, onProgress, fetcher },
        "Could not read the stream"
      )
    ).resolves.toEqual(savedResult)

    expect(fetcher).toHaveBeenCalledWith(
      "/api/market-conversations/42/turns/108/events",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "text/event-stream" },
      })
    )
    expect(onProgress).toHaveBeenCalledWith(progress)
  })

  it("sends progress payloads and rejects a stream without a saved result", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          createStream([
            'event: progress\ndata: {"stepId":"tool-a","sequenceNumber":1,"stepType":"TOOL","status":"IN_PROGRESS"}\n\n',
          ])
        )
      )
    const onProgress = vi.fn()

    await expect(
      streamMarketConversationTurn(
        { conversationId: 42, submissionId: 108, onProgress, fetcher },
        "Could not read the stream"
      )
    ).rejects.toThrow("Could not read the stream")
    expect(onProgress).toHaveBeenCalledWith({
      stepId: "tool-a",
      sequenceNumber: 1,
      stepType: "TOOL",
      status: "IN_PROGRESS",
    })
  })

  it("treats an SSE error event as an interrupted turn", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          createStream(['event: error\ndata: {"message":"failed"}\n\n'])
        )
      )

    await expect(
      streamMarketConversationTurn(
        { conversationId: 42, submissionId: 108, onProgress: vi.fn(), fetcher },
        "Could not read the stream"
      )
    ).rejects.toThrow("Could not read the stream")
  })

  it("surfaces localized proxy errors without reading raw event data", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: "Localized stream error" }, { status: 503 })
      )

    await expect(
      streamMarketConversationTurn(
        { conversationId: 42, submissionId: 108, onProgress: vi.fn(), fetcher },
        "Fallback error"
      )
    ).rejects.toThrow("Localized stream error")
  })
})
