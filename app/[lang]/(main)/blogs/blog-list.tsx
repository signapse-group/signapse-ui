"use client"

import { Clock3, Edit2, Eye, FileText, Plus, Trash2 } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteBlog } from "@/app/api/blogs/action"
import { BlogPostListResponse } from "@/app/lib/blogs/definitions"
import { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { AppSelectPageSize } from "@/components/app-select-page-size"
import { useHasPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { BlogPublicationControl } from "./blog-publication-control"
import { BlogSearch } from "./blog-search"

interface BlogListProps {
  blogPage: Page<BlogPostListResponse>
}

export function BlogListPage({ blogPage }: BlogListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const searchParams = useSearchParams()
  const detailQuery = searchParams.toString()
  const currentPage = Number(searchParams.get("page")) || 1
  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !["page", "size", "sort"].includes(key)
  )
  const hasNoResults = hasActiveFilters || currentPage > 1
  const blogs = blogPage.content
  const canCreateBlog = useHasPermission("blog:create")
  const canUpdateBlog = useHasPermission("blog:update")
  const canDeleteBlog = useHasPermission("blog:delete")

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          {canCreateBlog ? (
            <Link href="/blogs/create" className={buttonVariants()}>
              <Plus data-icon="inline-start" />
              {dictionary.blogs.createAction}
            </Link>
          ) : null}
          <BlogSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <BlogStatusFilter />
          <SortSelect
            className="w-full sm:w-auto"
            options={[
              { label: dictionary.blogs.newest, value: "publishedAt_desc" },
              { label: dictionary.blogs.oldest, value: "publishedAt_asc" },
              { label: dictionary.blogs.titleAsc, value: "title_asc" },
              { label: dictionary.blogs.titleDesc, value: "title_desc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
          <AppSelectPageSize
            className="w-full sm:w-auto"
            defaultSize={blogPage.size}
            showLabel={false}
            triggerClassName="w-full sm:w-[120px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[58%]">
                {dictionary.blogs.titleColumn}
              </AppListTableHead>
              <AppListTableHead className="w-32 text-center">
                {dictionary.blogs.statusColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                {dictionary.blogs.createdColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-center">
                {dictionary.blogs.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {blogs.length > 0 ? (
              blogs.map((blog) => (
                <TableRow
                  key={blog.id}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top font-medium whitespace-normal text-foreground">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link
                        href={getBlogDetailHref(blog.id, detailQuery)}
                        className="line-clamp-1 break-words"
                      >
                        {blog.title}
                      </Link>
                      <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                        {blog.shortDescription}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-32 text-center">
                    {blog.status === "PUBLISHED" ? (
                      <Badge variant="default" className="gap-1">
                        <Eye />
                        {dictionary.blogs.statuses.PUBLISHED}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <FileText />
                        {dictionary.blogs.statuses.DRAFT}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="w-40 text-center">
                    <AppTimeMetadata icon={Clock3}>
                      {blog.createdDate
                        ? formatDateTime(
                            blog.createdDate,
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                            "-"
                          )
                        : "-"}
                    </AppTimeMetadata>
                  </TableCell>
                  <TableCell className="w-28 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {canUpdateBlog ? (
                        <Link
                          href={getBlogDetailHref(blog.id, detailQuery)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon",
                            className:
                              "text-muted-foreground hover:text-foreground",
                          })}
                          title={dictionary.blogs.edit}
                        >
                          <Edit2 />
                          <span className="sr-only">
                            {dictionary.blogs.edit}
                          </span>
                        </Link>
                      ) : null}
                      {canUpdateBlog ? (
                        <BlogPublicationControl
                          id={blog.id}
                          status={blog.status}
                        />
                      ) : null}
                      {canDeleteBlog ? <DeleteBlogButton id={blog.id} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={4}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>
                    {hasNoResults
                      ? dictionary.blogs.noResultsTitle
                      : dictionary.blogs.emptyTitle}
                  </EmptyTitle>
                  <EmptyDescription>
                    {hasNoResults
                      ? dictionary.blogs.noResultsDescription
                      : dictionary.blogs.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={blogPage} className="mt-4" />
    </div>
  )
}

function DeleteBlogButton({ id }: { id: number }) {
  const { dictionary } = useLocalization()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteBlog(id)
      if (result.success) {
        toast.success(dictionary.blogs.deleted)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || dictionary.blogs.deleteError)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title={dictionary.blogs.delete}
          />
        }
      >
        <Trash2 />
        <span className="sr-only">{dictionary.blogs.delete}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dictionary.blogs.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dictionary.blogs.deleteDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {isPending
              ? dictionary.blogs.deletePending
              : dictionary.blogs.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const BLOG_STATUS_FILTER_KEY = "status[eq]"

function BlogStatusFilter() {
  const { dictionary } = useLocalization()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentStatus = searchParams.get(BLOG_STATUS_FILTER_KEY) ?? "ALL"

  function handleStatusChange(value: string | null) {
    const params = new URLSearchParams(searchParams)
    if (!value || value === "ALL") {
      params.delete(BLOG_STATUS_FILTER_KEY)
    } else {
      params.set(BLOG_STATUS_FILTER_KEY, value)
    }
    params.set("page", "1")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const options = [
    { value: "ALL", label: dictionary.blogs.allStatuses },
    { value: "DRAFT", label: dictionary.blogs.statuses.DRAFT },
    { value: "PUBLISHED", label: dictionary.blogs.statuses.PUBLISHED },
  ]

  return (
    <Select
      items={options}
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger
        className="w-full sm:w-[170px]"
        aria-label={dictionary.blogs.statusFilterLabel}
        aria-busy={isPending}
      >
        <SelectValue placeholder={dictionary.blogs.allStatuses} />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function getBlogDetailHref(id: number, query: string): string {
  return query ? `/blogs/${id}?${query}` : `/blogs/${id}`
}
