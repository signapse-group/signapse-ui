"use client"

import { useId, useTransition } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { sendTelegramTestMessage } from "@/app/api/telegram/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"
import { cn } from "@/lib/utils"

type TelegramDestinationTestMessageButtonProps = {
  destinationId: number
  destinationLabel: string
  canManage: boolean
  isEligible: boolean
}

export function TelegramDestinationTestMessageButton({
  destinationId,
  destinationLabel,
  canManage,
  isEligible,
}: TelegramDestinationTestMessageButtonProps) {
  const { dictionary, formatMessage } = useLocalization()
  const t = dictionary.telegram.destination
  const [isPending, startTransition] = useTransition()
  const descriptionId = useId()
  const feedbackId = `telegram-test-message-${destinationId}`
  const unavailableReason = !canManage
    ? t.testMessagePermissionRequired
    : !isEligible
      ? t.testMessageInactive
      : undefined
  const actionLabel = formatMessage(
    isPending ? t.testMessagePendingAction : t.testMessageAction,
    { destination: destinationLabel }
  )

  function handleClick() {
    if (isPending || unavailableReason) return

    startTransition(async () => {
      toast.loading(t.testMessagePending, { id: feedbackId })

      try {
        const result = await sendTelegramTestMessage(destinationId)

        if (result.success) {
          toast.success(
            formatMessage(t.testMessageSuccess, {
              destination: destinationLabel,
            }),
            { id: feedbackId }
          )
          return
        }

        if (result.outcome === "unknown") {
          toast.warning(result.error, { id: feedbackId })
          return
        }

        toast.error(result.error || t.testMessageError, { id: feedbackId })
      } catch {
        toast.warning(t.testMessageUnknownOutcome, { id: feedbackId })
      }
    })
  }

  const button = (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn((unavailableReason || isPending) && "opacity-60")}
      aria-label={actionLabel}
      aria-disabled={unavailableReason || isPending ? true : undefined}
      aria-busy={isPending}
      aria-describedby={unavailableReason ? descriptionId : undefined}
      onClick={handleClick}
    >
      {isPending ? (
        <Spinner data-icon="inline-start" aria-hidden="true" />
      ) : (
        <Send data-icon="inline-start" aria-hidden="true" />
      )}
    </Button>
  )

  return (
    <>
      {unavailableReason ? (
        <span id={descriptionId} className="sr-only">
          {unavailableReason}
        </span>
      ) : null}
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContentInOverlay>
          {unavailableReason ||
            (isPending ? t.testMessagePending : t.testMessage)}
        </TooltipContentInOverlay>
      </Tooltip>
    </>
  )
}
