import {
  hasAnyPermission,
  type PermissionCollection,
} from "@/app/lib/permissions"

export const NEWS_ARTICLE_READ_PERMISSIONS = ["news-article:read"] as const

export const NEWS_ARTICLE_ANALYZE_PERMISSIONS = [
  "news-article:analyze",
] as const

export const NEWS_ARTICLE_UPDATE_PERMISSIONS = ["news-article:update"] as const

export const NEWS_ARTICLE_DELETE_PERMISSIONS = ["news-article:delete"] as const

export const NEWS_ARTICLE_NAV_PERMISSIONS = NEWS_ARTICLE_READ_PERMISSIONS

export function canReadNewsArticles(
  permissions: PermissionCollection
): boolean {
  return hasAnyPermission(permissions, NEWS_ARTICLE_READ_PERMISSIONS)
}

export function canAnalyzeNewsArticles(
  permissions: PermissionCollection
): boolean {
  return hasAnyPermission(permissions, NEWS_ARTICLE_ANALYZE_PERMISSIONS)
}

export function canUpdateNewsArticles(
  permissions: PermissionCollection
): boolean {
  return hasAnyPermission(permissions, NEWS_ARTICLE_UPDATE_PERMISSIONS)
}

export function canDeleteNewsArticles(
  permissions: PermissionCollection
): boolean {
  return hasAnyPermission(permissions, NEWS_ARTICLE_DELETE_PERMISSIONS)
}
