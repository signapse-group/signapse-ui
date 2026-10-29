import { beforeEach, expect, it, vi } from "vitest"
import type { ReactElement } from "react"
import { en } from "@/app/lib/i18n/dictionaries/en"

const state = vi.hoisted(() => ({
  fixture: false,
  permissions: ["graph-view:read"],
}))
vi.mock("@/app/lib/dev-auth-mode", () => ({
  isP0FixtureModeEnabled: () => state.fixture,
}))
vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions: async () => state.permissions,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: async () => en,
}))
vi.mock("@/app/api/graph-view/action", () => ({ getGraphView: vi.fn() }))
vi.mock("@/app/api/user/action", () => ({ getMe: vi.fn() }))
vi.mock("@/app/api/watchlists/action", () => ({
  getWorkspaceWatchlistAssets: vi.fn(),
}))
vi.mock("@/app/[lang]/(main)/graph-view/sigma-graph-view-entry", () => ({
  SigmaGraphViewEntry: () => null,
}))

import GraphViewPage from "@/app/[lang]/(main)/graph-view/page"

beforeEach(() => {
  state.fixture = false
  state.permissions = ["graph-view:read"]
})

it("keeps an edges query on the workspace data path outside fixture mode", async () => {
  const page = await GraphViewPage({
    searchParams: Promise.resolve({ edges: "100" }),
  })
  const child = (
    page as ReactElement<{
      children: ReactElement<{ graphView?: unknown; initialEdgeCount?: number }>
    }>
  ).props.children
  expect(child.props).toHaveProperty("canReadWatchlist")
  expect(child.props).not.toHaveProperty("initialEdgeCount")
})

it("permits synthetic data only in the explicit fixture test environment", async () => {
  state.fixture = true
  const page = await GraphViewPage({
    searchParams: Promise.resolve({ edges: "100" }),
  })
  const child = (
    page as ReactElement<{
      children: ReactElement<{ initialEdgeCount: number }>
    }>
  ).props.children
  expect(child.props.initialEdgeCount).toBe(100)
})

it("denies access before rendering the graph", async () => {
  state.permissions = []
  const page = await GraphViewPage({ searchParams: Promise.resolve({}) })
  expect(page.type).toBe("section")
})
