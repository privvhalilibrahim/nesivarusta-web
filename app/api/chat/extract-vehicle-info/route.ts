import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "../../lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessages = body?.userMessages as string[] | undefined;

    if (!userMessages || !Array.isArray(userMessages)) {
      return NextResponse.json(
        { error: "userMessages array zorunlu" },
        { status: 400 }
      );
    }

    // Tüm kullanıcı mesajlarını birleştir
    const allUserMessages = userMessages.join(" ");

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
${allUserMessages}

JSON (sadece bu formatı döndür):
{
  "marka": "",
  "model": "",
  "yil": "",
  "km": ""
}`;

    const model = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model
    
    const messages = [
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    console.log("[ExtractVehicleInfo] AI model'e istek gönderiliyor...");
    const result = await callOpenRouter(model, messages, {
      max_tokens: 200,
      temperature: 0.3, // Düşük temperature - daha tutarlı JSON çıktısı için
    });
    
    let responseText = result.content.trim();
    
    // JSON'u parse et
    // Model bazen JSON dışında ekstra metin ekleyebilir, sadece JSON kısmını al
    let vehicleInfo = {
      marka: "",
      model: "",
      yil: "",
      km: ""
    };

    try {
      // JSON bloğunu bul (```json ... ``` veya sadece { ... })
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
      console.error("[ExtractVehicleInfo] JSON parse hatası:", parseError);
      console.error("[ExtractVehicleInfo] Model response:", responseText);
      // Parse hatası olsa bile boş obje döndür (hata fırlatma)
    }

    // 1985'ten önceki ve gelecek yılları kontrol et ve boş bırak
    if (vehicleInfo.yil) {
      const yilNum = parseInt(vehicleInfo.yil);
      const currentYear = new Date().getFullYear();
      if (!isNaN(yilNum) && (yilNum < 1985 || yilNum > currentYear)) {
        console.log(`[ExtractVehicleInfo] Geçersiz yıl tespit edildi: ${yilNum} (1985-${currentYear} arası olmalı), boş bırakılıyor`);
        vehicleInfo.yil = "";
      }
    }

    console.log("[ExtractVehicleInfo] Çıkarılan bilgiler:", vehicleInfo);

    return NextResponse.json(vehicleInfo);
  } catch (err: any) {
    console.error("[ExtractVehicleInfo] Hata:", err);
    return NextResponse.json(
      { error: err.message || "Araç bilgileri çıkarılamadı" },
      { status: 500 }
    );
  }
}
