"use client"

import * as React from "react"

import { KEYS, normalizeStaticValue, type Value } from "platejs"
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
  initialValue?: Value
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
  initialValue = demoValue,
  onValueChange,
  readOnly = false,
}: PlateEditorProps = {}) {
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

const demoValue = normalizeStaticValue([
  {
    children: [{ text: "Welcome to the Plate Playground!" }],
    type: "h1",
  },
  {
    children: [
      { text: "Experience a modern rich-text editor built with " },
      { children: [{ text: "Slate" }], type: "a", url: "https://slatejs.org" },
      { text: " and " },
      { children: [{ text: "React" }], type: "a", url: "https://reactjs.org" },
      {
        text: ". This playground showcases just a part of Plate's capabilities. ",
      },
      {
        children: [{ text: "Explore the documentation" }],
        type: "a",
        url: "/docs",
      },
      { text: " to discover more." },
    ],
    type: "p",
  },
  // Core Features Section (Combined)
  {
    children: [{ text: "Rich Content Editing" }],
    type: "h2",
  },
  {
    children: [
      { text: "Structure your content with " },
      {
        children: [{ text: "headings" }],
        type: "a",
        url: "/docs/heading",
      },
      { text: ", " },
      {
        children: [{ text: "lists" }],
        type: "a",
        url: "/docs/list",
      },
      { text: ", and " },
      {
        children: [{ text: "quotes" }],
        type: "a",
        url: "/docs/blockquote",
      },
      { text: ". Apply " },
      {
        children: [{ text: "marks" }],
        type: "a",
        url: "/docs/basic-marks",
      },
      { text: " like " },
      { bold: true, text: "bold" },
      { text: ", " },
      { italic: true, text: "italic" },
      { text: ", " },
      { text: "underline", underline: true },
      { text: ", " },
      { strikethrough: true, text: "strikethrough" },
      { text: ", and " },
      { code: true, text: "code" },
      { text: ". Use " },
      {
        children: [{ text: "autoformatting" }],
        type: "a",
        url: "/docs/autoformat",
      },
      { text: " for " },
      {
        children: [{ text: "Markdown" }],
        type: "a",
        url: "/docs/markdown",
      },
      { text: "-like shortcuts (e.g., " },
      { kbd: true, text: "* " },
      { text: " for lists, " },
      { kbd: true, text: "# " },
      { text: " for H1)." },
    ],
    type: "p",
  },
  {
    children: [
      {
        children: [
          {
            text: "Blockquotes can group paragraphs, quoted lists, and reply chains.",
          },
        ],
        type: "p",
      },
      {
        children: [
          {
            text: "Markdown blockquotes keep this nested structure instead of flattening it.",
          },
        ],
        type: "p",
      },
      {
        children: [
          {
            text: "Quoted list item inside the same container.",
          },
        ],
        indent: 1,
        listStyleType: "disc",
        type: "p",
      },
      {
        children: [
          {
            children: [{ text: "Nested blockquotes work here too." }],
            type: "p",
          },
        ],
        type: "blockquote",
      },
    ],
    type: "blockquote",
  },
  {
    children: [
      { children: [{ text: "function hello() {" }], type: "code_line" },
      {
        children: [{ text: "  console.info('Code blocks are supported!');" }],
        type: "code_line",
      },
      { children: [{ text: "}" }], type: "code_line" },
    ],
    lang: "javascript",
    type: "code_block",
  },
  {
    children: [
      { text: "Create " },
      {
        children: [{ text: "links" }],
        type: "a",
        url: "/docs/link",
      },
      { text: ", " },
      {
        children: [{ text: "@mention" }],
        type: "a",
        url: "/docs/mention",
      },
      { text: " users like " },
      { children: [{ text: "" }], type: "mention", value: "Alice" },
      { text: ", or insert " },
      {
        children: [{ text: "emojis" }],
        type: "a",
        url: "/docs/emoji",
      },
      { text: " ✨. Use the " },
      {
        children: [{ text: "slash command" }],
        type: "a",
        url: "/docs/slash-command",
      },
      { text: " (/) for quick access to elements." },
    ],
    type: "p",
  },
  // Table Section
  {
    children: [{ text: "How Plate Compares" }],
    type: "h3",
  },
  {
    children: [
      {
        text: "Plate offers many features out-of-the-box as free, open-source plugins.",
      },
    ],
    type: "p",
  },
  {
    children: [
      {
        children: [
          {
            children: [
              { children: [{ bold: true, text: "Feature" }], type: "p" },
            ],
            type: "th",
          },
          {
            children: [
              {
                children: [{ bold: true, text: "Plate (Free & OSS)" }],
                type: "p",
              },
            ],
            type: "th",
          },
          {
            children: [
              { children: [{ bold: true, text: "Tiptap" }], type: "p" },
            ],
            type: "th",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [{ children: [{ text: "Emoji Picker" }], type: "p" }],
            type: "td",
          },
          {
            children: [
              {
                attributes: { align: "center" },
                children: [{ text: "✅" }],
                type: "p",
              },
            ],
            type: "td",
          },
          {
            children: [{ children: [{ text: "Paid Extension" }], type: "p" }],
            type: "td",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [
              { children: [{ text: "Table of Contents" }], type: "p" },
            ],
            type: "td",
          },
          {
            children: [
              {
                attributes: { align: "center" },
                children: [{ text: "✅" }],
                type: "p",
              },
            ],
            type: "td",
          },
          {
            children: [{ children: [{ text: "Paid Extension" }], type: "p" }],
            type: "td",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [{ children: [{ text: "Drag Handle" }], type: "p" }],
            type: "td",
          },
          {
            children: [
              {
                attributes: { align: "center" },
                children: [{ text: "✅" }],
                type: "p",
              },
            ],
            type: "td",
          },
          {
            children: [{ children: [{ text: "Paid Extension" }], type: "p" }],
            type: "td",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [
              { children: [{ text: "Collaboration (Yjs)" }], type: "p" },
            ],
            type: "td",
          },
          {
            children: [
              {
                attributes: { align: "center" },
                children: [{ text: "✅" }],
                type: "p",
              },
            ],
            type: "td",
          },
          {
            children: [
              { children: [{ text: "Hocuspocus (OSS/Paid)" }], type: "p" },
            ],
            type: "td",
          },
        ],
        type: "tr",
      },
    ],
    type: "table",
  },
  // Media Section
  {
    children: [{ text: "Images and Media" }],
    type: "h3",
  },
  {
    children: [
      {
        text: "Embed rich media like images directly in your content. Supports ",
      },
      {
        children: [{ text: "Media uploads" }],
        type: "a",
        url: "/docs/media",
      },
      {
        text: " and ",
      },
      {
        children: [{ text: "drag & drop" }],
        type: "a",
        url: "/docs/dnd",
      },
      {
        text: " for a smooth experience.",
      },
    ],
    type: "p",
  },
  {
    attributes: { align: "center" },
    caption: [
      {
        children: [{ text: "Images with captions provide context." }],
        type: "p",
      },
    ],
    children: [{ text: "" }],
    type: "img",
    url: "https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    width: "75%",
  },
  {
    children: [{ text: "" }],
    isUpload: true,
    name: "sample.pdf",
    type: "file",
    url: "https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf",
  },
  {
    children: [{ text: "" }],
    type: "audio",
    url: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
  },
  {
    children: [{ text: "Table of Contents" }],
    type: "h3",
  },
  {
    children: [{ text: "" }],
    type: "toc",
  },
  {
    children: [{ text: "" }],
    type: "p",
  },
])
