import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import crypto from "crypto";
import {
  callOpenRouter,
  convertHistoryToOpenRouter,
  createOpenRouterMessage,
  selectModel,
  getFallbackModels,
} from "../lib/openrouter";
// Medya upload kaldırıldı - sadece text mesajları kabul ediliyor
import { logger } from "@/lib/logger";
import { rateLimiter } from "@/lib/rate-limiter";
import { cachedQuery, createCacheKey } from "@/lib/performance";
import { sendNewChatNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  const { searchParams } = new URL(req.url);
  const chat_id = searchParams.get("chat_id");
  const user_id = searchParams.get("user_id");
  
  try {

    if (!chat_id || !user_id) {
      logger.warn('GET /api/chat - Missing parameters', { chat_id, user_id });
      return NextResponse.json(
        { error: "chat_id and user_id are required" },
        { status: 400 }
      );
    }

    // Rate limiting (user bazında)
    const rateLimitCheck = rateLimiter.check(user_id, 'api');
    if (!rateLimitCheck.allowed) {
      logger.warn('GET /api/chat - Rate limit exceeded', { user_id, chat_id });
      return NextResponse.json(
        { 
          error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
            'X-RateLimit-Reset': String(rateLimitCheck.resetAt)
          }
        }
      );
    }

    // KRİTİK: Chat'in var olup olmadığını kontrol et (Firebase Console'dan silinen chat'leri filtrele)
    const chatDoc = await db.collection("chats").doc(chat_id).get();
    if (!chatDoc.exists) {
      logger.warn('GET /api/chat - Chat not found', { chat_id, user_id });
      return NextResponse.json(
        { error: "Chat bulunamadı" },
        { status: 404 }
      );
    }
    
    const chatData = chatDoc.data();
    // Soft delete'li ve is_visible=false olan chat'leri reddet
    if (chatData?.deleted === true || chatData?.is_visible === false) {
      logger.warn('GET /api/chat - Chat soft deleted or not visible', { chat_id, user_id });
      return NextResponse.json(
        { error: "Chat bulunamadı" },
        { status: 404 }
      );
    }

    // Cache key oluştur (30 saniye cache)
    const cacheKey = createCacheKey('messages', { chat_id, user_id });
    
    // Get all messages for this chat (cached - direkt mesaj array'i olarak cache'le)
    const cachedMessages = await cachedQuery<Array<{id: string, data: any}>>(
      cacheKey,
      async () => {
        const snap = await db
          .collection("messages")
          .where("chat_id", "==", chat_id)
          .where("user_id", "==", user_id)
          .orderBy("created_at", "asc")
          .limit(500) // PERFORMANS: Maksimum 500 mesaj (çok uzun chat'ler için)
          .get();
        // QuerySnapshot'ı serialize edilebilir formata çevir
        return snap.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
      },
      30000 // 30 saniye cache
    );

    // Cache'den gelen data'yı QuerySnapshot benzeri formata çevir
    const messagesDocs = cachedMessages.map((doc: any) => ({
      id: doc.id,
      data: () => doc.data
    }));

    // Format messages for frontend (soft delete'li mesajları filtrele)
    // KRİTİK: Mesajlar zaten orderBy("created_at", "asc") ile sıralı geliyor
    const messages = messagesDocs
      .filter((doc: any) => {
        const data = doc.data();
        return data.deleted !== true; // Soft delete'li mesajları atla
      })
      .map((doc: any) => {
        const data = doc.data();
        const created_at = data.created_at?.toDate();
        
        // Eski mesajlar için content'i düzelt (media_type'a göre)
        let content = data.content || "";
        if (data.has_media && data.sender === "user") {
          // Eğer eski format "Fotoğraf/video paylaşıldı" ise veya boş ise, media_type'a göre güncelle
          if (!content.trim() || content === "Fotoğraf/video paylaşıldı") {
            if (data.media_type === "video") {
              content = "Video paylaşıldı";
            } else if (data.media_type === "audio") {
              content = "Ses kaydı paylaşıldı";
            } else {
              content = "Fotoğraf paylaşıldı";
            }
          }
        }
        
        return {
          id: doc.id,
          type: data.sender === "user" ? "user" : "ai",
          content: content,
          timestamp: created_at ? created_at.toISOString() : new Date().toISOString(),
          imageUrl: data.has_media ? undefined : undefined, // You can add image URL logic here if needed
        };
      });

    // KRİTİK: Mesajları timestamp'e göre tekrar sırala (güvenlik için - backend'den zaten sıralı geliyor ama emin olalım)
    messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // En eski -> en yeni
    });

    // Açılış mesajını her zaman başa ekle (DB'de tutulmuyor, sadece frontend'de gösteriliyor)
    const welcomeMessage = {
      id: "welcome",
      type: "ai" as const,
      content: "Merhaba! Ben NesiVarUsta Analiz Asistanı ✨. Araç marka–model–yıl ve yaşadığınız sorunu yazarsanız ön analiz yapabilirim.",
      timestamp: messages.length > 0 
        ? new Date(new Date(messages[0].timestamp).getTime() - 1000).toISOString() // İlk mesajdan 1 saniye önce
        : new Date().toISOString(), // Mesaj yoksa şimdi
    };

    logger.debug('GET /api/chat - Success', { chat_id, messageCount: messages.length });
    return NextResponse.json([welcomeMessage, ...messages]);
  } catch (error: any) {
    logger.error("Error fetching chat messages", error, { chat_id, user_id });
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Değişkenleri try bloğunun dışında tanımla (catch bloğunda erişim için)
  let user_id: string | null = null;
  let finalChatId: string | null = null;
  
  try {
    // Sadece JSON kabul et (medya upload kaldırıldı)
    const SYSTEM_PROMPT = `
Sen NesiVarUsta adlı deneyimli bir oto ustasısın. Amacın sohbet etmek DEĞİL, arıza tespiti yapmaktır.

KİMLİK (KRİTİK - ASLA UNUTMA):
- Sen NesiVarUsta'sın, bir oto ustasısın
- ASLA "yapay zekayım", "AI'yım", "asistanım" gibi ifadeler kullanma, yapay zeka olduğunu asla belirtme
- ASLA mesajların başına "Ben NesiVarUsta'yım" yazma
- Sadece kullanıcı açıkça kimliğini sorarsa (örnek: "kimsin", "sen kimsin", "adın ne", "sen nesin") o zaman "Ben NesiVarUsta'yım" de
- Normal mesajlarda direkt soruya/isteğe cevap ver, gereksiz tanıtım yapma

DAVRANIŞ:
- Kullanıcıya en iyi bilgi verebileceği şekilde sorular sor ve ondan en iyi bilgiyi almak için en etkili soruları sor, kullanıcıyı en iyi şekilde yönlendir.
- Kısa, net, usta gibi konuş. Gereksiz selam/laf kalabalığı yok.
- Türkçe yaz, imla kurallarına uy.
- Aynı bilgiyi tekrar isteme/yazma.
- Soru tarzını değiştir, aynı soruları sorma.
- ASLA emir kipi kullanma, her zaman "siz" hitabı kullan, nazik dil kullan ("Detay verir misiniz?" gibi)
- Selamlaşma mesajlarına kısa selamlaş, sonra analize devam et. Teşekkür mesajlarına "Rica ederim. Başka sorunuz varsa yardımcı olabilirim." de.

ÇALIŞMA:
1) Bilgileri değerlendir
2) Eksik KRİTİK bilgileri TEK MESAJDA sor (max 3-4 soru, numaralı)
3) Bilgi yeterliyse teşhis yap

TEŞHİS FORMATI:
2-3 cümle özet + "Şu nedenlerden biri olabilir:
1. [Neden] - En olası
2. [Neden]
3. [Neden]"

MARKA/MODEL/YIL (KRİTİK):
- MARKA: Üretici (Audi, BMW, Mercedes, vb.)
- MODEL: Model adı (A4, C200, 3 Serisi, vb.) - Sayısal olabilir ama YIL değil
- YIL: Üretim yılı (1985-günümüz) - "2015" = YIL, MODEL değil
- 1985'ten önce/gelecek yıl → "1985'ten önceki/gelecek yıllar için analiz yapamıyorum. 1985-günümüz arası bir yıl belirtebilir misiniz?"
- Eksik bilgi varsa nazikçe sor (sadece yıl → model sor, sadece model → yıl sor)

VALİDASYON (HER ZAMAN KONTROL):
- YIL: 1985-günümüz arası olmalı, değilse nazikçe uyar
- Marka/Model: Tutarlı olmalı (MERCEDES 1766 gibi saçma kombinasyonları nazikçe sorgula)
- KM: Mantıklı değerler (1 km veya 10 milyon km gibi absürt değerleri nazikçe sorgula)
- Hatalı bilgi → "Belirttiğiniz [bilgi] doğru görünmüyor. Kontrol edip tekrar yazabilir misiniz?"

SORU TİPLERİ:
- Mekanik sorunlarda:
  * Ses ne zaman başlıyor? (ilk çalıştırma / ısınınca)
  * Araç hareket halindeyken mi, dururken mi?
  * Gaz verince artıyor mu, sabit mi?
- Elektrik/elektronik sorunlarda:
  * Arıza lambası yanıyor mu?
  * Sürekli mi, arada mı oluyor?
  * Kontak kapatınca düzeliyor mu?
- Fren/süspansiyon:
  * Tümsek, çukur, virajda mı?
  * Direksiyon kırınca artıyor mu?
- Performans:
  * Çekiş düşüklüğü sabit mi?
  * Yokuşta mı daha belirgin?

MEDYA İSTEKLERİ (KRİTİK):
- Kullanıcı "video atabilirim", "ses gönderebilirim", "fotoğraf çekebilirim", "görüntü gönderebilirim", "video çekebilirim", "ses kaydı yapabilirim" gibi medya gönderme isteği belirtirse
- Kibarca şu mesajı ver: "Ücretsiz sürümde görüntü, ses ve video işleyemem. Sorununuzu yazılı olarak anlatabilir misiniz? Size yardımcı olmaya devam edeyim."
- Sonra yazılı analize devam et, medya isteğini görmezden gelme ama sadece bu bilgiyi ver ve analizle ilgilenmeye devam et.


ASLA:
- "yapay zekayım", "AI'yım", "asistanım", "yapay zeka" gibi ifadeler kullanma
- Mesajların başına "Ben NesiVarUsta'yım" yazma (sadece kimlik sorulduğunda söyle)
- "dinliyorum", "ön analiz yok", "hadi bakalım", sadece "anladım" deme
- Aynı bilgiyi tekrar yazma, cevabı yarım bırakma
- Emir kipi kullanma ("yap", "ver", "gönder", "yaz" gibi)
- "sen" hitabı kullanma, her zaman "siz" kullan

PDF RAPOR İSTEKLERİ:
- Kullanıcı "PDF rapor", "PDF çıktı", "PDF istiyorum", "PDF oluştur", "PDF indir", "rapor indir", "PDF almak istiyorum" gibi mesajlar yazarsa
- Şu mesajı ver: "PDF raporu ve konuşmayı indirmek için yukarıdaki bardan üç nokta (⋮) butonuna basıp 'PDF Rapor Oluştur' veya 'Chat'i İndir' seçeneklerini kullanabilirsiniz."
- Sonra analizle ilgilenmeye devam et, PDF isteğini görmezden gelme ama sadece bu bilgiyi ver.
`;

    // Sadece JSON kabul et (medya upload kaldırıldı)
    const body = await req.json();
    const message = body.message;
    user_id = body.user_id;
    const chat_id = body.chat_id;

    if (!user_id) {
      logger.warn('POST /api/chat - User ID missing');
      return NextResponse.json({ error: "User ID missing" }, { status: 400 });
    }

    // KRİTİK: User'ın var olup olmadığını kontrol et
    const userRef = db.collection("users").doc(user_id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.warn('POST /api/chat - User not found', { user_id });
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı. Lütfen sayfayı yenileyin.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    finalChatId = chat_id || crypto.randomUUID();
    const isNewChat = !chat_id; // Yeni chat mi?
    
    // TypeScript için: finalChatId artık null olamaz
    if (!finalChatId) {
      logger.error('POST /api/chat - Chat ID generation failed');
      return NextResponse.json({ error: "Chat ID oluşturulamadı" }, { status: 500 });
    }

    // 0.1. RATE LIMITING (Geliştirilmiş - cache-based)
    const rateLimitCheck = rateLimiter.check(user_id, 'chat');
    if (!rateLimitCheck.allowed) {
      logger.warn('POST /api/chat - Rate limit exceeded', { user_id, recentCount: rateLimitCheck.remaining });
      return NextResponse.json(
        { 
          error: "Çok hızlı mesaj gönderiyorsunuz. Lütfen bir süre bekleyin.",
          limit_reached: true,
          limit_type: "rate_limit",
          retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
            'X-RateLimit-Reset': String(rateLimitCheck.resetAt)
          }
        }
      );
    }

    // Eski Firestore-based rate limiting kaldırıldı - performans optimizasyonu
    // Artık sadece cache-based rateLimiter kullanılıyor (yukarıda kontrol edildi)
    // Medya upload kaldırıldı - sadece text mesajları kabul ediliyor

    // 1. GEÇMİŞİ GETİR (Firestore optimized + cached)
    // OpenRouter için son 15 mesajı gönder (maliyet optimizasyonu + hız optimizasyonu)
    const historyCacheKey = createCacheKey('history', { chat_id: finalChatId, limit: 15 });
    const historySnap = await cachedQuery(
      historyCacheKey,
      async () => {
        return await db
          .collection("messages")
          .where("chat_id", "==", finalChatId)
          .orderBy("created_at", "desc") // En yeni mesajlar önce
          .limit(15) // 15 mesaj limiti (7-8 user + 7-8 AI yaklaşık) - hız optimizasyonu için azaltıldı
          .get();
      },
      10000 // 10 saniye cache (chat aktifken sık değişir)
    );

    // History'yi formatla - Gemini formatından OpenRouter formatına çevir
    const historyForConversion: Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: any }> }> = [];
    
    // Mesajları ters çevir (en eski -> en yeni sırasına)
    const sortedDocs = [...historySnap.docs].reverse();
    
    sortedDocs.forEach((doc) => {
      const m = doc.data();
      
      // Soft delete'li mesajları atla
      if (m.deleted === true) return;
      
      // Chat_id kontrolü
      if (!m.chat_id) return;
      
      const content = m.content || "";
      
      // Boş mesajları atla
      if (!content.trim()) return;
      
      // Eski medya mesajları için text formatı (geriye dönük uyumluluk)
      let messageText = content;
      if (m.has_media && m.sender === "user" && !content.trim()) {
        // Eski medya mesajları için placeholder text
        if (m.media_type === "video") {
          messageText = "Video paylaşıldı";
        } else if (m.media_type === "audio") {
          messageText = "Ses kaydı paylaşıldı";
        } else {
          messageText = "Fotoğraf paylaşıldı";
        }
      }
      
      // Gemini formatına benzer yapı oluştur (OpenRouter'a çevrilecek)
      historyForConversion.push({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: messageText }],
      });
    });
    
    // OpenRouter formatına çevir
    const openRouterHistory = convertHistoryToOpenRouter(historyForConversion);

    // 2. YENİ MESAJI HAZIRLA (sadece text - medya upload kaldırıldı)
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Mesaj gereklidir" },
        { status: 400 }
      );
    }

    // 3. MODEL SEÇİMİ (sadece text - medya upload kaldırıldı)
    const selectedModel = selectModel(false, false, false); // Text-only
    logger.debug('POST /api/chat - Model selected', { 
      model: selectedModel 
    });
    
    // 4. MESAJLARI HAZIRLA (OpenRouter formatı)
    // NOT: Mistral gibi bazı modeller system role'ü desteklemiyor, bu yüzden system prompt'u ilk user mesajına ekliyoruz
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string | any }> = [];
    
    // History varsa ekle
    if (openRouterHistory.length > 0) {
      messages.push(...openRouterHistory);
    }
    
    // Yeni user mesajını hazırla (sadece text)
    const userMessage = createOpenRouterMessage(message, undefined, undefined);
    
    // System prompt'u system role olarak ekle (OpenRouter standard)
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      ...messages,
      userMessage,
    ];
    
    // 5. OPENROUTER API ÇAĞRISI (retry mekanizması ile)
    let aiText: string | null = null;
    let lastError: Error | null = null;
    const fallbackModels = [selectedModel, ...getFallbackModels(false, false, false).filter(m => m !== selectedModel)];
    
    for (const modelToTry of fallbackModels) {
      try {
        logger.debug('POST /api/chat - Trying model', { model: modelToTry });
        // Text-only için token limiti
        const maxTokens = 1200;
        const result = await callOpenRouter(modelToTry, messagesWithSystem, {
          max_tokens: maxTokens,
          temperature: 0.7,
        });
        aiText = result.content;
        logger.info('POST /api/chat - Model success', { 
          model: modelToTry, 
          tokens: result.usage?.completion_tokens || 'N/A', 
          finish_reason: result.finish_reason || 'N/A' 
        });
        
        // Eğer response token limiti nedeniyle kesilmişse (finish_reason === "length")
        if (result.finish_reason === "length") {
          logger.warn('POST /api/chat - Response truncated', { 
            model: modelToTry, 
            maxTokens,
            contentLength: aiText.length 
          });
        }
        
        // Eğer response yarım kesilmiş gibi görünüyorsa (son karakter kontrolü)
        if (aiText && !aiText.trim().endsWith('.') && !aiText.trim().endsWith('!') && !aiText.trim().endsWith('?') && !aiText.trim().endsWith(':') && aiText.length > 100) {
          logger.warn('POST /api/chat - Response might be incomplete', { 
            model: modelToTry,
            lastChars: aiText.substring(aiText.length - 50) 
          });
        }
        
        break; // Başarılı, döngüden çık
      } catch (error: any) {
        logger.warn('POST /api/chat - Model failed', { model: modelToTry, error: error.message });
        lastError = error;
        // Son model değilse devam et
        if (modelToTry !== fallbackModels[fallbackModels.length - 1]) {
          continue;
        }
      }
    }
    
    // Eğer hiçbir model çalışmadıysa
    if (!aiText) {
      logger.error('POST /api/chat - All models failed', lastError || new Error("Tüm modeller başarısız oldu"), { 
        user_id, 
        chat_id: finalChatId,
        modelsTried: fallbackModels 
      });
      throw lastError || new Error("Tüm modeller başarısız oldu");
    }

    // KRİTİK: OpenRouter'dan geçerli bir cevap gelmediyse hata döndür
    if (!aiText || aiText.trim().length === 0) {
      logger.error('POST /api/chat - Empty response from AI', new Error("AI modelinden geçerli bir cevap alınamadı"), { 
        user_id, 
        chat_id: finalChatId 
      });
      return NextResponse.json(
        { error: "AI modelinden geçerli bir cevap alınamadı." },
        { status: 500 }
      );
    }

    // 4. BATCH KAYIT (Atomik İşlem)
    // NOT: Foto/video dosyalarını DB'ye kaydetmiyoruz, sadece text mesajları kaydediyoruz
    // NOT: Açılış mesajı DB'ye kaydedilmiyor - sadece frontend'de gösteriliyor
    
    // KRİTİK: Timestamp'leri farklı yap - sıralama sorununu önlemek için
    const now = new Date();
    const userTimestamp = now;
    const aiTimestamp = new Date(now.getTime() + 1); // AI mesajı 1ms sonra (sıralama için)
    
    // all_messages array'ini hazırla (sadece text)
    const userMessageContent = message;
    const aiMessageContent = aiText;
    
    // Mevcut chat için all_messages array'ini oku (eğer mevcut chat ise)
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
    
    // Kullanıcı mesajı (sadece text - medya upload kaldırıldı)
    const userMsgRef = db.collection("messages").doc();
    batch.set(userMsgRef, {
      chat_id: finalChatId,
      user_id,
      sender: "user",
      content: userMessageContent,
      has_media: false, // Medya upload kaldırıldı
      created_at: userTimestamp, // User mesajı önce
    });

    // AI mesajı (AI modelinin teşhisi text olarak kaydediliyor)
    const aiMsgRef = db.collection("messages").doc();
    batch.set(aiMsgRef, {
      chat_id: finalChatId,
      user_id,
      sender: "model",
      content: aiText,
      has_media: false, // AI mesajı her zaman text
      ai_model: selectedModel, // Kullanılan model adı
      created_at: aiTimestamp, // AI mesajı sonra (1ms fark)
    });

    // CHATS COLLECTION: Chat metadata'sını kaydet/güncelle (veri tutarlılığı için)
    if (isNewChat) {
      // Yeni chat oluştur - all_messages array'ini başlat
      batch.set(chatRef, {
        chat_id: finalChatId,
        user_id,
        status: "active",
        last_message: aiText,
        all_messages: updatedAllMessages,
        is_visible: true, // Frontend'den görünür
        created_at: userTimestamp,
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

    // USERS COLLECTION: total_chats ve total_messages güncelle
    // NOT: User kontrolü yukarıda yapıldı, burada direkt update yapabiliriz
    const userUpdateData: any = {
      total_messages: admin.firestore.FieldValue.increment(2), // User + AI mesajı = 2 mesaj
    };
    
    if (isNewChat) {
      userUpdateData.total_chats = admin.firestore.FieldValue.increment(1);
    }
    
    batch.update(userRef, userUpdateData);

    // Batch commit - hata durumunda rollback yapılır
    try {
      await batch.commit();
      logger.debug('POST /api/chat - Messages saved', { chat_id: finalChatId, user_id });
      
      // Yeni chat oluşturulduysa email bildirimi gönder (async, hata chat işlemini durdurmaz)
      logger.debug('POST /api/chat - Email gönderme koşulu kontrol ediliyor', {
        isNewChat,
        hasAiText: !!aiText,
        finalChatId,
        user_id,
        shouldSendEmail: isNewChat && aiText && finalChatId && user_id
      });
      
      if (isNewChat && aiText && finalChatId && user_id) {
        logger.info('POST /api/chat - Email bildirimi gönderiliyor', {
          chat_id: finalChatId,
          user_id,
          messageLength: (userMessageContent || "Mesaj yok").length,
          aiTextLength: aiText.length
        });
        
        sendNewChatNotification(finalChatId, user_id, userMessageContent || "Mesaj yok", aiText).catch((emailError) => {
          logger.error("POST /api/chat - Email notification error", emailError as Error, { 
            chat_id: finalChatId, 
            user_id,
            errorMessage: emailError instanceof Error ? emailError.message : String(emailError)
          });
          // Email hatası chat işlemini durdurmaz, sadece log'lanır
        });
      } else {
        logger.warn('POST /api/chat - Email gönderilmedi (koşul sağlanmadı)', {
          isNewChat,
          hasAiText: !!aiText,
          finalChatId,
          user_id
        });
      }
    } catch (commitError: any) {
      logger.error("POST /api/chat - Batch commit error", commitError, { chat_id: finalChatId, user_id });
      return NextResponse.json(
        { error: "Mesajlar kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Response (medya upload kaldırıldı - sadece text mesajları)
    return NextResponse.json({
      chat_id: finalChatId,
      content: aiText,
      limits: {
        messages: {
          used: 0, // Mesaj limiti kaldırıldı
          limit: Infinity, // Sınırsız
          remaining: Infinity // Sınırsız
        }
      }
    });
  } catch (e: any) {
    logger.error("POST /api/chat - Critical API Error", e, { 
      user_id: user_id || 'unknown',
      chat_id: finalChatId || 'unknown'
    });
    
    // OpenRouter API hatası veya diğer hatalar
    if (e.message?.includes("OpenRouter") || e.message?.includes("API") || e.message?.includes("Cloudflare")) {
      // Cloudflare hatası için özel mesaj
      if (e.message?.includes("Cloudflare") || e.message?.includes("geçici olarak kullanılamıyor")) {
        return NextResponse.json(
          { error: e.message || "Analiz asistanımız şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: e.message || "Analiz asistanımız şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "İşlem sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}