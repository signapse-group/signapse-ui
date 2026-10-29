"use client"

import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

export interface AiProviderConfigEditDraft {
  endpoint: string
  description: string
  newKey: string
  replacementKeys: Record<number, string>
}

interface AiProviderConfigDraftContextValue {
  drafts: Record<number, AiProviderConfigEditDraft>
  setDraft: (providerId: number, draft: AiProviderConfigEditDraft) => void
  clearDraft: (providerId: number) => void
}

const AiProviderConfigDraftContext =
  createContext<AiProviderConfigDraftContextValue | null>(null)

export function AiProviderConfigDraftProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [drafts, setDrafts] = useState<
    Record<number, AiProviderConfigEditDraft>
  >({})

  function setDraft(providerId: number, draft: AiProviderConfigEditDraft) {
    setDrafts((current) => ({ ...current, [providerId]: draft }))
  }

  function clearDraft(providerId: number) {
    setDrafts((current) => {
      if (!(providerId in current)) return current

      const next = { ...current }
      delete next[providerId]
      return next
    })
  }

  return (
    <AiProviderConfigDraftContext.Provider
      value={{ drafts, setDraft, clearDraft }}
    >
      {children}
    </AiProviderConfigDraftContext.Provider>
  )
}

export function useAiProviderConfigDrafts() {
  const context = useContext(AiProviderConfigDraftContext)
  if (!context) {
    throw new Error(
      "AiProviderConfigDraftProvider is required to edit AI connections."
    )
  }

  return context
}
