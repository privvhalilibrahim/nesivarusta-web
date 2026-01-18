import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chat_id, user_id, soft_delete } = body;

    if (!chat_id || !user_id) {
      return NextResponse.json(
        { error: "chat_id and user_id are required" },
        { status: 400 }
      );
    }

    // Rate limiting (User ID bazlı) - gevşek limit
    const userCheck = rateLimiter.check(user_id, 'delete');
    if (!userCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla silme işlemi yaptınız. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((userCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((userCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(userCheck.remaining),
            'X-RateLimit-Reset': String(userCheck.resetAt)
          }
        }
      );
    }

    if (soft_delete) {
      // SOFT DELETE: Frontend'den silme - is_visible: false ekle
      // Mesajları deleted olarak işaretle, chat'i is_visible: false yap
      // Bu şekilde veri kaybı olmaz, sadece kullanıcı görmesin
      
      const batch = db.batch();
      
      // 1. Chat'i is_visible: false yap
      const chatRef = db.collection("chats").doc(chat_id);
      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) {
        return NextResponse.json(
          { error: "Chat bulunamadı" },
          { status: 404 }
        );
      }
      
      batch.update(chatRef, {
        is_visible: false,
        deleted_at: admin.firestore.Timestamp.now(),
      });
      
      // 2. Tüm mesajları deleted olarak işaretle ve sayıları hesapla
      const messagesSnap = await db
        .collection("messages")
        .where("chat_id", "==", chat_id)
        .where("user_id", "==", user_id)
        .get();

      let messageCount = 0;
      let imageCount = 0;

      messagesSnap.docs.forEach((doc) => {
        const messageData = doc.data();
        messageCount++;
        
        // Görsel içeren mesajları say
        if (messageData.has_media && messageData.media_type === "image") {
          imageCount++;
        }
        
        batch.update(doc.ref, {
          deleted: true,
          deleted_at: admin.firestore.Timestamp.now(),
        });
      });

      // 3. User'ın total_chats, total_messages ve free_image_used değerlerini azalt
      const userRef = db.collection("users").doc(user_id);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userUpdateData: any = {
          total_messages: admin.firestore.FieldValue.increment(-messageCount),
        };
        
        // Chat silinince total_chats azalt
        userUpdateData.total_chats = admin.firestore.FieldValue.increment(-1);
        
        // Görsel içeren mesajlar varsa free_image_used azalt
        if (imageCount > 0) {
          userUpdateData.free_image_used = admin.firestore.FieldValue.increment(-imageCount);
        }
        
        batch.update(userRef, userUpdateData);
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Chat soft deleted successfully",
        deleted_count: messagesSnap.docs.length,
      });
    } else {
      // HARD DELETE: Mesajları gerçekten sil
      const messagesSnap = await db
        .collection("messages")
        .where("chat_id", "==", chat_id)
        .where("user_id", "==", user_id)
        .get();

      if (messagesSnap.empty) {
        return NextResponse.json({ success: true, message: "Chat not found" });
      }

      // Mesaj sayısını hesapla
      const messageCount = messagesSnap.docs.length;

      // Batch delete - tüm mesajları sil
      const batch = db.batch();
      messagesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // User'ın total_chats ve total_messages değerlerini azalt
      const userRef = db.collection("users").doc(user_id);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userUpdateData: any = {
          total_messages: admin.firestore.FieldValue.increment(-messageCount),
          total_chats: admin.firestore.FieldValue.increment(-1),
        };
        
        batch.update(userRef, userUpdateData);
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Chat deleted successfully",
        deleted_count: messagesSnap.docs.length,
      });
    }
  } catch (error: any) {
    logger.error("Error deleting chat", error as Error);
    return NextResponse.json(
      { error: "Failed to delete chat", details: error.message },
      { status: 500 }
    );
  }
}
