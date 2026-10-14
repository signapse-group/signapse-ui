"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Save } from "lucide-react"

import { updateMyPreferredLanguage } from "@/app/api/user/action"
import type { LanguageCatalogResponse } from "@/app/lib/languages/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
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
  const getLanguageName = (isoCode: string, name: string) => {
    if (isoCode === "en") return dictionary.locale.english
    if (isoCode === "vi") return dictionary.locale.vietnamese
    return name
  }
  const savedLanguageName = savedLanguage
    ? getLanguageName(savedLanguage.isoCode, savedLanguage.name)
    : savedIsoCode

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
      className="mx-auto -mt-4 w-full max-w-3xl border-t pt-6"
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
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="account-telegram-language">
                {t.languageLabel}
              </FieldLabel>
              <Select
                disabled={isPending}
                items={catalog.languages.map((language) => ({
                  label: getLanguageName(language.isoCode, language.name),
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
                  className="w-full"
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
                        {getLanguageName(language.isoCode, language.name)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {savedIsoCode === null
                  ? t.systemDefault
                  : formatMessage(t.savedLanguage, {
                      language: savedLanguageName ?? savedIsoCode,
                    })}
              </FieldDescription>
            </Field>
            <Button
              className="shrink-0"
              disabled={
                isPending ||
                !selectedIsoCode ||
                selectedIsoCode === savedIsoCode
              }
              type="submit"
            >
              {isPending ? (
                <Spinner aria-hidden="true" data-icon="inline-start" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              {isPending ? t.saving : t.saveLanguage}
            </Button>
          </div>

          {feedback === "success" ? (
            <p className="mt-3 text-sm text-foreground" role="status">
              {t.saveSuccess}
            </p>
          ) : null}
          {feedback === "error" ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {t.saveError}
            </p>
          ) : null}
          {isPending ? (
            <span className="sr-only" role="status">
              {t.saving}
            </span>
          ) : null}
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
