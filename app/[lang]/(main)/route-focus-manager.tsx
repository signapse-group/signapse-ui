"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { useSidebar } from "@/components/ui/sidebar"

function focusMainContent() {
  document.getElementById("main-content")?.focus({ preventScroll: true })
}

export function RouteFocusManager() {
  const pathname = usePathname()
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const previousPathname = useRef(pathname)
  const pendingMobileFocus = useRef(false)

  useEffect(() => {
    if (previousPathname.current === pathname) return

    previousPathname.current = pathname

    if (isMobile && openMobile) {
      pendingMobileFocus.current = true
      setOpenMobile(false)
      return
    }

    focusMainContent()
  }, [isMobile, openMobile, pathname, setOpenMobile])

  useEffect(() => {
    if (!pendingMobileFocus.current || openMobile) return

    pendingMobileFocus.current = false
    focusMainContent()
  }, [openMobile])

  return null
}
