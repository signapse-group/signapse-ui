"use client"

import * as React from "react"
import {
  BriefcaseBusinessIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  ListPlusIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  createWorkspace,
  setCurrentWorkspace,
  updateWorkspace,
} from "@/app/api/workspaces/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import { CURRENT_WORKSPACE_CHANGED_EVENT } from "@/app/lib/workspaces/events"
import { WorkspaceResponse } from "@/app/lib/workspaces/definitions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuContentInOverlay as DropdownMenuContent } from "@/components/ui/dropdown-menu-content-in-overlay"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { WorkspaceWatchlistEditor } from "./workspace-watchlist-editor"

const WORKSPACE_SWITCHER_TRIGGER_ID = "workspace-switcher-trigger"

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceResponse[]
  currentWorkspace: WorkspaceResponse | null
  canCreateWorkspace: boolean
  canRenameWorkspace: boolean
  canSetCurrentWorkspace: boolean
  canReadAsset: boolean
  canReadWatchlist: boolean
  canCreateWatchlist: boolean
  canDeleteWatchlist: boolean
  className?: string
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  canCreateWorkspace,
  canRenameWorkspace,
  canSetCurrentWorkspace,
  canReadAsset,
  canReadWatchlist,
  canCreateWatchlist,
  canDeleteWatchlist,
  className,
}: WorkspaceSwitcherProps) {
  const router = useRouter()
  const { dictionary, formatMessage } = useLocalization()
  const [isPending, startTransition] = React.useTransition()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isRenameOpen, setIsRenameOpen] = React.useState(false)
  const [isWatchlistOpen, setIsWatchlistOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [renameName, setRenameName] = React.useState("")

  const canManageWatchlist =
    !!currentWorkspace &&
    canReadAsset &&
    canReadWatchlist &&
    canCreateWatchlist &&
    canDeleteWatchlist

  async function handleSwitchWorkspace(workspace: WorkspaceResponse) {
    if (!canSetCurrentWorkspace || workspace.id === currentWorkspace?.id) {
      return
    }

    startTransition(async () => {
      const result = await setCurrentWorkspace(workspace.id)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      window.dispatchEvent(
        new CustomEvent(CURRENT_WORKSPACE_CHANGED_EVENT, {
          detail: { workspaceId: workspace.id },
        })
      )
      toast.success(
        formatMessage(dictionary.workspace.switched, { name: workspace.name })
      )
      router.refresh()
    })
  }

  function openRenameDialog() {
    if (!currentWorkspace) {
      return
    }

    setRenameName(currentWorkspace.name ?? "")
    setIsRenameOpen(true)
  }

  async function handleCreateWorkspace() {
    if (!canCreateWorkspace) {
      return
    }

    const name = createName.trim()

    if (!name) {
      toast.error(dictionary.workspace.nameRequired)
      return
    }

    startTransition(async () => {
      const result = await createWorkspace({
        name,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(dictionary.workspace.created)
      setCreateName("")
      setIsCreateOpen(false)
      router.refresh()
    })
  }

  async function handleRenameWorkspace() {
    if (!canRenameWorkspace || !currentWorkspace) {
      return
    }

    const name = renameName.trim()

    if (!name) {
      toast.error(dictionary.workspace.nameRequired)
      return
    }

    startTransition(async () => {
      const result = await updateWorkspace(currentWorkspace.id, {
        name,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(dictionary.workspace.updated)
      setIsRenameOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "max-w-full justify-between gap-2 px-3 md:min-w-56",
                className
              )}
            />
          }
          id={WORKSPACE_SWITCHER_TRIGGER_ID}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <BriefcaseBusinessIcon className="size-4" />
            </span>
            <span className="max-w-44 truncate text-sm font-medium md:max-w-52">
              {currentWorkspace?.name ?? dictionary.workspace.noneSelected}
            </span>
          </span>
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72"
          align="end"
          aria-labelledby={WORKSPACE_SWITCHER_TRIGGER_ID}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {dictionary.workspace.switcherLabel}
            </DropdownMenuLabel>
            {workspaces.length > 0 ? (
              workspaces.map((workspace) => {
                const isSelected = currentWorkspace?.id === workspace.id

                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    disabled={
                      isPending || !canSetCurrentWorkspace || isSelected
                    }
                    onClick={() => void handleSwitchWorkspace(workspace)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-8 items-center justify-center rounded-md border bg-muted/40">
                      <BriefcaseBusinessIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {workspace.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {isSelected
                          ? dictionary.workspace.active
                          : dictionary.workspace.switchable}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckIcon className="size-4 text-primary" />
                    ) : null}
                  </DropdownMenuItem>
                )
              })
            ) : (
              <DropdownMenuItem disabled className="p-2 text-muted-foreground">
                {dictionary.workspace.empty}
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator
            className={
              !canCreateWorkspace && !canRenameWorkspace && !canManageWatchlist
                ? "hidden"
                : ""
            }
          />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className={canCreateWorkspace ? "gap-2 p-2" : "hidden"}
              closeOnClick={false}
              onClick={() => {
                setIsCreateOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              {dictionary.workspace.createAction}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={canRenameWorkspace ? "gap-2 p-2" : "hidden"}
              disabled={!canRenameWorkspace || !currentWorkspace}
              closeOnClick={false}
              onClick={() => {
                openRenameDialog()
              }}
            >
              <PencilIcon className="size-4" />
              {dictionary.workspace.renameAction}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={canManageWatchlist ? "gap-2 p-2" : "hidden"}
              disabled={!canManageWatchlist}
              closeOnClick={false}
              onClick={() => {
                setIsWatchlistOpen(true)
              }}
            >
              <ListPlusIcon className="size-4" />
              {dictionary.workspace.manageWatchlist}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceFormDialog
        open={canCreateWorkspace && isCreateOpen}
        title={dictionary.workspace.createTitle}
        description={dictionary.workspace.createDescription}
        name={createName}
        submitLabel={dictionary.workspace.createAction}
        isPending={isPending}
        onNameChange={setCreateName}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateWorkspace}
      />

      <WorkspaceFormDialog
        open={canRenameWorkspace && isRenameOpen}
        title={dictionary.workspace.renameTitle}
        description={dictionary.workspace.renameDescription}
        name={renameName}
        submitLabel={dictionary.workspace.saveChanges}
        isPending={isPending}
        onNameChange={setRenameName}
        onOpenChange={setIsRenameOpen}
        onSubmit={handleRenameWorkspace}
      />

      <WorkspaceWatchlistEditor
        open={isWatchlistOpen}
        onOpenChange={setIsWatchlistOpen}
        workspace={currentWorkspace}
        canReadAsset={canReadAsset}
        canReadWatchlist={canReadWatchlist}
        canCreateWatchlist={canCreateWatchlist}
        canDeleteWatchlist={canDeleteWatchlist}
      />
    </>
  )
}

function WorkspaceFormDialog({
  open,
  title,
  description,
  name,
  submitLabel,
  isPending,
  onNameChange,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  title: string
  description: string
  name: string
  submitLabel: string
  isPending: boolean
  onNameChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const { dictionary } = useLocalization()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {dictionary.workspace.nameLabel}
            <Input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={dictionary.workspace.namePlaceholder}
            />
          </label>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="ghost" disabled={isPending} />
            }
          >
            {dictionary.common.cancel}
          </DialogClose>
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
