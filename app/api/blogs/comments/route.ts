import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { getRequiredEnv } from "@/lib/env-validation"
import { rateLimiter } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"
import { 
  isValidEmail, 
  sanitizeEmail, 
  sanitizeName, 
  sanitizeContent, 
  validateLength,
  validateBlogId 
} from "@/lib/validation"
import { findOrCreateUserByDeviceId, findUserByDeviceId, userExists, updateUserActivity } from "@/lib/user-utils"

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
    const { blog_id, author_name, author_email, content, user_id, device_id, from_tablet, from_phone, from_pc } = await req.json()
    
    // Client bilgilerini al
    const ip_address = getClientIp(req)
    const user_agent = req.headers.get("user-agent") || "unknown"
    const deviceInfo = parseUserAgent(user_agent)
    const referer = req.headers.get("referer") || "unknown"
    const accept_language = req.headers.get("accept-language") || "unknown"

    // Rate limiting (hibrit: IP + User ID) - spam riski çok yüksek, sıkı limit
    const ipCheck = rateLimiter.check(ip_address, 'comment');
    const userCheck = user_id ? rateLimiter.check(user_id, 'comment') : { allowed: true, remaining: 0, resetAt: Date.now() };
    
    if (!ipCheck.allowed || !userCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla yorum gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': String(Math.min(ipCheck.remaining, userCheck.remaining)),
            'X-RateLimit-Reset': String(Math.max(ipCheck.resetAt, userCheck.resetAt))
          }
        }
      );
    }

    // Validasyon ve sanitization
    // Blog ID validation
    const blogIdValidation = validateBlogId(blog_id);
    if (!blogIdValidation.valid) {
      return NextResponse.json(
        { error: blogIdValidation.error },
        { status: 400 }
      );
    }
    const validBlogId = blogIdValidation.value!;

    // Author name validation ve sanitization
    if (!author_name || typeof author_name !== 'string' || !author_name.trim()) {
      return NextResponse.json(
        { error: "author_name gereklidir" },
        { status: 400 }
      );
    }
    const sanitizedAuthorName = sanitizeName(author_name, 100);

    // Email validation ve sanitization (opsiyonel ama varsa geçerli olmalı)
    let sanitizedEmail: string | null = null;
    if (author_email) {
      if (!isValidEmail(author_email)) {
        return NextResponse.json(
          { error: "Geçersiz email adresi" },
          { status: 400 }
        );
      }
      sanitizedEmail = sanitizeEmail(author_email);
    }

    // Content validation ve sanitization
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: "content gereklidir" },
        { status: 400 }
      );
    }
    const contentValidation = validateLength(content, 3, 2000);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.error },
        { status: 400 }
      );
    }
    const sanitizedContent = sanitizeContent(content, 2000);

    // Aynı IP'den bu blog'a daha önce onaylanmış veya bekleyen yorum atılmış mı kontrol et
    // Reddedilmiş yorumlar sayılmaz, kullanıcı tekrar deneyebilir
    // Direkt olarak approved veya pending yorumları sorgula (daha verimli)
    const existingComment = await db
      .collection("comments")
      .where("blog_id", "==", validBlogId)
      .where("ip_address", "==", ip_address)
      .where("status", "in", ["approved", "pending"])
      .limit(1)
      .get()

    if (!existingComment.empty) {
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

Yorum: "${sanitizedContent}"

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
      logger.error("AI moderation error", error as Error)
      // Hata durumunda güvenli tarafta kal, pending yap
      moderationResult = {
        score: 0.5,
        status: "pending",
        reason: "AI kontrolü başarısız, manuel kontrol gerekli"
      }
    }

    // Önce user'ı bul/oluştur ve user_id'yi al (comment'e eklemek için)
    // Utility function kullanarak tutarlılık sağla (chat ve feedback ile aynı)
    const now = admin.firestore.Timestamp.now()
    let finalUserId: string | null = null

    if (device_id) {
      // device_id ile user'ı bul veya oluştur (utility function kullan)
      // Frontend'den gelen cihaz tipini kullan, yoksa user-agent'dan tespit et
      const deviceType = {
        from_tablet: from_tablet !== undefined ? Boolean(from_tablet) : deviceInfo.is_tablet,
        from_phone: from_phone !== undefined ? Boolean(from_phone) : (deviceInfo.is_mobile && !deviceInfo.is_tablet),
        from_pc: from_pc !== undefined ? Boolean(from_pc) : deviceInfo.is_desktop,
      }
      
      const { user_id: foundUserId } = await findOrCreateUserByDeviceId(device_id, {
        ip_address,
        ...deviceType,
      })
      
      finalUserId = foundUserId
      
      // total_comments'i artır
      const userRef = db.collection("users").doc(foundUserId)
      await userRef.update({
        total_comments: admin.firestore.FieldValue.increment(1),
      })
    } else if (user_id) {
      // device_id yok ama user_id var - user_id ile kontrol et
      const exists = await userExists(user_id)
      
      if (exists) {
        finalUserId = user_id
        const userRef = db.collection("users").doc(user_id)
        await userRef.update({
          total_comments: admin.firestore.FieldValue.increment(1),
          last_seen_at: now,
          updated_at: now,
        })
      }
    }

    // Firestore'a kaydet - "comments" collection'ına
    const commentRef = db.collection("comments").doc()
    
    const commentData = {
      // Temel bilgiler (sanitized)
      blog_id: validBlogId,
      author_name: sanitizedAuthorName,
      author_email: sanitizedEmail,
      content: sanitizedContent,
      user_id: finalUserId || null, // Hangi user'dan geldiği bilgisi
      
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
      comment_length: sanitizedContent.length,
      has_email: !!sanitizedEmail,
      
      // Like/Dislike sayıları (başlangıç değerleri)
      likes_count: 0,
      dislikes_count: 0,
    }

    await commentRef.set(commentData)

    // Eğer pending ise, admin'e bildirim gönder (opsiyonel - email eklenebilir)
    if (moderationResult.status === "pending") {
      // Burada email gönderme kodu eklenebilir
      logger.info('Yorum onay bekliyor', { comment_id: commentRef.id, blog_id: validBlogId });
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
    logger.error("Comment creation error", error as Error)
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

    // Blog ID validation
    const blogIdValidation = validateBlogId(blog_id);
    if (!blogIdValidation.valid) {
      return NextResponse.json(
        { error: blogIdValidation.error },
        { status: 400 }
      );
    }
    const validBlogId = blogIdValidation.value!;

    // Sadece onaylanmış yorumları getir (is_visible kontrolü kaldırıldı - approved olanlar zaten görünür)
    const commentsSnapshot = await db
      .collection("comments")
      .where("blog_id", "==", validBlogId)
      .where("status", "==", "approved")
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
    logger.error("Get comments error", error as Error)
    return NextResponse.json(
      { error: "Yorumlar getirilirken bir hata oluştu", details: error.message },
      { status: 500 }
    )
  }
}
