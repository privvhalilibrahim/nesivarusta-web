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

// Dil kontrolü fonksiyonu - Çince, Japonca, Korece karakter tespiti
function containsNonTurkishChars(text: string): boolean {
  // Çince, Japonca, Korece karakter regex
  const nonTurkishRegex = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  return nonTurkishRegex.test(text);
}


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
Sen NesiVarUsta'sın. Onlarca yıl tecrübesi olan, binlerce aracın arızasını çözmüş deneyimli bir oto ustasısın.
Amacın, kullanıcının verdiği bilgilerle araç arıza analiz ve teşhisi yapmak.

DİL:
- Sadece Türkçe yaz.
- Çince/Japonca karakterler kullanma ("birkaç" yaz, "几个" yazma).
- İngilizce yalnızca teknik terimler için kullan (ECU, ABS, DPF vb.).

KONUŞMA TARZI:
- Kısa, net, ciddi ama samimi.
- "siz" hitabı kullan, nazik dil.
- Gereksiz laf kalabalığı yapma.
- Yapay zeka olduğunu ASLA belirtme.
- Kimlik sorulursa yalnızca: "Ben NesiVarUsta'yım." de.
- "anladım", "dinliyorum" gibi tek başına anlamsız cevaplar verme.

KRİTİK TEKRARLAMA YASAĞI:
- Son mesajlarını MUTLAKA kontrol et.
- Aynı soruyu, aynı teşhisi, aynı listeyi ASLA tekrar yazma.
- Daha önce teşhis yaptıysan, aynı teşhisi kopyalama.
- Yeni bilgi geldiyse önceki teşhisi GÜNCELLE, birebir tekrar etme.

ÇALIŞMA AKIŞI:
1) Kullanıcının verdiği tüm bilgileri değerlendir.
2) Eksik kritik bilgiler varsa, TEK MESAJDA en fazla 3–4 soru sor (numaralı).
3) Marka + model + yıl + sorun açıklaması + 2–3 detay varsa → TEŞHİS YAP ve daha fazla soru sorma.
4) Kullanıcı "bu kadar", "başka detay yok", "bilmiyorum" gibi cevap verirse → Mevcut bilgilerle TEŞHİS YAP, soru sorma.
5) Kullanıcı kısa veya anlamsız cevaplar veriyorsa (1–2 kelime) → Mevcut bilgilerle çıkarım yaparak TEŞHİS YAP.
6) Aynı teşhisi tekrar yazma. Gerekirse farklı ifadeler ve farklı ama eşdeğer olasılıklar kullan.

BAĞLAM TAKİBİ:
- Kullanıcının daha önce verdiği bilgileri hatırla.
- "Daha önce belirttiğiniz..." gibi referanslar kullan.
- Kullanıcı zaten söylediği bilgiyi tekrar sorma.

ÇOKLU SORUN TESPİTİ:
- Kullanıcı birden fazla sorun belirtirse, tüm sorunları analiz et.
- İlk sorunu bırakma, yenisini ekle.
- Bağlantılıysa birlikte değerlendir.
- Her sorun için ayrı ama tutarlı değerlendirme yap.

TEŞHİS FORMATI:
- 2–3 cümlelik kısa özet.
- Ardından:
  "Şu nedenlerden biri olabilir:"
  1. [Neden] – En olası
  2. [Neden]
  3. [Neden]
- KESİNLİK YOK: Her zaman "olabilir", "muhtemelen", "nedenlerden biri" ifadelerini kullan.

GÜVENLİK:
- Fren kaybı, yoğun duman, hararet, yakıt kaçağı, yolda stop etme gibi durumlarda:
  Aracın kullanılmamasını ve profesyonel servise gidilmesini öncelikle belirt.
- Panik yaratma, güvenliği öncele.

VALİDASYON:
- Marka / model / yıl eksikse nazikçe sor.
- Mantıksız marka–model kombinasyonlarını sorgula.
- Motor tipi / yakıt / kasa uyumsuzluklarını kontrol et.
- KM mantıksızsa (1 km, 10 milyon km gibi) sorgula.

SORU SORMA PRENSİPLERİ:
- Mekanik sorunlarda: ses, zamanlama, sıcaklık, devir ilişkisi.
- Elektrik sorunlarında: arıza lambası, süreklilik, kontak durumu.
- Fren / süspansiyonda: yol durumu, direksiyon hareketi.
- Performans sorunlarında: çekiş, yokuş, hız.
- Kullanıcının seviyesine göre teknik derinliği ayarla.

DÖNGÜ KIRICI – ZORUNLU ÇIKIŞ KURALI:
- Kullanıcı 2 kez üst üste anlamsız, tek harfli, kısa veya "bilmiyorum / bu kadar" cevabı verirse:
  → DAHA FAZLA SORU SORMA
  → AYNI TEŞHİSİ TEKRAR YAZMA
  → Mevcut bilgilerle SON TEŞHİSİ YAP
  → Konuşmayı nazikçe KAPAT

- Bu durumda şu yapıyı kullan:
  1) 1–2 cümlelik teşhis özeti
  2) 2–3 maddelik olası neden listesi (öncekilerle birebir aynı olmayacak)
  3) "Bu bilgilerle yapılabilecek değerlendirme budur." benzeri kapanış
  4) Soru sorma

UZUN CHAT YÖNETİMİ:
- Chat 30+ mesaj olduğunda, model performansı düşebilir ve bağlam kaybı yaşanabilir.
- Bu durumda mevcut bilgilerle SON TEŞHİSİ YAP ve kullanıcıya yeni chat açmasını öner.
- "Bu chat oldukça uzadı. Daha sağlıklı bir analiz için yeni bir chat açıp baştan başlayabilirsiniz. Mevcut bilgilerle yapılabilecek değerlendirme yukarıdaki gibidir." gibi nazik bir uyarı ver.

KULLANICI TAVRI:
- Kullanıcı sinirli veya kaba konuşursa:
  Kısa bir özür dile, hemen teşhis yap, konuşmayı uzatma.

ÖZEL DURUMLAR:
- Medya isteği: "Ücretsiz sürümde görüntü, ses ve video işleyemem. Sorununuzu yazılı anlatır mısınız?"
- PDF isteği: "PDF raporu için yukarıdaki üç nokta (⋮) menüsünden 'PDF Rapor Oluştur' seçeneğini kullanabilirsiniz."

YASAKLAR:
- "yapay zekayım", "AI'yım", "asistanım" gibi ifadeler
- Aynı mesajı veya listeyi tekrar yazmak
- Cevabı yarım bırakmak

`;

    /** Her N mesajda bir sohbet özeti kullan (ilk N mesaja kadar tam geçmiş gönderilir) */
    const SUMMARY_EVERY_N_MESSAGES = 4;

    const CHAT_SUMMARY_PROMPT = `Sen bir "CHAT HAFIZASI OLUŞTURUCU"sun. Görevin, araç arıza sohbetini bir sonraki AI yanıtında bağlam kaybı olmadan devam edebilmesi için ÖZETLEMEKTİR. Bu özet uzun süreli hafıza olarak kullanılacaktır.

KURALLAR:
- Sadece sohbetten kesin çıkarılabilen bilgileri yaz. Varsayım, yorum, teşhis veya öneri EKLEME.
- Kullanıcının söylemediği hiçbir detayı ekleme. Daha önce söylenmiş bilgileri çarpıtma.
- Kısa, net, maddeler halinde yaz. Gereksiz teknik detay ekleme.
- Elenmiş ihtimaller varsa yaz. Tekrar edilmemesi gereken noktaları belirt.

FORMAT (değiştirme):
CHAT HAFIZASI:
- Araç:
- Ana sorun:
- Önemli belirtiler:
- Daha önce yapılan değerlendirmeler:
- Elenen ihtimaller:
- Tekrar edilmemesi gereken noktalar:
- Şu anki durum:

SOHBET:
{{CHAT_MESSAGES}}

ÇIKTI: Yukarıdaki FORMAT'a birebir uyarak yaz. Boş alanlar için "Bilinmiyor" yaz.`;

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

    const chatRef = db.collection("chats").doc(finalChatId);

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
    // Önce toplam mesaj sayısını al (özet / geçmiş için)
    const totalMessagesCount = await cachedQuery(
      createCacheKey('message_count', { chat_id: finalChatId }),
      async () => {
        const countSnap = await db
          .collection("messages")
          .where("chat_id", "==", finalChatId)
          .where("deleted", "!=", true)
          .get();
        return countSnap.docs.length;
      },
      10000 // 10 saniye cache
    );

    // Geçmiş sorgusu için limit (özet kullanıldığında modele en fazla 4 mesaj gider; bu sadece DB'den kaç mesaj çekileceğini sınırlar)
    const historyFetchLimit = 25;

    // 30+ mesaj olduğunda model'e uyarı göndereceğiz
    const isLongChat = totalMessagesCount >= 30;

    // Geçmiş mesajları getir (limit: son N mesaj)
    const historyCacheKey = createCacheKey('history', { chat_id: finalChatId, limit: historyFetchLimit });
    const historySnap = await cachedQuery(
      historyCacheKey,
      async () => {
        return await db
          .collection("messages")
          .where("chat_id", "==", finalChatId)
          .orderBy("created_at", "desc") // En yeni mesajlar önce
          .limit(historyFetchLimit)
          .get();
      },
      10000 // 10 saniye cache (chat aktifken sık değişir)
    );

    // Mesajları ters çevir (en eski -> en yeni sırasına)
    const sortedDocs = [...historySnap.docs].reverse();

    const useSummary = totalMessagesCount >= SUMMARY_EVERY_N_MESSAGES;
    const lastSummaryEnd = useSummary ? Math.floor(totalMessagesCount / SUMMARY_EVERY_N_MESSAGES) * SUMMARY_EVERY_N_MESSAGES : 0;
    const recentCount = useSummary ? totalMessagesCount - lastSummaryEnd : totalMessagesCount;

    let chatSummaryText = "";
    let newSummaryToSave: { text: string; upTo: number } | null = null;

    if (useSummary) {
      const chatDoc = await chatRef.get();
      const chatData = chatDoc.data();
      const existingSummaryUpTo = chatData?.chat_summary_message_count ?? 0;

      let summaryBlockDocs: FirebaseFirestore.QueryDocumentSnapshot[];
      if (totalMessagesCount <= historyFetchLimit) {
        summaryBlockDocs = sortedDocs.slice(0, lastSummaryEnd);
      } else {
        const summarySnap = await db
          .collection("messages")
          .where("chat_id", "==", finalChatId)
          .orderBy("created_at", "asc")
          .limit(lastSummaryEnd)
          .get();
        summaryBlockDocs = summarySnap.docs;
      }

      const needNewSummary = existingSummaryUpTo !== lastSummaryEnd && summaryBlockDocs.length > 0;
      if (needNewSummary) {
        const chatMessagesText = summaryBlockDocs
          .map((doc) => {
            const m = doc.data();
            if (m.deleted === true || !m.content?.trim()) return null;
            const role = m.sender === "user" ? "User" : "Assistant";
            return `${role}: ${(m.content || "").trim()}`;
          })
          .filter(Boolean)
          .join("\n\n");
        const summaryPrompt = CHAT_SUMMARY_PROMPT.replace("{{CHAT_MESSAGES}}", chatMessagesText);
        const summaryModel = selectModel(false, false, false);
        try {
          const summaryResult = await callOpenRouter(
            summaryModel,
            [{ role: "user", content: summaryPrompt }],
            {
              temperature: 0.2,
              top_p: 0.8,
              frequency_penalty: 0.3,
              presence_penalty: 0,
              max_tokens: 300,
            }
          );
          chatSummaryText = summaryResult.content?.trim() || "Bilinmiyor";
          newSummaryToSave = { text: chatSummaryText, upTo: lastSummaryEnd };
        } catch (summaryErr: any) {
          logger.warn("POST /api/chat - Summary failed, using full context", { error: summaryErr?.message });
          chatSummaryText = chatData?.chat_summary || "Bilinmiyor";
        }
      } else {
        chatSummaryText = chatData?.chat_summary || "Bilinmiyor";
      }
    }

    const docsToUseForHistory = useSummary ? sortedDocs.slice(-recentCount) : sortedDocs;

    const historyForConversion: Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: any }> }> = [];
    docsToUseForHistory.forEach((doc) => {
      const m = doc.data();
      if (m.deleted === true || !m.chat_id) return;
      const content = m.content || "";
      if (!content.trim()) return;
      let messageText = content;
      if (m.has_media && m.sender === "user" && !content.trim()) {
        if (m.media_type === "video") messageText = "Video paylaşıldı";
        else if (m.media_type === "audio") messageText = "Ses kaydı paylaşıldı";
        else messageText = "Fotoğraf paylaşıldı";
      }
      historyForConversion.push({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: messageText }],
      });
    });

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
    
    // UZUN CHAT UYARISI: 30+ mesaj olduğunda model'e özel uyarı
    let longChatWarning = "";
    if (isLongChat) {
      longChatWarning = `\n\n⚠️ UZUN CHAT UYARISI:\nBu chat ${totalMessagesCount} mesaj oldu. 30 mesajdan sonra model performansı düşebilir ve bağlam kaybı yaşanabilir.\n\nŞİMDİ YAP:\n- Mevcut bilgilerle SON TEŞHİSİ YAP\n- Kullanıcıya nazikçe şunu söyle: "Bu chat oldukça uzadı. Daha sağlıklı bir analiz için yeni bir chat açıp baştan başlayabilirsiniz. Mevcut bilgilerle yapılabilecek değerlendirme yukarıdaki gibidir."\n- Analizi sonlandır, daha fazla soru sorma\n\nŞİMDİ YAPMA:\n- Daha fazla soru sorma\n- Chat'i daha da uzatma`;
    }

    const summaryBlockForSystem = useSummary && chatSummaryText
      ? `\n\n--- ÖNCEKİ SOHBET ÖZETİ ---\n${chatSummaryText}\n--- SON MESAJLAR AŞAĞIDA ---`
      : "";
    
    // Yeni user mesajını hazırla (sadece text)
    const userMessage = createOpenRouterMessage(message, undefined, undefined);
    
    // System prompt'u system role olarak ekle (OpenRouter standard)
    const finalSystemPrompt = SYSTEM_PROMPT + longChatWarning + summaryBlockForSystem;
    
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: finalSystemPrompt,
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
        const result = await callOpenRouter(modelToTry, messagesWithSystem, {
          temperature: 0.25,
          top_p: 0.9,
          frequency_penalty: 0.6,
          presence_penalty: 0.2,
          max_tokens: 600,
        });
        aiText = result.content;
        logger.info('POST /api/chat - Model success', { 
          model: modelToTry, 
          tokens: result.usage?.completion_tokens || 'N/A', 
          finish_reason: result.finish_reason || 'N/A' 
        });
        
        // DİL KONTROLÜ: Çince, Japonca, Korece karakter tespiti
        if (aiText && containsNonTurkishChars(aiText)) {
          logger.warn('POST /api/chat - Non-Turkish characters detected in AI response', { 
            model: modelToTry,
            aiText: aiText.substring(0, 200), // İlk 200 karakteri logla
            chat_id: finalChatId
          });
          // Cevabı filtrele: Çince karakterleri Türkçe karşılıklarıyla değiştir
          aiText = aiText
            .replace(/几个/g, 'birkaç')
            .replace(/一些/g, 'bazı')
            .replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, ''); // Diğer Çince/Japonca/Korece karakterleri kaldır
        }
        
        // Eğer response token limiti nedeniyle kesilmişse (finish_reason === "length")
        if (result.finish_reason === "length") {
          logger.warn('POST /api/chat - Response truncated', { 
            model: modelToTry, 
            max_tokens: 600,
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
      const chatUpdateData: Record<string, unknown> = {
        last_message: aiText,
        all_messages: updatedAllMessages,
        updated_at: aiTimestamp,
      };
      if (newSummaryToSave) {
        chatUpdateData.chat_summary = newSummaryToSave.text;
        chatUpdateData.chat_summary_message_count = newSummaryToSave.upTo;
      }
      batch.set(chatRef, chatUpdateData, { merge: true });
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