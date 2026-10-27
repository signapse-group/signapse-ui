import { Suspense } from "react"

import {
  getAiTaskConfigurationConnections,
  getAiTaskConfigurations,
} from "@/app/api/ai-task-configurations/action"
import {
  AI_TASK_CONFIGURATION_READ_PERMISSION,
  AI_TASK_CONFIGURATION_UPDATE_PERMISSION,
  AI_TASK_MODEL_CATALOG_PERMISSION,
  AI_TASK_PROVIDER_READ_PERMISSION,
} from "@/app/lib/ai-task-configurations/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { canReadSystemPrompts } from "@/app/lib/system-prompts/permissions"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"

import { AiTaskConfigurationsList } from "./ai-task-configurations-list"
import { AiTaskConfigurationsSkeleton } from "./ai-task-configurations-skeleton"

export default async function AiTaskConfigurationsPage() {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_CONFIGURATION_READ_PERMISSION)) {
    return (
      <AccessDenied
        description={dictionary.aiTaskConfigurations.readDenied}
        permission={AI_TASK_CONFIGURATION_READ_PERMISSION}
      />
    )
  }

  const canUpdate = hasPermission(
    permissions,
    AI_TASK_CONFIGURATION_UPDATE_PERMISSION
  )
  const canReadConnections = hasPermission(
    permissions,
    AI_TASK_PROVIDER_READ_PERMISSION
  )
  const canReadModelCatalog = hasPermission(
    permissions,
    AI_TASK_MODEL_CATALOG_PERMISSION
  )
  const canReadPrompts = canReadSystemPrompts(permissions)

  return (
    <Suspense fallback={<AiTaskConfigurationsSkeleton />}>
      <AiTaskConfigurationsContent
        canUpdate={canUpdate}
        canReadConnections={canReadConnections}
        canReadModelCatalog={canReadModelCatalog}
        canReadPrompts={canReadPrompts}
      />
    </Suspense>
  )
}

async function AiTaskConfigurationsContent({
  canUpdate,
  canReadConnections,
  canReadModelCatalog,
  canReadPrompts,
}: {
  canUpdate: boolean
  canReadConnections: boolean
  canReadModelCatalog: boolean
  canReadPrompts: boolean
}) {
  const [configurations, connectionsResult] = await Promise.all([
    getAiTaskConfigurations(),
    canUpdate && canReadConnections
      ? getAiTaskConfigurationConnections()
      : Promise.resolve(undefined),
  ])

  const connections =
    connectionsResult?.success === true ? connectionsResult.data : []
  const connectionLoadError =
    connectionsResult && !connectionsResult.success
      ? connectionsResult.error
      : undefined

  return (
    <AiTaskConfigurationsList
      configurations={configurations}
      connections={connections}
      connectionLoadError={connectionLoadError}
      canUpdate={canUpdate}
      canReadConnections={canReadConnections}
      canReadModelCatalog={canReadModelCatalog}
      canReadPrompts={canReadPrompts}
    />
  )
}
