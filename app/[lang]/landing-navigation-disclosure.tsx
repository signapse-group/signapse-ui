"use client"

import { useEffect, useRef, type ComponentProps } from "react"

type LandingNavigationDisclosureProps = ComponentProps<"details"> & {
  openOnHover?: boolean
}

export function LandingNavigationDisclosure({
  onBlur,
  onClick,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  openOnHover = false,
  ...props
}: LandingNavigationDisclosureProps) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      const details = ref.current
      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false
      }
    }

    document.addEventListener("pointerdown", dismiss)
    return () => document.removeEventListener("pointerdown", dismiss)
  }, [])

  return (
    <details
      {...props}
      ref={ref}
      onKeyDown={(event) => {
        onKeyDown?.(event)

        if (event.key === "Escape" && event.currentTarget.open) {
          event.preventDefault()
          event.currentTarget.open = false
          event.currentTarget.querySelector("summary")?.focus()
        }
      }}
      onBlur={(event) => {
        onBlur?.(event)

        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false
        }
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.target instanceof Element && event.target.closest("a")) {
          event.currentTarget.open = false
        }
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)

        if (openOnHover) {
          event.currentTarget.open = true
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)

        if (
          openOnHover &&
          !event.currentTarget.contains(document.activeElement)
        ) {
          event.currentTarget.open = false
        }
      }}
    />
  )
}
