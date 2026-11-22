import { getPermissions, getRoles } from "@/app/api/roles/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"

import { RoleListPage } from "./role-list"

export default async function RolesPage() {
  const [currentPermissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(currentPermissions, "role:update")) {
    return (
      <>
        <h1 className="sr-only">{dictionary.navigation.roles}</h1>
        <AccessDenied
          title={dictionary.errors.accessDeniedTitle}
          description={dictionary.roles.accessDeniedDescription}
          permission="role:update"
        />
      </>
    )
  }

  const [roles, permissionCatalog] = await Promise.all([
    getRoles(),
    getPermissions(),
  ])

  return (
    <>
      <h1 className="sr-only">{dictionary.navigation.roles}</h1>
      <RoleListPage roles={roles} permissions={permissionCatalog} />
    </>
  )
}
