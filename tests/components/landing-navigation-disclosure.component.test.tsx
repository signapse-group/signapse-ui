// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import { LandingNavigationDisclosure } from "@/app/[lang]/landing-navigation-disclosure"

afterEach(() => vi.useRealTimers())

it("dismisses navigation on Escape, outside interaction and link selection", () => {
  const { container } = render(
    <LandingNavigationDisclosure>
      <summary>Product</summary>
      <a href="#product">Overview</a>
    </LandingNavigationDisclosure>
  )
  const details = container.querySelector("details")!
  const summary = container.querySelector("summary")!
  const link = screen.getByText("Overview")

  details.open = true
  link.focus()
  fireEvent.keyDown(link, { key: "Escape" })
  expect(details.open).toBe(false)
  expect(document.activeElement).toBe(summary)

  details.open = true
  fireEvent.pointerDown(document.body)
  expect(details.open).toBe(false)

  details.open = true
  fireEvent.click(link)
  expect(details.open).toBe(false)
})

it("opens and dismisses a hover-enabled disclosure", () => {
  vi.useFakeTimers()
  const { container } = render(
    <LandingNavigationDisclosure openOnHover>
      <summary>Product</summary>
      <a href="#product">Overview</a>
    </LandingNavigationDisclosure>
  )
  const details = container.querySelector("details")!

  fireEvent.pointerEnter(details)
  expect(details.open).toBe(true)

  fireEvent.pointerLeave(details)
  expect(details.open).toBe(true)
  vi.advanceTimersByTime(150)
  expect(details.open).toBe(true)
  vi.advanceTimersByTime(350)
  expect(details.open).toBe(false)
})
