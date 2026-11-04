"use client"

import { Control, Controller } from "react-hook-form"
import * as z from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import { AppFormSwitchField } from "@/components/app-form-switch-field"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function getNewsOutletFormSchema(dictionary: Dictionary) {
  return z.object({
    name: z.string().trim().min(1, dictionary.newsOutlets.nameRequired),
    homepageUrl: z
      .string()
      .trim()
      .min(1, dictionary.newsOutlets.homepageRequired),
    rssUrl: z.string().trim(),
    description: z.string().trim(),
    active: z.boolean().default(true),
  })
}

export type NewsOutletFormValues = z.infer<
  ReturnType<typeof getNewsOutletFormSchema>
>

interface NewsOutletFormFieldsProps {
  control: Control<NewsOutletFormValues>
  isSubmitting: boolean
}

export function NewsOutletFormFields({
  control,
  isSubmitting,
}: NewsOutletFormFieldsProps) {
  const { dictionary } = useLocalization()

  return (
    <>
      <FieldSet>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">
                  {dictionary.newsOutlets.nameLabel}{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id="name"
                  aria-invalid={fieldState.invalid}
                  aria-required="true"
                  placeholder={dictionary.newsOutlets.namePlaceholder}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="homepageUrl"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="homepageUrl">
                  {dictionary.newsOutlets.homepageLabel}{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id="homepageUrl"
                  aria-invalid={fieldState.invalid}
                  aria-required="true"
                  placeholder={dictionary.newsOutlets.homepagePlaceholder}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="rssUrl"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rssUrl">
                  {dictionary.newsOutlets.rssLabel}
                </FieldLabel>
                <Input
                  {...field}
                  id="rssUrl"
                  aria-invalid={fieldState.invalid}
                  placeholder={dictionary.newsOutlets.rssPlaceholder}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  {dictionary.newsOutlets.rssDescription}
                </FieldDescription>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="description">
                  {dictionary.newsOutlets.descriptionLabel}
                </FieldLabel>
                <Textarea
                  {...field}
                  id="description"
                  aria-invalid={fieldState.invalid}
                  rows={4}
                  placeholder={dictionary.newsOutlets.descriptionPlaceholder}
                  disabled={isSubmitting}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLabel>{dictionary.newsOutlets.statusLabel}</FieldLabel>
        <FieldGroup>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <AppFormSwitchField
                id="active"
                label={dictionary.newsOutlets.activeLabel}
                description={dictionary.newsOutlets.activeDescription}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </FieldGroup>
      </FieldSet>
    </>
  )
}
