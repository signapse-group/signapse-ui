import {
  type MarketChartLiveErrorResponse,
  type MarketChartLiveQuoteResponse,
  type MarketChartLiveSnapshotResponse,
  type MarketChartLiveStatusResponse,
  type MarketChartTimeframe,
  marketChartLiveErrorResponseSchema,
  marketChartLiveQuoteResponseSchema,
  marketChartLiveSnapshotResponseSchema,
  marketChartLiveStatusResponseSchema,
} from "@/app/lib/market-charts/definitions"
import {
  startClientPerformanceMeasurement,
  type ClientPerformanceMeasurement,
} from "@/app/lib/observability/client"
import { OBSERVABILITY_OPERATIONS } from "@/app/lib/observability/semantic"

type MarketChartLiveStreamHandlers = {
  onErrorEvent: (value: MarketChartLiveErrorResponse) => void
  onInvalidEvent: (message: string) => void
  onOpen: () => void
  onPrice: (value: MarketChartLiveQuoteResponse) => void
  onSnapshot: (value: MarketChartLiveSnapshotResponse) => void
  onStatus: (value: MarketChartLiveStatusResponse) => void
  onTransportError: (state: "RECONNECTING" | "ERROR") => void
}

type OpenMarketChartLiveStreamParams = {
  assetId: number
  timeframe: MarketChartTimeframe
} & MarketChartLiveStreamHandlers

type StartMeasurement = typeof startClientPerformanceMeasurement

function parseEventData(value: MessageEvent) {
  if (!value.data) {
    return null
  }

  return JSON.parse(String(value.data))
}

export function createMarketChartLiveStreamOpener(
  startMeasurement: StartMeasurement = startClientPerformanceMeasurement
) {
  return function openMarketChartLiveStream({
    assetId,
    timeframe,
    onErrorEvent,
    onInvalidEvent,
    onOpen,
    onPrice,
    onSnapshot,
    onStatus,
    onTransportError,
  }: OpenMarketChartLiveStreamParams) {
    const url = new URL("/api/market-charts/live", window.location.origin)

    url.searchParams.set("assetId", String(assetId))
    url.searchParams.set("timeframe", timeframe)

    const source = new EventSource(url.toString())
    let connectionKind: "initial" | "reconnect" = "initial"
    let connectMeasurement: ClientPerformanceMeasurement | null =
      startConnectionMeasurement(
        startMeasurement,
        OBSERVABILITY_OPERATIONS.marketChartLiveConnect,
        connectionKind
      )
    let firstDataMeasurement: ClientPerformanceMeasurement | null =
      startConnectionMeasurement(
        startMeasurement,
        OBSERVABILITY_OPERATIONS.marketChartFirstLiveData,
        connectionKind
      )
    let explicitlyClosed = false

    function completeFirstData(eventKind: "snapshot" | "price") {
      firstDataMeasurement?.finish("success", {
        "market.event_kind": eventKind,
      })
      firstDataMeasurement = null
    }

    function invalidatePendingMeasurements() {
      connectMeasurement?.finish("invalid_payload")
      firstDataMeasurement?.finish("invalid_payload")
      connectMeasurement = null
      firstDataMeasurement = null
    }

    function beginReconnectAttempt() {
      connectMeasurement?.finish("network_error")
      firstDataMeasurement?.finish("network_error")
      connectionKind = "reconnect"
      connectMeasurement = startConnectionMeasurement(
        startMeasurement,
        OBSERVABILITY_OPERATIONS.marketChartLiveConnect,
        connectionKind
      )
      firstDataMeasurement = startConnectionMeasurement(
        startMeasurement,
        OBSERVABILITY_OPERATIONS.marketChartFirstLiveData,
        connectionKind
      )
    }

    function handleEvent<T>(
      event: MessageEvent,
      parse: {
        safeParse: (
          value: unknown
        ) => { success: true; data: T } | { success: false }
      },
      onValid: (value: T) => void,
      liveEventKind?: "snapshot" | "price"
    ) {
      try {
        const parsed = parse.safeParse(parseEventData(event))

        if (!parsed.success) {
          invalidatePendingMeasurements()
          onInvalidEvent("Market chart live event payload is invalid.")
          return
        }

        onValid(parsed.data)
        if (liveEventKind) {
          completeFirstData(liveEventKind)
        }
      } catch {
        invalidatePendingMeasurements()
        onInvalidEvent("Market chart live event payload is invalid.")
      }
    }

    source.addEventListener("open", () => {
      connectMeasurement?.finish("success")
      connectMeasurement = null
      onOpen()
    })
    source.addEventListener("snapshot", (event) => {
      handleEvent(
        event,
        marketChartLiveSnapshotResponseSchema,
        onSnapshot,
        "snapshot"
      )
    })
    source.addEventListener("price", (event) => {
      handleEvent(event, marketChartLiveQuoteResponseSchema, onPrice, "price")
    })
    source.addEventListener("status", (event) => {
      handleEvent(event, marketChartLiveStatusResponseSchema, onStatus)
    })
    source.addEventListener("error", (event) => {
      if (explicitlyClosed) {
        return
      }

      if (event instanceof MessageEvent && event.data) {
        handleEvent(event, marketChartLiveErrorResponseSchema, onErrorEvent)
        return
      }

      if (source.readyState === EventSource.CONNECTING) {
        beginReconnectAttempt()
        onTransportError("RECONNECTING")
      } else {
        connectMeasurement?.finish("network_error")
        firstDataMeasurement?.finish("network_error")
        connectMeasurement = null
        firstDataMeasurement = null
        onTransportError("ERROR")
      }
    })

    return {
      close() {
        explicitlyClosed = true
        connectMeasurement?.finish("closed")
        firstDataMeasurement?.finish("closed")
        connectMeasurement = null
        firstDataMeasurement = null
        source.close()
      },
    }
  }
}

export const openMarketChartLiveStream = createMarketChartLiveStreamOpener()

function startConnectionMeasurement(
  startMeasurement: StartMeasurement,
  operation:
    | typeof OBSERVABILITY_OPERATIONS.marketChartLiveConnect
    | typeof OBSERVABILITY_OPERATIONS.marketChartFirstLiveData,
  connectionKind: "initial" | "reconnect"
): ClientPerformanceMeasurement {
  return startMeasurement(operation, {
    feature: "market_chart",
    "connection.kind": connectionKind,
  })
}
