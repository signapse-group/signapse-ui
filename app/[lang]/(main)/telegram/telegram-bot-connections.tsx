"use client"

import { type FormEvent, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bot, CalendarClock, RefreshCw, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createTelegramBotConnection,
  deleteTelegramBotConnection,
} from "@/app/api/telegram/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  getCreateTelegramBotConnectionSchema,
  TelegramBotConnectionResponse,
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
  canManage,
  canDelete,
  loadError,
}: {
  botConnections: TelegramBotConnectionResponse[]
  canRead: boolean
  canManage: boolean
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
        {canManage ? (
          <CardAction>
            <ConnectBotDialog canManage={canManage} />
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
            {!canManage && !canDelete ? (
              <p className="text-sm text-muted-foreground" role="note">
                {t.bot.readOnlyDescription}
              </p>
            ) : null}
            {records.length > 0 ? (
              <ItemGroup>
                {records.map((connection) => (
                  <BotConnectionItem
                    key={connection.id}
                    connection={connection}
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
  canDelete,
  formatTime,
  formatMessage,
  dictionary,
}: {
  connection: TelegramBotConnectionResponse
  canDelete: boolean
  formatTime: (value?: string) => string
  formatMessage: ReturnType<typeof useLocalization>["formatMessage"]
  dictionary: Dictionary
}) {
  const t = dictionary.telegram
  const removeTriggerId = "telegram-bot-remove-" + connection.id
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
            <>
              {connection.failureReason ? (
                <p className="text-sm text-destructive" role="alert">
                  {connection.failureReason}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {t.bot.replacementGuidance}
              </p>
            </>
          ) : null}
        </ItemContent>
        {canDelete ? (
          <ItemActions className="ms-auto self-start">
            <ActionConfirmDialog
              title={formatMessage(t.bot.deleteTitle, { botName: label })}
              description={t.bot.deleteDescription}
              actionLabel={t.bot.deleteAction}
              pendingLabel={t.bot.deletePending}
              triggerLabel={removeTriggerLabel}
              action={() => deleteTelegramBotConnection(connection.id)}
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
          </ItemActions>
        ) : null}
      </Item>
    </>
  )
}

function ConnectBotDialog({ canManage }: { canManage: boolean }) {
  const router = useRouter()
  const tokenRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useLocalization()
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
    if (!canManage) return

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
        toast.success(t.bot.createSuccess)
        handleOpenChange(false)
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button disabled={!canManage} />}>
        <Bot data-icon="inline-start" />
        {t.bot.connect}
      </DialogTrigger>
      <DialogContent>
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
                disabled={isPending}
                onChange={(event) => {
                  setToken(event.target.value)
                  if (error) setError(null)
                }}
              />
              <FieldDescription>{t.bot.tokenDescription}</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              {dictionary.common.close}
            </DialogClose>
            <Button type="submit" disabled={isPending || !canManage}>
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              {t.bot.connectBot}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
