"use client"

import { ArrowLeft } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import type {
  PermissionResponse,
  RoleResponse,
} from "@/app/lib/roles/definitions"
import { LocalizedLink } from "@/components/localized-link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { RolePermissions } from "./role-permissions"

interface RoleDetailPageProps {
  role: RoleResponse
  permissionCatalog?: PermissionResponse[]
  canEditPermissions?: boolean
  permissionCatalogLoadFailed?: boolean
}

export function RoleDetailPage({
  role,
  permissionCatalog,
  canEditPermissions,
  permissionCatalogLoadFailed,
}: RoleDetailPageProps) {
  const { dictionary } = useLocalization()
  const t = dictionary.roles

  return (
    <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-5">
      <LocalizedLink
        href="/roles"
        className={`${buttonVariants({ variant: "secondary", size: "sm" })} self-start`}
      >
        <ArrowLeft data-icon="inline-start" />
        {dictionary.common.back}
      </LocalizedLink>

      <h1 className="text-2xl font-semibold tracking-tight break-words">
        {role.name}
      </h1>

      <Card>
        <CardHeader>
          <h2 className="text-base leading-snug font-medium">
            {t.roleInformation}
          </h2>
        </CardHeader>
        <CardContent>
          <dl className="grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-1.5">
              <dt className="text-sm font-medium text-muted-foreground">
                {t.roleKeyLabel}
              </dt>
              <dd>
                <Badge
                  variant="secondary"
                  className="max-w-full font-mono text-xs break-all whitespace-normal"
                >
                  {role.key}
                </Badge>
              </dd>
            </div>
            <RoleInformationField
              label={t.displayNameLabel}
              value={role.name}
            />
            <RoleInformationField
              label={t.descriptionLabel}
              value={role.description || t.noDescription}
            />
          </dl>
        </CardContent>
      </Card>

      <RolePermissions
        key={role.key}
        role={role}
        permissionCatalog={permissionCatalog}
        canEditPermissions={canEditPermissions}
        permissionCatalogLoadFailed={permissionCatalogLoadFailed}
      />
    </div>
  )
}

function RoleInformationField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words whitespace-pre-wrap">{value}</dd>
    </div>
  )
}
