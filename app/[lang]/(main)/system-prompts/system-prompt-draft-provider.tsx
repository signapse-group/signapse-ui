"use client"

import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

interface SystemPromptDraftContextValue {
  drafts: Record<string, string>
  setDraft: (promptType: string, content: string) => void
  clearDraft: (promptType: string) => void
}

const SystemPromptDraftContext =
  createContext<SystemPromptDraftContextValue | null>(null)

export function SystemPromptDraftProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  function setDraft(promptType: string, content: string) {
    setDrafts((current) => ({ ...current, [promptType]: content }))
  }

  function clearDraft(promptType: string) {
    setDrafts((current) => {
      if (!(promptType in current)) return current

      const next = { ...current }
      delete next[promptType]
      return next
    })
  }

  return (
    <SystemPromptDraftContext.Provider value={{ drafts, setDraft, clearDraft }}>
      {children}
    </SystemPromptDraftContext.Provider>
  )
}

export function useSystemPromptDrafts() {
  const context = useContext(SystemPromptDraftContext)
  if (!context) {
    throw new Error(
      "SystemPromptDraftProvider is required to edit system prompts."
    )
  }

  return context
}
