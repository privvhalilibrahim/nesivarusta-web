# E-posta Gönderme Sistemi Kurulum Rehberi

Bu rehber, başka bir projede e-posta gönderme sistemini kurmanız için adım adım talimatlar içerir.

## Seçenek 1: Cloudflare Workers ile (Mevcut Sistem)

### Adım 1: Resend Hesabı Oluşturma
1. https://resend.com adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'dan **API Keys** bölümüne gidin
4. Yeni bir API key oluşturun ve kopyalayın (sadece bir kez gösterilir!)

### Adım 2: Cloudflare Workers Projesi Oluşturma

#### 2.1. Proje Klasörü Oluşturma
```bash
mkdir mail-proxy
cd mail-proxy
npm init -y
```

#### 2.2. Gerekli Paketleri Yükleme
```bash
npm install -D wrangler typescript @cloudflare/workers-types
```

#### 2.3. TypeScript Yapılandırması
`tsconfig.json` dosyası oluşturun:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021"],
    "module": "ES2021",
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### 2.4. Wrangler Yapılandırması
`wrangler.jsonc` dosyası oluşturun:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mail-proxy",
  "main": "src/index.ts",
  "compatibility_date": "2025-06-25",
  "observability": {
    "enabled": true
  }
}
```

#### 2.5. Worker Kodu
`src/index.ts` dosyası oluşturun ve aşağıdaki kodu ekleyin:

```typescript
export interface Env {
  RESEND_API_KEY: string;
}

interface RawFormData {
  name: string;
  email: string;
  details: string;
  privacyAccepted: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight (OPTIONS isteğine yanıt)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    try {
      const body: RawFormData = await request.json();

      // Validasyon
      if (!body.email || !body.details || !body.name || !body.privacyAccepted) {
        return new Response(
          JSON.stringify({ error: "Eksik veya geçersiz alanlar var." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // E-posta içeriği (KENDİ BİLGİLERİNİZİ GÜNCELLEYİN)
      const emailPayload = {
        from: "Your App <noreply@yourdomain.com>", // Resend'de doğrulanmış domain
        to: ["your-email@example.com"], // Alıcı e-posta adresleri
        subject: `İletişim Formu: ${body.name}`,
        html: `
          <h3>Yeni İletişim Talebi</h3>
          <p><strong>İsim:</strong> ${body.name}</p>
          <p><strong>E-posta:</strong> ${body.email}</p>
          <p><strong>Mesaj:</strong><br/>${body.details}</p>
        `,
      };

      // Resend API'ye istek gönder
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const text = await resendRes.text();

      return new Response(text, {
        status: resendRes.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};
```

#### 2.6. Cloudflare'de Deploy Etme
```bash
# Cloudflare'e giriş yapın
npx wrangler login

# API key'i environment variable olarak ekleyin
npx wrangler secret put RESEND_API_KEY
# (Komut çalıştığında API key'inizi yapıştırın)

# Deploy edin
npx wrangler deploy
```

Deploy sonrası size bir URL verilecek (örn: `https://mail-proxy.your-username.workers.dev`)

---

## Seçenek 2: Next.js API Route ile (Daha Basit)

Eğer Next.js kullanıyorsanız, Cloudflare Workers yerine Next.js API Route kullanabilirsiniz.

### Adım 1: Resend Hesabı Oluşturma
Yukarıdaki Seçenek 1'in Adım 1'ini takip edin.

### Adım 2: Environment Variable Ekleme
`.env.local` dosyası oluşturun:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Adım 3: API Route Oluşturma
`pages/api/send-email.ts` (veya `app/api/send-email/route.ts` - App Router için) dosyası oluşturun:

**Pages Router için (`pages/api/send-email.ts`):**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

interface FormData {
  name: string;
  email: string;
  details: string;
  privacyAccepted: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: FormData = req.body;

    // Validasyon
    if (!body.email || !body.details || !body.name || !body.privacyAccepted) {
      return res.status(400).json({ error: 'Eksik veya geçersiz alanlar var.' });
    }

    // E-posta içeriği
    const emailPayload = {
      from: 'Your App <noreply@yourdomain.com>',
      to: ['your-email@example.com'],
      subject: `İletişim Formu: ${body.name}`,
      html: `
        <h3>Yeni İletişim Talebi</h3>
        <p><strong>İsim:</strong> ${body.name}</p>
        <p><strong>E-posta:</strong> ${body.email}</p>
        <p><strong>Mesaj:</strong><br/>${body.details}</p>
      `,
    };

    // Resend API'ye istek gönder
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'E-posta gönderilemedi' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
```

**App Router için (`app/api/send-email/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

interface FormData {
  name: string;
  email: string;
  details: string;
  privacyAccepted: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormData = await request.json();

    // Validasyon
    if (!body.email || !body.details || !body.name || !body.privacyAccepted) {
      return NextResponse.json(
        { error: 'Eksik veya geçersiz alanlar var.' },
        { status: 400 }
      );
    }

    // E-posta içeriği
    const emailPayload = {
      from: 'Your App <noreply@yourdomain.com>',
      to: ['your-email@example.com'],
      subject: `İletişim Formu: ${body.name}`,
      html: `
        <h3>Yeni İletişim Talebi</h3>
        <p><strong>İsim:</strong> ${body.name}</p>
        <p><strong>E-posta:</strong> ${body.email}</p>
        <p><strong>Mesaj:</strong><br/>${body.details}</p>
      `,
    };

    // Resend API'ye istek gönder
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'E-posta gönderilemedi' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Adım 4: Frontend'den Kullanma

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    // Next.js API Route kullanıyorsanız:
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Cloudflare Workers kullanıyorsanız:
    // const response = await fetch('https://mail-proxy.your-username.workers.dev', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // });

    if (response.ok) {
      console.log('E-posta başarıyla gönderildi!');
    } else {
      console.error('E-posta gönderilemedi');
    }
  } catch (error) {
    console.error('Hata:', error);
  }
};
```

---

## Önemli Notlar

### Resend Domain Doğrulama
1. Resend dashboard'a gidin
2. **Domains** bölümüne gidin
3. Domain ekleyin ve DNS kayıtlarını yapılandırın
4. Doğrulama tamamlanana kadar `from` adresinde doğrulanmış domain kullanın

### Güvenlik
- API key'leri asla frontend koduna eklemeyin
- CORS ayarlarını production'da sadece kendi domain'inize izin verecek şekilde güncelleyin:
  ```typescript
  "Access-Control-Allow-Origin": "https://yourdomain.com"
  ```

### Rate Limiting
- Resend ücretsiz planında ayda 3,000 e-posta limiti var
- Production'da rate limiting eklemeyi düşünün

---

## Hangi Seçeneği Seçmeliyim?

- **Cloudflare Workers**: 
  - ✅ Serverless, ölçeklenebilir
  - ✅ Next.js projenizden bağımsız
  - ✅ Ücretsiz plan geniş
  - ❌ Ekstra bir servis yönetimi gerektirir

- **Next.js API Route**:
  - ✅ Daha basit kurulum
  - ✅ Projenizle aynı yerde
  - ✅ Next.js hosting ile birlikte gelir
  - ❌ Serverless function limitleri olabilir (hosting'e göre)
