export const ROLE_READ_PERMISSION = "role:read" as const
export const ROLE_CREATE_PERMISSION = "role:create" as const

export const ROLE_NAV_PERMISSIONS = [
  ROLE_READ_PERMISSION,
  ROLE_CREATE_PERMISSION,
] as const
