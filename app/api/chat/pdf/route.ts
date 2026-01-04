import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { getSesAnalizPrompt, getYuzdelikAksiyonPrompt } from "./prompts";
import { callOpenRouter } from "../../lib/openrouter";
import { marked } from "marked";
// Vercel serverless için puppeteer-core kullan (Chrome binary dahil değil)
// Local'de normal puppeteer, production'da puppeteer-core + chromium
let puppeteer: any;
let chromium: any;

if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  // Production: puppeteer-core + chromium
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium-min");
} else {
  // Local: normal puppeteer (Chrome dahil)
  puppeteer = require("puppeteer");
}
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat_id = body?.chat_id as string | undefined;
    const user_id = body?.user_id as string | undefined;

    console.log("[PDF] Request body:", { chat_id, user_id });

    if (!chat_id || !user_id) {
      return NextResponse.json(
        { error: "chat_id ve user_id zorunlu" },
        { status: 400 }
      );
    }

    // 1️⃣ Chat mesajlarını çek (soft delete'li mesajları atla)
    console.log("[PDF] Firestore sorgusu başlatılıyor...");
    // NOT: Firestore'da deleted field'ı undefined olan mesajlar != true sorgusu ile gelmiyor
    // Bu yüzden önce tüm mesajları çekip sonra filtreleyeceğiz
    const messagesSnap = await db
      .collection("messages")
      .where("chat_id", "==", chat_id)
      .where("user_id", "==", user_id)
      .orderBy("created_at", "asc")
      .get();

    console.log("[PDF] Firestore'dan dönen mesaj sayısı:", messagesSnap.docs.length);
    console.log("[PDF] messagesSnap.empty:", messagesSnap.empty);
    
    // İlk 3 mesajın detaylarını logla
    if (messagesSnap.docs.length > 0) {
      console.log("[PDF] İlk 3 mesaj örneği:");
      messagesSnap.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`[PDF] Mesaj ${index + 1}:`, {
          id: doc.id,
          sender: data.sender,
          content: data.content?.substring(0, 50) + "...",
          has_media: data.has_media,
          media_type: data.media_type,
          deleted: data.deleted,
          created_at: data.created_at?.toDate(),
        });
      });
    } else {
      console.log("[PDF] HİÇ MESAJ BULUNAMADI!");
      // Alternatif sorgu: deleted filtresi olmadan
      const allMessagesSnap = await db
        .collection("messages")
        .where("chat_id", "==", chat_id)
        .where("user_id", "==", user_id)
        .orderBy("created_at", "asc")
        .get();
      console.log("[PDF] (deleted filtresi olmadan) Toplam mesaj sayısı:", allMessagesSnap.docs.length);
      if (allMessagesSnap.docs.length > 0) {
        console.log("[PDF] İlk mesajın deleted durumu:", allMessagesSnap.docs[0].data().deleted);
      }
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

    console.log("[PDF] Filtreleme sonrası chatMessages.length:", chatMessages.length);
    console.log("[PDF] User mesajları:", chatMessages.filter(m => m.isUser).length);
    console.log("[PDF] AI mesajları:", chatMessages.filter(m => !m.isUser).length);

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

    // 2️⃣ Chat mesajlarından araç bilgilerini çıkar (Marka, Model, Yıl, KM)
    const allUserMessages = userMessages.map(msg => msg.content).join(" ");
    const vehicleInfo = {
      marka: "",
      model: "",
      yil: "",
      km: ""
    };

    // Bilinen marka listesi (yaygın markalar)
    const knownBrands = [
      "bmw", "mercedes", "audi", "volkswagen", "vw", "ford", "opel", 
      "renault", "peugeot", "citroen", "fiat", "toyota", "honda", 
      "nissan", "hyundai", "kia", "skoda", "seat", "volvo", "mazda",
      "suzuki", "mitsubishi", "subaru", "lexus", "infiniti", "porsche",
      "jaguar", "land rover", "range rover", "mini", "smart", "dacia",
      "lada", "togg", "tesla", "chevrolet", "dodge", "jeep", "chrysler"
    ];

    // 1. Önce bilinen markaları ara (cümle içinde geçebilir: "benim bi bmw var", "bmw var", "bir mercedes")
    for (const brand of knownBrands) {
      const brandRegex = new RegExp(`(?:^|\\s)(?:bir|bi|bir\\s+)?${brand}(?:\\s|$|var|var\\s)`, "i");
      if (brandRegex.test(allUserMessages) && !vehicleInfo.marka) {
        vehicleInfo.marka = brand.toUpperCase();
        break;
      }
    }

    // 2. Backend'deki regex'lerle aynı (marka: BMW gibi formatlar için)
    const markaMatch = allUserMessages.match(/(?:marka|araç|araba)\s*(?:nedir|ne|hangi|:)?\s*([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)*)/i);
    const modelMatch = allUserMessages.match(/(?:model|tip)\s*(?:nedir|ne|hangi|:)?\s*([A-ZÇĞİÖŞÜ0-9][a-zçğıöşü0-9]+(?:\s+[A-ZÇĞİÖŞÜ0-9][a-zçğıöşü0-9]+)*)/i);
    const yilMatch = allUserMessages.match(/(?:yıl|yil|üretim)\s*(?:nedir|ne|hangi|:)?\s*(\d{4})/i);
    const kmMatch = allUserMessages.match(/(?:km|kilometre|kilometra)\s*(?:nedir|ne|kaç|:)?\s*(\d+(?:\s*\d{3})*)/i);

    if (markaMatch && !vehicleInfo.marka) vehicleInfo.marka = markaMatch[1].trim();
    if (modelMatch) vehicleInfo.model = modelMatch[1].trim();
    if (yilMatch) vehicleInfo.yil = yilMatch[1].trim();
    if (kmMatch) vehicleInfo.km = kmMatch[1].replace(/\s/g, "");

    // 3. Eğer direkt "AUDI A1 2024" gibi bir format varsa çıkar
    const fullVehicleMatch = allUserMessages.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ0-9][a-zçğıöşü0-9]+)+)\s+(\d{4})/i);
    if (fullVehicleMatch && !vehicleInfo.marka) {
      const parts = fullVehicleMatch[1].split(/\s+/);
      vehicleInfo.marka = parts[0];
      vehicleInfo.model = parts.slice(1).join(" ");
      vehicleInfo.yil = fullVehicleMatch[2];
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
    
    console.log("[PDF] Rapor tipi belirlendi:", reportType, "hasMediaAnalysis:", hasMediaAnalysis);
    
    // Rapor numarası oluştur
    const reportNumber = `NVU-${vehicleInfo.marka?.substring(0, 3).toUpperCase() || "GEN"}-${vehicleInfo.model?.substring(0, 3).toUpperCase() || "XXX"}-${reportType === "ses_analiz" ? "SES" : "YAP"}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;

    // İki farklı prompt: Ses Analiz veya Yüzdelik Aksiyon
    const pdfPrompt = reportType === "ses_analiz" 
      ? getSesAnalizPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary)
      : getYuzdelikAksiyonPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary);

    // OpenRouter ile PDF raporu oluştur (chat için kullanılan text-only model)
    const model = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model
    
    const messages = [
      {
        role: "user" as const,
        content: pdfPrompt,
      },
    ];

    console.log("[PDF] OpenRouter'a PDF raporu oluşturma isteği gönderiliyor...");
    const result = await callOpenRouter(model, messages, {
      max_tokens: 4000, // PDF raporları uzun olabilir
      temperature: 0.7,
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
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpeg');
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
            margin: 10mm 20mm; /* üst-alt: 10mm, sağ-sol: 20mm */
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        ${fontFaces}
        
        body {
            font-family: 'Poppins', 'Arial', 'Helvetica', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 10mm 20mm; /* üst-alt: 10mm, sağ-sol: 20mm */
            max-width: 210mm;
            margin: 0 auto;
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
    ${htmlWithLogo}
</body>
</html>
    `;
    
    // 9️⃣ Puppeteer ile PDF oluştur (Test PDF'lerindeki gibi)
    console.log('[PDF] Puppeteer ile PDF oluşturuluyor...');
    
    // Vercel serverless için Chrome binary path'ini ayarla
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    let browser;
    if (isProduction && chromium) {
      // Production: puppeteer-core + chromium-min (Vercel serverless için)
      const executablePath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath,
        headless: chromium.headless,
      });
    } else {
      // Local: normal puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    const page = await browser.newPage();
    
    // Font'ların yüklenmesi için sayfayı set et ve bekle
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    
    // Font'ların tam yüklenmesi için ek bekleme (Poppins için)
    await page.evaluateHandle(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms ek bekleme
    
    // PDF'i buffer olarak oluştur
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '20mm',
        bottom: '10mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    console.log('[PDF] PDF başarıyla oluşturuldu, boyut:', pdfBuffer.length, 'bytes');
    
    // 🔟 PDF'i response olarak döndür
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NesiVarUsta-Rapor-${reportNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("PDF error:", err);
    return NextResponse.json(
      { error: err.message || "PDF oluşturulamadı" },
      { status: 500 }
    );
  }
}

