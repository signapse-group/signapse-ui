"use client"

import { AlertTriangle, ArrowUpRight, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react"

import { getEventById } from "@/app/api/events/action"
import { getNewsArticleById } from "@/app/api/news-articles/action"
import { EVENT_READ_PERMISSIONS } from "@/app/lib/events/permissions"
import type { EventResponse } from "@/app/lib/events/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { NEWS_ARTICLE_READ_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import type { NewsArticleResponse } from "@/app/lib/news-articles/definitions"
import { AccessDenied } from "@/components/access-denied"
import { LocalizedLink as Link } from "@/components/localized-link"
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import {
  DrawerContentInOverlay,
  DrawerInOverlay,
} from "@/components/ui/drawer-content-in-overlay"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { useHasAnyPermission } from "@/components/permission-provider"
import { cn } from "@/lib/utils"

import { EventQuickDetailContent } from "./events/event-quick-detail-content"
import { NewsArticleQuickDetailContent } from "./news-articles/news-article-quick-detail-content"
import {
  resolveLocalQuickDetailPresentation,
  type LocalQuickDetailOwner,
} from "./local-entity-quick-detail-presentation"

export type LocalQuickDetailEntity =
  { id: number; kind: "event" } | { id: number; kind: "news-article" }

export type LocalQuickDetailFixture =
  | {
      entity: { id: number; kind: "event" }
      event: EventResponse
    }
  | {
      article: NewsArticleResponse
      entity: { id: number; kind: "news-article" }
    }

type DetailSession = {
  entityKey: string
  retryNonce: number
  sessionId: number
}

type DetailState =
  | { phase: "idle" }
  | ({ phase: "loading" } & DetailSession)
  | ({ phase: "event"; event: EventResponse } & DetailSession)
  | ({ phase: "news-article"; article: NewsArticleResponse } & DetailSession)
  | ({ phase: "error"; error: string | null } & DetailSession)
  | ({ phase: "missing" } & DetailSession)
  | ({ phase: "denied" } & DetailSession)

interface LocalEntityQuickDetailDrawerProps {
  entity: LocalQuickDetailEntity | null
  fixture?: LocalQuickDetailFixture | null
  onBeforeClose?: () => void
  onClose: () => void
  owner: LocalQuickDetailOwner
  returnFocusRef?: RefObject<HTMLElement | null> | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null
  }

  const status = (error as { status?: unknown }).status

  return typeof status === "number" ? status : null
}

function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback)
  window.visualViewport?.addEventListener("resize", callback)

  return () => {
    window.removeEventListener("resize", callback)
    window.visualViewport?.removeEventListener("resize", callback)
  }
}

function getViewportWidth() {
  return Math.round(window.visualViewport?.width ?? window.innerWidth)
}

function getServerViewportWidth() {
  return 1024
}

function useViewportWidth() {
  return useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth
  )
}

function getCanonicalHref(entity: LocalQuickDetailEntity) {
  return entity.kind === "event"
    ? `/events/${entity.id}`
    : `/news-articles/${entity.id}`
}

function getDrawerStyle(
  presentation: ReturnType<typeof resolveLocalQuickDetailPresentation>
) {
  return {
    ...(presentation.contentHeight
      ? { "--drawer-content-height": presentation.contentHeight }
      : {}),
    ...(presentation.contentMaxHeight
      ? { "--drawer-content-max-height": presentation.contentMaxHeight }
      : {}),
    ...(presentation.contentWidth
      ? { "--drawer-content-width": presentation.contentWidth }
      : {}),
  } as CSSProperties
}

export function LocalEntityQuickDetailDrawer({
  entity,
  fixture = null,
  onBeforeClose,
  onClose,
  owner,
  returnFocusRef = null,
}: LocalEntityQuickDetailDrawerProps) {
  const { dictionary, locale } = useLocalization()
  const canReadEvents = useHasAnyPermission(EVENT_READ_PERMISSIONS)
  const canReadNewsArticles = useHasAnyPermission(NEWS_ARTICLE_READ_PERMISSIONS)
  const [state, setState] = useState<DetailState>({ phase: "idle" })
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const sessionIdRef = useRef(0)
  const entityRef = useRef<LocalQuickDetailEntity | null>(entity)
  const closeRequestedRef = useRef(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const viewportWidth = useViewportWidth()
  const open = Boolean(entity)
  const entityKey = entity ? `${entity.kind}:${entity.id}` : null
  const fixtureDetail =
    entity &&
    fixture &&
    fixture.entity.kind === entity.kind &&
    fixture.entity.id === entity.id
      ? fixture
      : null
  const canReadSelectedEntity = fixtureDetail
    ? true
    : entity?.kind === "event"
      ? canReadEvents
      : entity?.kind === "news-article"
        ? canReadNewsArticles
        : true
  const presentation = entity
    ? resolveLocalQuickDetailPresentation({
        kind: entity.kind,
        owner,
        viewportWidth,
      })
    : resolveLocalQuickDetailPresentation({
        kind: "event",
        owner,
        viewportWidth,
      })
  const currentState =
    activeSessionId !== null &&
    entityKey !== null &&
    state.phase !== "idle" &&
    state.sessionId === activeSessionId &&
    state.entityKey === entityKey &&
    state.retryNonce === retryNonce
      ? state
      : null
  const detailTitle = !entity
    ? dictionary.common.loading
    : !canReadSelectedEntity
      ? entity.kind === "event"
        ? dictionary.events.quickAccessDeniedTitle
        : dictionary.newsArticles.quickAccessDeniedTitle
      : currentState?.phase === "event"
        ? currentState.event.title
        : currentState?.phase === "news-article"
          ? currentState.article.title
          : currentState?.phase === "missing"
            ? dictionary.quickDetail.notFoundTitle
            : currentState?.phase === "error"
              ? dictionary.quickDetail.errorTitle
              : dictionary.common.loading
  const title = detailTitle
  const canonicalHref =
    entity &&
    !fixtureDetail &&
    canReadSelectedEntity &&
    (!currentState ||
      currentState.phase === "loading" ||
      currentState.phase === "event" ||
      currentState.phase === "news-article" ||
      currentState.phase === "error")
      ? getCanonicalHref(entity)
      : null

  useEffect(() => {
    entityRef.current = entity
  }, [entity])

  useEffect(() => {
    const currentEntity = entityRef.current

    if (!currentEntity || !entityKey) {
      return
    }

    const selectedEntity = currentEntity
    const currentEntityKey = entityKey
    const sessionId = ++sessionIdRef.current
    let isActive = true

    setActiveSessionId(sessionId)
    setState({
      entityKey: currentEntityKey,
      phase: "loading",
      retryNonce,
      sessionId,
    })

    if (fixtureDetail) {
      if ("event" in fixtureDetail) {
        setState({
          entityKey: currentEntityKey,
          event: fixtureDetail.event,
          phase: "event",
          retryNonce,
          sessionId,
        })
      } else {
        setState({
          article: fixtureDetail.article,
          entityKey: currentEntityKey,
          phase: "news-article",
          retryNonce,
          sessionId,
        })
      }
      return () => {
        isActive = false
      }
    }

    if (!canReadSelectedEntity) {
      setState({
        entityKey: currentEntityKey,
        phase: "denied",
        retryNonce,
        sessionId,
      })
      return () => {
        isActive = false
      }
    }

    async function loadDetail() {
      try {
        if (selectedEntity.kind === "event") {
          const event = await getEventById(selectedEntity.id)

          if (isActive) {
            setState({
              entityKey: currentEntityKey,
              event,
              phase: "event",
              retryNonce,
              sessionId,
            })
          }

          return
        }

        const article = await getNewsArticleById(selectedEntity.id)

        if (isActive) {
          setState({
            article,
            entityKey: currentEntityKey,
            phase: "news-article",
            retryNonce,
            sessionId,
          })
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        const status = getErrorStatus(error)

        if (status === 404) {
          setState({
            entityKey: currentEntityKey,
            phase: "missing",
            retryNonce,
            sessionId,
          })
          return
        }

        if (status === 401 || status === 403) {
          setState({
            entityKey: currentEntityKey,
            phase: "denied",
            retryNonce,
            sessionId,
          })
          return
        }

        setState({
          entityKey: currentEntityKey,
          error: getErrorMessage(error),
          phase: "error",
          retryNonce,
          sessionId,
        })
      }
    }

    void loadDetail()

    return () => {
      isActive = false
    }
  }, [canReadSelectedEntity, entityKey, fixtureDetail, retryNonce])

  useEffect(() => {
    const body = bodyRef.current

    if (activeSessionId !== null && body) {
      if (typeof body.scrollTo === "function") {
        body.scrollTo({ top: 0, behavior: "auto" })
      } else {
        body.scrollTop = 0
      }
    }
  }, [activeSessionId])

  useEffect(() => {
    if (open) {
      closeRequestedRef.current = false
    }
  }, [open])

  const requestClose = useCallback(() => {
    if (!open || closeRequestedRef.current) {
      return
    }

    closeRequestedRef.current = true
    onBeforeClose?.()
    onClose()
  }, [onBeforeClose, onClose, open])

  const handleRetry = useCallback(() => {
    setRetryNonce((current) => current + 1)
  }, [])

  const finalFocus = () => returnFocusRef?.current ?? false

  return (
    <DrawerInOverlay
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      showSwipeHandle
      swipeDirection={presentation.swipeDirection}
    >
      <DrawerContentInOverlay
        aria-busy={currentState?.phase === "loading" || undefined}
        className="motion-reduce:transition-none motion-reduce:duration-0"
        data-quick-detail-placement={presentation.placement}
        data-quick-detail-profile={entity?.kind}
        finalFocus={finalFocus}
        initialFocus={closeButtonRef}
        style={getDrawerStyle(presentation)}
      >
        <DrawerHeader className="sticky top-0 z-10 border-b bg-popover/95 px-4 py-3 text-left backdrop-blur-sm">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="truncate text-base font-semibold">
                {title}
              </DrawerTitle>
            </div>
            <Button
              ref={closeButtonRef}
              aria-label={dictionary.common.close}
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={requestClose}
            >
              <X aria-hidden="true" data-icon="inline-start" />
            </Button>
          </div>

          {canonicalHref ? (
            <div className="mt-3 flex justify-start">
              <Link
                href={canonicalHref}
                className={buttonVariants({ size: "sm", variant: "outline" })}
                onClick={requestClose}
              >
                <ArrowUpRight aria-hidden="true" data-icon="inline-start" />
                {dictionary.common.openFullPage}
              </Link>
            </div>
          ) : null}
        </DrawerHeader>

        <div
          ref={bodyRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-4 motion-reduce:transition-none",
            entity?.kind === "event" && presentation.placement === "bottom"
              ? "mx-auto w-full max-w-[64rem]"
              : null
          )}
        >
          {!entity ? null : !canReadSelectedEntity ? (
            <div role="status" aria-live="polite">
              <AccessDenied
                description={
                  entity.kind === "event"
                    ? dictionary.events.detailDenied
                    : dictionary.newsArticles.detailDenied
                }
                permission={
                  entity.kind === "event"
                    ? EVENT_READ_PERMISSIONS[0]
                    : NEWS_ARTICLE_READ_PERMISSIONS[0]
                }
              />
            </div>
          ) : !currentState || currentState.phase === "loading" ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground"
            >
              <Spinner className="size-4" />
              <span className="ml-2">{dictionary.common.loading}</span>
            </div>
          ) : currentState.phase === "error" ? (
            <Empty role="alert" aria-live="assertive" className="min-h-[320px]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>{dictionary.quickDetail.errorTitle}</EmptyTitle>
                <EmptyDescription>
                  {currentState.error ??
                    dictionary.quickDetail.errorDescription}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="outline" onClick={handleRetry}>
                  {dictionary.common.retry}
                </Button>
              </EmptyContent>
            </Empty>
          ) : currentState.phase === "missing" ? (
            <Empty role="status" aria-live="polite" className="min-h-[320px]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>{dictionary.quickDetail.notFoundTitle}</EmptyTitle>
                <EmptyDescription>
                  {dictionary.quickDetail.notFoundDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : currentState.phase === "denied" ? (
            <div role="status" aria-live="polite">
              <AccessDenied
                description={
                  entity.kind === "event"
                    ? dictionary.events.detailDenied
                    : dictionary.newsArticles.detailDenied
                }
                permission={
                  entity.kind === "event"
                    ? EVENT_READ_PERMISSIONS[0]
                    : NEWS_ARTICLE_READ_PERMISSIONS[0]
                }
              />
            </div>
          ) : currentState.phase === "event" ? (
            <EventQuickDetailContent
              canReadNewsArticles={canReadNewsArticles}
              dictionary={dictionary}
              event={currentState.event}
              locale={locale}
            />
          ) : (
            <NewsArticleQuickDetailContent
              article={currentState.article}
              dictionary={dictionary}
              locale={locale}
            />
          )}
        </div>
      </DrawerContentInOverlay>
    </DrawerInOverlay>
  )
}
