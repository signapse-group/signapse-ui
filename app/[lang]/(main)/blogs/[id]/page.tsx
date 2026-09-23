import { Suspense } from "react"
import { notFound } from "next/navigation"

import { getBlogById } from "@/app/api/blogs/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { AppFormShellSkeleton } from "@/components/app-form-shell"
import { Skeleton } from "@/components/ui/skeleton"

import { BlogDetailView } from "./blog-detail-view"
import { UpdateBlogForm } from "./update-blog-form"

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EditBlogPage({
  params,
  searchParams,
}: PageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasPermission(permissions, "blog:read")) {
    return (
      <AccessDenied
        description={dictionary.blogs.readDenied}
        permission="blog:read"
      />
    )
  }

  const { id } = await params
  const blogId = Number(id)
  if (!Number.isInteger(blogId) || blogId <= 0) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const returnTo = buildBlogListPath(resolvedSearchParams)

  return (
    <Suspense fallback={<UpdateBlogSkeleton />}>
      <FetchBlogData
        canUpdate={hasPermission(permissions, "blog:update")}
        id={blogId}
        returnTo={returnTo}
      />
    </Suspense>
  )
}

async function FetchBlogData({
  canUpdate,
  id,
  returnTo,
}: {
  canUpdate: boolean
  id: number
  returnTo: string
}) {
  const blog = await getBlogById(id)

  if (!blog) {
    notFound()
  }

  return canUpdate ? (
    <UpdateBlogForm blog={blog} returnTo={returnTo} />
  ) : (
    <BlogDetailView blog={blog} returnTo={returnTo} />
  )
}

function buildBlogListPath(
  searchParams: { [key: string]: string | string[] | undefined }
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value)
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry)
      }
    }
  }

  const queryString = query.toString()
  return queryString ? `/blogs?${queryString}` : "/blogs"
}

function UpdateBlogSkeleton() {
  return (
    <AppFormShellSkeleton width="lg">
      <div className="flex flex-col gap-2 px-6 pt-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="flex flex-col gap-8 px-6 py-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </AppFormShellSkeleton>
  )
}
