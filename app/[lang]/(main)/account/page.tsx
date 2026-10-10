import { currentUser } from "@clerk/nextjs/server"

import { getMe } from "@/app/api/user/action"
import { isDevAuthModeEnabled } from "@/app/lib/dev-auth-mode"

import {
  AccountProfileForm,
  AccountProfileInitialData,
} from "./account-profile-form"

function getDisplayName(firstName?: string | null, lastName?: string | null) {
  return [lastName, firstName].filter(Boolean).join(" ").trim()
}

function getNameParts(
  firstName?: string | null,
  lastName?: string | null,
  fallbackFullName?: string | null
) {
  const trimmedFirstName = firstName?.trim() ?? ""
  const trimmedLastName = lastName?.trim() ?? ""

  if (trimmedFirstName || trimmedLastName || !fallbackFullName) {
    return {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
    }
  }

  const nameParts = fallbackFullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: nameParts.at(-1) ?? "",
    lastName: nameParts.slice(0, -1).join(" "),
  }
}

function getAvatarFallback(displayName: string, email: string) {
  const source = displayName || email
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")

  return initials || "CN"
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    ""
  )
}

function getFirstNonEmptyValue(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue
    }

    const stringValue = String(value).trim()

    if (stringValue) {
      return stringValue
    }
  }

  return ""
}

function getDateInputValue(...values: unknown[]) {
  const value = getFirstNonEmptyValue(...values)

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const year = dateParts.find((part) => part.type === "year")?.value
  const month = dateParts.find((part) => part.type === "month")?.value
  const day = dateParts.find((part) => part.type === "day")?.value

  return year && month && day ? `${year.padStart(4, "0")}-${month}-${day}` : ""
}

export default async function AccountPage() {
  const [profile, clerkUser] = await Promise.all([
    getMe(),
    isDevAuthModeEnabled() ? null : currentUser(),
  ])
  const nameParts = getNameParts(
    profile.firstName,
    profile.lastName,
    clerkUser?.fullName
  )
  const displayName = getDisplayName(nameParts.firstName, nameParts.lastName)
  const email = profile.email || getPrimaryEmail(clerkUser)
  const avatarUrl =
    profile.mainImage?.urlThumbnail ??
    profile.mainImage?.urlMedium ??
    profile.mainImage?.urlOriginal ??
    clerkUser?.imageUrl ??
    ""
  const initialData: AccountProfileInitialData = {
    avatarUrl,
    avatarFallback: getAvatarFallback(displayName, email),
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    dateOfBirth: getDateInputValue(
      profile.birthday,
      profile.birthDay,
      profile.dateOfBirth
    ),
    email,
    phoneNumber: getFirstNonEmptyValue(
      profile.phone,
      profile.phoneNumber,
      profile.mobilePhone
    ),
  }
  return (
    <AccountProfileForm
      key={[
        initialData.firstName,
        initialData.lastName,
        initialData.dateOfBirth,
        initialData.email,
        initialData.phoneNumber,
        initialData.avatarUrl,
      ].join("|")}
      initialData={initialData}
    />
  )
}
