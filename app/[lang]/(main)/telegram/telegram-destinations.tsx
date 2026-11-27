"use client"

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Clipboard,
  Link2,
  MessageCircle,
  MoreHorizontal,
  PowerOff,
  RefreshCw,
  Trash2,
  X,
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
import { Badge } from "@/components/ui/badge"
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
  InputGroupTextarea,
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
import { Button } from "@/components/ui/button"

export function DestinationsCard({
  destinations,
  loadError,
  activeBotConnections,
  canRead,
  canReadBotConnections,
  botConnectionsLoadError,
  canManage,
}: {
  destinations: TelegramDestinationResponse[]
  loadError: boolean
  activeBotConnections: TelegramBotConnectionResponse[]
  canRead: boolean
  canReadBotConnections: boolean
  botConnectionsLoadError: boolean
  canManage: boolean
}) {
  const router = useRouter()
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
              canReadDestinations={canRead}
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
            {loadError ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
              >
                <p className="text-sm text-destructive">
                  {t.destination.loadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.refresh()}
                >
                  {t.routing.retry}
                </Button>
              </div>
            ) : records.length > 0 ? (
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
  canReadDestinations,
  canReadBotConnections,
  linkUnavailable,
}: {
  activeBotConnections: TelegramBotConnectionResponse[]
  canManage: boolean
  canReadDestinations: boolean
  canReadBotConnections: boolean
  linkUnavailable: boolean
}) {
  const router = useRouter()
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const t = dictionary.telegram
  const [open, setOpen] = useState(false)
  const [botConnectionId, setBotConnectionId] = useState("")
  const [linkToken, setLinkToken] = useState<TelegramLinkTokenResponse | null>(
    null
  )
  const linkCommandRef = useRef<HTMLTextAreaElement>(null)
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selectedBot = activeBotConnections.find(
    (connection) =>
      connection.id.toString() === botConnectionId &&
      connection.status === "ACTIVE"
  )
  const linkedBot = activeBotConnections.find(
    (connection) =>
      connection.id === linkToken?.botConnectionId &&
      connection.status === "ACTIVE"
  )
  useEffect(() => {
    if (!linkToken) return

    linkCommandRef.current?.focus()
    const expiresAt = new Date(linkToken.expiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return

    const timeoutId = window.setTimeout(
      () => setCurrentTime(Date.now()),
      Math.max(0, expiresAt - Date.now())
    )

    return () => window.clearTimeout(timeoutId)
  }, [linkToken])
  const linkExpired = Boolean(
    linkToken &&
    currentTime !== null &&
    new Date(linkToken.expiresAt).getTime() <= currentTime
  )
  const formatTime = (value: string) =>
    formatTelegramDateTime(value, formatDateTime, t.common.noData)
  const unavailableReason = !canReadBotConnections
    ? t.destination.botReadPermissionRequired
    : activeBotConnections.length === 0
      ? t.destination.noActiveBotToLink
      : null

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return

    const shouldRefreshDestinations =
      !nextOpen && Boolean(linkToken) && canReadDestinations
    setOpen(nextOpen)
    setBotConnectionId("")
    setLinkToken(null)
    setCurrentTime(null)
    setError(null)

    if (shouldRefreshDestinations) router.refresh()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage || !selectedBot) {
      setError(t.destination.botRequired)
      return
    }

    setError(null)
    const selectedBotConnectionId = selectedBot.id
    startTransition(async () => {
      const result = await createTelegramLinkToken({
        botConnectionId: selectedBotConnectionId,
      })

      if (result.success) {
        const responseBot = activeBotConnections.find(
          (connection) =>
            connection.id === result.data.botConnectionId &&
            connection.status === "ACTIVE"
        )

        if (!responseBot) {
          const message = t.destination.botUnavailable
          setError(message)
          toast.error(message)
          return
        }

        setLinkToken(result.data)
        setCurrentTime(Date.now())
        toast.success(t.destination.linkCreated)
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  async function handleCopy() {
    if (!linkToken || linkExpired) return

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
      <DialogContent
        className="max-h-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogClose
          render={
            <Button
              type="button"
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
              disabled={isPending}
              aria-label={dictionary.common.close}
            />
          }
        >
          <X />
          <span className="sr-only">{dictionary.common.close}</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{t.destination.linkTitle}</DialogTitle>
          <DialogDescription>
            {linkToken
              ? t.destination.linkPendingDescription
              : t.destination.linkDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!linkToken ? (
            <FieldGroup>
              <Field>
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
                    setError(null)
                  }}
                  disabled={isPending || activeBotConnections.length === 0}
                >
                  <SelectTrigger
                    id="telegram-destination-bot"
                    className="w-full"
                  >
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
          ) : (
            <FieldGroup>
              {linkedBot ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dl className="min-w-0">
                      <dt className="text-sm text-muted-foreground">
                        {t.destination.bot}
                      </dt>
                      <dd className="font-medium break-words">
                        {getBotLabel(linkedBot, dictionary)}
                      </dd>
                    </dl>
                    <Badge
                      variant={linkExpired ? "warning" : "info"}
                      role="status"
                      aria-live="polite"
                    >
                      {linkExpired
                        ? t.destination.linkExpiredStatus
                        : t.destination.awaitingVerification}
                    </Badge>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="telegram-link-command">
                      {t.destination.linkCommand}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        ref={linkCommandRef}
                        id="telegram-link-command"
                        value={linkToken.startCommand}
                        readOnly
                        aria-label={t.destination.linkCommand}
                        rows={1}
                        wrap="soft"
                        className="max-h-24 min-h-8 px-1 py-1 font-mono text-xs break-all"
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
                    {!canReadDestinations ? (
                      <FieldDescription>
                        {t.destination.destinationReadPermissionRequired}
                      </FieldDescription>
                    ) : null}
                  </Field>
                </>
              ) : (
                <FieldError>{t.destination.botUnavailable}</FieldError>
              )}
            </FieldGroup>
          )}
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={linkToken ? "w-full sm:w-auto" : undefined}
                  disabled={isPending}
                />
              }
            >
              {dictionary.common.close}
            </DialogClose>
            {!linkToken ? (
              <Button
                type="submit"
                disabled={!canManage || !selectedBot || isPending}
              >
                {isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Link2 data-icon="inline-start" />
                )}
                {t.destination.createCommand}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
