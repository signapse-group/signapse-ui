"use client"

import * as React from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { useDebouncedCallback } from "use-debounce"
import {
  ArrowUpIcon,
  CheckIcon,
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
  type IdentifiedMarketConversationSummaryResponse,
  normalizeMarketConversationMessages,
  reconcileMarketConversationMessages,
  type MarketChatMessageResponse,
} from "@/app/lib/market-query/definitions"
import {
  parseMarketConversationTurnProgressStep,
  upsertMarketConversationTurnProgressStep,
  type CompleteMarketConversationTurnProgressStep,
} from "@/app/lib/market-query/turn-progress"
import { buildFilterQuery } from "@/app/lib/utils"
import { Logo } from "@/components/logo"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
  useSidebar,
} from "@/components/ui/sidebar"
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
import { streamMarketConversationTurn } from "./turn-stream"

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

interface ConversationTurnProgressState {
  conversationId: number
  submissionId: number
  question: string
  userMessage: MarketChatMessageResponse
  expiresAt: string
  steps: CompleteMarketConversationTurnProgressStep[]
  lastSequence: number
  status: "streaming" | "interrupted" | "completed" | "failed"
  expired: boolean
  error?: string
}

export function MarketConversationAssistant({
  displayName,
  workspaceId,
}: MarketConversationAssistantProps) {
  const { dictionary } = useLocalization()
  const { isMobile, open: isSidebarOpen } = useSidebar()
  const labels = dictionary.demoConversation
  const [open, setOpen] = React.useState(false)
  const composerRef = React.useRef<HTMLTextAreaElement>(null)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [messages, setMessages] = React.useState<MarketChatMessageResponse[]>(
    []
  )
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyQuery, setHistoryQuery] = React.useState("")
  const [historyConversations, setHistoryConversations] = React.useState<
    IdentifiedMarketConversationSummaryResponse[]
  >([])
  const [historyPage, setHistoryPage] = React.useState(0)
  const [hasMoreHistory, setHasMoreHistory] = React.useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false)
  const [historyError, setHistoryError] = React.useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] =
    React.useState<IdentifiedMarketConversationSummaryResponse | null>(null)
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
  const [activeTurnMessageId, setActiveTurnMessageId] = React.useState<
    number | null
  >(null)
  const [turnProgressByMessageId, setTurnProgressByMessageId] = React.useState<
    Record<number, ConversationTurnProgressState>
  >({})
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null
  )
  const submissionIdentityRef =
    React.useRef<MarketConversationSubmissionIdentity | null>(null)
  const submissionLockRef = React.useRef(false)
  const turnStreamAttemptRef = React.useRef(0)
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
  const isFullMode = isExpanded && !isMobile
  const isRevealing = responseReveal !== null
  const isTurnActive = activeTurnMessageId !== null
  const isBusy = isRequestPending || isRevealing || isTurnActive
  const composerDisabled = workspaceId == null || isMessagesLoading || isBusy
  const composerError = createError ?? submissionError
  const pendingLabel = isCreating
    ? labels.creatingConversation
    : isSubmitting
      ? labels.sending
      : isTurnActive
        ? labels.questionReceived
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

        const conversations = result.content.map((conversation) => {
          if (typeof conversation.id !== "number") {
            throw new Error(labels.historyError)
          }

          return { ...conversation, id: conversation.id }
        })

        setHistoryConversations((current) =>
          mergeConversationHistory(current, conversations, page)
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
    async (conversation: IdentifiedMarketConversationSummaryResponse) => {
      if (workspaceId == null) {
        return
      }

      const requestId = ++messagesRequestIdRef.current
      olderMessagesLoadingRef.current = false
      setSelectedConversation(conversation)
      setMessages([])
      setDraft("")
      setPendingUserMessage(null)
      setActiveTurnMessageId(null)
      setTurnProgressByMessageId({})
      turnStreamAttemptRef.current += 1
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
    setActiveTurnMessageId(null)
    setTurnProgressByMessageId({})
    turnStreamAttemptRef.current += 1
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

  async function followAcceptedTurn(
    turn: ConversationTurnProgressState,
    afterSequence = 0
  ) {
    const requestId = messagesRequestIdRef.current
    const attemptId = ++turnStreamAttemptRef.current
    setTurnProgressByMessageId((current) => ({
      ...current,
      [turn.userMessage.id]: {
        ...current[turn.userMessage.id],
        status: "streaming",
        error: undefined,
      },
    }))

    try {
      const result = await streamMarketConversationTurn(
        {
          conversationId: turn.conversationId,
          submissionId: turn.submissionId,
          afterSequence,
          onProgress: (payload) => {
            if (
              requestId !== messagesRequestIdRef.current ||
              attemptId !== turnStreamAttemptRef.current
            ) {
              return
            }

            const step = parseMarketConversationTurnProgressStep(payload)
            if (!step) return

            setTurnProgressByMessageId((current) => {
              const latest = current[turn.userMessage.id]
              if (!latest) return current

              const steps = upsertMarketConversationTurnProgressStep(
                latest.steps,
                step
              )
              return {
                ...current,
                [turn.userMessage.id]: {
                  ...latest,
                  steps,
                  lastSequence: Math.max(
                    latest.lastSequence,
                    step.sequenceNumber
                  ),
                },
              }
            })
          },
        },
        dictionary.marketConversations.streamError
      )

      if (
        requestId !== messagesRequestIdRef.current ||
        attemptId !== turnStreamAttemptRef.current
      ) {
        return null
      }

      if (result.userMessage.id !== turn.userMessage.id) {
        throw new Error(dictionary.marketConversations.streamError)
      }

      setMessages((current) =>
        reconcileMarketConversationMessages(current, [
          result.userMessage,
          result.assistantMessage,
        ])
      )
      const failed = result.assistantMessage.status === "FAILED"
      setTurnProgressByMessageId((current) => {
        const latest = current[turn.userMessage.id]
        if (!latest) return current

        return {
          ...current,
          [turn.userMessage.id]: {
            ...latest,
            status: failed ? "failed" : "completed",
            expired:
              failed && Date.now() >= new Date(latest.expiresAt).getTime(),
            error: undefined,
          },
        }
      })
      setActiveTurnMessageId((current) =>
        current === turn.userMessage.id ? null : current
      )
      return result
    } catch {
      if (
        requestId !== messagesRequestIdRef.current ||
        attemptId !== turnStreamAttemptRef.current
      ) {
        return null
      }

      setTurnProgressByMessageId((current) => {
        const latest = current[turn.userMessage.id]
        if (!latest) return current

        return {
          ...current,
          [turn.userMessage.id]: {
            ...latest,
            status: "interrupted",
            error: labels.streamInterrupted,
          },
        }
      })
      return null
    }
  }

  async function submitMessage(question?: string, forceNewIdentity = false) {
    const message = (question ?? draft).trim()

    if (
      workspaceId == null ||
      !message ||
      isBusy ||
      isMessagesLoading ||
      submissionLockRef.current
    ) {
      return
    }

    submissionLockRef.current = true
    const draftAtSubmit = draft
    if (forceNewIdentity) submissionIdentityRef.current = null
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
    let submissionAccepted = false
    setCreateError(null)
    setSubmissionError(null)
    setPendingUserMessage(message)
    if (question === undefined) setDraft("")

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

      const acceptedTurn = submitResult.data
      const turn: ConversationTurnProgressState = {
        conversationId: activeConversation.id,
        submissionId: acceptedTurn.submissionId,
        question: message,
        userMessage: acceptedTurn.userMessage,
        expiresAt: acceptedTurn.expiresAt,
        steps: [],
        lastSequence: 0,
        status: "streaming",
        expired: false,
      }
      submissionAccepted = true
      submissionIdentityRef.current = null
      setPendingUserMessage(null)
      setIsSubmitting(false)
      setMessages((current) =>
        reconcileMarketConversationMessages(current, [acceptedTurn.userMessage])
      )
      setTurnProgressByMessageId((current) => ({
        ...current,
        [acceptedTurn.userMessage.id]: turn,
      }))
      setActiveTurnMessageId(acceptedTurn.userMessage.id)
      setHistoryConversations((current) => [
        activeConversation,
        ...current.filter((item) => item.id !== activeConversation.id),
      ])

      const result = await followAcceptedTurn(turn)
      if (!result) {
        performanceMeasurement.finish("error")
        return
      }

      const assistantMessage = result.assistantMessage
      const assistantText = getMessageText(assistantMessage)
      const shouldReveal =
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
      performanceMeasurement.finish(
        assistantMessage.status === "FAILED" ? "error" : "success"
      )
    } catch (error) {
      if (requestId === messagesRequestIdRef.current) {
        performanceMeasurement.finish("error")
        const fallback =
          operation === "create"
            ? labels.createConversationError
            : labels.submissionError
        const errorMessage = getErrorMessage(error, fallback)

        if (operation === "create") {
          setCreateError(errorMessage)
        } else {
          setSubmissionError(errorMessage)
        }
      } else {
        performanceMeasurement.finish("stale")
      }
    } finally {
      submissionLockRef.current = false
      if (requestId === messagesRequestIdRef.current) {
        setPendingUserMessage(null)
        if (!submissionAccepted) {
          setDraft(question === undefined ? message : draftAtSubmit)
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
    <Popover
      modal={false}
      open={open}
      onOpenChange={setAssistantOpen}
      onOpenChangeComplete={(nextOpen) => {
        if (nextOpen) composerRef.current?.focus()
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "fixed end-4 bottom-4 h-12 w-[10.5rem] justify-start rounded-2xl px-4 text-base has-data-[icon=inline-start]:pl-4",
              open && "invisible"
            )}
            aria-label={dictionary.aiAssistant.launcher}
            aria-hidden={open}
            tabIndex={open ? -1 : undefined}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-7 shrink-0 items-center justify-center"
              data-icon="inline-start"
            >
              <Logo width={28} height={28} />
            </span>
            <span>{dictionary.aiAssistant.launcher}</span>
          </Button>
        }
      />
      <PopoverContentInOverlay
        side="top"
        align="end"
        sideOffset={12}
        collisionPadding={16}
        positionMethod="fixed"
        positionerClassName={
          isFullMode ? styles.fullModePositioner : styles.compactModePositioner
        }
        positionerStyle={
          isFullMode
            ? ({
                "--assistant-sidebar-width": isSidebarOpen
                  ? SIDEBAR_WIDTH
                  : SIDEBAR_WIDTH_ICON,
              } as React.CSSProperties)
            : undefined
        }
        aria-label={currentTitle}
        className={cn(
          isFullMode ? styles.fullModePopup : undefined,
          "max-h-[var(--available-height)] w-full gap-0 overflow-hidden rounded-2xl",
          isFullMode
            ? "h-full max-h-none w-full max-w-full"
            : isExpanded
              ? "max-w-[min(64rem,var(--available-width))]"
              : "max-w-full"
        )}
      >
        <MessageScrollerProvider autoScroll>
          <div
            className={cn(
              "relative flex min-h-0 flex-col",
              isFullMode
                ? "h-full"
                : isExpanded
                  ? "h-[min(48rem,calc(var(--available-height)-1.25rem))]"
                  : "h-[min(36rem,calc(var(--available-height)-1.25rem))]"
            )}
          >
            <div
              className={cn(
                "mx-auto flex min-h-0 w-full flex-1",
                isFullMode
                  ? "max-w-none"
                  : isExpanded
                    ? "max-w-5xl"
                    : "max-w-xl"
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
                                    value={`${conversation.title ?? ""} ${conversation.id}`}
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
                                      {conversation.title ?? labels.title}
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
                          aria-busy={
                            isMessagesLoading || isOlderMessagesLoading
                          }
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
                              turnProgress={turnProgressByMessageId[message.id]}
                              onReconnectTurn={() => {
                                const turn = turnProgressByMessageId[message.id]
                                if (turn?.status === "interrupted") {
                                  void followAcceptedTurn(
                                    turn,
                                    turn.lastSequence
                                  )
                                }
                              }}
                              onRetryTurn={() => {
                                const turn = turnProgressByMessageId[message.id]
                                if (turn?.status === "failed") {
                                  void submitMessage(turn.question, true)
                                }
                              }}
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
                            <MessageScrollerItem
                              messageId="pending-user-message"
                              scrollAnchor
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
                                  <Bubble variant="muted" align="end">
                                    <BubbleContent>
                                      <p className="whitespace-pre-wrap">
                                        {pendingUserMessage}
                                      </p>
                                    </BubbleContent>
                                  </Bubble>
                                  <Marker role="status" className="justify-end">
                                    <MarkerContent>
                                      {labels.sending}
                                    </MarkerContent>
                                  </Marker>
                                </MessageContent>
                              </Message>
                            </MessageScrollerItem>
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
                        ref={composerRef}
                        value={draft}
                        rows={2}
                        placeholder={labels.persistedComposerPlaceholder}
                        aria-label={labels.persistedComposerLabel}
                        aria-invalid={Boolean(composerError)}
                        disabled={composerDisabled}
                        onChange={(event) => {
                          setDraft(event.target.value)
                          submissionIdentityRef.current = null
                          setCreateError(null)
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
                          className="ml-auto rounded-full"
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
                  <p className="pt-2 text-center text-xs leading-4 text-muted-foreground">
                    {labels.aiNotice}
                  </p>
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
  turnProgress,
  onReconnectTurn,
  onRetryTurn,
  spacingClassName,
}: {
  accessibleText?: string
  labels: DemoConversationLabels
  message: MarketChatMessageResponse
  turnProgress?: ConversationTurnProgressState
  onReconnectTurn?: () => void
  onRetryTurn?: () => void
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
  const { formatDateTime } = useLocalization()
  const createdAt = message.createdDate
    ? formatDateTime(
        message.createdDate,
        { weekday: "short", hour: "2-digit", minute: "2-digit" },
        "-"
      )
    : null
  const timeMetadata =
    message.createdDate && createdAt ? (
      <AppTimeMetadata icon={ClockIcon}>
        <time
          aria-label={`${labels.createdAt}: ${createdAt}`}
          dateTime={message.createdDate}
        >
          {createdAt}
        </time>
      </AppTimeMetadata>
    ) : null

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
              variant={isUser ? "muted" : "ghost"}
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
      {isUser && turnProgress ? (
        <TurnProgressView
          labels={labels}
          turn={turnProgress}
          onReconnect={onReconnectTurn}
          onRetry={onRetryTurn}
        />
      ) : null}
    </MessageScrollerItem>
  )
}

function TurnProgressView({
  labels,
  turn,
  onReconnect,
  onRetry,
}: {
  labels: DemoConversationLabels
  turn: ConversationTurnProgressState
  onReconnect?: () => void
  onRetry?: () => void
}) {
  const understandingSteps = turn.steps.filter(
    (step) => step.stepType === "UNDERSTANDING" && step.publicMessage?.trim()
  )
  const toolSteps = turn.steps.filter((step) => step.stepType === "TOOL")
  const showThinking =
    turn.status === "streaming" &&
    understandingSteps.length === 0 &&
    toolSteps.length === 0

  return (
    <div className="mt-3 flex flex-col gap-3">
      <Marker role="status" aria-live="polite">
        <MarkerIcon>
          {turn.status === "streaming" ? (
            <Spinner className="motion-reduce:animate-none" />
          ) : turn.status === "interrupted" || turn.status === "failed" ? (
            <TriangleAlertIcon />
          ) : (
            <CheckIcon />
          )}
        </MarkerIcon>
        <MarkerContent>{labels.questionReceived}</MarkerContent>
      </Marker>
      {showThinking ? (
        <Marker role="status">
          <MarkerIcon>
            <Spinner className="motion-reduce:animate-none" />
          </MarkerIcon>
          <MarkerContent className={styles.shimmer}>
            {labels.thinking}
          </MarkerContent>
        </Marker>
      ) : null}
      {understandingSteps.map((step) => (
        <Message
          key={step.stepId}
          align="start"
          aria-live="polite"
          className="animate-in fade-in motion-reduce:animate-none"
        >
          <MessageContent className="gap-1">
            <MessageHeader className="sr-only">
              {labels.assistantRole}
            </MessageHeader>
            <Bubble variant="ghost" align="start">
              <BubbleContent>
                <p className="whitespace-pre-wrap">{step.publicMessage}</p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      ))}
      {toolSteps.length > 0 ? (
        <TaskProgressGroup labels={labels} steps={toolSteps} turn={turn} />
      ) : null}
      {turn.status === "interrupted" ? (
        <Marker role="alert" className="flex-wrap">
          <MarkerIcon>
            <TriangleAlertIcon />
          </MarkerIcon>
          <MarkerContent>
            {turn.error || labels.streamInterrupted}
          </MarkerContent>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onReconnect}
          >
            {labels.streamRetry}
          </Button>
        </Marker>
      ) : null}
      {turn.status === "failed" ? (
        <Marker role="alert" className="flex-wrap">
          <MarkerIcon>
            <TriangleAlertIcon />
          </MarkerIcon>
          <MarkerContent>
            {turn.expired ? labels.turnExpired : labels.messageFailed}
          </MarkerContent>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {labels.retryTurn}
          </Button>
        </Marker>
      ) : null}
    </div>
  )
}

function TaskProgressGroup({
  labels,
  steps,
  turn,
}: {
  labels: DemoConversationLabels
  steps: CompleteMarketConversationTurnProgressStep[]
  turn: ConversationTurnProgressState
}) {
  const [open, setOpen] = React.useState(turn.status === "streaming")
  const hasFailed =
    turn.status === "failed" || steps.some((step) => step.status === "FAILED")
  const isRunning =
    turn.status === "streaming" ||
    turn.status === "interrupted" ||
    steps.some((step) => step.status === "IN_PROGRESS")
  const statusLabel = hasFailed
    ? labels.taskFailed
    : turn.status === "completed" ||
        steps.every((step) => step.status === "COMPLETED")
      ? labels.taskCompleted
      : labels.taskInProgress

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-card/50"
    >
      <CollapsibleTrigger
        aria-label={`${labels.taskProgress}: ${statusLabel}`}
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-2 rounded-lg px-3 py-2 text-left"
          >
            {hasFailed ? (
              <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
            ) : isRunning ? (
              <Spinner className="size-4 shrink-0 motion-reduce:animate-none" />
            ) : (
              <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium">
              {labels.taskProgress}
            </span>
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 transition-transform motion-reduce:transition-none",
                open && "rotate-180"
              )}
            />
          </Button>
        }
      />
      <CollapsibleContent>
        <ol className="ml-5 flex flex-col gap-2 border-l py-1 pr-3 pb-3 pl-4">
          {steps.map((step) => (
            <li
              key={step.stepId}
              role="status"
              className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground"
              aria-label={`${step.publicMessage?.trim() || labels.toolStep}: ${getTurnStepStatusLabel(step.status, labels)}`}
            >
              {step.status === "IN_PROGRESS" ? (
                <Spinner className="mt-0.5 size-4 shrink-0 motion-reduce:animate-none" />
              ) : step.status === "FAILED" ? (
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <CheckIcon className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 wrap-break-word">
                {step.publicMessage?.trim() || labels.toolStep}
              </span>
              <span className="shrink-0 text-xs">
                {getTurnStepStatusLabel(step.status, labels)}
              </span>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

function getTurnStepStatusLabel(
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED",
  labels: DemoConversationLabels
) {
  switch (status) {
    case "IN_PROGRESS":
      return labels.stepInProgress
    case "COMPLETED":
      return labels.stepCompleted
    case "FAILED":
      return labels.stepFailed
  }
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
