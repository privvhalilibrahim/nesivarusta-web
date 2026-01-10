import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"
import admin from "firebase-admin"
import crypto from "crypto"

/**
 * POST /api/admin/login
 * Admin girişi (email ve şifre ile)
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre zorunludur" },
        { status: 400 }
      )
    }

    // Firebase'de admin kontrolü
    const adminsSnapshot = await db
      .collection("admins")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get()

    if (adminsSnapshot.empty) {
      return NextResponse.json(
        { error: "Email veya şifre hatalı" },
        { status: 401 }
      )
    }

    const adminDoc = adminsSnapshot.docs[0]
    const adminData = adminDoc.data()

    // Şifre kontrolü (basit hash karşılaştırması)
    // Not: Production'da bcrypt gibi daha güvenli bir yöntem kullanılmalı
    const inputPasswordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex")

    if (adminData.password_hash !== inputPasswordHash) {
      return NextResponse.json(
        { error: "Email veya şifre hatalı" },
        { status: 401 }
      )
    }

    // Aktif admin kontrolü
    if (adminData.is_active === false) {
      return NextResponse.json(
        { error: "Bu admin hesabı devre dışı bırakılmış" },
        { status: 403 }
      )
    }

    // Session token oluştur
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 saat geçerli

    // Session'ı Firebase'de sakla
    await db.collection("admin_sessions").doc(sessionToken).set({
      admin_id: adminDoc.id,
      admin_email: email.toLowerCase().trim(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: admin.firestore.Timestamp.fromDate(expiresAt),
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0] || 
                  req.headers.get("x-real-ip") || 
                  "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    })

    // Son giriş zamanını güncelle
    await adminDoc.ref.update({
      last_login_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login_ip: req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown",
    })

    // Cookie'ye session token ekle
    const response = NextResponse.json({
      success: true,
      message: "Giriş başarılı",
      admin: {
        id: adminDoc.id,
        email: adminData.email,
        name: adminData.name || adminData.email,
      },
    })

    // HttpOnly cookie (güvenlik için)
    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 saat
      path: "/",
    })

    return response

  } catch (error: any) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}


/**
 * GET /api/admin/me
 * Mevcut admin bilgilerini getir
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("admin_session")?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 401 }
      )
    }

    // Session'ı kontrol et
    const sessionDoc = await db.collection("admin_sessions").doc(sessionToken).get()

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Geçersiz oturum" },
        { status: 401 }
      )
    }

    const sessionData = sessionDoc.data()
    const expiresAt = sessionData?.expires_at?.toDate()

    // Session süresi dolmuş mu?
    if (expiresAt && expiresAt < new Date()) {
      await sessionDoc.ref.delete()
      return NextResponse.json(
        { error: "Oturum süresi dolmuş" },
        { status: 401 }
      )
    }

    // Admin bilgilerini getir
    const adminDoc = await db.collection("admins").doc(sessionData?.admin_id).get()

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: "Admin bulunamadı" },
        { status: 404 }
      )
    }

    const adminData = adminDoc.data()

    return NextResponse.json({
      success: true,
      admin: {
        id: adminDoc.id,
        email: adminData?.email,
        name: adminData?.name || adminData?.email,
      },
    })

  } catch (error: any) {
    console.error("Get admin info error:", error)
    return NextResponse.json(
      { error: "Bilgiler alınırken bir hata oluştu" },
      { status: 500 }
    )
  }
}
