import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const revision = process.env.SIGNAPSE_BUILD_REVISION ?? ""
  const available = /^[a-f0-9]{40}$/.test(revision)
  return NextResponse.json(
    { revision: available ? revision : null },
    { status: available ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
