import { expect, test } from "./fixtures"
import type { Page } from "@playwright/test"

async function clickGraphAnchor(page: Page) {
  const point = await graphAnchorPoint(page)
  await page.mouse.click(point.x, point.y)
}

async function tapGraphAnchor(page: Page) {
  const point = await graphAnchorPoint(page)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  })
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await cdp.detach()
}

async function graphAnchorPoint(page: Page) {
  return page.getByTestId("graph-demo-canvas").evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return {
      x: rect.x + Number((el as HTMLElement).dataset.benchmarkAnchorX),
      y: rect.y + Number((el as HTMLElement).dataset.benchmarkAnchorY),
    }
  })
}

test("canvas click keeps layout still and mouse/touch drag wakes forces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view")
  const root = page.getByTestId("graph-view")
  await expect(root).toHaveAttribute("data-layout-status", "ready", {
    timeout: 90_000,
  })
  const canvas = page.getByTestId("graph-demo-canvas")
  const anchor = async () =>
    canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        x: rect.x + Number(element.getAttribute("data-benchmark-anchor-x")),
        y: rect.y + Number(element.getAttribute("data-benchmark-anchor-y")),
      }
    })
  await page.waitForTimeout(500)
  const start = await anchor()
  await page.mouse.click(start.x, start.y)
  await expect(page.getByTestId("graph-demo-inspector")).toBeVisible()
  await expect(root).toHaveAttribute("data-layout-status", "ready")
  await page.waitForTimeout(900)
  expect(
    Math.hypot((await anchor()).x - start.x, (await anchor()).y - start.y)
  ).toBeLessThan(2)
  await page
    .getByTestId("graph-demo-inspector")
    .getByRole("button", { name: "Đóng chi tiết nút", exact: true })
    .click()
  const neighborBefore = await canvas.evaluate((el) => ({
    x: Number((el as HTMLElement).dataset.neighborX),
    y: Number((el as HTMLElement).dataset.neighborY),
  }))
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 65, start.y + 45, { steps: 10 })
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  const draggedNodeId = (await canvas.getAttribute("data-benchmark-anchor-id"))!
  await expect(canvas).toHaveAttribute("data-dragging-node-id", draggedNodeId)
  await page.waitForTimeout(2300)
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  expect(
    JSON.parse((await canvas.getAttribute("data-rendered-label-boxes"))!).every(
      (label: { side: string }) => label.side === "right"
    )
  ).toBe(true)
  const neighborAfter = await canvas.evaluate((el) => ({
    x: Number((el as HTMLElement).dataset.neighborX),
    y: Number((el as HTMLElement).dataset.neighborY),
  }))
  expect(
    Math.hypot(
      neighborAfter.x - neighborBefore.x,
      neighborAfter.y - neighborBefore.y
    )
  ).toBeGreaterThan(2)
  const dragged = await anchor()
  expect(dragged.x).toBeCloseTo(start.x + 65, 0)
  expect(dragged.y).toBeCloseTo(start.y + 45, 0)
  await page.mouse.up()
  await expect(canvas).toHaveAttribute("data-dragging-node-id", "")
  await expect(canvas).toHaveAttribute("data-hovered-node-id", "")
  await expect(canvas).toHaveAttribute("data-hovered-edge-id", "")
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  await expect(root).toHaveAttribute("data-layout-status", "ready")
  await expect(canvas).toHaveAttribute("data-hovered-node-id", "")
  await expect(canvas).toHaveAttribute("data-hovered-edge-id", "")
  const released = await anchor()
  await page.waitForTimeout(300)
  expect(
    Math.hypot((await anchor()).x - released.x, (await anchor()).y - released.y)
  ).toBeLessThan(2)
  await page.mouse.move(released.x + 1, released.y + 1)
  await expect(canvas).toHaveAttribute(
    "data-hovered-node-id",
    (await canvas.getAttribute("data-benchmark-anchor-id"))!
  )
  const touchStart = await anchor()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: touchStart.x, y: touchStart.y }],
  })
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: touchStart.x - 40, y: touchStart.y + 35 }],
  })
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  await expect(canvas).toHaveAttribute("data-dragging-node-id", draggedNodeId)
  await page.waitForTimeout(300)
  const touched = await anchor()
  expect(touched.x).toBeCloseTo(touchStart.x - 40, 0)
  expect(touched.y).toBeCloseTo(touchStart.y + 35, 0)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await expect(root).toHaveAttribute("data-layout-status", "ready")
  await expect(canvas).toHaveAttribute("data-dragging-node-id", "")
  await expect(canvas).toHaveAttribute("data-hovered-node-id", "")
  await expect(canvas).toHaveAttribute("data-hovered-edge-id", "")
  await cdp.detach()
})

for (const width of [1520, 1024, 390, 360]) {
  test(`Sigma workspace graph reads relationships and real detail at ${width}px`, async ({
    page,
    fixture,
  }) => {
    const height = width === 1520 ? 1024 : width === 1024 ? 768 : 844
    await page.setViewportSize({ width, height })
    await page.goto("/vi/graph-view")
    await expect(page.getByTestId("graph-demo-node-count")).toHaveText("2 nút")
    await expect(page.getByTestId("graph-demo-density-controls")).toHaveCount(0)
    await expect(page.getByTestId("graph-view")).toHaveAttribute(
      "data-layout-status",
      "ready",
      { timeout: 30_000 }
    )
    await page.screenshot({ path: `test-results/sigma-canvas-${width}.png` })
    await expect(page.getByRole("combobox")).toHaveCount(0)
    await expect(page.getByTestId("graph-demo-re-layout")).toHaveCount(0)
    await expect(
      page.getByTestId("graph-demo-edge-legend").locator('[data-slot="badge"]')
    ).toHaveCount(4)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Biểu đồ tri thức"
    )
    const legend = (await page
      .getByTestId("graph-demo-edge-legend")
      .boundingBox())!
    const launcher = (await page
      .getByRole("button", { name: "Mở trợ lý AI", exact: true })
      .boundingBox())!
    expect(
      legend.x + legend.width <= launcher.x ||
        legend.y + legend.height <= launcher.y
    ).toBe(true)
    if (width <= 390) await tapGraphAnchor(page)
    else await clickGraphAnchor(page)
    const inspector = page.getByTestId("graph-demo-inspector")
    await expect(inspector).toContainText(
      "Central bank signals a slower easing path"
    )
    await expect(inspector.locator("dl")).toContainText("92%")
    await expect(inspector.locator("dl")).toContainText(/\d{2}:\d{2}/)
    await expect(inspector).not.toContainText("Nút liên quan")
    await expect(inspector).not.toContainText("Cạnh liên quan")
    await expect(inspector).not.toContainText("nút liên quan")
    const controls = (await page
      .getByTestId("graph-demo-zoom-in")
      .boundingBox())!
    const panel = (await inspector.boundingBox())!
    if (width >= 1440) expect(controls.x + controls.width).toBeLessThan(panel.x)
    else {
      expect(controls.width).toBe(28)
      expect(controls.y + controls.height).toBeLessThan(panel.y)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width)
    await page.screenshot({ path: `test-results/sigma-node-${width}.png` })
    await inspector
      .getByRole("button", { name: "Đọc sự kiện", exact: true })
      .click()
    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(
      inspector.getByRole("button", { name: "Đọc sự kiện", exact: true })
    ).toBeFocused()
    await page.getByTestId("graph-demo-close-inspector").click()
    await expect(inspector).toHaveCount(0)
    // Separate the next canvas action from Sigma's double-click zoom gesture.
    await page.waitForTimeout(400)
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    const midpoint = await page
      .getByTestId("graph-demo-canvas")
      .evaluate((el) => {
        const r = el.getBoundingClientRect(),
          data = (el as HTMLElement).dataset
        return {
          x: r.x + (Number(data.benchmarkAnchorX) + Number(data.neighborX)) / 2,
          y: r.y + (Number(data.benchmarkAnchorY) + Number(data.neighborY)) / 2,
        }
      })
    const edge = page.getByTestId("graph-demo-edge-inspector")
    const canvas = page.getByTestId("graph-demo-canvas")
    await page.mouse.move(midpoint.x, midpoint.y + 6)
    await expect(canvas).toHaveAttribute("data-hovered-edge-id", /.+/)
    await expect(edge).toHaveCount(0)
    await page.screenshot({
      path: `test-results/sigma-edge-hover-${width}.png`,
    })
    await page.mouse.move(midpoint.x, midpoint.y + 24)
    await expect(canvas).toHaveAttribute("data-hovered-edge-id", "")
    await page.mouse.click(midpoint.x, midpoint.y + 6)
    await expect(edge).toBeVisible()
    await expect(edge).toContainText("Nguồn · Sự kiện")
    await expect(edge).toContainText("Đích · Tài sản")
    await expect(edge).toContainText(
      "Central bank signals a slower easing path"
    )
    await expect(edge).toContainText("Bitcoin")
    await expect(edge).toContainText("không khẳng định quan hệ nhân quả")
    await expect(edge.getByRole("button")).toHaveCount(1)
    const state = await fixture.state()
    expect(
      state.requests.some((request) => request.path === "/graph-view")
    ).toBe(true)
    expect(
      state.requests.some((request) =>
        String(request.path).startsWith("/events/")
      )
    ).toBe(true)
    await page.screenshot({ path: `test-results/sigma-workspace-${width}.png` })
  })
}

test("Sigma workspace graph preserves graph permission", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([])
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText("Bạn không có quyền truy cập biểu đồ tri thức.")
  ).toBeVisible()
  expect(
    (await fixture.state()).requests.some(
      (request) => request.path === "/graph-view"
    )
  ).toBe(false)
})

test("live Graph View distinguishes empty watchlist from empty graph", async ({
  page,
  fixture,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await fixture.setScenario("/graph-view", "empty", "GET")
  await fixture.setScenario("/watchlists", "empty", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByRole("heading", { name: "Watchlist chưa có tài sản" })
  ).toBeVisible()
  await expect(
    page.getByText("Thêm tài sản vào watchlist của workspace này", {
      exact: false,
    })
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/graph-state-empty-watchlist.png",
  })
  await page
    .getByRole("button", { name: "Quản lý tài sản theo dõi", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText("Workspace Alpha")

  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  await fixture.setScenario("/watchlists", "success", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByRole("heading", { name: "Chưa có dữ liệu graph liên quan" })
  ).toBeVisible()
  await expect(
    page.getByText("Điều đó không có nghĩa các tài sản không chịu ảnh hưởng.")
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/graph-state-no-related-data.png",
  })
})

test("live Graph View keeps permission, transport and schema failures distinct", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("/graph-view", "permission-denied", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText("Bạn không có quyền truy cập biểu đồ tri thức.")
  ).toBeVisible()

  await fixture.setScenario("/graph-view", "outage", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText("Không thể tải biểu đồ tri thức", { exact: true })
  ).toBeVisible()
  await expect(page.getByText("Fixture backend is unavailable")).toHaveCount(0)
  await page.screenshot({ path: "test-results/graph-state-load-error.png" })

  await fixture.setScenario("/graph-view", "invalid-schema", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText("Không thể tải biểu đồ tri thức", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText(
      "Backend trả về dữ liệu biểu đồ tri thức không đúng định dạng mong đợi."
    )
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Thử lại", exact: true })
  ).toBeVisible()
  await page.screenshot({ path: "test-results/graph-state-schema-error.png" })

  await fixture.setScenario("/graph-view", "empty", "GET")
  await fixture.setScenario("/watchlists", "permission-denied", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText(
      "Bạn cần quyền watchlist để xác định workspace này có tài sản đang theo dõi hay không."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Watchlist chưa có tài sản" })
  ).toHaveCount(0)

  await fixture.reset()
  await fixture.setPermissions(["graph-view:read"])
  await fixture.setScenario("/graph-view", "empty", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByText(
      "Bạn cần quyền watchlist để xác định workspace này có tài sản đang theo dõi hay không."
    )
  ).toBeVisible()
  expect(
    (await fixture.state()).requests.some(
      (request) => request.path === "/watchlists"
    )
  ).toBe(false)
})

test("Graph View asks for a workspace when none is selected", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("/me", "workspace-not-selected", "GET")
  await page.goto("/vi/graph-view")
  await expect(
    page.getByRole("heading", { name: "Chọn workspace" })
  ).toBeVisible()
  await expect(page.locator("#workspace-switcher-trigger")).toContainText(
    "Chưa chọn"
  )
  await page.screenshot({ path: "test-results/graph-state-no-workspace.png" })
  await page
    .getByRole("button", { name: "Chọn hoặc tạo workspace", exact: true })
    .click()
  await expect(
    page.getByRole("menuitem").filter({ hasText: "Workspace Alpha" })
  ).toContainText("Có thể chuyển sang")
  await expect(
    page.getByRole("menuitem").filter({ hasText: "Workspace Beta" })
  ).toContainText("Có thể chuyển sang")
})

test("Graph View drops a delayed response from the previous workspace", async ({
  page,
  fixture,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await fixture.setScenario("/graph-view", "delayed-old-workspace", "GET")
  await page.goto("/vi/graph-view", { waitUntil: "commit" })
  await expect
    .poll(async () => (await fixture.state()).pendingRequests)
    .toBeGreaterThan(0)

  const workspaceSwitcher = page.locator("#workspace-switcher-trigger")
  await expect(workspaceSwitcher).toBeVisible()
  await workspaceSwitcher.click()
  await page.getByRole("menuitem").filter({ hasText: "Workspace Beta" }).click()
  await expect(workspaceSwitcher).toContainText("Workspace Beta")
  await expect
    .poll(
      async () =>
        (await fixture.state()).requests.filter(
          (request) => request.path === "/graph-view"
        ).length
    )
    .toBeGreaterThanOrEqual(2)

  await fixture.setScenario("/graph-view", "success", "GET")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 30_000 }
  )
  await clickGraphAnchor(page)
  const inspector = page.getByTestId("graph-demo-inspector")
  await expect(inspector).toContainText("Workspace Beta event")
  await expect(inspector).not.toContainText(
    "Central bank signals a slower easing path"
  )
  await page.screenshot({ path: "test-results/graph-state-workspace-beta.png" })
})

test("Graph View clears the prior selection after switching workspaces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/graph-view")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 30_000 }
  )
  await clickGraphAnchor(page)
  const inspector = page.getByTestId("graph-demo-inspector")
  await expect(inspector).toContainText(
    "Central bank signals a slower easing path"
  )

  const workspaceSwitcher = page.locator("#workspace-switcher-trigger")
  await workspaceSwitcher.click()
  await page.getByRole("menuitem").filter({ hasText: "Workspace Beta" }).click()
  await expect(workspaceSwitcher).toContainText("Workspace Beta")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 30_000 }
  )
  await expect(inspector).toHaveCount(0)

  await clickGraphAnchor(page)
  await expect(page.getByTestId("graph-demo-inspector")).toContainText(
    "Workspace Beta event"
  )
})

test("Sigma pointer selection halo and pan preserve graph context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 90000 }
  )
  const canvas = page.getByTestId("graph-demo-canvas")
  const position = () =>
    canvas.evaluate((el) => ({
      x: Number((el as HTMLElement).dataset.benchmarkAnchorX),
      y: Number((el as HTMLElement).dataset.benchmarkAnchorY),
      ratio: Number((el as HTMLElement).dataset.cameraRatio),
    }))
  const haloPixels = () =>
    canvas.evaluate((el) => {
      const layer = el.querySelector<HTMLCanvasElement>("canvas.sigma-hovers")!
      const pixels = layer
        .getContext("2d")!
        .getImageData(0, 0, layer.width, layer.height).data
      let count = 0
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count++
      return count
    })
  const box = (await canvas.boundingBox())!
  const start = await position()
  await page.mouse.move(box.x + start.x, box.y + start.y)
  await expect.poll(haloPixels).toBe(0)
  const selectEvent = async () => {
    await clickGraphAnchor(page)
    await expect(page.getByTestId("graph-demo-inspector")).toBeVisible()
    await expect.poll(haloPixels).toBeGreaterThan(0)
  }
  await selectEvent()
  await page.waitForTimeout(250)
  expect((await position()).x).toBeCloseTo(start.x, 0)
  expect((await position()).y).toBeCloseTo(start.y, 0)
  await page.screenshot({ path: "test-results/sigma-selected-halo.png" })
  await page.getByTestId("graph-demo-close-inspector").click()
  await expect.poll(haloPixels).toBe(0)
  await selectEvent()

  for (const delta of [-60, 60]) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height - 90)
    await page.mouse.down()
    await page.mouse.move(
      box.x + box.width * 0.5 + delta,
      box.y + box.height - 90,
      { steps: 10 }
    )
    await page.mouse.up()
    await expect(page.getByTestId("graph-demo-inspector")).toBeVisible()
    await expect.poll(async () => (await position()).x).toBeGreaterThan(16)
    expect((await position()).ratio).toBeCloseTo(start.ratio, 5)
  }
  await page.getByTestId("graph-demo-close-inspector").click()
})

test("Sigma render scale and labels remain readable", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view?edges=100")
  const root = page.getByTestId("graph-view")
  await expect(root).toHaveAttribute("data-layout-status", "ready", {
    timeout: 90000,
  })
  const canvas = page.getByTestId("graph-demo-canvas")
  const metrics = () =>
    canvas.evaluate((el) => ({
      diameter: Number((el as HTMLElement).dataset.renderedNodeDiameter),
      base: Number((el as HTMLElement).dataset.nodeBaseDiameter),
      ratio: Number((el as HTMLElement).dataset.cameraRatio),
      labels: Number((el as HTMLElement).dataset.renderedLabelCount),
      fontSize: Number(
        (el.querySelector("canvas.sigma-labels") as HTMLCanvasElement)
          ?.getContext("2d")
          ?.font.match(/([\d.]+)px/)?.[1]
      ),
    }))
  const initial = await metrics()
  console.log("Render metrics", initial)
  expect(initial.diameter).toBeCloseTo(initial.base, 0)
  expect(initial.labels).toBeGreaterThan(3)
  expect(initial.fontSize).toBeCloseTo(11, 1)
  const boxes = await canvas.evaluate(
    (el) =>
      JSON.parse((el as HTMLElement).dataset.renderedLabelBoxes ?? "[]") as {
        id: string
        x: number
        y: number
        width: number
        height: number
        side: string
      }[]
  )
  expect(boxes.every((label) => !label.id.startsWith("news-article:"))).toBe(
    true
  )
  expect(boxes.every((label) => label.side === "right")).toBe(true)
  await page.screenshot({ path: "test-results/sigma-readable-100.png" })
  await page
    .getByRole("button", { name: "Thu nhỏ biểu đồ", exact: true })
    .click()
  await page.waitForTimeout(300)
  const zoomed = await metrics()
  expect(zoomed.diameter * zoomed.ratio).toBeCloseTo(
    initial.diameter * initial.ratio,
    0
  )
  const recenter = page.getByRole("button", {
    name: "Đưa biểu đồ về trung tâm",
    exact: true,
  })
  for (let i = 0; i < 3; i++) {
    await recenter.click()
    await expect
      .poll(async () => (await metrics()).diameter / initial.base)
      .toBeGreaterThanOrEqual(0.449)
    const fitted = await metrics()
    expect(fitted.diameter * fitted.ratio).toBeCloseTo(initial.diameter, 0)
  }
  const zoomOut = page.getByRole("button", {
    name: "Thu nhỏ biểu đồ",
    exact: true,
  })
  for (let i = 0; i < 14; i++) {
    await zoomOut.click()
    await page.waitForTimeout(250)
  }
  const minimum = await metrics()
  expect(minimum.ratio).toBeCloseTo(1 / 0.45, 3)
  expect(minimum.diameter).toBeCloseTo(initial.base * 0.45, 1)
  expect(minimum.fontSize).toBeCloseTo(11 * 0.45, 1)
  await page.screenshot({ path: "test-results/sigma-zoom-limits.png" })
})

test("Sigma article labels follow hover and selection instead of background density", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view?edges=100")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 90000 }
  )
  const canvas = page.getByTestId("graph-demo-canvas")
  const labels = () =>
    canvas.evaluate(
      (el) =>
        JSON.parse((el as HTMLElement).dataset.renderedLabelBoxes ?? "[]") as {
          id: string
          priority: number
          side: string
          x: number
          y: number
          width: number
          height: number
        }[]
    )
  const screenshot = await canvas.screenshot()
  const point = await page.evaluate(async (png) => {
    const bitmap = await createImageBitmap(
      new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], {
        type: "image/png",
      })
    )
    const surface = document.createElement("canvas")
    surface.width = bitmap.width
    surface.height = bitmap.height
    const context = surface.getContext("2d")!
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, surface.width, surface.height)
    const articlePixel = (x: number, y: number) => {
      const i = (y * surface.width + x) * 4
      return (
        data[i] > 150 &&
        data[i + 1] < 40 &&
        data[i + 2] > 40 &&
        data[i + 2] < 100
      )
    }
    for (let y = 180; y < surface.height - 100; y++)
      for (let x = 80; x < surface.width - 80; x++)
        if (
          articlePixel(x, y) &&
          articlePixel(x - 7, y) &&
          articlePixel(x + 7, y) &&
          articlePixel(x, y - 7) &&
          articlePixel(x, y + 7)
        )
          return { x, y }
    throw new Error("No visible article node")
  }, screenshot.toString("base64"))
  const initialBox = (await canvas.boundingBox())!
  await page.mouse.click(initialBox.x + point.x, initialBox.y + point.y)
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id.startsWith("news-article:") && label.priority === 0
      )
    )
    .toBe(true)
  const selectedArticleId = (await labels()).find(
    (label) => label.id.startsWith("news-article:") && label.priority === 0
  )?.id
  expect(selectedArticleId).toBeTruthy()
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id === selectedArticleId && label.priority === 0
      )
    )
    .toBe(true)
  await page.waitForTimeout(250)
  const article = (await labels()).find(
    (label) => label.id === selectedArticleId
  )!
  const panel = (await page.getByTestId("graph-demo-inspector").boundingBox())!
  const canvasBox = (await canvas.boundingBox())!
  expect(
    article.x + article.width <= panel.x - canvasBox.x ||
      article.y + article.height <= panel.y - canvasBox.y ||
      article.y >= panel.y + panel.height - canvasBox.y
  ).toBe(true)
  const scale = await canvas.evaluate(
    (el) =>
      Number((el as HTMLElement).dataset.renderedNodeDiameter) /
      Number((el as HTMLElement).dataset.nodeBaseDiameter)
  )
  const center = {
    x:
      article.side === "right"
        ? article.x - 21 * scale
        : article.side === "left"
          ? article.x + article.width + 21 * scale
          : article.x + article.width / 2,
    y:
      article.side === "above"
        ? article.y + article.height + 21 * scale
        : article.side === "below"
          ? article.y - 21 * scale
          : article.y + article.height / 2,
  }
  await page.getByTestId("graph-demo-close-inspector").click()
  const resetBox = (await canvas.boundingBox())!
  await page.mouse.move(resetBox.x + 80, resetBox.y + resetBox.height - 160)
  await expect
    .poll(async () =>
      (await labels()).some((label) => label.id.startsWith("news-article:"))
    )
    .toBe(false)
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + center.x, box.y + center.y)
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id === selectedArticleId && label.priority === 2
      )
    )
    .toBe(true)
  await page.mouse.click(box.x + center.x, box.y + center.y)
  await page.mouse.move(box.x + 50, box.y + box.height - 70)
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id === selectedArticleId && label.priority === 0
      )
    )
    .toBe(true)
  await page.screenshot({ path: "test-results/sigma-label-selection.png" })
})
