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
    return config;
  },
}

export default nextConfig
