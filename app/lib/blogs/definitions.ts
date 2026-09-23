import type { Value } from "platejs"
import type { Page } from "@/app/lib/definitions"
import { z } from "zod"

export const BLOG_CONTENT_SCHEMA_VERSION = 1

export const BLOG_POST_STATUSES = ["DRAFT", "PUBLISHED"] as const
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number]

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const BLOG_ROOT_NODE_TYPES = new Set([
  "blockquote",
  "callout",
  "code_block",
  "column_group",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "p",
  "table",
  "toggle",
  "ul",
  "ol",
])
const BLOG_SUPPORTED_NODE_TYPES = new Set([
  "a",
  "blockquote",
  "callout",
  "code_block",
  "code_line",
  "column",
  "column_group",
  "date",
  "equation",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "link",
  "mention",
  "mention_input",
  "ol",
  "p",
  "table",
  "td",
  "toc",
  "toggle",
  "tr",
  "ul",
])
const BLOG_VOID_NODE_TYPES = new Set(["hr", "img", "mention"])
const BLOG_URL_KEYS = new Set(["href", "src", "url"])

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isTextLeaf(value: unknown): value is JsonObject {
  return isJsonObject(value) && typeof value.text === "string"
}

function isPlainTextLeaf(value: unknown): value is JsonObject {
  return isTextLeaf(value) && Object.keys(value).length === 1
}

function isEmptyTextLeaf(value: unknown): boolean {
  return (
    isTextLeaf(value) && Object.keys(value).length === 1 && value.text === ""
  )
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isAllowedUrl(value: string, image: boolean): boolean {
  if (!image && value.startsWith("/") && !value.startsWith("//")) {
    return true
  }

  try {
    const url = new URL(value)
    if (image) {
      return url.protocol === "https:" && url.hostname.length > 0
    }

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    )
  } catch {
    return false
  }
}

function hasValidNodeFields(type: string, node: JsonObject): boolean {
  if (type === "img") {
    return hasNonEmptyString(node.url) || hasNonEmptyString(node.src)
  }

  if (type === "a" || type === "link") {
    return hasNonEmptyString(node.url) || hasNonEmptyString(node.href)
  }

  return true
}

function hasValidChildren(type: string, children: unknown[]): boolean {
  const requiredChildType =
    type === "code_block"
      ? "code_line"
      : type === "ol" || type === "ul"
        ? "li"
        : type === "table"
          ? "tr"
          : type === "tr"
            ? "td"
            : type === "column_group"
              ? "column"
              : null

  return children.every((child) => {
    if (requiredChildType !== null) {
      if (!isJsonObject(child) || child.type !== requiredChildType) {
        return false
      }
    }

    if (type === "code_line" && !isPlainTextLeaf(child)) {
      return false
    }

    if (BLOG_VOID_NODE_TYPES.has(type) && !isEmptyTextLeaf(child)) {
      return false
    }

    return isValidBlogNode(child, false)
  })
}

function isValidBlogNode(value: unknown, root: boolean): boolean {
  if (!isJsonObject(value)) return false

  if ("text" in value) {
    return (
      !root &&
      typeof value.text === "string" &&
      !("type" in value) &&
      !("children" in value)
    )
  }

  const type = value.type
  const children = value.children
  if (
    typeof type !== "string" ||
    !BLOG_SUPPORTED_NODE_TYPES.has(type) ||
    (root && !BLOG_ROOT_NODE_TYPES.has(type)) ||
    !Array.isArray(children) ||
    children.length === 0 ||
    !hasValidNodeFields(type, value) ||
    !hasValidChildren(type, children)
  ) {
    return false
  }

  return true
}

function hasValidBlogUrls(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every(hasValidBlogUrls)
  }

  if (!isJsonObject(value)) return true

  const image = value.type === "img"
  for (const [key, child] of Object.entries(value)) {
    if (BLOG_URL_KEYS.has(key)) {
      if (
        typeof child !== "string" ||
        !isAllowedUrl(child, image || key === "src")
      ) {
        return false
      }
      continue
    }

    if (!hasValidBlogUrls(child)) return false
  }

  return true
}

export function isBlogContent(value: unknown): value is Value {
  return (
    Array.isArray(value) &&
    value.every((node) => isValidBlogNode(node, true)) &&
    hasValidBlogUrls(value)
  )
}

export function createEmptyBlogContent(): Value {
  return [{ children: [{ text: "" }], type: "p" }]
}

export function slugifyBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export const blogContentSchema = z.custom<Value>(isBlogContent)

const blogPostCommonFields = {
  title: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255).regex(BLOG_SLUG_PATTERN),
  shortDescription: z.string().max(500).optional(),
}

export const createBlogPostRequestSchema = z
  .object({
    ...blogPostCommonFields,
    content: blogContentSchema,
    contentSchemaVersion: z.literal(BLOG_CONTENT_SCHEMA_VERSION),
  })
  .strict()
export const updateBlogPostRequestSchema = z
  .object({
    title: blogPostCommonFields.title.optional(),
    slug: blogPostCommonFields.slug.optional(),
    shortDescription: blogPostCommonFields.shortDescription,
    content: blogContentSchema.optional(),
    contentSchemaVersion: z.literal(BLOG_CONTENT_SCHEMA_VERSION),
  })
  .strict()

export type CreateBlogPostRequest = z.infer<typeof createBlogPostRequestSchema>
export type UpdateBlogPostRequest = z.infer<typeof updateBlogPostRequestSchema>

export interface BlogPost {
  id: number
  title: string
  slug: string
  content: Value
  contentSchemaVersion: number
  shortDescription: string | null
  status: BlogPostStatus
  publishedAt: string | null
  createdDate: string
  lastModifiedDate: string
}

export interface BlogPostListResponse {
  id: number
  title: string
  slug: string
  shortDescription: string | null
  status: BlogPostStatus
  publishedAt: string | null
  createdDate: string
  lastModifiedDate: string
}

const blogPostPageableSchema = z
  .object({
    pageNumber: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    paged: z.boolean(),
    unpaged: z.boolean(),
  })
  .passthrough()

export const blogPostListResponseSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string(),
    slug: z.string(),
    shortDescription: z.string().nullable(),
    status: z.enum(BLOG_POST_STATUSES),
    publishedAt: z.string().nullable(),
    createdDate: z.string(),
    lastModifiedDate: z.string(),
  })
  .passthrough()

export const blogPostResponseSchema = blogPostListResponseSchema
  .extend({
    content: blogContentSchema,
    contentSchemaVersion: z.number().int().positive(),
  })
  .passthrough()

export const blogPageResponseSchema = z
  .object({
    content: z.array(blogPostListResponseSchema),
    pageable: blogPostPageableSchema,
    last: z.boolean(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
    empty: z.boolean(),
  })
  .passthrough()

export function isPublishedBlogPost(
  post: Pick<BlogPostListResponse, "status">
): boolean {
  return post.status === "PUBLISHED"
}

export function filterPublishedBlogPage(
  page: Page<BlogPostListResponse>
): Page<BlogPostListResponse> {
  const content = page.content.filter(isPublishedBlogPost)

  return {
    ...page,
    content,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}
