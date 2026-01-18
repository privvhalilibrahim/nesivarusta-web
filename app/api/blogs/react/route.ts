import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"

// Production'da cache'i devre dışı bırak
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const { blog_id, reaction, user_id, device_id } = await req.json()

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

    // Users collection'ında user oluştur/güncelle ve total_likes/total_dislikes artır
    const now = admin.firestore.Timestamp.now()
    if (device_id) {
      // device_id ile mevcut user'ı bul
      const existingUser = await db
        .collection("users")
        .where("device_id", "==", device_id)
        .limit(1)
        .get()

      if (!existingUser.empty) {
        // Mevcut user'ı buldu - /api/guest ile aynı mantık
        const userDoc = existingUser.docs[0]
        
        // /api/guest gibi güncelle (last_seen_at, ip_address, source, locale)
        const source = "web" // Blog react için source bilgisi yok, default "web"
        const locale = "tr" // Blog react için locale bilgisi yok, default "tr"
        
        await userDoc.ref.set(
          {
            last_seen_at: now,
            ip_address: ip_address,
            source: source,
            locale: locale,
            updated_at: now,
          },
          { merge: true }
        )
        
        // total_likes/total_dislikes'i artır/azalt
        const updateData: any = {}
        if (likesChange > 0) {
          updateData.total_likes = admin.firestore.FieldValue.increment(1)
        } else if (likesChange < 0) {
          updateData.total_likes = admin.firestore.FieldValue.increment(-1)
        }
        
        if (dislikesChange > 0) {
          updateData.total_dislikes = admin.firestore.FieldValue.increment(1)
        } else if (dislikesChange < 0) {
          updateData.total_dislikes = admin.firestore.FieldValue.increment(-1)
        }
        
        if (Object.keys(updateData).length > 0) {
          await userDoc.ref.update(updateData)
        }
      } else if (user_id) {
        // User ID varsa ama device_id ile bulunamadıysa, user_id ile kontrol et
        const userRef = db.collection("users").doc(user_id)
        const userDoc = await userRef.get()
        
        if (userDoc.exists) {
          const updateData: any = {
            device_id: device_id, // device_id'yi güncelle
            last_seen_at: now,
            updated_at: now,
          }
          
          if (likesChange > 0) {
            updateData.total_likes = admin.firestore.FieldValue.increment(1)
          } else if (likesChange < 0) {
            updateData.total_likes = admin.firestore.FieldValue.increment(-1)
          }
          
          if (dislikesChange > 0) {
            updateData.total_dislikes = admin.firestore.FieldValue.increment(1)
          } else if (dislikesChange < 0) {
            updateData.total_dislikes = admin.firestore.FieldValue.increment(-1)
          }
          
          await userRef.update(updateData)
        } else {
          // Yeni user oluştur - /api/guest ile aynı mantık
          const source = "web" // Blog react için source bilgisi yok, default "web"
          const locale = "tr" // Blog react için locale bilgisi yok, default "tr"
          
          await userRef.set({
            block_reason: "",
            blocked: false,
            created_at: now,
            device_id: device_id,
            first_seen_at: now,
            free_image_used: 0,
            ip_address: ip_address,
            last_seen_at: now,
            locale: locale,
            notes: "",
            source: source,
            total_chats: 0,
            total_messages: 0,
            total_feedbacks: 0,
            total_comments: 0,
            total_likes: likesChange > 0 ? 1 : 0,
            total_dislikes: dislikesChange > 0 ? 1 : 0,
            type: "guest",
            updated_at: now,
            user_id: user_id,
          })
        }
      } else {
        // User yoksa yeni oluştur - /api/guest ile aynı mantık
        const source = "web" // Blog react için source bilgisi yok, default "web"
        const locale = "tr" // Blog react için locale bilgisi yok, default "tr"
        
        const newUserRef = db.collection("users").doc()
        await newUserRef.set({
          block_reason: "",
          blocked: false,
          created_at: now,
          device_id: device_id,
          first_seen_at: now,
          free_image_used: 0,
          ip_address: ip_address,
          last_seen_at: now,
          locale: locale,
          notes: "",
          source: source,
          total_chats: 0,
          total_messages: 0,
          total_feedbacks: 0,
          total_comments: 0,
          total_likes: likesChange > 0 ? 1 : 0,
          total_dislikes: dislikesChange > 0 ? 1 : 0,
          type: "guest",
          updated_at: now,
          user_id: newUserRef.id,
        })
      }
    }

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
