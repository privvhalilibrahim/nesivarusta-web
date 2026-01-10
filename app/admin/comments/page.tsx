"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Check, X, Loader2, RefreshCw, LogOut, User } from "lucide-react"

interface Comment {
  id: string
  blog_id: number
  author_name: string
  author_email?: string
  content: string
  status: string
  is_visible?: boolean
  ai_score?: number
  ai_reason?: string
  // Cihaz ve tarayıcı bilgileri
  device_type?: string
  is_mobile?: boolean
  is_desktop?: boolean
  browser?: string
  os?: string
  ip_address?: string
  created_at: string
}

export default function AdminCommentsPage() {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminInfo, setAdminInfo] = useState<{ email?: string; name?: string } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Admin authentication kontrolü
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth")
      const data = await response.json()

      if (data.authenticated) {
        setAdminInfo({
          email: data.admin?.email,
          name: data.admin?.email,
        })
        loadPendingComments()
      } else {
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/admin/login")
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    if (adminInfo) {
      loadPendingComments()
    }
  }, [adminInfo])

  const loadPendingComments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/blogs/comments/moderate?status=pending")
      const data = await response.json()
      if (data.success) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Yorumlar yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (commentId: string, action: "approve" | "reject") => {
    try {
      setProcessing(commentId)
      const response = await fetch("/api/blogs/comments/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          action: action,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Yorumu listeden kaldır
        setComments(comments.filter((c) => c.id !== commentId))
      } else {
        alert(data.error || "İşlem başarısız")
      }
    } catch (error) {
      console.error("Moderasyon hatası:", error)
      alert("İşlem sırasında bir hata oluştu")
    } finally {
      setProcessing(null)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Yorum Moderatör Paneli</h1>
            <p className="text-gray-400 text-sm sm:text-base">Onay bekleyen yorumları kontrol edin</p>
            {adminInfo && (
              <p className="text-gray-500 text-xs sm:text-sm mt-1 flex items-center gap-2 break-all">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{adminInfo.email}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              onClick={loadPendingComments}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="bg-transparent hover:bg-transparent border-none text-gray-300 hover:text-orange-400 transition-colors w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto" />
            <p className="text-gray-400 mt-2">Yorumlar yükleniyor...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-800/50 rounded-lg border border-gray-700/50 px-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-base sm:text-lg">Onay bekleyen yorum yok!</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Tüm yorumlar onaylandı veya reddedildi.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 mb-1 block">İsim:</span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="text-white font-semibold text-base sm:text-lg break-words">{comment.author_name}</h3>
                        {comment.author_email && (
                          <span className="text-gray-400 text-xs sm:text-sm break-all">({comment.author_email})</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 break-words">
                      Blog ID: {comment.blog_id} •{" "}
                      {new Date(comment.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    
                    {/* Detaylı Bilgiler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-gray-900/50 rounded-lg">
                      {comment.ai_score !== undefined && (
                        <div>
                          <span className="text-xs text-gray-500">AI Skoru:</span>
                          <span className="text-xs text-orange-400 ml-2">
                            {comment.ai_score.toFixed(2)} / 1.0
                          </span>
                          {comment.ai_reason && (
                            <p className="text-xs text-gray-500 mt-1">
                              Gerekçe: {comment.ai_reason}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {comment.device_type && (
                        <div>
                          <span className="text-xs text-gray-500">Cihaz:</span>
                          <span className="text-xs text-blue-400 ml-2 capitalize">
                            {comment.device_type}
                            {comment.is_mobile && " (Mobil)"}
                            {comment.is_desktop && " (Masaüstü)"}
                          </span>
                        </div>
                      )}
                      
                      {comment.browser && (
                        <div>
                          <span className="text-xs text-gray-500">Tarayıcı:</span>
                          <span className="text-xs text-green-400 ml-2">
                            {comment.browser}
                            {comment.os && ` • ${comment.os}`}
                          </span>
                        </div>
                      )}
                      
                      {comment.ip_address && (
                        <div>
                          <span className="text-xs text-gray-500">IP Adresi:</span>
                          <span className="text-xs text-yellow-400 ml-2 font-mono">
                            {comment.ip_address}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-xs text-gray-500">Görünürlük:</span>
                        <span className={`text-xs ml-2 ${
                          comment.is_visible ? "text-green-400" : "text-red-400"
                        }`}>
                          {comment.is_visible ? "Görünür" : "Görünmez"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 mb-4">
                  <span className="text-xs text-gray-500 mb-2 block">Yorumun İçeriği:</span>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base">
                    {comment.content}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleModerate(comment.id, "approve")}
                    disabled={processing === comment.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {processing === comment.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Onayla
                  </Button>
                  <Button
                    onClick={() => handleModerate(comment.id, "reject")}
                    disabled={processing === comment.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                  >
                    {processing === comment.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Reddet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
