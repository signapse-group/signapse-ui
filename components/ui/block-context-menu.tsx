"use client"

import * as React from "react"

import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from "@platejs/selection/react"
import { KEYS } from "platejs"
import {
  useEditorPlugin,
  useEditorReadOnly,
  usePluginOption,
} from "platejs/react"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  ContextMenuContentInOverlay as ContextMenuContent,
  ContextMenuSubContentInOverlay as ContextMenuSubContent,
} from "@/components/ui/context-menu-content-in-overlay"
import { setBlockType } from "@/components/editor/transforms"
import { useEditorMode } from "@/components/editor/editor-mode"
import { useIsTouchDevice } from "@/hooks/use-is-touch-device"

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin)
  const isTouch = useIsTouchDevice()
  const readOnly = useEditorReadOnly()
  const editorMode = useEditorMode()
  const openId = usePluginOption(BlockMenuPlugin, "openId")
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([, path]) => {
          setBlockType(editor, type, { at: path })
        })
    },
    [editor]
  )

  const handleAlign = React.useCallback(
    (align: "center" | "left" | "right") => {
      editor
        .getTransforms(BlockSelectionPlugin)
        .blockSelection.setNodes({ align })
    },
    [editor]
  )

  if (isTouch) {
    return children
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide()
        }
      }}
    >
      <ContextMenuTrigger
        render={<div className="w-full" />}
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset
          const disabled =
            dataset?.slateEditor === "true" ||
            readOnly ||
            dataset?.plateOpenContextMenu === "false"

          if (disabled) return event.preventDefault()

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            })
          }, 0)
        }}
      >
        {children}
      </ContextMenuTrigger>
      {isOpen && (
        <ContextMenuContent
          className="w-64"
          finalFocus={() => {
            editor.getApi(BlockSelectionPlugin).blockSelection.focus()
            return false
          }}
        >
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes()
                editor.tf.focus()
              }}
            >
              Delete
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.duplicate()
              }}
            >
              Duplicate
              {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Turn into</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                  Paragraph
                </ContextMenuItem>

                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                  Heading 1
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                  Heading 2
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                  Heading 3
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTurnInto(KEYS.blockquote)}
                >
                  Blockquote
                </ContextMenuItem>
                {editorMode !== "blog" ? (
                  <ContextMenuItem
                    onClick={() => handleTurnInto(KEYS.codeDrawing)}
                  >
                    Code Drawing
                  </ContextMenuItem>
                ) : null}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(1)
              }
            >
              Indent
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(-1)
              }
            >
              Outdent
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Align</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleAlign("left")}>
                  Left
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign("center")}>
                  Center
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign("right")}>
                  Right
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}
