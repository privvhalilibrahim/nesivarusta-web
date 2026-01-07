# NesiVarUsta Web

NesiVarUsta, araç arıza teşhisi için AI destekli bir web uygulamasıdır. Kullanıcılar araç sorunlarını metin, görsel, ses veya video ile paylaşabilir ve detaylı teşhis raporları alabilirler.

## 🚀 Özellikler

- **AI Destekli Teşhis**: OpenRouter ve Gemini AI modelleri ile akıllı arıza analizi
- **Çoklu Medya Desteği**: Metin, görsel, ses ve video analizi
- **PDF Rapor Oluşturma**: Detaylı teşhis raporlarını PDF olarak indirme
- **Chat Geçmişi**: Tüm konuşmaları kaydetme ve görüntüleme
- **Araç Bilgisi Çıkarma**: Marka, model, yıl ve KM bilgilerini otomatik çıkarma
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu arayüz

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya pnpm
- Firebase projesi
- OpenRouter API key
- Gemini API key

## 🛠️ Kurulum

### 1. Projeyi klonlayın

```bash
git clone <repository-url>
cd nesivarusta-web
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
# veya
pnpm install
```

### 3. Environment variables'ı ayarlayın

`.env.local` dosyası oluşturun ve `.env.example` dosyasındaki değişkenleri doldurun:

```bash
cp .env.example .env.local
```

### 4. Poppins font'larını VFS'ye ekleyin

```bash
node scripts/add-poppins-to-vfs.js
```

### 5. Development server'ı başlatın

```bash
npm run dev
# veya
pnpm dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
nesivarusta-web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # Chat API endpoints
│   │   ├── analyze/       # Analiz endpoints
│   │   └── pdf/           # PDF generation
│   ├── chat/              # Chat sayfası
│   └── login/             # Authentication sayfaları
├── components/            # React components
│   └── ui/                # UI components (shadcn/ui)
├── lib/                   # Utility functions
│   ├── pdfmake.ts        # PDF generation setup
│   ├── firebase.ts        # Firebase client config
│   └── logger.ts         # Logging utility
├── fonts/                 # Font dosyaları
│   └── Poppins/          # Poppins font family
└── scripts/               # Build scripts
    └── add-poppins-to-vfs.js
```

## 🔧 Environment Variables

Gerekli environment variables için `.env.example` dosyasına bakın.

## 📦 Build

Production build için:

```bash
npm run build
npm start
```

## 📝 Environment Variables

Projeyi çalıştırmak için `.env.local` dosyası oluşturun. Gerekli değişkenler için `.env.example` dosyasına bakın (manuel oluşturmanız gerekebilir - `.gitignore` nedeniyle).

**Gerekli Environment Variables:**
- `OPENROUTER_API_KEY` - OpenRouter API anahtarı
- `GEMINI_API_KEY` - Google Gemini API anahtarı
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase service account JSON (string)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase public API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

## 📝 API Endpoints

### Chat API
- `POST /api/chat` - Yeni mesaj gönderme
- `GET /api/chat?chat_id=...&user_id=...` - Chat mesajlarını getirme

### PDF API
- `POST /api/chat/pdf` - PDF raporu oluşturma

### Media Analysis
- `POST /api/analyze-media` - Görsel/ses/video analizi

## 🔒 Güvenlik

- Rate limiting (spam koruması)
- Input validation
- API key validation
- Firebase authentication

## 📄 Lisans

Bu proje özel bir projedir.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen önce bir issue açın veya pull request gönderin.

## 📞 İletişim

Sorularınız için issue açabilirsiniz.
