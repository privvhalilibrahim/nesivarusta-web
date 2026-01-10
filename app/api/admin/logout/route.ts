import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"

/**
 * POST /api/admin/logout
 * Admin çıkışı
 */
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("admin_session")?.value

    if (sessionToken) {
      // Session'ı Firebase'den sil
      await db.collection("admin_sessions").doc(sessionToken).delete()
    }

    const response = NextResponse.json({
      success: true,
      message: "Çıkış başarılı",
    })

    // Cookie'yi sil
    response.cookies.delete("admin_session")

    return response

  } catch (error: any) {
    console.error("Admin logout error:", error)
    return NextResponse.json(
      { error: "Çıkış sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
}
