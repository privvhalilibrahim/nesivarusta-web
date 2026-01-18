import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"
import { findOrCreateUserByDeviceId } from "@/lib/user-utils"

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
    const locale = String(body.locale || "tr")
    const from_tablet = Boolean(body.from_tablet || false)
    const from_phone = Boolean(body.from_phone || false)
    const from_pc = Boolean(body.from_pc !== undefined ? body.from_pc : true)

    if (!device_id) {
      return NextResponse.json({ error: "device_id missing" }, { status: 400 })
    }

    const ip_address = getClientIp(req)
    
    // Rate limiting (IP bazlı) - gevşek limit
    const ipCheck = rateLimiter.check(ip_address, 'guest');
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((ipCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': String(ipCheck.remaining),
            'X-RateLimit-Reset': String(ipCheck.resetAt)
          }
        }
      );
    }

    // ✅ User'ı bul veya oluştur (utility function kullan)
    const { user_id } = await findOrCreateUserByDeviceId(device_id, {
      ip_address,
      locale,
      from_tablet,
      from_phone,
      from_pc,
    })

    return NextResponse.json({ user_id, type: "guest" })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    )
  }
}
