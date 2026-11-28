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

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = () => resolvePromise()
  })

  return { promise, resolve }
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

  it(
    "delivers progress before and after 60 seconds while the SSE body stays open, then exposes the saved result",
    async () => {
      vi.useFakeTimers()
      let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
      let bodyClosed = false
      let delayedProgress: ReturnType<typeof setTimeout> | undefined
      const encoder = new TextEncoder()
      const responseStream = new ReadableStream<Uint8Array>({
        start(controller) {
          bodyController = controller
        },
      })
      const closeBody = () => {
        if (bodyController && !bodyClosed) {
          bodyClosed = true
          bodyController.close()
        }
      }
      const firstProgress = createDeferred()
      const secondProgress = createDeferred()
      const progressEvents: unknown[] = []
      const onProgress = vi.fn((progress: unknown) => {
        progressEvents.push(progress)
        if (progressEvents.length === 1) firstProgress.resolve()
        if (progressEvents.length === 2) secondProgress.resolve()
      })
      const fetcher = vi.fn().mockResolvedValue(new Response(responseStream))
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
      let resultSettled = false
      void resultPromise.then(
        () => {
          resultSettled = true
        },
        () => {
          resultSettled = true
        }
      )

      const understanding = {
        stepId: "understanding",
        sequenceNumber: 4,
        stepType: "UNDERSTANDING",
        status: "COMPLETED",
        publicMessage: "I will check the market context.",
      }
      const tool = {
        stepId: "tool-a",
        sequenceNumber: 5,
        stepType: "TOOL",
        status: "IN_PROGRESS",
        publicMessage: "Checking market events.",
      }
      const encodeEvent = (event: string, data: unknown) =>
        encoder.encode(
          "event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n"
        )

      try {
        expect(bodyController).toBeDefined()
        expect(fetcher).toHaveBeenCalledWith(
          "/api/market-conversations/42/turns/108/events?afterSequence=3",
          expect.objectContaining({
            cache: "no-store",
            headers: { Accept: "text/event-stream" },
          })
        )

        bodyController!.enqueue(encodeEvent("progress", understanding))
        await firstProgress.promise
        expect(onProgress).toHaveBeenNthCalledWith(1, understanding)

        delayedProgress = setTimeout(() => {
          bodyController?.enqueue(encodeEvent("progress", tool))
        }, 61_000)
        await vi.advanceTimersByTimeAsync(60_000)

        expect(onProgress).toHaveBeenCalledTimes(1)
        expect(bodyClosed).toBe(false)
        expect(resultSettled).toBe(false)

        await vi.advanceTimersByTimeAsync(1_000)
        await secondProgress.promise
        expect(progressEvents).toEqual([understanding, tool])
        expect(bodyClosed).toBe(false)
        expect(resultSettled).toBe(false)

        bodyController!.enqueue(encodeEvent("result", savedResult))
        closeBody()

        await expect(resultPromise).resolves.toEqual(savedResult)
        expect(resultSettled).toBe(true)
      } finally {
        if (delayedProgress) clearTimeout(delayedProgress)
        closeBody()
        vi.useRealTimers()
      }
    }
  )

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
