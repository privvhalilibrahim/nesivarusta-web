/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 14'te serverExternalPackages yok, Next.js 15'te var
  // Bunun yerine webpack externals kullanıyoruz
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side'da Chromium'u external yap (bundle'a dahil etme)
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
      });
    }
    
    // serviceAccountKey.json dosyasını build zamanında ignore et
    // Bu dosya sadece development'ta var, production'da environment variable kullanılıyor
    // Webpack'in bu dosyayı analiz etmemesi için externals'a ekle
    if (isServer) {
      config.externals = config.externals || [];
      // serviceAccountKey.json'ı external yap - build zamanında analiz etmesin
      if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request && request.includes('serviceAccountKey.json')) {
            // Bu dosyayı external olarak işaretle - build zamanında ignore et
            return callback(null, 'commonjs ' + request);
          }
          callback();
        });
      }
    }
    
    return config;
  },
}

export default nextConfig
