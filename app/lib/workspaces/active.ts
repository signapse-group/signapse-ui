import { WorkspaceResponse } from "@/app/lib/workspaces/definitions"

export function resolveActiveWorkspace(
  workspaces: readonly WorkspaceResponse[]
): WorkspaceResponse | null {
  return workspaces.find((workspace) => workspace.currentWorkspace) ?? null
}
