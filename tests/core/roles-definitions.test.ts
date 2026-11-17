import { describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi } from "@/app/lib/i18n/dictionaries/vi"
import { groupPermissionsByResource } from "@/app/lib/roles/definitions"

const permissions = [
  {
    id: 4,
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
  {
    id: 3,
    key: "custom-domain:inspect",
    name: "Inspect custom domain",
    description: null,
  },
]

describe("role permission grouping", () => {
  it("groups assigned permissions by namespace and localizes group labels", () => {
    expect(groupPermissionsByResource(permissions, en)).toEqual([
      {
        key: "custom-domain",
        title: "Other permissions (custom-domain)",
        permissions: [permissions[2]],
      },
      { key: "event", title: "Events", permissions: [permissions[1]] },
      {
        key: "news-article",
        title: "News articles",
        permissions: [permissions[0]],
      },
    ])

    expect(groupPermissionsByResource([permissions[0]], vi)).toEqual([
      {
        key: "news-article",
        title: "Bài viết tin tức",
        permissions: [permissions[0]],
      },
    ])
  })

  it("keeps unprefixed permissions in the localized legacy group", () => {
    const legacyPermission = {
      id: 5,
      key: "legacy-read",
      name: "Legacy read",
      description: null,
    }

    expect(groupPermissionsByResource([legacyPermission], vi)).toEqual([
      {
        key: "legacy",
        title: vi.roles.permissionGroups.legacy,
        permissions: [legacyPermission],
      },
    ])
  })
})
