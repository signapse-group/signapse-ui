"use client"

import { ArrowLeft, Shield } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { groupPermissionsByResource } from "@/app/lib/roles/definitions"
import { LocalizedLink } from "@/components/localized-link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"

interface RoleDetailPageProps {
  role: RoleResponse
}

export function RoleDetailPage({ role }: RoleDetailPageProps) {
  const { dictionary } = useLocalization()
  const t = dictionary.roles
  const permissionGroups = groupPermissionsByResource(
    role.permissions,
    dictionary
  )

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

      <Card>
        <CardHeader>
          <h2 className="text-base leading-snug font-medium">
            {t.permissionsColumn}
          </h2>
        </CardHeader>
        <CardContent className="min-w-0">
          {permissionGroups.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-5">
              {permissionGroups.map((group, groupIndex) => (
                <section
                  key={group.key}
                  aria-labelledby={`role-permission-group-${groupIndex}`}
                  className="min-w-0"
                >
                  <h3
                    id={`role-permission-group-${groupIndex}`}
                    className="mb-2 text-sm font-medium text-muted-foreground"
                  >
                    {group.title}
                  </h3>
                  <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                    {group.permissions.map((permission) => (
                      <li
                        key={permission.key}
                        className="flex min-w-0 flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <span className="min-w-0 break-words">
                          {permission.name}
                        </span>
                        <code className="min-w-0 font-mono text-xs break-all text-muted-foreground sm:text-right">
                          {permission.key}
                        </code>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <Empty className="min-h-[160px] rounded-lg border border-dashed px-6 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Shield />
                </EmptyMedia>
                <EmptyTitle role="heading" aria-level={3}>
                  {t.emptyAssignedPermissionsTitle}
                </EmptyTitle>
                <EmptyDescription>
                  {t.emptyAssignedPermissionsDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
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
