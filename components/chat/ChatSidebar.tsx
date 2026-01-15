"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, X, Plus, Minimize2, Maximize2, ArrowLeft, Home, Mail, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  status: "active" | "resolved" | "pending"
  severity: "low" | "medium" | "high"
  messageCount: number
}

interface ChatSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  chatHistory: ChatHistory[]
  isLoadingHistory: boolean
  selectedChatId: string | null
  onChatSelect: (chatId: string) => void
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void
  isGeneratingPDF: boolean
  onNewChat: () => void
}

const getSeverityColor = (severity?: string) => {
  if (!severity) return "text-gray-500 bg-gray-100"
  switch (severity) {
    case "high":
      return "text-red-500 bg-red-100"
    case "medium":
      return "text-orange-500 bg-orange-100"
    case "low":
      return "text-green-500 bg-green-100"
    default:
      return "text-gray-500 bg-gray-100"
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "high":
      return <AlertTriangle className="w-3 h-3" />
    case "low":
      return <CheckCircle className="w-3 h-3" />
    default:
      return <Trash2 className="w-4 h-4" />
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Az önce"
  if (minutes < 60) return `${minutes} dk önce`
  if (hours < 24) return `${hours} saat önce`
  if (days < 7) return `${days} gün önce`
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export default function ChatSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  searchQuery,
  setSearchQuery,
  chatHistory,
  isLoadingHistory,
  selectedChatId,
  onChatSelect,
  onDeleteChat,
  isGeneratingPDF,
  onNewChat,
}: ChatSidebarProps) {
  const filteredChatHistory = chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Mobile backdrop
  useEffect(() => {
    if (!sidebarCollapsed && window.innerWidth < 768) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
      document.documentElement.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
      document.documentElement.style.overflow = "unset"
    }
  }, [sidebarCollapsed])

  return (
    <>
      <div
        className={`${sidebarCollapsed ? "w-[72px]" : "w-[340px] md:w-80"} dark:bg-gray-900/50 bg-white/90 dark:border-gray-700/50 border-gray-300 backdrop-blur-xl border-r flex flex-col 
transition-all duration-500 ease-in-out md:duration-300
md:relative 
${sidebarCollapsed ? "md:w-[72px]" : "md:w-80"}
${sidebarCollapsed ? "-translate-x-full opacity-0 md:translate-x-0 md:opacity-100" : "translate-x-0 opacity-100"} fixed md:static inset-y-0 left-0 z-50 shadow-2xl md:shadow-none max-w-[340px] md:max-w-none
`}
      >
        {/* Sidebar Header */}
        <div className={`p-3 md:p-4 dark:border-b dark:border-gray-700/50 border-b border-gray-300 min-h-[80px] md:min-h-[96px] ${sidebarCollapsed ? "flex items-center justify-center" : ""}`}>
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} ${sidebarCollapsed ? "w-full" : ""}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg p-1">
                  <img src="/logo.jpeg" alt="NesiVarUsta" className="w-full h-full object-contain rounded-lg" />
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
              className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/20"
            >
              {sidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Search */}
              <div className="relative mb-2 mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chat ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Chat ara"
                  className="w-full pl-10 pr-10 py-2 h-10 text-sm dark:bg-gray-800/50 bg-gray-100 dark:border-gray-600 border-gray-300 dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 focus:ring-orange-500 border rounded-lg focus:outline-none focus:ring-1 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Arama metnini temizle"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* New Chat Button */}
              <Button
                onClick={onNewChat}
                className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold py-2 h-10 rounded-lg transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Chat
              </Button>
            </>
          )}
        </div>

        {/* Chat History List */}
        <div className={`flex-1 overflow-y-auto chat-scrollbar ${sidebarCollapsed ? "overflow-x-hidden p-2" : "p-2"}`}>
          {!sidebarCollapsed ? (
            isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="dark:text-gray-400 text-gray-600 text-sm mt-4">Chat listesi yükleniyor...</p>
              </div>
            ) : filteredChatHistory.length > 0 ? (
              <div className="space-y-2">
                {filteredChatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 dark:hover:bg-gray-800/50 hover:bg-gray-200 ${selectedChatId === chat.id
                      ? "dark:bg-orange-500/20 bg-gray-100 dark:border-orange-500/30 border-orange-500 border"
                      : "dark:bg-gray-800/30 bg-gray-100"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm truncate flex-1 dark:text-white text-gray-900">
                        {chat.title}
                      </h4>
                      {(chat.severity === "medium" || !chat.severity) ? (
                        <button
                          onClick={(e) => onDeleteChat(chat.id, e)}
                          disabled={isGeneratingPDF}
                          aria-label="Chat'i sil"
                          className="text-red-500 hover:text-red-400 transition-colors duration-200 p-1 rounded hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Chat'i Sil"
                        >
                          {getSeverityIcon(chat.severity)}
                        </button>
                      ) : (
                        <div className={`text-xs font-medium flex items-center space-x-1 ${getSeverityColor(chat.severity)}`}>
                          {getSeverityIcon(chat.severity)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs truncate mb-2 dark:text-gray-400 text-gray-600">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs dark:text-gray-500 text-gray-400">
                        {formatTime(chat.timestamp)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs dark:text-gray-500 text-gray-400">
                          {chat.messageCount} mesaj
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null
          ) : (
            isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : filteredChatHistory.length > 0 ? (
              <div className="space-y-2">
                {filteredChatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={`w-12 h-12 rounded-lg cursor-pointer transition-all duration-300 dark:hover:bg-gray-800/50 hover:bg-gray-200 flex items-center justify-center ${selectedChatId === chat.id
                      ? "dark:bg-orange-500/20 bg-gray-100 dark:border-orange-500/30 border-orange-500 border"
                      : "dark:bg-gray-800/30 bg-gray-100"
                      }`}
                  >
                    <Mail className="w-3 h-3" />
                  </div>
                ))}
              </div>
            ) : null
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-1 dark:border-t dark:border-gray-700/50 border-t border-gray-300 min-h-[48px] md:min-h-[64px] flex items-center">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/20"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
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
    </>
  )
}
