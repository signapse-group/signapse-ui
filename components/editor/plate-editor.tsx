"use client"

import * as React from "react"

import { KEYS, type Value } from "platejs"
import { BlockPlaceholderPlugin, Plate, usePlateEditor } from "platejs/react"

import { EditorKit } from "@/components/editor/editor-kit"
import {
  EditorModeProvider,
  type EditorMode,
} from "@/components/editor/editor-mode"
import { Editor, EditorContainer } from "@/components/ui/editor"

interface PlateEditorProps {
  bodyPlaceholder?: string
  containerClassName?: string
  editorAriaDescribedBy?: string
  editorAriaInvalid?: boolean
  editorId?: string
  mode?: EditorMode
  initialValue: Value
  onValueChange?: (value: Value) => void
  readOnly?: boolean
}

export function PlateEditor({
  bodyPlaceholder,
  containerClassName,
  editorAriaDescribedBy,
  editorAriaInvalid,
  editorId,
  mode = "default",
  initialValue,
  onValueChange,
  readOnly = false,
}: PlateEditorProps) {
  const editor = usePlateEditor(
    {
      id: editorId,
      plugins: [
        ...EditorKit,
        BlockPlaceholderPlugin.configure({
          options: {
            className:
              "before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]",
            ...(bodyPlaceholder && {
              placeholders: {
                [KEYS.p]: bodyPlaceholder,
              },
            }),
          },
        }),
      ],
      value: initialValue,
    },
    [bodyPlaceholder, editorId]
  )

  return (
    <EditorModeProvider mode={mode}>
      <Plate
        editor={editor}
        onValueChange={
          onValueChange ? ({ value }) => onValueChange(value) : undefined
        }
        readOnly={readOnly}
      >
        <EditorContainer className={containerClassName}>
          <Editor
            id={editorId}
            aria-describedby={editorAriaDescribedBy}
            aria-invalid={editorAriaInvalid}
            placeholder={readOnly ? undefined : bodyPlaceholder}
            variant="demo"
          />
        </EditorContainer>
      </Plate>
    </EditorModeProvider>
  )
}
