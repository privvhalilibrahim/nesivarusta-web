import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { db } from "@/app/firebase/firebaseAdmin";
import crypto from "crypto";
import { getRequiredEnv } from "@/lib/env-validation";

/**
 * Make.com Webhook Endpoint
 * 
 * Bu endpoint Make.com'dan gelen mesajları alır ve Gemini'ye yönlendirir.
 * 
 * Request Body:
 * {
 *   "message": "Kullanıcı mesajı",
 *   "channel": "instagram" | "whatsapp" | "web",
 *   "user_id": "unique_user_id", // Make.com'dan gelen user identifier
 *   "chat_id": "optional_chat_id", // Varsa devam eden chat
 *   "media_url": "optional_media_url" // Instagram/WhatsApp'tan gelen foto/video URL
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "content": "Gemini'nin cevabı",
 *   "chat_id": "chat_id"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = getRequiredEnv("GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const body = await req.json();
    
    const {
      message,
      channel = "web", // instagram, whatsapp, web
      user_id,
      chat_id,
      media_url,
    } = body;

    // Validation
    if (!message && !media_url) {
      return NextResponse.json(
        { error: "message or media_url is required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Make.com için özel user_id formatı: "make_{channel}_{original_user_id}"
    // Örnek: "make_instagram_123456" veya "make_whatsapp_905551234567"
    const makeUserId = `make_${channel}_${user_id}`;
    const finalChatId = chat_id || crypto.randomUUID();

    // SYSTEM PROMPT (aynı chat endpoint'indeki gibi)
    const SYSTEM_PROMPT = `
Sen NesiVarUsta adlı deneyimli bir oto ustasısın.
Amacın sohbet etmek DEĞİL, arıza tespiti yapmaktır.

DAVRANIŞ:
- Net, ciddi ve usta gibi konuş
- Gereksiz selam, laf kalabalığı YOK
- Kısa ve net cümleler kullan
- Aynı bilgiyi tekrar tekrar isteme
- Gerçek bir usta gibi soru-cevap yap

ÇALIŞMA ŞEKLİ:
1) Kullanıcının verdiği bilgileri değerlendir
2) Eksik ama KRİTİK bilgileri TEK MESAJDA sor
3) Gereksiz bilgi isteme
4) Bilgi yeterliyse olası nedenleri SIRALAYARAK söyle

TEŞHİS FORMATI (Bilgi yeterliyse):
2-3 cümleyle teşhisi özetçe açıkla.
Olası nedenleri şu şekilde sırala:
"Şu nedenlerden biri olabilir:
1. [Neden 1] - En olası
2. [Neden 2] 
3. [Neden 3]"

BİLGİ TOPLAMA:
- Marka / Model / Yıl analiz için gerekli ise sor
- Soruna göre sor:
  - Mekanik → ses ne zaman, nerede, sıcak/soğuk
  - Elektrik → uyarı ışığı, sürekli mi arada mı
  - Donanım → çalışmıyor mu zayıf mı

SORU KURALI:
- Soruların başında numara yaz. Örnek: "1. Soru: ..."
- En fazla 3–4 kısa soru
- Tek mesajda sor

FOTO/VIDEO ANALİZİ:
- Fotoğraf veya video geldiğinde, gördüğün/duyduğun belirtileri analiz et
- Bu belirtileri kullanıcının anlattığı bilgi gibi ele al
- Foto/video'dan çıkardığın teşhisi TEXT olarak açıkla
- Kesin teşhis koyma, "görüntüden anlaşılan olası durumlar" şeklinde konuş

ASLA:
- "dinliyorum"
- "ön analiz yok gibi"
- "hadi bakalım"
deme.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // 1. GEÇMİŞİ GETİR (Chat history - Make.com için de aynı mantık)
    const historySnap = await db
      .collection("messages")
      .where("chat_id", "==", finalChatId)
      .orderBy("created_at", "desc")
      .limit(20)
      .get();

    const history: Content[] = [];
    const sortedDocs = [...historySnap.docs].reverse();

    sortedDocs.forEach((doc) => {
      const m = doc.data();
      if (m.deleted === true) return;
      if (!m.chat_id) return;

      const content = m.content || "";
      if (!content.trim() && !m.has_media) return;

      let messageText = content;
      if (m.has_media && m.sender === "user") {
        messageText = content || "Fotoğraf/video paylaşıldı";
      }

      history.push({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: messageText }],
      });
    });

    // 2. YENİ MESAJI HAZIRLA
    let currentParts: any[] = [];
    let hasMedia = false;

    if (message) {
      currentParts.push({ text: message });
    }

    // Media URL varsa (Instagram/WhatsApp'tan gelen foto/video)
    if (media_url) {
      hasMedia = true;
      try {
        // Media URL'den base64'e çevir
        const mediaResponse = await fetch(media_url);
        const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
        const mimeType = mediaResponse.headers.get("content-type") || "image/jpeg";

        currentParts.push({
          inlineData: {
            data: mediaBuffer.toString("base64"),
            mimeType: mimeType,
          },
        });

        if (!message) {
          currentParts.push({
            text: "Bu görseli/videoyu arıza tespiti için detaylıca analiz et. Gördüğün belirtileri ve olası nedenleri sıralayarak açıkla.",
          });
        } else {
          currentParts.push({
            text: "Ayrıca bu görseli/videoyu da analiz et ve gördüğün belirtileri değerlendir.",
          });
        }
      } catch (mediaError) {
        console.error("Media fetch error:", mediaError);
        // Media yüklenemezse sadece text ile devam et
      }
    }

    // 3. MODELİ ÇAĞIR
    const chatSession = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
    });

    const result = await chatSession.sendMessage(currentParts);
    const aiText = result.response.text();

    // KRİTİK: Gemini'den geçerli bir cevap gelmediyse hata döndür
    if (!aiText || aiText.trim().length === 0) {
      return NextResponse.json(
        { error: "Gemini'den geçerli bir cevap alınamadı." },
        { status: 500 }
      );
    }

    // 4. BATCH KAYIT (Atomik İşlem)
    const now = new Date();
    const userTimestamp = now;
    const aiTimestamp = new Date(now.getTime() + 1); // AI mesajı 1ms sonra (sıralama için)
    
    // all_messages array'ini hazırla
    const userMessageContent = message || (hasMedia ? "Fotoğraf/video paylaşıldı" : "");
    const aiMessageContent = aiText;
    
    // Mevcut chat için all_messages array'ini oku (eğer mevcut chat ise)
    const isNewChat = !chat_id; // chat_id yoksa yeni chat
    const chatRef = db.collection("chats").doc(finalChatId);
    let existingAllMessages: string[] = [];
    if (!isNewChat) {
      const chatDoc = await chatRef.get();
      existingAllMessages = chatDoc.exists ? (chatDoc.data()?.all_messages || []) : [];
    }
    
    // Yeni mesajları array'e ekle
    const updatedAllMessages = isNewChat 
      ? [userMessageContent, aiMessageContent] // Yeni chat: direkt başlat
      : [...existingAllMessages, userMessageContent, aiMessageContent]; // Mevcut chat: ekle
    
    const batch = db.batch();
    
    const userMsgRef = db.collection("messages").doc();
    batch.set(userMsgRef, {
      chat_id: finalChatId,
      user_id: makeUserId,
      sender: "user",
      content: userMessageContent,
      has_media: hasMedia,
      channel: channel, // Instagram, WhatsApp, web
      created_at: userTimestamp,
    });

    const aiMsgRef = db.collection("messages").doc();
    batch.set(aiMsgRef, {
      chat_id: finalChatId,
      user_id: makeUserId,
      sender: "model",
      content: aiText,
      has_media: false,
      channel: channel,
      created_at: aiTimestamp,
    });

    // CHATS COLLECTION: Chat metadata'sını kaydet/güncelle (veri tutarlılığı için)
    if (isNewChat) {
      // Yeni chat oluştur - all_messages array'ini başlat
      batch.set(chatRef, {
        chat_id: finalChatId,
        user_id: makeUserId,
        status: "active",
        last_message: aiText,
        all_messages: updatedAllMessages,
        channel: channel, // Instagram, WhatsApp, web
        created_at: now,
        updated_at: aiTimestamp,
      }, { merge: true });
    } else {
      // Mevcut chat'i güncelle - all_messages array'ini güncelle
      batch.set(chatRef, {
        last_message: aiText,
        all_messages: updatedAllMessages,
        updated_at: aiTimestamp,
      }, { merge: true });
    }

    try {
      await batch.commit();
    } catch (commitError: any) {
      console.error("Batch commit error:", commitError);
      return NextResponse.json(
        { error: "Mesajlar kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // 5. Make.com'a response döndür
    return NextResponse.json({
      success: true,
      content: aiText,
      chat_id: finalChatId,
    });
  } catch (e: any) {
    console.error("Make.com Webhook Error:", e);
    if (e.message?.includes("Gemini") || e.message?.includes("API")) {
      return NextResponse.json(
        {
          error: "AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "İşlem sırasında bir hata oluştu.", details: e.message },
      { status: 500 }
    );
  }
}

