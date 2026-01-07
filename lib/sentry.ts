/**
 * Sentry Error Tracking Setup (Optional)
 * 
 * Kullanmak için:
 * 1. npm install @sentry/nextjs
 * 2. Sentry projesi oluştur: https://sentry.io
 * 3. SENTRY_DSN environment variable'ı ekle
 * 4. Bu dosyayı aktif et
 */

// Sentry'yi opsiyonel yap - sadece DSN varsa yükle
let Sentry: any = null;

if (process.env.SENTRY_DSN) {
  try {
    // Dynamic import - sadece DSN varsa yükle
    // Sentry = require('@sentry/nextjs');
  } catch (e) {
    console.warn('Sentry not installed. Install with: npm install @sentry/nextjs');
  }
}

export function initSentry() {
  if (!process.env.SENTRY_DSN || !Sentry) {
    return;
  }

  // Sentry.init({
  //   dsn: process.env.SENTRY_DSN,
  //   environment: process.env.NODE_ENV || 'development',
  //   tracesSampleRate: 1.0,
  // });
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (!Sentry) return;
  // Sentry.captureException(error, { extra: context });
  console.error('[Sentry] Exception captured:', error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!Sentry) return;
  // Sentry.captureMessage(message, level);
  console.log(`[Sentry] ${level}:`, message);
}
