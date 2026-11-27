"use client"

import type { ReactElement, ReactNode } from "react"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { ActionResult } from "@/app/lib/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  TelegramBotConnectionReadback,
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
  T extends { status?: string; id?: number },
>(records: T[]) {
  return records
    .filter((record) => record.status !== "REMOVED")
    .sort(
      (left, right) =>
        (TELEGRAM_STATUS_PRIORITY[left.status ?? ""] ?? 99) -
          (TELEGRAM_STATUS_PRIORITY[right.status ?? ""] ?? 99) ||
        (left.id !== undefined && right.id !== undefined
          ? left.id - right.id
          : 0)
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
  status: TelegramConnectionStatus | TelegramDestinationStatus | undefined
}) {
  const { dictionary } = useLocalization()
  if (status === undefined) {
    return (
      <Badge variant="outline">
        {dictionary.telegram.bot.statusUnverified}
      </Badge>
    )
  }

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
  connection: TelegramBotConnectionReadback,
  dictionary: Dictionary
) {
  const label =
    connection.displayLabel?.trim() ||
    connection.botUsername?.trim() ||
    connection.botFirstName?.trim()

  if (label) return label

  return connection.id === undefined
    ? dictionary.telegram.bot.unverifiedLabel
    : formatLabel(dictionary.telegram.bot.fallbackLabel, connection.id)
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
  pendingLabel,
  triggerLabel,
  disabled,
  action,
  successMessage,
  intent = "destructive",
  open: controlledOpen,
  onOpenChange,
  trigger,
  restoreFocusId,
  successFocusId,
}: {
  title: string
  description: string
  actionLabel: string
  pendingLabel?: string
  triggerLabel: string
  disabled?: boolean
  action: () => Promise<ActionResult<unknown>>
  successMessage: string
  intent?: "destructive" | "warning"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactElement | null
  restoreFocusId?: string
  successFocusId?: string
}) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const { dictionary } = useLocalization()
  const open = controlledOpen ?? uncontrolledOpen

  useEffect(() => {
    if (isPending || error) feedbackRef.current?.focus()
  }, [error, isPending])

  function setOpen(nextOpen: boolean, focusId = restoreFocusId) {
    if (onOpenChange) {
      onOpenChange(nextOpen)
    } else {
      setUncontrolledOpen(nextOpen)
    }

    if (!nextOpen) {
      setError(null)
      if (focusId) {
        requestAnimationFrame(() => {
          document.getElementById(focusId)?.focus()
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
        setOpen(false, successFocusId)
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger === null ? null : (
        <AlertDialogTrigger
          render={
            trigger ?? (
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
          }
        />
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
          {isPending || error ? (
            <p
              ref={feedbackRef}
              tabIndex={-1}
              role={isPending ? "status" : "alert"}
              aria-live={isPending ? "polite" : "assertive"}
              className={`rounded-sm text-sm ${
                isPending ? "text-muted-foreground" : "text-destructive"
              } focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`}
            >
              {isPending ? (pendingLabel ?? dictionary.common.pending) : error}
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
            {isPending ? (
              <Spinner
                data-icon="inline-start"
                aria-hidden="true"
                aria-label={undefined}
                role="presentation"
              />
            ) : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
