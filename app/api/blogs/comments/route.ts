import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { getRequiredEnv } from "@/lib/env-validation"

/**
 * IP adresini al (proxy/load balancer desteği ile)
 */
function getClientIp(req: NextRequest): string {
  // Vercel / Cloudflare / proxy durumları için
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown"
}

/**
 * User Agent'dan cihaz ve tarayıcı bilgisi çıkar
 */
function parseUserAgent(userAgent: string | null): {
  device_type: "mobile" | "tablet" | "desktop" | "unknown"
  browser: string
  browser_version: string
  os: string
  os_version: string
  is_mobile: boolean
  is_tablet: boolean
  is_desktop: boolean
} {
  if (!userAgent) {
    return {
      device_type: "unknown",
      browser: "unknown",
      browser_version: "unknown",
      os: "unknown",
      os_version: "unknown",
      is_mobile: false,
      is_tablet: false,
      is_desktop: false,
    }
  }

  const ua = userAgent.toLowerCase()
  
  // Mobil cihaz tespiti
  const mobileRegex = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i
  const tabletRegex = /tablet|ipad|playbook|silk|(android(?!.*mobile))/i
  
  const isMobile = mobileRegex.test(ua) && !tabletRegex.test(ua)
  const isTablet = tabletRegex.test(ua)
  const isDesktop = !isMobile && !isTablet
  
  let device_type: "mobile" | "tablet" | "desktop" | "unknown" = "unknown"
  if (isMobile) device_type = "mobile"
  else if (isTablet) device_type = "tablet"
  else if (isDesktop) device_type = "desktop"

  // Tarayıcı tespiti
  let browser = "unknown"
  let browser_version = "unknown"
  
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome"
    const match = ua.match(/chrome\/([\d.]+)/)
    browser_version = match ? match[1] : "unknown"
  } else if (ua.includes("firefox")) {
    browser = "Firefox"
    const match = ua.match(/firefox\/([\d.]+)/)
    browser_version = match ? match[1] : "unknown"
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari"
    const match = ua.match(/version\/([\d.]+)/)
    browser_version = match ? match[1] : "unknown"
  } else if (ua.includes("edg")) {
    browser = "Edge"
    const match = ua.match(/edg\/([\d.]+)/)
    browser_version = match ? match[1] : "unknown"
  } else if (ua.includes("opera") || ua.includes("opr")) {
    browser = "Opera"
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/)
    browser_version = match ? match[1] : "unknown"
  }

  // İşletim sistemi tespiti
  let os = "unknown"
  let os_version = "unknown"
  
  if (ua.includes("windows")) {
    os = "Windows"
    const match = ua.match(/windows nt ([\d.]+)/)
    os_version = match ? match[1] : "unknown"
  } else if (ua.includes("mac os")) {
    os = "macOS"
    const match = ua.match(/mac os x ([\d_]+)/)
    os_version = match ? match[1].replace(/_/g, ".") : "unknown"
  } else if (ua.includes("android")) {
    os = "Android"
    const match = ua.match(/android ([\d.]+)/)
    os_version = match ? match[1] : "unknown"
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS"
    const match = ua.match(/os ([\d_]+)/)
    os_version = match ? match[1].replace(/_/g, ".") : "unknown"
  } else if (ua.includes("linux")) {
    os = "Linux"
    os_version = "unknown"
  }

  return {
    device_type,
    browser,
    browser_version,
    os,
    os_version,
    is_mobile: isMobile,
    is_tablet: isTablet,
    is_desktop: isDesktop,
  }
}

/**
 * POST /api/blogs/comments
 * Yeni yorum ekleme (AI kontrol ile)
 */
export async function POST(req: NextRequest) {
  try {
    const { blog_id, author_name, author_email, content } = await req.json()
    
    // Client bilgilerini al
    const ip_address = getClientIp(req)
    const user_agent = req.headers.get("user-agent") || "unknown"
    const deviceInfo = parseUserAgent(user_agent)
    const referer = req.headers.get("referer") || "unknown"
    const accept_language = req.headers.get("accept-language") || "unknown"

    // Validasyon
    if (!blog_id || !author_name || !content) {
      return NextResponse.json(
        { error: "blog_id, author_name ve content zorunludur" },
        { status: 400 }
      )
    }

    if (content.trim().length < 3) {
      return NextResponse.json(
        { error: "Yorum çok kısa (minimum 3 karakter)" },
        { status: 400 }
      )
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Yorum çok uzun (maksimum 2000 karakter)" },
        { status: 400 }
      )
    }

    // Aynı IP'den bu blog'a daha önce onaylanmış veya bekleyen yorum atılmış mı kontrol et
    // Reddedilmiş yorumlar sayılmaz, kullanıcı tekrar deneyebilir
    const existingComment = await db
      .collection("comments")
      .where("blog_id", "==", parseInt(blog_id))
      .where("ip_address", "==", ip_address)
      .get()

    // Sadece approved veya pending yorumları kontrol et
    const validComment = existingComment.docs.find(doc => {
      const data = doc.data()
      return data.status === "approved" || data.status === "pending"
    })

    if (validComment) {
      return NextResponse.json(
        { error: "Bu cihazdan bu blog yazısına zaten yorum yaptınız. Her cihazdan sadece bir yorum yapabilirsiniz." },
        { status: 403 }
      )
    }

    // AI ile yorum kontrolü
    const geminiApiKey = getRequiredEnv("GEMINI_API_KEY")
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const moderationPrompt = `
Sen bir içerik moderasyon uzmanısın. Aşağıdaki yorumu analiz et ve uygunluk skoru ver.

Yorum: "${content}"

Analiz kriterleri:
1. Hakaret, küfür, nefret söylemi var mı?
2. Spam veya reklam içeriyor mu?
3. Uygunsuz dil kullanımı var mı?
4. Yorum konuyla ilgili mi?

Sadece JSON formatında cevap ver:
{
  "score": 0.0-1.0,  // 1.0 = tamamen temiz, 0.0 = çok kötü
  "status": "pending" | "rejected",
  "reason": "kısa açıklama"
}

status kuralları:
- score >= 0.3: "pending" (manuel onay bekler - admin kontrol edecek)
- score < 0.3: "rejected" (reddedilir - direkt yayınlanmaz)

ÖNEMLİ: Hiçbir yorum otomatik olarak "approved" olmamalı. Tüm yorumlar ya "pending" (inceleme için) ya da "rejected" (reddedildi) olmalı.
`

    let moderationResult
    try {
      const aiResponse = await model.generateContent(moderationPrompt)
      const aiText = aiResponse.response.text()
      
      // JSON'u parse et
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0])
      } else {
        // Eğer JSON parse edilemezse, varsayılan olarak pending yap
        moderationResult = {
          score: 0.5,
          status: "pending",
          reason: "AI analizi tamamlanamadı, manuel kontrol gerekli"
        }
      }
    } catch (error) {
      console.error("AI moderation error:", error)
      // Hata durumunda güvenli tarafta kal, pending yap
      moderationResult = {
        score: 0.5,
        status: "pending",
        reason: "AI kontrolü başarısız, manuel kontrol gerekli"
      }
    }

    // Firestore'a kaydet - "comments" collection'ına
    const commentRef = db.collection("comments").doc()
    const now = admin.firestore.Timestamp.now()
    
    const commentData = {
      // Temel bilgiler
      blog_id: parseInt(blog_id),
      author_name: author_name.trim(),
      author_email: author_email?.trim() || null,
      content: content.trim(),
      
      // Durum bilgileri
      status: moderationResult.status, // "pending", "rejected" (approved artık yok, admin onaylar)
      is_visible: false, // Hiçbir yorum otomatik görünür değil, sadece admin onayladığında görünür
      
      // AI analiz sonuçları
      ai_score: moderationResult.score,
      ai_reason: moderationResult.reason || "",
      
      // Cihaz ve tarayıcı bilgileri
      device_type: deviceInfo.device_type, // "mobile", "tablet", "desktop", "unknown"
      is_mobile: deviceInfo.is_mobile,
      is_tablet: deviceInfo.is_tablet,
      is_desktop: deviceInfo.is_desktop,
      browser: deviceInfo.browser,
      browser_version: deviceInfo.browser_version,
      os: deviceInfo.os,
      os_version: deviceInfo.os_version,
      user_agent: user_agent, // Tam user agent string
      
      // Network bilgileri
      ip_address: ip_address,
      referer: referer,
      accept_language: accept_language,
      
      // Tarih bilgileri
      created_at: now,
      updated_at: now,
      
      // Ek metadata
      comment_length: content.trim().length,
      has_email: !!author_email?.trim(),
      
      // Like/Dislike sayıları (başlangıç değerleri)
      likes_count: 0,
      dislikes_count: 0,
    }

    await commentRef.set(commentData)

    // Eğer pending ise, admin'e bildirim gönder (opsiyonel - email eklenebilir)
    if (moderationResult.status === "pending") {
      // Burada email gönderme kodu eklenebilir
      // Şimdilik sadece log
      console.log(`Yorum onay bekliyor: ${commentRef.id} - Blog: ${blog_id}`)
    }

    return NextResponse.json({
      success: true,
      comment_id: commentRef.id,
      status: moderationResult.status,
      message: 
        moderationResult.status === "pending"
          ? "Yorumunuz incelemeye gönderildi. Onaylandıktan sonra yayınlanacaktır."
          : "Yorumunuz uygun bulunmadı ve yayınlanmayacaktır."
    })

  } catch (error: any) {
    console.error("Comment creation error:", error)
    return NextResponse.json(
      { error: "Yorum eklenirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blogs/comments?blog_id=...
 * Onaylanmış yorumları getir
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

    // Sadece onaylanmış ve görünür yorumları getir
    const commentsSnapshot = await db
      .collection("comments")
      .where("blog_id", "==", parseInt(blog_id))
      .where("status", "==", "approved")
      .where("is_visible", "==", true)
      .orderBy("created_at", "desc")
      .get()

    const comments = commentsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        author_name: data.author_name,
        content: data.content,
        likes_count: data.likes_count || 0,
        dislikes_count: data.dislikes_count || 0,
        created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
    })

  } catch (error: any) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "Yorumlar getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
