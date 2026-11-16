"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { useOverlayPortalContainer } from "@/components/ui/overlay-portal-container"
import { cn } from "@/lib/utils"

type PopoverContentInOverlayProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "anchor"
    | "collisionBoundary"
    | "collisionPadding"
    | "positionMethod"
    | "side"
    | "sideOffset"
  > & {
    positionerClassName?: string
    positionerStyle?: React.CSSProperties
  }

function PopoverContentInOverlay({
  className,
  align = "center",
  alignOffset = 0,
  anchor,
  collisionBoundary,
  collisionPadding,
  positionMethod,
  positionerClassName,
  positionerStyle,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentInOverlayProps) {
  const portalContainer = useOverlayPortalContainer()

  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        positionMethod={positionMethod}
        side={side}
        sideOffset={sideOffset}
        className={cn("isolate z-50", positionerClassName)}
        style={positionerStyle}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { PopoverContentInOverlay }
export type { PopoverContentInOverlayProps }
