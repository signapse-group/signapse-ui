"use client"

import { type FormEvent, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  CalendarClock,
  MoreHorizontal,
  PowerOff,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  createTelegramBotConnection,
  deleteTelegramBotConnection,
  disableTelegramBotConnection,
} from "@/app/api/telegram/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  getCreateTelegramBotConnectionSchema,
  TelegramBotConnectionReadback,
} from "@/app/lib/telegram/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import {
  ActionConfirmDialog,
  AccessLimitedState,
  formatTelegramDateTime,
  getBotLabel,
  sortOperationalTelegramRecords,
  StatusBadge,
} from "./telegram-configuration-shared"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuContentInOverlay as DropdownMenuContent } from "@/components/ui/dropdown-menu-content-in-overlay"
import { Button } from "@/components/ui/button"

export function BotConnectionsCard({
  botConnections,
  canRead,
  canManage,
  canCreate,
}: {
  botConnections: TelegramBotConnectionReadback[]
  canRead: boolean
  canManage: boolean
  canCreate: boolean
}) {
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const records = sortOperationalTelegramRecords(botConnections)
  const formatTime = (value?: string) =>
    formatTelegramDateTime(value, formatDateTime, t.common.noData)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t.bot.sectionTitle}</CardTitle>
        <CardDescription>{t.bot.sectionDescription}</CardDescription>
        {canCreate ? (
          <CardAction>
            <ConnectBotDialog />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {!canRead ? (
          <AccessLimitedState
            title={t.bot.accessLimited}
            description={t.common.accessLimitedDescription}
          />
        ) : (
          <>
            {!canManage ? (
              <p className="text-sm text-muted-foreground" role="note">
                {t.bot.readOnlyDescription}
              </p>
            ) : null}
            {records.length > 0 ? (
              <ItemGroup>
                {records.map((connection, index) => (
                  <BotConnectionItem
                    key={connection.id ?? `unverified-${index}`}
                    connection={connection}
                    canManage={canManage}
                    formatTime={formatTime}
                    formatMessage={formatMessage}
                    dictionary={dictionary}
                  />
                ))}
              </ItemGroup>
            ) : (
              <Empty className="border-0 p-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bot />
                  </EmptyMedia>
                  <EmptyTitle>{t.bot.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{t.bot.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function BotConnectionItem({
  connection,
  canManage,
  formatTime,
  formatMessage,
  dictionary,
}: {
  connection: TelegramBotConnectionReadback
  canManage: boolean
  formatTime: (value?: string) => string
  formatMessage: ReturnType<typeof useLocalization>["formatMessage"]
  dictionary: Dictionary
}) {
  const t = dictionary.telegram
  const manageableId =
    canManage && connection.id !== undefined ? connection.id : null
  const menuTriggerId =
    manageableId === null ? null : `telegram-bot-actions-${manageableId}`
  const [confirmation, setConfirmation] = useState<"disable" | "delete" | null>(
    null
  )
  const label = getBotLabel(connection, dictionary)

  return (
    <>
      <Item role="listitem" variant="outline" className="items-start">
        <ItemContent className="min-w-0">
          <ItemHeader className="flex-col items-start sm:flex-row sm:items-center">
            <ItemTitle className="max-w-full min-w-0 truncate">
              <span title={label}>{label}</span>
            </ItemTitle>
            <StatusBadge status={connection.status} />
          </ItemHeader>
          {connection.id === undefined || connection.status === undefined ? (
            <p className="text-xs text-muted-foreground" role="note">
              {t.bot.connectionDetailsUnverified}
            </p>
          ) : null}
          <ItemDescription className="line-clamp-none break-words">
            {connection.botUsername
              ? "@" + connection.botUsername.replace(/^@/, "")
              : t.bot.noUsername}{" "}
            · {connection.botFirstName ?? t.bot.noBotName}
          </ItemDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <AppTimeMetadata icon={CalendarClock}>
              {connection.lastWebhookRegisteredAt
                ? formatMessage(t.bot.webhookRegistered, {
                    time: formatTime(connection.lastWebhookRegisteredAt),
                  })
                : t.bot.webhookNotRegistered}
            </AppTimeMetadata>
            <AppTimeMetadata icon={RefreshCw}>
              {formatMessage(t.bot.lastValidated, {
                time: formatTime(
                  connection.lastValidatedAt ?? connection.verifiedAt
                ),
              })}
            </AppTimeMetadata>
          </div>
          {connection.status === "INVALID" ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-destructive">
                {t.bot.webhookRegistrationFailed}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.bot.setupIncomplete}
              </p>
            </div>
          ) : null}
        </ItemContent>
        {manageableId !== null && menuTriggerId !== null ? (
          <ItemActions className="ms-auto self-start">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    id={menuTriggerId}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t.bot.actionMenu}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={connection.status !== "ACTIVE"}
                    onClick={() => setConfirmation("disable")}
                  >
                    <PowerOff />
                    {t.common.disable}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirmation("delete")}
                  >
                    <Trash2 />
                    {t.bot.deleteAction}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        ) : null}
      </Item>
      {manageableId !== null && menuTriggerId !== null ? (
        <ActionConfirmDialog
          title={
            confirmation === "disable" ? t.bot.disableTitle : t.bot.deleteTitle
          }
          description={
            confirmation === "disable"
              ? t.bot.disableDescription
              : t.bot.deleteDescription
          }
          actionLabel={
            confirmation === "disable" ? t.common.disable : t.bot.deleteAction
          }
          triggerLabel={t.bot.actionMenu}
          action={() =>
            confirmation === "disable"
              ? disableTelegramBotConnection(manageableId)
              : deleteTelegramBotConnection(manageableId)
          }
          successMessage={
            confirmation === "disable"
              ? t.bot.disableSuccess
              : t.bot.deleteSuccess
          }
          open={confirmation !== null}
          onOpenChange={(open) => setConfirmation(open ? confirmation : null)}
          trigger={null}
          restoreFocusId={menuTriggerId}
        />
      ) : null}
    </>
  )
}

function ConnectBotDialog() {
  const router = useRouter()
  const tokenRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setToken("")
      setError(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request = getCreateTelegramBotConnectionSchema(dictionary).safeParse({
      botToken: token,
    })

    if (!request.success) {
      setError(request.error.issues[0]?.message ?? t.bot.invalidData)
      requestAnimationFrame(() => tokenRef.current?.focus())
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createTelegramBotConnection(request.data)

      if (result.success) {
        const { connection, created } = result.data
        const status = connection.status

        if (created === null) {
          toast.warning(t.bot.createOutcomeUnverified)
        } else if (status === undefined) {
          toast.warning(
            created
              ? t.bot.createStatusUnverified
              : t.bot.alreadyConnectedStatusUnverified
          )
        } else {
          const statusLabel = dictionary.telegram.statuses[status]

          if (created && status === "ACTIVE") {
            toast.success(t.bot.createSuccess)
          } else if (status === "INVALID") {
            const incompleteMessage = formatMessage(
              created
                ? t.bot.createIncomplete
                : t.bot.alreadyConnectedIncomplete,
              { status: statusLabel }
            )
            toast.warning(
              created
                ? incompleteMessage
                : `${incompleteMessage} ${t.bot.webhookRegistrationFailed}`
            )
          } else if (!created) {
            toast.info(
              formatMessage(t.bot.alreadyConnected, {
                status: statusLabel,
              })
            )
          } else {
            toast.warning(
              formatMessage(t.bot.createNotActive, { status: statusLabel })
            )
          }
        }

        handleOpenChange(false)
        router.refresh()
      } else {
        setError(result.error)
        requestAnimationFrame(() => tokenRef.current?.focus())
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Bot data-icon="inline-start" />
        {t.bot.connect}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t.bot.createTitle}</DialogTitle>
          <DialogDescription>{t.bot.createDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="telegram-bot-token">
                {t.bot.tokenLabel}
              </FieldLabel>
              <Input
                ref={tokenRef}
                id="telegram-bot-token"
                name="botToken"
                type="password"
                autoComplete="new-password"
                placeholder={t.bot.tokenPlaceholder}
                value={token}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error
                    ? "telegram-bot-token-description telegram-bot-token-error"
                    : "telegram-bot-token-description"
                }
                disabled={isPending}
                onChange={(event) => {
                  setToken(event.target.value)
                  if (error) setError(null)
                }}
              />
              <FieldDescription id="telegram-bot-token-description">
                {t.bot.tokenDescription}
              </FieldDescription>
              <FieldError id="telegram-bot-token-error">{error}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter className="flex-col sm:flex-row">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              {dictionary.common.close}
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              {t.bot.connectBot}
            </Button>
          </DialogFooter>
        </form>
        <DialogClose
          render={
            <Button
              aria-label={dictionary.common.close}
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
