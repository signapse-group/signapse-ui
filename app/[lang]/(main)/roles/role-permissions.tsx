"use client"

import { Search, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDeferredValue, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { updateRolePermissions } from "@/app/api/roles/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  groupPermissionsByResource,
  type PermissionResponse,
  type RoleResponse,
} from "@/app/lib/roles/definitions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface RolePermissionsProps {
  role: RoleResponse
  permissionCatalog?: PermissionResponse[]
  canEditPermissions?: boolean
  permissionCatalogLoadFailed?: boolean
}

const EMPTY_PERMISSION_CATALOG: PermissionResponse[] = []

export function RolePermissions({
  role,
  permissionCatalog,
  canEditPermissions = false,
  permissionCatalogLoadFailed = false,
}: RolePermissionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.roles
  const initialPermissionKeys = Array.from(
    new Set(role.permissions.map(({ key }) => key))
  ).sort()
  const [draftPermissionKeys, setDraftPermissionKeys] = useState(
    initialPermissionKeys
  )
  const [savedPermissionKeys, setSavedPermissionKeys] = useState(
    initialPermissionKeys
  )

  const catalog = permissionCatalog ?? EMPTY_PERMISSION_CATALOG
  const catalogKeys = useMemo(
    () => new Set(catalog.map(({ key }) => key)),
    [catalog]
  )
  const hasUnknownAssignedPermissions =
    canEditPermissions &&
    role.permissions.some(({ key }) => !catalogKeys.has(key))
  const isEditable =
    canEditPermissions &&
    role.key !== "ADMIN" &&
    permissionCatalog !== undefined &&
    !hasUnknownAssignedPermissions
  const visiblePermissions = isEditable ? catalog : role.permissions
  const groups = useMemo(
    () => groupPermissionsByResource(visiblePermissions, dictionary),
    [dictionary, visiblePermissions]
  )
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          permissions: group.permissions.filter((permission) => {
            if (!normalizedQuery) return true
            return [permission.name, permission.key, permission.description]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          }),
        }))
        .filter((group) => group.permissions.length > 0),
    [groups, normalizedQuery]
  )
  const groupsToRender = isEditable ? filteredGroups : groups
  const draftKeys = useMemo(
    () => new Set(draftPermissionKeys),
    [draftPermissionKeys]
  )
  const isDirty = !sameKeys(draftPermissionKeys, savedPermissionKeys)

  const updateSelection = (permissionKeys: string[], checked: boolean) => {
    setDraftPermissionKeys((current) => {
      const next = new Set(current)
      for (const key of permissionKeys) {
        if (checked) next.add(key)
        else next.delete(key)
      }
      return Array.from(next).sort()
    })
  }

  const handleSave = () => {
    if (!isEditable || isPending || !isDirty) return

    const permissionKeys = Array.from(new Set(draftPermissionKeys)).sort()
    startTransition(async () => {
      const result = await updateRolePermissions(role.key, { permissionKeys })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setDraftPermissionKeys(permissionKeys)
      setSavedPermissionKeys(permissionKeys)
      toast.success(formatMessage(t.updateSuccess, { role: role.name }))
      router.refresh()
    })
  }

  const emptyTitle = normalizedQuery
    ? t.noMatchesTitle
    : isEditable
      ? t.emptyPermissionsTitle
      : t.emptyAssignedPermissionsTitle
  const emptyDescription = normalizedQuery
    ? t.noMatchesDescription
    : isEditable
      ? t.emptyPermissionsDescription
      : t.emptyAssignedPermissionsDescription

  return (
    <Card className={cn("gap-0 py-0", isEditable && "overflow-visible")}>
      <CardHeader
        className={cn(
          "gap-3 border-b px-4 py-4 sm:px-6",
          isEditable && "sticky top-0 z-20 bg-card shadow-sm"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base leading-snug font-medium">
            {t.permissionsColumn}
          </h2>
          {isEditable ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isDirty || isPending}
                onClick={() => setDraftPermissionKeys(savedPermissionKeys)}
              >
                {t.reset}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!isDirty || isPending}
                onClick={handleSave}
              >
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {t.savePermissions}
              </Button>
            </div>
          ) : (
            <Badge variant="outline">{t.readOnly}</Badge>
          )}
        </div>
        {isEditable ? (
          <p className="text-sm text-muted-foreground">
            {t.permissionImpactDescription}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="grid min-w-0 gap-4 py-4">
        {permissionCatalogLoadFailed ? (
          <p role="alert" className="text-sm text-destructive">
            {t.permissionCatalogLoadError}
          </p>
        ) : null}
        {hasUnknownAssignedPermissions ? (
          <p role="alert" className="text-sm text-destructive">
            {t.permissionCatalogMismatch}
          </p>
        ) : null}

        {isEditable ? (
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label={t.searchLabel}
              placeholder={t.searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : null}

        {groupsToRender.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-4">
            {groupsToRender.map((group) => {
              const groupId = `role-permission-group-${encodeURIComponent(group.key)}`
              const selectedCount = group.permissions.filter(({ key }) =>
                draftKeys.has(key)
              ).length
              const allSelected = selectedCount === group.permissions.length

              return (
                <section
                  key={group.key}
                  aria-labelledby={groupId}
                  className="min-w-0"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 id={groupId} className="text-sm font-medium">
                        {group.title}
                      </h3>
                      {isEditable ? (
                        <span className="text-xs text-muted-foreground">
                          {formatMessage(t.selectedInGroup, {
                            selected: formatNumber(selectedCount),
                            total: formatNumber(group.permissions.length),
                          })}
                        </span>
                      ) : null}
                    </div>
                    {isEditable ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="scroll-mt-36"
                          disabled={allSelected || isPending}
                          onClick={() =>
                            updateSelection(
                              group.permissions.map(({ key }) => key),
                              true
                            )
                          }
                        >
                          {t.selectAll}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="scroll-mt-36"
                          disabled={selectedCount === 0 || isPending}
                          onClick={() =>
                            updateSelection(
                              group.permissions.map(({ key }) => key),
                              false
                            )
                          }
                        >
                          {t.deselectAll}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                    {group.permissions.map((permission) => (
                      <li
                        key={permission.key}
                        className="flex min-w-0 items-center gap-3 px-3 py-3"
                      >
                        <span className="min-w-0 flex-1 break-words">
                          {permission.name}
                        </span>
                        <code className="max-w-[45%] min-w-0 font-mono text-xs break-all text-muted-foreground sm:max-w-none">
                          {permission.key}
                        </code>
                        {isEditable ? (
                          <Switch
                            checked={draftKeys.has(permission.key)}
                            onCheckedChange={(checked) =>
                              updateSelection([permission.key], checked)
                            }
                            aria-label={formatMessage(t.togglePermission, {
                              permission: permission.name,
                            })}
                            disabled={isPending}
                            className="scroll-mt-36"
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        ) : (
          <Empty className="min-h-[160px] rounded-lg border border-dashed px-6 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shield />
              </EmptyMedia>
              <EmptyTitle role="heading" aria-level={3}>
                {emptyTitle}
              </EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function sameKeys(left: string[], right: string[]) {
  if (left.length !== right.length) return false

  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.every((key, index) => key === sortedRight[index])
}
