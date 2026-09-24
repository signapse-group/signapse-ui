"use client"

import * as React from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { useDebouncedCallback } from "use-debounce"
import {
  ArrowUpIcon,
  BotMessageSquareIcon,
  ChevronDownIcon,
  CopyIcon,
  ClockIcon,
  MaximizeIcon,
  MinimizeIcon,
  PenLineIcon,
  SendIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createMarketConversation,
  getMarketConversationMessages,
  getMarketConversations,
  submitMarketConversationMessage,
} from "@/app/api/market-conversations/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  deriveMarketConversationTitle,
  normalizeMarketConversationMessages,
  reconcileMarketConversationMessages,
  type MarketChatMessageResponse,
  type MarketConversationSummaryResponse,
} from "@/app/lib/market-query/definitions"
import { buildFilterQuery } from "@/app/lib/utils"
import { Logo } from "@/components/logo"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller"
import {
  Popover,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PopoverContentInOverlay } from "@/components/ui/popover-content-in-overlay"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"
import { cn } from "@/lib/utils"

import styles from "./market-conversation-assistant.module.css"
import {
  buildConversationHistorySearchParams,
  getConversationHistoryFilterFields,
  getMessagePreviewText,
  getMessageText,
  getRenderableConversationMessages,
  getResponseRevealCount,
  getTrackingRailState,
  mergeConversationHistory,
  shouldLoadConversationHistory,
  shouldRenderAssistantMarkdown,
  splitResponseIntoGraphemes,
  type DemoConversationLabels,
} from "./history-state"
import { startAssistantSubmitMeasurement } from "./assistant-observability"
import {
  getMarketConversationSubmissionIdentity,
  type MarketConversationSubmissionIdentity,
} from "./submission-identity"

const USER_PREVIEW_LIMIT = 72
const ASSISTANT_PREVIEW_LIMIT = 160
const HISTORY_SCROLL_THRESHOLD = 32

const assistantMarkdownComponents: Components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h4>{children}</h4>,
  h3: ({ children }) => <h5>{children}</h5>,
  h4: ({ children }) => <h6>{children}</h6>,
  h5: ({ children }) => <h6>{children}</h6>,
  h6: ({ children }) => <h6>{children}</h6>,
  img: () => null,
  table: ({ children }) => (
    <div className="typeset-scroll">
      <table>{children}</table>
    </div>
  ),
}

interface MarketConversationAssistantProps {
  displayName: string | null
  workspaceId: number | null
}

interface ResponseRevealState {
  messageId: number
  segments: string[]
  fullText: string
  visibleCount: number
}

export function MarketConversationAssistant({
  displayName,
  workspaceId,
}: MarketConversationAssistantProps) {
  const { dictionary } = useLocalization()
  const labels = dictionary.demoConversation
  const [open, setOpen] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [messages, setMessages] = React.useState<MarketChatMessageResponse[]>(
    []
  )
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyQuery, setHistoryQuery] = React.useState("")
  const [historyConversations, setHistoryConversations] = React.useState<
    MarketConversationSummaryResponse[]
  >([])
  const [historyPage, setHistoryPage] = React.useState(0)
  const [hasMoreHistory, setHasMoreHistory] = React.useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false)
  const [historyError, setHistoryError] = React.useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] =
    React.useState<MarketConversationSummaryResponse | null>(null)
  const [isMessagesLoading, setIsMessagesLoading] = React.useState(false)
  const [isOlderMessagesLoading, setIsOlderMessagesLoading] =
    React.useState(false)
  const [initialMessagesError, setInitialMessagesError] = React.useState<
    string | null
  >(null)
  const [olderMessagesError, setOlderMessagesError] = React.useState<
    string | null
  >(null)
  const [draft, setDraft] = React.useState("")
  const [pendingUserMessage, setPendingUserMessage] = React.useState<
    string | null
  >(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null
  )
  const submissionIdentityRef =
    React.useRef<MarketConversationSubmissionIdentity | null>(null)
  const [responseReveal, setResponseReveal] =
    React.useState<ResponseRevealState | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = React.useState(false)
  const [nextBeforeMessageId, setNextBeforeMessageId] = React.useState<
    number | null
  >(null)
  const historyRequestIdRef = React.useRef(0)
  const historyLoadingRef = React.useRef(false)
  const historyLoadedQueryRef = React.useRef<string | null>(null)
  const messagesRequestIdRef = React.useRef(0)
  const olderMessagesLoadingRef = React.useRef(false)
  const revealedText = responseReveal
    ? responseReveal.segments.slice(0, responseReveal.visibleCount).join("")
    : null
  const displayMessages = responseReveal
    ? messages.map((message) =>
        message.id === responseReveal.messageId
          ? { ...message, content: revealedText }
          : message
      )
    : messages
  const renderableMessages = getRenderableConversationMessages(displayMessages)
  const currentTitle = selectedConversation?.title ?? labels.title
  const isRequestPending = isCreating || isSubmitting
  const isRevealing = responseReveal !== null
  const isBusy = isRequestPending || isRevealing
  const composerDisabled = workspaceId == null || isMessagesLoading || isBusy
  const composerError = createError ?? submissionError
  const pendingLabel = isCreating
    ? labels.creatingConversation
    : isSubmitting
      ? labels.sending
      : isRevealing
        ? labels.revealingResponse
        : null
  const revealMessageId = responseReveal?.messageId
  const revealSegments = responseReveal?.segments

  React.useEffect(() => {
    if (revealMessageId == null || revealSegments == null) {
      return
    }

    const startedAt = performance.now()
    let frameId = 0

    const updateReveal = (now: number) => {
      const visibleCount = getResponseRevealCount(
        now - startedAt,
        revealSegments.length
      )

      if (visibleCount >= revealSegments.length) {
        setResponseReveal((current) =>
          current?.messageId === revealMessageId ? null : current
        )
        return
      }

      setResponseReveal((current) =>
        current?.messageId === revealMessageId &&
        current.visibleCount !== visibleCount
          ? { ...current, visibleCount }
          : current
      )
      frameId = requestAnimationFrame(updateReveal)
    }

    frameId = requestAnimationFrame(updateReveal)
    return () => cancelAnimationFrame(frameId)
  }, [revealMessageId, revealSegments])

  const loadHistoryPage = React.useCallback(
    async (page: number, query: string) => {
      if (workspaceId == null || (page > 0 && historyLoadingRef.current)) {
        return
      }

      const requestId = ++historyRequestIdRef.current
      const filter = buildFilterQuery(getConversationHistoryFilterFields(query))
      historyLoadingRef.current = true
      setIsHistoryLoading(true)
      setHistoryError(null)

      if (page === 0) {
        setHistoryConversations([])
        setHistoryPage(0)
        setHasMoreHistory(false)
      }

      try {
        const result = await getMarketConversations(
          buildConversationHistorySearchParams(filter, page)
        )

        if (requestId !== historyRequestIdRef.current) {
          return
        }

        setHistoryConversations((current) =>
          mergeConversationHistory(current, result.content, page)
        )
        setHistoryPage(page)
        setHasMoreHistory(!result.last)
        if (page === 0) {
          historyLoadedQueryRef.current = query.trim()
        }
      } catch (error) {
        if (requestId === historyRequestIdRef.current) {
          setHistoryError(getErrorMessage(error, labels.historyError))
        }
      } finally {
        if (requestId === historyRequestIdRef.current) {
          historyLoadingRef.current = false
          setIsHistoryLoading(false)
        }
      }
    },
    [labels.historyError, workspaceId]
  )

  const searchHistory = useDebouncedCallback((query: string) => {
    void loadHistoryPage(0, query)
  }, 300)

  const loadConversation = React.useCallback(
    async (conversation: MarketConversationSummaryResponse) => {
      if (workspaceId == null) {
        return
      }

      const requestId = ++messagesRequestIdRef.current
      olderMessagesLoadingRef.current = false
      setSelectedConversation(conversation)
      setMessages([])
      setDraft("")
      setPendingUserMessage(null)
      setInitialMessagesError(null)
      setOlderMessagesError(null)
      setCreateError(null)
      setSubmissionError(null)
      submissionIdentityRef.current = null
      setResponseReveal(null)
      setHasMoreMessages(false)
      setNextBeforeMessageId(null)
      setIsOlderMessagesLoading(false)
      setIsMessagesLoading(true)

      try {
        const page = await getMarketConversationMessages(conversation.id)

        if (requestId !== messagesRequestIdRef.current) {
          return
        }

        setMessages(normalizeMarketConversationMessages(page.content))
        setHasMoreMessages(page.hasMore)
        setNextBeforeMessageId(page.nextBeforeMessageId ?? null)
      } catch (error) {
        if (requestId === messagesRequestIdRef.current) {
          setInitialMessagesError(
            getErrorMessage(error, labels.conversationError)
          )
        }
      } finally {
        if (requestId === messagesRequestIdRef.current) {
          setIsMessagesLoading(false)
        }
      }
    },
    [labels.conversationError, workspaceId]
  )

  const loadOlderMessages = React.useCallback(async () => {
    if (
      workspaceId == null ||
      !selectedConversation ||
      !hasMoreMessages ||
      nextBeforeMessageId == null ||
      olderMessagesLoadingRef.current
    ) {
      return false
    }

    const requestId = messagesRequestIdRef.current
    const conversationId = selectedConversation.id
    const beforeMessageId = nextBeforeMessageId
    olderMessagesLoadingRef.current = true
    setIsOlderMessagesLoading(true)
    setOlderMessagesError(null)

    try {
      const page = await getMarketConversationMessages(
        conversationId,
        beforeMessageId
      )

      if (requestId !== messagesRequestIdRef.current) {
        return false
      }

      setMessages((current) =>
        reconcileMarketConversationMessages(page.content, current)
      )
      setHasMoreMessages(page.hasMore)
      setNextBeforeMessageId(page.nextBeforeMessageId ?? null)
      return true
    } catch (error) {
      if (requestId === messagesRequestIdRef.current) {
        setOlderMessagesError(getErrorMessage(error, labels.olderMessagesError))
      }
      return false
    } finally {
      if (requestId === messagesRequestIdRef.current) {
        olderMessagesLoadingRef.current = false
        setIsOlderMessagesLoading(false)
      }
    }
  }, [
    hasMoreMessages,
    labels.olderMessagesError,
    nextBeforeMessageId,
    selectedConversation,
    workspaceId,
  ])

  function startNewConversation() {
    messagesRequestIdRef.current += 1
    historyRequestIdRef.current += 1
    historyLoadingRef.current = false
    historyLoadedQueryRef.current = null
    olderMessagesLoadingRef.current = false
    searchHistory.cancel()
    setSelectedConversation(null)
    setMessages([])
    setDraft("")
    setPendingUserMessage(null)
    setHistoryOpen(false)
    setHistoryQuery("")
    setHistoryConversations([])
    setHistoryPage(0)
    setHasMoreHistory(false)
    setIsHistoryLoading(false)
    setHistoryError(null)
    setIsMessagesLoading(false)
    setIsOlderMessagesLoading(false)
    setInitialMessagesError(null)
    setOlderMessagesError(null)
    setIsCreating(false)
    setIsSubmitting(false)
    setCreateError(null)
    setSubmissionError(null)
    submissionIdentityRef.current = null
    setResponseReveal(null)
    setHasMoreMessages(false)
    setNextBeforeMessageId(null)
  }

  async function submitMessage() {
    const message = draft.trim()

    if (workspaceId == null || !message || isBusy || isMessagesLoading) {
      return
    }

    const requestId = messagesRequestIdRef.current
    const submissionIdentity = getMarketConversationSubmissionIdentity(
      submissionIdentityRef.current,
      message
    )
    submissionIdentityRef.current = submissionIdentity
    let conversation = selectedConversation
    const performanceMeasurement = startAssistantSubmitMeasurement(
      conversation ? "existing" : "new"
    )
    let operation: "create" | "submit" = conversation ? "submit" : "create"
    let submissionSucceeded = false
    setCreateError(null)
    setSubmissionError(null)
    setPendingUserMessage(message)
    setDraft("")

    try {
      if (!conversation) {
        setIsCreating(true)
        const createResult = await createMarketConversation({
          title: deriveMarketConversationTitle(message),
        })

        if (requestId !== messagesRequestIdRef.current) {
          performanceMeasurement.finish("stale")
          return
        }

        if (!createResult.success) {
          performanceMeasurement.finish("error")
          setCreateError(createResult.error)
          return
        }

        conversation = createResult.data
        setSelectedConversation(conversation)
        setHistoryConversations((current) => [
          conversation!,
          ...current.filter((item) => item.id !== conversation!.id),
        ])
        setIsCreating(false)
      }

      if (!conversation) {
        performanceMeasurement.finish("error")
        return
      }

      const activeConversation = conversation
      operation = "submit"
      setIsSubmitting(true)
      const submitResult = await submitMarketConversationMessage(
        activeConversation.id,
        { message },
        submissionIdentity.idempotencyKey
      )

      if (requestId !== messagesRequestIdRef.current) {
        performanceMeasurement.finish("stale")
        return
      }

      if (!submitResult.success) {
        performanceMeasurement.finish("error")
        setSubmissionError(submitResult.error)
        return
      }

      const assistantMessage = submitResult.data.assistantMessage
      const assistantText = getMessageText(assistantMessage)
      performanceMeasurement.finish("success")
      const shouldReveal =
        assistantMessage.role === "ASSISTANT" &&
        assistantMessage.status === "COMPLETED" &&
        assistantText.trim().length > 0 &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches

      setResponseReveal(
        shouldReveal
          ? {
              messageId: assistantMessage.id,
              segments: splitResponseIntoGraphemes(assistantText),
              fullText: assistantText,
              visibleCount: 1,
            }
          : null
      )
      setMessages((current) =>
        reconcileMarketConversationMessages(current, [
          submitResult.data.userMessage,
          submitResult.data.assistantMessage,
        ])
      )
      setHistoryConversations((current) => [
        activeConversation,
        ...current.filter((item) => item.id !== activeConversation.id),
      ])
      submissionSucceeded = true
      submissionIdentityRef.current = null
    } catch (error) {
      if (requestId === messagesRequestIdRef.current) {
        performanceMeasurement.finish("error")
        const fallback =
          operation === "create"
            ? labels.createConversationError
            : labels.submissionError
        const message = getErrorMessage(error, fallback)

        if (operation === "create") {
          setCreateError(message)
        } else {
          setSubmissionError(message)
        }
      } else {
        performanceMeasurement.finish("stale")
      }
    } finally {
      if (requestId === messagesRequestIdRef.current) {
        setPendingUserMessage(null)
        if (!submissionSucceeded) {
          setDraft(message)
        }
        setIsCreating(false)
        setIsSubmitting(false)
      }
    }
  }

  function setHistoryPopoverOpen(nextOpen: boolean) {
    if (nextOpen && workspaceId == null) {
      return
    }

    setHistoryOpen(nextOpen)

    if (
      nextOpen &&
      shouldLoadConversationHistory({
        query: historyQuery,
        loadedQuery: historyLoadedQueryRef.current,
        isLoading: isHistoryLoading || historyLoadingRef.current,
        hasError: historyError !== null,
      })
    ) {
      void loadHistoryPage(0, historyQuery)
    }
  }

  function setAssistantOpen(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setHistoryOpen(false)
    }
  }

  function toggleConversationSize() {
    setHistoryOpen(false)
    setIsExpanded((current) => !current)
  }

  return (
    <Popover modal={false} open={open} onOpenChange={setAssistantOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            size="icon-lg"
            className="fixed end-4 bottom-4 size-11 [&_svg:not([class*='size-'])]:size-5"
            aria-label={dictionary.aiAssistant.open}
          />
        }
      >
        <BotMessageSquareIcon data-icon="inline-start" />
      </PopoverTrigger>
      <PopoverContentInOverlay
        side="top"
        align="end"
        sideOffset={12}
        collisionPadding={16}
        aria-label={currentTitle}
        className={cn(
          "max-h-[var(--available-height)] w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl",
          isExpanded
            ? "max-w-[min(64rem,var(--available-width))]"
            : "max-w-xl sm:max-w-xl"
        )}
      >
        <MessageScrollerProvider autoScroll>
          <div
            className={cn(
              "relative flex min-h-0 flex-col",
              isExpanded
                ? "h-[min(48rem,calc(var(--available-height)-1.25rem))]"
                : "h-[min(36rem,calc(var(--available-height)-1.25rem))]"
            )}
          >
            <div
              className={cn(
                "mx-auto flex min-h-0 w-full flex-1",
                isExpanded ? "max-w-5xl" : "max-w-xl"
              )}
            >
              <div className="flex h-full min-h-0 w-full flex-col">
                <PopoverHeader className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-0">
                  <PopoverTitle className="min-w-0">
                    {workspaceId != null ? (
                      <Popover
                        open={historyOpen}
                        onOpenChange={setHistoryPopoverOpen}
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              className="max-w-full justify-start"
                              aria-label={`${labels.historyTitle}: ${currentTitle}`}
                              disabled={isMessagesLoading || isBusy}
                            />
                          }
                        >
                          <span className="min-w-0 truncate">
                            {currentTitle}
                          </span>
                          <ChevronDownIcon data-icon="inline-end" />
                        </PopoverTrigger>
                        <PopoverContentInOverlay
                          align="start"
                          className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              value={historyQuery}
                              onValueChange={(value) => {
                                setHistoryQuery(value)
                                historyRequestIdRef.current += 1
                                historyLoadingRef.current = false
                                historyLoadedQueryRef.current = null
                                setIsHistoryLoading(true)
                                setHistoryConversations([])
                                setHistoryPage(0)
                                setHasMoreHistory(false)
                                setHistoryError(null)
                                searchHistory(value)
                              }}
                              placeholder={labels.historySearchPlaceholder}
                              aria-label={labels.historySearchLabel}
                            />
                            <CommandList
                              className="max-h-64"
                              aria-busy={isHistoryLoading}
                              onScroll={(event) => {
                                const target = event.currentTarget
                                const distanceToBottom =
                                  target.scrollHeight -
                                  target.scrollTop -
                                  target.clientHeight

                                if (
                                  distanceToBottom <=
                                    HISTORY_SCROLL_THRESHOLD &&
                                  hasMoreHistory &&
                                  !historyError &&
                                  !historyLoadingRef.current
                                ) {
                                  void loadHistoryPage(
                                    historyPage + 1,
                                    historyQuery
                                  )
                                }
                              }}
                            >
                              <CommandGroup heading={labels.historyTitle}>
                                {historyError ? (
                                  <RetryState
                                    message={historyError}
                                    retryLabel={labels.historyRetry}
                                    onRetry={() =>
                                      void loadHistoryPage(0, historyQuery)
                                    }
                                  />
                                ) : null}
                                {historyConversations.map((conversation) => (
                                  <CommandItem
                                    key={conversation.id}
                                    value={`${conversation.title} ${conversation.id}`}
                                    aria-selected={
                                      selectedConversation?.id ===
                                      conversation.id
                                    }
                                    data-checked={
                                      selectedConversation?.id ===
                                      conversation.id
                                    }
                                    className="min-w-0"
                                    onSelect={() => {
                                      setHistoryPopoverOpen(false)
                                      void loadConversation(conversation)
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === " ") {
                                        event.preventDefault()
                                        setHistoryPopoverOpen(false)
                                        void loadConversation(conversation)
                                      }
                                    }}
                                  >
                                    <span className="min-w-0 truncate">
                                      {conversation.title}
                                    </span>
                                  </CommandItem>
                                ))}
                                {isHistoryLoading ? (
                                  <div
                                    role="status"
                                    className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground"
                                  >
                                    <Spinner />
                                    {labels.historyLoading}
                                  </div>
                                ) : null}
                                {!isHistoryLoading &&
                                !historyError &&
                                historyConversations.length === 0 ? (
                                  <div className="px-2 py-3 text-sm text-muted-foreground">
                                    {labels.historyEmpty}
                                  </div>
                                ) : null}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContentInOverlay>
                      </Popover>
                    ) : (
                      <span className="block truncate">{currentTitle}</span>
                    )}
                  </PopoverTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.newConversation}
                      onClick={startNewConversation}
                      disabled={
                        workspaceId == null || isMessagesLoading || isBusy
                      }
                    >
                      <PenLineIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={
                        isExpanded
                          ? labels.collapseConversation
                          : labels.expandConversation
                      }
                      aria-pressed={isExpanded}
                      onClick={toggleConversationSize}
                    >
                      {isExpanded ? <MinimizeIcon /> : <MaximizeIcon />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.close}
                      onClick={() => setAssistantOpen(false)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </PopoverHeader>
                <Separator className="mt-2.5" />
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  {workspaceId == null ? (
                    <Empty className="h-full">
                      <EmptyHeader>
                        <EmptyTitle>{labels.noWorkspaceTitle}</EmptyTitle>
                        <EmptyDescription>
                          {labels.noWorkspaceDescription}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : isMessagesLoading ? (
                    <div
                      role="status"
                      aria-busy="true"
                      className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                      <Spinner />
                      {labels.conversationLoading}
                    </div>
                  ) : initialMessagesError &&
                    renderableMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <RetryState
                        message={initialMessagesError}
                        retryLabel={labels.conversationRetry}
                        onRetry={() => {
                          if (selectedConversation) {
                            void loadConversation(selectedConversation)
                          }
                        }}
                      />
                    </div>
                  ) : selectedConversation &&
                    renderableMessages.length === 0 &&
                    !isRequestPending ? (
                    <Empty className="h-full">
                      <EmptyHeader>
                        <EmptyTitle>{labels.conversationEmpty}</EmptyTitle>
                        <EmptyDescription>
                          {labels.persistedComposerHint}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : renderableMessages.length === 0 && !isRequestPending ? (
                    <Empty className="h-full">
                      <EmptyHeader>
                        <EmptyMedia aria-hidden="true">
                          <Logo />
                        </EmptyMedia>
                        <EmptyTitle>
                          {labels.emptyTitle},{" "}
                          {displayName || labels.emptyUserFallback}!
                        </EmptyTitle>
                        <EmptyDescription>
                          {labels.emptyDescription}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <MessageScroller>
                      <MessageScrollerViewport
                        aria-label={labels.messagesLabel}
                        className="!no-scrollbar"
                      >
                        <MessageScrollerContent
                          aria-busy={isBusy || isOlderMessagesLoading}
                          className="gap-0 p-3 sm:pr-10"
                        >
                          {olderMessagesError ? (
                            <div className="mb-6">
                              <RetryState
                                message={olderMessagesError}
                                retryLabel={labels.conversationRetry}
                                onRetry={() => void loadOlderMessages()}
                              />
                            </div>
                          ) : null}
                          {selectedConversation &&
                          !olderMessagesError &&
                          (hasMoreMessages || isOlderMessagesLoading) ? (
                            <LoadOlderMessages
                              anchorId={
                                renderableMessages[0]
                                  ? String(renderableMessages[0].id)
                                  : undefined
                              }
                              isLoading={isOlderMessagesLoading}
                              label={labels.loadOlderMessages}
                              loadingLabel={labels.loadingOlderMessages}
                              onLoad={loadOlderMessages}
                            />
                          ) : null}
                          {renderableMessages.map((message, index) => (
                            <DemoMessage
                              key={message.id}
                              accessibleText={
                                responseReveal?.messageId === message.id
                                  ? responseReveal.fullText
                                  : undefined
                              }
                              labels={labels}
                              message={message}
                              spacingClassName={
                                index === 0
                                  ? "mt-0"
                                  : renderableMessages[index - 1]?.role ===
                                      message.role
                                    ? "mt-1"
                                    : "mt-4"
                              }
                            />
                          ))}
                          {pendingUserMessage ? (
                            <div
                              className={cn(
                                "animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
                                renderableMessages.length === 0
                                  ? "mt-0"
                                  : renderableMessages.at(-1)?.role === "USER"
                                    ? "mt-1"
                                    : "mt-4"
                              )}
                            >
                              <Message align="end">
                                <MessageContent>
                                  <MessageHeader className="sr-only">
                                    {labels.userRole}
                                  </MessageHeader>
                                  <Bubble variant="default" align="end">
                                    <BubbleContent>
                                      <p className="whitespace-pre-wrap">
                                        {pendingUserMessage}
                                      </p>
                                    </BubbleContent>
                                  </Bubble>
                                </MessageContent>
                              </Message>
                            </div>
                          ) : null}
                          {isRequestPending ? (
                            <PendingAssistantMessage
                              label={labels.thinking}
                              roleLabel={labels.assistantRole}
                              spacingClassName={
                                pendingUserMessage
                                  ? "mt-4"
                                  : renderableMessages.length === 0
                                    ? "mt-0"
                                    : renderableMessages.at(-1)?.role ===
                                        "ASSISTANT"
                                      ? "mt-1"
                                      : "mt-4"
                              }
                            />
                          ) : null}
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton
                        aria-label={labels.scrollToLatest}
                        className="rounded-full"
                      />
                    </MessageScroller>
                  )}
                  <MessageTrackingRail
                    labels={labels}
                    messages={renderableMessages}
                  />
                </div>
                <footer className="pt-2.5">
                  {composerError ? (
                    <div
                      role="alert"
                      className="px-3 pb-2 text-sm text-destructive"
                    >
                      {composerError}
                    </div>
                  ) : null}
                  <form
                    aria-label={labels.persistedComposerLabel}
                    aria-busy={isBusy}
                    onSubmit={(event) => {
                      event.preventDefault()
                      void submitMessage()
                    }}
                    className="w-full"
                  >
                    <InputGroup className="rounded-xl border-0">
                      <InputGroupTextarea
                        value={draft}
                        rows={2}
                        placeholder={labels.persistedComposerPlaceholder}
                        aria-label={labels.persistedComposerLabel}
                        aria-invalid={Boolean(composerError)}
                        disabled={composerDisabled}
                        onChange={(event) => {
                          setDraft(event.target.value)
                          submissionIdentityRef.current = null
                          setCreateError(null
                          setSubmissionError(null)
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault()
                            event.currentTarget.form?.requestSubmit()
                          }
                        }}
                      />
                      <InputGroupAddon align="block-end" className="pt-1">
                        <InputGroupButton
                          type="submit"
                          variant="default"
                          size="icon-sm"
                          disabled={
                            composerDisabled || draft.trim().length === 0
                          }
                          className="ml-auto"
                          aria-label={pendingLabel ?? labels.send}
                        >
                          {isBusy ? <Spinner /> : <ArrowUpIcon />}
                          <span className="sr-only">
                            {pendingLabel ?? labels.send}
                          </span>
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </form>
                </footer>
              </div>
            </div>
          </div>
        </MessageScrollerProvider>
      </PopoverContentInOverlay>
    </Popover>
  )
}

function RetryState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string
  retryLabel: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-2 py-3 text-center"
    >
      <span className="text-sm">{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  )
}

function LoadOlderMessages({
  anchorId,
  isLoading,
  label,
  loadingLabel,
  onLoad,
}: {
  anchorId?: string
  isLoading: boolean
  label: string
  loadingLabel: string
  onLoad: () => Promise<boolean>
}) {
  const { scrollToMessage } = useMessageScroller()

  return (
    <div className="mb-6 flex justify-center">
      <Button
        type="button"
        variant="ghost"
        disabled={isLoading}
        onClick={async () => {
          const loaded = await onLoad()

          if (loaded && anchorId) {
            requestAnimationFrame(() => {
              void scrollToMessage(anchorId)
            })
          }
        }}
      >
        {isLoading ? <Spinner /> : null}
        {isLoading ? loadingLabel : label}
      </Button>
    </div>
  )
}

function MessageTrackingRail({
  labels,
  messages,
}: {
  labels: DemoConversationLabels
  messages: MarketChatMessageResponse[]
}) {
  const railRef = React.useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const { scrollToMessage } = useMessageScroller()
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()
  const turns = messages.flatMap((message, index) =>
    message.role === "USER"
      ? [
          {
            user: message,
            assistant:
              messages[index + 1]?.role === "ASSISTANT"
                ? messages[index + 1]
                : undefined,
          },
        ]
      : []
  )

  React.useEffect(() => {
    if (!currentAnchorId) {
      return
    }

    railRef.current
      ?.querySelector<HTMLElement>(
        `[data-message-id="${CSS.escape(currentAnchorId)}"]`
      )
      ?.scrollIntoView({ block: "nearest" })
  }, [currentAnchorId])

  if (turns.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={labels.trackingLabel}
      className="absolute inset-y-2 right-1 hidden w-8 overflow-hidden sm:block"
    >
      <div
        ref={railRef}
        className="no-scrollbar h-full scroll-fade overflow-y-auto overscroll-contain"
      >
        <div className="flex min-h-full flex-col items-end justify-center">
          {turns.map((turn, index) => {
            const messageId = String(turn.user.id)
            const isActive = currentAnchorId === messageId
            const isVisible = visibleMessageIds.includes(messageId)
            const railState = getTrackingRailState({
              index,
              hoveredIndex,
              isActive,
              isVisible,
            })
            const userPreview = truncatePreview(
              getMessagePreviewText(turn.user, labels.messageFailed),
              USER_PREVIEW_LIMIT
            )
            const assistantPreview = truncatePreview(
              turn.assistant
                ? getMessagePreviewText(turn.assistant, labels.messageFailed)
                : labels.assistantResponseUnavailable,
              ASSISTANT_PREVIEW_LIMIT
            )

            return (
              <HoverCard key={turn.user.id}>
                <HoverCardTrigger
                  delay={150}
                  closeDelay={100}
                  render={
                    <button
                      type="button"
                      data-message-id={messageId}
                      aria-label={`${labels.jumpToTurn} ${index + 1}`}
                      aria-current={isActive ? "step" : undefined}
                      className="flex h-2.5 w-8 shrink-0 items-center justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onPointerEnter={() => setHoveredIndex(index)}
                      onPointerLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        void scrollToMessage(messageId)
                      }}
                    />
                  }
                >
                  <span aria-hidden="true" className="relative h-0.5 w-1.5">
                    <span
                      className={cn(
                        "absolute inset-y-0 right-0 rounded-full transition-[width] duration-150 ease-out motion-reduce:transition-none",
                        railState.tone === "active"
                          ? "bg-foreground"
                          : railState.tone === "visible"
                            ? "bg-muted-foreground"
                            : "bg-muted-foreground/40"
                      )}
                      style={{ width: railState.width }}
                    />
                  </span>
                </HoverCardTrigger>
                <HoverCardContent
                  side="left"
                  align="center"
                  sideOffset={8}
                  className="w-80 max-w-[calc(100vw-2rem)] bg-muted ring-0"
                >
                  <div className="flex flex-col gap-1">
                    <p className="line-clamp-2 font-medium">{userPreview}</p>
                    <p className="line-clamp-3 text-muted-foreground">
                      {assistantPreview}
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function truncatePreview(text: string, maxLength: number) {
  const trimmedText = text.trim()

  return trimmedText.length > maxLength
    ? `${trimmedText.slice(0, maxLength).trimEnd()}…`
    : trimmedText
}

function DemoMessage({
  accessibleText,
  labels,
  message,
  spacingClassName,
}: {
  accessibleText?: string
  labels: DemoConversationLabels
  message: MarketChatMessageResponse
  spacingClassName: "mt-0" | "mt-1" | "mt-4"
}) {
  const isUser = message.role === "USER"
  const text = getMessageText(message)
  const isFailedAssistant =
    message.role === "ASSISTANT" && message.status === "FAILED"
  const shouldRenderMarkdown = shouldRenderAssistantMarkdown(
    message,
    accessibleText !== undefined
  )
  const failureText = message.failureReason?.trim() || labels.messageFailed
  const hasContent = text.trim().length > 0
  const hasStableAssistantContent =
    message.role === "ASSISTANT" &&
    message.status === "COMPLETED" &&
    hasContent &&
    accessibleText === undefined
  const canCopy = isUser ? hasContent : hasStableAssistantContent
  const createdAt = useLocalization().formatDateTime(
    message.createdDate,
    { weekday: "short", hour: "2-digit", minute: "2-digit" },
    "-"
  )
  const timeMetadata = (
    <AppTimeMetadata icon={ClockIcon}>
      <time
        aria-label={`${labels.createdAt}: ${createdAt}`}
        dateTime={message.createdDate}
      >
        {createdAt}
      </time>
    </AppTimeMetadata>
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(labels.copySuccess)
    } catch {
      toast.error(labels.copyError)
    }
  }

  const messageActions = canCopy ? (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={labels.copy}
              onClick={() => void handleCopy()}
            />
          }
        >
          <CopyIcon />
        </TooltipTrigger>
        <TooltipContentInOverlay>{labels.copy}</TooltipContentInOverlay>
      </Tooltip>
      {hasStableAssistantContent ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={labels.sendToTelegram}
                onClick={() => toast.info(labels.telegramUnavailable)}
              />
            }
          >
            <SendIcon />
          </TooltipTrigger>
          <TooltipContentInOverlay>
            {labels.sendToTelegram}
          </TooltipContentInOverlay>
        </Tooltip>
      ) : null}
    </div>
  ) : null

  return (
    <MessageScrollerItem
      messageId={String(message.id)}
      scrollAnchor={isUser}
      className={`animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none ${spacingClassName}`}
    >
      <Message align={isUser ? "end" : "start"}>
        <MessageContent className="gap-1">
          <MessageHeader className="sr-only">
            {isUser ? labels.userRole : labels.assistantRole}
          </MessageHeader>
          {text.trim() ? (
            <Bubble
              variant={isUser ? "default" : "ghost"}
              align={isUser ? "end" : "start"}
            >
              <BubbleContent
                className={shouldRenderMarkdown ? "w-full" : undefined}
              >
                {shouldRenderMarkdown ? (
                  <div className={cn("typeset w-full", styles.markdown)}>
                    <Markdown
                      components={assistantMarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                      skipHtml
                    >
                      {text}
                    </Markdown>
                  </div>
                ) : (
                  <>
                    <p
                      aria-hidden={
                        accessibleText === undefined ? undefined : true
                      }
                      className="whitespace-pre-wrap"
                    >
                      {text}
                    </p>
                    {accessibleText === undefined ? null : (
                      <p className="sr-only">{accessibleText}</p>
                    )}
                  </>
                )}
              </BubbleContent>
            </Bubble>
          ) : null}
          {isFailedAssistant ? (
            <Marker role="alert">
              <MarkerIcon>
                <TriangleAlertIcon />
              </MarkerIcon>
              <MarkerContent>{failureText}</MarkerContent>
            </Marker>
          ) : null}
          <MessageFooter className="mt-0 gap-1 transition-opacity duration-150 motion-reduce:transition-none [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/message:pointer-events-auto [@media(hover:hover)]:group-focus-within/message:opacity-100 [@media(hover:hover)]:group-hover/message:pointer-events-auto [@media(hover:hover)]:group-hover/message:opacity-100">
            {isUser ? timeMetadata : null}
            {messageActions}
            {!isUser ? timeMetadata : null}
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}

function PendingAssistantMessage({
  label,
  roleLabel,
  spacingClassName,
}: {
  label: string
  roleLabel: string
  spacingClassName: "mt-0" | "mt-1" | "mt-4"
}) {
  return (
    <div className={spacingClassName}>
      <Message align="start">
        <MessageContent>
          <MessageHeader className="sr-only">{roleLabel}</MessageHeader>
          <Marker role="status">
            <MarkerIcon>
              <Spinner className="motion-reduce:animate-none" />
            </MarkerIcon>
            <MarkerContent className={styles.shimmer}>{label}</MarkerContent>
          </Marker>
        </MessageContent>
      </Message>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
