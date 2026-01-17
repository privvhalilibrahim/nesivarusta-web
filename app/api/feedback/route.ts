import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";

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
    const { name, email, message, user_id } = body;

    // Validasyon
    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Mesaj en az 10 karakter olmalıdır" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id gerekli" },
        { status: 400 }
      );
    }

    // IP adresi ve source bilgisini al
    const ipAddress = getClientIp(req);
    const source = getSource(req);

    // Timestamp
    const timestamp = admin.firestore.Timestamp.now();

    // Feedback'i Firebase'e kaydet
    const feedbackRef = db.collection("feedbacks").doc();
    await feedbackRef.set({
      name: name || "",
      email: email || "",
      content: message.trim(),
      user_id,
      ip_address: ipAddress,
      source,
      created_at: timestamp,
    });

    // Users collection'ında total_feedbacks'i artır
    const userRef = db.collection("users").doc(user_id);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        total_feedbacks: admin.firestore.FieldValue.increment(1),
      });
    } else {
      // User yoksa oluştur (tüm gerekli alanlarla)
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
        type: "guest",
        updated_at: timestamp,
        user_id: user_id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Geri bildiriminiz alındı. Teşekkür ederiz!",
    });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: "Geri bildirim gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
