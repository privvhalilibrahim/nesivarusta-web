import { NextResponse } from "next/server"
import admin from "firebase-admin"

// ✅ serviceAccountKey.json importunu burada yapma.
// Firebase Admin init’i tek yerde kalsın diye aşağıdaki dosyayı kullanacağız:
import { db } from "@/app/firebase/firebaseAdmin"

function getClientIp(req: Request) {
  // Vercel / Cloudflare / proxy durumları için
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const device_id = String(body.device_id || "").trim()
    const source = String(body.source || "web")
    const locale = String(body.locale || "tr")

    if (!device_id) {
      return NextResponse.json({ error: "device_id missing" }, { status: 400 })
    }

    const ip_address = getClientIp(req)
    const now = admin.firestore.Timestamp.now()

    // ✅ aynı device_id ile kullanıcıyı bul (guest)
    const existing = await db
      .collection("users")
      .where("device_id", "==", device_id)
      .limit(1)
      .get()

    if (!existing.empty) {
      const doc = existing.docs[0]
      await doc.ref.set(
        {
          last_seen_at: now,
          ip_address,
          source,
          locale,
          updated_at: now,
        },
        { merge: true }
      )

      return NextResponse.json({ user_id: doc.id, type: "guest" })
    }

    // ✅ yoksa yeni user oluştur
    const ref = db.collection("users").doc()
    await ref.set({
      user_id: ref.id,
      type: "guest",
      device_id,
      ip_address,
      blocked: false,
      block_reason: "",
      first_seen_at: now,
      last_seen_at: now,

      // rate counters (ilk değerler)
      free_message_used: 0,
      free_video_used: 0,
      free_audio_used: 0,

      total_messages: 0,
      total_chats: 0,

      source,
      locale,
      notes: "",

      created_at: now,
      updated_at: now,
    })

    return NextResponse.json({ user_id: ref.id, type: "guest" })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    )
  }
}
