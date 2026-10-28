import { notFound } from "next/navigation"
import { LocalizedLink as Link } from "@/components/localized-link"

import { getSystemPromptContentByType } from "@/app/api/system-prompts/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  isSystemPromptContentType,
  type SystemPromptContentResponse,
} from "@/app/lib/system-prompts/definitions"
import { canReadSystemPrompts } from "@/app/lib/system-prompts/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ViewSystemPromptPageProps {
  params: Promise<{ promptType: string }>
}

export default async function ViewSystemPromptPage({
  params,
}: ViewSystemPromptPageProps) {
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

  const { promptType: rawPromptType } = await params
  const promptType = decodeURIComponent(rawPromptType)

  if (!isSystemPromptContentType(promptType)) {
    notFound()
  }

  let prompt: SystemPromptContentResponse

  try {
    prompt = await getSystemPromptContentByType(promptType)
  } catch {
    return (
      <Card role="alert">
        <CardHeader>
          <h1 className="text-base leading-snug font-medium">
            {dictionary.systemPrompts.viewErrorTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dictionary.systemPrompts.viewError}
          </p>
        </CardHeader>
        <CardContent>
          <Link
            href="/ai-task-configurations"
            className={buttonVariants({ variant: "secondary" })}
          >
            {dictionary.common.back}
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!isSystemPromptContentType(prompt.promptType)) {
    notFound()
  }

  const taskDictionary = dictionary.aiTaskConfigurations

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {taskDictionary.promptViewTitle}
      </h1>

      <div>
        <Link
          href="/ai-task-configurations"
          className={buttonVariants({ variant: "secondary" })}
        >
          {dictionary.common.back}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base leading-snug font-medium">
            {taskDictionary.promptTypeLabels[prompt.promptType]}
          </h2>
        </CardHeader>
        <CardContent>
          <pre
            aria-label={taskDictionary.promptContentLabel}
            className="max-h-[70vh] overflow-auto rounded-md bg-muted/30 p-4 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap"
          >
            {prompt.content}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
