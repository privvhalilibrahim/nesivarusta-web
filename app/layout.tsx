import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import Script from "next/script"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "NesiVarUsta - Uzman Otomotiv Danışmanlığı",
  description: "Türkiye'nin yeni nesil uzman otomotiv danışmanlık platformu.",
  generator: "YıkaBeni",
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#f97316" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={poppins.className}>
        {children}

        {/* Voiceflow Widget */}
        <Script
          id="voiceflow-widget"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(d, t) {
                var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
                v.onload = function() {
                  try {
                    window.voiceflow.chat.load({
                      verify: { projectID: '68dbb62a0bf03aedb5c121de' },
                      url: 'https://general-runtime.voiceflow.com',
                      versionID: 'production',
                      voice: { url: 'https://runtime-api.voiceflow.com' }
                    });
                  } catch (e) { 
                    console.error('Voiceflow yüklenemedi:', e); 
                  }
                };
                v.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
                v.type = 'text/javascript';
                s.parentNode.insertBefore(v, s);
              })(document, 'script');
            `,
          }}
        />
      </body>
    </html>
  )
}
