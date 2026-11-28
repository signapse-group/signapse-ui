import {
  submitMarketConversationMessageResponseSchema,
  type SubmitMarketConversationMessageResponse,
} from "@/app/lib/market-query/definitions"

export interface MarketConversationSseEvent {
  event: string
  data: string
}

export interface StreamMarketConversationTurnOptions {
  conversationId: number
  submissionId: number
  afterSequence?: number
  signal?: AbortSignal
  onProgress: (data: unknown) => void
  fetcher?: typeof fetch
}

function parseSseBlock(block: string): MarketConversationSseEvent | null {
  let event = "message"
  const data: string[] = []

  for (const line of block.split(/\r\n|\r|\n/)) {
    if (!line || line.startsWith(":")) {
      continue
    }

    const separator = line.indexOf(":")
    const field = separator < 0 ? line : line.slice(0, separator)
    const value =
      separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "")

    if (field === "event") {
      event = value
    } else if (field === "data") {
      data.push(value)
    }
  }

  return data.length > 0 ? { event, data: data.join("\n") } : null
}

export async function readMarketConversationSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: MarketConversationSseEvent) => void,
  signal?: AbortSignal
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  function dispatchAvailable(final = false) {
    const separator = /(?:\r\n|\r(?!\n)|(?<!\r)\n){2}/
    let match = separator.exec(buffer)

    while (match) {
      const block = buffer.slice(0, match.index)
      buffer = buffer.slice(match.index + match[0].length)
      const event = parseSseBlock(block)
      if (event) onEvent(event)
      match = separator.exec(buffer)
    }

    if (final && buffer.trim()) {
      const event = parseSseBlock(buffer)
      if (event) onEvent(event)
      buffer = ""
    }
  }

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError")
      }

      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      dispatchAvailable()
    }

    buffer += decoder.decode()
    dispatchAvailable(true)
  } finally {
    reader.releaseLock()
  }
}

function getEventData(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

async function getStreamError(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json()
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message
    }
  } catch {
    // Use the localized fallback for a non-JSON proxy response.
  }

  return fallback
}

export async function streamMarketConversationTurn(
  options: StreamMarketConversationTurnOptions,
  streamError: string
): Promise<SubmitMarketConversationMessageResponse> {
  const fetcher = options.fetcher ?? fetch
  const search = new URLSearchParams()

  if (typeof options.afterSequence === "number") {
    search.set("afterSequence", String(options.afterSequence))
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : ""
  const response = await fetcher(
    `/api/market-conversations/${options.conversationId}/turns/${options.submissionId}/events${suffix}`,
    {
      cache: "no-store",
      headers: { Accept: "text/event-stream" },
      signal: options.signal,
    }
  )

  if (!response.ok) {
    throw new Error(await getStreamError(response, streamError))
  }

  if (!response.body) {
    throw new Error(streamError)
  }

  let result: SubmitMarketConversationMessageResponse | null = null
  await readMarketConversationSseStream(
    response.body,
    (event) => {
      if (event.event === "progress") {
        const progress = getEventData(event.data)
        if (progress !== null) options.onProgress(progress)
        return
      }

      if (event.event === "error") {
        throw new Error(streamError)
      }

      if (event.event !== "result") {
        return
      }

      const payload = getEventData(event.data)
      const parsed =
        submitMarketConversationMessageResponseSchema.safeParse(payload)

      if (
        !parsed.success ||
        parsed.data.userMessage.role !== "USER" ||
        parsed.data.assistantMessage.role !== "ASSISTANT"
      ) {
        throw new Error(streamError)
      }

      result = parsed.data
    },
    options.signal
  )

  if (!result) {
    throw new Error(streamError)
  }

  return result
}
