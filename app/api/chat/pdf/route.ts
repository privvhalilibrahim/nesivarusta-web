import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { getSesAnalizPrompt, getYuzdelikAksiyonPrompt } from "./prompts";
import { callOpenRouter } from "../../lib/openrouter";
import { marked } from "marked";
import path from "path";
import fs from "fs";

// KRİTİK: Vercel serverless için Node.js runtime belirt (Edge runtime değil!)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// NOT: Puppeteer/Chromium kaldırıldı - Client-side PDF generation kullanılıyor (jsPDF + html2canvas)
// Bu sayede Chromium başlatma sorunları tamamen çözüldü

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat_id = body?.chat_id as string | undefined;
    const user_id = body?.user_id as string | undefined;

    // Production kontrolü (bir kere tanımla)
    const isVercel = process.env.VERCEL === '1';
    const isProduction = isVercel || process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log("[PDF] Request body:", { chat_id, user_id });
    }

    if (!chat_id || !user_id) {
      return NextResponse.json(
        { error: "chat_id ve user_id zorunlu" },
        { status: 400 }
      );
    }

    // 1️⃣ Chat mesajlarını çek (soft delete'li mesajları atla)
    // NOT: Firestore'da deleted field'ı undefined olan mesajlar != true sorgusu ile gelmiyor
    // Bu yüzden önce tüm mesajları çekip sonra filtreleyeceğiz
    const messagesSnap = await db
      .collection("messages")
      .where("chat_id", "==", chat_id)
      .where("user_id", "==", user_id)
      .orderBy("created_at", "asc")
      .get();

    if (!isProduction) {
      console.log("[PDF] Firestore'dan dönen mesaj sayısı:", messagesSnap.docs.length);
    }

    // Mesajları formatla (sadece user ve AI mesajları, welcome message'ı atla)
    let hasMediaAnalysis = false; // SADECE ses/video analizi var mı? (görsel analizi değil!)
    
    // NOT: Firestore'da deleted field'ı undefined olan mesajlar != true sorgusu ile gelmiyor
    // Bu yüzden önce tüm mesajları çekip sonra JavaScript'te filtreliyoruz
    const chatMessages = messagesSnap.docs
      .filter((doc) => {
        const data = doc.data();
        // deleted field'ı true olan mesajları atla (undefined veya false olanlar geçer)
        return data.deleted !== true;
      })
      .map((doc) => {
        const data = doc.data();
        const content = data.content || "";
        
        // Welcome message'ı atla
        if (content.includes("Merhaba! Ben NesiVarUsta Analiz Asistanı") && data.sender === "model") {
          return null;
        }
        
        // KRİTİK: Sadece video veya audio analizi varsa "Ses Analiz Raporu" oluştur
        // Görsel analizi (image) için "Yüzdelik Arıza Aksiyon Raporu" oluştur
        if (data.has_media === true && (data.media_type === "video" || data.media_type === "audio")) {
          hasMediaAnalysis = true;
        }
        
        // Mesaj içeriğinde gerçek ses/video analizi belirtileri var mı? (görsel analizi değil!)
        const contentLower = content.toLowerCase();
        // "ses kaydı", "video kaydı", "duyduğun", "dinlediğin" gibi ifadeler
        // Ama "görüntü", "gördüğün", "fotoğraf" gibi ifadeler görsel analizi, ses analizi değil!
        if ((contentLower.includes("ses kaydı") || contentLower.includes("video kaydı") || 
            contentLower.includes("duyduğun") || contentLower.includes("dinlediğin") ||
            contentLower.includes("ses analizi") || contentLower.includes("video analizi")) &&
            !contentLower.includes("görüntü") && !contentLower.includes("fotoğraf") && !contentLower.includes("gördüğün")) {
          hasMediaAnalysis = true;
        }
        
        return {
          sender: data.sender === "user" ? "Kullanıcı" : "NesiVarUsta Analiz Asistanı",
          content: content,
          timestamp: data.created_at?.toDate() || new Date(),
          isUser: data.sender === "user",
          hasMedia: data.has_media === true,
          mediaType: data.media_type || null,
        };
      })
      .filter((msg) => msg !== null) as Array<{
        sender: string;
        content: string;
        timestamp: Date;
        isUser: boolean;
        hasMedia?: boolean;
        mediaType?: string | null;
      }>;

    if (!isProduction) {
      console.log("[PDF] Filtreleme sonrası chatMessages.length:", chatMessages.length);
    }

    // 0️⃣ Mesaj kontrolü (filtreleme sonrası)
    if (chatMessages.length === 0) {
      return NextResponse.json(
        { error: "Bu chat'te mesaj bulunamadı veya tüm mesajlar silinmiş" },
        { status: 404 }
      );
    }

    // 1️⃣ Minimum mesaj sayısı kontrolü (en az 6 mesaj)
    if (chatMessages.length < 6) {
      return NextResponse.json(
        { error: "PDF raporu oluşturmak için en az 6 mesaj gereklidir" },
        { status: 400 }
      );
    }

    // 2️⃣ En az 2 kullanıcı mesajı ve 2 AI mesajı olmalı
    const userMessages = chatMessages.filter((msg) => msg.isUser);
    const aiMessages = chatMessages.filter((msg) => !msg.isUser);

    if (userMessages.length < 2 || aiMessages.length < 2) {
      return NextResponse.json(
        { error: "PDF raporu oluşturmak için en az 2 kullanıcı mesajı ve 2 AI mesajı gereklidir" },
        { status: 400 }
      );
    }

    // 3️⃣ AI'nin teşhis yapmış olması kontrolü (opsiyonel - sadece uyarı)
    const hasDiagnosis = aiMessages.some((msg) => {
      const content = msg.content.toLowerCase();
      
      // ❌ SORU İÇEREN MESAJLARI FİLTRELE (teşhis değil)
      const isQuestionOnly = 
        /(\?|soru|nedir|ne|hangi|kaç|nasıl|neden\s+soruyor|bilgi\s+eksik|verin|lütfen\s+şu\s+bilgileri)/i.test(content) &&
        !/(teşhis|neden|sebep|olası|muhtemel|çözüm|öneri|yapılmalı|değiştir|tamir)/i.test(content);
      
      if (isQuestionOnly) return false; // Sadece soru soran mesajlar teşhis değil
      
      // ✅ GERÇEK TEŞHİS KONTROLLERİ
      // 1. Numaralı liste + teşhis kelimeleri (1. Neden: ... gibi)
      const hasNumberedDiagnosis = /\d+\.\s+.*(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza)/i.test(content);
      
      // 2. Teşhis kelimeleri + çözüm önerisi
      const hasDiagnosisWithSolution = 
        /(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza|tahmin)/i.test(content) &&
        /(?:çözüm|öneri|yapılmalı|değiştir|tamir|kontrol|bakım)/i.test(content);
      
      // 3. Markdown bold ile sebepler (**Neden:** gibi)
      const hasBoldCauses = /\*\*.*(?:neden|sebep|olası|muhtemel)\*\*/i.test(content);
      
      // 4. "Şu nedenlerden biri olabilir" gibi açık teşhis ifadeleri
      const hasExplicitDiagnosis = 
        /(?:şu\s+nedenlerden|olası\s+nedenler|muhtemel\s+sebepler|teşhis|tanı)/i.test(content);
      
      // 5. Numaralı liste + açıklama (sadece soru değil, açıklama var)
      const hasNumberedListWithExplanation = 
        /\d+\.\s+[^?]+\s+[^?]+/i.test(content) && // En az 2 kelime, soru işareti yok
        !content.includes("?");
      
      return hasNumberedDiagnosis || hasDiagnosisWithSolution || hasBoldCauses || 
             hasExplicitDiagnosis || hasNumberedListWithExplanation;
    });

    // Teşhis yoksa uyarı ekle (ama devam et)
    if (!hasDiagnosis) {
      console.warn("PDF oluşturuluyor ancak AI henüz teşhis yapmamış görünüyor.");
    }

    // 2️⃣ Chat mesajlarından araç bilgilerini çıkar (Marka, Model, Yıl, KM) - AI model ile
    const allUserMessages = userMessages.map(msg => msg.content);
    
    // Güncel yılı al
    const currentYear = new Date().getFullYear();
    
    // AI model'e prompt gönder
    const prompt = `Kullanıcının mesajlarından araç bilgilerini çıkar ve SADECE JSON formatında döndür.

TALİMATLAR:
- MARKA: Araç üreticisi (Audi, BMW, Mercedes, Hyundai, Toyota, vb.)
- MODEL: Markaya ait model adı/numarası (A4, 3 Serisi, C200, i10, Corolla, vb.)
- YIL: Araç üretim yılı (1985-${currentYear} arası) - Sadece 4 haneli yıl sayısı
  * KRİTİK: 1985'ten önceki veya ${currentYear}'den sonraki yılları ASLA çıkarma, boş bırak
  * 1985'ten önceki ve gelecek yıllar analiz için uygun değil
- KM: Araç kilometresi (50000, 120000, vb.) - Sadece sayı, "km" yazma

ÖNEMLİ:
- Bilgiler dağınık olabilir, tüm mesajları dikkatlice oku
- "hyundai gec duruyo" gibi mesajlarda "hyundai" marka olabilir
- "2018 model" veya "2020'de aldım" gibi ifadelerde yıl var
- 1985'ten önceki veya ${currentYear}'den sonraki yıl görürsen YIL alanını boş bırak
- Emin değilsen alanı boş bırak
- SADECE JSON döndür, başka açıklama yapma

ÖRNEKLER:
"audi a6 virajda titreme" → {"marka": "Audi", "model": "A6", "yil": "", "km": ""}
"bmw 320d 2015 150000 km" → {"marka": "BMW", "model": "320d", "yil": "2015", "km": "150000"}
"hyundai gec duruyo" → {"marka": "Hyundai", "model": "", "yil": "", "km": ""}

Kullanıcı mesajları:
${allUserMessages.join(" ")}

JSON (sadece bu formatı döndür):
{
  "marka": "",
  "model": "",
  "yil": "",
  "km": ""
}`;

    const vehicleExtractModel = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model
    
    const vehicleExtractMessages = [
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    if (!isProduction) {
      console.log("[PDF] AI model'e araç bilgileri çıkarma isteği gönderiliyor...");
    }
    const vehicleInfoResult = await callOpenRouter(vehicleExtractModel, vehicleExtractMessages, {
      max_tokens: 200,
      temperature: 0.3, // Düşük temperature - daha tutarlı JSON çıktısı için
      maxRetries: 5, // PDF için daha fazla retry (kritik)
    });
    
    let responseText = vehicleInfoResult.content.trim();
    
    // JSON'u parse et
    let vehicleInfo = {
      marka: "",
      model: "",
      yil: "",
      km: ""
    };

    try {
      // JSON bloğunu bul (```json ... ``` veya sadece { ... })
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        vehicleInfo = {
          marka: parsed.marka || "",
          model: parsed.model || "",
          yil: parsed.yil || "",
          km: parsed.km || ""
        };
      } else {
        // Direkt JSON parse dene
        const parsed = JSON.parse(responseText);
        vehicleInfo = {
          marka: parsed.marka || "",
          model: parsed.model || "",
          yil: parsed.yil || "",
          km: parsed.km || ""
        };
      }
    } catch (parseError) {
      console.error("[PDF] JSON parse hatası:", parseError);
      console.error("[PDF] Model response:", responseText);
      // Parse hatası olsa bile boş obje ile devam et
    }

    // 1985'ten önceki ve gelecek yılları kontrol et ve boş bırak
    if (vehicleInfo.yil) {
      const yilNum = parseInt(vehicleInfo.yil);
      const currentYear = new Date().getFullYear();
      if (!isNaN(yilNum) && (yilNum < 1985 || yilNum > currentYear)) {
        console.log(`[PDF] Geçersiz yıl tespit edildi: ${yilNum} (1985-${currentYear} arası olmalı), boş bırakılıyor`);
        vehicleInfo.yil = "";
      }
    }

    if (!isProduction) {
      console.log("[PDF] AI'dan çıkarılan araç bilgileri:", vehicleInfo);
    }

    // 3️⃣ Chat özetini oluştur (OpenRouter'a gönderilecek)
    const chatSummary = chatMessages
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join("\n\n");

    // 4️⃣ OpenRouter'a PDF raporu oluşturması için prompt gönder
    const vehicleInfoText = [
      vehicleInfo.marka ? `Marka: ${vehicleInfo.marka}` : "",
      vehicleInfo.model ? `Model: ${vehicleInfo.model}` : "",
      vehicleInfo.yil ? `Yıl: ${vehicleInfo.yil}` : "",
      vehicleInfo.km ? `Kilometre: ${vehicleInfo.km} km` : ""
    ].filter(Boolean).join(", ");

    // Rapor tipini belirle: 
    // - SADECE gerçek ses/video analizi varsa "Ses Analiz Raporu" 
    // - Görsel analizi veya sadece yazışma varsa "Yüzdelik Arıza Aksiyon Raporu"
    const reportType = hasMediaAnalysis ? "ses_analiz" : "yuzdelik_aksiyon";
    
    if (!isProduction) {
      console.log("[PDF] Rapor tipi belirlendi:", reportType, "hasMediaAnalysis:", hasMediaAnalysis);
    }
    
    // Rapor numarası oluştur
    const reportNumber = `NVU-${vehicleInfo.marka?.substring(0, 3).toUpperCase() || "GEN"}-${vehicleInfo.model?.substring(0, 3).toUpperCase() || "XXX"}-${reportType === "ses_analiz" ? "SES" : "YAP"}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;

    // İki farklı prompt: Ses Analiz veya Yüzdelik Aksiyon
    const pdfPrompt = reportType === "ses_analiz" 
      ? getSesAnalizPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary)
      : getYuzdelikAksiyonPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary);

    // OpenRouter ile PDF raporu oluştur (chat için kullanılan text-only model)
    const pdfModel = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model
    
    const pdfMessages = [
      {
        role: "user" as const,
        content: pdfPrompt,
      },
    ];

    if (!isProduction) {
      console.log("[PDF] OpenRouter'a PDF raporu oluşturma isteği gönderiliyor...");
    }
    const result = await callOpenRouter(pdfModel, pdfMessages, {
      max_tokens: 4000, // PDF raporları uzun olabilir
      temperature: 0.7,
      maxRetries: 5, // PDF için daha fazla retry (kritik)
    });
    
    let pdfMarkdown = result.content.trim();
    
    // YAZIM HATALARINI DÜZELT
    const spellingFixes: { [key: string]: string } = {
      "arika": "arıza",
      "teshis": "teşhis",
      "egzos": "egzoz",
      "egzozs": "egzoz",
      "kontol": "kontrol",
      "kontroll": "kontrol",
      "muayene": "muayene", // Doğru
      "muayane": "muayene",
      "Aşınanma": "Aşınma",
      "Aşınanması": "Aşınması",
      "Aşınanmasına": "Aşınmasına",
    };
    
    // Yaygın yazım hatalarını düzelt
    for (const [wrong, correct] of Object.entries(spellingFixes)) {
      // Kelime sınırları ile değiştir (tam kelime eşleşmesi)
      const regex = new RegExp(`\\b${wrong}\\b`, "gi");
      pdfMarkdown = pdfMarkdown.replace(regex, correct);
    }
    
    // Başlıkların sonundaki ** işaretlerini kaldır
    // Örnek: "## 7) Önceliklendirilmiş İş Listesi**" -> "## 7) Önceliklendirilmiş İş Listesi"
    pdfMarkdown = pdfMarkdown.replace(/(#{1,6}\s+[^\n]+)\*\*/g, '$1');

    // PDF markdown'dan özet çıkar (ilk 500 karakter)
    const analysisSummary = pdfMarkdown
      .replace(/#{1,6}\s+/g, "") // Başlıkları kaldır
      .replace(/\*\*/g, "") // Bold işaretlerini kaldır
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Linkleri kaldır
      .substring(0, 500)
      .trim();

    // PDF markdown'dan possible_causes ve recommended_actions çıkar
    const possibleCauses: string[] = [];
    const recommendedActions: string[] = [];
    
    // "Olası Kaynaklar" veya "Olasılıkların Gerekçeli Açıklaması" bölümünden nedenleri çıkar
    const causesMatch = pdfMarkdown.match(/(?:Olası Kaynaklar|Olasılıkların Gerekçeli Açıklaması|Olası arıza grubu)[\s\S]*?(?=##|$)/i);
    if (causesMatch) {
      const causesText = causesMatch[0];
      const causeItems = causesText.match(/\d+\.\s+([^\n]+)|###\s+([^\n]+)/g);
      if (causeItems) {
        causeItems.forEach((item: string) => {
          const cleanItem = item.replace(/^\d+\.\s+|^###\s+/, "").trim();
          if (cleanItem && cleanItem.length > 10) {
            possibleCauses.push(cleanItem);
          }
        });
      }
    }

    // "Önceliklendirilmiş İş Listesi" veya "Serviste Doğrulama" bölümünden aksiyonları çıkar
    const actionsMatch = pdfMarkdown.match(/(?:Önceliklendirilmiş İş Listesi|Serviste Doğrulama|Kullanıcının Kendi Başına Yapabileceği Kontroller)[\s\S]*?(?=##|$)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[0];
      const actionItems = actionsText.match(/\d+\.\s+([^\n]+)|-\s+([^\n]+)/g);
      if (actionItems) {
        actionItems.forEach((item: string) => {
          const cleanItem = item.replace(/^\d+\.\s+|^-\s+/, "").trim();
          if (cleanItem && cleanItem.length > 10) {
            recommendedActions.push(cleanItem);
          }
        });
      }
    }

    // Risk level'i belirle (PDF'de "Acil" veya "Yüksek" gibi kelimeler varsa)
    let riskLevel = "";
    const riskKeywords = {
      "yüksek": "high",
      "orta": "medium",
      "düşük": "low",
      "acil": "urgent"
    };
    const pdfLower = pdfMarkdown.toLowerCase();
    for (const [tr, en] of Object.entries(riskKeywords)) {
      if (pdfLower.includes(tr)) {
        riskLevel = en;
        break;
      }
    }

    // Used media types
    const usedMediaTypes: string[] = [];
    if (hasMediaAnalysis) {
      const mediaMessages = chatMessages.filter(msg => msg.hasMedia);
      mediaMessages.forEach(msg => {
        if (msg.mediaType === "video" && !usedMediaTypes.includes("video")) {
          usedMediaTypes.push("video");
        } else if (msg.mediaType === "image" && !usedMediaTypes.includes("image")) {
          usedMediaTypes.push("image");
        }
      });
    }

    // 4️⃣ Firestore'a PDF'i kaydet (tüm alanlarla)
    const reportRef = db.collection("reports").doc();
    await reportRef.set({
      // Temel bilgiler
      chat_id,
      user_id,
      report_id: reportNumber,
      report_type: reportType, // "ses_analiz" veya "yuzdelik_aksiyon"
      
      // PDF içeriği
      pdf_markdown: pdfMarkdown,
      pdf_url: "", // Şimdilik boş, sonra eklenebilir
      
      // Analiz özeti
      analysis_summary: analysisSummary || "",
      
      // Teşhis bilgileri
      possible_causes: possibleCauses.length > 0 ? possibleCauses : [],
      recommended_actions: recommendedActions.length > 0 ? recommendedActions : [],
      confidence_score: hasDiagnosis ? 0.7 : 0.5, // Teşhis varsa daha yüksek
      risk_level: riskLevel || "",
      
      // Maliyet (şimdilik 0, PDF'den çıkarılabilir)
      estimated_cost_min: 0,
      estimated_cost_max: 0,
      currency: "TRY",
      
      // Media bilgisi
      used_media_types: usedMediaTypes,
      
      // Araç bilgileri
      vehicle: {
        make: vehicleInfo.marka || "",
        model: vehicleInfo.model || "",
        year: vehicleInfo.yil ? parseInt(vehicleInfo.yil) || 0 : 0,
        mileage_km: vehicleInfo.km ? parseInt(vehicleInfo.km.replace(/\s/g, "")) || 0 : 0,
        fuel: "", // Chat'ten çıkarılabilir, şimdilik boş
        engine: "", // Chat'ten çıkarılabilir, şimdilik boş
        transmission: "", // Chat'ten çıkarılabilir, şimdilik boş
        vin: "", // Chat'ten çıkarılabilir, şimdilik boş
        plate_country: "", // Chat'ten çıkarılabilir, şimdilik boş
        detected_by_ai: true,
        confidence_score: vehicleInfo.marka && vehicleInfo.model ? 0.8 : 0.5,
        version: 1,
      },
      
      // Metadata
      generated_by: "xiaomi/mimo-v2-flash:free",
      is_final: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      pdf_generated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5️⃣ Markdown'ı HTML'e çevir
    const htmlContent = await marked(pdfMarkdown);
    
    // 6️⃣ Logo'yu base64'e çevir
    let logoBase64 = '';
    try {
      // Vercel'de process.cwd() kullan (LAMBDA_TASK_ROOT AWS için, Vercel'de yok)
      const rootPath = process.cwd();
      const logoPath = path.join(rootPath, 'public', 'logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.warn('[PDF] Logo yüklenemedi:', err);
    }
    
    // 6.5️⃣ Poppins font'ları için @font-face tanımları (Google Fonts CDN - woff2 formatı)
    // Bu yöntem Puppeteer ile daha güvenilir çalışır
    const fontFaces = `
        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2') format('woff2');
        }
        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2') format('woff2');
        }
        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2') format('woff2');
        }
        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2') format('woff2');
        }`;
    
    // 7️⃣ Logo'yu HTML'de değiştir
    const htmlWithLogo = logoBase64 
      ? htmlContent.replace(/src="\/logo\.jpeg"/g, `src="${logoBase64}"`)
      : htmlContent;
    
    // 8️⃣ HTML template oluştur (Test PDF'lerindeki gibi)
    const fullHTML = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NesiVarUsta PDF Raporu</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 25mm; /* üst-alt | sağ-sol */
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        ${fontFaces}
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            background: #fff;
        }
        
        /* ASIL PDF ALANI */
        .page {
            /* 👈 BUNU EKLE */
  padding-bottom: 10mm;
  padding-left: 20mm;
  padding-right: 20mm;
            width: 100%;
            box-sizing: border-box;
        }
        h1 {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 20px;
            border-bottom: 3px solid #f97316;
            padding-bottom: 10px;
            font-family: 'Poppins', sans-serif;
        }
        h2 {
            font-size: 18px;
            font-weight: 600;
            color: #f97316;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-top: 10px;
            font-family: 'Poppins', sans-serif;
        }
        h3 {
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 10px;
            color: #f97316;
            font-family: 'Poppins', sans-serif;
        }
        span[style*="color: #f97316"] {
            color: #f97316 !important;
            font-weight: 600;
        }
        p {
            margin-bottom: 12px;
            text-align: justify;
            line-height: 1.85;
            margin: 14px 0;
        }
        ul, ol {
            margin-left: 25px;
            margin-bottom: 15px;
            line-height: 1.9;
        }
        li {
            margin-bottom: 10px;
            line-height: 1.85;
        }
        strong {
            font-weight: bold;
            color: #f97316;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table th, table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        div[align="center"] {
            text-align: center !important;
            margin: 10px 0;
        }
        div[align="center"] h1 {
            margin: 10px 0;
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
            border: none;
            padding: 0;
        }
        div[align="center"] img {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        div[align="center"] h1:first-of-type {
            font-size: 24px;
            margin-bottom: 15px;
            color: #f97316;
            font-weight: 700;
            white-space: nowrap;
        }
        div[align="center"] p {
            font-weight: 600;
            font-size: 14px;
            margin: 5px 0;
        }
        div[align="center"] strong {
            font-weight: 700;
            color: #000;
        }
        p strong, strong {
            font-weight: 700 !important;
            color: #000 !important;
        }
        p {
            font-weight: 400;
        }
        h2 {
            margin-top: 36px;
            margin-bottom: 18px;
        }
        h3 {
            margin-top: 28px;
            margin-bottom: 14px;
        }
        h3 + ul,
        h3 + p {
            margin-top: 12px;
        }
        ul {
            margin-bottom: 18px;
        }
        h2 + p {
            margin-top: 12px;
        }
        p + h2 {
            margin-top: 40px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
        }
        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="page">
        ${htmlWithLogo}
    </div>
</body>
</html>
    `;
    
    // 9️⃣ HTML'i JSON olarak döndür (Frontend'de PDF'e çevrilecek - Puppeteer yok!)
    // Chromium sorunları nedeniyle client-side PDF generation kullanıyoruz
    if (!isProduction) {
      console.log('[PDF] HTML hazırlandı, frontend\'e gönderiliyor (client-side PDF generation)');
    }
    
    // HTML + metadata'yı JSON olarak döndür
    return NextResponse.json({
      html: fullHTML,
      reportNumber: reportNumber,
      vehicleInfo: vehicleInfo,
    });
  } catch (err: any) {
    console.error("PDF error:", err);
    return NextResponse.json(
      { error: err.message || "PDF oluşturulamadı" },
      { status: 500 }
    );
  }
}

