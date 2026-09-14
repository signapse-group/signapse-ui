"use client"

import { useEffect, useState, type ComponentProps } from "react"

export function LandingHeaderShell({
  children,
  ...props
}: ComponentProps<"header">) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [surface, setSurface] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main [data-landing-surface="dark"], main [data-landing-surface="light"]'
      )
    )

    const updateSurfaceState = () => {
      setIsScrolled(window.scrollY > 8)

      const activeSection = sections.find((section) => {
        const bounds = section.getBoundingClientRect()
        return bounds.top <= 72 && bounds.bottom > 72
      })

      setSurface(
        activeSection?.dataset.landingSurface === "light" ? "light" : "dark"
      )
    }

    updateSurfaceState()
    window.addEventListener("scroll", updateSurfaceState, { passive: true })

    return () => window.removeEventListener("scroll", updateSurfaceState)
  }, [])

  return (
    <header
      {...props}
      data-scrolled={isScrolled ? "true" : "false"}
      data-header-surface={surface}
    >
      {children}
    </header>
  )
}
