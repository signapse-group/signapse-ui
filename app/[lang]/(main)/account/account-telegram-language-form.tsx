"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { updateMyPreferredLanguage } from "@/app/api/user/action"
import type { LanguageCatalogResponse } from "@/app/lib/languages/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

interface AccountTelegramLanguageFormProps {
  catalog: LanguageCatalogResponse | null
}

export function AccountTelegramLanguageForm({
  catalog,
}: AccountTelegramLanguageFormProps) {
  const router = useRouter()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.accountTelegramLanguage
  const initialPreference = catalog?.preferredLanguage ?? null
  const [selectedIsoCode, setSelectedIsoCode] = useState(
    initialPreference ?? ""
  )
  const [savedIsoCode, setSavedIsoCode] = useState(initialPreference)
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null)
  const [isPending, setIsPending] = useState(false)
  const savedLanguage = catalog?.languages.find(
    (language) => language.isoCode === savedIsoCode
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      !catalog?.languages.some(
        (language) => language.isoCode === selectedIsoCode
      ) ||
      selectedIsoCode === savedIsoCode ||
      isPending
    ) {
      return
    }

    setFeedback(null)
    setIsPending(true)
    try {
      const result = await updateMyPreferredLanguage({
        isoCode: selectedIsoCode,
      })

      if (!result.success) {
        setFeedback("error")
        return
      }

      setSavedIsoCode(result.data.preferredLanguage?.isoCode ?? null)
      setFeedback("success")
      router.refresh()
    } catch {
      setFeedback("error")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section
      aria-labelledby="account-telegram-language-title"
      className="mx-auto mt-8 w-full max-w-3xl border-t pt-6"
    >
      <h2
        className="text-xl font-semibold tracking-tight"
        id="account-telegram-language-title"
      >
        {t.sectionTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t.languageDescription}
      </p>

      {catalog ? (
        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-telegram-language">
                {t.languageLabel}
              </FieldLabel>
              <Select
                disabled={isPending}
                items={catalog.languages.map((language) => ({
                  label: language.name,
                  value: language.isoCode,
                }))}
                onValueChange={(value) => {
                  setSelectedIsoCode(value ?? "")
                  setFeedback(null)
                }}
                value={selectedIsoCode}
              >
                <SelectTrigger
                  aria-busy={isPending}
                  className="w-full sm:max-w-sm"
                  id="account-telegram-language"
                >
                  <SelectValue placeholder={t.chooseLanguage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {catalog.languages.map((language) => (
                      <SelectItem
                        key={language.isoCode}
                        value={language.isoCode}
                      >
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {savedIsoCode === null
                  ? t.systemDefault
                  : formatMessage(t.savedLanguage, {
                      language: savedLanguage?.name ?? savedIsoCode,
                    })}
              </FieldDescription>
            </Field>
          </FieldGroup>

          {feedback === "success" ? (
            <p className="text-sm text-foreground" role="status">
              {t.saveSuccess}
            </p>
          ) : null}
          {feedback === "error" ? (
            <p className="text-sm text-destructive" role="alert">
              {t.saveError}
            </p>
          ) : null}
          {isPending ? (
            <span className="sr-only" role="status">
              {t.saving}
            </span>
          ) : null}

          <div className="flex justify-start">
            <Button
              disabled={
                isPending ||
                !selectedIsoCode ||
                selectedIsoCode === savedIsoCode
              }
              type="submit"
            >
              {isPending ? (
                <Spinner aria-hidden="true" data-icon="inline-start" />
              ) : null}
              {isPending ? t.saving : t.saveLanguage}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-sm text-destructive" role="alert">
            {t.loadError}
          </p>
          <Button
            onClick={() => router.refresh()}
            type="button"
            variant="outline"
          >
            {t.retry}
          </Button>
        </div>
      )}
    </section>
  )
}
