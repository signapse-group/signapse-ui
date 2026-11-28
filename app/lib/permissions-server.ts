import { cache } from "react"

import { getMe } from "@/app/api/user/action"
import {
  getDevAuthPermissions,
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
} from "@/app/lib/dev-auth-mode"
import { hasPermission } from "@/app/lib/permissions"

const getCurrentMe = cache(async () => {
  if (isDevAuthModeEnabled() && !isP0FixtureModeEnabled()) {
    return null
  }

  try {
    return await getMe()
  } catch {
    return null
  }
})

export const getCurrentWorkspaceSummary = cache(async () => {
  const me = await getCurrentMe()
  return me?.currentWorkspace ?? null
})

export const getCurrentWorkspaceId = cache(async (): Promise<number | null> => {
  const workspace = await getCurrentWorkspaceSummary()
  return workspace?.id ?? null
})

export const getCurrentPermissions = cache(async (): Promise<string[]> => {
  if (isDevAuthModeEnabled()) {
    if (isP0FixtureModeEnabled()) {
      const me = await getCurrentMe()
      return me?.permissions ?? []
    }
    return getDevAuthPermissions()
  }

  const me = await getCurrentMe()
  return me?.permissions ?? []
})

export async function userHasPermission(permission: string): Promise<boolean> {
  const permissions = await getCurrentPermissions()
  return hasPermission(permissions, permission)
}
