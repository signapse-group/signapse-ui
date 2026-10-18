"use client"

import {
  Clock3,
  Edit2,
  ExternalLink,
  Globe,
  Newspaper,
  Plus,
  Rss,
  Trash2,
} from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  deleteNewsOutlet,
  toggleNewsOutletActive,
} from "@/app/api/news-outlets/action"
import { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { NewsOutletListResponse } from "@/app/lib/news-outlets/definitions"
import {
  NEWS_OUTLET_CREATE_PERMISSION,
  NEWS_OUTLET_DELETE_PERMISSION,
  NEWS_OUTLET_UPDATE_PERMISSION,
} from "@/app/lib/news-outlets/permissions"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
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
import { Button, buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"
import { cn } from "@/lib/utils"

import { NewsOutletSearch } from "./news-outlet-search"

interface NewsOutletListProps {
  newsOutletPage: Page<NewsOutletListResponse>
}

function formatUrlIdentity(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    const pathParts = url.pathname.split("/").filter(Boolean)

    if (pathParts.length === 0) {
      return host
    }

    const compactPath = pathParts.slice(0, 2).join("/")
    const suffix = pathParts.length > 2 ? "/..." : ""

    return `${host}/${compactPath}${suffix}`
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }
}

export function NewsOutletListPage({ newsOutletPage }: NewsOutletListProps) {
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const newsOutlets = newsOutletPage.content ?? []
  const canCreateNewsOutlet = useHasPermission(NEWS_OUTLET_CREATE_PERMISSION)
  const canUpdateNewsOutlet = useHasPermission(NEWS_OUTLET_UPDATE_PERMISSION)
  const canDeleteNewsOutlet = useHasPermission(NEWS_OUTLET_DELETE_PERMISSION)

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          {canCreateNewsOutlet ? (
            <Link href="/news-outlets/create" className={buttonVariants()}>
              <Plus data-icon="inline-start" />
              {dictionary.newsOutlets.createAction}
            </Link>
          ) : null}
          <NewsOutletSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            defaultValue="id_desc"
            options={[
              { label: dictionary.newsOutlets.newest, value: "id_desc" },
              { label: dictionary.newsOutlets.oldest, value: "id_asc" },
              { label: dictionary.newsOutlets.nameAsc, value: "name_asc" },
              { label: dictionary.newsOutlets.nameDesc, value: "name_desc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[58%]">
                {dictionary.newsOutlets.sourceColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {dictionary.newsOutlets.createdColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                {dictionary.newsOutlets.activeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-center">
                {dictionary.newsOutlets.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {newsOutlets.length > 0 ? (
              newsOutlets.map((newsOutlet) => (
                <TableRow
                  key={newsOutlet.id}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top font-medium whitespace-normal text-foreground">
                    <div className="flex min-w-0 flex-col gap-2">
                      <Link
                        href={`/news-outlets/${newsOutlet.id}`}
                        className="line-clamp-1 break-words hover:underline"
                      >
                        {newsOutlet.name}
                      </Link>

                      <a
                        href={newsOutlet.homepageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={newsOutlet.homepageUrl}
                        aria-label={formatMessage(
                          dictionary.newsOutlets.homepageAria,
                          {
                            name: newsOutlet.name,
                            url: newsOutlet.homepageUrl,
                          }
                        )}
                        className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {dictionary.newsOutlets.homepagePrefix}:{" "}
                          {formatUrlIdentity(newsOutlet.homepageUrl)}
                        </span>
                        <ExternalLink className="h-2 w-2 shrink-0" />
                      </a>

                      {newsOutlet.rssUrl ? (
                        <a
                          href={newsOutlet.rssUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={newsOutlet.rssUrl}
                          aria-label={formatMessage(
                            dictionary.newsOutlets.rssAria,
                            {
                              name: newsOutlet.name,
                              url: newsOutlet.rssUrl,
                            }
                          )}
                          className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          <Rss className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {dictionary.newsOutlets.rssConfigured}
                          </span>
                          <ExternalLink className="h-2 w-2 shrink-0" />
                        </a>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="w-40">
                    <AppTimeMetadata icon={Clock3}>
                      {formatDateTime(
                        newsOutlet.createdDate,
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                        dictionary.common.notAvailable
                      )}
                    </AppTimeMetadata>
                  </TableCell>

                  <TableCell className="w-40 text-center">
                    <div className="flex justify-center">
                      <ToggleNewsOutletActiveSwitch
                        id={newsOutlet.id}
                        name={newsOutlet.name}
                        active={newsOutlet.active}
                        canUpdate={canUpdateNewsOutlet}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="w-28 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canUpdateNewsOutlet ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Link
                                href={`/news-outlets/${newsOutlet.id}`}
                                className={buttonVariants({
                                  variant: "ghost",
                                  size: "icon-sm",
                                  className:
                                    "text-muted-foreground hover:text-foreground",
                                })}
                              />
                            }
                          >
                            <Edit2 data-icon="inline-start" />
                            <span className="sr-only">
                              {dictionary.newsOutlets.edit}
                            </span>
                          </TooltipTrigger>
                          <TooltipContentInOverlay>
                            {dictionary.newsOutlets.editTooltip}
                          </TooltipContentInOverlay>
                        </Tooltip>
                      ) : null}

                      {canDeleteNewsOutlet ? (
                        <DeleteNewsOutletButton
                          id={newsOutlet.id}
                          name={newsOutlet.name}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={4}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Newspaper />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.newsOutlets.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.newsOutlets.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={newsOutletPage} className="mt-4" />
    </div>
  )
}

function ToggleNewsOutletActiveSwitch({
  id,
  name,
  active,
  canUpdate,
}: {
  id: number
  name: string
  active: boolean
  canUpdate: boolean
}) {
  const { dictionary, formatMessage } = useLocalization()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isDisabled = isPending || !canUpdate

  const handleToggle = () => {
    if (isDisabled) {
      return
    }

    startTransition(async () => {
      const result = await toggleNewsOutletActive(id)

      if (result.success) {
        toast.success(
          active
            ? dictionary.newsOutlets.pausedToast
            : dictionary.newsOutlets.activated
        )
        router.refresh()
      } else {
        toast.error(result.error || dictionary.newsOutlets.toggleError)
      }
    })
  }

  return (
    <div
      className="inline-flex h-8 w-32 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs transition-colors data-[disabled=true]:opacity-60 dark:bg-input/30"
      data-disabled={isDisabled ? true : undefined}
      aria-busy={isPending}
    >
      <span
        className={cn(
          "min-w-14 text-left text-xs font-medium",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {active
          ? dictionary.newsOutlets.enabled
          : dictionary.newsOutlets.paused}
      </span>
      <Switch
        checked={active}
        onCheckedChange={handleToggle}
        disabled={isDisabled}
        aria-label={formatMessage(dictionary.newsOutlets.toggleAria, {
          action: active
            ? dictionary.newsOutlets.pause
            : dictionary.newsOutlets.activate,
          name,
        })}
      />
    </div>
  )
}

function DeleteNewsOutletButton({ id, name }: { id: number; name: string }) {
  const { dictionary, formatMessage } = useLocalization()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNewsOutlet(id)

      if (result.success) {
        toast.success(formatMessage(dictionary.newsOutlets.deleted, { name }))
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || dictionary.newsOutlets.deleteError)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                />
              }
            />
          }
        >
          <Trash2 data-icon="inline-start" />
          <span className="sr-only">{dictionary.newsOutlets.delete}</span>
        </TooltipTrigger>
        <TooltipContentInOverlay>
          {dictionary.newsOutlets.delete}
        </TooltipContentInOverlay>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dictionary.newsOutlets.deleteTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {formatMessage(dictionary.newsOutlets.deleteDescription, { name })}
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
                <Spinner data-icon="inline-start" />
                {dictionary.newsOutlets.deletePending}
              </>
            ) : (
              dictionary.newsOutlets.delete
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
