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
import { validateFile, getFileType, MAX_FILE_SIZE } from "@/lib/file-validation";
import { logger } from "@/lib/logger";

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

    // Get all messages for this chat
    const messagesSnap = await db
      .collection("messages")
      .where("chat_id", "==", chat_id)
      .where("user_id", "==", user_id)
      .orderBy("created_at", "asc")
      .get();

    // Format messages for frontend (soft delete'li mesajları filtrele)
    // KRİTİK: Mesajlar zaten orderBy("created_at", "asc") ile sıralı geliyor
    const messages = messagesSnap.docs
      .filter((doc) => {
        const data = doc.data();
        return data.deleted !== true; // Soft delete'li mesajları atla
      })
      .map((doc) => {
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
  try {
    const contentType = req.headers.get("content-type") || "";
    const SYSTEM_PROMPT = `
Sen NesiVarUsta adlı deneyimli bir oto ustasısın. Amacın sohbet etmek DEĞİL, arıza tespiti yapmaktır.

DAVRANIŞ:
- Kullanıcıya en iyi bilgi verebileceği şekilde sorular sor ve ondan en iyi bilgiyi almak için en etkili soruları sor, kullanıcıyı en iyi şekilde yönlendir.
- Gereksiz selam, laf kalabalığı YOK
- Kısa ve net cümleler kullan usta gibi konuş
- Aynı bilgiyi tekrar tekrar isteme
- Sürekli aynı soruları sorma, soru sorma tarzını ve soru sorarken kullandığın kelimeleri değiştirebilirsin.
- Gerçek bir usta gibi soru-cevap yap
- Kibar ve nazik bir şekilde cevap ver.
- Türkçe dilinde yaz. Türkçe cümle yapısına uygun yaz. Turkceyi cok iyi kullan imla kurallarina uygun yaz.

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

KRİTİK KURAL:
- Her başlığı SADECE BİR KEZ kullan
- Aynı bilgiyi tekrar etme
- Cevabı tamamla, yarım bırakma

BİLGİ TOPLAMA:
- Marka / Model / Yıl analiz için gerekli ise sor
- Soruna göre sor:
  - Mekanik → ses ne zaman, nerede, sıcak/soğuk
  - Elektrik → uyarı ışığı, sürekli mi arada mı
  - Donanım → çalışmıyor mu zayıf mı

MARKA/MODEL/YIL AYRIMI (KRİTİK - ASLA KARIŞTIRMA):
- MARKA: Araç üreticisi (Audi, Mercedes, BMW, Volkswagen, Ford, vs.)
- MODEL: Markaya ait model adı/numarası (A4, C200, 3 Serisi, Golf, Focus, vs.)
  * Model sayısal olabilir ama YIL değildir
  * Örnek: "Audi A4" → Marka: Audi, Model: A4
  * Örnek: "Mercedes C200" → Marka: Mercedes, Model: C200
- YIL: Araç üretim yılı (2015, 2020, 2024, vs.)
  * İnsanlar "2015" dediğinde bu YIL'dır, MODEL değil
  * Örnek: "Audi A4 2024" → Marka: Audi, Model: A4, Yıl: 2024
  * Örnek: "2015 model araç" → Yıl: 2015 (model bilgisi eksik, sor)
- Kullanıcı sadece yıl verirse (örn: "2015"), model bilgisini de sor
- Kullanıcı sadece model verirse (örn: "A4"), yıl bilgisini de sor
- Kullanıcı "1766 model" derse → Bu YIL olabilir ama mantıksız, sorgula
- Kullanıcı "Audi 1766" derse → Marka: Audi, Yıl: 1766 (mantıksız, sorgula), Model: ? (sor)

BİLGİ VALİDASYONU (KRİTİK - HER ZAMAN KONTROL ET):
- Kullanıcıdan gelen TÜM bilgileri sorgula ve doğrula, her şeye inanma
- Model yılı kontrolü:
  * Araç model yılları genellikle 1886 (ilk otomobil) ile günümüz arasında olmalı
  * 1800'lerden önce veya gelecekten (2030+) yıl verilirse MUTLAKA sorgula
  * Örnek: "1766 model" → "1766 yılı bir araç modeli olamaz. Lütfen doğru model yılını belirtin."
  * Örnek: "2050 model" → "2050 yılı henüz gelmedi. Lütfen doğru model yılını belirtin."
- Marka/Model tutarlılığı kontrolü:
  * Marka ve model uyumlu olmalı (örn: MERCEDES 1766, PORSCHE 9999 gibi saçma kombinasyonlar)
  * Bilinen marka/model kombinasyonlarını kontrol et
  * Tutarsızlık varsa nazikçe sorgula: "Belirttiğiniz marka ve model kombinasyonu doğru görünmüyor. Lütfen kontrol edip tekrar yazabilir misiniz?"
- KM (kilometre) kontrolü:
  * Çok düşük (örn: 1 km) veya çok yüksek (örn: 10 milyon km) değerler sorgulanmalı
  * Örnek: "1 km" → "Araç 1 km'de mi? Bu doğru mu, yoksa yanlışlıkla mı yazdınız?"
- Absürt veya test amaçlı veriler:
  * Kullanıcılar bazen test için saçma bilgiler verebilir
  * Mantıksız bilgileri nazikçe sorgula ve doğru bilgi iste
  * Örnek: "Marka: MERCEDES Model: 1766" → "Mercedes'in 1766 modeli bulunmuyor. Lütfen doğru marka ve model bilgisini paylaşın."
- Validasyon formatı:
  * Hatalı bilgi tespit ettiğinde: "Belirttiğiniz [bilgi türü] doğru görünmüyor. Lütfen kontrol edip tekrar yazabilir misiniz?"
  * Kibar ve profesyonel ol, kullanıcıyı suçlama

SORU KURALI:
- Soruların başında numara yaz. Örnek: "1. Soru: ..."
- En fazla 3–4 kısa soru
- Tek mesajda sor

FOTO/VIDEO/SES ANALİZİ:
- Fotoğraf, video veya ses kaydı geldiğinde, gördüğün/duyduğun belirtileri analiz et
- Bu belirtileri kullanıcının anlattığı bilgi gibi ele al
- Foto/video/ses'ten çıkardığın teşhisi TEXT olarak açıkla
- Kesin teşhis koyma, "görüntüden/sesten anlaşılan olası durumlar" şeklinde konuş
- Ses analizinde: Motor sesi, gürültü, tıkırtı, vuruntu gibi sesleri detaylıca açıkla
- Aynı belirtiyi birden fazla kez yazma
- Cevabı tamamla, yarım bırakma veya tekrar baştan yazma

ASLA:
- "dinliyorum"
- "ön analiz yok gibi"
- "hadi bakalım"
- sadece anladım gibi cevap verme.
- Aynı bilgiyi tekrar tekrar yazma
- Cevabı yarım bırakma, tekrar baştan yazma
deme.

TEŞEKKÜR MESAJLARI:
- Kullanıcı "teşekkürler", "sağol", "eyvallah" gibi teşekkür mesajları gönderirse
- Kısa ve profesyonel bir şekilde cevap ver: "Rica ederim. Başka bir sorunuz varsa yardımcı olabilirim."
- Aynı teşhisi tekrar etme, sadece teşekküre cevap ver
`;

    let message: string | null = null;
    let file: File | null = null;
    let user_id: string | null = null;
    let chat_id: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      message = form.get("message") as string;
      file = form.get("file") as File;
      user_id = form.get("user_id") as string;
      chat_id = form.get("chat_id") as string;
    } else {
      const body = await req.json();
      message = body.message;
      user_id = body.user_id;
      chat_id = body.chat_id;
    }

    if (!user_id) {
      logger.warn('POST /api/chat - User ID missing');
      return NextResponse.json({ error: "User ID missing" }, { status: 400 });
    }

    const finalChatId = chat_id || crypto.randomUUID();
    const isNewChat = !chat_id; // Yeni chat mi?

    // 0. LİMİT KONTROLÜ (User bazında - AI modelini çağırmadan önce kontrol et)
    // NOT: Mesaj limiti kaldırıldı (ücretsiz model kullanılıyor)
    // Sadece video limiti ve rate limiting korunuyor
    const VIDEO_LIMIT = 1;   // Kullanıcı başına maksimum 1 video (video işleme ağır)

    // 0.1. RATE LIMITING (Abuse koruması - çok hızlı mesaj göndermeyi engelle)
    // Son 5 saniyede gönderilen mesajları kontrol et
    const fiveSecondsAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 5000);
    const recentMessages = await db.collection("messages")
      .where("user_id", "==", user_id)
      .where("sender", "==", "user")
      .where("created_at", ">", fiveSecondsAgo)
      .get();
    
    const recentCount = recentMessages.docs.filter(doc => {
      const data = doc.data();
      return data.deleted !== true;
    }).length;

    // 5 saniyede 3'ten fazla mesaj gönderilemez (spam koruması)
    if (recentCount >= 3) {
      logger.warn('POST /api/chat - Rate limit exceeded', { user_id, recentCount });
      return NextResponse.json(
        { 
          error: `Çok hızlı mesaj gönderiyorsunuz. Lütfen birkaç saniye bekleyin.`,
          limit_reached: true,
          limit_type: "rate_limit"
        },
        { status: 429 }
      );
    }

    // 0.2. MEDIA TİPİNİ BELİRLE (video, audio, image)
    let hasMedia = false;
    let isVideo = false;
    let isAudio = false;
    let usedVideos = 0; // Video limit kontrolü için (response'da da kullanılacak)
    if (file) {
      hasMedia = true;
      const fileType = getFileType(file);
      isVideo = fileType === "video";
      isAudio = fileType === "audio";
      
      // Video limit kontrolü için query (response'da da kullanılacak)
      if (isVideo) {
        // User'ın daha önce video gönderip göndermediğini kontrol et
        // NOT: Sadece "user" sender'ı olan mesajları say (AI mesajları sayılmaz)
        // NOT: media_type === "video" olan mesajları say (fotoğraflar sayılmaz)
        const userVideos = await db.collection("messages")
          .where("user_id", "==", user_id)
          .where("sender", "==", "user")
          .where("has_media", "==", true)
          .get();
        
        // Soft delete'li olanları ve video olmayanları hariç tut
        // NOT: Sadece media_type === "video" olan mesajları say (fotoğraflar sayılmaz)
        usedVideos = userVideos.docs.filter(doc => {
          const data = doc.data();
          return data.deleted !== true && data.media_type === "video";
        }).length;

        if (usedVideos >= VIDEO_LIMIT) {
          logger.warn('POST /api/chat - Video limit exceeded', { user_id, usedVideos, limit: VIDEO_LIMIT });
          return NextResponse.json(
            { 
              error: `Maksimum ${VIDEO_LIMIT} video yükleme hakkınız doldu.`,
              limit_reached: true,
              limit_type: "video",
              used: usedVideos,
              limit: VIDEO_LIMIT
            },
            { status: 400 }
          );
        }
      }
    }

    // 1. GEÇMİŞİ GETİR (Firestore optimized)
    // OpenRouter için son 20 mesajı gönder (maliyet optimizasyonu)
    const historySnap = await db
      .collection("messages")
      .where("chat_id", "==", finalChatId)
      .orderBy("created_at", "desc") // En yeni mesajlar önce
      .limit(20) // 20 mesaj limiti (10 user + 10 AI yaklaşık)
      .get();

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
      
      // Boş mesajları atla (ama has_media varsa geç)
      if (!content.trim() && !m.has_media) return;
      
      // Foto/video mesajları için özel format
      let messageText = content;
      if (m.has_media && m.sender === "user") {
        // Kullanıcı foto/video gönderdiyse, kısa bir not ekle
        if (!content.trim()) {
          // media_type'a göre spesifik mesaj
          if (m.media_type === "video") {
            messageText = "Video paylaşıldı";
          } else if (m.media_type === "audio") {
            messageText = "Ses kaydı paylaşıldı";
          } else {
            messageText = "Fotoğraf paylaşıldı";
          }
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

    // 2. YENİ MESAJI HAZIRLA
    let mediaBase64: string | undefined;
    let mediaMimeType: string | undefined;
    let analysisInstruction = "";

    if (file) {
      // Merkezi dosya validasyonu
      const validation = validateFile(file);
      if (!validation.valid) {
        logger.warn('File validation failed', { 
          fileName: file.name, 
          fileSize: file.size, 
          fileType: file.type,
          error: validation.error 
        });
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      // Ses dosyası kontrolü - şu an desteklenmiyor
      if (isAudio) {
        return NextResponse.json(
          { error: "Ses dosyası analizi şu anda desteklenmiyor. Lütfen görsel kullanın. Ses analizi için ücretsiz model bulunmamaktadır." },
          { status: 400 }
        );
      }
      
      // Video dosyası kontrolü - şu an provider sorunları var, geçici olarak devre dışı
      if (isVideo) {
        return NextResponse.json(
          { error: "Lütfen görsel kullanın. Video analizi için ücretsiz model desteği şu an sınırlıdır." },
          { status: 400 }
        );
      }

      // hasMedia ve isVideo zaten yukarıda set edildi
      const buffer = Buffer.from(await file.arrayBuffer());
      mediaBase64 = buffer.toString("base64");
      mediaMimeType = file.type;
      
      // Foto/video/ses için analiz talimatı
      if (isAudio) {
        if (!message) {
          analysisInstruction = "Bu ses kaydını arıza tespiti için detaylıca analiz et. Duyduğun sesleri, gürültüleri ve olası nedenleri sıralayarak açıkla.";
        } else {
          analysisInstruction = "Ayrıca bu ses kaydını da analiz et ve duyduğun belirtileri değerlendir.";
        }
      } else {
        if (!message) {
          analysisInstruction = "Bu görseli/videoyu arıza tespiti için detaylıca analiz et. Gördüğün belirtileri ve olası nedenleri sıralayarak açıkla.";
        } else {
          analysisInstruction = "Ayrıca bu görseli/videoyu da analiz et ve gördüğün belirtileri değerlendir.";
        }
      }
    }

    // 3. MODEL SEÇİMİ (Hibrit yaklaşım)
    // Video/ses/görsel varsa Nemotron (multimodal), text-only ise Mimo V2 Flash
    const selectedModel = selectModel(isVideo, hasMedia && !isVideo && !isAudio, isAudio);
    logger.debug('POST /api/chat - Model selected', { 
      model: selectedModel, 
      isVideo, 
      isAudio, 
      hasMedia, 
      isImage: hasMedia && !isVideo && !isAudio 
    });
    
    // 4. MESAJLARI HAZIRLA (OpenRouter formatı)
    // NOT: Mistral gibi bazı modeller system role'ü desteklemiyor, bu yüzden system prompt'u ilk user mesajına ekliyoruz
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string | any }> = [];
    
    // History varsa ekle
    if (openRouterHistory.length > 0) {
      messages.push(...openRouterHistory);
    }
    
    // Yeni user mesajını hazırla
    const userMessage = createOpenRouterMessage(
      message ? `${message}${analysisInstruction ? `\n\n${analysisInstruction}` : ""}` : analysisInstruction,
      mediaBase64,
      mediaMimeType
    );
    
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
    const fallbackModels = [selectedModel, ...getFallbackModels(isVideo, hasMedia && !isVideo && !isAudio, isAudio).filter(m => m !== selectedModel)];
    
    for (const modelToTry of fallbackModels) {
      try {
        logger.debug('POST /api/chat - Trying model', { model: modelToTry });
        // Görsel/video analizi için daha fazla token (detaylı analiz için)
        const maxTokens = hasMedia ? 2500 : 1200;
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
    
    // all_messages array'ini hazırla
    let userMessageContent = message;
    if (!userMessageContent && hasMedia) {
      // media_type'a göre spesifik mesaj
      if (isVideo) {
        userMessageContent = "Video paylaşıldı";
      } else if (isAudio) {
        userMessageContent = "Ses kaydı paylaşıldı";
      } else {
        userMessageContent = "Fotoğraf paylaşıldı";
      }
    }
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
    
    // Kullanıcı mesajı (sadece text, foto/video saklanmıyor)
    const userMsgRef = db.collection("messages").doc();
    const userMessageData: any = {
      chat_id: finalChatId,
      user_id,
      sender: "user",
      content: userMessageContent,
      has_media: hasMedia, // Sadece flag, dosya saklanmıyor
      created_at: userTimestamp, // User mesajı önce
    };
    
    // media_type sadece hasMedia true ise ekle (Firestore undefined kabul etmiyor)
    if (hasMedia) {
      userMessageData.media_type = isVideo ? "video" : (isAudio ? "audio" : "image");
    }
    
    batch.set(userMsgRef, userMessageData);

    // AI mesajı (AI modelinin teşhisi text olarak kaydediliyor)
    const aiMsgRef = db.collection("messages").doc();
    batch.set(aiMsgRef, {
      chat_id: finalChatId,
      user_id,
      sender: "model",
      content: aiText, // Foto/video analizinden çıkan teşhis text olarak buraya kaydediliyor
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

    // Batch commit - hata durumunda rollback yapılır
    try {
      await batch.commit();
      logger.debug('POST /api/chat - Messages saved', { chat_id: finalChatId, user_id });
    } catch (commitError: any) {
      logger.error("POST /api/chat - Batch commit error", commitError, { chat_id: finalChatId, user_id });
      return NextResponse.json(
        { error: "Mesajlar kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Limit durumunu hesapla (response'da gönder)
    // NOT: Mesaj limiti kaldırıldı, sadece video limiti gösteriliyor
    // Video sayısını hesapla (response için)
    // NOT: Batch commit'ten sonra video kaydedilmiş olacak, o yüzden tekrar query yapıyoruz
    // KRİTİK: Video sayısını tekrar çekme - yukarıda zaten çekildi (usedVideos değişkeni)
    // Eğer video gönderildiyse, batch commit'ten sonra kaydedilmiş olacak, o yüzden +1 ekliyoruz
    const finalUsedVideos = isVideo ? usedVideos + 1 : usedVideos;
    const remainingVideos = VIDEO_LIMIT - finalUsedVideos;

    return NextResponse.json({
      chat_id: finalChatId,
      content: aiText,
      limits: {
        messages: {
          used: 0, // Mesaj limiti kaldırıldı
          limit: Infinity, // Sınırsız
          remaining: Infinity // Sınırsız
        },
        videos: {
          used: finalUsedVideos,
          limit: VIDEO_LIMIT,
          remaining: remainingVideos
        }
      }
    });
  } catch (e: any) {
    logger.error("POST /api/chat - Critical API Error", e, { 
      user_id: e.user_id || 'unknown',
      chat_id: e.chat_id || 'unknown'
    });
    
    // OpenRouter API hatası veya diğer hatalar
    if (e.message?.includes("OpenRouter") || e.message?.includes("API") || e.message?.includes("Cloudflare") || e.message?.includes("Provider returned error") || e.message?.includes("Video analizi")) {
      // Cloudflare hatası için özel mesaj
      if (e.message?.includes("Cloudflare") || e.message?.includes("geçici olarak kullanılamıyor")) {
        return NextResponse.json(
          { error: e.message || "Video analizi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin veya daha küçük bir video dosyası yükleyin." },
          { status: 503 }
        );
      }
      // Görsel/Video hatası için özel mesaj (Provider hatası)
      if (e.message?.includes("Görsel analizi") || e.message?.includes("Video analizi") || e.message?.includes("Provider returned error") || e.message?.includes("provider hatası")) {
        return NextResponse.json(
          { error: e.message || "Görsel analizi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
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