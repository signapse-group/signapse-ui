// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { RoleDetailPage } from "@/app/[lang]/(main)/roles/role-detail"
import { RoleListPage } from "@/app/[lang]/(main)/roles/role-list"

const roles: RoleResponse[] = [
  {
    id: 901,
    key: "CONTENT_REVIEWER",
    name: "Content Reviewer",
    description: "Can review content.",
    permissions: [
      {
        id: 1,
        key: "news-article:read",
        name: "Read news articles",
        description: null,
      },
      {
        id: 2,
        key: "event:read",
        name: "Read events",
        description: null,
      },
    ],
  },
  {
    id: 902,
    key: "EMPTY_READER",
    name: "Empty reader",
    description: null,
    permissions: [],
  },
]

function renderLocalized(
  children: React.ReactNode,
  locale: "en" | "vi" = "en"
) {
  const dictionary = locale === "en" ? en : viDictionary
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      {children}
    </LocalizationProvider>
  )
}

describe("read-only roles views", () => {
  afterEach(() => cleanup())

  it("lists each role with a localized count, including zero, and a key-specific link", () => {
    renderLocalized(<RoleListPage roles={roles} />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Roles" })
    ).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Key" })).toBeVisible()
    expect(
      screen.getByRole("columnheader", { name: "Permissions" })
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Content Reviewer" })
    ).toHaveAttribute("href", "/en/roles/CONTENT_REVIEWER")
    expect(
      screen.queryByRole("link", { name: "Create role" })
    ).not.toBeInTheDocument()

    const emptyRoleRow = screen.getByRole("row", { name: /Empty reader/ })
    expect(within(emptyRoleRow).getByText("0")).toBeVisible()
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("does not expose a create action before the create-flow handoff", () => {
    renderLocalized(<RoleListPage roles={roles} />)

    expect(
      screen.queryByRole("link", { name: "Create role" })
    ).not.toBeInTheDocument()

    cleanup()
    renderLocalized(<RoleListPage roles={roles} />, "vi")
    expect(
      screen.queryByRole("link", { name: "Tạo vai trò" })
    ).not.toBeInTheDocument()
  })

  it("shows assigned permission names and keys by localized group without edit controls", () => {
    renderLocalized(<RoleDetailPage role={roles[0]} />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Content Reviewer" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Role information" })
    ).toBeVisible()
    expect(screen.getByText("Can review content.")).toBeVisible()
    expect(screen.getByRole("heading", { name: "Events" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "News articles" })).toBeVisible()
    expect(screen.getByText("event:read")).toBeVisible()
    expect(screen.getByText("news-article:read")).toBeVisible()
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("renders a read-only empty state when no permissions are assigned", () => {
    renderLocalized(<RoleDetailPage role={roles[1]} />, "vi")

    expect(
      screen.getByRole("heading", { level: 1, name: "Empty reader" })
    ).toBeVisible()
    expect(
      screen.getByText(viDictionary.roles.emptyAssignedPermissionsTitle)
    ).toBeVisible()
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(
      screen.getByRole("link", { name: viDictionary.common.back })
    ).toHaveAttribute("href", "/vi/roles")
  })
})
