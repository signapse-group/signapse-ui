import { describe, expect, it } from "vitest"

import { resolveActiveWorkspace } from "@/app/lib/workspaces/active"
import type { WorkspaceResponse } from "@/app/lib/workspaces/definitions"

const workspaces: WorkspaceResponse[] = [
  {
    id: 1,
    name: "Workspace Alpha",
    currentWorkspace: false,
    createdDate: "2026-01-01T00:00:00Z",
    lastModifiedDate: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Workspace Beta",
    currentWorkspace: true,
    createdDate: "2026-01-01T00:00:00Z",
    lastModifiedDate: "2026-01-01T00:00:00Z",
  },
]

describe("resolveActiveWorkspace", () => {
  it("returns the workspace explicitly marked current", () => {
    expect(resolveActiveWorkspace(workspaces)).toEqual(workspaces[1])
  })

  it("does not choose a workspace when none is marked current", () => {
    expect(
      resolveActiveWorkspace(
        workspaces.map((workspace) => ({
          ...workspace,
          currentWorkspace: false,
        }))
      )
    ).toBeNull()
  })
})
