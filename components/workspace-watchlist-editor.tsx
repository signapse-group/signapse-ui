"use client"

import * as React from "react"
import { FolderOpenIcon, RefreshCwIcon, ShieldAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  addAssetsToWorkspaceWatchlist,
  getWorkspaceWatchlistAssets,
  removeAssetFromWorkspaceWatchlist,
} from "@/app/api/watchlists/action"
import { AssetListResponse } from "@/app/lib/assets/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { WorkspaceResponse } from "@/app/lib/workspaces/definitions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

import { AssetMultiSelectCombobox } from "./asset-multi-select-combobox"

const WATCHLIST_BULK_ADD_LIMIT = 100
const WATCHLIST_ASSET_LIMIT = 3
const WATCHLIST_PAGE_SIZE = 200

type DialogOpenChangeDetails = Parameters<
  NonNullable<React.ComponentProps<typeof Dialog>["onOpenChange"]>
>[1]

interface WorkspaceWatchlistEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: WorkspaceResponse | null
  canReadAsset: boolean
  canReadWatchlist: boolean
  canCreateWatchlist: boolean
  canDeleteWatchlist: boolean
}

function mapWorkspaceWatchlistAssets(
  items: Awaited<ReturnType<typeof getWorkspaceWatchlistAssets>>["content"]
): AssetListResponse[] {
  return items.map((item) => ({
    id: item.assetId,
    name: item.assetName,
    symbol: item.assetSymbol,
    type: item.assetType,
  }))
}

function mergeUniqueAssets(
  currentAssets: AssetListResponse[],
  nextAssets: AssetListResponse[]
) {
  const assetsById = new Map(
    currentAssets.map((asset) => [asset.id, asset] as const)
  )

  nextAssets.forEach((asset) => {
    assetsById.set(asset.id, asset)
  })

  return Array.from(assetsById.values())
}

function chunkAssets(assets: AssetListResponse[]) {
  const chunks: AssetListResponse[][] = []

  for (
    let index = 0;
    index < assets.length;
    index += WATCHLIST_BULK_ADD_LIMIT
  ) {
    chunks.push(assets.slice(index, index + WATCHLIST_BULK_ADD_LIMIT))
  }

  return chunks
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function WorkspaceWatchlistEditor({
  open,
  onOpenChange,
  workspace,
  canReadAsset,
  canReadWatchlist,
  canCreateWatchlist,
  canDeleteWatchlist,
}: WorkspaceWatchlistEditorProps) {
  const router = useRouter()
  const { dictionary, formatMessage } = useLocalization()
  const watchlistLoadErrorFallback = dictionary.watchlist.loadErrorFallback
  const [isPending, startTransition] = React.useTransition()
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = React.useState(false)
  const [initialAssets, setInitialAssets] = React.useState<AssetListResponse[]>(
    []
  )
  const [selectedAssets, setSelectedAssets] = React.useState<
    AssetListResponse[]
  >([])
  const loadRequestIdRef = React.useRef(0)

  const canReadWorkspaceWatchlist =
    !!workspace && canReadAsset && canReadWatchlist
  const canManageWorkspaceWatchlist =
    canReadWorkspaceWatchlist && canCreateWatchlist && canDeleteWatchlist

  const isDirty = React.useMemo(() => {
    if (initialAssets.length !== selectedAssets.length) {
      return true
    }

    const initialIds = new Set(initialAssets.map((asset) => asset.id))
    return selectedAssets.some((asset) => !initialIds.has(asset.id))
  }, [initialAssets, selectedAssets])

  const loadWorkspaceWatchlistState = React.useCallback(async () => {
    if (!workspace || !canReadWorkspaceWatchlist) {
      return
    }

    const requestId = ++loadRequestIdRef.current
    setIsLoading(true)
    setLoadError(null)
    setSaveError(null)

    try {
      const loadedAssets: AssetListResponse[] = []
      let page = 0

      while (true) {
        const response = await getWorkspaceWatchlistAssets({
          filter: "",
          page,
          size: WATCHLIST_PAGE_SIZE,
          sort: [{ field: "createdDate", direction: "desc" }],
        })

        if (requestId !== loadRequestIdRef.current) {
          return
        }

        loadedAssets.push(...mapWorkspaceWatchlistAssets(response.content))

        if (response.last || page + 1 >= response.totalPages) {
          break
        }

        page += 1
      }

      const assets = mergeUniqueAssets([], loadedAssets)
      setInitialAssets(assets)
      setSelectedAssets(assets)
    } catch (error: unknown) {
      if (requestId !== loadRequestIdRef.current) {
        return
      }

      setLoadError(getErrorMessage(error, watchlistLoadErrorFallback))
      setInitialAssets([])
      setSelectedAssets([])
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [canReadWorkspaceWatchlist, watchlistLoadErrorFallback, workspace])

  React.useEffect(() => {
    if (!open || !canReadWorkspaceWatchlist) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadWorkspaceWatchlistState()
    })

    return () => {
      window.clearTimeout(timeoutId)
      loadRequestIdRef.current += 1
    }
  }, [canReadWorkspaceWatchlist, loadWorkspaceWatchlistState, open])

  function handleDialogOpenChange(
    nextOpen: boolean,
    eventDetails: DialogOpenChangeDetails
  ) {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    const target = eventDetails?.event?.target
    if (
      eventDetails?.reason === "outside-press" &&
      target instanceof Element &&
      target.closest('[data-slot="combobox-content"]')
    ) {
      eventDetails.cancel()
      return
    }

    if (isPending) {
      eventDetails?.cancel()
      return
    }

    if (isDirty) {
      eventDetails?.cancel()
      setDiscardOpen(true)
      return
    }

    loadRequestIdRef.current += 1
    onOpenChange(false)
  }

  function handleDiscardChanges() {
    setDiscardOpen(false)
    setSelectedAssets([...initialAssets])
    loadRequestIdRef.current += 1
    onOpenChange(false)
  }

  function handleSelectedAssetsChange(nextAssets: AssetListResponse[]) {
    setSelectedAssets(nextAssets)
    setSaveError(null)
  }

  function handleSave() {
    if (!workspace || !canManageWorkspaceWatchlist || isPending) {
      return
    }

    const initialIds = new Set(initialAssets.map((asset) => asset.id))
    const selectedIds = new Set(selectedAssets.map((asset) => asset.id))
    const assetsToRemove = initialAssets.filter(
      (asset) => !selectedIds.has(asset.id)
    )
    const assetsToAdd = selectedAssets.filter(
      (asset) => !initialIds.has(asset.id)
    )

    if (assetsToRemove.length === 0 && assetsToAdd.length === 0) {
      setSaveError(null)
      toast.success(dictionary.watchlist.noChanges)
      onOpenChange(false)
      return
    }

    if (selectedIds.size > WATCHLIST_ASSET_LIMIT) {
      const message = formatMessage(dictionary.watchlist.limitExceeded, {
        limit: WATCHLIST_ASSET_LIMIT,
      })
      setSaveError(message)
      toast.error(message)
      return
    }

    setSaveError(null)
    startTransition(async () => {
      let failureMessage: string | null = null

      for (const asset of assetsToRemove) {
        try {
          const result = await removeAssetFromWorkspaceWatchlist(asset.id)
          if (!result.success) {
            failureMessage = result.error
            break
          }
        } catch (error: unknown) {
          failureMessage = getErrorMessage(
            error,
            dictionary.watchlist.removeError
          )
          break
        }
      }

      if (!failureMessage) {
        for (const assets of chunkAssets(assetsToAdd)) {
          try {
            const result = await addAssetsToWorkspaceWatchlist({
              assetIds: assets.map((asset) => asset.id),
            })
            if (!result.success) {
              failureMessage = result.error
              break
            }
          } catch (error: unknown) {
            failureMessage = getErrorMessage(
              error,
              dictionary.watchlist.addError
            )
            break
          }
        }
      }

      if (failureMessage) {
        await loadWorkspaceWatchlistState()
        setSaveError(failureMessage)
        toast.error(failureMessage)
        router.refresh()
        return
      }

      setSaveError(null)
      toast.success(
        formatMessage(dictionary.watchlist.updated, { name: workspace.name })
      )
      onOpenChange(false)
      router.refresh()
    })
  }

  const isMissingWorkspace = !workspace
  const isBlockedByPermissions = !!workspace && !canManageWorkspaceWatchlist
  const canShowEditorBody = !isMissingWorkspace && !isBlockedByPermissions

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen, eventDetails) =>
          handleDialogOpenChange(nextOpen, eventDetails)
        }
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>{dictionary.watchlist.title}</DialogTitle>
            <DialogDescription>
              {formatMessage(dictionary.watchlist.description, {
                name: workspace?.name ?? dictionary.watchlist.noWorkspaceName,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-w-0 flex-col gap-4">
            {isMissingWorkspace ? (
              <Empty className="min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpenIcon />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.watchlist.noWorkspaceTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.watchlist.noWorkspaceDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {isBlockedByPermissions ? (
              <Empty className="min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldAlertIcon />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.watchlist.permissionTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.watchlist.permissionDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {canShowEditorBody ? (
              <>
                {loadError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <div className="text-sm font-medium text-destructive">
                      {dictionary.watchlist.loadErrorTitle}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {loadError}
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => void loadWorkspaceWatchlistState()}
                      >
                        {isLoading ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <RefreshCwIcon data-icon="inline-start" />
                        )}
                        {dictionary.common.retry}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {isLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex min-h-40 items-center justify-center rounded-lg border border-dashed"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner />
                      {dictionary.watchlist.loading}
                    </div>
                  </div>
                ) : (
                  <AssetMultiSelectCombobox
                    selectedAssets={selectedAssets}
                    onSelectedAssetsChange={handleSelectedAssetsChange}
                    disabled={isPending || !!loadError}
                  />
                )}

                {saveError ? (
                  <div
                    role="alert"
                    className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                  >
                    <span className="text-destructive">{saveError}</span>
                    {isDirty ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={handleSave}
                      >
                        {dictionary.common.retry}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="ghost" disabled={isPending} />
              }
            >
              {canShowEditorBody
                ? dictionary.common.cancel
                : dictionary.common.close}
            </DialogClose>
            {canManageWorkspaceWatchlist ? (
              <Button
                type="button"
                disabled={isPending || isLoading || !!loadError}
                onClick={handleSave}
              >
                {isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    {dictionary.watchlist.saving}
                  </>
                ) : (
                  dictionary.watchlist.saveList
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dictionary.watchlist.discardTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dictionary.watchlist.discardDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {dictionary.watchlist.keepEditing}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDiscardChanges}
            >
              {dictionary.watchlist.discardChanges}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
