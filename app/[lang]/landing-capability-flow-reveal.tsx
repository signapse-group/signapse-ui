"use client"

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"

export function LandingCapabilityFlowReveal({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        setIsActive(entry.isIntersecting)
        if (entry.isIntersecting) setRun((current) => current + 1)
      },
      { threshold: 0.35 }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={rootRef}
      className={className}
      data-flow-active={isActive || undefined}
    >
      <Fragment key={run}>{children}</Fragment>
    </div>
  )
}
