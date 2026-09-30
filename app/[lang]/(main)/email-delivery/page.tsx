import { Suspense } from "react"

import { getSmtpConfiguration } from "@/app/api/smtp-configuration/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import {
  SMTP_CONFIGURATION_MANAGE_PERMISSION,
  SMTP_CONFIGURATION_READ_PERMISSION,
} from "@/app/lib/smtp-configuration/permissions"
import { AccessDenied } from "@/components/access-denied"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { SmtpConfigurationForm } from "./smtp-configuration-form"

export default async function EmailDeliveryPage() {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, SMTP_CONFIGURATION_READ_PERMISSION)) {
    return (
      <AccessDenied
        description={dictionary.smtpConfiguration.readDenied}
        permission={SMTP_CONFIGURATION_READ_PERMISSION}
      />
    )
  }

  const canManage = hasPermission(
    permissions,
    SMTP_CONFIGURATION_MANAGE_PERMISSION
  )

  return (
    <Suspense fallback={<EmailDeliverySkeleton dictionary={dictionary} />}>
      <EmailDeliveryContent canManage={canManage} />
    </Suspense>
  )
}

async function EmailDeliveryContent({ canManage }: { canManage: boolean }) {
  const configuration = await getSmtpConfiguration()

  return (
    <SmtpConfigurationForm
      configuration={configuration}
      canManage={canManage}
    />
  )
}

function EmailDeliverySkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.smtpConfiguration.pageTitle}
        </h1>
        <Skeleton className="h-5 w-80 max-w-full" />
      </header>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(19rem,0.9fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex min-w-0 flex-col gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-48 max-w-full" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
