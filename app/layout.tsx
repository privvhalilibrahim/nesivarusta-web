import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "NesiVarUsta - Uzman Otomotiv Danışmanlığı",
  description: "Türkiye'nin yeni nesil uzman otomotiv danışmanlık platformu.",
  generator: "YıkaBeni",
  metadataBase: new URL('https://www.nesivarusta.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
      { url: "/logo.jpeg", sizes: "32x32", type: "image/jpeg" },
      { url: "/logo.jpeg", sizes: "16x16", type: "image/jpeg" },
    ],
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
    <html lang="tr" suppressHydrationWarning>
        <head>
    <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/jpeg" href="/logo.jpeg" />
    <link rel="shortcut icon" type="image/jpeg" href="/logo.jpeg" />
    <link rel="apple-touch-icon" href="/logo.jpeg" />
    <link rel="icon" type="image/jpeg" sizes="32x32" href="/logo.jpeg" />
    <link rel="icon" type="image/jpeg" sizes="16x16" href="/logo.jpeg" />
  </head>
      <body className={poppins.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
