import { Plus } from "lucide-react"

import { LocalizedLink } from "@/components/localized-link"
import { buttonVariants } from "@/components/ui/button"

interface RoleCreateLinkProps {
  label: string
}

export function RoleCreateLink({ label }: RoleCreateLinkProps) {
  return (
    <LocalizedLink href="/roles/create" className={buttonVariants()}>
      <Plus data-icon="inline-start" />
      {label}
    </LocalizedLink>
  )
}
