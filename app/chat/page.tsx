"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getOrCreateDeviceId, getOrCreateGuestUserId, setGuestUserId, detectDeviceType } from "@/app/lib/device"
import { cacheChatMessages, getCachedChatMessages, cacheChatHistory, getCachedChatHistory, clearChatCache, cleanupOldCache } from "@/lib/storage"
import { logger } from "@/lib/logger"
import type React from "react"
// pdfmake artık /lib/pdfmake.ts'den tek bir yerde init ediliyor
// Bu global init'i kaldırdık - getPdfMake() kullanılacak
import { Button } from "@/components/ui/button"
import {
  Send,
  MoreVertical,
  Search,
  X,
  Plus,
  ArrowLeft,
  Home,
  Wrench,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  LogOut,
  MessageSquare,
  Mail,
  Minimize2,
  Maximize2,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Mic,
  FileText,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import ChatSidebar from "@/components/chat/ChatSidebar"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  analysis?: {
    chat_summary?: string
    severity?: "low" | "medium" | "high"
    estimated_cost_range_try?: string
    possible_causes?: {
      name: string
      probability: number
    }[]
    risk_assessment?: string
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

  // bootstrapGuest fonksiyonunu useCallback ile tanımla (hem useEffect hem callChatAPI'de kullanılacak)
  // Promise cache mekanizması: Aynı promise'i birden fazla kez çağrılsa bile sadece bir kez çalışır
  const bootstrapGuest = useCallback(async (): Promise<string | null> => {
    // Eğer zaten bir promise varsa, onu döndür (race condition'ı önle)
    if (bootstrapGuestPromiseRef.current) {
      return bootstrapGuestPromiseRef.current
    }

    // Yeni promise oluştur ve cache'le
    const promise = (async (): Promise<string | null> => {
      try {
        const existingUserId = getOrCreateGuestUserId()
        if (existingUserId) {
          // Cache'i temizle (başarılı oldu)
          bootstrapGuestPromiseRef.current = null
          return existingUserId
        }

        const device_id = getOrCreateDeviceId()
        const deviceType = detectDeviceType()

        const res = await fetch("/api/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id,
            ...deviceType,
          }),
        })

        const data = await res.json()
        if (data?.user_id) {
          setGuestUserId(data.user_id)
          // Cache'i temizle (başarılı oldu)
          bootstrapGuestPromiseRef.current = null
          return data.user_id
        }
        
        // Cache'i temizle (hata olsa bile)
        bootstrapGuestPromiseRef.current = null
        return null
      } catch (error) {
        // Hata durumunda cache'i temizle
        bootstrapGuestPromiseRef.current = null
        throw error
      }
    })()

    // Promise'i cache'le
    bootstrapGuestPromiseRef.current = promise
    return promise
  }, [])

  // User ID artık sadece ilk mesaj gönderildiğinde oluşturulacak
  // useEffect'teki bootstrapGuest() çağrısı kaldırıldı - gereksiz user oluşturmayı önlemek için

  // Theme hydration için
  useEffect(() => {
    setMounted(true)
  }, [])



  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesAreaRef = useRef<HTMLDivElement>(null)
  // Promise cache: bootstrapGuest promise'ini cache'le (race condition'ı önlemek için)
  const bootstrapGuestPromiseRef = useRef<Promise<string | null> | null>(null)

  // SSR hydration mismatch'i önlemek için timestamp'i useEffect'te set edeceğiz
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentInput, setCurrentInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState<string | null>(null) // Hangi mesaj okunuyor
  const audioRef = useRef<HTMLAudioElement | null>(null) // Audio element için ref
  const shouldContinueRef = useRef<boolean>(true) // Audio oynatmayı durdurmak için ref
  const [isTyping, setIsTyping] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const selectedChatIdRef = useRef<string | null>(null) // Güncel değeri tutmak için
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showVehicleInfoDialog, setShowVehicleInfoDialog] = useState(false)
  const [missingVehicleFields, setMissingVehicleFields] = useState<string[]>([])
  const [vehicleInfoPlaceholder, setVehicleInfoPlaceholder] = useState("")
  // Mobilde başlangıçta sidebar kapalı olsun (direkt chat ekranı açılsın)
  // SSR hydration mismatch'i önlemek için başlangıçta false, useEffect'te güncellenecek
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [pdfGeneratingDots, setPdfGeneratingDots] = useState(1)
  const [limits, setLimits] = useState<{
    messages: { used: number; limit: number; remaining: number };
    videos: { used: number; limit: number; remaining: number };
  } | null>(null)
  
  const { toast } = useToast()
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [showDiagnosisWarningDialog, setShowDiagnosisWarningDialog] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const historyLoadedRef = useRef(false) // İki kere yüklenmesini önlemek için

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null

  useEffect(() => {
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "tr-TR"
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setCurrentInput((prev) => (prev ? prev + " " + transcript : transcript))
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [])


  // NOT: localStorage'dan yükleme kaldırıldı - sadece backend'den yüklüyoruz
  // Bu daha basit ve tutarlı. Backend zaten hızlı.

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Sadece cache'de mesajları olan chatleri kaydet (silinen chatleri filtrele)
      const validHistory = chatHistory.filter((chat) => {
        return getCachedChatMessages(chat.id) !== null
      })
      if (validHistory.length > 0) {
        cacheChatHistory(validHistory)
      } else {
        // Eğer hiç geçerli chat yoksa, cache'den chat history'yi temizle
        // (storage utility içinde handle ediliyor)
      }
      // Eğer bazı chatler silinmişse, state'i de güncelle
      if (validHistory.length !== chatHistory.length) {
        setChatHistory(validHistory)
      }
    }
  }, [chatHistory])

  // Save current chat messages to localStorage
  useEffect(() => {
    if (!selectedChatId) return
  
    if (messages.length > 1) {
      cacheChatMessages(selectedChatId, messages)
    }
  }, [messages, selectedChatId])

  // Cache cleanup on mount (eski cache'leri temizle)
  useEffect(() => {
    cleanupOldCache()
  }, [])
  


  /* =========================
     ANALYZE API ÇAĞRISI
     (TASARIMA DOKUNMADAN)
  ========================= */
  const callChatAPI = async (
    payload: { message: string },
    onComplete?: () => void,
    retryCount: number = 0 // Recursive call için retry sayacı
  ) => {
    // Text mesajı için typing indicator göster (retry durumunda da aktif kalmalı)
    setIsTyping(true);
  
    // Declare variables outside try block so they're accessible in catch
    let user_id = getOrCreateGuestUserId()
    // Ref kullanarak güncel değeri al (state güncellemesi asenkron olabilir)
    const chat_id = selectedChatIdRef.current
    // Retry flag - eğer retry yapılacaksa finally bloğunda isTyping'i false yapma
    let willRetry = false
  
    try {
      // KRİTİK: user_id null ise veya bootstrapGuest promise'i varsa, promise'i bekle
      if (!user_id || bootstrapGuestPromiseRef.current) {
        logger.warn("User ID not found or bootstrap in progress, waiting for bootstrapGuest...")
        user_id = await bootstrapGuest()
        
        // Hala null ise hata fırlat
        if (!user_id) {
          throw new Error("User ID bulunamadı. Lütfen sayfayı yenileyin.")
        }
      }
  
      // Sadece JSON gönder (medya upload kaldırıldı)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload.message,
          user_id,
          ...(chat_id ? { chat_id } : {}),
        }),
      })
  
      // KRİTİK: 504/503 timeout hatalarını önce kontrol et
      if (res.status === 504 || res.status === 503) {
        throw new Error("Analiz zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.");
      }

      // KRİTİK: JSON parse hatası durumunda handle et
      let data: any = null;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          // JSON değilse, response text'ini oku
          const text = await res.text();
          logger.error("Chat API - Non-JSON response", new Error(text.substring(0, 200)), { user_id, chat_id, status: res.status });
          throw new Error("Sunucu hatası. Lütfen daha sonra tekrar deneyin.");
        }
      } catch (parseError: any) {
        // JSON parse hatası veya non-JSON response
        if (parseError.message && !parseError.message.includes("Sunucu hatası")) {
          logger.error("Chat API - JSON parse error", parseError as Error, { user_id, chat_id, status: res.status });
        }
        // 504/503 hatası zaten yukarıda handle edildi
        if (res.status === 504 || res.status === 503) {
          throw new Error("Analiz zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.");
        }
        throw new Error("Sunucu hatası. Lütfen daha sonra tekrar deneyin.");
      }

      if (!res.ok) {
        // User bulunamadı hatası mı kontrol et (404 + USER_NOT_FOUND kodu)
        if (res.status === 404 && data?.code === "USER_NOT_FOUND") {
          // Sonsuz döngüyü önle - sadece 1 kez retry yap
          if (retryCount >= 1) {
            throw new Error("Kullanıcı oluşturulamadı. Lütfen sayfayı yenileyin.");
          }
          
          // User Firebase'den silinmiş, yeniden oluştur
          logger.warn("User not found in Firebase, recreating...", { user_id });
          // LocalStorage'dan user_id'yi temizle
          if (typeof window !== "undefined") {
            localStorage.removeItem("nvu_user_id");
          }
          // Yeni user oluştur
          const newUserId = await bootstrapGuest();
          if (!newUserId) {
            throw new Error("Kullanıcı oluşturulamadı. Lütfen sayfayı yenileyin.");
          }
          // KRİTİK: Retry yapılacak, finally bloğunda isTyping'i false yapma
          willRetry = true;
          // KRİTİK: Retry yapmadan önce typing indicator'ı tekrar aktif et
          setIsTyping(true);
          // Aynı mesajı yeni user_id ile tekrar gönder (sadece JSON)
          const newPayload = {
            message: payload.message,
            user_id: newUserId,
            ...(chat_id ? { chat_id } : {}),
          };
          return callChatAPI(newPayload, onComplete, retryCount + 1);
        }
        
        // Limit hatası mı kontrol et
        if (data?.limit_reached) {
          // Limit durumunu güncelle (hata olsa bile)
          if (data.limits) {
            setLimits(data.limits);
          }
          const errorMessage = data?.error || "Limit doldu.";
          throw new Error(errorMessage);
        }
        // Diğer hatalar
        const errorMessage = data?.error || "Bir hata oluştu. Lütfen tekrar deneyin.";
        throw new Error(errorMessage);
      }

      if (!data?.content) {
        throw new Error("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
      
      // KRİTİK: Chat ID sadece backend'de üretilir, frontend'de değil!
      // Backend'den dönen chat_id'yi her zaman kullan (tek kaynak gerçeği)
      if (data.chat_id) {
        // Eğer selectedChatId varsa ve backend'den dönen chat_id farklıysa, bu bir bug!
        if (selectedChatId && selectedChatId !== data.chat_id) {
          logger.warn("Chat ID mismatch", { frontend: selectedChatId, backend: data.chat_id });
        }
        // Backend'den dönen chat_id'yi set et (tek kaynak gerçeği)
        setSelectedChatId(data.chat_id);
        selectedChatIdRef.current = data.chat_id;
      }

      // Limit durumunu güncelle
      if (data.limits) {
        setLimits(data.limits);
      }
      
  
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: data.content,
        timestamp: new Date(),
      }
  
      setMessages((prev) => {
        const updated = [...prev, aiMessage]
        // KRİTİK: Mesajları timestamp'e göre sırala (en eski -> en yeni)
        updated.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        if (onComplete) setTimeout(onComplete, 0)
        return updated
      })
    } catch (error: any) {
      logger.error("Chat API error", error, { user_id, chat_id });
      const errorMessage = error.message || "⚠️ Bir hata oluştu. Lütfen tekrar deneyin.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "ai",
          content: errorMessage.includes("User ID") 
            ? "⚠️ Oturum hatası. Lütfen sayfayı yenileyin."
            : errorMessage,
          timestamp: new Date(),
        },
      ])
    } finally {
      // Retry yapılacaksa isTyping'i false yapma (retry sırasında animasyon görünmeli)
      if (!willRetry) {
        setIsTyping(false)
      }
      setIsGeneratingPDF(false) // KRİTİK: Hata durumunda da false yap
    }
  }
  
  
  // Limit kontrolü fonksiyonu
  const isLimitReached = () => {
    if (!limits) return false;
    // Mesaj limiti kaldırıldı, sadece video limiti kontrol ediliyor
    return false; // Mesaj limiti yok, her zaman false döndür
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;
    if (isGeneratingPDF) return; // PDF oluşturulurken mesaj göndermeyi engelle

    // Chat ID yoksa yeni oluştur (DB ile uyumlu olması için API'den döneni bekleyeceğiz)
    const tempChatId = selectedChatId; 
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      // KRİTİK: Mesajları timestamp'e göre sırala (en eski -> en yeni)
      updated.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
      return updated;
    });
    const messageContent = currentInput;
    setCurrentInput("");
    // Mesaj gönderildikten sonra placeholder'ı sıfırla
    setVehicleInfoPlaceholder("");

    // Turuncu üç nokta göster (typing indicator)
    setIsTyping(true);

    // API Çağrısı
    await callChatAPI({ message: messageContent }, () => {
      // API'den dönen data.chat_id sayesinde selectedChatId güncellenmiş olacak
      // Sidebar'daki listeyi yenile (loading animasyonu gösterme - sadece sidebar güncellenecek)
      refreshChatHistory(false); 
    });
  };
  
  const refreshChatHistory = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingHistory(true); // Loading başlat (sadece ilk yüklemede)
    }
    try {
      let user_id = getOrCreateGuestUserId();
      
      // KRİTİK: user_id yoksa history yükleme (gereksiz user oluşturmayı önlemek için)
      // User ID sadece ilk mesaj gönderildiğinde oluşturulacak
      if (!user_id) {
        logger.warn("User ID bulunamadı, history yüklenemedi (user henüz oluşturulmadı)", {});
        if (showLoading) setIsLoadingHistory(false);
        return;
      }
      
      const res = await fetch(`/api/history?user_id=${user_id}`);
      
      if (!res.ok) {
        // 404 veya diğer hatalar - user yoksa boş array dönecek, bu normal
        if (res.status === 404) {
          logger.debug("User not found in history API (user henüz oluşturulmadı)", { user_id });
          // Boş array ile devam et
          if (showLoading) setIsLoadingHistory(false);
          setChatHistory([]);
          return;
        }
        // Diğer hatalar için log at ama UI'ı bozma
        logger.warn("History API error", { status: res.status, user_id });
        if (showLoading) setIsLoadingHistory(false);
        setChatHistory([]); // Boş array ile devam et
        return;
      }
      
      let data: any = [];
      try {
        data = await res.json();
        // Eğer data array değilse (hata mesajı gibi), boş array kullan
        if (!Array.isArray(data)) {
          logger.warn("History API returned non-array response", { data });
          data = [];
        }
      } catch (parseError) {
        logger.warn("History JSON parse error", { error: parseError, user_id });
        data = []; // Boş array ile devam et
        if (showLoading) setIsLoadingHistory(false);
        setChatHistory([]);
        return;
      }
      
      // KRİTİK: chat_id undefined kontrolü - geçersiz chat'leri filtrele
      const formattedHistory = data
        .filter((chat: any) => chat.id && chat.id.trim() !== "") // chat_id undefined veya boş olanları atla
        .map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp)
        }));
      
      // State güncellemelerini senkronize et - blink efektini önlemek için
      // Önce chat history'yi set et
      setChatHistory(formattedHistory);
      cacheChatHistory(formattedHistory);
      
      // Loading'i sadece showLoading true ise kapat
      if (showLoading) {
        // Loading'i bir sonraki render cycle'da kapat
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsLoadingHistory(false);
          });
        });
      }
    } catch (err) {
      logger.error("Geçmiş yüklenemedi", err as Error);
      if (showLoading) setIsLoadingHistory(false); // Hata durumunda da loading'i kapat
    }
  };

  // Sayfa ilk açıldığında DB'den geçmişi çek
  // KRİTİK: React Strict Mode'da iki kere çalışmasını önlemek için flag kullanıyoruz
  useEffect(() => {
    if (historyLoadedRef.current) return; // Zaten yüklendiyse tekrar yükleme
    historyLoadedRef.current = true;
    refreshChatHistory(true); // İlk yüklemede loading göster
  }, []);

  // İlk yüklemede welcome mesajını ekle ve mobil kontrolü yap (hydration mismatch'i önlemek için)
  useEffect(() => {
    // Welcome mesajını ekle (sadece boşsa)
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "ai",
          content:
            "Merhaba! Ben NesiVarUsta Analiz Asistanı ✨. Araç marka–model–yıl ve yaşadığınız sorunu yazarsanız ön analiz yapabilirim.",
          timestamp: new Date(),
        },
      ]);
    }
   }, [messages.length]);
   
   // Textarea yüksekliğini dinamik olarak ayarla
   useEffect(() => {
     const textarea = textareaRef.current;
     if (textarea) {
       // Reset height to auto to get the correct scrollHeight
       textarea.style.height = 'auto';
       // Set height based on scrollHeight, with min and max constraints
       const scrollHeight = textarea.scrollHeight;
        const minHeight = window.innerWidth < 768 ? 36 : 36; // min-h-[32px] md:min-h-[36px]
        const maxHeight = window.innerWidth < 768 ? 96 : 128; // max-h-24 md:max-h-32
       const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
       textarea.style.height = `${newHeight}px`;
       // Scrollbar'ı gizle
       textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
     }
   }, [currentInput]);
   
   // Mobilde sayfa açıldığında sidebar'ı kapat
  useEffect(() => {
    // İlk yüklemede mobil kontrolü yap
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
    
    // Resize olduğunda da güncelle
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Android ve iOS için dinamik viewport height hesaplama
  useEffect(() => {
    // iOS için initial height'ı sakla (klavye açıldığında değişmesin)
    let initialHeight = window.innerHeight;
    
    // iOS detection - tüm iOS cihazları kapsar (iPhone, iPad, iPod)
    const isIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS 13+
      ) && !(window as any).MSStream;
    };
    
    const isIOSDevice = isIOS();
    
    const setViewportHeight = () => {
      let vh: number;
      
      if (isIOSDevice) {
        // iOS'ta klavye açıldığında initial height'ı koru
        // Sadece orientation change veya URL bar değişiminde güncelle
        const currentHeight = window.innerHeight;
        // Eğer height çok fazla küçüldüyse (klavye açıldı), initial height'ı kullan
        // %75 threshold - klavye genelde viewport'un %30-40'ını alır
        if (currentHeight < initialHeight * 0.75) {
          // Klavye açık, initial height'ı koru
          vh = initialHeight * 0.01;
        } else {
          // URL bar değişimi veya normal resize
          vh = currentHeight * 0.01;
          initialHeight = currentHeight; // Initial height'ı güncelle
        }
      } else {
        // Android için normal hesaplama (tüm Android tarayıcıları: Chrome, Samsung Internet, vs.)
        vh = window.innerHeight * 0.01;
      }
      
      // CSS variable olarak set et
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // İlk yüklemede set et
    setViewportHeight();

    // Orientation change'de initial height'ı sıfırla
    const handleOrientationChange = () => {
      // Orientation change'den sonra biraz bekle (iOS'ta gecikme olabilir)
      setTimeout(() => {
        initialHeight = window.innerHeight;
        setViewportHeight();
      }, 100);
    };

    // Resize event'i için throttling
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setViewportHeight();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Visual Viewport API varsa onu da dinle (iOS'ta daha iyi çalışır)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        // Visual viewport sadece URL bar değişimlerini yakalar, klavye değil
        if (!isIOSDevice || window.visualViewport!.height > initialHeight * 0.75) {
          setViewportHeight();
        }
      });
    }

    // Klavye kapandığında initial height'ı güncelle
    const handleFocusOut = () => {
      setTimeout(() => {
        if (window.innerHeight > initialHeight * 0.9) {
          initialHeight = window.innerHeight;
          setViewportHeight();
        }
      }, 300);
    };

    // Textarea focus out'u dinle
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('blur', handleFocusOut);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }
      if (textarea) {
        textarea.removeEventListener('blur', handleFocusOut);
      }
    };
  }, []);

  // Chat sayfasında body scroll'u kilitle
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Mobilde chat listesi açıkken body scroll'u engelle
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && !sidebarCollapsed) {
      // Chat listesi açıkken body scroll'u engelle
      document.body.style.overflow = "hidden";
    } else {
      // Chat listesi kapalıyken veya desktop'ta normal scroll
      document.body.style.overflow = "hidden"; // Chat sayfasında her zaman hidden
    }
    
    return () => {
      document.body.style.overflow = "hidden"; // Chat sayfasında her zaman hidden
    };
  }, [sidebarCollapsed]);


  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  // Text temizleme fonksiyonu: Sadece text ve sayıları bırak, emoji ve noktalama işaretlerini kaldır
  const cleanTextForSpeech = (text: string): string => {
    // HTML tag'lerini kaldır (eğer varsa)
    let cleaned = text.replace(/<[^>]*>/g, ' ');
    
    // Emoji'leri kaldır (Unicode emoji range)
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols
    cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs
    
    // Noktalama işaretlerini ve özel karakterleri kaldır (Türkçe karakterleri koru)
    // Sadece harf (Türkçe dahil), sayı ve boşluk bırak
    cleaned = cleaned.replace(/[^\p{L}\p{N}\s]/gu, ' '); // Unicode Letter, Number ve boşluk
    
    // Çoklu boşlukları tek boşluğa çevir
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  // Türkçe dil paketi kontrolü
  const checkTurkishLanguagePack = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    // Sesler asenkron yüklenir, bu yüzden önce sesleri yüklemeyi dene
    let voices = window.speechSynthesis.getVoices();
    
    // Eğer sesler henüz yüklenmediyse, onvoiceschanged event'ini bekle
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 500); // 500ms timeout
        window.speechSynthesis.onvoiceschanged = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
      voices = window.speechSynthesis.getVoices();
    }

    const hasTurkishVoice = voices.some(voice => 
      voice.lang.toLowerCase().includes('tr') || 
      voice.lang.toLowerCase().includes('turkish')
    );

    return hasTurkishVoice;
  };

  const speakText = async (text: string, messageId?: string) => {
    // Eğer başka bir mesaj okunuyorsa, yeni mesajı okuma
    if (isSpeaking && currentlySpeakingMessageId !== messageId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TTS Frontend] Başka bir mesaj okunuyor, yeni mesaj okunamaz`);
      }
      return; // Başka mesaj okunuyor, yeni mesaj okunamaz
    }
    
    // Eğer aynı mesaj okunuyorsa, sadece durdur
    if (isSpeaking && currentlySpeakingMessageId === messageId) {
      shouldContinueRef.current = false; // Durdur
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      setIsSpeaking(false);
      setCurrentlySpeakingMessageId(null);
      return;
    }

    // Yeni okuma başlıyor, ref'i true yap
    shouldContinueRef.current = true;

    // Türkçe dil paketi kontrolü
    const hasTurkishPack = await checkTurkishLanguagePack();
    if (!hasTurkishPack) {
      toast({
        title: "Türkçe Dil Paketi Bulunamadı",
        description: "Sisteminizde Türkçe dil paketi yüklü değil. Sesli okuma Google Translate servisi üzerinden yapılacak.",
        variant: "default",
      });
    }

    setIsSpeaking(true);
    if (messageId) {
      setCurrentlySpeakingMessageId(messageId);
    }

    // KRİTİK: Ref kullan (React state async güncellenir, loop'ta sorun çıkarır)
    // shouldContinueRef zaten yukarıda true yapıldı

    try {
      // Text'i temizle: Sadece text ve sayıları bırak
      const cleanedText = cleanTextForSpeech(text);
      
      // Eğer temizlenmiş text boşsa, okuma
      if (!cleanedText || cleanedText.trim().length === 0) {
        setIsSpeaking(false);
        setCurrentlySpeakingMessageId(null);
        return;
      }

      // Backend'den Türkçe TTS audio stream al
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: cleanedText }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Response tipini kontrol et (audio/mpeg veya application/json)
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        // Birden fazla parça var, sırayla oynat
        const data = await response.json();
        const chunks = data.chunks || [];
        
        if (chunks.length === 0) {
          throw new Error("Audio parçaları alınamadı");
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[TTS Frontend] Playing ${chunks.length} audio chunks`);
        }
        
        // Parçaları sırayla oynat - BASİT VE GÜVENİLİR YAKLAŞIM
        for (let i = 0; i < chunks.length; i++) {
          // Ref'i kontrol et (state yerine)
          if (!shouldContinueRef.current) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[TTS Frontend] Stopped by user (ref check)`);
            }
            break;
          }
          
          const chunk = chunks[i];
          if (process.env.NODE_ENV === 'development') {
            console.log(`[TTS Frontend] Processing chunk ${i + 1}/${chunks.length}, data URL length: ${chunk.audio?.length || 0}`);
          }
          
          // Base64 data URL'in geçerli olduğunu kontrol et
          if (!chunk.audio || !chunk.audio.startsWith('data:audio/mpeg;base64,')) {
            logger.error(`[TTS Frontend] Invalid audio data URL for chunk ${i + 1}`, new Error("Invalid audio data URL"), { chunkIndex: i + 1 });
            continue;
          }
          
          // Audio element oluştur
          const audio = new Audio(chunk.audio);
          audio.playbackRate = 1.1;
          if (process.env.NODE_ENV === 'development') {
            console.log(`[TTS Frontend] Audio element created for chunk ${i + 1}, readyState: ${audio.readyState}`);
          }
          
          // İlk parça için ref'e kaydet (durdurmak için)
          if (i === 0) {
            audioRef.current = audio;
          }
          
          // Her parça bitene kadar bekle - BASİT YAKLAŞIM
          try {
            await new Promise<void>((resolve, reject) => {
            let resolved = false;
            
            const cleanup = () => {
              if (!resolved) {
                resolved = true;
                audio.pause();
                audio.src = '';
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
                audio.removeEventListener('canplaythrough', handleCanPlay);
                audio.removeEventListener('loadeddata', handleLoaded);
              }
            };
            
            const handleEnded = () => {
              if (process.env.NODE_ENV === 'development') {
                console.log(`[TTS Frontend] Chunk ${i + 1}/${chunks.length} finished`);
              }
              cleanup();
              resolve();
            };
            
            const handleError = (error: any) => {
              logger.error(`[TTS Frontend] Error playing chunk ${i + 1}`, error as Error, { chunkIndex: i + 1, audioError: audio.error });
              cleanup();
              reject(error || new Error(`Audio playback failed for chunk ${i + 1}`));
            };
            
            const handleCanPlay = () => {
              if (resolved) return;
              if (process.env.NODE_ENV === 'development') {
                console.log(`[TTS Frontend] Chunk ${i + 1} can play through`);
              }
              playAudio();
            };
            
            const handleLoaded = () => {
              if (resolved) return;
              if (process.env.NODE_ENV === 'development') {
                console.log(`[TTS Frontend] Chunk ${i + 1} loaded`);
              }
              playAudio();
            };
            
            const playAudio = async () => {
              if (resolved) return;
              
              // Ref'i kontrol et (state yerine)
              if (!shouldContinueRef.current) {
                cleanup();
                resolve();
                return;
              }
              
              try {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[TTS Frontend] Attempting to play chunk ${i + 1}`);
                }
                await audio.play();
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[TTS Frontend] ✅ Chunk ${i + 1}/${chunks.length} started playing successfully`);
                }
              } catch (err: any) {
                logger.error(`[TTS Frontend] ❌ Play error for chunk ${i + 1}`, err as Error, { chunkIndex: i + 1 });
                cleanup();
                reject(err);
              }
            };
            
            // Event listener'ları ekle
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('error', handleError);
            audio.addEventListener('canplaythrough', handleCanPlay);
            audio.addEventListener('loadeddata', handleLoaded);
            
            // İlk parça için delay, diğerleri için direkt oynat
            if (i === 0) {
              // İlk parça için 150ms delay
              setTimeout(() => {
                if (!resolved && audio.readyState >= 2) {
                  playAudio();
                } else if (!resolved) {
                  // Audio henüz yüklenmedi, event'ler dinleniyor
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[TTS Frontend] Waiting for chunk ${i + 1} to load...`);
                  }
                }
              }, 150);
            } else {
              // Diğer parçalar için direkt oynat (ama yine de yüklenmeyi bekle)
              if (audio.readyState >= 2) {
                playAudio();
              } else {
                console.log(`[TTS Frontend] Waiting for chunk ${i + 1} to load...`);
              }
            }
            
            // Timeout fallback (5 saniye)
            setTimeout(() => {
              if (!resolved) {
                logger.warn(`[TTS Frontend] ⚠️ Timeout waiting for chunk ${i + 1}`, { chunkIndex: i + 1 });
                if (audio.readyState >= 2) {
                  playAudio();
                } else {
                  cleanup();
                  reject(new Error(`Timeout waiting for chunk ${i + 1} to load`));
                }
              }
            }, 5000);
            });
          } catch (err: any) {
            logger.error(`[TTS Frontend] Failed to play chunk ${i + 1}`, err as Error, { chunkIndex: i + 1 });
            // Devam et, bir sonraki chunk'ı dene
            continue;
          }
        }
        
        // Tüm parçalar bitti
        setIsSpeaking(false);
        setCurrentlySpeakingMessageId(null);
        audioRef.current = null;
      } else {
        // Tek parça, normal oynat
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Audio element oluştur ve oynat
        const audio = new Audio(audioUrl);
        
        // KRİTİK: Sesli okuma hızını artır (1.2x = %20 daha hızlı)
        audio.playbackRate = 1.1;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Memory temizle
          setIsSpeaking(false);
          setCurrentlySpeakingMessageId(null);
          audioRef.current = null;
        };

        audio.onerror = (error) => {
          logger.error("Audio playback error", new Error(`Audio playback error: ${audio.error?.message || 'Unknown error'}`));
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          setCurrentlySpeakingMessageId(null);
          audioRef.current = null;
        };

        // KRİTİK: Audio'nun tam yüklenmesini bekle (başlangıçta ses kesilmesin)
        await new Promise<void>((resolve) => {
          if (audio.readyState >= 2) {
            // Audio zaten yüklendi, küçük delay ekle
            setTimeout(() => resolve(), 150); // 150ms delay
          } else {
            // Audio yüklenene kadar bekle
            audio.oncanplaythrough = () => {
              setTimeout(() => resolve(), 150); // 150ms ekstra delay
            };
            // Timeout fallback (1 saniye sonra yine de başlat)
            setTimeout(() => resolve(), 1000);
          }
        });
        
        // Audio'yu başlat
        await audio.play();
        
        // Ref'e kaydet (durdurmak için)
        audioRef.current = audio;
      }
    } catch (error: any) {
      logger.error("TTS Error", error as Error);
      shouldContinueRef.current = false; // Ref'i false yap
      setIsSpeaking(false);
      setCurrentlySpeakingMessageId(null);
      alert("Sesli okuma sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }


  const handleChatSelect = async (chatId: string) => {
    // KRİTİK: chat_id undefined kontrolü
    if (!chatId || chatId.trim() === "") {
      logger.warn("Geçersiz chat ID, mesajlar yüklenemedi", {});
      return;
    }
    
    setSelectedChatId(chatId);
    selectedChatIdRef.current = chatId;
    
    // 1. Önce LocalStorage'dan hızlıca yükle (Kullanıcı beklemesin)
    // NOT: LocalStorage'dan yükleme kaldırıldı - sadece backend'den yüklüyoruz
    // Bu daha güvenilir ve sıralama sorunlarını önler

    // 2. Arka planda Firestore'dan en güncel mesajları çek (Gerçek zamanlı garanti)
    try {
      const user_id = getOrCreateGuestUserId();
      
      // KRİTİK: user_id null kontrolü
      if (!user_id) {
        logger.warn("User ID bulunamadı, DB'den mesajlar yüklenemedi", {});
        return;
      }
      
      const res = await fetch(`/api/chat?chat_id=${chatId}&user_id=${user_id}`);
      
      if (!res.ok) {
        logger.error("Chat API error", new Error(`Chat API error: ${res.status}`), { status: res.status });
        return;
      }
      
      let dbMessages: any = [];
      try {
        dbMessages = await res.json();
      } catch (parseError) {
        logger.error("Chat JSON parse error", parseError as Error);
        return;
      }
      
      if (dbMessages && dbMessages.length > 0) {
        // Backend'den mesajlar zaten sıralı geliyor (orderBy("created_at", "asc"))
        // Timestamp'leri Date objesine çevir
        const formattedMessages = dbMessages.map((msg: any) => {
          // Timestamp'i parse et - ISO string veya Date objesi olabilir
          let timestamp: Date;
          if (typeof msg.timestamp === 'string') {
            timestamp = new Date(msg.timestamp);
          } else if (msg.timestamp instanceof Date) {
            timestamp = msg.timestamp;
          } else {
            timestamp = new Date(); // Fallback
          }
          
          return {
            ...msg,
            timestamp: timestamp
          };
        });
        
        // KRİTİK: Mesajları timestamp'e göre sırala (en eski -> en yeni)
        // Backend'den zaten sıralı geliyor ama güvenlik için tekrar sırala
        formattedMessages.sort((a: any, b: any) => {
          const timeA = a.timestamp.getTime();
          const timeB = b.timestamp.getTime();
          return timeA - timeB; // En eski -> en yeni
        });
        
        setMessages(formattedMessages);
        // Cache'i de senkronize et
        cacheChatMessages(chatId, formattedMessages);
      } else {
        // Eğer DB'de mesaj yoksa, açılış mesajını göster
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          type: "ai",
          content: "Merhaba! Ben NesiVarUsta Analiz Asistanı ✨. Araç marka–model–yıl ve yaşadığınız sorunu yazarsanız ön analiz yapabilirim.",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      logger.error("DB'den mesajlar alınamadı", error as Error);
    }

    if (window.innerWidth < 768) setSidebarCollapsed(true);
  };

  const handleDownloadChat = () => {
    const chatContent = messages
      .map(
        (msg) =>
          `[${msg.timestamp.toLocaleString("tr-TR")}] ${msg.type === "user" ? "Kullanıcı" : "NesiVarUsta Analiz Asistanı ✨"}: ${msg.content}`,
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

  // Araç bilgilerini chat mesajlarından çıkar - AI model ile
  const extractVehicleInfo = async (userMessages: ChatMessage[]) => {
    try {
      const userMessagesText = userMessages.map(msg => msg.content);
      
      const response = await fetch("/api/chat/extract-vehicle-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessages: userMessagesText,
        }),
      });

      if (!response.ok) {
        throw new Error("Araç bilgileri çıkarılamadı");
      }

      const vehicleInfo = await response.json();
      return vehicleInfo;
    } catch (error) {
      logger.error("[ExtractVehicleInfo] Hata", error as Error);
      // Hata durumunda boş obje döndür
      return {
        marka: "",
        model: "",
        yil: "",
        km: ""
      };
    }
  };

  const handleDownloadPDFContinue = async () => {
    // Üst üste PDF oluştur isteği atılmasını önle
    if (isGeneratingPDF) {
      return;
    }

    const user_id = getOrCreateGuestUserId();
    const chatId = selectedChatId;

    if (!user_id || !chatId) {
      alert("PDF raporu oluşturmak için bir chat seçmeniz gerekiyor.");
      return;
    }

    // Welcome message ve placeholder mesajları hariç filtrele
    const validMessages = messages.filter((msg) => {
      // Welcome message'ı atla
      if (msg.id === "welcome") return false;
      // "📎 Medya gönderildi, analiz ediliyor..." placeholder mesajını atla (sadece UI'da gösteriliyor, Firestore'da yok)
      if (msg.content === "📎 Medya gönderildi, analiz ediliyor...") return false;
      return true;
    });
    const userMessages = validMessages.filter((msg) => msg.type === "user");
    const aiMessages = validMessages.filter((msg) => msg.type === "ai");

    // PDF oluşturma başladı - butonları disable et (extractVehicleInfo çağrısı sırasında da disable olsun)
    setIsGeneratingPDF(true);

    // 4️⃣ Araç bilgilerini kontrol et
    const vehicleInfo = await extractVehicleInfo(userMessages);
    const missingFields: string[] = [];
    if (!vehicleInfo.marka) missingFields.push("Marka");
    if (!vehicleInfo.model) missingFields.push("Model");
    if (!vehicleInfo.yil) missingFields.push("Yıl");
    if (!vehicleInfo.km) missingFields.push("KM");

    // Eksik bilgiler varsa modal göster
    if (missingFields.length > 0) {
      // Placeholder formatını oluştur: Mevcut bilgileri göster, eksikleri "?" ile işaretle
      // Örnek: "Marka: AUDI Model: ? Yıl: 2024 KM: ?"
      const placeholderParts: string[] = [];
      placeholderParts.push(`Marka: ${vehicleInfo.marka || "?"}`);
      placeholderParts.push(`Model: ${vehicleInfo.model || "?"}`);
      placeholderParts.push(`Yıl: ${vehicleInfo.yil || "?"}`);
      placeholderParts.push(`KM: ${vehicleInfo.km || "?"}`);
      const placeholder = placeholderParts.join(" ");
      
      setMissingVehicleFields(missingFields);
      setVehicleInfoPlaceholder(placeholder);
      setShowVehicleInfoDialog(true);
      // Modal gösterildiğinde isGeneratingPDF'i false yap (kullanıcı bilgi girebilsin)
      setIsGeneratingPDF(false);
      return; // PDF oluşturmayı durdur, kullanıcı bilgileri eklesin
    }

    try {
      // isGeneratingPDF zaten true (yukarıda set edildi)
      setPdfGeneratingDots(1); // Animasyonu başlat
      
      // Chat'e "PDF oluşturuluyor" mesajı ekle (animasyonlu noktalarla)
      const pdfMessageId = `pdf-generating-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: pdfMessageId,
          type: "ai",
          content: "📄 PDF raporu oluşturuluyor.",
          timestamp: new Date(),
        },
      ]);
      
      // Animasyonlu noktalar için interval
      const dotsInterval = setInterval(() => {
        setPdfGeneratingDots((prev) => {
          const next = prev >= 3 ? 1 : prev + 1;
          // Mesajı güncelle
          setMessages((prevMsgs) => {
            const index = prevMsgs.findIndex((msg) => msg.id === pdfMessageId);
            if (index !== -1) {
              const newMsgs = [...prevMsgs];
              newMsgs[index] = {
                ...newMsgs[index],
                content: `📄 PDF raporu oluşturuluyor${".".repeat(next)}`,
              };
              return newMsgs;
            }
            return prevMsgs;
          });
          return next;
        });
      }, 500); // Her 500ms'de bir güncelle
      
      // Interval'i temizlemek için global'a kaydet
      (window as any).pdfDotsInterval = dotsInterval;

      // API'ye istek at (HTML döndürüyor, Puppeteer yok!)
      const response = await fetch("/api/chat/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: user_id,
        }),
      });

      if (!response.ok) {
        // Hata durumunda JSON response bekliyoruz
        const errorData = await response.json().catch(() => ({ error: "PDF oluşturulamadı" }));
        throw new Error(errorData.error || "PDF oluşturulamadı");
      }

      // API artık pdfmake document definition döndürüyor (JSON formatında)
      const data = await response.json();
      const { pdfmake, reportNumber } = data;
      
      // pdfmake'i TEK BİR YERDEN al (lib/pdfmake.ts - font init burada yapılıyor)
      const { getPdfMake } = await import('@/lib/pdfmake');
      const pdfMakeInstance = getPdfMake();
      
      // ⚠️ KRİTİK: documentDefinition'a fonts EKLEME! Fontlar pdfMakeInstance.fonts'da tanımlı
      // Backend'den gelen pdfmake zaten font: 'Poppins' içeriyor, bu yeterli
      
      // pdfmake ile PDF oluştur - sayfa kırılmalarını OTOMATIK yönetir!
      // PDF oluşturma işlemini try-catch ile sar (hata durumunda başarı mesajı gösterme)
      try {
        pdfMakeInstance.createPdf(pdfmake).download(`NesiVarUsta-Rapor-${reportNumber || new Date().toISOString().split("T")[0]}.pdf`);
        
        // Sadece PDF başarıyla indirildiyse başarı mesajı göster
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
          return [
            ...filtered,
            {
              id: `pdf-success-${Date.now()}`,
              type: "ai",
              content: "✅ PDF raporu başarıyla oluşturuldu ve indirildi.",
              timestamp: new Date(),
            },
          ];
        });
      } catch (pdfError: any) {
        // PDF oluşturma/indirme hatası
        throw new Error(`PDF oluşturma hatası: ${pdfError.message || "Bilinmeyen hata"}`);
      }
    } catch (error: any) {
      logger.error("PDF oluşturma hatası", error as Error);
      
      // "PDF oluşturuluyor" mesajını kaldır ve hata mesajı ekle
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
        return [
          ...filtered,
          {
            id: `pdf-error-${Date.now()}`,
            type: "ai",
            content: `❌ PDF raporu oluşturulurken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
            timestamp: new Date(),
          },
        ];
      });
      
      alert(
        error.message || "PDF raporu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsGeneratingPDF(false);
      // Animasyon interval'ini temizle
      if ((window as any).pdfDotsInterval) {
        clearInterval((window as any).pdfDotsInterval);
        delete (window as any).pdfDotsInterval;
      }
    }
  }

  const handleDownloadPDF = async () => {
    // Üst üste PDF oluştur isteği atılmasını önle
    if (isGeneratingPDF) {
      return;
    }

    setShowMoreMenu(false); // Menüyü hemen kapat
    const user_id = getOrCreateGuestUserId();
    const chatId = selectedChatId;

    if (!user_id || !chatId) {
      alert("PDF raporu oluşturmak için bir chat seçmeniz gerekiyor.");
      setShowMoreMenu(false);
      return;
    }

    // Welcome message ve placeholder mesajları hariç filtrele
    const validMessages = messages.filter((msg) => {
      // Welcome message'ı atla
      if (msg.id === "welcome") return false;
      // "📎 Medya gönderildi, analiz ediliyor..." placeholder mesajını atla (sadece UI'da gösteriliyor, Firestore'da yok)
      if (msg.content === "📎 Medya gönderildi, analiz ediliyor...") return false;
      return true;
    });
    const userMessages = validMessages.filter((msg) => msg.type === "user");
    const aiMessages = validMessages.filter((msg) => msg.type === "ai");

    // 1️⃣ Minimum mesaj sayısı kontrolü (en az 6 mesaj)
    if (validMessages.length < 6) {
      alert(
        "PDF raporu oluşturmak için en az 6 mesaj gereklidir. Lütfen daha fazla mesaj ekleyin."
      );
      setShowMoreMenu(false);
      return;
    }

    // 2️⃣ En az 2 kullanıcı mesajı ve 2 AI mesajı olmalı
    if (userMessages.length < 2 || aiMessages.length < 2) {
      alert(
        "PDF raporu oluşturmak için en az 2 kullanıcı mesajı ve 2 AI mesajı gereklidir."
      );
      setShowMoreMenu(false);
      return;
    }

    // 3️⃣ AI'nin teşhis yapmış olması kontrolü (PROFESYONEL KONTROL)
    // Sadece soru soran mesajları filtrele, gerçek teşhis/çözüm önerisi olan mesajları kontrol et
    const hasDiagnosis = aiMessages.some((msg) => {
      const content = msg.content.toLowerCase();
      
      // ❌ SORU İÇEREN MESAJLARI FİLTRELE (teşhis değil)
      const isQuestionOnly = 
        /(\?|soru|nedir|ne|hangi|kaç|nasıl|neden\s+soruyor|bilgi\s+eksik|verin|lütfen\s+şu\s+bilgileri)/i.test(content) &&
        !/(teşhis|neden|sebep|olası|muhtemel|çözüm|öneri|yapılmalı|değiştir|tamir)/i.test(content);
      
      if (isQuestionOnly) return false; // Sadece soru soran mesajlar teşhis değil
      
      // ✅ GERÇEK TEŞHİS KONTROLLERİ
      // 1. Numaralı liste + teşhis kelimeleri (1. Neden: ... gibi)
      const hasNumberedDiagnosis = /\d+\.\s+.*(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza)/i.test(content);
      
      // 2. Teşhis kelimeleri + çözüm önerisi
      const hasDiagnosisWithSolution = 
        /(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza|tahmin)/i.test(content) &&
        /(?:çözüm|öneri|yapılmalı|değiştir|tamir|kontrol|bakım)/i.test(content);
      
      // 3. Markdown bold ile sebepler (**Neden:** gibi)
      const hasBoldCauses = /\*\*.*(?:neden|sebep|olası|muhtemel)\*\*/i.test(content);
      
      // 4. "Şu nedenlerden biri olabilir" gibi açık teşhis ifadeleri
      const hasExplicitDiagnosis = 
        /(?:şu\s+nedenlerden|olası\s+nedenler|muhtemel\s+sebepler|teşhis|tanı)/i.test(content);
      
      // 5. Numaralı liste + açıklama (sadece soru değil, açıklama var)
      const hasNumberedListWithExplanation = 
        /\d+\.\s+[^?]+\s+[^?]+/i.test(content) && // En az 2 kelime, soru işareti yok
        !content.includes("?");
      
      return hasNumberedDiagnosis || hasDiagnosisWithSolution || hasBoldCauses || 
             hasExplicitDiagnosis || hasNumberedListWithExplanation;
    });

    // Teşhis yoksa kullanıcıya PROFESYONEL uyarı göster
    if (!hasDiagnosis) {
      setShowDiagnosisWarningDialog(true);
      setShowMoreMenu(false);
      return; // Modal'dan sonra devam edilecek
    }

    // PDF oluşturma başladı - butonları disable et (extractVehicleInfo çağrısı sırasında da disable olsun)
    setIsGeneratingPDF(true);

    // 4️⃣ Araç bilgilerini kontrol et
    const vehicleInfo = await extractVehicleInfo(userMessages);
    const missingFields: string[] = [];
    if (!vehicleInfo.marka) missingFields.push("Marka");
    if (!vehicleInfo.model) missingFields.push("Model");
    if (!vehicleInfo.yil) missingFields.push("Yıl");
    if (!vehicleInfo.km) missingFields.push("KM");

    // Eksik bilgiler varsa modal göster
    if (missingFields.length > 0) {
      // Placeholder formatını oluştur: Mevcut bilgileri göster, eksikleri "?" ile işaretle
      // Örnek: "Marka: AUDI Model: ? Yıl: 2024 KM: ?"
      const placeholderParts: string[] = [];
      placeholderParts.push(`Marka: ${vehicleInfo.marka || "?"}`);
      placeholderParts.push(`Model: ${vehicleInfo.model || "?"}`);
      placeholderParts.push(`Yıl: ${vehicleInfo.yil || "?"}`);
      placeholderParts.push(`KM: ${vehicleInfo.km || "?"}`);
      const placeholder = placeholderParts.join(" ");
      
      setMissingVehicleFields(missingFields);
      setVehicleInfoPlaceholder(placeholder);
      setShowVehicleInfoDialog(true);
      setShowMoreMenu(false);
      // Modal gösterildiğinde isGeneratingPDF'i false yap (kullanıcı bilgi girebilsin)
      setIsGeneratingPDF(false);
      return; // PDF oluşturmayı durdur, kullanıcı bilgileri eklesin
    }

    try {
      setShowMoreMenu(false);
      // isGeneratingPDF zaten true (yukarıda set edildi)
      setPdfGeneratingDots(1); // Animasyonu başlat
      
      // Chat'e "PDF oluşturuluyor" mesajı ekle (animasyonlu noktalarla)
      const pdfMessageId = `pdf-generating-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: pdfMessageId,
          type: "ai",
          content: "📄 PDF raporu oluşturuluyor.",
          timestamp: new Date(),
        },
      ]);
      
      // Animasyonlu noktalar için interval
      const dotsInterval = setInterval(() => {
        setPdfGeneratingDots((prev) => {
          const next = prev >= 3 ? 1 : prev + 1;
          // Mesajı güncelle
          setMessages((prevMsgs) => {
            const index = prevMsgs.findIndex((msg) => msg.id === pdfMessageId);
            if (index !== -1) {
              const newMsgs = [...prevMsgs];
              newMsgs[index] = {
                ...newMsgs[index],
                content: `📄 PDF raporu oluşturuluyor${".".repeat(next)}`,
              };
              return newMsgs;
            }
            return prevMsgs;
          });
          return next;
        });
      }, 500); // Her 500ms'de bir güncelle
      
      // Interval'i temizlemek için global'a kaydet
      (window as any).pdfDotsInterval = dotsInterval;

      // API'ye istek at (HTML döndürüyor, Puppeteer yok!)
      const response = await fetch("/api/chat/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: user_id,
        }),
      });

      if (!response.ok) {
        // Hata durumunda JSON response bekliyoruz
        const errorData = await response.json().catch(() => ({ error: "PDF oluşturulamadı" }));
        throw new Error(errorData.error || "PDF oluşturulamadı");
      }

      // API artık pdfmake document definition döndürüyor (JSON formatında)
      const data = await response.json();
      const { pdfmake, reportNumber } = data;
      
      // pdfmake'i TEK BİR YERDEN al (lib/pdfmake.ts - font init burada yapılıyor)
      const { getPdfMake } = await import('@/lib/pdfmake');
      const pdfMakeInstance = getPdfMake();
      
      // ⚠️ KRİTİK: documentDefinition'a fonts EKLEME! Fontlar pdfMakeInstance.fonts'da tanımlı
      // Backend'den gelen pdfmake zaten font: 'Poppins' içeriyor, bu yeterli
      
      // pdfmake ile PDF oluştur - sayfa kırılmalarını OTOMATIK yönetir!
      // PDF oluşturma işlemini try-catch ile sar (hata durumunda başarı mesajı gösterme)
      try {
        pdfMakeInstance.createPdf(pdfmake).download(`NesiVarUsta-Rapor-${reportNumber || new Date().toISOString().split("T")[0]}.pdf`);
        
        // Sadece PDF başarıyla indirildiyse başarı mesajı göster
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
          return [
            ...filtered,
            {
              id: `pdf-success-${Date.now()}`,
              type: "ai",
              content: "✅ PDF raporu başarıyla oluşturuldu ve indirildi.",
              timestamp: new Date(),
            },
          ];
        });
      } catch (pdfError: any) {
        // PDF oluşturma/indirme hatası
        throw new Error(`PDF oluşturma hatası: ${pdfError.message || "Bilinmeyen hata"}`);
      }
    } catch (error: any) {
      logger.error("PDF oluşturma hatası", error as Error);
      
      // "PDF oluşturuluyor" mesajını kaldır ve hata mesajı ekle
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
        return [
          ...filtered,
          {
            id: `pdf-error-${Date.now()}`,
            type: "ai",
            content: `❌ PDF raporu oluşturulurken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
            timestamp: new Date(),
          },
        ];
      });
      
      alert(
        error.message || "PDF raporu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsGeneratingPDF(false);
      // Animasyon interval'ini temizle
      if ((window as any).pdfDotsInterval) {
        clearInterval((window as any).pdfDotsInterval);
        delete (window as any).pdfDotsInterval;
      }
    }
  }

  const handleDeleteChat = () => {
    const chatIdToDelete = selectedChatId || "current-chat"
    setChatToDelete(chatIdToDelete)
    setShowDeleteChatConfirm(true)
    setShowMoreMenu(false)
  }

  const handleDeleteChatFromList = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Chat seçimini engelle
    setChatToDelete(chatId)
    setShowDeleteChatConfirm(true)
  }

  const confirmDeleteChat = async () => {
    if (chatToDelete) {
      try {
        // 1. Backend'e "Bu chat'i benim için gizle" isteği atıyoruz
        const user_id = getOrCreateGuestUserId();
        
        // KRİTİK: user_id null kontrolü
        if (!user_id) {
          logger.warn("User ID bulunamadı, chat silinemedi", {});
          alert("Bir hata oluştu. Lütfen sayfayı yenileyin.");
          setShowDeleteChatConfirm(false);
          return;
        }
        
        const deleteRes = await fetch("/api/chat/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatToDelete,
            user_id: user_id,
            soft_delete: true // Kritik nokta: Gerçekten silme, sadece işaretle
          }),
        });
        
        if (!deleteRes.ok) {
          const errorData = await deleteRes.json().catch(() => ({}));
          logger.error("Chat silme hatası", new Error(errorData.error || "Chat silme hatası"), { errorData });
          alert("Chat silinirken bir hata oluştu. Lütfen tekrar deneyin.");
          setShowDeleteChatConfirm(false);
          setChatToDelete(null);
          return;
        }
        
        const deleteResult = await deleteRes.json();
        if (process.env.NODE_ENV === 'development') {
          console.log("Chat silindi:", deleteResult);
        }
  
        // 2. Cache'den mesajları kaldır (Kullanıcı görmesin)
        clearChatCache(chatToDelete);
  
        // 3. UI State'i güncelle
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatToDelete));
  
        if (selectedChatId === chatToDelete) {
          setSelectedChatId(null);
          selectedChatIdRef.current = null;
          setMessages([{
            id: "welcome",
            type: "ai",
            content: "Merhaba! Ben NesiVarUsta Analiz Asistanı ✨. Araç marka–model–yıl ve yaşadığınız sorunu yazarsanız ön analiz yapabilirim.",
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        logger.error("Silme işlemi sırasında hata", error as Error);
      }
    }
    setShowDeleteChatConfirm(false);
    setChatToDelete(null);
  };

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

  // Markdown formatını parse et: **text** -> kalın ve turuncu, soru numaralarını kalın yap
  const formatMessageContent = (content: string) => {
    // ÖNCE tüm # ifadelerini kaldır ve "Açıklama:" kelimesini özel formatla
    let formatted = content;
    
    // ### Açıklama: veya ###Açıklama: gibi durumları direkt formatlanmış haline çevir
    formatted = formatted.replace(/###\s*Açıklama\s*:/gi, '<strong class="text-orange-400">Açıklama:</strong>');
    
    // Tüm # ifadelerini kaldır (###, ##, # hepsini - satır başında veya herhangi bir yerde)
    // Önce satır başındaki # ifadelerini kaldır
    formatted = formatted.replace(/^###\s+/gm, '');
    formatted = formatted.replace(/^##\s+/gm, '');
    formatted = formatted.replace(/^#\s+/gm, '');
    // Sonra satır içindeki # ifadelerini kaldır
    formatted = formatted.replace(/###/g, '');
    formatted = formatted.replace(/##/g, '');
    formatted = formatted.replace(/#/g, '');
    
    // Eğer "Açıklama:" kelimesi formatlanmamışsa (HTML tag içinde değilse), formatla
    // Basit yaklaşım: Satır satır kontrol et ve HTML tag içinde olmayan "Açıklama:" kelimelerini formatla
    const aciklamaLines = formatted.split('\n');
    const aciklamaProcessed = aciklamaLines.map(line => {
      // Eğer satır zaten formatlanmış "Açıklama:" içeriyorsa, değiştirme
      if (line.includes('<strong class="text-orange-400">Açıklama:</strong>')) {
        return line;
      }
      // Eğer satır "Açıklama:" içeriyorsa ama HTML tag içinde değilse, formatla
      if (line.includes('Açıklama:') && !line.includes('<strong')) {
        return line.replace(/(Açıklama\s*:)/gi, '<strong class="text-orange-400">$1</strong>');
      }
      return line;
    });
    formatted = aciklamaProcessed.join('\n');
    
    // ÖNCE boş satırları ekle (satır satır işle)
    const lines = formatted.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      
      processedLines.push(currentLine);
      
      // Eğer bu satır sayı ile başlıyorsa (1. 2. 3. gibi) ve sonraki satır da sayı ile başlıyorsa
      if (currentLine.match(/^\d+\.\s/) && nextLine && nextLine.match(/^\d+\.\s/)) {
        processedLines.push(''); // Boş satır ekle
      }
      
      // Eğer bu satır ** ile başlıyorsa ve sonraki satır da ** ile başlıyorsa
      if (currentLine.trim().startsWith('**') && nextLine && nextLine.trim().startsWith('**')) {
        processedLines.push(''); // Boş satır ekle
      }
    }
    
    formatted = processedLines.join('\n');
    
    // SONRA formatlamayı yap
    
    // Soru numaralarını kalın yap: "1. " -> "<strong>1.</strong> "
    formatted = formatted.replace(/(^|\n)(\d+)\.\s/g, '$1<strong>$2.</strong> ');
    
    // **text** formatını <strong> tag'ine çevir ve turuncu renk ekle (sebepler için)
    formatted = formatted.replace(/\*\*([^*]+?)\*\*/g, '<strong class="text-orange-400">$1</strong>');
    
    return formatted;
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
      case "medium":
        return <Trash2 className="w-4 h-4" />
      case "low":
        return <CheckCircle className="w-3 h-3" />
      default:
        return <Trash2 className="w-4 h-4" />
    }
  }

  // Chat history'yi filtrele
  const filteredChatHistory = chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleNewChat = () => {
    setSelectedChatId(null)
    selectedChatIdRef.current = null
    setMessages([
      {
        id: "welcome",
        type: "ai",
        content: "Merhaba! Ben NesiVarUsta Analiz Asistanı ✨. Araç marka–model–yıl ve yaşadığınız sorunu yazarsanız ön analiz yapabilirim.",
        timestamp: new Date(),
      },
    ])
    // Mobilde sidebar'ı kapat
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true)
    }
    // Textarea'ya focus yap (sadece desktop ve tablet genişliğinde, sidebar kapanma animasyonu için biraz bekle)
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        textareaRef.current?.focus()
      }
    }, 300)
  }

  return (
    <div className="h-screen flex overflow-hidden overflow-x-hidden max-w-full transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black dark:text-white bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Sidebar - Chat History */}
      <ChatSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        chatHistory={chatHistory}
        isLoadingHistory={isLoadingHistory}
        selectedChatId={selectedChatId}
        onChatSelect={handleChatSelect}
        onDeleteChat={handleDeleteChatFromList}
        isGeneratingPDF={isGeneratingPDF}
        onNewChat={handleNewChat}
      />

      {/* Mobile Sidebar Backdrop - ChatSidebar component içinde yönetiliyor */}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 max-w-full overflow-hidden ${sidebarCollapsed ? "" : "md:ml-0"}`}>
        {/* Chat Header - Mobilde sabit, desktop'ta normal */}
        <div className="flex-shrink-0 md:relative sticky top-0 dark:bg-gray-900 bg-white dark:border-gray-700 border-gray-200 border-b p-3 md:p-4 min-h-[80px] md:min-h-[96px] flex items-center max-w-full overflow-visible z-20">
          <div className="flex items-center justify-between w-full min-w-0 max-w-full">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Mobile hamburger menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden text-gray-400 hover:text-gray-400 hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Mail className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex w-8 h-8 md:w-10 md:h-10 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-blue-500/20 bg-gradient-to-br from-blue-100 via-purple-50 to-orange-100 rounded-xl items-center justify-center">
                <Wrench className="w-4 h-4 md:w-6 md:h-6 dark:text-orange-400 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold dark:text-white text-gray-900">
                  Analiz Asistanınız ✨
                </h2>
                <div className="flex items-center">
                  <Link 
                    href="/feedback" 
                    className="text-xs md:text-sm text-orange-500 hover:text-orange-400 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                  >
                    Ustamızın bir kusuru olduysa özür dileriz. Ustamızla ilgili görüşlerinizi belirtebilirsiniz.
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (mounted) {
                    setTheme(theme === "dark" ? "light" : "dark");
                  }
                }}
                className="dark:text-gray-400 text-gray-600 hover:text-orange-400 hover:bg-orange-500/10 active:text-orange-400 active:bg-orange-500/10 p-2 rounded-lg transition-colors touch-manipulation mobile-no-hover"
                aria-label={mounted && theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
                title={mounted && theme === "dark" ? "Aydınlık mod" : "Karanlık mod"}
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )
                ) : (
                  <Moon className="w-5 h-5 opacity-50" />
                )}
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isTyping || isAnalyzing || isGeneratingPDF}
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/20 active:text-orange-400 active:bg-orange-500/20 touch-manipulation mobile-no-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                  <>
                    {/* Backdrop - menü dışına tıklayınca kapanır */}
                    <div 
                      className="fixed inset-0 z-[9998]" 
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div 
                      className="absolute right-0 top-full mt-1 w-48 dark:bg-[#1f2937] bg-white border dark:border-gray-700/50 border-gray-300 rounded-lg shadow-2xl z-[9999]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-2">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={(() => {
                        const validMessages = messages.filter((msg) => msg.id !== "welcome");
                        const userMessages = validMessages.filter((msg) => msg.type === "user");
                        const aiMessages = validMessages.filter((msg) => msg.type === "ai");
                        return isGeneratingPDF || validMessages.length < 6 || userMessages.length < 2 || aiMessages.length < 2;
                      })()}
                      aria-label="PDF raporu oluştur"
                      className="w-full px-4 py-2 text-left text-sm dark:text-gray-300 text-gray-700 hover:text-orange-400 dark:hover:bg-orange-500/20 hover:bg-orange-50 active:text-orange-400 active:bg-orange-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mobile-no-hover"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF Rapor Oluştur</span>
                    </button>
                    <button
                      onClick={handleDownloadChat}
                      disabled={isGeneratingPDF}
                      aria-label="Chat'i indir"
                      className="w-full px-4 py-2 text-left text-sm dark:text-gray-300 text-gray-700 hover:text-orange-400 dark:hover:bg-orange-500/20 hover:bg-orange-50 active:text-orange-400 active:bg-orange-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mobile-no-hover"
                    >
                      <Download className="w-4 h-4" />
                      <span>Chat'i İndir</span>
                    </button>
                    <button
                      onClick={handleDeleteChat}
                      disabled={isGeneratingPDF}
                      aria-label="Chat'i sil"
                      className="w-full px-4 py-2 text-left text-sm dark:text-red-400 text-red-600 hover:text-orange-400 dark:hover:bg-orange-500/20 hover:bg-orange-50 active:text-orange-400 active:bg-orange-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mobile-no-hover"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Chat'i Sil</span>
                      </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesAreaRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-3 md:space-y-4 chat-scrollbar min-w-0 max-w-full">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[80%] min-w-0 ${message.type === "user" ? "order-2" : "order-1"}`}>
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 ${message.type === "user"
                    ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-br-md"
                    : "dark:bg-gray-800/50 bg-gray-100 dark:text-gray-200 text-gray-800 rounded-bl-md border dark:border-gray-700/50 border-gray-300"
                    }`}
                >
                  {/* Message content */}
                  <div 
                    className="whitespace-pre-line text-base"
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                  />

                  {/* Analysis card for AI messages */}
                  {message.analysis && (
                    <div className="mt-2 md:mt-3 dark:bg-white/10 bg-gray-100 dark:border-white/20 border-gray-300 rounded-lg p-2 md:p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-orange-300">DETAYLI ANALİZ</span>
                        {message.analysis.severity && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(message.analysis.severity)}`}
                          >
                            {message.analysis.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        {message.analysis.possible_causes && message.analysis.possible_causes.length > 0 && (
                          <div>
                            <span className="text-gray-300">Olası Nedenler:</span>
                            {message.analysis.possible_causes.map((c, i) => (
                              <div key={i} className="flex justify-between mt-1">
                                <span className="text-white">{c.name}</span>
                                <span className="text-white">{c.probability}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {message.analysis.estimated_cost_range_try && (
                          <div>
                            <span className="text-gray-300">Maliyet:</span>
                            <span className="ml-2 text-white">
                              {message.analysis.estimated_cost_range_try}
                            </span>
                          </div>
                        )}
                        {message.analysis.risk_assessment && (
                          <div>
                            <span className="text-gray-300">Risk:</span>
                            <span className="ml-2 text-white">
                              {message.analysis.risk_assessment}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp and Read Button */}
                  <div className="flex items-center justify-between mt-1 md:mt-2">
                    <div
                      className={`text-xs ${message.type === "user" ? "text-orange-100" : "text-gray-400"
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
                    {/* Read Button */}
                    <button
                      onClick={() => speakText(message.content, message.id)}
                      className={`ml-2 p-1.5 rounded-lg transition-colors ${
                        currentlySpeakingMessageId === message.id
                          ? "bg-orange-500/20 text-orange-400"
                          : message.type === "user"
                          ? "text-orange-100/70 hover:text-orange-100 hover:bg-orange-500/20"
                          : "text-gray-400 dark:hover:bg-gray-700/50 hover:text-orange-400"
                      }`}
                      title="Mesajı oku"
                    >
                      {currentlySpeakingMessageId === message.id ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar */}
              <div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${message.type === "user"
                  ? "bg-gradient-to-r from-orange-500 to-blue-500 order-1 mr-2 md:mr-3"
                  : "dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-blue-500/20 bg-gradient-to-br from-blue-100 via-purple-50 to-orange-100 order-2 ml-2 md:ml-3"
                  }`}
              >
                {message.type === "user" ? (
                  <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                ) : (
                  <Wrench className="w-3 h-3 md:w-4 md:h-4 dark:text-orange-400 text-orange-500" />
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && !isGeneratingPDF && (
            <div className="flex justify-start">
              <div className="dark:bg-gray-700 bg-gray-100 dark:border-gray-700/50 border-gray-300 border rounded-2xl rounded-bl-md px-4 py-3 ml-2">
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
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-blue-300 font-semibold text-sm">Usta Görsel Analizi Yapıyor...</p>
                    <p className="text-blue-400 text-xs">Görüntü işleniyor ve analiz ediliyor...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Mobilde sabit, desktop'ta sticky */}
        <div className="flex-shrink-0 md:sticky bottom-0 z-10 dark:bg-gray-900/50 bg-white/90 dark:border-gray-700/50 border-gray-200 backdrop-blur-xl border-t px-1 py-1 min-h-[48px] md:min-h-[64px] flex items-center max-w-full overflow-x-hidden">
          <div className="flex items-center w-full min-w-0 max-w-full">
            {/* Text Input */}
            <div className="flex-1 relative flex items-center">
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (!isLimitReached() && !isGeneratingPDF && !isAnalyzing) {
                      handleSendMessage()
                    }
                  }
                }}
                onFocus={() => {
                  // iOS Safari klavye açınca sayfayı itmesin diye
                  document.body.style.position = "fixed";
                  document.body.style.width = "100%";
                  
                  // Mobilde eğer chat scroll edilecek kadar uzun değilse, scroll'u devre dışı bırak
                  // Klavye açılma animasyonu için biraz bekle
                  setTimeout(() => {
                    if (window.innerWidth < 768 && messagesAreaRef.current) {
                      const messagesArea = messagesAreaRef.current;
                      const scrollHeight = messagesArea.scrollHeight;
                      const clientHeight = messagesArea.clientHeight;
                      
                      // Eğer scroll edilecek kadar içerik yoksa (5px tolerans), scroll'u devre dışı bırak
                      if (scrollHeight <= clientHeight + 5) {
                        messagesArea.style.overflowY = "hidden";
                        messagesArea.style.touchAction = "none";
                        messagesArea.style.overscrollBehavior = "none";
                        // Ana container'ın scroll'unu da engelle
                        const mainContainer = messagesArea.closest('.flex-1.flex.flex-col');
                        if (mainContainer) {
                          (mainContainer as HTMLElement).style.overflow = "hidden";
                        }
                        // Body scroll'unu da engelle
                        document.body.style.overflow = "hidden";
                        document.documentElement.style.overflow = "hidden";
                      }
                    }
                  }, 300);
                }}
                onBlur={() => {
                  document.body.style.position = "";
                  document.body.style.width = "";
                  
                  // Scroll'u tekrar aktif et
                  if (window.innerWidth < 768 && messagesAreaRef.current) {
                    const messagesArea = messagesAreaRef.current;
                    messagesArea.style.overflowY = "auto";
                    messagesArea.style.touchAction = "";
                    messagesArea.style.overscrollBehavior = "";
                    // Ana container'ın scroll'unu tekrar aktif et
                    const mainContainer = messagesArea.closest('.flex-1.flex.flex-col');
                    if (mainContainer) {
                      (mainContainer as HTMLElement).style.overflow = "";
                    }
                    // Body scroll'unu tekrar aktif et
                    document.body.style.overflow = "";
                    document.documentElement.style.overflow = "";
                  }
                }}
                placeholder="Mesajınızı yazın..."
                disabled={isLimitReached() || isTyping || isGeneratingPDF || isAnalyzing}
                className="chat-textarea w-full min-w-0 max-w-full px-4 pr-24 md:px-4 md:pr-28 py-1.5 md:py-1.5 dark:bg-gray-800/50 bg-gray-100 dark:border-gray-600 border-gray-300 dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 placeholder:text-base focus:ring-orange-500 border rounded-xl focus:outline-none focus:ring-1 focus:border-transparent resize-none min-h-[32px] md:min-h-[36px] max-h-24 md:max-h-32 text-base disabled:opacity-50 disabled:cursor-not-allowed leading-normal"
                rows={1}
              />

              {/* Limit gösterimi kaldırıldı - video şu an kabul edilmiyor */}

              {/* Send Button - Textarea içinde */}
              <Button
                onClick={handleSendMessage}
                disabled={!currentInput.trim() || isTyping || isLimitReached() || isGeneratingPDF || isAnalyzing}
                variant="ghost"
                size="sm"
                aria-label="Mesaj gönder"
                className="absolute right-12 md:right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 active:text-orange-400 active:bg-orange-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0 h-8 w-8 md:h-9 md:w-9 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation mobile-no-hover z-10"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              {/* 🎤 Microphone */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isGeneratingPDF || isAnalyzing || isTyping}
                aria-label={isRecording ? "Ses kaydını durdur" : "Ses kaydına başla"}
                className={`absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition z-10 ${isRecording
                  ? "text-red-500 animate-pulse"
                  : "text-gray-400 hover:text-orange-400"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-gray-700 rounded-xl border w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Ayarlar</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-gray-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white">Ses Bildirimleri</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`${soundEnabled ? "text-green-400" : "text-gray-400"} hover:text-white`}
                >
                  {soundEnabled ? "Açık" : "Kapalı"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {notificationsEnabled ? (
                    <Bell className="w-5 h-5 text-gray-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white">Push Bildirimleri</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`${notificationsEnabled ? "text-green-400" : "text-gray-400"} hover:text-white`}
                >
                  {notificationsEnabled ? "Açık" : "Kapalı"}
                </Button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700">
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

      {/* Vehicle Info Missing Dialog */}
      <Dialog open={showVehicleInfoDialog} onOpenChange={setShowVehicleInfoDialog}>
        <DialogContent className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-200 dark:text-white text-gray-900 max-w-md [&>button]:hidden [&+div>div]:backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Eksik Araç Bilgileri
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300 text-gray-900 pt-2">
              PDF raporu için aşağıdaki bilgiler eksik. Bu bilgiler olmadan rapor daha az detaylı olabilir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <div className="space-y-1">
              {missingVehicleFields.map((field) => (
                <div key={field} className="flex items-center gap-2 dark:text-gray-300 text-gray-900">
                  <span className="text-red-400">❌</span>
                 <span>{field}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 dark:bg-gray-700/50 bg-gray-100 rounded-lg">
              <p className="text-sm dark:text-gray-300 text-gray-900 mb-2">
                💡 Chat'e şu formatta yazdırabilirsiniz:
              </p>
              <code className="text-sm dark:text-orange-300 text-orange-600 dark:bg-gray-800 bg-gray-200 px-2 py-1 rounded">
                {vehicleInfoPlaceholder}
              </code>
            </div>
          </div>

          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-1.5 w-full">
            <Button
              onClick={() => {
                setShowVehicleInfoDialog(false);
                setShowMoreMenu(false);
              }}
              className="w-full md:flex-1 bg-red-600 hover:bg-red-700 text-white text-center justify-center py-2.5 md:py-2"
            >
              İptal
            </Button>
            <Button
              onClick={() => {
                setShowVehicleInfoDialog(false);
                // Chat input'una focus yap ve VALUE'ya yaz (placeholder değil!)
                setTimeout(() => {
                  if (textareaRef.current) {
                    // VALUE'ya yaz, placeholder değil!
                    setCurrentInput(vehicleInfoPlaceholder);
                    textareaRef.current.focus();
                  }
                }, 100);
              }}
              className="w-full md:flex-1 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white text-center justify-center py-2.5 md:py-2"
            >
              Chat'e Yazdır
            </Button>
            <Button
              onClick={async () => {
                setShowVehicleInfoDialog(false);
                // Yine de devam et - PDF oluştur (eksik bilgi kontrolünü atla)
                const user_id = getOrCreateGuestUserId();
                const chatId = selectedChatId;
                if (!user_id || !chatId) return;

                setShowMoreMenu(false);
                setIsGeneratingPDF(true);
                setPdfGeneratingDots(1);
                
                const pdfMessageId = `pdf-generating-${Date.now()}`;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: pdfMessageId,
                    type: "ai",
                    content: "📄 PDF raporu oluşturuluyor.",
                    timestamp: new Date(),
                  },
                ]);
                
                const dotsInterval = setInterval(() => {
                  setPdfGeneratingDots((prev) => {
                    const next = prev >= 3 ? 1 : prev + 1;
                    setMessages((prevMsgs) => {
                      const index = prevMsgs.findIndex((msg) => msg.id === pdfMessageId);
                      if (index !== -1) {
                        const newMsgs = [...prevMsgs];
                        newMsgs[index] = {
                          ...newMsgs[index],
                          content: `📄 PDF raporu oluşturuluyor${".".repeat(next)}`,
                        };
                        return newMsgs;
                      }
                      return prevMsgs;
                    });
                    return next;
                  });
                }, 500);
                
                (window as any).pdfDotsInterval = dotsInterval;

                try {
                  const response = await fetch("/api/chat/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, user_id: user_id }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "PDF oluşturulamadı" }));
                    throw new Error(errorData.error || "PDF oluşturulamadı");
                  }

                  // API artık pdfmake document definition döndürüyor (JSON formatında)
                  const data = await response.json();
                  const { pdfmake, reportNumber } = data;
                  
                  // pdfmake'i TEK BİR YERDEN al (lib/pdfmake.ts - font init burada yapılıyor)
                  const { getPdfMake } = await import('@/lib/pdfmake');
                  const pdfMakeInstance = getPdfMake();
                  
                  // ⚠️ KRİTİK: documentDefinition'a fonts EKLEME! Fontlar pdfMakeInstance.fonts'da tanımlı
                  // Backend'den gelen pdfmake zaten font: 'Poppins' içeriyor, bu yeterli
                  
                  // pdfmake ile PDF oluştur - sayfa kırılmalarını OTOMATIK yönetir!
                  pdfMakeInstance.createPdf(pdfmake).download(`NesiVarUsta-Rapor-${reportNumber || new Date().toISOString().split("T")[0]}.pdf`);
                  
                  setMessages((prev) => {
                    const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
                    return [
                      ...filtered,
                      {
                        id: `pdf-success-${Date.now()}`,
                        type: "ai",
                        content: "✅ PDF raporu başarıyla oluşturuldu ve indirildi.",
                        timestamp: new Date(),
                      },
                    ];
                  });
                } catch (error: any) {
                  logger.error("PDF oluşturma hatası", error as Error);
                  setMessages((prev) => {
                    const filtered = prev.filter((msg) => !msg.id.startsWith("pdf-generating-"));
                    return [
                      ...filtered,
                      {
                        id: `pdf-error-${Date.now()}`,
                        type: "ai",
                        content: `❌ PDF raporu oluşturulurken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
                        timestamp: new Date(),
                      },
                    ];
                  });
                  alert(error.message || "PDF raporu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
                } finally {
                  setIsGeneratingPDF(false);
                  if ((window as any).pdfDotsInterval) {
                    clearInterval((window as any).pdfDotsInterval);
                    delete (window as any).pdfDotsInterval;
                  }
                }
              }}
              className="w-full md:flex-1 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white text-center justify-center py-2.5 md:py-2"
            >
              Yine de Devam Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-gray-700 rounded-xl border w-full max-w-sm">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <LogOut className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Çıkış Yap</h3>
              </div>
              <p className="mb-6 text-gray-300">
              Oturumunuzu kapatmak istediğinizden emin misiniz?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 text-gray-400 hover:text-white"
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

      {/* Diagnosis Warning Dialog */}
      {showDiagnosisWarningDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-300 border rounded-xl w-full max-w-md">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-semibold text-orange-400">PDF RAPORU UYARISI</h3>
              </div>
              <p className="mb-4 text-sm dark:text-gray-300 text-gray-700">
                Bu chat'te henüz yeterli teşhis yapılmamış görünüyor. Analiz Asistanı sadece sorular sormuş, ancak sorunun nedeni ve çözüm önerileri belirtilmemiş.
              </p>
              <div className="mb-4">
                <p className="text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">Profesyonel bir rapor için:</p>
                <ul className="text-sm dark:text-gray-300 text-gray-700 space-y-1 list-disc list-inside">
                  <li>Sorunun olası nedenleri belirtilmeli</li>
                  <li>Çözüm önerileri sunulmalı</li>
                  <li>Teşhis yapılmış olmalı</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowDiagnosisWarningDialog(false);
                    setShowMoreMenu(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  İptal
                </Button>
                <Button 
                  onClick={() => {
                    setShowDiagnosisWarningDialog(false);
                    // PDF oluşturma işlemini devam ettir
                    handleDownloadPDFContinue();
                  }} 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white text-sm"
                >
                  Yine de Devam Et
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteChatConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-300 border rounded-xl w-full max-w-sm">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-semibold dark:text-white text-gray-900">Chat'i Sil</h3>
              </div>
              <p className="mb-6 text-sm dark:text-gray-300 text-gray-900">
                Bu konuşmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteChatConfirm(false)
                    setChatToDelete(null)
                  }}
                  className="flex-1 dark:text-gray-400 text-gray-900 hover:text-orange-400 hover:bg-orange-500/20"
                >
                  Hayır
                </Button>
                <Button onClick={confirmDeleteChat} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm">
                  Evet, Sil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
