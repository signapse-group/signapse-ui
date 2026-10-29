"use client"

import { useLocalization } from "@/app/lib/i18n/provider"

export function SystemPromptLifecycleWarning({
  editor = false,
}: {
  editor?: boolean
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.systemPrompts
  const title = editor ? t.editorWarningTitle : t.listWarningTitle
  const description = editor
    ? t.editorWarningDescription
    : t.listWarningDescription
  const titleId = editor
    ? "system-prompt-editor-warning-title"
    : "system-prompt-list-warning-title"

  return (
    <aside aria-labelledby={titleId} className="rounded-xl border bg-card p-4">
      <h2 id={titleId} className="font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </aside>
  )
}
