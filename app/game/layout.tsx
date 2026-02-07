import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hangi Araba Daha Pahalı? | NesiVarUsta",
  description: "İki araba arasında daha pahalı olanı tahmin et, skorunu yükselt!",
}

/** Mobil iOS/Android'de ekrana oturması ve scroll olmaması için 100dvh + overflow hidden */
export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-gray-950">
      {children}
    </div>
  )
}
