import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bloglar | NesiVarUsta",
  description: "NesiVarUsta blog yazıları ve otomotiv içerikleri.",
}

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
