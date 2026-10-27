"use client"

import {
  Bot,
  Clock3,
  Edit2,
  KeyRound,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  deleteAiProviderConfig,
  setAiProviderConfigDefault,
} from "@/app/api/ai-provider-configs/action"
import { AiProviderConfigListResponse } from "@/app/lib/ai-provider-configs/definitions"
import { Page } from "@/app/lib/definitions"
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
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { useHasPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getProviderOptionLabel } from "./ai-provider-config-shared"

interface AiProviderConfigListProps {
  providerPage: Page<AiProviderConfigListResponse>
}

const COMPACT_DATE_TIME_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions

export function AiProviderConfigListPage({
  providerPage,
}: AiProviderConfigListProps) {
  const providers = providerPage?.content || []
  const canCreateProvider = useHasPermission("ai-provider-config:create")
  const canUpdateProvider = useHasPermission("ai-provider-config:update")
  const canDeleteProvider = useHasPermission("ai-provider-config:delete")
  const canSetDefaultProvider = useHasPermission(
    "ai-provider-config:set-default"
  )
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiProviderConfigs
  const formatCount = (value: number) => formatNumber(value)

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
              {t.addConfig}
            </Link>
          ) : null}
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            label={t.sortLabel}
            options={[
              { label: t.newest, value: "id_desc" },
              { label: t.oldest, value: "id_asc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[34%]">
                {t.providerColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[30%]">
                {t.credentialColumn}
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                {t.defaultColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {t.createdColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-right">
                {t.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {providers.length > 0 ? (
              providers.map((provider) => {
                const providerLabel = getProviderOptionLabel(
                  provider.providerType,
                  dictionary
                )

                return (
                  <TableRow
                    key={provider.id}
                    className="border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/ai-provider-configs/${provider.id}`}
                          className="line-clamp-1 font-medium break-words text-foreground hover:underline"
                        >
                          {providerLabel}
                        </Link>
                        {provider.description ? (
                          <span className="line-clamp-1 text-xs break-words text-muted-foreground">
                            {provider.description}
                          </span>
                        ) : null}
                        {provider.baseUrl ? (
                          <span className="line-clamp-1 text-xs break-all text-muted-foreground">
                            {provider.baseUrl}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <KeyRound
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {formatMessage(t.credentialCount, {
                            count: formatCount(
                              provider.credentials?.length || 0
                            ),
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[30%] max-w-[20rem] align-top whitespace-normal">
                      <CredentialSummary provider={provider} />
                    </TableCell>
                    <TableCell className="w-36 text-center">
                      {canSetDefaultProvider ? (
                        <SetDefaultButton provider={provider} />
                      ) : null}
                    </TableCell>
                    <TableCell className="w-40">
                      <CreatedTime value={provider.createdDate} />
                    </TableCell>
                    <TableCell className="w-28">
                      <div className="flex justify-end gap-1">
                        {canUpdateProvider ? (
                          <Link
                            href={`/ai-provider-configs/${provider.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon",
                              className:
                                "h-8 w-8 text-muted-foreground hover:text-foreground",
                            })}
                          >
                            <Edit2 />
                            <span className="sr-only">{t.editConfig}</span>
                          </Link>
                        ) : null}
                        {canDeleteProvider ? (
                          <DeleteProviderButton provider={provider} />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <AppListTableEmptyState colSpan={5}>
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
      </AppListTable>

      <AppPaginationControls page={providerPage} className="mt-4" />
    </div>
  )
}

function CredentialSummary({
  provider,
}: {
  provider: AiProviderConfigListResponse
}) {
  const credentials = provider.credentials || []
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const t = dictionary.aiProviderConfigs
  const formatCount = (value: number) => formatNumber(value)

  if (credentials.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">{t.noCredentials}</span>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {credentials.slice(0, 2).map((credential) => (
        <div key={credential.id} className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-foreground">
            {credential.model || t.noModel}
          </span>
          {credential.keyPreview ? (
            <Badge variant="secondary" className="w-fit max-w-full truncate">
              {credential.keyPreview}
            </Badge>
          ) : null}
        </div>
      ))}
      {credentials.length > 2 ? (
        <span className="text-xs text-muted-foreground">
          {formatMessage(t.moreCredentials, {
            count: formatCount(credentials.length - 2),
          })}
        </span>
      ) : null}
    </div>
  )
}

function CreatedTime({ value }: { value?: string }) {
  const { dictionary, formatDateTime } = useLocalization()
  const formatted = formatDateTime(value, COMPACT_DATE_TIME_OPTIONS, "")

  if (!formatted) {
    return (
      <span className="text-xs text-muted-foreground">
        {dictionary.aiProviderConfigs.noCreatedDate}
      </span>
    )
  }

  return <AppTimeMetadata icon={Clock3}>{formatted}</AppTimeMetadata>
}

function SetDefaultButton({
  provider,
}: {
  provider: AiProviderConfigListResponse
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { dictionary } = useLocalization()
  const t = dictionary.aiProviderConfigs

  const handleSetDefault = () => {
    if (provider.defaultProvider) return

    startTransition(async () => {
      const result = await setAiProviderConfigDefault(provider.id)
      if (result.success) {
        toast.success(t.setDefaultSuccess)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (provider.defaultProvider) {
    return (
      <Badge className="gap-1">
        <ShieldCheck data-icon="inline-start" />
        {t.defaultBadge}
      </Badge>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSetDefault}
      disabled={isPending}
      className="h-8"
    >
      {isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Star data-icon="inline-start" />
      )}
      {t.setDefault}
    </Button>
  )
}

function DeleteProviderButton({
  provider,
}: {
  provider: AiProviderConfigListResponse
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.aiProviderConfigs
  const providerLabel = getProviderOptionLabel(
    provider.providerType,
    dictionary
  )

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAiProviderConfig(provider.id)
      if (result.success) {
        toast.success(
          formatMessage(t.deleteConfigSuccess, { provider: providerLabel })
        )
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 />
        <span className="sr-only">{t.deleteConfig}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteConfigTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {formatMessage(t.deleteConfigDescription, {
              provider: providerLabel,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Spinner className="size-4" />
                {t.deleteConfigPending}
              </>
            ) : (
              t.deleteConfig
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
