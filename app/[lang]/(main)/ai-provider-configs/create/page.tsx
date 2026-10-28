import { LocalizedLink as Link } from "@/components/localized-link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"

import { getServerDictionary } from "@/app/lib/i18n/server"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { AppFormShellSkeleton } from "@/components/app-form-shell"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { AiProviderConfigCreateForm } from "../ai-provider-config-create-form"

export default async function CreateAiProviderConfigPage() {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, AI_PROVIDER_CONFIG_PERMISSIONS.create)) {
    return (
      <>
        <h1 className="sr-only">{dictionary.aiProviderConfigs.createTitle}</h1>
        <AccessDenied
          description={dictionary.aiProviderConfigs.createDenied}
          permission={AI_PROVIDER_CONFIG_PERMISSIONS.create}
        />
      </>
    )
  }

  const backHref = hasPermission(
    permissions,
    AI_PROVIDER_CONFIG_PERMISSIONS.read
  )
    ? "/ai-provider-configs"
    : "/dashboard"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <Suspense
        fallback={
          <>
            <h1 className="sr-only">
              {dictionary.aiProviderConfigs.createTitle}
            </h1>
            <AiProviderConfigCreateSkeleton
              loadingLabel={dictionary.aiProviderConfigs.loadingCreate}
            />
          </>
        }
      >
        <AiProviderConfigCreateForm />
      </Suspense>
    </div>
  )
}

function AiProviderConfigCreateSkeleton({
  loadingLabel,
}: {
  loadingLabel: string
}) {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        {loadingLabel}
      </p>
      <AppFormShellSkeleton width="lg">
        <div className="flex flex-col gap-2 px-6 pt-6">
          <Skeleton className="h-6 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
          <Skeleton className="h-9 w-full sm:w-20" />
          <Skeleton className="h-9 w-full sm:w-32" />
        </div>
      </AppFormShellSkeleton>
    </div>
  )
}
