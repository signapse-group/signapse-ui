"use client"

import * as React from "react"

import {
  AudioLinesIcon,
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  FileUpIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  SuperscriptIcon,
  TableIcon,
  TableOfContentsIcon,
} from "lucide-react"
import { KEYS } from "platejs"
import { type PlateEditor, useEditorRef } from "platejs/react"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  BLOG_EDITOR_ALLOWED_INSERT_VALUES,
  useEditorMode,
} from "@/components/editor/editor-mode"

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuContentInOverlay as DropdownMenuContent } from "@/components/ui/dropdown-menu-content-in-overlay"
import {
  insertBlock,
  insertInlineElement,
} from "@/components/editor/transforms"

import { MediaUrlDialog } from "./media-toolbar-button"
import { ToolbarButton, ToolbarMenuGroup } from "./toolbar"

type Group = {
  group: string
  items: Item[]
}

type Item = {
  icon: React.ReactNode
  value: string
  onSelect: (editor: PlateEditor, value: string) => void
  focusEditor?: boolean
  label?: string
}

type MediaNodeType =
  typeof KEYS.audio | typeof KEYS.file | typeof KEYS.img | typeof KEYS.video

const groups: Group[] = [
  {
    group: "Basic blocks",
    items: [
      {
        icon: <PilcrowIcon />,
        label: "Paragraph",
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        label: "Heading 1",
        value: "h1",
      },
      {
        icon: <Heading2Icon />,
        label: "Heading 2",
        value: "h2",
      },
      {
        icon: <Heading3Icon />,
        label: "Heading 3",
        value: "h3",
      },
      {
        icon: <TableIcon />,
        label: "Table",
        value: KEYS.table,
      },
      {
        icon: <FileCodeIcon />,
        label: "Code",
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
        label: "Quote",
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon />,
        label: "Divider",
        value: KEYS.hr,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value)
      },
    })),
  },
  {
    group: "Lists",
    items: [
      {
        icon: <ListIcon />,
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
        label: "To-do list",
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        label: "Toggle list",
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value)
      },
    })),
  },
  {
    group: "Media",
    items: [
      {
        icon: <ImageIcon />,
        value: KEYS.img,
      },
      {
        icon: <FilmIcon />,
        value: KEYS.video,
      },
      {
        icon: <AudioLinesIcon />,
        value: KEYS.audio,
      },
      {
        icon: <FileUpIcon />,
        value: KEYS.file,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value)
      },
    })),
  },
  {
    group: "Advanced blocks",
    items: [
      {
        icon: <TableOfContentsIcon />,
        label: "Table of contents",
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: "3 columns",
        value: "action_three_columns",
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Equation",
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        label: "Excalidraw",
        value: KEYS.excalidraw,
      },
      {
        icon: <Code2 />,
        label: "Code Drawing",
        value: KEYS.codeDrawing,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value)
      },
    })),
  },
  {
    group: "Inline",
    items: [
      {
        icon: <Link2Icon />,
        label: "Link",
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        label: "Date",
        value: KEYS.date,
      },
      {
        focusEditor: true,
        icon: <SuperscriptIcon />,
        label: "Footnote",
        value: "action_footnote",
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Inline Equation",
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value)
      },
    })),
  },
]

export function InsertToolbarButton(
  props: React.ComponentProps<typeof DropdownMenu>
) {
  const { dictionary } = useLocalization()
  const editorMode = useEditorMode()
  const editor = useEditorRef()
  const media = dictionary.editor.media
  const mediaConfig: Record<MediaNodeType, { label: string; title: string }> = {
    [KEYS.audio]: { label: media.audio, title: media.insertAudio },
    [KEYS.file]: { label: media.file, title: media.insertFile },
    [KEYS.img]: { label: media.image, title: media.insertImage },
    [KEYS.video]: { label: media.video, title: media.insertVideo },
  }
  const [open, setOpen] = React.useState(false)
  const [mediaDialogOpen, setMediaDialogOpen] = React.useState(false)
  const [mediaNodeType, setMediaNodeType] = React.useState<MediaNodeType>(
    KEYS.img
  )
  const visibleGroups =
    editorMode === "blog"
      ? groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              BLOG_EDITOR_ALLOWED_INSERT_VALUES.has(item.value)
            ),
          }))
          .filter((group) => group.items.length > 0)
      : groups

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
        <ToolbarButton
          render={<DropdownMenuTrigger />}
          aria-label={dictionary.editor.insert.insert}
          pressed={open}
          tooltip={dictionary.editor.insert.insert}
          isDropdown
        >
          <PlusIcon />
        </ToolbarButton>

        <DropdownMenuContent
          className="flex max-h-[500px] min-w-[180px] flex-col overflow-y-auto"
          align="start"
        >
          {visibleGroups.map(({ group, items: nestedItems }) => (
            <ToolbarMenuGroup key={group} label={group}>
              {nestedItems.map(({ icon, label, value, onSelect }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => {
                    if (Object.hasOwn(mediaConfig, value)) {
                      setOpen(false)
                      setMediaNodeType(value as MediaNodeType)
                      setMediaDialogOpen(true)
                      return
                    }

                    onSelect(editor, value)
                    editor.tf.focus()
                  }}
                >
                  {icon}
                  {mediaConfig[value as MediaNodeType]?.label ?? label}
                </DropdownMenuItem>
              ))}
            </ToolbarMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <MediaUrlDialog
        nodeType={mediaNodeType}
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        title={mediaConfig[mediaNodeType].title}
      />
    </>
  )
}
