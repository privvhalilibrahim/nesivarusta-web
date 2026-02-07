import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ücretsiz Analiz Asistanınız | NesiVarUsta",
  description: "Ücretsiz araç analizi ve danışmanlık asistanı.",
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
