"use client"

import { useSyncExternalStore } from "react"

import { getBrowserTimeZone } from "./time-zone"

const subscribe = () => () => {}
const getServerSnapshot = () => "UTC"

export function useBrowserTimeZone() {
  return useSyncExternalStore(subscribe, getBrowserTimeZone, getServerSnapshot)
}
