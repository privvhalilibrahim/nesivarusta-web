"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Camera,
  Send,
  MoreVertical,
  Search,
  Plus,
  ArrowLeft,
  Brain,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  LogOut,
  MessageSquare,
  Minimize2,
  Maximize2,
  Download,
  Share,
  Trash2,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Bell,
  BellOff,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  imageUrl?: string
  analysis?: {
    diagnosis: string
    severity: "low" | "medium" | "high"
    cost: string
    confidence: number
  }
}

interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  status: "active" | "resolved" | "pending"
  severity: "low" | "medium" | "high"
  messageCount: number
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Merhaba! Ben NesiVarUsta AI asistanınızım. Araç sorununuzla nasıl yardımcı olabilirim? Fotoğraf yükleyebilir veya sorununuzu detaylı bir şekilde tarif edebilirsiniz.",
      timestamp: new Date(),
    },
  ])

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("nesivarusta-chat-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        const historyWithDates = parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }))
        setChatHistory(historyWithDates)
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    }
  }, [])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("nesivarusta-chat-history", JSON.stringify(chatHistory))
    }
  }, [chatHistory])

  // Save current chat messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      // More than just the initial greeting
      const currentChatId = selectedChatId || "current-chat"
      localStorage.setItem(`nesivarusta-messages-${currentChatId}`, JSON.stringify(messages))
    }
  }, [messages, selectedChatId])

  // Simulate AI response
  const simulateAIResponse = async (userMessage: string, hasImage = false) => {
    setIsTyping(true)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let aiResponse = ""
    let analysis = undefined

    if (hasImage) {
      setIsAnalyzing(true)
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setIsAnalyzing(false)

      aiResponse = `🔍 **DETAYLI ANALİZ SONUCU**

📸 **GÖRSEL ANALİZ TAMAMLANDI**
Fotoğrafınızı başarıyla analiz ettim. İşte bulgularım:

🔧 **TEŞHİS**
Motor bölgesinde yağ sızıntısı ve valf ayar problemi tespit edildi.

⚠️ **ACİLİYET DURUMU**
Orta seviye - 1-2 hafta içinde müdahale önerilir

💰 **TAHMİNİ MALİYET**
650-950₺ (Parça + İşçilik dahil)

📋 **ÖNERİLEN ÇÖZÜM**
• Valf kapak contası değişimi
• Motor yağı kontrolü ve değişimi
• Valf ayarı kontrolü

🎯 **GÜVENİLİRLİK ORANI**
%92 (Yüksek güvenilirlik)

Başka bir açıdan fotoğraf çekip gönderirseniz daha detaylı analiz yapabilirim. Sorularınız var mı?`

      analysis = {
        diagnosis: "Motor yağ sızıntısı ve valf ayar problemi",
        severity: "medium" as const,
        cost: "650-950₺",
        confidence: 92,
      }
    } else {
      // Text-based responses
      if (userMessage.toLowerCase().includes("ses") || userMessage.toLowerCase().includes("gürültü")) {
        aiResponse = `🔊 **SES ANALİZİ**

Tarif ettiğiniz ses genellikle şu sorunlardan kaynaklanabilir:

🔧 **OLASI NEDENLER**
• Motor valf ayar problemi
• Timing zinciri gerginliği
• Motor yağı seviyesi düşüklüğü
• Piston çubuğu aşınması

📸 **ÖNERİ**
Daha kesin teşhis için motor bölgesinin fotoğrafını çekip paylaşabilir misiniz? Bu sayede görsel analiz ile ses analizini birleştirerek %95'e varan doğrulukla teşhis koyabilirim.

❓ **SORULAR**
• Bu ses ne zaman başladı?
• Motor soğukken mi sıcakken mi daha belirgin?
• Ses motor devrini artırdığınızda değişiyor mu?`
      } else if (userMessage.toLowerCase().includes("fren")) {
        aiResponse = `🛑 **FREN SİSTEMİ ANALİZİ**

Fren sistemi güvenlik açısından kritik öneme sahiptir. Sorununuzu daha iyi anlayabilmem için:

🔍 **DETAY SORULAR**
• Fren pedalında titreşim var mı?
• Fren sesi hangi tekerleklerden geliyor?
• Araç frenleme sırasında yana çekiyor mu?
• Fren balata uyarı ışığı yanıyor mu?

📸 **FOTOĞRAF ÖNERİSİ**
Fren disklerinin ve balataların fotoğrafını çekebilirseniz, aşınma durumunu analiz edebilirim.

⚠️ **GÜVENLİK UYARISI**
Fren sorunları acil müdahale gerektirebilir. Güvenli sürüş için en kısa sürede kontrol ettirmenizi öneririm.`
      } else {
        aiResponse = `Anlıyorum. Bu konuda size yardımcı olmak için daha fazla detaya ihtiyacım var.

🤔 **DAHA FAZLA BİLGİ İÇİN**
• Sorunu ne zaman fark ettiniz?
• Belirtiler hangi durumlarda ortaya çıkıyor?
• Daha önce benzer bir sorun yaşadınız mı?

📸 **FOTOĞRAF ANALİZİ**
Sorunlu bölgenin net bir fotoğrafını paylaşırsanız, AI görüntü analizi ile çok daha kesin bir teşhis koyabilirim.

💡 **İPUCU**
Fotoğraf çekerken:
• İyi ışıklandırma kullanın
• Sorunlu bölgeyi yakından çekin
• Mümkünse farklı açılardan çekin`
      }
    }

    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "ai",
      content: aiResponse,
      timestamp: new Date(),
      analysis,
    }

    setMessages((prev) => [...prev, aiMessage])
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = currentInput
    setCurrentInput("")

    await simulateAIResponse(messageContent)

    // Update or create chat history entry
    const newHistoryEntry: ChatHistory = {
      id: selectedChatId || Date.now().toString(),
      title: messageContent.slice(0, 30) + (messageContent.length > 30 ? "..." : ""),
      lastMessage: messageContent,
      timestamp: new Date(),
      status: "active",
      severity: "medium",
      messageCount: messages.length + 1,
    }

    setChatHistory((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.id === newHistoryEntry.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: messageContent,
          timestamp: new Date(),
          messageCount: messages.length + 1,
        }
        return updated
      } else {
        return [newHistoryEntry, ...prev]
      }
    })

    if (!selectedChatId) {
      setSelectedChatId(newHistoryEntry.id)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create image URL for display
    const imageUrl = URL.createObjectURL(file)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: "Fotoğraf gönderildi - Analiz için hazır",
      timestamp: new Date(),
      imageUrl,
    }

    setMessages((prev) => [...prev, userMessage])
    await simulateAIResponse("Fotoğraf analizi", true)
  }

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
    const selectedChat = chatHistory.find((chat) => chat.id === chatId)
    if (selectedChat) {
      const savedMessages = localStorage.getItem(`nesivarusta-messages-${chatId}`)
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages)
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          setMessages(messagesWithDates)
        } catch (error) {
          console.error("Error loading saved messages:", error)
          setMessages([
            {
              id: "1",
              type: "ai",
              content: `Bu "${selectedChat.title}" konuşmasının geçmişi yüklendi. Kaldığımız yerden devam edebiliriz.`,
              timestamp: new Date(),
            },
          ])
        }
      } else {
        setMessages([
          {
            id: "1",
            type: "ai",
            content: `Bu "${selectedChat.title}" konuşmasının geçmişi yüklendi. Kaldığımız yerden devam edebiliriz.`,
            timestamp: new Date(),
          },
        ])
      }
    }
  }

  const handleDownloadChat = () => {
    const chatContent = messages
      .map(
        (msg) =>
          `[${msg.timestamp.toLocaleString("tr-TR")}] ${msg.type === "user" ? "Kullanıcı" : "NesiVarUsta AI"}: ${msg.content}`,
      )
      .join("\n\n")

    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NesiVarUsta-Chat-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowMoreMenu(false)
  }

  const handleShareChat = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NesiVarUsta AI Chat",
          text: "NesiVarUsta AI ile araç sorunumu çözdüm!",
          url: window.location.href,
        })
      } catch (error) {
        console.log("Paylaşım iptal edildi")
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Chat linki panoya kopyalandı!")
    }
    setShowMoreMenu(false)
  }

  const handleDeleteChat = () => {
    if (confirm("Bu konuşmayı silmek istediğinizden emin misiniz?")) {
      setMessages([
        {
          id: "1",
          type: "ai",
          content: "Merhaba! Ben NesiVarUsta AI asistanınızım. Araç sorununuzla nasıl yardımcı olabilirim?",
          timestamp: new Date(),
        },
      ])
    }
    if (selectedChatId) {
      localStorage.removeItem(`nesivarusta-messages-${selectedChatId}`)
      setChatHistory((prev) => prev.filter((chat) => chat.id !== selectedChatId))
      setSelectedChatId(null)
    }
    setShowMoreMenu(false)
  }

  const handleLogout = () => {
    // Clear any stored data
    localStorage.removeItem("user-session")
    // Redirect to home page
    router.push("/")
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Bilinmeyen"

    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Şimdi"
    if (minutes < 60) return `${minutes} dk önce`
    if (hours < 24) return `${hours} saat önce`
    return `${days} gün önce`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return darkMode ? "text-red-500 bg-red-100" : "text-red-600 bg-red-50"
      case "medium":
        return darkMode ? "text-orange-500 bg-orange-100" : "text-orange-600 bg-orange-50"
      case "low":
        return darkMode ? "text-green-500 bg-green-100" : "text-green-600 bg-green-50"
      default:
        return darkMode ? "text-gray-500 bg-gray-100" : "text-gray-600 bg-gray-50"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-3 h-3" />
      case "medium":
        return <Clock className="w-3 h-3" />
      case "low":
        return <CheckCircle className="w-3 h-3" />
      default:
        return <MessageSquare className="w-3 h-3" />
    }
  }

  const filteredChatHistory = chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div
      className={`h-screen flex overflow-hidden transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      {/* Sidebar - Chat History */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-80"} ${
          darkMode ? "bg-gray-900/50 border-gray-700/50" : "bg-white border-gray-200/50"
        } backdrop-blur-xl border-r flex flex-col transition-all duration-300 
md:relative md:translate-x-0 
${sidebarCollapsed ? "md:w-16" : "md:w-80"}
${sidebarCollapsed ? "hidden md:flex" : "fixed md:static inset-y-0 left-0 z-50 w-80 md:w-80 shadow-2xl md:shadow-none"}
`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}>
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg flex items-center justify-center p-1">
                  <img src="/logo.jpeg" alt="NesiVarUsta" className="w-full h-full object-contain rounded-md" />
                </div>
                <div className="text-lg font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                  NesiVarUsta
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={
                darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
              }
            >
              {sidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Chat ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${
                    darkMode
                      ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500"
                      : "bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-orange-500"
                  } border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent`}
                />
              </div>

              {/* New Chat Button */}
              <Button
                onClick={() => {
                  setSelectedChatId(null)
                  setMessages([
                    {
                      id: "1",
                      type: "ai",
                      content: "Merhaba! Yeni bir konuşma başlattınız. Size nasıl yardımcı olabilirim?",
                      timestamp: new Date(),
                    },
                  ])
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Chat
              </Button>
            </>
          )}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              {filteredChatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100/50"
                  } ${
                    selectedChatId === chat.id
                      ? "bg-orange-500/20 border border-orange-500/30"
                      : darkMode
                        ? "bg-gray-800/30"
                        : "bg-gray-100/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4
                      className={`font-semibold text-sm truncate flex-1 ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {chat.title}
                    </h4>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getSeverityColor(chat.severity)}`}
                    >
                      {getSeverityIcon(chat.severity)}
                    </div>
                  </div>
                  <p className={`text-xs truncate mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {chat.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {formatTime(chat.timestamp)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                        {chat.messageCount} mesaj
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          chat.status === "active"
                            ? "bg-green-400"
                            : chat.status === "pending"
                              ? "bg-yellow-400"
                              : "bg-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChatHistory.slice(0, 5).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`w-12 h-12 rounded-lg cursor-pointer transition-all duration-300 ${
                    darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100/50"
                  } flex items-center justify-center ${
                    selectedChatId === chat.id
                      ? "bg-orange-500/20 border border-orange-500/30"
                      : darkMode
                        ? "bg-gray-800/30"
                        : "bg-gray-100/30"
                  }`}
                >
                  {getSeverityIcon(chat.severity)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                  }
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                  }
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                  }
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"}`}
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? "" : "md:ml-0"}`}>
        {/* Chat Header */}
        <div
          className={`${
            darkMode ? "bg-gray-900/50 border-gray-700/50" : "bg-white/80 border-gray-200/50"
          } backdrop-blur-xl border-b p-3 md:p-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Mobile hamburger menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`md:hidden ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"}`}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 md:w-6 md:h-6 text-orange-400" />
              </div>
              <div>
                <h2 className={`text-base md:text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  NesiVarUsta AI
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span
                    className={`text-xs md:text-sm hidden sm:block ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Çevrimiçi - Ortalama yanıt süresi: 2 saniye
                  </span>
                  <span className={`text-xs sm:hidden ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Çevrimiçi</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              <Button
                variant="ghost"
                size="sm"
                className={
                  darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                }
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {/* More Menu Dropdown */}
              {showMoreMenu && (
                <div
                  className={`absolute right-0 top-full mt-2 w-48 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  } border rounded-lg shadow-xl z-50`}
                >
                  <div className="py-2">
                    <button
                      onClick={handleDownloadChat}
                      className={`w-full px-4 py-2 text-left text-sm ${
                        darkMode
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      } flex items-center space-x-2`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Chat'i İndir</span>
                    </button>
                    <button
                      onClick={handleShareChat}
                      className={`w-full px-4 py-2 text-left text-sm ${
                        darkMode
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      } flex items-center space-x-2`}
                    >
                      <Share className="w-4 h-4" />
                      <span>Chat'i Paylaş</span>
                    </button>
                    <button
                      onClick={handleDeleteChat}
                      className={`w-full px-4 py-2 text-left text-sm text-red-400 ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      } hover:text-red-300 flex items-center space-x-2`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Chat'i Sil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[80%] ${message.type === "user" ? "order-2" : "order-1"}`}>
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-br-md"
                      : darkMode
                        ? "bg-gray-800/50 text-gray-200 rounded-bl-md border border-gray-700/50"
                        : "bg-white/80 text-gray-800 rounded-bl-md border border-gray-200/50"
                  }`}
                >
                  {/* Image if present */}
                  {message.imageUrl && (
                    <div className="mb-2 md:mb-3">
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt="Uploaded"
                        className="max-w-full h-auto rounded-lg max-h-48 md:max-h-64"
                      />
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-line text-xs md:text-sm">{message.content}</div>

                  {/* Analysis card for AI messages */}
                  {message.analysis && (
                    <div
                      className={`mt-2 md:mt-3 ${
                        darkMode ? "bg-white/10 border-white/20" : "bg-gray-100/50 border-gray-300/20"
                      } rounded-lg p-2 md:p-3 border`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-orange-300">DETAYLI ANALİZ</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(message.analysis.severity)}`}
                        >
                          {message.analysis.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Teşhis:</span>
                          <span className={`ml-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {message.analysis.diagnosis}
                          </span>
                        </div>
                        <div>
                          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Maliyet:</span>
                          <span className={`ml-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {message.analysis.cost}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Güvenilirlik:</span>
                          <div className={`flex-1 h-2 ${darkMode ? "bg-gray-600" : "bg-gray-300"} rounded-full`}>
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                              style={{ width: `${message.analysis.confidence}%` }}
                            />
                          </div>
                          <span className={`text-xs ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {message.analysis.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-xs mt-1 md:mt-2 ${
                      message.type === "user" ? "text-orange-100" : darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {(typeof message.timestamp === "string"
                      ? new Date(message.timestamp)
                      : message.timestamp
                    ).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Avatar */}
              <div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-orange-500 to-blue-500 order-1 mr-2 md:mr-3"
                    : darkMode
                      ? "bg-gray-700 order-2 ml-2 md:ml-3"
                      : "bg-gray-200 order-2 ml-2 md:ml-3"
                }`}
              >
                {message.type === "user" ? (
                  <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                ) : (
                  <Brain className={`w-3 h-3 md:w-4 md:h-4 ${darkMode ? "text-orange-400" : "text-orange-500"}`} />
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className={`${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-2xl rounded-bl-md px-4 py-3 ml-11`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          {/* Analyzing Indicator */}
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl rounded-bl-md px-4 py-3 ml-11">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-blue-300 font-semibold text-sm">🧠 AI Fotoğraf Analizi Yapılıyor...</p>
                    <p className="text-blue-400 text-xs">Görüntü işleniyor ve analiz ediliyor...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className={`${
            darkMode ? "bg-gray-900/50 border-gray-700/50" : "bg-white/80 border-gray-200/50"
          } backdrop-blur-xl border-t p-3 md:p-4`}
        >
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* File Upload */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className={`${
                darkMode
                  ? "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                  : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
              } p-2.5 md:p-3 rounded-xl flex-shrink-0 h-10 w-10 md:h-12 md:w-12`}
            >
              <Camera className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Araç sorununuzu tarif edin..."
                className={`w-full px-3 md:px-4 py-2.5 md:py-3 ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500"
                    : "bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-orange-500"
                } border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent resize-none min-h-[40px] md:min-h-[48px] max-h-24 md:max-h-32 text-sm md:text-base`}
                rows={1}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isTyping}
              className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white p-2.5 md:p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-10 w-10 md:h-12 md:w-12"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-3">
            <span className={`text-xs hidden md:inline ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Hızlı Eylemler:
            </span>
            {["Motor sesi", "Fren sorunu", "Yağ sızıntısı", "Klima arızası"].map((action) => (
              <Button
                key={action}
                onClick={() => setCurrentInput(action + " problemi")}
                variant="ghost"
                size="sm"
                className={`text-xs ${
                  darkMode
                    ? "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                    : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                } px-2 md:px-3 py-1 rounded-full flex-shrink-0`}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            } rounded-xl border w-full max-w-md`}
          >
            <div
              className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Ayarlar</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsModal(false)}
                className={
                  darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                }
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {soundEnabled ? (
                    <Volume2 className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  ) : (
                    <VolumeX className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  )}
                  <span className={darkMode ? "text-white" : "text-gray-900"}>Ses Bildirimleri</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`${soundEnabled ? "text-green-400" : darkMode ? "text-gray-400" : "text-gray-600"} ${darkMode ? "hover:text-white" : "hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  {soundEnabled ? "Açık" : "Kapalı"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {notificationsEnabled ? (
                    <Bell className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  ) : (
                    <BellOff className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  )}
                  <span className={darkMode ? "text-white" : "text-gray-900"}>Push Bildirimleri</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`${notificationsEnabled ? "text-green-400" : darkMode ? "text-gray-400" : "text-gray-600"} ${darkMode ? "hover:text-white" : "hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  {notificationsEnabled ? "Açık" : "Kapalı"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? (
                    <Moon className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  ) : (
                    <Sun className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  )}
                  <span className={darkMode ? "text-white" : "text-gray-900"}>Karanlık Tema</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`${darkMode ? "text-green-400" : "text-gray-600"} ${darkMode ? "hover:text-white" : "hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  {darkMode ? "Açık" : "Kapalı"}
                </Button>
              </div>
            </div>
            <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <Button
                onClick={() => setShowSettingsModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            } rounded-xl border w-full max-w-sm`}
          >
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <LogOut className="w-6 h-6 text-red-400" />
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Çıkış Yap</h3>
              </div>
              <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Oturumunuzu kapatmak istediğinizden emin misiniz?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"}`}
                >
                  İptal
                </Button>
                <Button onClick={handleLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {showMoreMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />}
    </div>
  )
}
