"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock, X, Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // Hata mesajını 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("")
      }, 5000) // 5 saniye

      return () => clearTimeout(timer) // Cleanup
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    // Validasyon
    const errors: { email?: string; password?: string } = {}
    
    if (!email.trim()) {
      errors.email = "Lütfen e-posta girin"
    } else if (!email.includes("@")) {
      errors.email = "Geçerli bir e-posta adresi girin"
    }
    
    if (!password.trim()) {
      errors.password = "Lütfen şifre girin"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Başarılı giriş - admin paneline yönlendir
        router.push("/admin/comments")
        router.refresh()
      } else {
        setError(data.error || "Email veya şifre hatalı")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Giriş sırasında bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 p-1">
              <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Girişi</h1>
            <p className="text-gray-400 text-sm">Yorum moderasyon paneli</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: undefined })
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? "border-red-500 bg-red-500/10 focus:ring-red-500"
                      : "border-gray-700 focus:ring-orange-500 focus:border-transparent"
                  }`}
                  placeholder="admin@example.com"
                  disabled={loading}
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("")
                      setFieldErrors({ ...fieldErrors, email: undefined })
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: undefined })
                    }
                  }}
                  className={`w-full pl-10 pr-20 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? "border-red-500 bg-red-500/10 focus:ring-red-500"
                      : "border-gray-700 focus:ring-orange-500 focus:border-transparent"
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {password && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-5 h-5 text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                        title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassword("")
                          setFieldErrors({ ...fieldErrors, password: undefined })
                        }}
                        className="w-5 h-5 text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg relative">
              <button
                type="button"
                onClick={() => setError("")}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-red-600 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
                <p className="text-sm text-red-400 pr-6">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">
            Sadece yetkili personel için
          </p>
          <Link 
            href="/" 
            className="text-orange-400 hover:text-orange-300 text-sm transition-colors inline-block"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
