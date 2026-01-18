/**
 * Email Utility
 * Resend API ile email gönderme fonksiyonları
 */

import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email gönder (Resend API kullanarak)
 * Retry mekanizması ile (5 deneme, exponential backoff)
 * Timeout: 25 saniye (Vercel Pro için güvenli)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "NesiVarUsta <onboarding@resend.dev>";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is missing");
  }

  logger.info("📤 Email gönderiliyor (Resend API)...", {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
  });

  const emailPayload = {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text && { text: options.text }),
  };

  // Retry mekanizması: 5 deneme, exponential backoff (2s, 4s, 8s, 16s)
  const maxRetries = 5;
  const baseRetryDelay = 2000; // 2 saniye
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Timeout: 25 saniye (Vercel Pro için güvenli)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Response body'yi parse et (hata durumunda da)
      let data: any = {};
      try {
        data = await response.json();
      } catch (parseError) {
        // JSON parse hatası - response body boş veya geçersiz
        logger.warn(`❌ Email gönderme hatası (deneme ${attempt}/${maxRetries}): JSON parse hatası`, {
          status: response.status,
          statusText: response.statusText,
        });
        lastError = new Error(`Email gönderme hatası: Geçersiz response (${response.status})`);
        if (attempt < maxRetries) {
          const retryDelay = baseRetryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        // API hatası (4xx, 5xx)
        const errorMessage = data.message || data.error || `Resend API error: ${response.status}`;
        lastError = new Error(`Email gönderme hatası: ${errorMessage}`);
        
        // 4xx hataları retry edilemez (bad request, unauthorized, etc.)
        if (response.status >= 400 && response.status < 500) {
          logger.error(`❌ Email gönderme hatası (retry edilemez, deneme ${attempt}/${maxRetries})`, lastError, {
            errorMessage: lastError.message,
            resendResponse: data,
            status: response.status,
          });
          throw lastError; // 4xx hataları için retry yapma
        }
        
        // 5xx hataları retry edilebilir (server error)
        logger.warn(`❌ Email gönderme hatası (deneme ${attempt}/${maxRetries})`, { 
          error: lastError.message,
          resendResponse: data,
          status: response.status 
        });
        
        // Son deneme değilse retry yap
        if (attempt < maxRetries) {
          const retryDelay = baseRetryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw lastError;
      }

      // Başarılı
      logger.info("✅ Email başarıyla gönderildi", {
        id: data.id,
        to: options.to,
        subject: options.subject,
        attempt,
      });
      return; // Başarılı, fonksiyondan çık
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(errorMessage);
      
      // Hata türünü belirle
      const isNetworkError = errorMessage.includes("fetch failed") || 
                            errorMessage.includes("aborted") ||
                            errorMessage.includes("network") ||
                            errorMessage.includes("ECONNREFUSED") ||
                            errorMessage.includes("ETIMEDOUT");
      
      const isTimeoutError = errorMessage.includes("aborted") || 
                            errorMessage.includes("timeout");
      
      if (isNetworkError || isTimeoutError) {
        // Network veya timeout hatası - retry yapılabilir
        logger.warn(`❌ Email gönderme hatası (${isTimeoutError ? 'timeout' : 'network'}, deneme ${attempt}/${maxRetries}): ${errorMessage}`, {
          to: options.to,
          subject: options.subject,
          errorType: isTimeoutError ? 'timeout' : 'network',
        });
        
        // Son deneme değilse retry yap (exponential backoff)
        if (attempt < maxRetries) {
          const retryDelay = baseRetryDelay * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
          logger.debug(`⏳ Retry bekleniyor (${retryDelay}ms)...`, { attempt, maxRetries });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      } else {
        // Diğer hatalar (parse, validation, etc.) - retry yapılabilir ama daha az olası
        logger.warn(`❌ Email gönderme hatası (deneme ${attempt}/${maxRetries}): ${errorMessage}`, {
          to: options.to,
          subject: options.subject,
        });
        
        // Son deneme değilse retry yap (exponential backoff)
        if (attempt < maxRetries) {
          const retryDelay = baseRetryDelay * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Son deneme veya retry edilemeyen hata
      if (attempt === maxRetries) {
        logger.error("❌ Email gönderme hatası (tüm denemeler başarısız)", lastError, {
          to: options.to,
          subject: options.subject,
          attempts: maxRetries,
          errorType: isNetworkError ? 'network' : isTimeoutError ? 'timeout' : 'unknown',
        });
        throw new Error(`Email gönderme hatası (${maxRetries} deneme başarısız): ${errorMessage}`);
      }
    }
  }

  // Buraya gelmemeli ama TypeScript için
  throw lastError || new Error("Email gönderme hatası: Bilinmeyen hata");
}

/**
 * Yeni chat bildirimi email'i gönder
 */
export async function sendNewChatNotification(
  chatId: string,
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  const notificationEmail = process.env.NOTIFICATION_EMAIL || "yikabeniturkiye@gmail.com";

  const subject = `${chatId} idli yeni bir chat olusturuldu`;
  
  // Firebase Console linki oluştur
  const firebaseConsoleLink = `https://console.firebase.google.com/u/2/project/nesivarusta/firestore/databases/-default-/data/~2Fchats~2F${chatId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(to right, #f97316, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f97316; }
        .message-box { background: #fff; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd; }
        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .value { margin-top: 5px; color: #333; }
        .user-message { background: white; border-left: 4px solid #f97316; }
        .link-box { background: #fff; padding: 15px; margin: 10px 0; border-radius: 5px; border: 2px solid #f97316; text-align: center; }
        .link-box a { display: inline-block; padding: 10px 20px; background: linear-gradient(to right, #f97316, #3b82f6); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .link-box a:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔧 Yeni Chat Oluşturuldu</h2>
        </div>
        <div class="content">
          <div class="info-box">
            <div class="label">Chat ID</div>
            <div class="value">${chatId}</div>
          </div>
          <div class="info-box">
            <div class="label">User ID</div>
            <div class="value">${userId}</div>
          </div>
          <div class="message-box user-message">
            <div class="label">Kullanıcı Mesajı</div>
            <div class="value">${userMessage.substring(0, 500)}${userMessage.length > 500 ? "..." : ""}</div>
          </div>
          <div class="link-box">
            <p style="margin-bottom: 10px; color: #666;">Kontrol amacıyla Firebase Console'da chat'i görüntülemek için:</p>
            <a href="${firebaseConsoleLink}" target="_blank">Firebase Console'da Görüntüle</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Bu email, NesiVarUsta sisteminde yeni bir chat oluşturulduğunda otomatik olarak gönderilir.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    logger.info("📧 Email gönderiliyor...", {
      to: notificationEmail,
      subject,
      chatId,
      userId,
    });
    
    await sendEmail({
      to: notificationEmail,
      subject,
      html,
    });
    
    logger.info("✅ Yeni chat bildirimi email'i başarıyla gönderildi", {
      chatId,
      userId,
      to: notificationEmail,
    });
  } catch (error) {
    // Email gönderme hatası chat işlemini durdurmamalı
    logger.error("❌ Email gönderme hatası", error instanceof Error ? error : new Error(String(error)), {
      chatId,
      userId,
    });
    throw error; // Log için fırlat ama chat işlemi devam etsin
  }
}
