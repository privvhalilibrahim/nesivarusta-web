import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown";
}

/**
 * Text-to-Speech API Endpoint
 * Google Translate TTS kullanarak Türkçe sesli okuma sağlar (ücretsiz)
 * 
 * Kullanım: POST /api/tts
 * Body: { text: "Okunacak metin" }
 * 
 * Response: Audio stream (MP3)
 */
/**
 * Metni paragraflara göre böl (Google TTS karakter limiti için)
 * Her paragraf/başlık/numaralı liste bir chunk olur, ama maksimum 200 karakter limiti var
 */
function splitTextIntoChunks(text: string, maxLength: number = 200): string[] {
  const chunks: string[] = [];
  
  // Metni böl: Başlıklar (###, ##, #), numaralı listeler (1., 2., 3.), ve paragraflar (\n\n)
  // Önce başlıkları ve numaralı listeleri işaretle
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Boş satırı atla
    if (!line) {
      // Eğer mevcut chunk varsa ve bir sonraki satır başlık/numaralı liste ise, chunk'ı kaydet
      if (currentChunk.trim() && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.match(/^(#{1,6}\s+|\d+\.\s+)/)) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        } else {
          // Boş satır chunk'a ekle (paragraf ayırıcı)
          currentChunk += '\n';
        }
      }
      continue;
    }
    
    // Başlık kontrolü (###, ##, #) - Başlık ve altındaki içerik bir chunk olmalı
    if (line.match(/^#{1,6}\s+/)) {
      // Önceki chunk'ı kaydet
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Başlığı chunk'a ekle (altındaki içerik de eklenecek)
      currentChunk = line;
      continue;
    }
    
    // Numaralı liste kontrolü (1., 2., 3. gibi) - Numaralı liste ve altındaki maddeler bir chunk
    if (line.match(/^\d+\.\s+/)) {
      // Önceki chunk'ı kaydet (eğer numaralı liste değilse veya farklı bir numaralı liste başlıyorsa)
      if (currentChunk.trim()) {
        const lastLine = currentChunk.trim().split('\n').pop() || '';
        // Eğer önceki chunk numaralı liste değilse veya yeni bir numaralı liste başlıyorsa kaydet
        if (!lastLine.match(/^\d+\.\s+/)) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      // Yeni numaralı liste başlıyor - önceki numaralı liste chunk'ını kaydet
      if (currentChunk.trim() && currentChunk.trim().match(/^\d+\.\s+/)) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Numaralı liste öğesini başlat
      currentChunk = line;
      continue;
    }
    
    // Madde işareti kontrolü (- veya • ile başlayan satırlar) - numaralı listenin devamı
    if (line.match(/^[-•]\s+/)) {
      // Eğer mevcut chunk numaralı liste ise, devam et - ama maxLength kontrolü yap
      if (currentChunk.trim() && currentChunk.trim().match(/^\d+\.\s+/)) {
        const potentialChunk = currentChunk + '\n' + line;
        if (potentialChunk.length > maxLength) {
          chunks.push(currentChunk.trim());
          currentChunk = line; // Yeni chunk başlat
        } else {
          currentChunk = potentialChunk;
        }
        continue;
      }
    }
    
    // Normal satır (paragraf içeriği veya başlık/numaralı liste altındaki içerik)
    // Eğer mevcut chunk başlık veya numaralı liste ise, içeriği ekle
    // KRİTİK: Her zaman maxLength kontrolü yap
    const potentialChunk = currentChunk ? (currentChunk + '\n' + line) : line;
    
    if (potentialChunk.length > maxLength) {
      // Mevcut chunk'ı kaydet
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // Yeni satır çok uzunsa, onu da böl
      if (line.length > maxLength) {
        // Uzun satırı kelimelere böl
        const words = line.split(/\s+/);
        currentChunk = '';
        for (const word of words) {
          if ((currentChunk + ' ' + word).length > maxLength) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = word;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        }
      } else {
        currentChunk = line;
      }
    } else {
      // Satırı chunk'a ekle (başlık/numaralı liste altındaki içerik olarak)
      currentChunk = potentialChunk;
    }
  }
  
  // Son chunk'ı ekle
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Son kontrol: Her chunk'ın maksimum uzunluğu kontrol et (GÜVENLİK KONTROLÜ)
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxLength) {
      finalChunks.push(chunk);
    } else {
      // Çok uzun chunk'ı cümlelere böl
      const sentences = chunk.split(/([.!?]\s+)/);
      let tempChunk = '';
      for (const sentence of sentences) {
        if (sentence.trim()) {
          if ((tempChunk + sentence).length <= maxLength) {
            tempChunk += sentence;
          } else {
            if (tempChunk.trim()) {
              finalChunks.push(tempChunk.trim());
            }
            // Eğer cümle bile çok uzunsa, kelimelere böl
            if (sentence.length > maxLength) {
              const words = sentence.split(/\s+/);
              tempChunk = '';
              for (const word of words) {
                if ((tempChunk + ' ' + word).length > maxLength) {
                  if (tempChunk.trim()) {
                    finalChunks.push(tempChunk.trim());
                  }
                  tempChunk = word;
                } else {
                  tempChunk += (tempChunk ? ' ' : '') + word;
                }
              }
            } else {
              tempChunk = sentence;
            }
          }
        }
      }
      if (tempChunk.trim()) {
        finalChunks.push(tempChunk.trim());
      }
    }
  }
  
  // Son güvenlik kontrolü: Hiç chunk yoksa veya tüm chunk'lar çok uzunsa, metni zorla böl
  if (finalChunks.length === 0 || finalChunks.some(chunk => chunk.length > maxLength)) {
    logger.warn('TTS chunk bölme başarısız, metni zorla bölüyoruz', { text_length: text.length });
    // Metni zorla kelimelere böl
    const words = text.split(/\s+/);
    const forcedChunks: string[] = [];
    let forcedChunk = '';
    for (const word of words) {
      if ((forcedChunk + ' ' + word).length > maxLength) {
        if (forcedChunk.trim()) {
          forcedChunks.push(forcedChunk.trim());
        }
        forcedChunk = word;
      } else {
        forcedChunk += (forcedChunk ? ' ' : '') + word;
      }
    }
    if (forcedChunk.trim()) {
      forcedChunks.push(forcedChunk.trim());
    }
    return forcedChunks.filter(chunk => chunk.length > 0 && chunk.length <= maxLength);
  }
  
  return finalChunks.filter(chunk => chunk.length > 0 && chunk.length <= maxLength);
}

/**
 * Google TTS'den audio al (tek parça için)
 */
async function getTTSAudio(text: string): Promise<ArrayBuffer> {
  const encodedText = encodeURIComponent(text);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=tr-TR&client=tw-ob&q=${encodedText}`;
  
  const response = await fetch(ttsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Google TTS API error: ${response.status}`);
  }

  return await response.arrayBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text;
    const user_id = body.user_id; // Opsiyonel

    // Rate limiting (User ID varsa User ID, yoksa IP bazlı) - gevşek limit
    const ip_address = getClientIp(req);
    const identifier = user_id || ip_address;
    const configKey = user_id ? 'tts' : 'guest'; // User ID varsa tts, yoksa guest config
    
    const rateCheck = rateLimiter.check(identifier, configKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': String(rateCheck.remaining),
            'X-RateLimit-Reset': String(rateCheck.resetAt)
          }
        }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Google Translate TTS API karakter limiti var (~200 karakter)
    // Uzun metinleri parçalara böl ve birleştir
    
    // Metni temizle ve parçalara böl
    const cleanedText = text.trim();
    const chunks = splitTextIntoChunks(cleanedText, 200);
    
    logger.debug('TTS text processing', { text_length: cleanedText.length, chunks: chunks.length });
    
    // Eğer tek parça ise direkt gönder
    if (chunks.length === 1) {
      const audioBuffer = await getTTSAudio(chunks[0]);
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Birden fazla parça varsa, JSON formatında parçaları döndür
    // Frontend'de sırayla oynatılacak
    const chunkAudios: { text: string; audio: string }[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        logger.debug('TTS fetching chunk', { chunk: i + 1, total: chunks.length, length: chunks[i].length });
        const audioBuffer = await getTTSAudio(chunks[i]);
        
        // Base64'e çevir (Node.js Buffer kullan)
        const buffer = Buffer.from(audioBuffer);
        const base64Audio = buffer.toString('base64');
        chunkAudios.push({
          text: chunks[i],
          audio: `data:audio/mpeg;base64,${base64Audio}`
        });
        
        // Rate limit'i önlemek için kısa bir bekleme (sadece son parça değilse)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150)); // 150ms bekleme
        }
      } catch (error: any) {
        logger.error('TTS error fetching chunk', error as Error, { chunk: i + 1 });
        // Bir parça başarısız olsa bile diğerlerini almaya devam et
        continue;
      }
    }
    
    if (chunkAudios.length === 0) {
      throw new Error("Tüm audio parçaları alınamadı");
    }
    
    logger.debug('TTS generated audio chunks', { count: chunkAudios.length });
    
    // Parçaları JSON formatında döndür (frontend'de sırayla oynatılacak)
    return NextResponse.json({
      chunks: chunkAudios,
      totalChunks: chunkAudios.length,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    logger.error("TTS API Error", error as Error);
    return NextResponse.json(
      { error: "Sesli okuma sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}

