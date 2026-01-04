/**
 * Merkezi Dosya Validasyon Utility
 * Tüm dosya validasyon kontrolleri buradan yapılır
 */

// Dosya boyutu limiti: 20MB (medya dosyaları için - görsel/video/ses)
// Bu limit, API çağrılarının performansını korumak ve sunucu kaynaklarını korumak için konulmuştur.
// Büyük dosyalar:
// - API response süresini artırır
// - Base64 encoding için fazla bellek kullanır
// - AI model'lerin işleme süresini uzatır
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Desteklenen dosya tipleri
export const ALLOWED_FILE_TYPES = [
  // Görsel formatları
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Video formatları
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // Ses formatları
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/ogg',
  'audio/webm',
] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dosya validasyonu yapar
 * @param file - Validasyon yapılacak dosya
 * @returns Validation sonucu
 */
export function validateFile(file: File): FileValidationResult {
  // Boyut kontrolü
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB olmalı.`,
    };
  }

  // Tip kontrolü
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Desteklenmeyen dosya tipi. Sadece resim, video ve ses dosyaları kabul edilir.',
    };
  }

  return { valid: true };
}

/**
 * Dosya tipini kontrol eder (görsel, video, ses)
 */
export function getFileType(file: File): 'image' | 'video' | 'audio' | 'unknown' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'unknown';
}

/**
 * Dosya boyutunu insan okunabilir formatta döndürür
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
