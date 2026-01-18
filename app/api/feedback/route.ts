import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { isValidEmail, sanitizeEmail, sanitizeName, sanitizeContent, validateLength } from "@/lib/validation";
import { userExists, createUser, findOrCreateUserByDeviceId } from "@/lib/user-utils";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

function getSource(req: Request): "web" | "mobile" {
  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  return isMobile ? "mobile" : "web";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message, user_id, device_id } = body;

    // IP adresi ve source bilgisini al (rate limiting için)
    const ipAddress = getClientIp(req);
    const source = getSource(req);

    // Rate limiting (hibrit: IP + User ID) - spam önleme için sıkı
    const ipCheck = rateLimiter.check(ipAddress, 'feedback');
    const userCheck = user_id ? rateLimiter.check(user_id, 'feedback') : { allowed: true, remaining: 0, resetAt: Date.now() };
    
    if (!ipCheck.allowed || !userCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla geri bildirim gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((Math.max(ipCheck.resetAt, userCheck.resetAt) - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(Math.min(ipCheck.remaining, userCheck.remaining)),
            'X-RateLimit-Reset': String(Math.max(ipCheck.resetAt, userCheck.resetAt))
          }
        }
      );
    }

    // Validasyon ve sanitization
    if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
      return NextResponse.json(
        { error: "user_id gerekli" },
        { status: 400 }
      );
    }

    // Message validation ve sanitization
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: "Mesaj gereklidir" },
        { status: 400 }
      );
    }
    const messageValidation = validateLength(message, 10, 5000);
    if (!messageValidation.valid) {
      return NextResponse.json(
        { error: messageValidation.error },
        { status: 400 }
      );
    }
    const sanitizedMessage = sanitizeContent(message, 5000);

    // Name sanitization (opsiyonel)
    const sanitizedName = name ? sanitizeName(name, 100) : "";

    // Email validation ve sanitization (opsiyonel ama varsa geçerli olmalı)
    let sanitizedEmail: string | null = null;
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Geçersiz email adresi" },
          { status: 400 }
        );
      }
      sanitizedEmail = sanitizeEmail(email);
    }

    // Timestamp
    const timestamp = admin.firestore.Timestamp.now();

    // Feedback'i Firebase'e kaydet (sanitized)
    const feedbackRef = db.collection("feedbacks").doc();
    await feedbackRef.set({
      name: sanitizedName,
      email: sanitizedEmail || "",
      content: sanitizedMessage,
      user_id,
      ip_address: ipAddress,
      source,
      created_at: timestamp,
    });

    // Users collection'ında total_feedbacks'i artır
    const exists = await userExists(user_id);
    
    if (exists) {
      // Mevcut user - sadece total_feedbacks'i artır
      const userRef = db.collection("users").doc(user_id);
      await userRef.update({
        total_feedbacks: admin.firestore.FieldValue.increment(1),
      });
    } else {
      // User yoksa oluştur (utility function kullan)
      if (device_id) {
        // device_id varsa findOrCreateUserByDeviceId kullan (chat ile aynı user'ı bulmak için)
        const { user_id: foundUserId } = await findOrCreateUserByDeviceId(device_id, {
          ip_address: ipAddress,
          source,
          locale: "tr",
        });
        
        // Eğer bulunan user_id farklıysa, feedback'i güncelle
        if (foundUserId !== user_id) {
          await feedbackRef.update({ user_id: foundUserId });
        }
        
        // total_feedbacks'i artır
        const userRef = db.collection("users").doc(foundUserId);
        await userRef.update({
          total_feedbacks: admin.firestore.FieldValue.increment(1),
        });
      } else {
        // device_id yoksa, verilen user_id ile user oluştur
        const userRef = db.collection("users").doc(user_id);
        await userRef.set({
          block_reason: "",
          blocked: false,
          created_at: timestamp,
          device_id: "",
          first_seen_at: timestamp,
          free_image_used: 0,
          ip_address: ipAddress,
          last_seen_at: timestamp,
          locale: "tr",
          notes: "",
          source: source,
          total_chats: 0,
          total_messages: 0,
          total_feedbacks: 1,
          total_comments: 0,
          total_likes: 0,
          total_dislikes: 0,
          type: "guest",
          updated_at: timestamp,
          user_id: user_id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Geri bildiriminiz alındı. Teşekkür ederiz!",
    });
  } catch (error: any) {
    logger.error("Feedback error", error as Error);
    return NextResponse.json(
      { error: "Geri bildirim gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
