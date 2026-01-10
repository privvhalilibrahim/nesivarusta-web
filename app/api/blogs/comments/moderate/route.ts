import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { verifyAdmin } from "@/app/api/admin/auth/route"

/**
 * POST /api/blogs/comments/moderate
 * Yorum onaylama/reddetme (Admin işlemi)
 * 
 * Body: { comment_id, action: "approve" | "reject" }
 */
export async function POST(req: NextRequest) {
  try {
    // Admin authentication kontrolü
    const authResult = await verifyAdmin(req)
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      )
    }

    const { comment_id, action } = await req.json()

    if (!comment_id || !action) {
      return NextResponse.json(
        { error: "comment_id ve action (approve/reject) zorunludur" },
        { status: 400 }
      )
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action sadece 'approve' veya 'reject' olabilir" },
        { status: 400 }
      )
    }

    const commentRef = db.collection("comments").doc(comment_id)
    const commentDoc = await commentRef.get()

    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: "Yorum bulunamadı" },
        { status: 404 }
      )
    }

    const newStatus = action === "approve" ? "approved" : "rejected"
    const isVisible = action === "approve"

    await commentRef.update({
      status: newStatus,
      is_visible: isVisible,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      moderated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Yorum onaylandı" : "Yorum reddedildi",
      status: newStatus,
    })

  } catch (error: any) {
    console.error("Comment moderation error:", error)
    return NextResponse.json(
      { error: "Yorum moderasyonu sırasında bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blogs/comments/moderate?status=pending
 * Bekleyen yorumları listele (Admin paneli için)
 */
export async function GET(req: NextRequest) {
  try {
    // Admin authentication kontrolü
    const authResult = await verifyAdmin(req)
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status") || "pending"

    const commentsSnapshot = await db
      .collection("comments")
      .where("status", "==", status)
      .orderBy("created_at", "desc")
      .limit(50)
      .get()

    const comments = commentsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        blog_id: data.blog_id,
        author_name: data.author_name,
        author_email: data.author_email,
        content: data.content,
        status: data.status,
        is_visible: data.is_visible,
        ai_score: data.ai_score,
        ai_reason: data.ai_reason,
        // Cihaz ve tarayıcı bilgileri
        device_type: data.device_type,
        is_mobile: data.is_mobile,
        is_desktop: data.is_desktop,
        browser: data.browser,
        os: data.os,
        ip_address: data.ip_address,
        // Tarih
        created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
    })

  } catch (error: any) {
    console.error("Get pending comments error:", error)
    return NextResponse.json(
      { error: "Yorumlar getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
