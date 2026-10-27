"use client"

import { Search } from "lucide-react"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

const SEARCH_INPUT_ID = "system-prompt-search"

interface SystemPromptSearchProps {
  value: string
  isPending: boolean
  onValueChange: (value: string) => void
}

export function SystemPromptSearch({
  value,
  isPending,
  onValueChange,
}: SystemPromptSearchProps) {
  const { dictionary } = useLocalization()
  const t = dictionary.systemPrompts

  return (
    <div className="w-full sm:w-80 lg:w-96">
      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        {t.searchLabel}
      </label>
      <InputGroup>
        <InputGroupAddon>
          {isPending ? (
            <Spinner aria-label={t.searchPending} />
          ) : (
            <Search aria-hidden="true" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          id={SEARCH_INPUT_ID}
          type="search"
          value={value}
          placeholder={t.searchPlaceholder}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </InputGroup>
    </div>
  )
}
