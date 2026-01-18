/**
 * OpenRouter API Helper
 * Handles both text-only and multimodal (image/video) requests
 */

import { logger } from "@/lib/logger";

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
 * OpenRouter API çağrısı yapar (Retry mekanizması ile)
 */
export async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  options?: {
    max_tokens?: number;
    temperature?: number;
    maxRetries?: number; // Retry sayısı (default: 3)
  }
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number }; finish_reason?: string }> {
  // API key validation (güvenli)
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }
  
  if (apiKey.length < 10) {
    throw new Error("OPENROUTER_API_KEY appears to be invalid (too short)");
  }

  const requestBody: OpenRouterRequest = {
    model,
    messages,
    max_tokens: options?.max_tokens || 1200,
    temperature: options?.temperature || 0.7,
  };

  // Text-only için timeout (medya upload kaldırıldı)
  const timeout = 25000; // Text: 25s (Vercel 60s için buffer)

  // Retry sayısı
  const maxRetries = options?.maxRetries || 3;
  let lastError: Error | null = null;

  // Retry mekanizması (exponential backoff)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
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

      if (response.ok) {
        // Başarılı, devam et
        const data: OpenRouterResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - choices yok");
        }

        const choice = data.choices[0];
        const content = choice.message.content;
        const finishReason = choice.finish_reason;
        
        if (!content) {
          throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - content boş");
        }

        // Eğer finish_reason "length" ise, response token limiti nedeniyle kesilmiş demektir
        if (finishReason === "length") {
          logger.warn('OpenRouter response truncated due to token limit', { 
            content_length: content.length, 
            tokens_used: data.usage?.completion_tokens || 'N/A' 
          });
        }

        // Content'i temizle
        let cleanedContent = content.trim();
        
        // YAZIM HATALARINI DÜZELT
        const spellingFixes: { [key: string]: string } = {
          "arika": "arıza",
          "teshis": "teşhis",
          "egzos": "egzoz",
          "egzozs": "egzoz",
          "turbocharger": "turbocharger",
          "manifold": "manifold",
        };
        
        for (const [wrong, correct] of Object.entries(spellingFixes)) {
          const regex = new RegExp(`\\b${wrong}\\b`, "gi");
          cleanedContent = cleanedContent.replace(regex, correct);
        }
        
        // Özel token'ları temizle
        cleanedContent = cleanedContent
          .replace(/\[\/INST\]/gi, '')
          .replace(/\[INST\]/gi, '')
          .replace(/<s>/gi, '')
          .replace(/<\/s>/gi, '')
          .replace(/<\|im_start\|>/gi, '')
          .replace(/<\|im_end\|>/gi, '')
          .replace(/### Instruction:/gi, '')
          .replace(/### Response:/gi, '')
          .replace(/Kullanıcı:\s*["']?.*?["']?\s*$/gm, '')
          .replace(/User:\s*["']?.*?["']?\s*$/gm, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (cleanedContent.length === 0) {
          throw new Error("OpenRouter API'den geçerli bir cevap alınamadı - content sadece boşluk");
        }

        if (attempt > 0) {
          logger.info('OpenRouter success after retries', { attempts: attempt + 1 });
        }

        return {
          content: cleanedContent,
          usage: data.usage,
          finish_reason: finishReason,
        };
      }

      // Response başarısız, hata kontrolü yap
      const errorText = await response.text();
      
      // Rate limit (429) veya server error (5xx) ise retry yap
      const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600);
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        // Retry yapılmayacak veya son deneme, hata fırlat
        logger.error('OpenRouter API Error', new Error(errorText.substring(0, 500)), { model });
        
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
              errorMessage = `Medya analizi şu anda kullanılamıyor (${provider} provider hatası). Lütfen birkaç dakika sonra tekrar deneyin.`;
            }
          }
        } catch {
          errorMessage = errorText.substring(0, 200);
        }
        
        throw new Error(errorMessage);
      }

      // Retry yapılacak - exponential backoff (text-only)
      const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Text için max 10 saniye
      logger.warn('OpenRouter retry', { attempt: attempt + 1, maxRetries, retryDelay, status: response.status });
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
    } catch (err: any) {
      lastError = err;
      
      // Abort hatası veya network hatası ise retry yap
      if (err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        if (attempt < maxRetries - 1) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Text için max 10 saniye
          logger.warn('OpenRouter network error, retrying', { attempt: attempt + 1, maxRetries, retryDelay });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Son deneme değilse ve retry yapılabilir hata ise devam et
      if (attempt < maxRetries - 1) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Text için max 10 saniye
        logger.warn('OpenRouter error, retrying', { attempt: attempt + 1, maxRetries, retryDelay, error: err.message });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Son deneme veya retry yapılamaz hata
      throw err;
    }
  }

  // Tüm denemeler başarısız
  throw lastError || new Error("OpenRouter API çağrısı başarısız oldu");
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
 * Model seçimi: Video varsa Nemotron, görsel için Qwen, text için Mimo
 * Fallback modeller: Eğer bir model çalışmazsa alternatifler
 */
export function selectModel(hasVideo: boolean, hasImage: boolean = false, hasAudio: boolean = false): string {
  if (hasVideo || hasAudio) {
    // Video veya ses için Nemotron 12B VL (multimodal, video/ses destekli)
    return "nvidia/nemotron-nano-12b-v2-vl:free";
  } else if (hasImage) {
    // Görsel için Qwen 2.5 VL (multimodal, görsel analizi için hızlı)
    return "qwen/qwen-2.5-vl-7b-instruct:free";
  } else {
    // Text-only chat için Mimo V2 Flash (Türkçe için iyi, reasoning destekli)
    return "xiaomi/mimo-v2-flash:free";
  }
}

/**
 * Alternatif model listesi (fallback için)
 * OpenRouter'daki tüm bedava modellerden görsel destekleyenler eklendi
 */
export function getFallbackModels(hasVideo: boolean, hasImage: boolean = false, hasAudio: boolean = false): string[] {
  if (hasVideo || hasAudio) {
    return [
      "qwen/qwen-2.5-vl-7b-instruct:free", // Fallback (Qwen video/ses destekli)
      "nvidia/nemotron-nano-12b-v2-vl:free", // Fallback 2 (Nemotron video/ses destekli)
      // Video/ses için alternatifler sınırlı (bedava modellerde)
    ];
  } else if (hasImage) {
    return [
      "nvidia/nemotron-nano-12b-v2-vl:free", // Fallback 1 (Nemotron görsel destekli)
      // Görsel için alternatifler: Bedava modellerde görsel destekleyen çok az
      // Qwen zaten öncelikli, Nemotron fallback
      // Diğer bedava modeller genelde text-only
    ];
  } else {
    return [
      "xiaomi/mimo-v2-flash:free", // Fallback 1 (Türkçe iyi, reasoning destekli)
      "mistralai/devstral-2512:free", // Fallback 2 (Yeni Mistral modeli)
      "qwen/qwen-2.5-7b-instruct:free", // Fallback 3 (Qwen text - güvenilir)
      "meta-llama/llama-3.2-3b-instruct:free", // Fallback 4 (Llama 3.2 - popüler)
      // 4 model yeterli - performans için optimize edildi
    ];
  }
}

