"use client"

import * as React from "react"

import { KEYS } from "platejs"

export type EditorMode = "default" | "blog"

const EditorModeContext = React.createContext<EditorMode>("default")

export const BLOG_EDITOR_ALLOWED_INSERT_VALUES = new Set([
  KEYS.p,
  KEYS.h1,
  KEYS.h2,
  KEYS.h3,
  KEYS.table,
  KEYS.codeBlock,
  KEYS.blockquote,
  KEYS.hr,
  KEYS.ul,
  KEYS.ol,
  KEYS.toggle,
  KEYS.img,
  KEYS.callout,
  KEYS.link,
  KEYS.date,
  "action_three_columns",
])

export function EditorModeProvider({
  children,
  mode,
}: {
  children: React.ReactNode
  mode: EditorMode
}) {
  return (
    <EditorModeContext.Provider value={mode}>
      {children}
    </EditorModeContext.Provider>
  )
}

export function useEditorMode() {
  return React.useContext(EditorModeContext)
}
