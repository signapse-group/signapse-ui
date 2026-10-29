import { auth, currentUser } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import type { ReactNode } from "react"

import { getMyWorkspaces } from "@/app/api/workspaces/action"
import {
  getDevAuthUser,
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
} from "@/app/lib/dev-auth-mode"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { PERSONAL_NOTE_READ_PERMISSION } from "@/app/lib/personal-notes/permissions"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { resolveActiveWorkspace } from "@/app/lib/workspaces/active"
import { WorkspaceResponse } from "@/app/lib/workspaces/definitions"
import { AppBreadcrumb } from "@/components/app-breadcrumbs"
import { AppSidebar } from "@/components/app-sidebar"
import { LanguageSelector } from "@/components/language-selector"
import { ModeToggle } from "@/components/mode-toggle"
import { PermissionProvider } from "@/components/permission-provider"
import { PersonalNotesQuickSheet } from "@/components/personal-notes-quick-sheet"
import { ProtectedAiAssistant } from "@/components/protected-ai-assistant"
import { AiProviderConfigDraftProvider } from "./ai-provider-configs/ai-provider-config-draft-provider"
import { SystemPromptDraftProvider } from "./system-prompts/system-prompt-draft-provider"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { Separator } from "@/components/ui/separator"

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const devAuthMode = isDevAuthModeEnabled()
  const p0FixtureMode = isP0FixtureModeEnabled()
  const { isAuthenticated } = devAuthMode
    ? { isAuthenticated: true }
    : await auth()
  const dictionary = await getServerDictionary()

  if (!isAuthenticated) {
    return <div>{dictionary.auth.signInRequired}</div>
  }

  const user = devAuthMode ? null : await currentUser()
  const simpleUser = devAuthMode
    ? getDevAuthUser()
    : user
      ? {
          imageUrl: user.imageUrl,
          fullName: user.fullName,
          username: user.username,
        }
      : null

  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState === undefined || sidebarState === "true"
  const permissions = await getCurrentPermissions()
  const canReadWorkspace = hasPermission(permissions, "workspace:read")
  const canReadNotes = hasPermission(permissions, PERSONAL_NOTE_READ_PERMISSION)
  let workspaces: WorkspaceResponse[] = []

  if (canReadWorkspace) {
    try {
      const workspacePage = await getMyWorkspaces({
        filter: "",
        page: 0,
        size: 100,
        sort: [{ field: "id", direction: "asc" }],
      })
      workspaces = workspacePage.content ?? []
    } catch {
      workspaces = []
    }
  }

  const currentWorkspace = resolveActiveWorkspace(workspaces)
  const assistantDisplayName =
    simpleUser?.fullName ?? simpleUser?.username ?? null

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <PermissionProvider permissions={permissions}>
        <AppSidebar
          user={simpleUser}
          isAuthenticated={isAuthenticated}
          permissions={permissions}
          isP0FixtureMode={p0FixtureMode}
        />
        <SidebarInset className="min-w-0">
          <header className="flex min-h-12 shrink-0 items-center border-b px-2 py-2 transition-[width,height] ease-linear">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger
                  aria-label={dictionary.navigation.toggleSidebar}
                />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-8"
                />
                <AppBreadcrumb />
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2 md:justify-end">
                {canReadWorkspace ? (
                  <WorkspaceSwitcher
                    workspaces={workspaces}
                    currentWorkspace={currentWorkspace}
                    canCreateWorkspace={hasPermission(
                      permissions,
                      "workspace:create"
                    )}
                    canRenameWorkspace={hasPermission(
                      permissions,
                      "workspace:update"
                    )}
                    canSetCurrentWorkspace={hasPermission(
                      permissions,
                      "workspace:set-current"
                    )}
                    canReadAsset={hasPermission(permissions, "asset:read")}
                    canReadWatchlist={hasPermission(
                      permissions,
                      "watchlist:read"
                    )}
                    canCreateWatchlist={hasPermission(
                      permissions,
                      "watchlist:create"
                    )}
                    canDeleteWatchlist={hasPermission(
                      permissions,
                      "watchlist:delete"
                    )}
                    className="min-w-0 flex-1 md:flex-none"
                  />
                ) : null}
                {canReadNotes ? <PersonalNotesQuickSheet /> : null}
                <LanguageSelector />
                <ModeToggle />
              </div>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
            <SystemPromptDraftProvider>
              <AiProviderConfigDraftProvider>
                {children}
              </AiProviderConfigDraftProvider>
            </SystemPromptDraftProvider>
          </div>
        </SidebarInset>
        <ProtectedAiAssistant
          displayName={assistantDisplayName}
          workspaceId={currentWorkspace?.id ?? null}
        />
      </PermissionProvider>
    </SidebarProvider>
  )
}
