"use client"

import { EyeOff, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  publishBlog,
  unpublishBlog,
} from "@/app/api/blogs/action"
import type { BlogPostStatus } from "@/app/lib/blogs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface BlogPublicationControlProps {
  id: number
  status: BlogPostStatus
  compact?: boolean
}

export function BlogPublicationControl({
  id,
  status,
  compact = true,
}: BlogPublicationControlProps) {
  const { dictionary } = useLocalization()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const isPublished = status === "PUBLISHED"
  const actionLabel = isPublished
    ? dictionary.blogs.unpublish
    : dictionary.blogs.publish
  const title = isPublished
    ? dictionary.blogs.unpublishTitle
    : dictionary.blogs.publishTitle
  const description = isPublished
    ? dictionary.blogs.unpublishDescription
    : dictionary.blogs.publishDescription
  const pendingLabel = isPublished
    ? dictionary.blogs.unpublishPending
    : dictionary.blogs.publishPending
  const successMessage = isPublished
    ? dictionary.blogs.unpublished
    : dictionary.blogs.published

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await (isPublished ? unpublishBlog : publishBlog)(id)

      if (result.success) {
        toast.success(successMessage)
        setOpen(false)
      } else {
        toast.error(result.error || dictionary.blogs.publicationError)
      }

      router.refresh()
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant={isPublished ? "outline" : "default"}
            size={compact ? "icon" : "default"}
            disabled={isPending}
            aria-busy={isPending}
            aria-label={compact ? actionLabel : undefined}
            title={compact ? actionLabel : undefined}
          />
        }
      >
        {isPending ? (
          <Spinner aria-label={pendingLabel} />
        ) : isPublished ? (
          <EyeOff aria-hidden="true" />
        ) : (
          <Send aria-hidden="true" />
        )}
        {compact ? (
          <span className="sr-only">{actionLabel}</span>
        ) : (
          actionLabel
        )}
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
