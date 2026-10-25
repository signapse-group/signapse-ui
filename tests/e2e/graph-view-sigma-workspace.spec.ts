import { expect, test } from "./fixtures"

test("canvas click keeps layout still and mouse/touch drag wakes forces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view-sigma-demo")
  const root = page.getByTestId("graph-view-sigma-demo")
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
  await expect(canvas).toHaveAttribute("data-labels-frozen", "true")
  const draggedLabels = await canvas.getAttribute("data-rendered-label-ids")
  await page.waitForTimeout(2300)
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  await expect(canvas).toHaveAttribute(
    "data-rendered-label-ids",
    draggedLabels!
  )
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
  await expect(canvas).toHaveAttribute("data-labels-frozen", "true")
  await page.mouse.click(900, 750)
  await expect(root).toHaveAttribute("data-layout-status", "refining")
  await expect(root).toHaveAttribute("data-layout-status", "ready")
  await expect(canvas).toHaveAttribute("data-labels-frozen", "false")
  const released = await anchor()
  await page.waitForTimeout(300)
  expect(
    Math.hypot((await anchor()).x - released.x, (await anchor()).y - released.y)
  ).toBeLessThan(2)
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
  await expect(canvas).toHaveAttribute("data-labels-frozen", "true")
  await page.waitForTimeout(300)
  const touched = await anchor()
  expect(touched.x).toBeCloseTo(touchStart.x - 40, 0)
  expect(touched.y).toBeCloseTo(touchStart.y + 35, 0)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await expect(root).toHaveAttribute("data-layout-status", "ready")
  await expect(canvas).toHaveAttribute("data-labels-frozen", "false")
  await cdp.detach()
})

for (const width of [1600, 390]) {
  test(`Sigma workspace graph reads relationships and real detail at ${width}px`, async ({
    page,
    fixture,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/vi/graph-view-sigma-demo")
    await expect(page.getByTestId("graph-demo-node-count")).toHaveText("2 nút")
    await expect(page.getByTestId("graph-demo-density-controls")).toHaveCount(0)
    await expect(page.getByTestId("graph-view-sigma-demo")).toHaveAttribute(
      "data-layout-status",
      "ready",
      { timeout: 30_000 }
    )
    await page.screenshot({ path: `test-results/sigma-canvas-${width}.png` })
    const selector = page.getByTestId("graph-demo-node-selector")
    await selector.focus()
    await page.keyboard.press("Enter")
    await page.getByRole("option", { name: /Sự kiện: Central bank/ }).click()
    const inspector = page.getByTestId("graph-demo-inspector")
    await expect(inspector).toContainText(
      "Central bank signals a slower easing path"
    )
    await expect(inspector.locator("dl")).toContainText("92%")
    await expect(inspector.locator("dl")).toContainText(/\d{2}:\d{2}/)
    await inspector
      .getByRole("button", { name: /^Tài sản bị ảnh hưởng:/ })
      .click()
    const edge = page.getByTestId("graph-demo-edge-inspector")
    await expect(edge).toContainText(
      "Central bank signals a slower easing path →"
    )
    await expect
      .poll(() =>
        page.getByTestId("graph-demo-canvas").evaluate((el) => {
          const labels = JSON.parse(
            (el as HTMLElement).dataset.renderedLabelBoxes ?? "[]"
          ) as { priority: number }[]
          return (
            labels.length === 2 && labels.every((label) => label.priority === 1)
          )
        })
      )
      .toBe(true)
    await edge
      .getByRole("button", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
      .click()
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
  await page.goto("/vi/graph-view-sigma-demo")
  await expect(
    page.getByText("Bạn không có quyền truy cập biểu đồ tri thức.")
  ).toBeVisible()
  expect(
    (await fixture.state()).requests.some(
      (request) => request.path === "/graph-view"
    )
  ).toBe(false)
})

test("Sigma selection halo and conditional pan preserve graph context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view-sigma-demo")
  await expect(page.getByTestId("graph-view-sigma-demo")).toHaveAttribute(
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
    await page.getByTestId("graph-demo-node-selector").click()
    await page.getByRole("option", { name: /Sự kiện: Central bank/ }).click()
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

  for (const delta of [-750, 1100]) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height - 90)
    await page.mouse.down()
    await page.mouse.move(
      box.x + box.width * 0.5 + delta,
      box.y + box.height - 90,
      { steps: 10 }
    )
    await page.mouse.up()
    await selectEvent()
    await expect.poll(async () => (await position()).x).toBeGreaterThan(16)
    await expect
      .poll(async () => {
        const inspector = (await page
          .getByTestId("graph-demo-inspector")
          .boundingBox())!
        return (await position()).x < inspector.x - box.x - 16
      })
      .toBe(true)
    expect((await position()).ratio).toBeCloseTo(start.ratio, 5)
    await page.getByTestId("graph-demo-close-inspector").click()
  }
})

test("Sigma render scale and labels remain readable", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/vi/graph-view-sigma-demo?edges=100")
  const root = page.getByTestId("graph-view-sigma-demo")
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
      }[]
  )
  expect(boxes.every((label) => !label.id.startsWith("news-article:"))).toBe(
    true
  )
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j]
      expect(
        a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
      ).toBe(false)
    }
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
  await page.goto("/vi/graph-view-sigma-demo?edges=100")
  await expect(page.getByTestId("graph-view-sigma-demo")).toHaveAttribute(
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
  await page.getByTestId("graph-demo-node-selector").click()
  await page
    .getByRole("option", { name: /Bài viết: Bài viết phân tích 01/ })
    .click()
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id === "news-article:201" && label.priority === 0
      )
    )
    .toBe(true)
  await page.waitForTimeout(250)
  const article = (await labels()).find(
    (label) => label.id === "news-article:201"
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
        (label) => label.id === "news-article:201" && label.priority === 2
      )
    )
    .toBe(true)
  await page.mouse.click(box.x + center.x, box.y + center.y)
  await page.mouse.move(box.x + 50, box.y + box.height - 70)
  await expect
    .poll(async () =>
      (await labels()).some(
        (label) => label.id === "news-article:201" && label.priority === 0
      )
    )
    .toBe(true)
  await page.screenshot({ path: "test-results/sigma-label-selection.png" })
})
