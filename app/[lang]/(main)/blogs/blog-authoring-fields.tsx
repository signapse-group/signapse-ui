"use client"

import type { Control } from "react-hook-form"
import { Controller } from "react-hook-form"
import type { Value } from "platejs"

import { createEmptyBlogContent } from "@/app/lib/blogs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { PlateEditor } from "@/components/editor/plate-editor"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export interface BlogAuthoringFormValues {
  title: string
  slug: string
  shortDescription: string
  content: Value
}

interface BlogAuthoringFieldsProps {
  control: Control<BlogAuthoringFormValues>
  contentEditorKey?: number
  slugDescription?: string
  slugDisabled?: boolean
}

export function BlogAuthoringFields({
  control,
  contentEditorKey,
  slugDescription,
  slugDisabled = false,
}: BlogAuthoringFieldsProps) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()

  return (
    <FieldGroup>
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = "blog-title-error"

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="blog-title">
                {dictionary.blogs.titleLabel}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="blog-title"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? errorId : undefined}
                placeholder={dictionary.blogs.titlePlaceholder}
                autoComplete="off"
              />
              {fieldState.invalid ? (
                <FieldError id={errorId} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )
        }}
      />

      <Controller
        name="slug"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = "blog-slug-error"
          const descriptionId = "blog-slug-description"
          const describedBy = [
            slugDescription ? descriptionId : null,
            fieldState.invalid ? errorId : null,
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="blog-slug">
                {dictionary.blogs.slugLabel}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="blog-slug"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy || undefined}
                disabled={slugDisabled}
                placeholder={dictionary.blogs.slugPlaceholder}
                autoComplete="off"
              />
              {slugDescription ? (
                <FieldDescription id={descriptionId}>
                  {slugDescription}
                </FieldDescription>
              ) : null}
              {fieldState.invalid ? (
                <FieldError id={errorId} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )
        }}
      />

      <Controller
        name="shortDescription"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = "blog-short-description-error"

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="blog-short-description">
                {dictionary.blogs.shortDescriptionLabel}
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="blog-short-description"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? errorId : undefined}
                  placeholder={dictionary.blogs.shortDescriptionPlaceholder}
                  rows={3}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="text-xs tabular-nums">
                    {formatMessage(dictionary.blogs.characters, {
                      count: formatNumber(field.value.length),
                    })}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError id={errorId} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )
        }}
      />

      <Controller
        name="content"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = "blog-content-error"
          const descriptionId = "blog-content-description"

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="blog-content">
                {dictionary.blogs.contentLabel}
              </FieldLabel>
              <FieldDescription id={descriptionId}>
                {dictionary.blogs.contentDescription}
              </FieldDescription>
              <div
                className="h-[32rem] max-h-[65vh] min-h-0 overflow-hidden rounded-md border border-input"
                data-invalid={fieldState.invalid || undefined}
              >
                <PlateEditor
                  bodyPlaceholder={dictionary.blogs.contentPlaceholder}
                  containerClassName="h-full"
                  editorAriaDescribedBy={`${descriptionId}${fieldState.invalid ? ` ${errorId}` : ""}`}
                  editorAriaInvalid={fieldState.invalid}
                  editorId="blog-content"
                  initialValue={
                    field.value.length > 0
                      ? field.value
                      : createEmptyBlogContent()
                  }
                  key={contentEditorKey}
                  mode="blog"
                  onValueChange={field.onChange}
                />
              </div>
              {fieldState.invalid ? (
                <FieldError id={errorId} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )
        }}
      />
    </FieldGroup>
  )
}
