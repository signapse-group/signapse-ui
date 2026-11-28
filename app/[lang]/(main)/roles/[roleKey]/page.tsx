import { notFound } from "next/navigation"

import { getRoleByKey } from "@/app/api/roles/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { ROLE_READ_PERMISSION } from "@/app/lib/roles/permissions"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { AccessDenied } from "@/components/access-denied"

import { RoleDetailPage } from "../role-detail"

interface RoleDetailRouteProps {
  params: Promise<{ roleKey: string }>
}

export default async function RoleDetailRoute({
  params,
}: RoleDetailRouteProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  const accessDenied = (
    <div className="mx-auto w-full max-w-2xl">
      <AccessDenied
        heading={dictionary.roles.pageTitle}
        title={dictionary.errors.accessDeniedTitle}
        description={dictionary.roles.accessDeniedDescription}
        permission={ROLE_READ_PERMISSION}
      />
    </div>
  )

  if (!hasPermission(permissions, ROLE_READ_PERMISSION)) {
    return accessDenied
  }

  const { roleKey } = await params
  if (!roleKey.trim()) {
    notFound()
  }

  let role: RoleResponse
  try {
    role = await getRoleByKey(roleKey)
  } catch (error) {
    const status =
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined

    if (status === 404) {
      notFound()
    }

    if (status === 403) {
      return accessDenied
    }

    throw error
  }

  return <RoleDetailPage role={role} />
}
