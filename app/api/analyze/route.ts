import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import { getRequiredEnv } from "@/lib/env-validation"

function clean(text: string) {
  return text.replace(/```[\s\S]*?```/g, "").trim()
}

export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = getRequiredEnv("GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    const { message, user_id, chat_id } = await req.json()

    if (!message || !user_id) {
      return NextResponse.json(
        { error: "message ve user_id zorunlu" },
        { status: 400 }
      )
    }

    const finalChatId = chat_id ?? Date.now().toString()
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    /* ================================
       1️⃣ USER MESSAGE → DB
    ================================= */
    await db.collection("messages").add({
      chat_id: finalChatId,
      user_id,
      sender: "user",
      content: message,
      content_type: "text",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    /* ================================
       2️⃣ TEK PROMPT (USTA MODU)
    ================================= */
    const chatPrompt = `
Sen NesiVarUsta adlı deneyimli bir oto ustasısın.
Amacın sohbet etmek DEĞİL, arıza tespiti yapmaktır.

DAVRANIŞ:
- Net, ciddi ve usta gibi konuş
- Gereksiz selam, laf kalabalığı YOK
- Kısa ve net cümleler kullan
- Aynı bilgiyi tekrar tekrar isteme

ÇALIŞMA ŞEKLİ:
1) Kullanıcının verdiği bilgileri değerlendir
2) Eksik ama KRİTİK bilgileri TEK MESAJDA sor
3) Gereksiz bilgi isteme
4) Bilgi yeterliyse olası nedenleri ve çözüm yolunu söyle

BİLGİ TOPLAMA:
- Marka / Model / Yıl analiz icin gerekli ise sor
- Soruna göre sor:
  - Mekanik → ses ne zaman, nerede, sıcak/soğuk
  - Elektrik → uyarı ışığı, sürekli mi arada mı
  - Donanım → çalışmıyor mu zayıf mı

SORU KURALI:
- Soruların başında numara yaz. Örnek: 1. Soru: ...
- En fazla 3–4 kısa soru
- Tek mesajda sor

MEDYA:
- Yazıyla netleşmezse şöyle de:
  “İstersen kısa bir video ya da ses kaydı gönder, çok yardımcı olur.”

ASLA:
- “dinliyorum”
- “ön analiz yok gibi”
- “hadi bakalım”
deme.

Kullanıcı mesajı:
"${message}"
`

    const aiRes = await model.generateContent(chatPrompt)
    const aiText = clean(aiRes.response.text())

    /* ================================
       3️⃣ AI MESSAGE → DB
    ================================= */
    await db.collection("messages").add({
      chat_id: finalChatId,
      user_id,
      sender: "ai",
      content: aiText,
      content_type: "text",
      ai_model: "gemini-2.5-flash",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    /* ================================
       4️⃣ CHAT SNAPSHOT
    ================================= */
    await db.collection("chats").doc(finalChatId).set(
      {
        chat_id: finalChatId,
        user_id,
        status: "active",
        last_message: aiText,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    /* ================================
       5️⃣ RESPONSE
    ================================= */
    return NextResponse.json({
      chat_id: finalChatId,
      content: aiText,
    })
  } catch (err) {
    console.error("Chat error:", err)
    return NextResponse.json(
      { error: "Bir hata oluştu, lütfen tekrar deneyin." },
      { status: 500 }
    )
  }
}
