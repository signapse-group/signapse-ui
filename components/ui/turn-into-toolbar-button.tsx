"use client"

import * as React from "react"

import type { TElement } from "platejs"

import {
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from "lucide-react"
import { KEYS } from "platejs"
import { useEditorRef, useSelectionFragmentProp } from "platejs/react"

import {
  BLOG_EDITOR_ALLOWED_INSERT_VALUES,
  useEditorMode,
} from "@/components/editor/editor-mode"
import {
  DropdownMenu,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuContentInOverlay as DropdownMenuContent } from "@/components/ui/dropdown-menu-content-in-overlay"
import { getBlockType, setBlockType } from "@/components/editor/transforms"

import { ToolbarButton, ToolbarMenuGroup } from "./toolbar"

export const turnIntoItems = [
  {
    icon: <PilcrowIcon />,
    keywords: ["paragraph"],
    label: "Text",
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ["title", "h1"],
    label: "Heading 1",
    value: "h1",
  },
  {
    icon: <Heading2Icon />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    value: "h2",
  },
  {
    icon: <Heading3Icon />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    value: "h3",
  },
  {
    icon: <Heading4Icon />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    value: "h4",
  },
  {
    icon: <Heading5Icon />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    value: "h5",
  },
  {
    icon: <Heading6Icon />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    value: "h6",
  },
  {
    icon: <ListIcon />,
    keywords: ["unordered", "ul", "-"],
    label: "Bulleted list",
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ["ordered", "ol", "1"],
    label: "Numbered list",
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ["checklist", "task", "checkbox", "[]"],
    label: "To-do list",
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ["collapsible", "expandable"],
    label: "Toggle list",
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ["```"],
    label: "Code",
    value: KEYS.codeBlock,
  },
  {
    icon: <Code2 />,
    keywords: [
      "code-drawing",
      "diagram",
      "plantuml",
      "graphviz",
      "flowchart",
      "mermaid",
    ],
    label: "Code Drawing",
    value: KEYS.codeDrawing,
  },
  {
    icon: <QuoteIcon />,
    keywords: ["citation", "blockquote", ">"],
    label: "Quote",
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    label: "3 columns",
    value: "action_three_columns",
  },
]

export function TurnIntoToolbarButton(
  props: React.ComponentProps<typeof DropdownMenu>
) {
  const editor = useEditorRef()
  const editorMode = useEditorMode()
  const [open, setOpen] = React.useState(false)
  const visibleItems =
    editorMode === "blog"
      ? turnIntoItems.filter((item) =>
          BLOG_EDITOR_ALLOWED_INSERT_VALUES.has(item.value)
        )
      : turnIntoItems

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  })
  const selectedItem = React.useMemo(
    () =>
      visibleItems.find((item) => item.value === (value ?? KEYS.p)) ??
      visibleItems[0],
    [value, visibleItems]
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <ToolbarButton
        render={<DropdownMenuTrigger />}
        className="min-w-[125px]"
        pressed={open}
        tooltip="Turn into"
        isDropdown
      >
        {selectedItem.label}
      </ToolbarButton>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-[180px]"
        finalFocus={() => {
          editor.tf.focus()
          return false
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type)
          }}
          label="Turn into"
        >
          {visibleItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem key={itemValue} value={itemValue}>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
