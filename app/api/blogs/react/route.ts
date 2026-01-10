import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"

/**
 * IP adresini al
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown"
}

/**
 * POST /api/blogs/react
 * Blog beğenme/beğenmeme
 * 
 * Body: { blog_id, reaction: "like" | "dislike" }
 */
export async function POST(req: NextRequest) {
  try {
    const { blog_id, reaction } = await req.json()

    if (!blog_id || !reaction) {
      return NextResponse.json(
        { error: "blog_id ve reaction (like/dislike) zorunludur" },
        { status: 400 }
      )
    }

    if (reaction !== "like" && reaction !== "dislike") {
      return NextResponse.json(
        { error: "reaction sadece 'like' veya 'dislike' olabilir" },
        { status: 400 }
      )
    }

    const ip_address = getClientIp(req)
    const user_agent = req.headers.get("user-agent") || "unknown"

    // Blog'u kontrol et (blog_id integer olmalı)
    const blogId = parseInt(blog_id)
    if (isNaN(blogId)) {
      return NextResponse.json(
        { error: "Geçersiz blog_id" },
        { status: 400 }
      )
    }

    // Blog reaksiyonunu kontrol et (blog_reactions collection'ında)
    const reactionId = `${blogId}_${ip_address}`
    const existingReaction = await db.collection("blog_reactions").doc(reactionId).get()

    let likesChange = 0
    let dislikesChange = 0
    let newReaction = reaction

    if (existingReaction.exists) {
      const existingData = existingReaction.data()
      const previousReaction = existingData?.reaction

      // Aynı reaksiyonu tekrar veriyorsa, geri al
      if (previousReaction === reaction) {
        // Reaksiyonu kaldır
        await existingReaction.ref.delete()
        
        if (reaction === "like") {
          likesChange = -1
        } else {
          dislikesChange = -1
        }
        newReaction = null
      } else {
        // Farklı reaksiyon veriyorsa, öncekini değiştir
        await existingReaction.ref.update({
          reaction: reaction,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

        if (previousReaction === "like") {
          likesChange = -1
        } else {
          dislikesChange = -1
        }

        if (reaction === "like") {
          likesChange += 1
        } else {
          dislikesChange += 1
        }
      }
    } else {
      // Yeni reaksiyon
      await db.collection("blog_reactions").doc(reactionId).set({
        blog_id: blogId,
        reaction: reaction,
        ip_address: ip_address,
        user_agent: user_agent,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      if (reaction === "like") {
        likesChange = 1
      } else {
        dislikesChange = 1
      }
    }

    // Blog'un mevcut like/dislike sayılarını al (blog_stats collection'ından)
    const blogStatsRef = db.collection("blog_stats").doc(blogId.toString())
    const blogStatsDoc = await blogStatsRef.get()

    let currentLikes = 0
    let currentDislikes = 0

    if (blogStatsDoc.exists) {
      const statsData = blogStatsDoc.data()
      currentLikes = statsData?.likes_count || 0
      currentDislikes = statsData?.dislikes_count || 0
    }

    const newLikes = Math.max(0, currentLikes + likesChange)
    const newDislikes = Math.max(0, currentDislikes + dislikesChange)

    // Blog stats'ı güncelle veya oluştur
    await blogStatsRef.set({
      blog_id: blogId,
      likes_count: newLikes,
      dislikes_count: newDislikes,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({
      success: true,
      reaction: newReaction,
      likes_count: newLikes,
      dislikes_count: newDislikes,
      message: newReaction 
        ? (reaction === "like" ? "Beğenildi" : "Beğenilmedi")
        : "Reaksiyon kaldırıldı"
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error("Blog reaction error:", error)
    return NextResponse.json(
      { error: "Reaksiyon kaydedilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blogs/react?blog_id=...
 * Kullanıcının bu blog için reaksiyonunu getir
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const blog_id = searchParams.get("blog_id")

    if (!blog_id) {
      return NextResponse.json(
        { error: "blog_id parametresi gerekli" },
        { status: 400 }
      )
    }

    const blogId = parseInt(blog_id)
    if (isNaN(blogId)) {
      return NextResponse.json(
        { error: "Geçersiz blog_id" },
        { status: 400 }
      )
    }

    const ip_address = getClientIp(req)
    const reactionId = `${blogId}_${ip_address}`

    const reactionDoc = await db.collection("blog_reactions").doc(reactionId).get()

    if (!reactionDoc.exists) {
      return NextResponse.json({
        success: true,
        reaction: null,
      })
    }

    const reactionData = reactionDoc.data()

    return NextResponse.json({
      success: true,
      reaction: reactionData?.reaction || null,
    })

  } catch (error: any) {
    console.error("Get blog reaction error:", error)
    return NextResponse.json(
      { error: "Reaksiyon getirilirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
