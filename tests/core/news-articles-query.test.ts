import { describe, expect, it } from "vitest"

import {
  buildNewsArticleFilter,
  clearNewsArticleFilters,
  getNewsArticleDateRange,
  getNewsArticleDateValue,
  removeNewsArticleFilter,
  resolveNewsArticleSort,
} from "@/app/lib/news-articles/query"
import { buildSortQuery, queryParamsToString } from "@/app/lib/utils"

describe("news article query", () => {
  it("serializes keyword, exact snapshot source, status, and inclusive local days as AND filters", () => {
    expect(
      buildNewsArticleFilter(
        {
          "keyword[containsIgnoreCase]": " inflation ",
          "status[eq]": "CONTENT_FAILED",
          "sourceName[eq]": "CNBC",
          publishedFrom: "2026-09-25",
          publishedTo: "2026-09-26",
        },
        "Asia/Bangkok"
      )
    ).toBe(
      "containsIgnoreCase(keyword,'inflation') and status eq 'CONTENT_FAILED' and sourceName eq 'CNBC' and publishedAt ge '2026-09-24T17:00:00.000Z' and publishedAt lt '2026-09-26T17:00:00.000Z'"
    )
  })

  it("uses the IANA zone's actual day boundaries across a daylight-saving change", () => {
    expect(
      getNewsArticleDateRange("2026-03-08", "2026-03-08", "America/New_York")
    ).toEqual({
      from: "2026-03-08T05:00:00.000Z",
      toExclusive: "2026-03-09T04:00:00.000Z",
    })
  })

  it("keeps an instant just before UTC midnight in the browser's next calendar day", () => {
    expect(
      getNewsArticleDateValue("2026-09-24T17:00:00Z", "Asia/Bangkok")
    ).toBe("2026-09-25")
  })

  it("treats publisher names as exact source snapshots rather than prefix filters", () => {
    expect(buildNewsArticleFilter({ "sourceName[eq]": "CNBC" }, "UTC")).toBe(
      "sourceName eq 'CNBC'"
    )
    expect(
      buildNewsArticleFilter({ "sourceName[eq]": "CNBC Indonesia" }, "UTC")
    ).toBe("sourceName eq 'CNBC Indonesia'")
  })

  it("supports only the three producer sort options and sends one sort expression", () => {
    expect(resolveNewsArticleSort(undefined)).toBe("publishedAt_desc")

    const sort = buildSortQuery(resolveNewsArticleSort("publishedAt_asc"))
    expect(
      queryParamsToString({ filter: "", page: 1, size: 10, sort })
    ).toContain("sort=publishedAt%2Casc")
    expect(resolveNewsArticleSort("createdDate_desc")).toBe("createdDate_desc")
    expect(() => resolveNewsArticleSort("title_asc")).toThrow()
  })

  it("removes one condition or clears filters while preserving keyword and sort", () => {
    const current = new URLSearchParams(
      "page=4&size=20&keyword%5BcontainsIgnoreCase%5D=market&sort=publishedAt_asc&status%5Beq%5D=INGESTED&sourceName%5Beq%5D=CNBC&publishedFrom=2026-09-25&publishedTo=2026-09-26"
    )

    const withoutPublisher = removeNewsArticleFilter(current, "sourceName[eq]")
    expect(withoutPublisher.get("sourceName[eq]")).toBeNull()
    expect(withoutPublisher.get("status[eq]")).toBe("INGESTED")
    expect(withoutPublisher.get("keyword[containsIgnoreCase]")).toBe("market")
    expect(withoutPublisher.get("sort")).toBe("publishedAt_asc")
    expect(withoutPublisher.get("page")).toBe("1")

    const cleared = clearNewsArticleFilters(current)
    expect(cleared.get("status[eq]")).toBeNull()
    expect(cleared.get("sourceName[eq]")).toBeNull()
    expect(cleared.get("publishedFrom")).toBeNull()
    expect(cleared.get("publishedTo")).toBeNull()
    expect(cleared.get("keyword[containsIgnoreCase]")).toBe("market")
    expect(cleared.get("sort")).toBe("publishedAt_asc")
    expect(cleared.get("size")).toBe("20")
    expect(cleared.get("page")).toBe("1")
  })

  it("rejects malformed date and status conditions instead of sending guessed filters", () => {
    expect(() =>
      buildNewsArticleFilter({ publishedFrom: "2026-02-30" }, "UTC")
    ).toThrow()
    expect(() =>
      buildNewsArticleFilter({ "status[eq]": "UNKNOWN" }, "UTC")
    ).toThrow()
  })
})
