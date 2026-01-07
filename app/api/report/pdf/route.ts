import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { getRequiredEnv } from "@/lib/env-validation"

export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = getRequiredEnv("GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    const body = await req.json()
    const report_id = body?.report_id as string | undefined

    if (!report_id) {
      return NextResponse.json(
        { error: "report_id zorunlu" },
        { status: 400 }
      )
    }

    /* -------------------------------------------------
       1️⃣ Firestore’dan RAPOR ANALİZİNİ ÇEK
    ------------------------------------------------- */
    const reportRef = db.collection("reports").doc(report_id)
    const reportSnap = await reportRef.get()

    if (!reportSnap.exists) {
      return NextResponse.json(
        { error: "Rapor bulunamadı" },
        { status: 404 }
      )
    }

    const analysis = reportSnap.data()

    // 🔥 TS + runtime guard (senin aldığın hata BURADAN geliyordu)
    if (!analysis) {
      return NextResponse.json(
        { error: "Rapor verisi boş veya okunamadı" },
        { status: 500 }
      )
    }

    /* -------------------------------------------------
       2️⃣ PDF PROMPT (SENİN VERDİĞİN — DOKUNULMADI)
    ------------------------------------------------- */
    const pdfPrompt = `
Sen NesiVarUsta için çalışan profesyonel bir otomotiv teknik rapor uzmanısın.
Görevin: Kullanıcıdan gelen araç arızası verilerine dayanarak
RESMİ, PROFESYONEL ve NET bir TEKNİK PDF RAPORU üretmek.

━━━━━━━━━━━━━━━━━━
⚠️ GENEL KURALLAR
━━━━━━━━━━━━━━━━━━
- SADECE Markdown üret (PDF’e çevrilecek)
- Emoji YOK
- Chat dili YOK
- Kısa ama teknik anlatım
- Uydurma bilgi YOK
- Yüzdelik olasılıklar mantıklı olsun
- Kullanıcıyı korkutma ama riski gizleme
- Gereksiz tekrar YOK

━━━━━━━━━━━━━━━━━━
📄 RAPOR YAPISI (ZORUNLU)
━━━━━━━━━━━━━━━━━━

# NESİVARUSTA – ARAÇ ARIZA ANALİZ RAPORU

## 1. Araç ve İnceleme Bilgileri
- Araç Durumu: Kullanıcı beyanına dayalı analiz
- İnceleme Türü: Uzaktan yapay zeka destekli teknik analiz
- Veri Kaynağı: Metin / Ses / Video (mevcut olana göre belirt)

## 2. Tespit Edilen Ana Problem
Burada arızanın **en net ve tek cümlelik** teknik tanımını yap.
Karmaşık ifadeler kullanma.

## 3. Olası Arıza Nedenleri (Yüzdelik)
Aşağıdaki formatı KESİNLİKLE kullan:

- **Neden 1** – %XX  
  Kısa teknik açıklama

- **Neden 2** – %XX  
  Kısa teknik açıklama

- **Neden 3** – %XX  
  Kısa teknik açıklama

(Yüzdeler toplamı ≈ %100 olmalı)

## 4. Risk ve Kullanım Değerlendirmesi
- Aracın bu şekilde kullanılmasının kısa vadeli ve uzun vadeli risklerini açıkla
- Güvenlik, motor sağlığı ve maliyet açısından değerlendir
- Panik yaratmadan ama net uyarılarla yaz

## 5. Tahmini Onarım ve Maliyet Aralığı (Türkiye)
- Tahmini Parça + İşçilik Aralığı: **XXXX – XXXX TL**
- Maliyeti etkileyen faktörleri maddeler halinde açıkla
  (servis tipi, parça kalitesi, şehir vb.)

## 6. Önerilen Aksiyon Planı
1. İlk yapılması gereken kontrol / test
2. Gerekli servis veya uzmanlık seviyesi
3. Aciliyet durumu (düşük / orta / yüksek)

## 7. Sonuç ve Uzman Tavsiyesi
- Kullanıcıya net bir yol haritası ver
- “Şu aşamada şunu yapmanız önerilir” şeklinde bitir
- Gerekirse ustaya yönlendirme tavsiyesi ekle

━━━━━━━━━━━━━━━━━━
📥 GİRİŞ VERİLERİ
━━━━━━━━━━━━━━━━━━

Araç Arıza Özeti:
${analysis.chat_summary ?? "Bilgi yok"}

Arıza Şiddeti:
${analysis.severity ?? "belirtilmemiş"}

Olası Nedenler:
${JSON.stringify(analysis.possible_causes ?? [], null, 2)}

Tahmini Maliyet:
${analysis.estimated_cost_range_try ?? "belirtilmemiş"}

Risk Değerlendirmesi:
${analysis.risk_assessment ?? "belirtilmemiş"}

━━━━━━━━━━━━━━━━━━
ÇIKIŞ:
Yukarıdaki kurallara birebir uyan,
PDF’e hazır, profesyonel bir teknik rapor üret.
`.trim()

    /* -------------------------------------------------
       3️⃣ GEMINI → PDF MARKDOWN ÜRET
    ------------------------------------------------- */
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    })

    const result = await model.generateContent(pdfPrompt)
    const pdfMarkdown = result.response.text().trim()

    /* -------------------------------------------------
       4️⃣ Firestore’a PDF’i KAYDET
    ------------------------------------------------- */
    await reportRef.update({
      pdf_markdown: pdfMarkdown,
      pdf_generated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    /* -------------------------------------------------
       5️⃣ RESPONSE
    ------------------------------------------------- */
    return NextResponse.json({
      success: true,
      report_id,
      pdf_markdown: pdfMarkdown,
    })
  } catch (err) {
    console.error("PDF error:", err)
    return NextResponse.json(
      { error: "PDF oluşturulamadı" },
      { status: 500 }
    )
  }
}
