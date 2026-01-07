# Performance Optimization Guide

## 🚀 Mevcut Optimizasyonlar

### 1. Rate Limiting
- **Chat API**: 10 request/dakika (kullanıcı bazında)
- **PDF Generation**: 5 request/5 dakika (kullanıcı bazında)
- **Analyze API**: 20 request/dakika
- **Genel API**: 100 request/dakika

### 2. Caching
- **Firestore Queries**: 30 saniye cache (GET /api/chat)
- **History Queries**: 10 saniye cache (aktif chat'ler için)
- **Client-side**: localStorage cache (chat messages)

### 3. Query Optimizations
- **Message Limit**: Maksimum 500 mesaj per query (uzun chat'ler için)
- **History Limit**: Son 20 mesaj (OpenRouter maliyet optimizasyonu)
- **Index Requirements**: Firestore index'leri gerekli

### 4. Concurrent Request Limiting
- **PDF Generation**: Maksimum 10 concurrent request
- **Request Queue**: Otomatik retry mekanizması

## 📊 Firestore Index Requirements

Aşağıdaki index'lerin Firebase Console'da oluşturulması gerekiyor:

### 1. Messages Collection
```
Collection: messages
Fields:
  - chat_id (Ascending)
  - user_id (Ascending)
  - created_at (Ascending)
```

### 2. Messages Collection (Rate Limiting)
```
Collection: messages
Fields:
  - user_id (Ascending)
  - sender (Ascending)
  - created_at (Descending)
```

### 3. Messages Collection (History)
```
Collection: messages
Fields:
  - chat_id (Ascending)
  - created_at (Descending)
```

## ⚠️ Performance Bottlenecks

### 1. PDF Generation
- **Memory**: 3GB (Vercel limit)
- **Duration**: 60 saniye max
- **Concurrent**: 10 request max
- **Çözüm**: Rate limiting + request queue

### 2. Firestore Queries
- **Problem**: Çok fazla mesaj olan chat'ler yavaş
- **Çözüm**: Limit (500 mesaj) + caching

### 3. OpenRouter API
- **Problem**: Rate limit'ler
- **Çözüm**: Retry mekanizması + fallback models

## 🔧 Monitoring

Performance metrikleri için `lib/monitoring.ts` kullanılabilir:

```typescript
import { monitoring } from '@/lib/monitoring';

// API call'ı ölç
const result = await monitoring.measureApiCall('chat', async () => {
  return await fetch('/api/chat', ...);
});
```

## 📈 Scaling Recommendations

### Kısa Vadeli (100-1000 kullanıcı)
- ✅ Mevcut optimizasyonlar yeterli
- ✅ Rate limiting aktif
- ✅ Caching aktif

### Orta Vadeli (1000-10000 kullanıcı)
- 🔄 Redis cache (Vercel KV veya Upstash)
- 🔄 CDN for static assets
- 🔄 Database connection pooling

### Uzun Vadeli (10000+ kullanıcı)
- 🔄 Load balancing
- 🔄 Database sharding
- 🔄 Message queue (RabbitMQ/SQS)
- 🔄 Separate PDF generation service

## 🛠️ Troubleshooting

### "Too many requests" hatası
- Rate limit aşıldı
- Çözüm: `Retry-After` header'ına göre bekleyin

### "Query timeout" hatası
- Firestore query çok uzun sürüyor
- Çözüm: Index'leri kontrol edin, limit ekleyin

### "Memory limit exceeded"
- PDF generation çok fazla memory kullanıyor
- Çözüm: Concurrent request limit'i azaltın
