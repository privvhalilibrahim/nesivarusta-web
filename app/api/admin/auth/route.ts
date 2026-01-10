import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"

// Force dynamic rendering (cookies kullanıyor)
export const dynamic = 'force-dynamic'

/**
 * Middleware function - Admin authentication kontrolü
 * Diğer admin API'lerinde kullanılabilir
 */
export async function verifyAdmin(req: NextRequest): Promise<{
  isAuthenticated: boolean
  adminId?: string
  adminEmail?: string
  error?: string
}> {
  try {
    const sessionToken = req.cookies.get("admin_session")?.value

    if (!sessionToken) {
      return {
        isAuthenticated: false,
        error: "Oturum bulunamadı",
      }
    }

    // Session'ı kontrol et
    const sessionDoc = await db.collection("admin_sessions").doc(sessionToken).get()

    if (!sessionDoc.exists) {
      return {
        isAuthenticated: false,
        error: "Geçersiz oturum",
      }
    }

    const sessionData = sessionDoc.data()
    const expiresAt = sessionData?.expires_at?.toDate()

    // Session süresi dolmuş mu?
    if (expiresAt && expiresAt < new Date()) {
      await sessionDoc.ref.delete()
      return {
        isAuthenticated: false,
        error: "Oturum süresi dolmuş",
      }
    }

    return {
      isAuthenticated: true,
      adminId: sessionData?.admin_id,
      adminEmail: sessionData?.admin_email,
    }

  } catch (error: any) {
    console.error("Admin verification error:", error)
    return {
      isAuthenticated: false,
      error: "Doğrulama hatası",
    }
  }
}

/**
 * GET /api/admin/auth
 * Admin authentication durumunu kontrol et
 */
export async function GET(req: NextRequest) {
  const authResult = await verifyAdmin(req)

  if (!authResult.isAuthenticated) {
    return NextResponse.json(
      { authenticated: false, error: authResult.error },
      { status: 401 }
    )
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: authResult.adminId,
      email: authResult.adminEmail,
    },
  })
}
