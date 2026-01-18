/**
 * Input Validation and Sanitization Utilities
 * Güvenlik için tüm user input'larını validate ve sanitize eder
 */

/**
 * Email validation
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Email sanitization (trim ve lowercase)
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;
  return email.trim().toLowerCase() || null;
}

/**
 * String sanitization (XSS önleme)
 * HTML tag'lerini kaldırır, özel karakterleri escape eder
 */
export function sanitizeString(input: string | null | undefined, maxLength?: number): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // HTML tag'lerini kaldır (basit XSS önleme)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Özel karakterleri escape et
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Max length kontrolü
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Name sanitization (HTML tag'leri kaldır, özel karakterleri temizle)
 */
export function sanitizeName(name: string | null | undefined, maxLength: number = 100): string {
  if (!name || typeof name !== 'string') return '';
  
  let sanitized = name.trim();
  
  // HTML tag'lerini kaldır
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Sadece harf, rakam, boşluk ve bazı özel karakterlere izin ver
  sanitized = sanitized.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s\-'\.]/g, '');
  
  // Max length kontrolü
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Content sanitization (yorum, feedback içeriği için)
 * HTML tag'lerini kaldırır ama özel karakterleri korur (okunabilirlik için)
 */
export function sanitizeContent(content: string | null | undefined, maxLength?: number): string {
  if (!content || typeof content !== 'string') return '';
  
  let sanitized = content.trim();
  
  // HTML tag'lerini kaldır (XSS önleme)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Script tag'lerini kaldır (güvenlik)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Max length kontrolü
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * String length validation
 */
export function validateLength(
  input: string | null | undefined,
  minLength: number,
  maxLength: number
): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input is required' };
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `Minimum ${minLength} karakter olmalıdır` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Maksimum ${maxLength} karakter olabilir` };
  }
  
  return { valid: true };
}

/**
 * Blog ID validation (integer olmalı)
 */
export function validateBlogId(blog_id: any): { valid: boolean; value?: number; error?: string } {
  if (blog_id === null || blog_id === undefined) {
    return { valid: false, error: 'blog_id gereklidir' };
  }
  
  const parsed = parseInt(String(blog_id));
  
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Geçersiz blog_id' };
  }
  
  return { valid: true, value: parsed };
}
