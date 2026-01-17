"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Send, ChevronUp, MessageSquare, X } from "lucide-react"
import Link from "next/link"
import { getOrCreateGuestUserId } from "@/app/lib/device"

export default function FeedbackPage() {
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Success mesajını 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (submitStatus === "success") {
      const timer = setTimeout(() => {
        setSubmitStatus("idle")
      }, 5000) // 5 saniye

      return () => clearTimeout(timer) // Cleanup
    }
  }, [submitStatus])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      // User ID'yi al
      const user_id = getOrCreateGuestUserId()
      
      if (!user_id) {
        setSubmitStatus("error")
        alert("Kullanıcı bilgisi bulunamadı. Lütfen sayfayı yenileyin.")
        return
      }

      // API'ye gönder
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          user_id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Formu temizle
        setFormData({ name: "", email: "", message: "" })
        setSubmitStatus("success")
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Feedback submit error:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo ve Brand */}
          <Link href="/">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent hidden lg:block">
                NesiVarUsta
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 pt-32 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full text-orange-300 text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4 mr-2" />
            Geri Bildirim
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
              Görüşleriniz Bizim İçin Değerli
            </span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Ustamızın bir kusuru olduysa özür dileriz. Ustamızla ilgili görüşlerinizi, önerilerinizi ve geri bildirimlerinizi bizimle paylaşın.
          </p>
        </div>

        {/* Feedback Form */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                İsim (Opsiyonel)
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Adınız"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-posta (Opsiyonel)
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Mesajınız <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="2-3 kelimelik bir cümleyle görüşlerinizi, önerilerinizi veya geri bildirimlerinizi buraya yazabilirsiniz..."
              />
            </div>

            {submitStatus === "success" && (
              <div className="p-3 rounded-lg border relative bg-green-500/20 border-green-500/30">
                <button
                  type="button"
                  onClick={() => setSubmitStatus("idle")}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 text-green-600 hover:text-green-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm pr-6 text-green-400">
                  Geri bildiriminiz için teşekkürler. NesiVarUsta sağlıklı günler diler.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                Bir hata oluştu. Lütfen tekrar deneyin veya doğrudan{" "}
                <a href="mailto:nesivarusta@gmail.com" className="underline">
                  nesivarusta@gmail.com
                </a>{" "}
                adresine e-posta gönderin.
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !formData.message.trim() || formData.message.trim().length < 10}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Send className="w-4 h-4 mr-2 animate-pulse" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Alternative Contact */}
        <div className="mt-8 bg-gradient-to-r from-orange-500/10 to-blue-500/10 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
              <Mail className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Alternatif İletişim</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>Formu kullanmak yerine doğrudan e-posta göndermek isterseniz:</p>
            <div>
              <strong>E-posta:</strong>{" "}
              <a href="mailto:nesivarusta@gmail.com" className="text-orange-400 hover:text-orange-300">
                nesivarusta@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Sayfanın üstüne git"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}
