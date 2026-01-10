import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/firebase/firebaseAdmin"

// Production'da cache'i devre dışı bırak
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/blogs/stats
 * Tüm bloglar için like/dislike sayılarını getir
 * Yorum sistemine benzer şekilde - her zaman güncel veri
 */
export async function GET(req: NextRequest) {
  try {
    // Cache'i devre dışı bırak - her zaman güncel veri
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error("Get blog stats error:", error)
    return NextResponse.json(
      { error: "Blog istatistikleri getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
