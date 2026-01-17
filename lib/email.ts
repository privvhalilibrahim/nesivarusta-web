/**
 * Email Utility
 * Resend API ile email gönderme fonksiyonları
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email gönder (Resend API kullanarak)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "NesiVarUsta <onboarding@resend.dev>";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is missing");
  }

  console.log("📤 Email gönderiliyor (Resend API)...", {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
  });

  try {
    const emailPayload = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `Resend API error: ${response.status}`;
      console.error("❌ Email gönderme hatası:", errorMessage);
      console.error("❌ Resend API response:", data);
      throw new Error(`Email gönderme hatası: ${errorMessage}`);
    }

    console.log("✅ Email başarıyla gönderildi:", {
      id: data.id,
      to: options.to,
      subject: options.subject,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Email gönderme hatası:", errorMessage);
    throw new Error(`Email gönderme hatası: ${errorMessage}`);
  }
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
    console.log("📧 Email gönderiliyor...", {
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
    
    console.log("✅ Yeni chat bildirimi email'i başarıyla gönderildi", {
      chatId,
      userId,
      to: notificationEmail,
    });
  } catch (error) {
    // Email gönderme hatası chat işlemini durdurmamalı
    console.error("❌ Email gönderme hatası:", error);
    throw error; // Log için fırlat ama chat işlemi devam etsin
  }
}
