"use client"

import { ArrowRight, Bot, Plus } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"

import type {
  AiProviderConfigListItem,
  AiProviderConfigListResponse,
} from "@/app/lib/ai-provider-configs/definitions"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { AI_TASK_CONFIGURATION_READ_PERMISSION } from "@/app/lib/ai-task-configurations/definitions"
import type { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import {
  AppListToolbar,
  AppListToolbarLeading,
} from "@/components/app-list-toolbar"
import { useHasPermission } from "@/components/permission-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getProviderOptionLabel } from "./ai-provider-config-shared"

interface AiProviderConfigListProps {
  providerPage: Page<AiProviderConfigListItem>
}

export function AiProviderConfigListPage({
  providerPage,
}: AiProviderConfigListProps) {
  const providers = providerPage.content
  const canCreateProvider = useHasPermission(
    AI_PROVIDER_CONFIG_PERMISSIONS.create
  )
  const canReadTaskConfigurations = useHasPermission(
    AI_TASK_CONFIGURATION_READ_PERMISSION
  )
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiProviderConfigs

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          {canCreateProvider ? (
            <Link
              href="/ai-provider-configs/create"
              className={buttonVariants()}
            >
              <Plus data-icon="inline-start" />
              {t.addConnection}
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {formatMessage(
              providerPage.totalElements === 1
                ? t.connectionCountOne
                : t.connectionCount,
              {
                count: formatNumber(providerPage.totalElements),
              }
            )}
          </span>
        </AppListToolbarLeading>
      </AppListToolbar>

      <AppListTable>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-[30%] min-w-52">
                  {t.connectionColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[27%] min-w-52">
                  {t.endpointColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[28%] min-w-52">
                  {t.apiKeysColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[15%] min-w-32">
                  {t.usedByColumn}
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {providers.length > 0 ? (
                providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/ai-provider-configs/${provider.id}`}
                          className="flex w-fit max-w-full flex-wrap items-baseline gap-x-1 break-words text-foreground hover:underline"
                        >
                          <span className="font-medium">
                            {getProviderOptionLabel(
                              provider.providerType,
                              dictionary
                            )}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            ·
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessage(t.connectionNumber, {
                              id: formatNumber(provider.id),
                            })}
                          </span>
                        </Link>
                        {provider.description ? (
                          <span className="line-clamp-2 text-sm text-muted-foreground">
                            {provider.description}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {t.providerEndpoint}
                        </span>
                        {provider.baseUrl ? (
                          <span className="text-sm break-all">
                            {provider.baseUrl}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {formatMessage(t.defaultEndpointForProvider, {
                              provider: getProviderOptionLabel(
                                provider.providerType,
                                dictionary
                              ),
                            })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <CredentialPreviews provider={provider} />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      {provider.taskReferencesStatus === "unavailable" ? (
                        <span className="text-sm text-muted-foreground">
                          {t.referencesLoadError}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {formatMessage(
                              provider.taskReferences.length === 1
                                ? t.taskReferenceCountOne
                                : t.taskReferenceCount,
                              {
                                count: formatNumber(
                                  provider.taskReferences.length
                                ),
                              }
                            )}
                          </span>
                          {provider.taskReferences.length > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {t.moveTasksBeforeDelete}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <AppListTableEmptyState colSpan={4}>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Bot />
                    </EmptyMedia>
                    <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{t.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </AppListTableEmptyState>
              )}
            </TableBody>
          </Table>
        </div>
      </AppListTable>

      <AppPaginationControls page={providerPage} className="mt-4" />

      {providers.length > 0 ? (
        <>
          <section className="mt-6 rounded-xl border bg-muted/20 px-4 py-3">
            <h2 className="text-sm font-medium">
              {t.modelsBelongToTasksTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t.modelsBelongToTasksDescription}
            </p>
          </section>
          {canReadTaskConfigurations ? (
            <Link
              href="/ai-task-configurations"
              className={`${buttonVariants({ variant: "secondary" })} mt-6`}
            >
              <ArrowRight data-icon="inline-start" />
              {t.openTaskConfiguration}
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function CredentialPreviews({
  provider,
}: {
  provider: AiProviderConfigListResponse
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiProviderConfigs
  const credentials = provider.credentials

  if (credentials.length === 0) {
    return <span className="text-sm text-muted-foreground">{t.noKeys}</span>
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm">
        {formatMessage(
          credentials.length === 1 ? t.apiKeyCountOne : t.apiKeyCount,
          { count: formatNumber(credentials.length) }
        )}
      </span>
      <ul className="flex min-w-0 flex-col gap-1">
        {credentials.map((credential) => (
          <li
            key={credential.id}
            className="max-w-full truncate font-mono text-xs text-muted-foreground"
          >
            {credential.keyPreview}
          </li>
        ))}
      </ul>
    </div>
  )
}
