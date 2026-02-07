import { NextResponse } from "next/server"
import { updateUserHighScore } from "@/lib/user-utils"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user_id = String(body.user_id ?? "").trim()
    const high_score = typeof body.high_score === "number" ? body.high_score : parseInt(String(body.high_score ?? "0"), 10)

    if (!user_id) {
      return NextResponse.json({ error: "user_id missing" }, { status: 400 })
    }

    if (!Number.isInteger(high_score) || high_score < 0) {
      return NextResponse.json({ error: "high_score must be a non-negative integer" }, { status: 400 })
    }

    await updateUserHighScore(user_id, high_score)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    )
  }
}
