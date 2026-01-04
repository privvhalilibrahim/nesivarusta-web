import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"
import fs from "fs"
import path from "path"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file = formData.get("file") as File
    const mediaType = formData.get("media_type") as "image" | "video"
    const user_id = formData.get("user_id") as string
    const chat_id = formData.get("chat_id") as string

    if (!file || !mediaType || !user_id) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 })
    }

    // 🔹 geçici kaydet
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = path.join("/tmp", `${Date.now()}-${file.name}`)
    fs.writeFileSync(tempPath, buffer)

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt =
      mediaType === "video"
        ? `
Sen profesyonel bir otomotiv teşhis uzmanısın.
Bir ARAÇ VİDEOSU izledin.

Şunlara odaklan:
- Anormal sesler
- Titreşim
- Kalkış / rölanti / hızlanma
- Görsel anormallikler

Sadece teknik teşhis yaz.
Kısa ve net.
`
        : `
Sen profesyonel bir otomotiv teşhis uzmanısın.
Bir ARAÇ FOTOĞRAFI inceledin.

Şunlara bak:
- Görsel hasar
- Sızıntı
- Aşınma
- Kırık / gevşek parça

Sadece teknik teşhis yaz.
Kısa ve net.
`

    const res = await model.generateContent(prompt)
    const analysisText = res.response.text()

    // 🔥 DB'ye SADECE TESPİT
    await db.collection("reports").add({
      chat_id,
      user_id,
      source: mediaType,
      analysis_summary: analysisText,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    // 🔥 medya sil
    fs.unlinkSync(tempPath)

    return NextResponse.json({
      success: true,
      content: analysisText,
    })
  } catch (err) {
    console.error("Analyze media error:", err)
  
    return NextResponse.json(
      {
        success: false,
        message: "Analiz sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
      },
      { status: 500 }
    )
  }
  
}
