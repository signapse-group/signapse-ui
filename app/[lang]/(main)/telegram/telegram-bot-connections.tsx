"use client"

import { type FormEvent, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bot, CalendarClock, RefreshCw, Send, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import {
  createTelegramBotConnection,
  deleteTelegramBotConnection,
  reconnectTelegramBotConnection,
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
  SectionReadError,
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
import { Button } from "@/components/ui/button"

export function BotConnectionsCard({
  botConnections,
  canRead,
  canUpdate,
  canCreate,
  canDelete,
  loadError,
}: {
  botConnections: TelegramBotConnectionReadback[]
  canRead: boolean
  canUpdate: boolean
  canCreate: boolean
  canDelete: boolean
  loadError: boolean
}) {
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const records = sortOperationalTelegramRecords(botConnections)
  const formatTime = (value?: string) =>
    formatTelegramDateTime(value, formatDateTime, t.common.noData)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle
          id="telegram-bot-connections-heading"
          role="heading"
          aria-level={3}
          tabIndex={-1}
        >
          {t.bot.sectionTitle}
        </CardTitle>
        <CardDescription>{t.bot.sectionDescription}</CardDescription>
        {canCreate ? (
          <CardAction>
            <ConnectBotDialog canRead={canRead} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {!canRead ? (
          <AccessLimitedState
            title={t.bot.accessLimited}
            description={t.common.accessLimitedDescription}
          />
        ) : loadError ? (
          <SectionReadError />
        ) : (
          <>
            {!canUpdate && !canDelete ? (
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
                    canUpdate={canUpdate}
                    canDelete={canDelete}
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
  canUpdate,
  canDelete,
  formatTime,
  formatMessage,
  dictionary,
}: {
  connection: TelegramBotConnectionReadback
  canUpdate: boolean
  canDelete: boolean
  formatTime: (value?: string) => string
  formatMessage: ReturnType<typeof useLocalization>["formatMessage"]
  dictionary: Dictionary
}) {
  const t = dictionary.telegram
  const reconnectableId =
    canUpdate &&
    connection.id !== undefined &&
    (connection.status === "ACTIVE" || connection.status === "INVALID")
      ? connection.id
      : undefined
  const removableId = canDelete ? connection.id : undefined
  const removeTriggerId =
    removableId === undefined ? null : `telegram-bot-remove-${removableId}`
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const label = getBotLabel(connection, dictionary)
  const removeTriggerLabel = formatMessage(t.bot.deleteTrigger, {
    botName: label,
  })

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
        {reconnectableId !== undefined ||
        (removableId !== undefined && removeTriggerId !== null) ? (
          <ItemActions className="ms-auto self-start">
            {reconnectableId !== undefined ? (
              <ReconnectBotDialog
                connection={connection}
                connectionId={reconnectableId}
                label={label}
              />
            ) : null}
            {removableId !== undefined && removeTriggerId !== null ? (
              <ActionConfirmDialog
                title={formatMessage(t.bot.deleteTitle, { botName: label })}
                description={t.bot.deleteDescription}
                actionLabel={t.bot.deleteAction}
                pendingLabel={t.bot.deletePending}
                triggerLabel={removeTriggerLabel}
                action={() => deleteTelegramBotConnection(removableId)}
                successMessage={t.bot.deleteSuccess}
                open={confirmationOpen}
                onOpenChange={setConfirmationOpen}
                trigger={
                  <Button
                    type="button"
                    id={removeTriggerId}
                    variant="destructive"
                    size="icon-sm"
                    className="min-h-[44px] min-w-[44px] focus-visible:ring-destructive md:min-h-8 md:min-w-8 dark:focus-visible:ring-destructive"
                    aria-label={removeTriggerLabel}
                    title={removeTriggerLabel}
                  >
                    <Trash2 data-icon="inline-start" />
                  </Button>
                }
                restoreFocusId={removeTriggerId}
                successFocusId="telegram-bot-connections-heading"
              />
            ) : null}
          </ItemActions>
        ) : null}
      </Item>
    </>
  )
}

function ReconnectBotDialog({
  connection,
  connectionId,
  label,
}: {
  connection: TelegramBotConnectionReadback
  connectionId: number
  label: string
}) {
  const router = useRouter()
  const tokenRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const username = connection.botUsername
    ? `@${connection.botUsername.replace(/^@/, "")}`
    : t.bot.noUsername
  const triggerLabel = formatMessage(t.bot.reconnectTrigger, {
    botName: label,
  })
  const tokenId = `telegram-reconnect-token-${connectionId}`
  const errorId = `${tokenId}-error`
  const descriptionId = `${tokenId}-description`

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
      const result = await reconnectTelegramBotConnection(
        connectionId,
        request.data
      )

      if (result.success) {
        if (result.data.status === "ACTIVE") {
          toast.success(t.bot.reconnectSuccess)
        } else if (result.data.status === "INVALID") {
          toast.warning(t.bot.reconnectIncomplete)
        } else {
          toast.warning(t.bot.reconnectOutcomeUnverified)
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
    <Dialog
      open={open}
      disablePointerDismissal={isPending}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && isPending) {
          eventDetails.cancel()
          return
        }
        handleOpenChange(nextOpen)
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            id={`telegram-bot-reconnect-${connectionId}`}
            variant="outline"
            size="icon-sm"
            className="min-h-[44px] min-w-[44px] md:min-h-8 md:min-w-8"
            aria-label={triggerLabel}
            title={triggerLabel}
          />
        }
      >
        <RefreshCw aria-hidden="true" />
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t.bot.reconnectTitle}</DialogTitle>
          <DialogDescription>
            {formatMessage(t.bot.reconnectDescription, {
              botName: label,
              botUsername: username,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={tokenId}>{t.bot.tokenLabel}</FieldLabel>
              <Input
                ref={tokenRef}
                id={tokenId}
                name="botToken"
                type="password"
                autoComplete="new-password"
                placeholder={t.bot.tokenPlaceholder}
                value={token}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? `${descriptionId} ${errorId}` : descriptionId
                }
                disabled={isPending}
                onChange={(event) => {
                  setToken(event.target.value)
                  if (error) setError(null)
                }}
              />
              <FieldDescription id={descriptionId}>
                {t.bot.tokenDescription}
              </FieldDescription>
              <FieldError id={errorId}>{error}</FieldError>
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
                <Spinner
                  aria-label={dictionary.common.loading}
                  data-icon="inline-start"
                />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              {t.bot.reconnectAction}
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
              disabled={isPending}
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function ConnectBotDialog({ canRead }: { canRead: boolean }) {
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
        let unverifiedMessage: string
        if (created === null) {
          unverifiedMessage = canRead
            ? t.bot.createOutcomeUnverified
            : t.bot.createOutcomeUnverifiedWithoutRead
        } else if (created) {
          unverifiedMessage = canRead
            ? t.bot.createStatusUnverified
            : t.bot.createStatusUnverifiedWithoutRead
        } else {
          unverifiedMessage = canRead
            ? t.bot.alreadyConnectedStatusUnverified
            : t.bot.alreadyConnectedStatusUnverifiedWithoutRead
        }

        if (created === null || status === undefined) {
          toast.warning(unverifiedMessage)
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
    <Dialog
      open={open}
      disablePointerDismissal={isPending}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && isPending) {
          eventDetails.cancel()
          return
        }
        handleOpenChange(nextOpen)
      }}
    >
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
                <Spinner
                  aria-label={dictionary.common.loading}
                  data-icon="inline-start"
                />
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
              disabled={isPending}
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
