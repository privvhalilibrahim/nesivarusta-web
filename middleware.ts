import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Headers Middleware
 * Tüm response'lara güvenlik başlıkları ekler
 * Performans etkisi yok - sadece header ekler
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  // Content-Security-Policy: XSS koruması
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' blob: data:; connect-src 'self' https://api.openrouter.ai https://generativelanguage.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com; frame-ancestors 'none';"
  )

  // X-Frame-Options: Clickjacking koruması
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: MIME type sniffing koruması
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Strict-Transport-Security: HTTPS zorunluluğu (sadece HTTPS'de çalışır)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // Referrer-Policy: Referrer bilgisi kontrolü
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Tarayıcı API'lerine erişim kontrolü
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // X-XSS-Protection: Eski tarayıcılar için (modern tarayıcılarda CSP yeterli)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

// Middleware'in hangi route'larda çalışacağını belirle
export const config = {
  matcher: [
    /*
     * Tüm route'ları kapsa (API, pages, app router)
     * Ama static dosyaları (images, fonts, etc.) hariç tut
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}
