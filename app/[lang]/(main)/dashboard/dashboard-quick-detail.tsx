"use client"

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react"

import {
  LocalEntityQuickDetailDrawer,
  type LocalQuickDetailEntity,
} from "../local-entity-quick-detail-drawer"

type OpenQuickDetail = (
  entity: LocalQuickDetailEntity,
  trigger: HTMLElement
) => void

const DashboardQuickDetailContext = createContext<OpenQuickDetail | null>(null)

export function DashboardQuickDetailProvider({
  children,
  watchlistAssetIds,
}: {
  children: ReactNode
  watchlistAssetIds?: readonly number[]
}) {
  const [entity, setEntity] = useState<LocalQuickDetailEntity | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  function openQuickDetail(
    nextEntity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) {
    returnFocusRef.current = trigger
    setEntity(nextEntity)
  }

  return (
    <DashboardQuickDetailContext.Provider value={openQuickDetail}>
      {children}
      <LocalEntityQuickDetailDrawer
        entity={entity}
        onClose={() => setEntity(null)}
        owner="dashboard"
        returnFocusRef={returnFocusRef}
        watchlistAssetIds={watchlistAssetIds ?? []}
      />
    </DashboardQuickDetailContext.Provider>
  )
}

export function DashboardQuickDetailButton({
  "aria-haspopup": ariaHasPopup = "dialog",
  entity,
  onClick,
  ...props
}: ComponentProps<"button"> & {
  entity: LocalQuickDetailEntity
}) {
  const openQuickDetail = useContext(DashboardQuickDetailContext)

  if (!openQuickDetail) {
    throw new Error(
      "DashboardQuickDetailButton must be used within DashboardQuickDetailProvider"
    )
  }

  const open = openQuickDetail

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const trigger = event.currentTarget
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    open(entity, trigger)
  }

  return (
    <button
      {...props}
      type="button"
      aria-haspopup={ariaHasPopup}
      onClick={handleClick}
    />
  )
}
