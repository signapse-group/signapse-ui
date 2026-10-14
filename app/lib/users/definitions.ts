import type { Page } from "@/app/lib/definitions"
import type { LanguageResponse } from "@/app/lib/languages/definitions"
import type { PermissionResponse } from "@/app/lib/roles/definitions"

export interface BackendWorkspaceSummary {
  id: number
  name: string
}

export interface BackendMediaResponse {
  id: number
  name: string
  altText?: string
  urlOriginal: string
  urlLarge?: string
  urlMedium?: string
  urlThumbnail?: string
  size?: number
}

export interface UpdateUserProfileRequest {
  firstName: string
  lastName: string
  birthday: string
  phone: string
}

export interface UserResponse {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | number | null
  birthday: string | number | null
  currentWorkspace: BackendWorkspaceSummary | null
  preferredLanguage: LanguageResponse | null
  mainImage: BackendMediaResponse | null
  role_name: string | null
  permissions: PermissionResponse[]
}

export type UserSearchResponse = UserResponse[] | Page<UserResponse>

export interface UpdateManagedUserRequest {
  firstName: string
  lastName: string
  phone?: string
  birthday?: string
  roleId: number
}

export interface BackendMeResponse {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  birthday?: string | null
  birthDay?: string | null
  dateOfBirth?: string | null
  phone?: string | number | null
  phoneNumber?: string | number | null
  mobilePhone?: string | number | null
  role_name: string | null
  currentWorkspace: BackendWorkspaceSummary | null
  preferredLanguage: LanguageResponse | null
  mainImage: BackendMediaResponse | null
  permissions: string[]
}
