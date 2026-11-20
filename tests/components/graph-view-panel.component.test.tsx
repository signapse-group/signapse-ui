// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getGraphViewForWorkspace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock("@/app/api/graph-view/action", () => ({
  getGraphViewForWorkspace: mocks.getGraphViewForWorkspace,
}))

vi.mock("@/app/[lang]/(main)/graph-view/sigma-graph-view-entry", () => ({
  SigmaGraphViewEntry: ({
    graphView,
    timeRangeControl,
  }: {
    graphView: { nodes: Array<{ label: string }> }
    timeRangeControl: React.ReactNode
  }) => (
    <div data-testid="graph-view-content">
      {graphView.nodes.map((node) => node.label).join(", ")}
      {timeRangeControl}
    </div>
  ),
}))

vi.mock("@/app/[lang]/(main)/graph-view/graph-view-state-actions", () => ({
  GraphViewStateActions: ({
    canChooseWorkspace,
  }: {
    canChooseWorkspace?: boolean
  }) => (
    <button>
      {canChooseWorkspace ? "Choose workspace" : "Manage watchlist"}
    </button>
  ),
}))

import { GraphViewPanel } from "@/app/[lang]/(main)/graph-view/graph-view-panel"
import type { GraphViewResponse } from "@/app/lib/graph-view/definitions"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"

const emptyGraph: GraphViewResponse = { nodes: [], edges: [] }

function createGraph(label: string): GraphViewResponse {
  return {
    nodes: [
      {
        id: label,
        kind: "event",
        label,
        secondaryLabel: null,
        metadata: {
          slug: null,
          canonicalKey: null,
          symbol: null,
          assetType: null,
          sourceName: null,
          url: null,
          occurredAt: null,
          publishedAt: null,
          status: null,
          narrativeStatus: null,
          confidence: null,
          thesis: null,
          themes: null,
        },
      },
    ],
    edges: [],
  }
}

type PanelProps = Parameters<typeof GraphViewPanel>[0]

function createProps(overrides: Partial<PanelProps> = {}): PanelProps {
  return {
    userId: 1,
    workspace: { id: 10, name: "Workspace" },
    graphView: emptyGraph,
    initialWatchlistIsEmpty: null,
    canReadWorkspace: true,
    canManageWatchlist: false,
    ...overrides,
  }
}

function renderPanel(
  props: PanelProps = createProps(),
  locale: "en" | "vi" = "en"
) {
  const dictionary = locale === "vi" ? viDictionary : en
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <GraphViewPanel {...props} />
    </LocalizationProvider>
  )
}

async function chooseWithMouse(
  user: ReturnType<typeof userEvent.setup>,
  optionName: string
) {
  await user.click(
    screen.getByRole("combobox", { name: /time range|khoảng thời gian/i })
  )
  await user.click(await screen.findByRole("option", { name: optionName }))
}

describe("GraphViewPanel time range", () => {
  beforeEach(() => {
    mocks.getGraphViewForWorkspace.mockReset()
    mocks.refresh.mockReset()
    if (!window.PointerEvent) {
      Object.defineProperty(window, "PointerEvent", {
        configurable: true,
        value: MouseEvent,
      })
    }
  })

  afterEach(cleanup)

  it("starts at seven days and keeps the selector on an empty Graph without watchlist access", () => {
    renderPanel()

    expect(
      screen.getByRole("combobox", { name: "Time range" })
    ).toHaveTextContent("Last 7 days")
    expect(screen.getByText("No events in the last 7 days")).toBeInTheDocument()
    expect(
      screen.queryByText("Your watchlist is empty")
    ).not.toBeInTheDocument()
  })

  it("changes ranges with the keyboard and shows the returned empty range", async () => {
    const user = userEvent.setup()
    mocks.getGraphViewForWorkspace.mockResolvedValue({
      kind: "success",
      graphView: emptyGraph,
    })
    renderPanel()

    const trigger = screen.getByRole("combobox", { name: "Time range" })
    await user.click(trigger)
    await screen.findByRole("option", { name: "Last 14 days" })
    await user.keyboard("{ArrowDown}{Enter}")

    await vi.waitFor(() => expect(trigger).toHaveTextContent("Last 14 days"))
    expect(mocks.getGraphViewForWorkspace).toHaveBeenLastCalledWith(14, {
      userId: 1,
      workspaceId: 10,
    })
    expect(
      await screen.findByText("No events in the last 14 days")
    ).toBeInTheDocument()
  })

  it("accepts mouse selection for the 30-day range", async () => {
    const user = userEvent.setup()
    mocks.getGraphViewForWorkspace.mockResolvedValue({
      kind: "success",
      graphView: emptyGraph,
    })
    renderPanel()

    await chooseWithMouse(user, "Last 30 days")

    expect(mocks.getGraphViewForWorkspace).toHaveBeenCalledWith(30, {
      userId: 1,
      workspaceId: 10,
    })
    expect(
      await screen.findByText("No events in the last 30 days")
    ).toBeInTheDocument()
  })

  it("ignores late responses from an earlier selected range", async () => {
    const user = userEvent.setup()
    const resolve = new Map<
      number,
      (result: { kind: "success"; graphView: GraphViewResponse }) => void
    >()
    mocks.getGraphViewForWorkspace.mockImplementation(
      (days: number) =>
        new Promise((done) => {
          resolve.set(days, done)
        })
    )
    renderPanel()

    await chooseWithMouse(user, "Last 14 days")
    await chooseWithMouse(user, "Last 30 days")

    await act(async () => {
      resolve.get(30)?.({
        kind: "success",
        graphView: createGraph("30-day result"),
      })
    })
    expect(await screen.findByText("30-day result")).toBeInTheDocument()

    await act(async () => {
      resolve.get(14)?.({
        kind: "success",
        graphView: createGraph("stale 14-day result"),
      })
    })
    expect(screen.getByText("30-day result")).toBeInTheDocument()
    expect(screen.queryByText("stale 14-day result")).not.toBeInTheDocument()
  })

  it("shows asset guidance only for a confirmed empty watchlist", () => {
    renderPanel(
      createProps({ initialWatchlistIsEmpty: true, canManageWatchlist: true })
    )

    expect(screen.getByText("Your watchlist is empty")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Manage watchlist" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Time range" })
    ).toBeInTheDocument()
  })

  it("keeps permission and load errors distinct and lets the user retry", async () => {
    const user = userEvent.setup()
    mocks.getGraphViewForWorkspace.mockResolvedValueOnce({
      kind: "permission-denied",
    })
    const view = renderPanel()

    await chooseWithMouse(user, "Last 14 days")
    expect(
      await screen.findByText(
        /You do not have permission to access the knowledge graph/
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()

    mocks.getGraphViewForWorkspace.mockResolvedValue({ kind: "error" })
    view.rerender(
      <LocalizationProvider locale="en" dictionary={en}>
        <GraphViewPanel key="fresh" {...createProps()} />
      </LocalizationProvider>
    )
    await chooseWithMouse(user, "Last 14 days")

    expect(
      await screen.findByText("Could not load knowledge graph")
    ).toBeInTheDocument()
    const calls = mocks.getGraphViewForWorkspace.mock.calls.length
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(mocks.getGraphViewForWorkspace).toHaveBeenCalledTimes(calls + 1)
    expect(
      screen.getByRole("combobox", { name: "Time range" })
    ).toBeInTheDocument()
  })

  it("uses Vietnamese labels and messages", () => {
    renderPanel(createProps(), "vi")

    expect(
      screen.getByRole("combobox", { name: "Khoảng thời gian" })
    ).toHaveTextContent("7 ngày qua")
    expect(
      screen.getByText("Không có Event trong 7 ngày qua")
    ).toBeInTheDocument()
  })
})
