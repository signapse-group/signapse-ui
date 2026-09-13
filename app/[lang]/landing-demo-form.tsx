"use client"

import { useState, type FormEvent } from "react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRightIcon } from "lucide-react"

type LandingDemoFormProps = {
  email: string
  labels: Dictionary["landing"]["finalCta"]
}

export function LandingDemoForm({ email, labels }: LandingDemoFormProps) {
  const [need, setNeed] = useState(labels.needMarketIntelligence)
  const [status, setStatus] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const workEmail = String(data.get("email") ?? "").trim()
    const subject = encodeURIComponent(labels.emailSubject)
    const body = encodeURIComponent(
      `${labels.nameLabel}: ${name}\n${labels.emailLabel}: ${workEmail}\n${labels.needLabel}: ${need}`
    )

    setStatus(labels.preparingEmail)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{labels.submit}</CardTitle>
          <CardDescription>{labels.formNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="landing-demo-name">
                {labels.nameLabel}
              </FieldLabel>
              <Input
                id="landing-demo-name"
                name="name"
                autoComplete="name"
                placeholder={labels.namePlaceholder}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="landing-demo-email">
                {labels.emailLabel}
              </FieldLabel>
              <Input
                id="landing-demo-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={labels.emailPlaceholder}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="landing-demo-need">
                {labels.needLabel}
              </FieldLabel>
              <Select
                value={need}
                onValueChange={(value) => setNeed(value ?? need)}
              >
                <SelectTrigger id="landing-demo-need" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[
                      labels.needMarketIntelligence,
                      labels.needTelegram,
                      labels.needStrategy,
                      labels.needAutomation,
                      labels.needTeam,
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button type="submit" size="lg" className="w-full">
            {labels.submit}
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
          <p
            aria-live="polite"
            className="min-h-5 text-sm text-muted-foreground"
          >
            {status}
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
