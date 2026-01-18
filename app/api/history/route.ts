import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

// KRİTİK: Dynamic route - request.url kullanıldığı için static render edilemez
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Rate limiting (User ID bazlı) - gevşek limit
    const userCheck = rateLimiter.check(user_id, 'history');
    if (!userCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((userCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((userCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': String(userCheck.remaining),
            'X-RateLimit-Reset': String(userCheck.resetAt)
          }
        }
      );
    }

    // KRİTİK: User'ın var olup olmadığını kontrol et
    const userDoc = await db.collection("users").doc(user_id).get();
    if (!userDoc.exists) {
      // User yoksa boş array döndür (frontend'de hata yaratmamak için)
      // User henüz oluşturulmamış olabilir, bu normal bir durum
      logger.debug("User not found in history API (user henüz oluşturulmadı)", { user_id });
      return NextResponse.json([]);
    }

    // Get recent messages for this user (limit to prevent performance issues)
    // KRİTİK: Limit eklenmeli - kullanıcı binlerce mesajı varsa çok yavaş olur
    const messagesSnap = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("created_at", "desc")
      .limit(1000) // Son 1000 mesaj yeterli (yaklaşık 500 chat için)
      .get();

    if (messagesSnap.empty) {
      return NextResponse.json([]);
    }

    // Group messages by chat_id
    const chatMap = new Map<string, {
      id: string;
      lastMessage: string;
      timestamp: Date;
      messageCount: number;
      firstUserMessage?: string;
      allMessages: Array<{content: string, created_at: Date, sender: string}>;
    }>();

    // KRİTİK: Tüm chat'leri çek ve var olan chat'leri kontrol et (Firebase Console'dan silinen chat'leri filtrele)
    const allChatsSnap = await db
      .collection("chats")
      .where("user_id", "==", user_id)
      .get();
    
    const existingChatIds = new Set<string>();
    allChatsSnap.docs.forEach((doc) => {
      const chatData = doc.data();
      // Soft delete'li ve is_visible=false olan chat'leri atla
      if (chatData.deleted !== true && chatData.is_visible !== false) {
        existingChatIds.add(doc.id);
      }
    });

    // İlk döngü: Tüm mesajları chat'lere göre grupla
    messagesSnap.docs.forEach((doc) => {
      const data = doc.data();
      
      // Soft delete'li mesajları atla
      if (data.deleted === true) return;
      
      // Chat_id kontrolü
      const chat_id = data.chat_id;
      if (!chat_id) return;
      
      // KRİTİK: Chat'in var olup olmadığını kontrol et (Firebase Console'dan silinen chat'leri filtrele)
      if (!existingChatIds.has(chat_id)) return;
      
      const created_at = data.created_at?.toDate() || new Date();
      const content = data.content || "";
      const sender = data.sender || "";

      if (!chatMap.has(chat_id)) {
        chatMap.set(chat_id, {
          id: chat_id,
          lastMessage: content,
          timestamp: created_at,
          messageCount: 0,
          allMessages: [],
        });
      }

      const chat = chatMap.get(chat_id)!;
      chat.messageCount++;
      chat.allMessages.push({ content, created_at, sender });

      // EN SON MESAJI BUL: En yeni timestamp'e sahip mesajı al
      if (created_at > chat.timestamp) {
        chat.timestamp = created_at;
        chat.lastMessage = content;
      }
    });

    // İkinci döngü: Her chat için kullanıcının İLK mesajını bul
    chatMap.forEach((chat, chat_id) => {
      // User mesajlarını filtrele ve en eski olanı bul
      const userMessages = chat.allMessages
        .filter(m => m.sender === "user")
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime()); // En eski önce
      
      if (userMessages.length > 0) {
        chat.firstUserMessage = userMessages[0].content;
      }
    });

    // Convert to array and format for frontend
    const chatHistory = Array.from(chatMap.values()).map((chat) => {
      // Generate title from first user message (truncate if too long)
      const title = chat.firstUserMessage 
        ? (chat.firstUserMessage.length > 50 
            ? chat.firstUserMessage.substring(0, 50) + "..." 
            : chat.firstUserMessage)
        : "Yeni Sohbet";

      return {
        id: chat.id,
        title: title,
        lastMessage: chat.lastMessage.length > 100 
          ? chat.lastMessage.substring(0, 100) + "..." 
          : chat.lastMessage,
        timestamp: chat.timestamp.toISOString(),
        status: "active" as const,
        severity: "medium" as const,
        messageCount: chat.messageCount + 1, // +1 açılış mesajı için (DB'de tutulmuyor, sadece frontend'de gösteriliyor)
      };
    });

    // Sort by timestamp (most recent first)
    chatHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(chatHistory);
  } catch (error: any) {
    logger.error("Error fetching chat history", error as Error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

