"use client"

import { useState } from "react"
import { BriefcaseBusiness, ListPlus } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import type { BackendWorkspaceSummary } from "@/app/lib/users/definitions"
import { Button } from "@/components/ui/button"
import { WorkspaceWatchlistEditor } from "@/components/workspace-watchlist-editor"

export function GraphViewStateActions({
  workspace,
  canChooseWorkspace = false,
}: {
  workspace?: BackendWorkspaceSummary
  canChooseWorkspace?: boolean
}) {
  const { dictionary } = useLocalization()
  const [watchlistOpen, setWatchlistOpen] = useState(false)

  if (canChooseWorkspace) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          document.getElementById("workspace-switcher-trigger")?.click()
        }
      >
        <BriefcaseBusiness data-icon="inline-start" />
        {dictionary.graphView.demo.chooseWorkspace}
      </Button>
    )
  }

  if (!workspace) return null

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setWatchlistOpen(true)}
      >
        <ListPlus data-icon="inline-start" />
        {dictionary.workspace.manageWatchlist}
      </Button>
      <WorkspaceWatchlistEditor
        open={watchlistOpen}
        onOpenChange={setWatchlistOpen}
        workspace={workspace}
        canReadAsset
        canReadWatchlist
        canCreateWatchlist
        canDeleteWatchlist
      />
    </>
  )
}
