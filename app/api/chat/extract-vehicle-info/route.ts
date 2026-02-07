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

KRİTİK KURALLAR:
- SADECE kullanıcının AÇIKÇA yazdığı bilgileri çıkar
- TAHMİN YAPMA, KENDİ BİLGİNİ KULLANMA
- Kullanıcı sadece "audi" dediyse, model alanını BOŞ BIRAK (A6, A4, A8 gibi tahmin yapma)
- Kullanıcı sadece "bmw" dediyse, model alanını BOŞ BIRAK (3 Serisi, 5 Serisi gibi tahmin yapma)
- Kullanıcı "audi yokus kalkis" dediyse, model alanını BOŞ BIRAK (A6 tahmin etme)
- Emin değilsen veya kullanıcı belirtmemişse alanı BOŞ BIRAK

TALİMATLAR:
- MARKA: Araç üreticisi (Audi, BMW, Mercedes, Hyundai, Toyota, vb.) - SADECE kullanıcının yazdığı marka
- MODEL: Markaya ait model adı/numarası (A4, A6, 3 Serisi, C200, i10, Corolla, vb.) - SADECE kullanıcının yazdığı model
- YIL: Araç üretim yılı - Kullanıcının yazdığı 4 haneli yıl (ör. 1972, 2015). Belirtmemişse boş bırak.
- KM: Araç kilometresi (50000, 120000, vb.) - Sadece sayı, "km" yazma

ÖNEMLİ:
- Bilgiler dağınık olabilir, tüm mesajları dikkatlice oku
- "hyundai gec duruyo" → {"marka": "Hyundai", "model": "", "yil": "", "km": ""} (model yok, boş bırak)
- "audi yokus kalkis" → {"marka": "Audi", "model": "", "yil": "", "km": ""} (model yok, A6 tahmin etme)
- "2018 model", "1972 yılında üretilmiş", "2020'de aldım" gibi ifadelerde yıl var; çıkar.
- SADECE JSON döndür, başka açıklama yapma

ÖRNEKLER:
"audi yokus kalsik" → {"marka": "Audi", "model": "", "yil": "", "km": ""} (model belirtilmemiş, boş)
"audi a6 virajda titreme" → {"marka": "Audi", "model": "A6", "yil": "", "km": ""} (model açıkça belirtilmiş)
"bmw 320d 2015 150000 km" → {"marka": "BMW", "model": "320d", "yil": "2015", "km": "150000"}
"hyundai gec duruyo" → {"marka": "Hyundai", "model": "", "yil": "", "km": ""} (model belirtilmemiş)

Kullanıcı mesajları:
${allUserMessages}

JSON (sadece bu formatı döndür):
{
  "marka": "",
  "model": "",
  "yil": "",
  "km": ""
}`;

    const model = "arcee-ai/trinity-large-preview:free"; // Chat ile aynı model
    
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
