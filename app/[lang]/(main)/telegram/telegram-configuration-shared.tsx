"use client"

import type { ReactElement, ReactNode } from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { ActionResult } from "@/app/lib/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  TelegramBotConnectionResponse,
  TelegramChatType,
  TelegramConnectionStatus,
  TelegramDestinationResponse,
  TelegramDestinationStatus,
} from "@/app/lib/telegram/definitions"
import { AppListTableEmptyState } from "@/components/app-list-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export const TELEGRAM_DATE_TIME_OPTIONS = {
  dateStyle: "short",
  timeStyle: "short",
} satisfies Intl.DateTimeFormatOptions

const TELEGRAM_STATUS_PRIORITY: Record<string, number> = {
  INVALID: 0,
  ACTIVE: 1,
  DISABLED: 2,
  REMOVED: 3,
}

export function sortOperationalTelegramRecords<
  T extends { status: string; id: number },
>(records: T[]) {
  return records
    .filter((record) => record.status !== "REMOVED")
    .sort(
      (left, right) =>
        (TELEGRAM_STATUS_PRIORITY[left.status] ?? 99) -
          (TELEGRAM_STATUS_PRIORITY[right.status] ?? 99) || left.id - right.id
    )
}

export function SectionHeader({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} className="text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function SectionReadError({ message }: { message?: string }) {
  const router = useRouter()
  const { dictionary } = useLocalization()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="text-sm text-destructive">
        {message ?? dictionary.telegram.common.readError}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => router.refresh()}
      >
        {dictionary.common.retry}
      </Button>
    </div>
  )
}

export function ReadinessBadge({
  status,
  children,
}: {
  status: "ready" | "attention"
  children: ReactNode
}) {
  return status === "ready" ? (
    <Badge variant="secondary">
      <CheckCircle2 data-icon="inline-start" />
      {children}
    </Badge>
  ) : (
    <Badge variant="outline">
      <ShieldAlert data-icon="inline-start" />
      {children}
    </Badge>
  )
}

export function StatusBadge({
  status,
}: {
  status: TelegramConnectionStatus | TelegramDestinationStatus
}) {
  const { dictionary } = useLocalization()
  const label = dictionary.telegram.statuses[status]

  if (status === "ACTIVE") {
    return <Badge variant="secondary">{label}</Badge>
  }

  if (status === "INVALID") {
    return <Badge variant="destructive">{label}</Badge>
  }

  return <Badge variant="outline">{label}</Badge>
}

export function formatChatType(
  chatType: TelegramChatType,
  dictionary: Dictionary
) {
  return dictionary.telegram.chatTypes[chatType]
}

export function getBotLabel(
  connection: TelegramBotConnectionResponse,
  dictionary: Dictionary
) {
  return (
    connection.displayLabel?.trim() ||
    connection.botUsername?.trim() ||
    connection.botFirstName?.trim() ||
    formatLabel(dictionary.telegram.bot.fallbackLabel, connection.id)
  )
}

export function getDestinationLabel(
  destination: TelegramDestinationResponse,
  dictionary: Dictionary
) {
  return (
    destination.displayLabel?.trim() ||
    destination.chatTitle?.trim() ||
    destination.username?.trim() ||
    formatLabel(dictionary.telegram.destination.fallbackLabel, destination.id)
  )
}

export function formatTelegramDateTime(
  value: string | undefined,
  formatDateTime: ReturnType<typeof useLocalization>["formatDateTime"],
  fallback: string
) {
  return formatDateTime(value, TELEGRAM_DATE_TIME_OPTIONS, fallback)
}

export function formatLabel(template: string, id: number) {
  return template.replace("{id}", String(id))
}

export function AccessLimitedState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function AccessLimitedRow({
  colSpan,
  title,
}: {
  colSpan: number
  title: string
}) {
  const { dictionary } = useLocalization()

  return (
    <AppListTableEmptyState colSpan={colSpan}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {dictionary.telegram.common.accessLimitedDescription}
        </EmptyDescription>
      </EmptyHeader>
    </AppListTableEmptyState>
  )
}

export function ActionConfirmDialog({
  title,
  description,
  actionLabel,
  triggerLabel,
  triggerTooltip,
  disabled,
  action,
  successMessage,
  intent = "destructive",
  open: controlledOpen,
  onOpenChange,
  trigger,
  restoreFocusId,
}: {
  title: string
  description: string
  actionLabel: string
  triggerLabel: string
  triggerTooltip?: string
  disabled?: boolean
  action: () => Promise<ActionResult<unknown>>
  successMessage: string
  intent?: "destructive" | "warning"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactElement | null
  restoreFocusId?: string
}) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { dictionary } = useLocalization()
  const open = controlledOpen ?? uncontrolledOpen

  function setOpen(nextOpen: boolean) {
    if (onOpenChange) {
      onOpenChange(nextOpen)
    } else {
      setUncontrolledOpen(nextOpen)
    }

    if (!nextOpen) {
      setError(null)
      if (restoreFocusId) {
        requestAnimationFrame(() => {
          document.getElementById(restoreFocusId)?.focus()
        })
      }
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return
    setOpen(nextOpen)
  }

  function handleAction() {
    setError(null)
    startTransition(async () => {
      const result = await action()

      if (result.success) {
        toast.success(successMessage)
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  const triggerElement = trigger ?? (
    <Button
      id={restoreFocusId}
      variant={intent === "destructive" ? "destructive" : "ghost"}
      size="icon-sm"
      disabled={disabled}
      aria-label={triggerLabel}
    >
      {intent === "destructive" ? (
        <Trash2 data-icon="inline-start" />
      ) : (
        <CircleAlert data-icon="inline-start" />
      )}
    </Button>
  )

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger === null ? null : triggerTooltip ? (
        <span className="group/trigger-tooltip relative inline-flex">
          <AlertDialogTrigger render={triggerElement} />
          <span
            id={restoreFocusId ? `${restoreFocusId}-tooltip` : undefined}
            role="tooltip"
            className="pointer-events-none invisible absolute right-1/2 bottom-full z-50 mb-2 translate-x-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background shadow-sm group-focus-within/trigger-tooltip:visible group-hover/trigger-tooltip:visible"
          >
            {triggerTooltip}
          </span>
        </span>
      ) : (
        <AlertDialogTrigger render={triggerElement} />
      )}
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              intent === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-foreground"
            }
          >
            {intent === "destructive" ? <Trash2 /> : <CircleAlert />}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={intent === "destructive" ? "destructive" : "default"}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              handleAction()
            }}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
