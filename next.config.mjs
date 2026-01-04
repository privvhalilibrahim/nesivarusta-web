/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Vercel serverless için Chromium'u doğru şekilde yükle
  // Bu paketler bundle'a dahil edilmemeli, runtime'da yüklenmeli
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
}

export default nextConfig
