import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"

// Production'da cache'i devre dışı bırak
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/blogs/comments/counts
 * Tüm bloglar için onaylanmış yorum sayılarını getir
 */
export async function GET(req: NextRequest) {
  try {
    // SADECE onaylanmış yorumları say (pending veya rejected sayılmaz)
    const commentsSnapshot = await db
      .collection("comments")
      .where("status", "==", "approved")
      .get()

    // Blog ID'ye göre yorum sayılarını say
    const commentCounts: Record<number, number> = {}
    
    commentsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const blogId = data.blog_id
      if (blogId) {
        commentCounts[blogId] = (commentCounts[blogId] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      counts: commentCounts,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error("Get comment counts error:", error)
    return NextResponse.json(
      { error: "Yorum sayıları getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
