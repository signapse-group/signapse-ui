import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary, getCurrentPermissions } = vi.hoisted(() => ({
  testDictionary: {
    aiProviderConfigs: {
      addKeyDenied: "Key creation permission required",
      addKeyError: "Key creation failed safely",
      createError: "Create failed safely",
      deleteConnectionError: "Connection deletion failed safely",
      deleteKeyError: "Key deletion failed safely",
      deleteDenied: "Delete permission required",
      detailErrorDescription: "Detail failed safely",
      listErrorDescription: "List failed safely",
      modelCatalogDenied: "Catalog permission required",
      modelCatalogError: "Catalog failed safely",
      responseInvalid: "Connection response invalid",
      replaceKeyError: "Key replacement failed safely",
      validationError: "Connection request invalid",
      updateDenied: "Update permission required",
      updateError: "Update failed safely",
    },
  },
  getCurrentPermissions: vi.fn(async () => [
    "ai-provider-config:model-catalog",
  ]),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/permissions-server", () => ({ getCurrentPermissions }))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { fetchAuthenticated } from "@/app/api/auth/action"
import {
  createAiProviderCredential,
  createAiProviderConfig,
  deleteAiProviderConfig,
  deleteAiProviderCredential,
  getAiProviderConfigById,
  getAiProviderConfigs,
  getAiProviderModelCatalog,
  updateAiProviderConfig,
  updateAiProviderCredential,
} from "@/app/api/ai-provider-configs/action"
import { revalidatePath } from "next/cache"

const connectionResponse = {
  id: 42,
  providerType: "DEEPSEEK",
  defaultProvider: false,
  description: "Market analysis",
  baseUrl: "https://api.deepseek.com/v1",
  credentials: [{ id: 8, keyPreview: "sk-...old" }],
}

const detailResponse = {
  ...connectionResponse,
  taskReferences: [{ task: "MARKET_REACTION_ANALYSIS", model: "legacy-model" }],
}

const pageResponse = {
  content: [
    {
      ...connectionResponse,
      providerType: "GROQ",
      taskReferences: undefined,
    },
  ],
  pageable: {
    pageNumber: 1,
    pageSize: 10,
    offset: 10,
    paged: true,
    unpaged: false,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  last: false,
  totalElements: 21,
  totalPages: 3,
  size: 10,
  number: 1,
  first: false,
  numberOfElements: 1,
  sort: { sorted: true, unsorted: false, empty: false },
  empty: false,
}

describe("AI connection actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockReset()
    getCurrentPermissions
      .mockReset()
      .mockResolvedValue(["ai-provider-config:model-catalog"])
  })

  it("sends the OpenAPI create payload and only reports success after a valid response", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(connectionResponse)

    await expect(
      createAiProviderConfig({
        providerType: "DEEPSEEK",
        description: "Market analysis",
        baseUrl: "https://api.deepseek.com/v1",
        credentials: [{ apiKey: "sk-test-key" }],
      })
    ).resolves.toEqual({ success: true, data: connectionResponse })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/ai-provider-configs", {
      method: "POST",
      body: JSON.stringify({
        providerType: "DEEPSEEK",
        description: "Market analysis",
        baseUrl: "https://api.deepseek.com/v1",
        credentials: [{ apiKey: "sk-test-key" }],
      }),
    })
    expect(
      JSON.stringify(vi.mocked(fetchAuthenticated).mock.calls[0])
    ).not.toContain("defaultProvider")
    expect(
      JSON.stringify(vi.mocked(fetchAuthenticated).mock.calls[0])
    ).not.toContain('"model"')
    expect(revalidatePath).toHaveBeenCalledWith("/ai-provider-configs")
    expect(revalidatePath).toHaveBeenCalledWith("/ai-provider-configs/42")
  })

  it("rejects empty keys and legacy providers before the authenticated POST", async () => {
    const emptyKey = await createAiProviderConfig({
      providerType: "OPENAI",
      credentials: [{ apiKey: "   " }],
    })
    const unsupportedProvider = await createAiProviderConfig({
      providerType: "GROQ" as never,
      credentials: [{ apiKey: "sk-test-key" }],
    })

    expect(emptyKey).toEqual({
      success: false,
      error: "Connection request invalid",
    })
    expect(unsupportedProvider).toEqual({
      success: false,
      error: "Connection request invalid",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("returns a safe provider validation reason without echoing a submitted key", async () => {
    const apiKey = "sk-test-secret"
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error(`API key ${apiKey} was rejected`), {
        status: 400,
      })
    )

    await expect(
      createAiProviderConfig({
        providerType: "OPENAI",
        credentials: [{ apiKey }],
      })
    ).resolves.toEqual({
      success: false,
      error: "API key [redacted] was rejected",
    })
  })

  it("does not call the model catalog without its separate permission", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:read"])

    await expect(
      getAiProviderModelCatalog({
        providerType: "OPENAI",
        apiKey: "sk-test-key",
      })
    ).resolves.toEqual({
      success: false,
      error: "Catalog permission required",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("loads a catalog through the authenticated API after permission is checked", async () => {
    const catalog = {
      providerType: "OPENAI",
      models: [{ id: "gpt-4o", label: "GPT-4o" }],
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(catalog)

    await expect(
      getAiProviderModelCatalog({
        providerType: "OPENAI",
        apiKey: "sk-test-key",
      })
    ).resolves.toEqual({ success: true, data: catalog })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-provider-configs/model-catalog",
      {
        method: "POST",
        body: JSON.stringify({ providerType: "OPENAI", apiKey: "sk-test-key" }),
      }
    )
  })

  it("retains the producer page count and legacy connection data", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(pageResponse)

    const result = await getAiProviderConfigs({
      filter: "",
      page: 1,
      size: 10,
      sort: [{ field: "id", direction: "desc" }],
    })

    expect(result.totalElements).toBe(21)
    expect(result.totalPages).toBe(3)
    expect(result.number).toBe(1)
    expect(result.content[0]).toMatchObject({
      providerType: "GROQ",
      defaultProvider: false,
      credentials: [{ keyPreview: "sk-...old" }],
    })
    expect(result.content[0].taskReferences).toBeUndefined()
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-provider-configs?page=1&size=10&sort=id%2Cdesc"
    )
  })

  it("loads read-only detail with actual task references", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(detailResponse)

    await expect(getAiProviderConfigById(42)).resolves.toEqual(detailResponse)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/ai-provider-configs/42")
  })

  it("updates only endpoint and description after update permission and validates the detail response", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:update"])
    vi.mocked(fetchAuthenticated).mockResolvedValue(detailResponse)

    await expect(
      updateAiProviderConfig(42, {
        baseUrl: "https://custom.deepseek.test/v1",
        description: "New description",
      })
    ).resolves.toEqual({ success: true, data: detailResponse })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/ai-provider-configs/42", {
      method: "PUT",
      body: JSON.stringify({
        description: "New description",
        baseUrl: "https://custom.deepseek.test/v1",
      }),
    })
    expect(
      JSON.stringify(vi.mocked(fetchAuthenticated).mock.calls[0])
    ).not.toContain("providerType")
    expect(
      JSON.stringify(vi.mocked(fetchAuthenticated).mock.calls[0])
    ).not.toContain("defaultProvider")
    expect(
      JSON.stringify(vi.mocked(fetchAuthenticated).mock.calls[0])
    ).not.toContain('"model"')
    expect(revalidatePath).toHaveBeenCalledWith("/ai-provider-configs")
    expect(revalidatePath).toHaveBeenCalledWith("/ai-provider-configs/42")
  })

  it("passes nullable baseUrl through unchanged because null keeps the endpoint", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:update"])
    vi.mocked(fetchAuthenticated).mockResolvedValue(detailResponse)

    await expect(
      updateAiProviderConfig(42, { baseUrl: null })
    ).resolves.toEqual({ success: true, data: detailResponse })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/ai-provider-configs/42", {
      method: "PUT",
      body: JSON.stringify({ baseUrl: null }),
    })
  })

  it("checks endpoint update permission and rejects immutable or empty credential payloads before the API call", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:read"])
    await expect(
      updateAiProviderConfig(42, { description: "No permission" })
    ).resolves.toEqual({
      success: false,
      error: "Update permission required",
    })

    getCurrentPermissions.mockResolvedValue(["ai-provider-config:update"])
    const immutableFields = await updateAiProviderConfig(42, {
      providerType: "OPENAI",
      defaultProvider: true,
    } as never)
    const emptyReplacement = await updateAiProviderCredential(42, 8, {
      apiKey: "   ",
    })

    expect(immutableFields).toEqual({
      success: false,
      error: "Connection request invalid",
    })
    expect(emptyReplacement).toEqual({
      success: false,
      error: "Connection request invalid",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("adds and replaces masked credentials with only the submitted key in the request", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:create"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      id: 9,
      keyPreview: "sk-...new",
    })

    const addResult = await createAiProviderCredential(42, {
      apiKey: "sk-new-secret",
    })
    expect(addResult).toEqual({
      success: true,
      data: { id: 9, keyPreview: "sk-...new" },
    })
    expect(JSON.stringify(addResult)).not.toContain("sk-new-secret")
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-provider-configs/42/credentials",
      { method: "POST", body: JSON.stringify({ apiKey: "sk-new-secret" }) }
    )

    getCurrentPermissions.mockResolvedValue(["ai-provider-config:update"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      id: 8,
      keyPreview: "sk-...replacement",
    })
    const replaceResult = await updateAiProviderCredential(42, 8, {
      apiKey: "sk-replacement-secret",
    })
    expect(replaceResult).toEqual({
      success: true,
      data: { id: 8, keyPreview: "sk-...replacement" },
    })
    expect(JSON.stringify(replaceResult)).not.toContain("sk-replacement-secret")
    expect(fetchAuthenticated).toHaveBeenLastCalledWith(
      "/ai-provider-configs/42/credentials/8",
      {
        method: "PUT",
        body: JSON.stringify({ apiKey: "sk-replacement-secret" }),
      }
    )
  })

  it("redacts submitted keys from provider validation errors", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:create"])
    const apiKey = "sk-credential-secret"
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error(`Catalog rejected ${apiKey}`), { status: 400 })
    )

    await expect(createAiProviderCredential(42, { apiKey })).resolves.toEqual({
      success: false,
      error: "Catalog rejected [redacted]",
    })
  })

  it("gates destructive calls and sends DELETE requests without response bodies", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:read"])
    await expect(deleteAiProviderCredential(42, 8)).resolves.toEqual({
      success: false,
      error: "Delete permission required",
    })
    await expect(deleteAiProviderConfig(42)).resolves.toEqual({
      success: false,
      error: "Delete permission required",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    getCurrentPermissions.mockResolvedValue(["ai-provider-config:delete"])
    vi.mocked(fetchAuthenticated).mockResolvedValue(undefined)
    await expect(deleteAiProviderCredential(42, 8)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    await expect(deleteAiProviderConfig(42)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      1,
      "/ai-provider-configs/42/credentials/8",
      { method: "DELETE" }
    )
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      2,
      "/ai-provider-configs/42",
      { method: "DELETE" }
    )
  })

  it("rejects a response that tries to return a plaintext credential", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...connectionResponse,
      credentials: [{ id: 8, keyPreview: "sk-...old", apiKey: "secret" }],
    })

    await expect(
      createAiProviderConfig({
        providerType: "DEEPSEEK",
        credentials: [{ apiKey: "sk-test-key" }],
      })
    ).resolves.toEqual({
      success: false,
      error: "Connection response invalid",
    })
  })
})
