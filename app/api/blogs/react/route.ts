import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { rateLimiter } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"
import { findOrCreateUserByDeviceId, userExists, updateUserActivity, findUserByDeviceId } from "@/lib/user-utils"

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
    const { blog_id, reaction, user_id, device_id, from_tablet, from_phone, from_pc } = await req.json()

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

    // Rate limiting (hibrit: IP + User ID) - spam önleme
    const ipCheck = rateLimiter.check(ip_address, 'blog_react');
    const userCheck = user_id ? rateLimiter.check(user_id, 'blog_react') : { allowed: true, remaining: 0, resetAt: Date.now() };
    
    if (!ipCheck.allowed || !userCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla reaksiyon gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(Math.min(ipCheck.remaining, userCheck.remaining)),
            'X-RateLimit-Reset': String(Math.max(ipCheck.resetAt, userCheck.resetAt))
          }
        }
      );
    }

    // Blog'u kontrol et (blog_id integer olmalı)
    const blogId = parseInt(blog_id)
    if (isNaN(blogId)) {
      return NextResponse.json(
        { error: "Geçersiz blog_id" },
        { status: 400 }
      )
    }

    // Önce user'ı bul/oluştur (user_id'yi blog_reactions'a kaydetmek için)
    let finalUserId: string | null = null
    const locale = "tr"
    const deviceType = {
      from_tablet: Boolean(from_tablet || false),
      from_phone: Boolean(from_phone || false),
      from_pc: Boolean(from_pc !== undefined ? from_pc : true),
    }
    
    if (device_id) {
      const { user_id: foundUserId } = await findOrCreateUserByDeviceId(device_id, {
        ip_address,
        locale,
        ...deviceType,
      })
      finalUserId = foundUserId
    } else if (user_id) {
      // user_id varsa kontrol et
      if (await userExists(user_id)) {
        finalUserId = user_id
        await updateUserActivity({
          user_id: user_id,
          ip_address,
          locale,
          ...deviceType,
        })
      } else {
        // user_id yoksa yeni oluştur
        const now = admin.firestore.Timestamp.now()
        await db.collection("users").doc(user_id).set({
          block_reason: "",
          blocked: false,
          created_at: now,
          device_id: null,
          first_seen_at: now,
          ip_address: ip_address,
          last_seen_at: now,
          locale: locale,
          notes: "",
          from_tablet: deviceType.from_tablet,
          from_phone: deviceType.from_phone,
          from_pc: deviceType.from_pc,
          total_chats: 0,
          total_messages: 0,
          total_feedbacks: 0,
          total_comments: 0,
          total_likes: 0,
          total_dislikes: 0,
          type: "guest",
          updated_at: now,
          user_id: user_id,
        })
        finalUserId = user_id
      }
    }

    // User'ın bu blog için en son reaksiyonunu bul
    let lastReaction: { reaction: string; exists: boolean } = { reaction: "", exists: false }
    let likesChange = 0
    let dislikesChange = 0
    let newReaction: "like" | "dislike" | null = reaction

    if (finalUserId) {
      // user_id varsa, en son reaksiyonu query ile bul
      const lastReactionQuery = await db
        .collection("blog_reactions")
        .where("user_id", "==", finalUserId)
        .where("blog_id", "==", blogId)
        .orderBy("created_at", "desc")
        .limit(1)
        .get()

      if (!lastReactionQuery.empty) {
        const lastReactionData = lastReactionQuery.docs[0].data()
        const lastReactionValue = lastReactionData?.reaction || ""
        lastReaction = { reaction: lastReactionValue, exists: true }
      }
    } else {
      // user_id yoksa, IP bazlı kontrol (geriye dönük uyumluluk)
      const reactionId = `${blogId}_${ip_address}`
      const existingReaction = await db.collection("blog_reactions").doc(reactionId).get()
      if (existingReaction.exists) {
        const existingData = existingReaction.data()
        lastReaction = { reaction: existingData?.reaction || "", exists: true }
      }
    }

    // Yeni document ID oluştur: blogId_userId_timestamp
    const timestamp = Date.now()
    const documentId = finalUserId 
      ? `${blogId}_${finalUserId}_${timestamp}`
      : `${blogId}_${ip_address}_${timestamp}`

    // Reaksiyon mantığı
    if (lastReaction.exists) {
      const previousReaction = lastReaction.reaction

      // Aynı reaksiyonu tekrar veriyorsa, toggle (removed)
      if (previousReaction === reaction) {
        // Yeni document ekle: reaction = "like_removed" veya "dislike_removed"
        const removedReaction = `${reaction}_removed`
        const reactionData: any = {
          blog_id: blogId,
          reaction: removedReaction,
          ip_address: ip_address,
          user_agent: user_agent,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }
        if (finalUserId) {
          reactionData.user_id = finalUserId
        }
        if (device_id) {
          reactionData.device_id = device_id
        }
        await db.collection("blog_reactions").doc(documentId).set(reactionData)

        // blog_stats'tan çıkar
        if (reaction === "like") {
          likesChange = -1
        } else {
          dislikesChange = -1
        }
        newReaction = null
      } else {
        // Farklı reaksiyon veriyorsa veya önceki removed ise
        // Önceki reaksiyonu blog_stats'tan çıkar (eğer aktif ise)
        if (previousReaction === "like") {
          likesChange = -1
        } else if (previousReaction === "dislike") {
          dislikesChange = -1
        }

        // Yeni reaksiyonu ekle
        const reactionData: any = {
          blog_id: blogId,
          reaction: reaction,
          ip_address: ip_address,
          user_agent: user_agent,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }
        if (finalUserId) {
          reactionData.user_id = finalUserId
        }
        if (device_id) {
          reactionData.device_id = device_id
        }
        await db.collection("blog_reactions").doc(documentId).set(reactionData)

        // blog_stats'a ekle
        if (reaction === "like") {
          likesChange += 1
        } else {
          dislikesChange += 1
        }
      }
    } else {
      // İlk reaksiyon
      const reactionData: any = {
        blog_id: blogId,
        reaction: reaction,
        ip_address: ip_address,
        user_agent: user_agent,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }
      if (finalUserId) {
        reactionData.user_id = finalUserId
      }
      if (device_id) {
        reactionData.device_id = device_id
      }
      await db.collection("blog_reactions").doc(documentId).set(reactionData)

      // blog_stats'a ekle
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

    // Users collection'ında total_likes/total_dislikes güncelle
    if (finalUserId && (likesChange !== 0 || dislikesChange !== 0)) {
      const userRef = db.collection("users").doc(finalUserId)
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
        await userRef.update(updateData)
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
    logger.error("Blog reaction error", error as Error)
    return NextResponse.json(
      { error: "Reaksiyon kaydedilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blogs/react?blog_id=...&user_id=...&device_id=...
 * Kullanıcının bu blog için reaksiyonunu getir
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const blog_id = searchParams.get("blog_id")
    const user_id = searchParams.get("user_id")
    const device_id = searchParams.get("device_id")

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

    // user_id'yi bul (POST endpoint'i ile aynı mantık - ama GET'te yeni user oluşturma)
    let finalUserId: string | null = null
    const ip_address = getClientIp(req)
    
    if (device_id) {
      // device_id varsa, sadece bul (yeni user oluşturma)
      const { user_id: foundUserId, exists } = await findUserByDeviceId(device_id)
      if (exists) {
        finalUserId = foundUserId
      }
    } else if (user_id) {
      // user_id varsa kontrol et
      if (await userExists(user_id)) {
        finalUserId = user_id
      }
    }

    // User'ın bu blog için en son reaksiyonunu query ile bul
    if (finalUserId) {
      // user_id varsa, query ile en son reaksiyonu bul
      const lastReactionQuery = await db
        .collection("blog_reactions")
        .where("user_id", "==", finalUserId)
        .where("blog_id", "==", blogId)
        .orderBy("created_at", "desc")
        .limit(1)
        .get()

      if (!lastReactionQuery.empty) {
        const lastReactionData = lastReactionQuery.docs[0].data()
        const lastReaction = lastReactionData?.reaction || ""

        // Eğer en son reaksiyon "like" veya "dislike" ise döndür
        if (lastReaction === "like" || lastReaction === "dislike") {
          return NextResponse.json({
            success: true,
            reaction: lastReaction as "like" | "dislike",
          })
        }
        // Eğer "like_removed" veya "dislike_removed" ise null döndür
      }
    } else {
      // user_id yoksa, IP bazlı kontrol (geriye dönük uyumluluk)
      const reactionId = `${blogId}_${ip_address}`
      const reactionDoc = await db.collection("blog_reactions").doc(reactionId).get()

      if (reactionDoc.exists) {
        const reactionData = reactionDoc.data()
        const reactionValue = reactionData?.reaction || ""
        
        if (reactionValue === "like" || reactionValue === "dislike") {
          return NextResponse.json({
            success: true,
            reaction: reactionValue as "like" | "dislike",
          })
        }
      }
    }

    // Reaksiyon bulunamadı veya removed
    return NextResponse.json({
      success: true,
      reaction: null,
    })

  } catch (error: any) {
    logger.error("Get blog reaction error", error as Error)
    return NextResponse.json(
      { error: "Reaksiyon getirilirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
