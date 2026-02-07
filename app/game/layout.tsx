import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hangi Araba Daha Pahalı? | NesiVarUsta",
  description: "İki araba arasında daha pahalı olanı tahmin et, skorunu yükselt!",
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
