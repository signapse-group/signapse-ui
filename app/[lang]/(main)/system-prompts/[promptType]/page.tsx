import { notFound } from "next/navigation"

import { getSystemPromptByType } from "@/app/api/system-prompts/action"
import type { SystemPromptContentResponse } from "@/app/lib/system-prompts/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  canReadSystemPrompts,
  canUpdateSystemPrompts,
} from "@/app/lib/system-prompts/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { SystemPromptForm } from "../system-prompt-form"

interface EditSystemPromptPageProps {
  params: Promise<{ promptType: string }>
}

function hasHttpStatus(error: unknown): error is Error & { status: number } {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  )
}

export default async function EditSystemPromptPage({
  params,
}: EditSystemPromptPageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!canReadSystemPrompts(permissions)) {
    return (
      <AccessDenied
        description={dictionary.systemPrompts.readDenied}
        permission="system-prompt:read"
      />
    )
  }

  if (!canUpdateSystemPrompts(permissions)) {
    return (
      <AccessDenied
        description={dictionary.systemPrompts.updateDenied}
        permission="system-prompt:update"
      />
    )
  }

  const { promptType } = await params
  let prompt: SystemPromptContentResponse

  try {
    prompt = await getSystemPromptByType(decodeURIComponent(promptType))
  } catch (error: unknown) {
    if (hasHttpStatus(error) && error.status === 404) {
      notFound()
    }

    if (hasHttpStatus(error) && error.status === 403) {
      return (
        <AccessDenied
          description={dictionary.systemPrompts.readDenied}
          permission="system-prompt:read"
        />
      )
    }

    throw error
  }

  return <SystemPromptForm initialData={prompt} />
}
