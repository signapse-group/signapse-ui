"use client"

import { ShieldAlert } from "lucide-react"
import type { ReactNode } from "react"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface AccessDeniedProps {
  heading?: string
  title?: string
  description: string
  permission?: string
  action?: ReactNode
}

export function AccessDenied({
  heading,
  title,
  description,
  permission,
  action,
}: AccessDeniedProps) {
  const { dictionary } = useLocalization()
  const resolvedTitle = title ?? dictionary.errors.accessDeniedTitle

  return (
    <Empty className="min-h-[320px] rounded-lg border border-dashed">
      {heading ? <h1 className="sr-only">{heading}</h1> : null}
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert />
        </EmptyMedia>
        <EmptyTitle>{resolvedTitle}</EmptyTitle>
        <EmptyDescription>
          {description}
          {permission ? (
            <>
              {" "}
              {dictionary.errors.requiredPermission}: <code>{permission}</code>.
            </>
          ) : null}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
