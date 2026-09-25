import { appendFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { createServer } from "node:http"
import { URL } from "node:url"

import {
  contractPathMatches,
  fixtureContracts,
} from "./contract-registry.mjs"

const port = Number(process.env.FIXTURE_PORT ?? 4100)
const logFile = process.env.FIXTURE_LOG_FILE
const testRuns = new Map()

const NOW = "2026-01-15T08:00:00.000Z"

function workspace(id, name, currentWorkspace = false) {
  return {
    id,
    name,
    currentWorkspace,
    createdDate: "2025-01-01T08:00:00.000Z",
    lastModifiedDate: NOW,
  }
}

function page(content, pageNumber = 0, size = 10, totalElements = content.length) {
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size)

  return {
    content,
    pageable: {
      pageNumber,
      pageSize: size,
      offset: pageNumber * size,
      paged: true,
      unpaged: false,
    },
    last: pageNumber >= Math.max(totalPages - 1, 0),
    totalElements,
    totalPages,
    size,
    number: pageNumber,
    first: pageNumber === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

function note(id, title, text) {
  return {
    id,
    title,
    contentSchemaVersion: 1,
    content: [{ type: "p", children: [{ text }] }],
    createdDate: "2025-01-01T08:00:00.000Z",
    lastModifiedDate: NOW,
  }
}

const FEEDBACK_OWNER_ID = 9001
const FEEDBACK_OWNER = {
  id: FEEDBACK_OWNER_ID,
  email: "fixture.user@signapse.test",
  firstName: "Fixture",
  lastName: "User",
  active: true,
}
const FEEDBACK_SCREENSHOT_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
)

function feedbackRecord(
  id,
  content,
  status = "PENDING_REVIEW",
  options = {}
) {
  const screenshot = options.screenshot
    ? {
        id: 1000 + id,
        mimeType: options.mimeType ?? "image/png",
        size: FEEDBACK_SCREENSHOT_BYTES.length,
      }
    : null
  return {
    id,
    ownerId: options.ownerId ?? FEEDBACK_OWNER_ID,
    content,
    clientContext:
      options.clientContext === false
        ? null
        : options.clientContext ?? {
            pagePath: "/vi/dashboard",
            appVersion: "web",
            browserName: "Chrome",
            browserVersion: "128",
            osName: "Windows",
            osVersion: "11",
            locale: "vi",
          },
    screenshot,
    status,
    createdDate: options.createdDate ?? NOW,
    lastModifiedDate: options.lastModifiedDate ?? NOW,
    reviewMessage: options.reviewMessage ?? null,
    reporter: FEEDBACK_OWNER,
  }
}

function feedbackListItem(record) {
  return {
    id: record.id,
    content: record.content,
    status: record.status,
    createdDate: record.createdDate,
    lastModifiedDate: record.lastModifiedDate,
    screenshot: record.screenshot,
  }
}

function feedbackDetail(record, moderation = false) {
  const detail = { ...record }
  if (!moderation) {
    delete detail.ownerId
    delete detail.reporter
  }
  return detail
}

function feedbackRecords() {
  return [
    feedbackRecord(1, "Biểu đồ không giữ bộ lọc sau khi đổi ngôn ngữ", "PENDING_REVIEW", { screenshot: true, createdDate: "2026-01-15T08:00:00.000Z" }),
    feedbackRecord(2, "Thêm bộ lọc tài sản yêu thích", "REVIEWED", { clientContext: false, createdDate: "2026-01-14T08:00:00.000Z", reviewMessage: "Đã xem xét phản hồi của bạn." }),
    feedbackRecord(3, "Thông báo lỗi thiếu hướng dẫn", "REVIEWED", { clientContext: false, createdDate: "2026-01-13T08:00:00.000Z", reviewMessage: "Đã xem xét phản hồi của bạn." }),
    feedbackRecord(4, "Cải thiện trang tổng quan", "PENDING_REVIEW", { ownerId: 9010, createdDate: "2026-01-12T08:00:00.000Z" }),
    feedbackRecord(5, "Ảnh chụp màn hình không hiển thị", "PENDING_REVIEW", { screenshot: true, createdDate: "2026-01-11T08:00:00.000Z" }),
    feedbackRecord(6, "Tín hiệu thị trường cần thêm ngữ cảnh", "PENDING_REVIEW", { screenshot: true, createdDate: "2026-01-10T08:00:00.000Z" }),
  ]
}

function createState() {
  const primaryWorkspace = workspace(1, "Workspace Alpha", true)
  const secondaryWorkspace = workspace(2, "Workspace Beta")
  const destination = {
    id: 21,
    botConnectionId: 11,
    botUsername: "signapse_fixture_bot",
    botDisplayLabel: "Signapse Fixture Bot",
    chatId: "-100000000021",
    chatType: "CHANNEL",
    displayLabel: "Operations channel",
    chatTitle: "Operations channel",
    username: "operations",
    status: "ACTIVE",
    createdDate: "2025-01-02T08:00:00.000Z",
    lastModifiedDate: NOW,
  }

  return {
    workspaces: [primaryWorkspace, secondaryWorkspace],
    notes: [note(31, "Morning brief", "Review the fixture market brief.")],
    feedback: feedbackRecords(),
    permissions: ["*"],
    feedbackScenarios: {},
    assets: [
      {
        id: 101,
        assetId: 101,
        assetName: "Bitcoin",
        assetSymbol: "BTCUSD",
        assetType: "CRYPTO",
        createdDate: "2025-01-03T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
      {
        id: 102,
        assetId: 102,
        assetName: "Gold",
        assetSymbol: "XAUUSD",
        assetType: "COMMODITY",
        createdDate: "2025-01-04T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
    ],
    botConnections: [
      {
        id: 11,
        botId: 10011,
        botUsername: "signapse_fixture_bot",
        botFirstName: "Signapse Fixture",
        displayLabel: "Fixture operations bot",
        status: "ACTIVE",
        webhookUrl: "https://fixture.invalid/telegram/webhook/11",
        verifiedAt: NOW,
        lastValidatedAt: NOW,
        lastWebhookRegisteredAt: NOW,
        createdDate: "2025-01-02T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
    ],
    destinations: [destination, {
      ...destination,
      id: 22,
      chatId: "-100000000022",
      displayLabel: "Disabled channel",
      chatTitle: "Disabled channel",
      status: "DISABLED",
    }],
    featureSettings: [
      {
        id: 41,
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: primaryWorkspace.id,
        workspaceName: primaryWorkspace.name,
        enabled: true,
        destination,
        outputLanguage: { id: 2, isoCode: "en", name: "English" },
        createdDate: "2025-01-05T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
      {
        id: 42,
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: primaryWorkspace.id,
        workspaceName: primaryWorkspace.name,
        enabled: false,
        destination,
        outputLanguage: { id: 1, isoCode: "vi", name: "Tiếng Việt" },
        createdDate: "2025-01-05T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
      {
        id: 43,
        featureKey: "SCHEDULED_MARKET_ANALYSIS",
        workspaceId: primaryWorkspace.id,
        workspaceName: primaryWorkspace.name,
        enabled: true,
        destination,
        outputLanguage: { id: 2, isoCode: "en", name: "English" },
        createdDate: "2025-01-05T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
    ],
    schedules: [
      {
        id: 51,
        name: "BTC morning analysis",
        workspaceId: primaryWorkspace.id,
        workspaceName: primaryWorkspace.name,
        destination,
        timezone: "Asia/Ho_Chi_Minh",
        localTimes: ["08:30"],
        asset: { assetId: 101, assetSymbol: "BTCUSD", assetName: "Bitcoin" },
        outputLanguage: { id: 1, isoCode: "vi", name: "Tiếng Việt" },
        status: "ACTIVE",
        createdDate: "2025-01-06T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
    ],
    languages: [
      { id: 1, isoCode: "vi", name: "Tiếng Việt" },
      { id: 2, isoCode: "en", name: "English" },
    ],
    events: [
      {
        id: 61,
        title: "Central bank signals a slower easing path",
        canonicalKey: "fixture-central-bank-easing",
        description: "Synthetic event used by the browser quality gate.",
        status: "ENRICHED",
        confidence: 0.92,
        occurredAt: NOW,
        createdDate: "2025-01-07T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
      {
        id: 62,
        title: "Energy demand outlook revised higher",
        canonicalKey: "fixture-energy-demand",
        description: "Second synthetic event for URL and pagination checks.",
        status: "ENRICHMENT_PENDING",
        confidence: 0.74,
        occurredAt: "2026-01-14T08:00:00.000Z",
        createdDate: "2025-01-08T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
      {
        id: 63,
        title: "Macro liquidity conditions stabilize",
        canonicalKey: "fixture-macro-liquidity",
        description: "Third synthetic event for search filtering.",
        status: "ENRICHED",
        confidence: 0.81,
        occurredAt: "2026-01-13T08:00:00.000Z",
        createdDate: "2025-01-09T08:00:00.000Z",
        lastModifiedDate: NOW,
      },
    ],
    newsArticles: [
      {
        id: 71,
        title: "Fixture market update",
        description: "Synthetic news item.",
        url: "https://fixture.invalid/news/71",
        sourceName: "Fixture Wire",
        publishedAt: NOW,
        status: "INGESTED",
        createdDate: NOW,
      },
    ],
    scenarios: {},
    streamConnections: 0,
    requests: [],
    violations: [],
    nextIds: { workspace: 3, note: 32, schedule: 52, feedback: 7 },
  }
}

function getState(testRunId) {
  if (!testRuns.has(testRunId)) {
    testRuns.set(testRunId, createState())
  }
  return testRuns.get(testRunId)
}

function jsonHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders())
  response.end(JSON.stringify(payload))
}

function sendEmpty(response, status = 204) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  })
  response.end()
}

function errorPayload(message, code = "FIXTURE_FAILURE") {
  return { code, message }
}

async function readBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (chunks.length === 0) return null

  const buffer = Buffer.concat(chunks)
  const contentType = String(request.headers["content-type"] ?? "")
  if (contentType.startsWith("multipart/form-data;")) {
    return { __multipart: true, raw: buffer, contentType }
  }

  const raw = buffer.toString("utf8")
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function multipartSubmission(body) {
  if (!body?.__multipart || !Buffer.isBuffer(body.raw)) return null
  const text = body.raw.toString("utf8")
  const match = text.match(
    /name="submission"[^\r\n]*\r\n(?:[^\r\n]*\r\n)*\r\n([\s\S]*?)\r\n--/
  )
  let submission = null
  try {
    submission = match ? JSON.parse(match[1]) : null
  } catch {
    submission = null
  }
  return {
    submission,
    hasScreenshot: /name="screenshot"/.test(text),
  }
}

function getScenario(state, method, pathname) {
  return (
    state.scenarios[`${method} ${pathname}`] ??
    state.scenarios[pathname] ??
    state.scenarios["*"] ??
    "success"
  )
}

function getPageParams(url) {
  const pageNumber = Math.max(0, Number(url.searchParams.get("page") ?? 0))
  const size = Math.max(1, Number(url.searchParams.get("size") ?? 10))
  const filterTerms = [...url.searchParams.entries()]
    .filter(([key]) => key.toLowerCase().includes("containsignorecase"))
    .map(([, value]) => value)
    .concat(
      [...(url.searchParams.get("$filter")?.matchAll(/'([^']+)'/g) ?? [])].map(
        (match) => match[1]
      )
    )
    .concat(url.searchParams.get("filter") ?? "")
  const filter = [...new Set(filterTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))]

  return { pageNumber, size, filter }
}

function slicePage(items, url) {
  const { pageNumber, size, filter } = getPageParams(url)
  const filtered = filter.length
    ? items.filter((item) => {
        const serialized = JSON.stringify(item).toLowerCase()
        return filter.some((term) => serialized.includes(term))
      })
    : items
  return page(
    filtered.slice(pageNumber * size, pageNumber * size + size),
    pageNumber,
    size,
    filtered.length
  )
}

function dashboardSummary(workspaceId) {
  return {
    asOf: NOW,
    timezone: "Asia/Ho_Chi_Minh",
    scope: { workspaceId, watchlistAssetCount: 2 },
    nextKeyEvent: {
      state: "AVAILABLE",
      data: {
        id: 61,
        title: "Central bank signals a slower easing path",
        currencyCode: "USD",
        impact: "HIGH",
        scheduledAt: NOW,
      },
      errorCode: null,
    },
    recentEvents: {
      state: "AVAILABLE",
      items: [
        {
          id: 61,
          title: "Central bank signals a slower easing path",
          description: "Synthetic dashboard event.",
          occurredAt: NOW,
          confidence: 0.92,
          themes: [],
          affectedAssets: [
            {
              assetId: 101,
              assetName: "Bitcoin",
              assetSymbol: "BTCUSD",
              assetType: "CRYPTO",
              relationType: "AFFECTED_ASSET",
              weight: 1,
            },
          ],
        },
      ],
      errorCode: null,
    },
    marketEvents24h: {
      state: "AVAILABLE",
      count: 12,
      window: { from: "2026-01-14T08:00:00.000Z", to: NOW },
      errorCode: null,
    },
    activeNarratives: {
      state: "AVAILABLE",
      count: 3,
      statuses: ["EMERGING", "ACTIVE"],
      errorCode: null,
    },
    marketNarratives: {
      state: "AVAILABLE",
      items: [
        {
          id: 81,
          title: "Risk appetite returns",
          thesis: "Synthetic narrative.",
          status: "ACTIVE",
          confidence: 0.8,
          lastUpdatedAt: NOW,
          primaryTheme: {
            themeId: 91,
            themeTitle: "Macro",
            themeSlug: "macro",
          },
          assets: [],
        },
      ],
      errorCode: null,
    },
    latestNews6h: {
      state: "AVAILABLE",
      count: 1,
      window: { from: "2026-01-15T02:00:00.000Z", to: NOW },
      errorCode: null,
    },
    assetsInFocus: {
      state: "AVAILABLE",
      items: [
        {
          assetId: 101,
          assetName: "Bitcoin",
          assetSymbol: "BTCUSD",
          assetType: "CRYPTO",
          context: {
            title: "Synthetic price momentum",
            summary: "Fixture context for the dashboard.",
            observedAt: NOW,
          },
        },
      ],
      errorCode: null,
    },
  }
}

function graphView(state) {
  const event = state.events[0]
  const asset = state.assets[0]

  return {
    nodes: [
      {
        id: `event:${event.id}`,
        kind: "event",
        label: event.title,
        secondaryLabel: event.canonicalKey,
        metadata: {
          canonicalKey: event.canonicalKey,
          occurredAt: event.occurredAt,
          status: event.status,
          confidence: event.confidence,
        },
      },
      {
        id: `asset:${asset.assetId}`,
        kind: "asset",
        label: asset.assetName,
        secondaryLabel: asset.assetSymbol,
        metadata: {
          symbol: asset.assetSymbol,
          assetType: asset.assetType,
        },
      },
    ],
    edges: [
      {
        id: `event-${event.id}-asset-${asset.assetId}`,
        kind: "event-asset",
        sourceNodeId: `event:${event.id}`,
        targetNodeId: `asset:${asset.assetId}`,
        relationType: "AFFECTED_ASSET",
        confidence: event.confidence,
      },
    ],
  }
}

function marketChartAnnotations(url) {
  const assetId = Number(url.searchParams.get("assetId") ?? 101)
  const anchorTime = url.searchParams.get("to") ?? NOW
  const annotationTime = new Date(
    Date.parse(anchorTime) - 2 * 60 * 60 * 1000
  )

  return [
    {
      id: "fixture-hot-event-61",
      annotationType: "HOT_EVENT",
      assetId,
      time: annotationTime.toISOString(),
      hotEvent: {
        eventId: 61,
        severity: "HIGH",
        direction: "UP",
        title: "Central bank signals a slower easing path",
        summary: "Synthetic chart annotation for the browser quality gate.",
        confidence: 0.92,
        marketReactions: [],
        evidence: [],
        links: { eventDetail: "/events/61" },
      },
    },
  ]
}

function marketChartEconomicCalendarEvents(url, scenario) {
  if (scenario === "calendar-empty") return []

  const assetId = Number(url.searchParams.get("assetId") ?? 101)
  const now = Date.now()
  const eventTime =
    scenario === "calendar-awaiting" || scenario === "calendar-available"
      ? now - 30 * 60 * 1000
      : now + 2 * 60 * 60 * 1000
  const status = scenario === "calendar-available" ? "AVAILABLE" : "PENDING"

  return [
    {
      id: 901,
      assetId,
      time: new Date(eventTime).toISOString(),
      scheduledAt: new Date(eventTime).toISOString(),
      title: "Fixture inflation release",
      currencyCode: "USD",
      type: "INFLATION",
      impact: "HIGH",
      forecastValue: "3.0",
      previousValue: "3.1",
      actualValue: status === "AVAILABLE" ? "3.0" : null,
      revision: null,
      actualBetterWorse: null,
      revisionBetterWorse: null,
      description: "Synthetic upcoming calendar event.",
      status,
    },
  ]
}

function candles(url) {
  const timeframe = url.searchParams.get("timeframe") ?? "1h"
  const assetId = Number(url.searchParams.get("assetId") ?? 101)
  const countBack = Math.max(1, Number(url.searchParams.get("countBack") ?? 4))
  const to = url.searchParams.get("to") ?? NOW
  const anchorTimestamp = Date.parse(to)
  const intervalMinutes = {
    "1m": 1,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "4h": 240,
    "1d": 1440,
    "1w": 10080,
    "1mo": 43200,
  }[timeframe] ?? 60
  const intervalMs = intervalMinutes * 60 * 1000
  const values = [
    [100, 104, 98, 102],
    [102, 108, 101, 107],
    [107, 109, 103, 105],
    [105, 111, 104, 110],
  ]
  const offsets = assetId === 102 ? [10, 7, 1] : [4, 3, 2, 1]
  const selectedOffsets = offsets.slice(-Math.min(countBack, offsets.length))
  const times = selectedOffsets.map(
    (offset) => {
      if (timeframe === "1mo") {
        const anchorDate = new Date(anchorTimestamp)
        return new Date(
          Date.UTC(
            anchorDate.getUTCFullYear(),
            anchorDate.getUTCMonth() - offset,
            1
          )
        ).toISOString()
      }

      return new Date(anchorTimestamp - offset * intervalMs).toISOString()
    }
  )
  const from = times[0] ?? to

  return {
    provider: "fixture",
    symbol: assetId === 102 ? "XAUUSD" : "BTCUSD",
    asset: {
      id: assetId,
      name: assetId === 102 ? "Gold" : "Bitcoin",
      symbol: assetId === 102 ? "XAUUSD" : "BTCUSD",
      type: assetId === 102 ? "COMMODITY" : "CRYPTO",
      pricePrecision: 2,
    },
    timeframe,
    from,
    to,
    candles: times.map((time, index) => {
      const value = values[index % values.length]

      return {
        time,
        open: value[0],
        high: value[1],
        low: value[2],
        close: value[3],
        volume: 1000 + index,
        partial: index === times.length - 1,
      }
    }),
  }
}

function liveSnapshot(assetId, state = "CONNECTED") {
  const symbol = assetId === 102 ? "XAUUSD" : "BTCUSD"
  const quote = {
    assetId,
    symbol,
    price: 110.5,
    volume: 1200,
    providerTime: NOW,
    receivedAt: NOW,
    stale: state !== "CONNECTED",
  }
  return {
    asset: {
      id: assetId,
      name: assetId === 102 ? "Gold" : "Bitcoin",
      symbol,
      type: assetId === 102 ? "COMMODITY" : "CRYPTO",
      pricePrecision: 2,
    },
    symbol,
    timeframe: "1h",
    quote,
    candle: {
      time: NOW,
      open: 110,
      high: 112,
      low: 109,
      close: 110.5,
      volume: 1200,
    },
    status: {
      assetId,
      symbol,
      state,
      message: state === "CONNECTED" ? "Fixture stream connected" : "Fixture stream recovering",
      stale: state !== "CONNECTED",
      observedAt: NOW,
    },
  }
}

function writeSse(response, event, payload) {
  response.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
}

async function streamLive(response, state, url, scenario) {
  const assetId = Number(url.searchParams.get("assetId") ?? 101)
  state.streamConnections += 1
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  })

  if (scenario === "outage") {
    writeSse(response, "error", { code: "FIXTURE_STREAM_OUTAGE", message: "Fixture stream outage" })
    response.end()
    return
  }

  if (scenario === "reconnect" && state.streamConnections === 1) {
    response.write("retry: 50\n\n")
    writeSse(response, "status", liveSnapshot(assetId, "RECONNECTING").status)
    response.end()
    return
  }

  const snapshot = liveSnapshot(assetId, "CONNECTED")
  writeSse(response, "status", snapshot.status)
  writeSse(response, "snapshot", snapshot)
  writeSse(response, "price", snapshot.quote)
  setTimeout(() => response.end(), 400)
}

function hasFixturePermission(state, permission) {
  return state.permissions.includes("*") ||
    state.permissions.includes(permission)
}

function feedbackScenarioFor(state, method, pathname) {
  if (method === "POST" && pathname === "/me/feedback-submissions") {
    return state.feedbackScenarios.compose ?? state.feedbackScenarios.feedback
  }
  if (pathname.startsWith("/me/feedback-submissions/") && method === "DELETE") {
    return state.feedbackScenarios.withdraw ?? state.feedbackScenarios.feedback
  }
  if (pathname.endsWith("/review")) {
    return state.feedbackScenarios.review ?? state.feedbackScenarios.feedback
  }
  if (pathname.startsWith("/feedback-submissions/") && method === "DELETE") {
    return state.feedbackScenarios.erase ?? state.feedbackScenarios.feedback
  }
  if (pathname.includes("/screenshot")) {
    return state.feedbackScenarios.screenshot ?? state.feedbackScenarios.feedback
  }
  return state.feedbackScenarios.feedback
}

function feedbackErrorForScenario(scenario, kind) {
  if (scenario === "validation-error") {
    return { __status: 400, payload: errorPayload("Fixture validation failed", "FIXTURE_VALIDATION") }
  }
  if (scenario === "payload-too-large") {
    return { __status: 413, payload: errorPayload("Fixture payload is too large", "FIXTURE_PAYLOAD_TOO_LARGE") }
  }
  if (scenario === "storage-failure") {
    return { __status: 502, payload: errorPayload("Fixture storage unavailable", "FIXTURE_STORAGE_FAILURE") }
  }
  if (scenario === "not-found") {
    return { __status: 404, payload: errorPayload("Feedback not found", "NOT_FOUND") }
  }
  if (scenario === "lifecycle-conflict") {
    const code = kind === "withdraw"
      ? "FEEDBACK_NO_LONGER_WITHDRAWABLE"
      : "FEEDBACK_ALREADY_REVIEWED"
    return { __status: 409, payload: errorPayload("Feedback lifecycle changed", code) }
  }
  if (scenario === "malformed") {
    return { __status: 200, payload: { id: "malformed" } }
  }
  return null
}

function feedbackRouteResult(state, method, pathname, url, body) {
  const personalDetailMatch = pathname.match(/^\/me\/feedback-submissions\/(\d+)$/)
  const moderationDetailMatch = pathname.match(/^\/feedback-submissions\/(\d+)$/)
  const personalScreenshotMatch = pathname.match(/^\/me\/feedback-submissions\/(\d+)\/screenshot$/)
  const moderationScreenshotMatch = pathname.match(/^\/feedback-submissions\/(\d+)\/screenshot$/)
  const reviewMatch = pathname.match(/^\/feedback-submissions\/(\d+)\/review$/)
  const scenario = feedbackScenarioFor(state, method, pathname) ?? "success"
  const kind = pathname.startsWith("/me/") && method === "DELETE"
    ? "withdraw"
    : pathname.endsWith("/review")
      ? "review"
        : pathname.startsWith("/feedback-submissions/") && method === "DELETE"
          ? "erase"
          : "feedback"
  if (scenario === "timeout") return { __status: 504, payload: errorPayload("Fixture request timed out", "FIXTURE_TIMEOUT") }
  if (scenario === "outage") return { __status: 503, payload: errorPayload("Fixture backend is unavailable", "FIXTURE_OUTAGE") }
  if (scenario === "server-failure") return { __status: 500, payload: errorPayload("Fixture server failure", "FIXTURE_SERVER_FAILURE") }
  if (scenario === "mutation-failure") {
    return { __status: 409, payload: errorPayload("Fixture mutation failed", kind === "withdraw" ? "FEEDBACK_NO_LONGER_WITHDRAWABLE" : "FEEDBACK_ALREADY_REVIEWED") }
  }
  const scenarioError = feedbackErrorForScenario(scenario, kind)
  if (scenarioError) return scenarioError

  const moderationPath = pathname.startsWith("/feedback-submissions")
  if (moderationPath && pathname !== "/feedback-submissions" && !hasFixturePermission(state, pathname.endsWith("/review") ? "feedback:review" : pathname.endsWith("/screenshot") || method === "GET" ? "feedback:read" : "feedback:delete")) {
    return { __status: 403, payload: errorPayload("Feedback permission denied", "FORBIDDEN") }
  }
  if (moderationPath && pathname === "/feedback-submissions" && !hasFixturePermission(state, "feedback:read")) {
    return { __status: 403, payload: errorPayload("Feedback permission denied", "FORBIDDEN") }
  }

  if (method === "GET" && pathname === "/me/feedback-submissions") {
    return slicePage(
      state.feedback.filter((item) => item.ownerId === FEEDBACK_OWNER_ID).map(feedbackListItem),
      url
    )
  }
  if (method === "GET" && pathname === "/feedback-submissions") {
    return slicePage(state.feedback.map(feedbackListItem), url)
  }
  if (method === "POST" && pathname === "/me/feedback-submissions") {
    const parsed = multipartSubmission(body)
    const submission = parsed?.submission
    const submissionKeys = submission && typeof submission === "object"
      ? Object.keys(submission)
      : []
    if (
      !submission ||
      typeof submission.content !== "string" ||
      submission.content.trim().length === 0 ||
      submission.content.trim().length > 5000 ||
      submissionKeys.some((key) => !["content", "clientContext"].includes(key))
    ) {
      return { __status: 400, payload: errorPayload("Invalid feedback submission", "FIXTURE_VALIDATION") }
    }
    if (submission.clientContext && typeof submission.clientContext === "object") {
      const contextKeys = Object.keys(submission.clientContext)
      if (contextKeys.some((key) => ![
        "pagePath",
        "appVersion",
        "browserName",
        "browserVersion",
        "osName",
        "osVersion",
        "locale",
      ].includes(key))) {
        return { __status: 400, payload: errorPayload("Invalid feedback context", "FIXTURE_VALIDATION") }
      }
    }
    const created = feedbackRecord(
      state.nextIds.feedback++,
      submission.content.trim(),
      "PENDING_REVIEW",
      {
        clientContext: submission.clientContext ?? false,
        screenshot: Boolean(parsed?.hasScreenshot),
      }
    )
    state.feedback.unshift(created)
    return feedbackDetail(created, false)
  }
  if (personalDetailMatch) {
    const id = Number(personalDetailMatch[1])
    const existing = state.feedback.find((item) => item.id === id && item.ownerId === FEEDBACK_OWNER_ID)
    if (!existing) return { __status: 404, payload: errorPayload("Feedback not found", "NOT_FOUND") }
    if (method === "DELETE") {
      if (existing.status !== "PENDING_REVIEW") {
        return { __status: 409, payload: errorPayload("Feedback is no longer withdrawable", "FEEDBACK_NO_LONGER_WITHDRAWABLE") }
      }
      state.feedback = state.feedback.filter((item) => item.id !== id)
      return { __status: 204 }
    }
    return feedbackDetail(existing, false)
  }
  if (personalScreenshotMatch) {
    const id = Number(personalScreenshotMatch[1])
    const existing = state.feedback.find((item) => item.id === id && item.ownerId === FEEDBACK_OWNER_ID)
    if (!existing || !existing.screenshot) return { __status: 404, payload: errorPayload("Feedback screenshot not found", "NOT_FOUND") }
    return { __binary: FEEDBACK_SCREENSHOT_BYTES, mimeType: existing.screenshot.mimeType }
  }
  if (moderationScreenshotMatch) {
    const existing = state.feedback.find((item) => item.id === Number(moderationScreenshotMatch[1]))
    if (!existing || !existing.screenshot) return { __status: 404, payload: errorPayload("Feedback screenshot not found", "NOT_FOUND") }
    return { __binary: FEEDBACK_SCREENSHOT_BYTES, mimeType: existing.screenshot.mimeType }
  }
  if (moderationDetailMatch) {
    const id = Number(moderationDetailMatch[1])
    const existing = state.feedback.find((item) => item.id === id)
    if (!existing) return { __status: 404, payload: errorPayload("Feedback not found", "NOT_FOUND") }
    if (method === "DELETE") {
      state.feedback = state.feedback.filter((item) => item.id !== id)
      return { __status: 204 }
    }
    return feedbackDetail(existing, true)
  }
  if (reviewMatch) {
    const id = Number(reviewMatch[1])
    const existing = state.feedback.find((item) => item.id === id)
    if (!existing) return { __status: 404, payload: errorPayload("Feedback not found", "NOT_FOUND") }
    if (existing.status !== "PENDING_REVIEW") {
      return { __status: 409, payload: errorPayload("Feedback already reviewed", "FEEDBACK_ALREADY_REVIEWED") }
    }
    const parsedBody = body && !body.__multipart ? body : {}
    if (
      !parsedBody ||
      typeof parsedBody.reviewMessage !== "string" ||
      parsedBody.reviewMessage.trim().length === 0 ||
      parsedBody.reviewMessage.trim().length > 1000 ||
      Object.keys(parsedBody).some((key) => key !== "reviewMessage")
    ) {
      return { __status: 400, payload: errorPayload("Invalid review message", "FIXTURE_VALIDATION") }
    }
    existing.status = "REVIEWED"
    existing.reviewMessage = parsedBody.reviewMessage.trim()
    existing.lastModifiedDate = NOW
    return feedbackDetail(existing, true)
  }
  return null
}

function responseForRoute(state, method, pathname, url, body) {
  if (method === "GET" && pathname === "/me") {
    return {
      id: FEEDBACK_OWNER_ID,
      email: FEEDBACK_OWNER.email,
      firstName: FEEDBACK_OWNER.firstName,
      lastName: FEEDBACK_OWNER.lastName,
      role_name: "Fixture",
      currentWorkspace: { id: 1, name: "Workspace Alpha" },
      mainImage: null,
      permissions: state.permissions,
    }
  }

  const feedbackResult = feedbackRouteResult(state, method, pathname, url, body)
  if (feedbackResult) return feedbackResult

  if (method === "GET" && pathname === "/me/workspaces") {
    return slicePage(state.workspaces, url)
  }

  if (method === "POST" && pathname === "/me/workspaces") {
    const next = workspace(state.nextIds.workspace++, String(body?.name ?? "New workspace"))
    state.workspaces.push(next)
    return next
  }

  const workspaceIdMatch = pathname.match(/^\/me\/workspaces\/(\d+)(?:\/set-current)?$/)
  if (workspaceIdMatch) {
    const id = Number(workspaceIdMatch[1])
    const selected = state.workspaces.find((item) => item.id === id)
    if (!selected) return { __status: 404, payload: errorPayload("Workspace not found", "NOT_FOUND") }

    if (pathname.endsWith("/set-current")) {
      state.workspaces = state.workspaces.map((item) => ({ ...item, currentWorkspace: item.id === id }))
    } else if (method === "PUT" && body?.name) {
      selected.name = String(body.name)
      selected.lastModifiedDate = NOW
    }
    return state.workspaces.find((item) => item.id === id)
  }

  if (method === "GET" && pathname === "/dashboard/summary") {
    const current = state.workspaces.find((item) => item.currentWorkspace) ?? state.workspaces[0]
    return dashboardSummary(current?.id ?? 1)
  }

  if (method === "GET" && pathname === "/graph-view") return graphView(state)

  if (method === "GET" && (pathname === "/watchlists" || pathname === "/watchlists/assets")) {
    return slicePage(state.assets.map((item) => ({ ...item, lastModifiedDate: undefined })), url)
  }

  if (method === "POST" && pathname === "/watchlists/assets") {
    return { items: state.assets, createdAssetIds: body?.assetIds ?? [], existingAssetIds: [] }
  }

  if (method === "DELETE" && /^\/watchlists\/assets\/\d+$/.test(pathname)) {
    const id = Number(pathname.split("/").pop())
    state.assets = state.assets.filter((item) => item.assetId !== id)
    return { __status: 204 }
  }

  if (method === "GET" && pathname === "/news-articles") {
    return slicePage(state.newsArticles, url)
  }

  const newsArticleDetailMatch = pathname.match(/^\/news-articles\/(\d+)$/)
  if (method === "GET" && newsArticleDetailMatch) {
    const id = Number(newsArticleDetailMatch[1])
    const article = state.newsArticles.find((item) => item.id === id)

    if (!article) {
      return {
        __status: 404,
        payload: errorPayload("News article not found", "NOT_FOUND"),
      }
    }

    return article
  }

  if (method === "GET" && pathname === "/events") {
    return slicePage(state.events, url)
  }

  const eventDetailMatch = pathname.match(/^\/events\/(\d+)$/)
  if (method === "GET" && eventDetailMatch) {
    const id = Number(eventDetailMatch[1])
    const event = state.events.find((item) => item.id === id)

    if (!event) {
      return {
        __status: 404,
        payload: errorPayload("Event not found", "NOT_FOUND"),
      }
    }

    return {
      ...event,
      assets: [],
      themes: [],
      evidence: [],
      marketReactions: [],
    }
  }

  if (method === "GET" && pathname === "/me/notes") {
    return slicePage(state.notes.map((item) => ({ ...item, content: undefined })), url)
  }

  const noteMatch = pathname.match(/^\/me\/notes\/(\d+)$/)
  if (noteMatch) {
    const id = Number(noteMatch[1])
    const existing = state.notes.find((item) => item.id === id)
    if (!existing) return { __status: 404, payload: errorPayload("Note not found", "NOT_FOUND") }

    if (method === "PUT") {
      existing.title = body?.title ?? null
      existing.content = body?.content ?? existing.content
      existing.lastModifiedDate = NOW
    }
    if (method === "DELETE") {
      state.notes = state.notes.filter((item) => item.id !== id)
      return { __status: 204 }
    }
    return existing
  }

  if (method === "POST" && pathname === "/me/notes") {
    const created = note(state.nextIds.note++, body?.title ?? null, extractText(body?.content))
    created.content = body?.content ?? created.content
    state.notes.unshift(created)
    return created
  }

  if (method === "GET" && pathname === "/telegram/bot-connections") return state.botConnections
  if (method === "GET" && pathname === "/telegram/destinations") return state.destinations
  if (method === "GET" && pathname === "/telegram/feature-settings") return state.featureSettings
  if (method === "GET" && pathname === "/telegram/market-analysis-schedules") return state.schedules
  if (method === "GET" && pathname === "/languages") return { languages: state.languages }

  if (method === "POST" && pathname === "/telegram/bot-connections") {
    return {
      id: 12,
      botUsername: "new_fixture_bot",
      displayLabel: "New fixture bot",
      status: "ACTIVE",
      createdDate: NOW,
      lastModifiedDate: NOW,
    }
  }

  if (method === "PATCH" && /^\/telegram\/bot-connections\/\d+\/disable$/.test(pathname)) {
    const id = Number(pathname.split("/")[3])
    const item = state.botConnections.find((connection) => connection.id === id)
    if (item) item.status = "DISABLED"
    return item ?? state.botConnections[0]
  }

  if (method === "DELETE" && /^\/telegram\/bot-connections\/\d+$/.test(pathname)) {
    return { __status: 204 }
  }

  if (method === "POST" && pathname === "/telegram/destinations/link-token") {
    return { botConnectionId: body?.botConnectionId ?? 11, token: "fixture-token", startCommand: "/start fixture-token", expiresAt: NOW }
  }

  if (method === "POST" && /^\/telegram\/destinations\/\d+\/test-message$/.test(pathname)) {
    return { __status: 204 }
  }

  if (method === "PATCH" && /^\/telegram\/destinations\/\d+\/disable$/.test(pathname)) {
    const id = Number(pathname.split("/")[3])
    const item = state.destinations.find((destination) => destination.id === id)
    if (item) item.status = "DISABLED"
    return item ?? state.destinations[0]
  }

  if (method === "DELETE" && /^\/telegram\/destinations\/\d+$/.test(pathname)) return { __status: 204 }

  if (method === "PUT" && pathname === "/telegram/feature-settings") {
    const existing = state.featureSettings.find((item) => item.featureKey === body?.featureKey && item.workspaceId === Number(body?.workspaceId))
    if (existing) {
      existing.enabled = body?.enabled ?? existing.enabled
      existing.destination = state.destinations.find((item) => item.id === Number(body?.destinationId))
      const outputLanguageIsoCode =
        typeof body?.outputLanguageIsoCode === "string"
          ? body.outputLanguageIsoCode.trim()
          : ""
      existing.outputLanguage = outputLanguageIsoCode
        ? state.languages.find(
            (item) => item.isoCode === outputLanguageIsoCode
          )
        : undefined
      existing.lastModifiedDate = NOW
      return existing
    }
    return state.featureSettings[0]
  }

  if (method === "POST" && pathname === "/telegram/market-analysis-schedules") {
    const currentWorkspace = state.workspaces.find((item) => item.currentWorkspace) ?? state.workspaces[0]
    const created = {
      id: state.nextIds.schedule++,
      name: body?.name ?? "Fixture schedule",
      workspaceId: Number(body?.workspaceId ?? currentWorkspace.id),
      workspaceName: currentWorkspace.name,
      destination: state.destinations.find((item) => item.id === Number(body?.destinationId)),
      timezone: body?.timezone ?? "Asia/Ho_Chi_Minh",
      localTimes: body?.localTimes ?? ["08:30"],
      asset: state.assets.find((item) => item.assetId === Number(body?.assetId)),
      outputLanguage: state.languages.find((item) => item.isoCode === body?.outputLanguageIsoCode),
      status: "ACTIVE",
      createdDate: NOW,
      lastModifiedDate: NOW,
    }
    state.schedules.push(created)
    return created
  }

  const scheduleMatch = pathname.match(/^\/telegram\/market-analysis-schedules\/(\d+)(?:\/disable)?$/)
  if (scheduleMatch) {
    const id = Number(scheduleMatch[1])
    const existing = state.schedules.find((item) => item.id === id)
    if (!existing) return { __status: 404, payload: errorPayload("Schedule not found", "NOT_FOUND") }
    if (pathname.endsWith("/disable")) existing.status = "DISABLED"
    if (method === "PUT") {
      existing.name = body?.name ?? existing.name
      existing.localTimes = body?.localTimes ?? existing.localTimes
      existing.lastModifiedDate = NOW
    }
    if (method === "DELETE") {
      existing.status = "REMOVED"
      return { __status: 204 }
    }
    return existing
  }

  if (method === "GET" && pathname === "/market-charts/candles") return candles(url)
  if (method === "GET" && pathname === "/market-charts/annotations") return marketChartAnnotations(url)
  if (method === "GET" && pathname === "/market-charts/economic-calendar-events") {
    return marketChartEconomicCalendarEvents(
      url,
      getScenario(state, method, pathname)
    )
  }

  return { __status: 404, payload: errorPayload(`Unhandled fixture route: ${method} ${pathname}`, "UNHANDLED_ROUTE") }
}

function extractText(value) {
  if (!Array.isArray(value)) return ""
  return value
    .flatMap((node) => (Array.isArray(node?.children) ? node.children : []))
    .map((child) => child?.text ?? "")
    .join(" ")
}

async function appendLog(entry) {
  const line = `${JSON.stringify(entry)}\n`
  if (!logFile) return
  await mkdir(dirname(logFile), { recursive: true })
  await appendFile(logFile, line, "utf8")
}

async function handleControl(request, response, url, body) {
  if (url.pathname === "/__test/health" && request.method === "GET") {
    sendJson(response, 200, { status: "ok", mode: "fixture", production: false })
    return true
  }

  if (url.pathname === "/__test/reset" && request.method === "POST") {
    const testRunId = body?.testRunId ?? request.headers["x-signapse-test-run-id"]
    if (!testRunId) {
      sendJson(response, 400, errorPayload("testRunId is required", "TEST_RUN_ID_REQUIRED"))
      return true
    }
    testRuns.set(String(testRunId), createState())
    sendJson(response, 200, { testRunId, reset: true })
    return true
  }

  if (url.pathname === "/__test/scenario" && request.method === "POST") {
    const testRunId = body?.testRunId ?? request.headers["x-signapse-test-run-id"]
    if (!testRunId || typeof body?.scenario !== "string") {
      sendJson(response, 400, errorPayload("testRunId and scenario are required", "SCENARIO_REQUIRED"))
      return true
    }
    const state = getState(String(testRunId))
    const key = body.route ?? "*"
    state.scenarios[body.method ? `${body.method} ${key}` : key] = body.scenario
    sendJson(response, 200, { testRunId, route: key, scenario: body.scenario })
    return true
  }

  if (url.pathname === "/__test/feedback-scenario" && request.method === "POST") {
    const testRunId = body?.testRunId ?? request.headers["x-signapse-test-run-id"]
    if (!testRunId || typeof body?.scenario !== "string") {
      sendJson(response, 400, errorPayload("testRunId and scenario are required", "SCENARIO_REQUIRED"))
      return true
    }
    const state = getState(String(testRunId))
    state.feedbackScenarios[body.kind ?? "feedback"] = body.scenario
    sendJson(response, 200, { testRunId, kind: body.kind ?? "feedback", scenario: body.scenario })
    return true
  }

  if (url.pathname === "/__test/permissions" && request.method === "POST") {
    const testRunId = body?.testRunId ?? request.headers["x-signapse-test-run-id"]
    if (!testRunId || !Array.isArray(body?.permissions)) {
      sendJson(response, 400, errorPayload("testRunId and permissions are required", "PERMISSIONS_REQUIRED"))
      return true
    }
    const state = getState(String(testRunId))
    state.permissions = body.permissions.map(String)
    sendJson(response, 200, { testRunId, permissions: state.permissions })
    return true
  }

  if (url.pathname === "/__test/state" && request.method === "GET") {
    const testRunId = request.headers["x-signapse-test-run-id"] ?? url.searchParams.get("testRunId")
    const state = getState(String(testRunId ?? "anonymous"))
    sendJson(response, 200, {
      testRunId,
      scenarios: state.scenarios,
      feedbackScenarios: state.feedbackScenarios,
      permissions: state.permissions,
      streamConnections: state.streamConnections,
      requests: state.requests,
      violations: state.violations,
    })
    return true
  }

  return false
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`)
  const method = request.method ?? "GET"
  const body = await readBody(request)

  if (method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type,x-signapse-test-run-id",
    })
    response.end()
    return
  }

  if (await handleControl(request, response, url, body)) return

  const rawTestRunId = request.headers["x-signapse-test-run-id"]
  if (!rawTestRunId) {
    const violation = {
      method,
      path: url.pathname,
      query: url.search,
      reason: "missing-test-run-id",
    }
    getState("anonymous").violations.push(violation)
    sendJson(response, 400, errorPayload("P0 fixture requires x-signapse-test-run-id", "MISSING_TEST_RUN_ID"))
    return
  }

  const testRunId = String(rawTestRunId)

  const state = getState(testRunId)
  const hasAuthHeader = Boolean(request.headers.authorization)
  const logEntry = {
    method,
    path: url.pathname,
    query: url.search,
    testRunId,
    locale: request.headers["accept-language"] ?? null,
    hasAuthHeader,
  }
  state.requests.push(logEntry)
  await appendLog(logEntry)

  if (hasAuthHeader) {
    state.violations.push({ ...logEntry, reason: "unexpected-auth-header" })
    sendJson(response, 403, errorPayload("P0 fixture rejects authenticated network calls", "UNEXPECTED_AUTH"))
    return
  }

  const contract = fixtureContracts.find(
    (item) => item.method === method && contractPathMatches(item.path, url.pathname)
  )
  if (!contract) {
    state.violations.push({ ...logEntry, reason: "unregistered-route" })
    sendJson(response, 404, errorPayload(`Unregistered fixture route: ${method} ${url.pathname}`, "UNREGISTERED_ROUTE"))
    return
  }

  const scenario = getScenario(state, method, url.pathname)
  const feedbackScenario = feedbackScenarioFor(state, method, url.pathname)
  if (feedbackScenario === "pending") {
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  if (scenario === "timeout") {
    await new Promise((resolve) => setTimeout(resolve, 250))
    sendJson(response, 504, errorPayload("Fixture request timed out", "FIXTURE_TIMEOUT"))
    return
  }
  if (scenario === "outage") {
    sendJson(response, 503, errorPayload("Fixture backend is unavailable", "FIXTURE_OUTAGE"))
    return
  }
  if (scenario === "validation-error") {
    sendJson(response, 422, errorPayload("Fixture validation failed", "FIXTURE_VALIDATION"))
    return
  }
  if (scenario === "mutation-failure" && method !== "GET") {
    sendJson(response, 409, errorPayload("Fixture mutation failed; retry is safe", "FIXTURE_MUTATION_FAILURE"))
    return
  }

  if (method === "GET" && url.pathname === "/market-charts/live") {
    await streamLive(response, state, url, scenario)
    return
  }

  const result = responseForRoute(state, method, url.pathname, url, body)
  const status = result?.__status ?? 200
  if (status === 204) {
    sendEmpty(response, 204)
    return
  }
  if (status >= 400) {
    sendJson(response, status, result.payload ?? errorPayload("Fixture route failed"))
    return
  }
  if (result?.__binary) {
    response.writeHead(200, {
      "Content-Type": result.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    })
    response.end(result.__binary)
    return
  }
  if (scenario === "empty" && method === "GET") {
    if (Array.isArray(result)) {
      sendJson(response, 200, [])
    } else if (result && Array.isArray(result.content)) {
      sendJson(response, 200, page([], result.number, result.size))
    } else if (result && Array.isArray(result.candles)) {
      const anchor = url.searchParams.get("to") ?? result.to
      sendJson(response, 200, {
        ...result,
        from: anchor,
        to: anchor,
        candles: [],
      })
    } else {
      sendJson(response, 200, result)
    }
    return
  }

  if (scenario === "short" && method === "GET" && result && Array.isArray(result.candles)) {
    sendJson(response, 200, {
      ...result,
      candles: result.candles.slice(-1),
    })
    return
  }

  if (scenario === "full-then-empty" && method === "GET" && result && Array.isArray(result.candles)) {
    const candleRequestCount = state.requests.filter((request) => request.path === "/market-charts/candles").length
    if (candleRequestCount > 1) {
      const anchor = url.searchParams.get("to") ?? result.to
      sendJson(response, 200, { ...result, from: anchor, to: anchor, candles: [] })
    } else {
      sendJson(response, 200, result)
    }
    return
  }

  if (scenario === "short-then-empty" && method === "GET" && result && Array.isArray(result.candles)) {
    const candleRequestCount = state.requests.filter(
      (request) => request.path === "/market-charts/candles"
    ).length

    if (candleRequestCount > 1) {
      const anchor = url.searchParams.get("to") ?? result.to
      sendJson(response, 200, {
        ...result,
        from: anchor,
        to: anchor,
        candles: [],
      })
    } else {
      sendJson(response, 200, {
        ...result,
        candles: result.candles.slice(-1),
      })
    }
    return
  }

  if (
    scenario === "short-then-empty-per-timeframe" &&
    method === "GET" &&
    result &&
    Array.isArray(result.candles)
  ) {
    const requestAssetId = url.searchParams.get("assetId")
    const requestTimeframe = url.searchParams.get("timeframe")
    const candleRequestCount = state.requests.filter((request) => {
      if (request.path !== "/market-charts/candles") return false

      const query = new URLSearchParams(request.query)
      return (
        query.get("assetId") === requestAssetId &&
        query.get("timeframe") === requestTimeframe
      )
    }).length

    if (candleRequestCount > 1) {
      const anchor = url.searchParams.get("to") ?? result.to
      sendJson(response, 200, {
        ...result,
        from: anchor,
        to: anchor,
        candles: [],
      })
    } else {
      sendJson(response, 200, {
        ...result,
        candles: result.candles.slice(-1),
      })
    }
    return
  }

  sendJson(response, status, result)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`P0 fixture server listening on http://127.0.0.1:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
