import * as React from "react"

import type { TCaptionProps, TImageElement, TResizableProps } from "platejs"
import type { SlateElementProps } from "platejs/static"

import { NodeApi } from "platejs"
import { SlateElement } from "platejs/static"

import { cn } from "@/lib/utils"
import { ResilientImage } from "./resilient-image"

export function ImageElementStatic(
  props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps> & {
    fallbackLabel?: string
  }
) {
  const { fallbackLabel, ...slateProps } = props
  const { align = "center", caption, url, width } = props.element
  const alt =
    typeof props.attributes.alt === "string" ? props.attributes.alt : ""

  return (
    <SlateElement {...slateProps} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div
          className="relative max-w-full min-w-[92px]"
          style={{ textAlign: align }}
        >
          <div>
            <ResilientImage
              className={cn(
                "w-full max-w-full cursor-default object-cover px-0",
                "rounded-sm"
              )}
              alt={alt}
              fallbackLabel={props.fallbackLabel ?? alt}
              src={url}
            />
          </div>
          {caption && (
            <figcaption
              className="mx-auto mt-2 h-[24px] max-w-full"
              style={{ textAlign: "center" }}
            >
              {NodeApi.string(caption[0])}
            </figcaption>
          )}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  )
}
