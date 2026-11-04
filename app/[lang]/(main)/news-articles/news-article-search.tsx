"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { useDebouncedCallback } from "use-debounce"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { NEWS_ARTICLE_SEARCH_PARAMS } from "@/app/lib/news-articles/query"
import { cn } from "@/lib/utils"

const SEARCH_INPUT_ID = "news-article-search"

export function NewsArticleSearch({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const { dictionary } = useLocalization()
  const [isPending, startTransition] = useTransition()
  const currentSearch =
    searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.keyword) ||
    searchParams.get(NEWS_ARTICLE_SEARCH_PARAMS.legacyKeyword) ||
    ""

  const handleSearch = useDebouncedCallback((term: string) => {
    const trimmedTerm = term.trim()
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    params.delete(NEWS_ARTICLE_SEARCH_PARAMS.legacyKeyword)

    if (trimmedTerm) {
      params.set(NEWS_ARTICLE_SEARCH_PARAMS.keyword, trimmedTerm)
    } else {
      params.delete(NEWS_ARTICLE_SEARCH_PARAMS.keyword)
    }

    const query = params.toString()

    startTransition(() => {
      replace(query ? `${pathname}?${query}` : pathname)
    })
  }, 300)

  return (
    <div className={cn("w-full min-w-0", className)}>
      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        {dictionary.newsArticles.searchLabel}
      </label>
      <InputGroup>
        <InputGroupAddon>
          {isPending ? (
            <Spinner aria-label={dictionary.newsArticles.searchPending} />
          ) : (
            <Search aria-hidden="true" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          key={currentSearch}
          defaultValue={currentSearch}
          id={SEARCH_INPUT_ID}
          type="search"
          placeholder={dictionary.newsArticles.searchPlaceholder}
          onChange={(event) => {
            handleSearch(event.target.value)
          }}
        />
      </InputGroup>
    </div>
  )
}
