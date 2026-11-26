"use client"

import { type FormEvent, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Clipboard,
  ExternalLink,
  Link2,
  MessageCircle,
  MoreHorizontal,
  PowerOff,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  createTelegramLinkToken,
  deleteTelegramDestination,
  disableTelegramDestination,
} from "@/app/api/telegram/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  TelegramBotConnectionResponse,
  TelegramDestinationResponse,
  TelegramLinkTokenResponse,
} from "@/app/lib/telegram/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import {
  ActionConfirmDialog,
  AccessLimitedState,
  formatChatType,
  formatTelegramDateTime,
  getDestinationLabel,
  getBotLabel,
  sortOperationalTelegramRecords,
  SectionReadError,
  StatusBadge,
} from "./telegram-configuration-shared"
import { TelegramDestinationTestMessageButton } from "./telegram-destination-test-message-button"
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
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button, buttonVariants } from "@/components/ui/button"

export function DestinationsCard({
  destinations,
  activeBotConnections,
  canRead,
  canReadBotConnections,
  loadError,
  botConnectionsLoadError,
  canManage,
}: {
  destinations: TelegramDestinationResponse[]
  activeBotConnections: TelegramBotConnectionResponse[]
  canRead: boolean
  canReadBotConnections: boolean
  loadError: boolean
  botConnectionsLoadError: boolean
  canManage: boolean
}) {
  const { dictionary, formatDateTime } = useLocalization()
  const t = dictionary.telegram
  const records = sortOperationalTelegramRecords(destinations)
  const formatTime = (value?: string) =>
    formatTelegramDateTime(value, formatDateTime, t.common.noData)
  const linkUnavailable =
    !canManage || !canReadBotConnections || activeBotConnections.length === 0
  const linkUnavailableReason = !canReadBotConnections
    ? t.destination.botReadPermissionRequired
    : botConnectionsLoadError
      ? t.common.readError
      : activeBotConnections.length === 0
        ? t.destination.noActiveBotToLink
        : null

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t.destination.sectionTitle}</CardTitle>
        <CardDescription>{t.destination.sectionDescription}</CardDescription>
        {canManage ? (
          <CardAction>
            <DestinationLinkDialog
              activeBotConnections={activeBotConnections}
              canManage={canManage}
              canReadBotConnections={canReadBotConnections}
              linkUnavailable={linkUnavailable}
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {canManage && linkUnavailableReason ? (
          <p className="text-sm text-muted-foreground" role="note">
            {linkUnavailableReason}
          </p>
        ) : null}
        {!canRead ? (
          <AccessLimitedState
            title={t.destination.accessLimited}
            description={t.common.accessLimitedDescription}
          />
        ) : loadError ? (
          <SectionReadError />
        ) : (
          <>
            {!canManage ? (
              <p className="text-sm text-muted-foreground" role="note">
                {t.destination.readOnlyDescription}
              </p>
            ) : null}
            {records.length > 0 ? (
              <ItemGroup>
                {records.map((destination) => (
                  <DestinationItem
                    key={destination.id}
                    destination={destination}
                    activeBotConnections={activeBotConnections}
                    canReadBotConnections={canReadBotConnections}
                    canManage={canManage}
                    formatTime={formatTime}
                    dictionary={dictionary}
                  />
                ))}
              </ItemGroup>
            ) : (
              <Empty className="border-0 p-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircle />
                  </EmptyMedia>
                  <EmptyTitle>{t.destination.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {t.destination.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function DestinationItem({
  destination,
  activeBotConnections,
  canReadBotConnections,
  canManage,
  formatTime,
  dictionary,
}: {
  destination: TelegramDestinationResponse
  activeBotConnections: TelegramBotConnectionResponse[]
  canReadBotConnections: boolean
  canManage: boolean
  formatTime: (value?: string) => string
  dictionary: Dictionary
}) {
  const t = dictionary.telegram
  const menuTriggerId = "telegram-destination-actions-" + destination.id
  const [confirmation, setConfirmation] = useState<"disable" | "delete" | null>(
    null
  )
  const label = getDestinationLabel(destination, dictionary)
  const botLabel = getBotLabel(
    {
      id: destination.botConnectionId,
      displayLabel: destination.botDisplayLabel,
      botUsername: destination.botUsername,
      status: "ACTIVE",
    },
    dictionary
  )
  const isBotActive =
    !canReadBotConnections ||
    activeBotConnections.some(
      (connection) => connection.id === destination.botConnectionId
    )

  return (
    <>
      <Item role="listitem" variant="outline" className="items-start">
        <ItemContent className="min-w-0">
          <ItemHeader className="flex-col items-start sm:flex-row sm:items-center">
            <ItemTitle className="max-w-full min-w-0 truncate">
              <span title={label}>{label}</span>
            </ItemTitle>
            <StatusBadge status={destination.status} />
          </ItemHeader>
          <ItemDescription className="line-clamp-none break-words">
            {destination.chatTitle ||
              (destination.username
                ? "@" + destination.username.replace(/^@/, "")
                : destination.chatId) ||
              t.destination.noChatMetadata}
          </ItemDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-muted-foreground">
              {formatChatType(destination.chatType, dictionary)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.destination.linkedBot}: {botLabel}
            </span>
            <AppTimeMetadata icon={RefreshCw}>
              {formatTime(destination.lastModifiedDate)}
            </AppTimeMetadata>
          </div>
        </ItemContent>
        <ItemActions className="ms-auto basis-full justify-end self-start sm:basis-auto">
          <TelegramDestinationTestMessageButton
            destinationId={destination.id}
            destinationLabel={label}
            canManage={canManage}
            isEligible={destination.status === "ACTIVE" && isBotActive}
          />
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    id={menuTriggerId}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t.destination.actionMenu}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={destination.status !== "ACTIVE"}
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
                    {t.destination.deleteAction}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </ItemActions>
      </Item>
      <ActionConfirmDialog
        title={
          confirmation === "disable"
            ? t.destination.disableTitle
            : t.destination.deleteTitle
        }
        description={
          confirmation === "disable"
            ? t.destination.disableDescription
            : t.destination.deleteDescription
        }
        actionLabel={
          confirmation === "disable"
            ? t.common.disable
            : t.destination.deleteAction
        }
        triggerLabel={t.destination.actionMenu}
        action={() =>
          confirmation === "disable"
            ? disableTelegramDestination(destination.id)
            : deleteTelegramDestination(destination.id)
        }
        successMessage={
          confirmation === "disable"
            ? t.destination.disableSuccess
            : t.destination.deleteSuccess
        }
        open={confirmation !== null}
        onOpenChange={(open) => setConfirmation(open ? confirmation : null)}
        trigger={null}
        restoreFocusId={menuTriggerId}
      />
    </>
  )
}

function DestinationLinkDialog({
  activeBotConnections,
  canManage,
  canReadBotConnections,
  linkUnavailable,
}: {
  activeBotConnections: TelegramBotConnectionResponse[]
  canManage: boolean
  canReadBotConnections: boolean
  linkUnavailable: boolean
}) {
  const router = useRouter()
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const initialBotId =
    activeBotConnections.length === 1
      ? (activeBotConnections[0]?.id.toString() ?? "")
      : ""
  const [open, setOpen] = useState(false)
  const [botConnectionId, setBotConnectionId] = useState(initialBotId)
  const [linkToken, setLinkToken] = useState<TelegramLinkTokenResponse | null>(
    null
  )
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selectedBot = activeBotConnections.find(
    (connection) => connection.id.toString() === botConnectionId
  )
  const linkedBot = activeBotConnections.find(
    (connection) => connection.id === linkToken?.botConnectionId
  )
  const botUsername = linkedBot?.botUsername?.trim().replace(/^@/, "")
  useEffect(() => {
    if (!linkToken?.expiresAt) return

    const expiresAt = new Date(linkToken.expiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return

    const timeoutId = window.setTimeout(
      () => setCurrentTime(Date.now()),
      Math.max(0, expiresAt - Date.now())
    )

    return () => window.clearTimeout(timeoutId)
  }, [linkToken?.expiresAt])
  const linkExpired = Boolean(
    linkToken?.expiresAt &&
    currentTime !== null &&
    new Date(linkToken.expiresAt).getTime() <= currentTime
  )
  const privateLink =
    !linkExpired && botUsername && linkToken?.token
      ? "https://t.me/" +
        botUsername +
        "?start=" +
        encodeURIComponent(linkToken.token)
      : null
  const groupLink =
    !linkExpired && botUsername && linkToken?.token
      ? "https://t.me/" +
        botUsername +
        "?startgroup=" +
        encodeURIComponent(linkToken.token)
      : null
  const formatTime = (value?: string) =>
    formatTelegramDateTime(value, formatDateTime, t.common.noData)
  const unavailableReason = !canReadBotConnections
    ? t.destination.botReadPermissionRequired
    : activeBotConnections.length === 0
      ? t.destination.noActiveBotToLink
      : null

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setBotConnectionId(initialBotId)
      setLinkToken(null)
      setCurrentTime(null)
      setError(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage || !botConnectionId) {
      setError(t.destination.botRequired)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createTelegramLinkToken({
        botConnectionId: Number(botConnectionId),
      })

      if (result.success) {
        setLinkToken(result.data)
        setCurrentTime(Date.now())
        toast.success(t.destination.linkCreated)
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  function handleRefresh() {
    handleOpenChange(false)
    router.refresh()
    toast.success(t.destination.refreshed)
  }

  async function handleCopy() {
    if (!linkToken?.startCommand || linkExpired) return

    try {
      await navigator.clipboard.writeText(linkToken.startCommand)
      toast.success(t.destination.copied)
    } catch {
      toast.error(t.destination.copyError)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            disabled={!canManage || linkUnavailable}
            aria-describedby={
              unavailableReason ? "telegram-link-unavailable" : undefined
            }
          />
        }
      >
        <Link2 data-icon="inline-start" />
        {t.destination.link}
      </DialogTrigger>
      {unavailableReason ? (
        <span id="telegram-link-unavailable" className="sr-only">
          {unavailableReason}
        </span>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.destination.linkTitle}</DialogTitle>
          <DialogDescription>{t.destination.linkDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="telegram-destination-bot">
                {t.destination.commandBot}
              </FieldLabel>
              <Select
                items={activeBotConnections.map((connection) => ({
                  value: connection.id.toString(),
                  label: getBotLabel(connection, dictionary),
                }))}
                value={botConnectionId}
                onValueChange={(value) => {
                  setBotConnectionId(value ?? "")
                  setLinkToken(null)
                  setCurrentTime(null)
                  setError(null)
                }}
                disabled={isPending || activeBotConnections.length === 0}
              >
                <SelectTrigger id="telegram-destination-bot" className="w-full">
                  <SelectValue placeholder={t.destination.botPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {activeBotConnections.map((connection) => (
                      <SelectItem
                        key={connection.id}
                        value={connection.id.toString()}
                      >
                        {getBotLabel(connection, dictionary)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {t.destination.botDescription}
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
          {linkToken ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="telegram-link-command">
                  {t.destination.linkCommand}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="telegram-link-command"
                    value={linkToken.startCommand}
                    readOnly
                    aria-label={t.destination.linkCommand}
                  />
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={t.destination.copyCommand}
                    disabled={linkExpired}
                    onClick={handleCopy}
                  >
                    <Clipboard />
                  </InputGroupButton>
                </InputGroup>
                <AppTimeMetadata icon={CalendarClock}>
                  {formatMessage(t.destination.expiresAt, {
                    time: formatTime(linkToken.expiresAt),
                  })}
                </AppTimeMetadata>
                {linkExpired ? (
                  <FieldDescription>
                    {t.destination.linkExpired}
                  </FieldDescription>
                ) : null}
              </Field>
              {!linkExpired && (privateLink || groupLink) ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {privateLink ? (
                    <a
                      href={privateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <ExternalLink data-icon="inline-start" />
                      {t.destination.openPrivate}
                    </a>
                  ) : null}
                  {groupLink ? (
                    <a
                      href={groupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <ExternalLink data-icon="inline-start" />
                      {t.destination.openGroup}
                    </a>
                  ) : null}
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {t.destination.linkCompletionHint}
              </p>
            </FieldGroup>
          ) : null}
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              {dictionary.common.close}
            </DialogClose>
            <Button
              type="submit"
              disabled={!canManage || !selectedBot || isPending}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Link2 data-icon="inline-start" />
              )}
              {linkToken
                ? t.destination.regenerateCommand
                : t.destination.createCommand}
            </Button>
            {linkToken ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={handleRefresh}
              >
                <RefreshCw data-icon="inline-start" />
                {t.destination.refreshDestinations}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
