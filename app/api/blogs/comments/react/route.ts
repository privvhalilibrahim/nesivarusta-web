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
 * POST /api/blogs/comments/react
 * Yorum beğenme/beğenmeme
 * 
 * Body: { comment_id, reaction: "like" | "dislike" }
 */
export async function POST(req: NextRequest) {
  try {
    const { comment_id, reaction } = await req.json()

    if (!comment_id || !reaction) {
      return NextResponse.json(
        { error: "comment_id ve reaction (like/dislike) zorunludur" },
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

    // Yorumu kontrol et
    const commentRef = db.collection("comments").doc(comment_id)
    const commentDoc = await commentRef.get()

    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: "Yorum bulunamadı" },
        { status: 404 }
      )
    }

    // Daha önce bu IP'den bu yoruma reaksiyon verilmiş mi kontrol et
    const reactionId = `${comment_id}_${ip_address}`
    const existingReaction = await db.collection("comment_reactions").doc(reactionId).get()

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
      await db.collection("comment_reactions").doc(reactionId).set({
        comment_id: comment_id,
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

    // Yorumun like/dislike sayılarını güncelle
    const commentData = commentDoc.data()
    const currentLikes = commentData?.likes_count || 0
    const currentDislikes = commentData?.dislikes_count || 0

    const newLikes = Math.max(0, currentLikes + likesChange)
    const newDislikes = Math.max(0, currentDislikes + dislikesChange)

    await commentRef.update({
      likes_count: newLikes,
      dislikes_count: newDislikes,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      reaction: newReaction,
      likes_count: newLikes,
      dislikes_count: newDislikes,
      message: newReaction 
        ? (reaction === "like" ? "Beğenildi" : "Beğenilmedi")
        : "Reaksiyon kaldırıldı"
    })

  } catch (error: any) {
    console.error("Comment reaction error:", error)
    return NextResponse.json(
      { error: "Reaksiyon kaydedilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blogs/comments/react?comment_id=...&ip=...
 * Kullanıcının bu yorum için reaksiyonunu getir
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const comment_id = searchParams.get("comment_id")

    if (!comment_id) {
      return NextResponse.json(
        { error: "comment_id parametresi gerekli" },
        { status: 400 }
      )
    }

    const ip_address = getClientIp(req)
    const reactionId = `${comment_id}_${ip_address}`

    const reactionDoc = await db.collection("comment_reactions").doc(reactionId).get()

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
    console.error("Get reaction error:", error)
    return NextResponse.json(
      { error: "Reaksiyon getirilirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
