import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"

/**
 * GET /api/blogs/stats
 * Tüm bloglar için like/dislike sayılarını getir
 */
export async function GET(req: NextRequest) {
  try {
    const blogStatsSnapshot = await db.collection("blog_stats").get()

    const stats: Record<number, { likes_count: number; dislikes_count: number }> = {}
    
    blogStatsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const blogId = data.blog_id
      if (blogId) {
        stats[blogId] = {
          likes_count: data.likes_count || 0,
          dislikes_count: data.dislikes_count || 0,
        }
      }
    })

    return NextResponse.json({
      success: true,
      stats,
    })

  } catch (error: any) {
    console.error("Get blog stats error:", error)
    return NextResponse.json(
      { error: "Blog istatistikleri getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
