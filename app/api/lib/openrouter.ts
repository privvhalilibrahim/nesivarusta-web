/**
 * OpenRouter API Helper
 * Handles both text-only and multimodal (image/video) requests
 */

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ 
    type: "text" | "image_url" | "video_url"; 
    text?: string; 
    image_url?: { url: string };
    video_url?: { url: string };
  }>;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string; // "stop", "length", "content_filter", etc.
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * OpenRouter API çağrısı yapar
 */
export async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  options?: {
    max_tokens?: number;
    temperature?: number;
  }
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number }; finish_reason?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  const requestBody: OpenRouterRequest = {
    model,
    messages,
    max_tokens: options?.max_tokens || 1200,
    temperature: options?.temperature || 0.7,
  };

  // Video veya görsel analizi için timeout artır (büyük dosyalar ve uzun analizler için)
  const hasVideo = JSON.stringify(requestBody).includes("video/");
  const hasImage = JSON.stringify(requestBody).includes("image/");
  const timeout = hasVideo ? 120000 : (hasImage ? 60000 : 30000); // Video: 120s, Görsel: 60s, Text: 30s

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://nesivarusta.com",
      "X-Title": "NesiVarUsta",
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OpenRouter] API Error for model ${model}:`, errorText.substring(0, 500));
    
    // Cloudflare HTML hatası mı kontrol et
    if (errorText.includes("Cloudflare") || errorText.includes("<!DOCTYPE html>")) {
      throw new Error(`OpenRouter servisi geçici olarak kullanılamıyor (Cloudflare koruması). Lütfen birkaç saniye sonra tekrar deneyin.`);
    }
    
    // JSON hatası mı kontrol et
    let errorMessage = `OpenRouter API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
        
        // Provider hatası için özel mesaj
        if (errorMessage === "Provider returned error" && errorJson.error?.metadata?.provider_name) {
          const provider = errorJson.error.metadata.provider_name;
          // Video veya görsel için genel mesaj
          errorMessage = `Medya analizi şu anda kullanılamıyor (${provider} provider hatası). Lütfen birkaç dakika sonra tekrar deneyin.`;
        }
      }
    } catch {
      // JSON değilse, ilk 200 karakteri al
      errorMessage = errorText.substring(0, 200);
    }
    
    console.error(`[OpenRouter] Request body:`, JSON.stringify(requestBody, null, 2).substring(0, 500));
    throw new Error(errorMessage);
  }

  const data: OpenRouterResponse = await response.json();
  
  // Debug: Response'un tamamını logla
  console.log(`[OpenRouter] Full response:`, JSON.stringify(data, null, 2).substring(0, 1000));
  
  if (!data.choices || data.choices.length === 0) {
    console.error(`[OpenRouter] No choices in response:`, JSON.stringify(data, null, 2));
    throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - choices yok");
  }

  const choice = data.choices[0];
  const content = choice.message.content;
  const finishReason = choice.finish_reason;
  
  if (!content) {
    console.error(`[OpenRouter] Empty content in response:`, JSON.stringify(data, null, 2));
    throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - content boş");
  }
  
  // Eğer finish_reason "length" ise, response token limiti nedeniyle kesilmiş demektir
  if (finishReason === "length") {
    console.warn(`[OpenRouter] Response was truncated due to token limit. Content length: ${content.length}, tokens used: ${data.usage?.completion_tokens || 'N/A'}`);
    // Kullanıcıya uyarı mesajı ekle (opsiyonel)
    // content += "\n\n[Not: Cevap token limiti nedeniyle kısaltılmış olabilir]";
  }

  // Content'i temizle: Mistral ve diğer modellerden gelen özel token'ları kaldır
  let cleanedContent = content.trim();
  
  // YAZIM HATALARINI DÜZELT
  const spellingFixes: { [key: string]: string } = {
    "arika": "arıza",
    "teshis": "teşhis",
    "egzos": "egzoz",
    "egzozs": "egzoz",
    "turbocharger": "turbocharger", // İngilizce kelime, değiştirme
    "manifold": "manifold", // İngilizce kelime, değiştirme
  };
  
  // Yaygın yazım hatalarını düzelt
  for (const [wrong, correct] of Object.entries(spellingFixes)) {
    // Kelime sınırları ile değiştir (tam kelime eşleşmesi)
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    cleanedContent = cleanedContent.replace(regex, correct);
  }
  
  // Mistral ve diğer modellerden gelen özel token'ları temizle
  cleanedContent = cleanedContent
    .replace(/\[\/INST\]/gi, '') // Mistral instruct token
    .replace(/\[INST\]/gi, '') // Mistral instruct start token
    .replace(/<s>/gi, '') // Start token
    .replace(/<\/s>/gi, '') // End token
    .replace(/<\|im_start\|>/gi, '') // ChatML start
    .replace(/<\|im_end\|>/gi, '') // ChatML end
    .replace(/### Instruction:/gi, '') // Instruction marker
    .replace(/### Response:/gi, '') // Response marker
    .replace(/Kullanıcı:\s*["']?.*?["']?\s*$/gm, '') // Kullanıcı mesajını tekrar ediyorsa kaldır (tırnak içinde olabilir)
    .replace(/User:\s*["']?.*?["']?\s*$/gm, '') // İngilizce "User:" tekrarı
    .replace(/\n{3,}/g, '\n\n') // Çoklu boş satırları temizle
    .trim();
  
  if (cleanedContent.length === 0) {
    console.error(`[OpenRouter] Content is only whitespace after cleaning:`, JSON.stringify(data, null, 2));
    throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - content sadece boşluk");
  }

  console.log(`[OpenRouter] Success - content length: ${cleanedContent.length}, finish_reason: ${finishReason}, preview: ${cleanedContent.substring(0, 100)}`);

  return {
    content: cleanedContent,
    usage: data.usage,
    finish_reason: finishReason,
  };
}

/**
 * Gemini history formatını OpenRouter formatına çevirir
 */
export function convertHistoryToOpenRouter(
  history: Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: any }> }>
): OpenRouterMessage[] {
  const messages: OpenRouterMessage[] = [];

  for (const item of history) {
    const openRouterRole = item.role === "model" ? "assistant" : "user";
    
    // Parts'ı birleştir
    const textParts: string[] = [];
    const mediaParts: Array<{ 
      type: "image_url" | "video_url"; 
      image_url?: { url: string };
      video_url?: { url: string };
    }> = [];

    for (const part of item.parts) {
      if (part.text) {
        textParts.push(part.text);
      } else if (part.inlineData) {
        // Base64 image/video'yu data URL'ye çevir
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        // OpenRouter multimodal modelleri video için de image_url kullanıyor
        mediaParts.push({
          type: "image_url",
          image_url: { url: dataUrl },
        });
      }
    }

    // Text ve media'ları birleştir
    if (mediaParts.length > 0) {
      // Multimodal message
      const content: Array<{ 
        type: "text" | "image_url" | "video_url"; 
        text?: string; 
        image_url?: { url: string };
        video_url?: { url: string };
      }> = [];
      
      if (textParts.length > 0) {
        content.push({ type: "text", text: textParts.join(" ") });
      }
      
      content.push(...mediaParts);
      
      messages.push({
        role: openRouterRole,
        content,
      });
    } else if (textParts.length > 0) {
      // Text-only message
      messages.push({
        role: openRouterRole,
        content: textParts.join(" "),
      });
    }
  }

  return messages;
}

/**
 * Yeni mesajı OpenRouter formatına çevirir (text + optional media)
 */
export function createOpenRouterMessage(
  text?: string,
  mediaBase64?: string,
  mediaMimeType?: string
): OpenRouterMessage {
  if (mediaBase64 && mediaMimeType) {
    // Multimodal message
    const dataUrl = `data:${mediaMimeType};base64,${mediaBase64}`;
    const isVideo = mediaMimeType.startsWith("video/");
    
    const content: Array<{ 
      type: "text" | "image_url" | "video_url"; 
      text?: string; 
      image_url?: { url: string };
      video_url?: { url: string };
    }> = [];
    
    if (text) {
      content.push({ type: "text", text });
    }
    
    // OpenRouter multimodal modelleri video için de image_url kullanıyor
    // video_url desteklenmiyor, bu yüzden image_url kullanıyoruz
    content.push({
      type: "image_url",
      image_url: { url: dataUrl },
    });
    
    return {
      role: "user",
      content,
    };
  } else {
    // Text-only message
    return {
      role: "user",
      content: text || "",
    };
  }
}

/**
 * Model seçimi: Video varsa Nemotron, yoksa Qwen
 * Fallback modeller: Eğer bir model çalışmazsa alternatifler
 */
export function selectModel(hasVideo: boolean, hasImage: boolean = false, hasAudio: boolean = false): string {
  if (hasVideo || hasAudio) {
    // Video veya ses için Nemotron 12B VL (multimodal, video/ses destekli)
    return "nvidia/nemotron-nano-12b-v2-vl:free";
  } else if (hasImage) {
    // Görsel için Nemotron 12B VL (multimodal)
    return "nvidia/nemotron-nano-12b-v2-vl:free";
  } else {
    // Text-only chat için Mimo V2 Flash (Türkçe için iyi, reasoning destekli)
    return "xiaomi/mimo-v2-flash:free";
  }
}

/**
 * Alternatif model listesi (fallback için)
 */
export function getFallbackModels(hasVideo: boolean, hasImage: boolean = false, hasAudio: boolean = false): string[] {
  if (hasVideo || hasAudio) {
    return [
      "qwen/qwen-2.5-vl-7b-instruct:free", // Fallback (Qwen video/ses destekli)
      // Video/ses için alternatifler
    ];
  } else if (hasImage) {
    return [
      "qwen/qwen-2.5-vl-7b-instruct:free", // Fallback (Qwen görsel destekli)
      // Görsel için alternatifler
    ];
  } else {
    return [
      "xiaomi/mimo-v2-flash:free", // Öncelikli (Türkçe iyi, reasoning destekli)
      "mistralai/devstral-2512:free", // Fallback (Yeni Mistral modeli)
      "qwen/qwen-2.5-7b-instruct:free", // Fallback 2
    ];
  }
}

