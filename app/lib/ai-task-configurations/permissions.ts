import { hasPermission } from "@/app/lib/permissions"
import {
  AI_TASK_CONFIGURATION_READ_PERMISSION,
  AI_TASK_CONFIGURATION_UPDATE_PERMISSION,
} from "./definitions"

export const AI_TASK_CONFIGURATION_NAV_PERMISSIONS = [
  AI_TASK_CONFIGURATION_READ_PERMISSION,
] as const

export function canReadAiTaskConfigurations(permissions: readonly string[]) {
  return hasPermission(permissions, AI_TASK_CONFIGURATION_READ_PERMISSION)
}

export function canUpdateAiTaskConfigurations(permissions: readonly string[]) {
  return hasPermission(permissions, AI_TASK_CONFIGURATION_UPDATE_PERMISSION)
}
