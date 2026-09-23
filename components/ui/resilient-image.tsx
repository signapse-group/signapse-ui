"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

interface ResilientImageProps {
  alt: string
  className?: string
  fallbackLabel: string
  src: string
}

export function ResilientImage({
  alt,
  className,
  fallbackLabel,
  src,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    const label = alt || fallbackLabel

    return (
      <div
        aria-label={label || undefined}
        className={cn(
          "flex min-h-24 items-center justify-center border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground",
          className
        )}
        role={label ? "img" : undefined}
      >
        {fallbackLabel}
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      src={src}
    />
  )
}
