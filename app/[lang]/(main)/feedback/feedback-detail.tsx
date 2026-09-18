"use client"

import * as React from "react"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleX,
  FileText,
  Image as ImageIcon,
  Info,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react"

import {
  deleteFeedback,
  reviewFeedback,
  withdrawFeedback,
} from "@/app/api/feedback/action"
import {
  FEEDBACK_DELETE_PERMISSION,
  FEEDBACK_READ_PERMISSION,
  FEEDBACK_REVIEW_PERMISSION,
} from "@/app/lib/feedback/permissions"
import type { FeedbackDetailViewModel } from "@/app/lib/feedback/mappers"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useHasPermission } from "@/components/permission-provider"
import { AccessDenied } from "@/components/access-denied"
import { LocalizedLink as Link } from "@/components/localized-link"
import { buttonVariants, Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import {
  FeedbackScreenshotView,
  FeedbackStatusBadge,
} from "./feedback-presentation"

interface FeedbackDetailPageProps {
  record: FeedbackDetailViewModel | null
  moderation?: boolean
  backHref?: string
  initialError?: string
  initialErrorTitle?: string
}

export function FeedbackDetailPage({
  record,
  moderation = false,
  backHref: providedBackHref,
  initialError,
  initialErrorTitle,
}: FeedbackDetailPageProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const t = dictionary.feedback
  const router = useRouter()
  const canRead = useHasPermission(FEEDBACK_READ_PERMISSION)
  const canReview = useHasPermission(FEEDBACK_REVIEW_PERMISSION)
  const canDelete = useHasPermission(FEEDBACK_DELETE_PERMISSION)
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [eraseOpen, setEraseOpen] = React.useState(false)
  const [isWithdrawing, setIsWithdrawing] = React.useState(false)
  const [isErasing, setIsErasing] = React.useState(false)
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null)
  const [eraseError, setEraseError] = React.useState<string | null>(null)

  if (moderation && !canRead) {
    return (
      <AccessDenied
        description={t.readDenied}
        permission={FEEDBACK_READ_PERMISSION}
      />
    )
  }

  if (!record) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">
            {initialErrorTitle ?? t.missingTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {initialError ?? t.missingDescription}
          </p>
          <Link
            href={moderation ? "/feedback-submissions" : "/feedback"}
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft data-icon="inline-start" />
            {moderation ? t.moderationBack : t.backToHistory}
          </Link>
        </div>
      </div>
    )
  }

  const backHref =
    providedBackHref ?? (moderation ? "/feedback-submissions" : "/feedback")
  const isPendingReview = record.status === "PENDING_REVIEW"
  const feedbackId = Number(record.id)
  const showWithdraw = !moderation && isPendingReview
  const showReview = moderation && canReview && isPendingReview
  const showErase = moderation && canDelete

  async function handleReview(reviewMessage: string) {
    const result = await reviewFeedback(feedbackId, { reviewMessage })
    if (!result.success) {
      if (result.kind === "lifecycle-conflict" || result.status === 404) {
        setReviewOpen(false)
        toast.info(
          result.kind === "lifecycle-conflict"
            ? t.reviewStale
            : t.missingDescription
        )
        router.refresh()
      }
      return result
    }

    toast.success(t.reviewSuccess)
    setReviewOpen(false)
    router.refresh()
    return result
  }

  async function handleWithdraw() {
    if (isWithdrawing) return
    setWithdrawError(null)
    setIsWithdrawing(true)
    const result = await withdrawFeedback(feedbackId)
    setIsWithdrawing(false)
    if (!result.success) {
      if (result.kind === "lifecycle-conflict" || result.status === 404) {
        setWithdrawOpen(false)
        toast.info(
          result.kind === "lifecycle-conflict"
            ? t.withdrawStale
            : t.missingDescription
        )
        router.refresh()
        return
      }
      setWithdrawError(t.withdrawError)
      return
    }
    setWithdrawOpen(false)
    toast.success(t.withdrawSuccess)
    router.push(backHref)
  }

  async function handleErase() {
    if (isErasing) return
    setEraseError(null)
    setIsErasing(true)
    const result = await deleteFeedback(feedbackId)
    setIsErasing(false)
    if (!result.success) {
      if (result.status === 404) {
        setEraseOpen(false)
        toast.info(t.eraseMissing)
        router.push(backHref)
        return
      }
      setEraseError(t.eraseError)
      return
    }
    setEraseOpen(false)
    toast.success(t.eraseSuccess)
    router.push(backHref)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {moderation ? t.moderationBack : t.backToHistory}
        </Link>
        <span className="text-xs text-muted-foreground">
          {moderation ? t.moderationContext : t.detailTitle}
        </span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <FeedbackStatusBadge status={record.status} />
          </div>
          <h1 className="mt-3 max-w-5xl text-2xl leading-tight font-semibold tracking-tight break-words">
            {moderation ? t.moderationDetailTitle : t.detailTitle}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t.statusDescriptions[record.status]}
          </p>
        </div>
        {showWithdraw || showReview || showErase ? (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2 xl:max-w-sm xl:justify-end"
            aria-label={t.accessibilityActions}
          >
            {showWithdraw ? (
              <Button
                type="button"
                variant="destructive"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => setWithdrawOpen(true)}
              >
                <CircleX data-icon="inline-start" />
                {t.withdrawAction}
              </Button>
            ) : null}
            {showReview ? (
              <Button type="button" onClick={() => setReviewOpen(true)}>
                <CheckCircle2 data-icon="inline-start" />
                {t.reviewAction}
              </Button>
            ) : null}
            {showErase ? (
              <Button
                type="button"
                variant="destructive"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => setEraseOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                {t.eraseAction}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <main className="flex min-w-0 flex-col gap-6">
          <section className="min-w-0 rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">{t.detailContent}</h2>
            <p className="mt-5 text-sm leading-6 break-words whitespace-pre-wrap text-foreground/90">
              {record.content}
            </p>
          </section>

          <section className="min-w-0 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <ImageIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold">{t.detailScreenshot}</h2>
            </div>
            <div className="mt-4" aria-label={t.accessibilityScreenshot}>
              <FeedbackScreenshotView
                screenshot={record.screenshot}
                screenshotUrl={
                  record.screenshot
                    ? moderation
                      ? `/api/feedback/moderation/${record.id}/screenshot`
                      : `/api/feedback/personal/${record.id}/screenshot`
                    : undefined
                }
              />
            </div>
          </section>

          <section className="min-w-0 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Info
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold">
                {t.detailTechnicalContext}
              </h2>
            </div>
            {record.clientContext ? (
              <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                {record.clientContext.pagePath ? (
                  <MetaValue
                    label={t.technicalContextFields.pagePath}
                    value={record.clientContext.pagePath}
                  />
                ) : null}
                {record.clientContext.appVersion ? (
                  <MetaValue
                    label={t.technicalContextFields.appVersion}
                    value={record.clientContext.appVersion}
                  />
                ) : null}
                {record.clientContext.browserName ? (
                  <MetaValue
                    label={t.technicalContextFields.browser}
                    value={record.clientContext.browserName}
                  />
                ) : null}
                {record.clientContext.osName ? (
                  <MetaValue
                    label={t.technicalContextFields.operatingSystem}
                    value={record.clientContext.osName}
                  />
                ) : null}
                {record.clientContext.locale ? (
                  <MetaValue
                    label={t.technicalContextFields.locale}
                    value={record.clientContext.locale}
                  />
                ) : null}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {t.noTechnicalContext}
              </p>
            )}
          </section>

          {record.reviewMessage ? (
            <section className="min-w-0 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-base font-semibold">
                  {t.detailReviewOutcome}
                </h2>
              </div>
              <p className="mt-3 text-xs font-medium text-foreground">
                {t.reviewMessageRecipientLabel}
              </p>
              <p className="mt-1 text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                {record.reviewMessage}
              </p>
            </section>
          ) : null}
        </main>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="rounded-xl border bg-muted/20 p-5">
            <h2 className="text-base font-semibold">{t.detailTitle}</h2>
            <dl className="mt-4 flex flex-col gap-4">
              {moderation ? (
                <div className="flex items-start gap-3">
                  <UserRound
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <dt className="text-xs text-muted-foreground">
                    {t.senderLabel}
                  </dt>
                  <dd className="min-w-0 font-medium break-words">
                    {record.sender?.displayName ?? t.moderationEmptySender}
                  </dd>
                  {record.sender ? (
                    <dd className="text-xs text-muted-foreground">
                      {record.sender.active === false
                        ? t.senderInactive
                        : t.senderActive}
                    </dd>
                  ) : null}
                </div>
              ) : null}
              <MetaValue
                icon={CalendarClock}
                label={t.submittedAt}
                value={formatDateTime(record.createdAt)}
              />
              <MetaValue
                icon={CalendarClock}
                label={t.updatedAt}
                value={formatDateTime(record.updatedAt)}
              />
              <MetaValue
                label={t.accessibilityStatus}
                value={dictionary.feedback.statuses[record.status]}
              />
            </dl>
          </section>
        </aside>
      </div>

      <FeedbackReviewDialog
        record={record}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSubmit={handleReview}
      />

      <AlertDialog
        open={withdrawOpen}
        onOpenChange={(open) => {
          if (!isWithdrawing) setWithdrawOpen(open)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <ShieldAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.withdrawTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.withdrawDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {withdrawError ? (
            <p role="alert" className="text-sm text-destructive">
              {withdrawError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWithdrawing}>
              {t.cancelAction}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isWithdrawing}
              onClick={(event) => {
                event.preventDefault()
                void handleWithdraw()
              }}
            >
              {isWithdrawing ? <Spinner data-icon="inline-start" /> : null}
              {isWithdrawing ? t.withdrawPending : t.withdrawConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={eraseOpen}
        onOpenChange={(open) => {
          if (!isErasing) setEraseOpen(open)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.eraseTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.eraseDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {eraseError ? (
            <p role="alert" className="text-sm text-destructive">
              {eraseError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isErasing}>
              {t.cancelAction}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isErasing}
              onClick={(event) => {
                event.preventDefault()
                void handleErase()
              }}
            >
              {isErasing ? <Spinner data-icon="inline-start" /> : null}
              {isErasing ? t.erasePending : t.eraseConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MetaValue({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof CalendarClock
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <Icon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words text-foreground">
        {value}
      </dd>
    </div>
  )
}

function FeedbackReviewDialog({
  record,
  open,
  onOpenChange,
  onSubmit,
}: {
  record: FeedbackDetailViewModel
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reviewMessage: string) => Promise<{
    success: boolean
    error?: string
    code?: string
    kind?: string
    status?: number
  }>
}) {
  const { dictionary } = useLocalization()
  const t = dictionary.feedback
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)

  const schema = React.useMemo(
    () =>
      z.object({
        message: z
          .string()
          .trim()
          .min(1, t.reviewMessageRequired)
          .max(1000, t.reviewMessageTooLong),
      }),
    [t]
  )

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage("")
    setError(null)
  }, [open, record.id])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = schema.safeParse({ message })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.reviewMessageRequired)
      fieldRef.current?.focus()
      return
    }

    setError(null)
    setPending(true)
    const result = await onSubmit(parsed.data.message)
    setPending(false)
    if (!result.success) {
      if (result.kind === "lifecycle-conflict" || result.status === 404) return
      setError(result.status === 403 ? t.reviewDenied : t.reviewError)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <DialogTitle>{t.reviewTitle}</DialogTitle>
              <DialogDescription>{t.reviewDialogDescription}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.closeAction}
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </div>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={`feedback-review-message-${record.id}`}>
              {t.reviewMessageLabel}
            </FieldLabel>
            <Textarea
              id={`feedback-review-message-${record.id}`}
              ref={fieldRef}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
              placeholder={t.reviewMessagePlaceholder}
              maxLength={1000}
              rows={5}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? "feedback-review-message-error" : undefined
              }
            />
            {error ? (
              <FieldError id="feedback-review-message-error">
                {error}
              </FieldError>
            ) : null}
          </Field>
          <div className="mt-4 min-h-6" aria-live="polite">
            {pending ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> {t.reviewPending}
              </span>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t.cancelAction}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? t.reviewPending : t.reviewConfirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
