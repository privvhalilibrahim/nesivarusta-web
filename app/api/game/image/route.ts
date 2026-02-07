import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGIN = "https://media.fastestlaps.com"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }
  if (!parsed.origin.startsWith(ALLOWED_ORIGIN)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 })
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NesiVarUsta/1.0)",
        Accept: "image/*",
      },
      cache: "force-cache",
      next: { revalidate: 86400 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status })
    }
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch (e) {
    console.error("Game image proxy error:", e)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
  }
}
