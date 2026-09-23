import * as React from "react"

import { cn } from "@/lib/utils"

type AppFormShellWidth = "sm" | "md" | "lg"
type AppFormShellSurface = "card" | "plain"

const widthClassName: Record<AppFormShellWidth, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
}

const surfaceClassName: Record<AppFormShellSurface, string> = {
  card: "mx-auto overflow-hidden rounded-xl border bg-card shadow-sm",
  plain: "mx-auto overflow-visible",
}

function AppFormShell({
  title,
  description,
  width = "md",
  surface = "card",
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title: React.ReactNode
  description?: React.ReactNode
  width?: AppFormShellWidth
  surface?: AppFormShellSurface
}) {
  return (
    <section
      data-slot="app-form-shell"
      data-surface={surface}
      className={cn(
        "w-full",
        surfaceClassName[surface],
        widthClassName[width],
        className
      )}
      {...props}
    >
      <header
        className={cn(
          "flex flex-col gap-2 px-6 pt-6",
          surface === "plain" && "px-0"
        )}
      >
        <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  )
}

function AppFormShellBody({
  surface = "card",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  surface?: AppFormShellSurface
}) {
  return (
    <div
      data-slot="app-form-shell-body"
      className={cn("px-6 py-6", surface === "plain" && "px-0", className)}
      {...props}
    />
  )
}

function AppFormShellFooter({
  surface = "card",
  className,
  ...props
}: React.ComponentProps<"footer"> & {
  surface?: AppFormShellSurface
}) {
  return (
    <footer
      data-slot="app-form-shell-footer"
      className={cn(
        "flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end",
        surface === "plain" && "bg-transparent px-0",
        className
      )}
      {...props}
    />
  )
}

function AppFormShellSkeleton({
  width = "md",
  surface = "card",
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  width?: AppFormShellWidth
  surface?: AppFormShellSurface
}) {
  return (
    <section
      data-slot="app-form-shell-skeleton"
      data-surface={surface}
      className={cn(
        "w-full",
        surfaceClassName[surface],
        widthClassName[width],
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
  AppFormShellSkeleton,
}
