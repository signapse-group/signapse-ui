"use client"

import { ArrowLeft, KeyRound } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"

import type { AiProviderConfigDetailResponse } from "@/app/lib/ai-provider-configs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { getProviderOptionLabel } from "./ai-provider-config-shared"

export function AiProviderConfigDetail({
  provider,
}: {
  provider: AiProviderConfigDetailResponse
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiProviderConfigs
  const providerLabel = getProviderOptionLabel(
    provider.providerType,
    dictionary
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/ai-provider-configs"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <section className="w-full rounded-xl border bg-card p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {providerLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatMessage(t.connectionIdentifier, {
              id: formatNumber(provider.id),
            })}
          </p>
          {provider.description ? (
            <p className="mt-2 text-sm leading-6">{provider.description}</p>
          ) : null}
        </header>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-sm font-medium">{t.endpointColumn}</dt>
            <dd className="mt-1 text-sm break-all text-muted-foreground">
              {provider.baseUrl ||
                formatMessage(t.defaultEndpointForProvider, {
                  provider: providerLabel,
                })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">{t.usedByColumn}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              {formatMessage(
                provider.taskReferences.length === 1
                  ? t.taskReferenceCountOne
                  : t.taskReferenceCount,
                { count: formatNumber(provider.taskReferences.length) }
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t pt-5">
          <h2 className="text-sm font-medium">{t.apiKeysColumn}</h2>
          {provider.credentials.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {provider.credentials.map((credential) => (
                <li key={credential.id}>
                  <Badge
                    variant="secondary"
                    className="max-w-full truncate font-mono text-xs"
                  >
                    <KeyRound aria-hidden="true" />
                    {credential.keyPreview}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t.noKeys}</p>
          )}
        </div>
      </section>
    </div>
  )
}
