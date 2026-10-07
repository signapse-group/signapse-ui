import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import * as guard from "../e2e/contract-guard.mjs"

const contracts = [
  { method: "GET", path: "/items/{id}", mapping: "getItem", status: 200 },
]
const spec = {
  openapi: "3.1.0",
  info: { title: "Guard test input", version: "test" },
  paths: {
    "/items/{itemId}": { get: { responses: { "200": { description: "OK" } } } },
  },
}

afterEach(() => vi.unstubAllGlobals())

describe("API contract guard", () => {
  it("runs offline without a mapping file or live backend", () => {
    const directory = mkdtempSync(join(tmpdir(), "signapse-contract-guard-"))
    try {
      const result = spawnSync(
        process.execPath,
        [resolve("tests/e2e/contract-guard.mjs")],
        {
          cwd: directory,
          env: {
            PATH: process.env.PATH,
            NODE_ENV: "test",
            API_BASE_URL: "http://127.0.0.1:1",
          },
          encoding: "utf8",
          timeout: 5000,
        }
      )
      expect(result.status).toBe(0)
      expect(result.stdout).toContain("Fixture consistency")
      expect(result.stdout).not.toContain("live")
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("matches producer operation identity across parameter names", () => {
    expect(guard.checkPublishedContracts(contracts, spec)).toEqual([])
  })

  it.each([
    { method: "POST", path: "/items/{id}", status: 200 },
    { method: "GET", path: "/missing/{id}", status: 200 },
    { method: "GET", path: "/items/{id}", status: 204 },
  ])("reports producer drift for %j", (contract) => {
    expect(
      guard.checkPublishedContracts([{ ...contract, mapping: "getItem" }], spec)
    ).not.toEqual([])
  })

  it("handles local path-item and response references with status ranges", () => {
    expect(
      guard.checkPublishedContracts(contracts, {
        ...spec,
        paths: { "/items/{itemId}": { $ref: "#/components/pathItems/Items" } },
        components: {
          pathItems: {
            Items: {
              get: {
                responses: { "2XX": { $ref: "#/components/responses/Ok" } },
              },
            },
          },
          responses: { Ok: { description: "OK" } },
        },
      })
    ).toEqual([])
  })

  it.each([null, {}, { ...spec, paths: [] }, { ...spec, info: {} }])(
    "rejects invalid producer input: %j",
    (input) => {
      expect(() => guard.checkPublishedContracts(contracts, input)).toThrow(
        /OpenAPI/
      )
    }
  )

  it("rejects malformed and duplicate fixture operations", () => {
    expect(
      guard.checkFixtureContracts([
        ...contracts,
        { ...contracts[0], path: "/items/{itemId}" },
        { method: "INVALID", path: "items", status: 0, mapping: "bad" },
      ])
    ).toHaveLength(4)
  })

  it("fetches fresh public contracts and refuses errors without fallback", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(spec))
    vi.stubGlobal("fetch", fetch)
    const result = await guard.fetchPublishedContract(
      "https://api.example.test"
    )
    expect(result.spec).toEqual(spec)
    expect(result.url).toBe("https://api.example.test/v3/api-docs")
    expect(fetch).toHaveBeenCalledWith(
      new URL(result.url),
      expect.objectContaining({
        redirect: "error",
        signal: expect.any(AbortSignal),
      })
    )
    fetch.mockResolvedValue(
      new Response("private upstream details", { status: 503 })
    )
    await expect(
      guard.fetchPublishedContract("https://api.example.test")
    ).rejects.toThrow(/503/)
    fetch.mockResolvedValue(new Response("not JSON"))
    await expect(
      guard.fetchPublishedContract("https://api.example.test")
    ).rejects.toThrow(/OpenAPI/)
    await expect(
      guard.fetchPublishedContract("https://localhost")
    ).rejects.toThrow(/public HTTPS/)
  })
})
