import { Suspense } from "react"
import { notFound } from "next/navigation"

import { getAiProviderConfigById } from "@/app/api/ai-provider-configs/action"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { Skeleton } from "@/components/ui/skeleton"

import { AiProviderConfigDetail } from "../ai-provider-config-detail"

interface AiProviderConfigDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AiProviderConfigDetailPage({
  params,
}: AiProviderConfigDetailPageProps) {
  const [permissions, dictionary, { id }] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
    params,
  ])

  if (!hasPermission(permissions, AI_PROVIDER_CONFIG_PERMISSIONS.read)) {
    return (
      <>
        <h1 className="sr-only">{dictionary.navigation.aiProviders}</h1>
        <AccessDenied
          description={dictionary.aiProviderConfigs.readDenied}
          permission={AI_PROVIDER_CONFIG_PERMISSIONS.read}
        />
      </>
    )
  }

  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <AiProviderConfigDetailSkeleton
          loadingLabel={dictionary.aiProviderConfigs.loadingDetail}
        />
      }
    >
      <AiProviderConfigDetailContent id={numericId} />
    </Suspense>
  )
}

async function AiProviderConfigDetailContent({ id }: { id: number }) {
  const providerConfig = await getAiProviderConfigById(id)
  return <AiProviderConfigDetail provider={providerConfig} />
}

function AiProviderConfigDetailSkeleton({
  loadingLabel,
}: {
  loadingLabel: string
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <h1 aria-live="polite" className="sr-only">
        {loadingLabel}
      </h1>
      <div className="flex items-center">
        <Skeleton className="h-9 w-20" />
      </div>
      <section className="w-full rounded-xl border bg-card p-6">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </header>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-6 border-t pt-5">
          <Skeleton className="h-4 w-20" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </section>
    </div>
  )
}
