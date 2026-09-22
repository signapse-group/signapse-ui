"use server"

import { fetchAuthenticated, type BackendApiError } from "@/app/api/auth/action"
import type { SearchParams, Page, ActionResult } from "@/app/lib/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { queryParamsToString } from "@/app/lib/utils"
import {
  BlogPost,
  BlogPostListResponse,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  createBlogPostRequestSchema,
  updateBlogPostRequestSchema,
  blogPageResponseSchema,
  blogPostResponseSchema,
} from "@/app/lib/blogs/definitions"
import { revalidatePath } from "next/cache"

function parseBlogPageResponse(value: unknown): Page<BlogPostListResponse> {
  return blogPageResponseSchema.parse(value)
}

function parseBlogPostResponse(value: unknown): BlogPost {
  return blogPostResponseSchema.parse(value)
}

export async function getBlogs(
  searchParams: SearchParams
): Promise<Page<BlogPostListResponse>> {
  const value = await fetchAuthenticated<unknown>(
    `/blogs?${queryParamsToString(searchParams)}`
  )
  return parseBlogPageResponse(value)
}

export async function getBlogById(id: number): Promise<BlogPost> {
  return parseBlogPostResponse(
    await fetchAuthenticated<unknown>(`/blogs/${id}`)
  )
}

export async function createBlog(
  request: CreateBlogPostRequest
): Promise<ActionResult<BlogPost>> {
  const dictionary = await getServerDictionary()
  const parsed = createBlogPostRequestSchema.safeParse(request)

  if (!parsed.success) {
    return { success: false, error: dictionary.blogs.invalidContent }
  }

  try {
    const blog = parseBlogPostResponse(
      await fetchAuthenticated<unknown>("/blogs", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      })
    )
    revalidatePath("/blogs")
    return { success: true, data: blog }
  } catch (error: unknown) {
    return {
      success: false,
      error: getBlogActionError(
        error,
        dictionary.blogs.createError,
        dictionary
      ),
    }
  }
}

export async function updateBlog(
  id: number,
  request: UpdateBlogPostRequest
): Promise<ActionResult<BlogPost>> {
  const dictionary = await getServerDictionary()
  const parsed = updateBlogPostRequestSchema.safeParse(request)

  if (!parsed.success) {
    return { success: false, error: dictionary.blogs.invalidContent }
  }

  try {
    const blog = parseBlogPostResponse(
      await fetchAuthenticated<unknown>(`/blogs/${id}`, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      })
    )
    revalidatePath("/blogs")
    revalidatePath(`/blogs/${id}`)
    return { success: true, data: blog }
  } catch (error: unknown) {
    return {
      success: false,
      error: getBlogActionError(
        error,
        dictionary.blogs.updateError,
        dictionary
      ),
    }
  }
}

export async function deleteBlog(id: number): Promise<ActionResult> {
  try {
    await fetchAuthenticated<void>(`/blogs/${id}`, {
      method: "DELETE",
    })
    revalidatePath("/blogs")
    return { success: true, data: undefined }
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    return {
      success: false,
      error: getBlogActionError(
        error,
        dictionary.blogs.deleteError,
        dictionary
      ),
    }
  }
}

function getBlogActionError(
  error: unknown,
  fallback: string,
  dictionary: Awaited<ReturnType<typeof getServerDictionary>>
): string {
  if (!(error instanceof Error)) return fallback

  const apiError = error as BackendApiError
  if (apiError.status === 401 || apiError.status === 403) {
    return dictionary.blogs.permissionError
  }

  if (typeof apiError.status === "number" && apiError.status >= 400) {
    return error.message || fallback
  }

  return fallback
}
