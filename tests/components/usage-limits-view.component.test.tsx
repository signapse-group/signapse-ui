// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import type { UsageLimitsResponse } from "@/app/lib/usage-limits/definitions"
import { UsageLimitsView } from "@/app/[lang]/(main)/usage-limits/usage-limits-view"

const usageLimits: UsageLimitsResponse = {
  workspace: { used: 0, limit: 5 },
  watchlist: {
    limit: 3,
    workspaces: [
      { workspaceId: 101, used: 0 },
      { workspaceId: 102, used: 4 },
    ],
  },
  conversationTurns: {
    used: 20,
    limit: 1000,
    periodStartUtc: "2026-09-01T00:00:00Z",
    resetAtUtc: "2026-10-01T00:00:00Z",
  },
  activeSchedules: { used: 1, limit: 1 },
}

describe("UsageLimitsView", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders zero usage, per-workspace usage, over-limit values, and UTC reset time", () => {
    render(
      <UsageLimitsView dictionary={en} locale="en" usageLimits={usageLimits} />
    )

    expect(
      screen.getByRole("heading", { name: en.usageLimits.title })
    ).toBeVisible()
    expect(screen.getAllByText("0", { exact: true })).toHaveLength(2)
    expect(screen.getByText("Workspace 101")).toBeVisible()
    expect(screen.getByText("Workspace 102")).toBeVisible()
    expect(screen.getAllByText(en.usageLimits.overLimit)).toHaveLength(1)
    expect(screen.getByText("4", { exact: true })).toBeVisible()
    expect(screen.getByText(/October 1, 2026/)).toHaveTextContent("UTC")
  })
})
