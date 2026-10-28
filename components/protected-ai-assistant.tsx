"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { TriangleAlertIcon } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import { MARKET_QUERY_EXECUTE_PERMISSIONS } from "@/app/lib/market-query/permissions"
import { useHasAnyPermission } from "@/components/permission-provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const MarketConversationAssistant = dynamic(
  () =>
    import("@/components/market-conversation-assistant/market-conversation-assistant").then(
      (module) => module.MarketConversationAssistant
    ),
  {
    ssr: false,
    loading: AssistantLoadingTrigger,
  }
)

interface ProtectedAiAssistantProps {
  displayName: string | null
  workspaceId: number | null
}

export function ProtectedAiAssistant({
  displayName,
  workspaceId,
}: ProtectedAiAssistantProps) {
  const { dictionary } = useLocalization()
  const pathname = usePathname()
  const canExecuteMarketQuery = useHasAnyPermission(
    MARKET_QUERY_EXECUTE_PERMISSIONS
  )
  const isSystemPromptRoute = pathname?.split("/").includes("system-prompts")

  if (!canExecuteMarketQuery || isSystemPromptRoute) {
    return null
  }

  return (
    <AssistantErrorBoundary
      fallback={<AssistantLoadError label={dictionary.aiAssistant.error} />}
    >
      <MarketConversationAssistant
        key={workspaceId ?? "no-workspace"}
        displayName={displayName}
        workspaceId={workspaceId}
      />
    </AssistantErrorBoundary>
  )
}

function AssistantLoadingTrigger() {
  const { dictionary } = useLocalization()

  return (
    <div className="fixed end-4 bottom-4">
      <Button
        type="button"
        variant="default"
        size="icon-lg"
        className="size-11 [&_svg:not([class*='size-'])]:size-5"
        disabled
        aria-label={dictionary.aiAssistant.loading}
      >
        <Spinner data-icon="inline-start" />
      </Button>
    </div>
  )
}

function AssistantLoadError({ label }: { label: string }) {
  return (
    <div className="fixed end-4 bottom-4" role="alert">
      <Button
        type="button"
        variant="destructive"
        size="icon-lg"
        className="size-11 [&_svg:not([class*='size-'])]:size-5"
        disabled
        aria-label={label}
      >
        <TriangleAlertIcon data-icon="inline-start" />
      </Button>
    </div>
  )
}

interface AssistantErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
}

interface AssistantErrorBoundaryState {
  hasError: boolean
}

class AssistantErrorBoundary extends React.Component<
  AssistantErrorBoundaryProps,
  AssistantErrorBoundaryState
> {
  state: AssistantErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AssistantErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
