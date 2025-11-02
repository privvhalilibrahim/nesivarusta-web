"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Camera,
  CheckCircle,
  Play,
  Instagram,
  Sparkles,
  Brain,
  Clock,
  ChevronUp,
  ChevronRight,
  Car,
  Smartphone,
} from "lucide-react"
import Link from "next/link"

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
      <button
        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-white pr-4">{question}</h3>
        <div className={`transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-6 pb-5 pt-3">
          <p className="text-gray-300 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function NesiVarUstaApp() {
  // Demo için chat mesajları ve adımları
  const [demoStep, setDemoStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [demoMessages, setDemoMessages] = useState([
    {
      type: "bot",
      message:
        "Merhaba! Ben NesiVarUsta asistanınızım. Araç sorununuzla nasıl yardımcı olabilirim? Video yükleyebilir veya sorununuzu tarif edebilirsiniz.",
    },
  ])

  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [mobileChatInput, setMobileChatInput] = useState("")
  const [mobileChatMessages, setMobileChatMessages] = useState([
    {
      type: "bot",
      message:
        "👋 Merhaba! Ben NesiVarUsta mobil uygulamasının araç arıza ön teşhis sistemi demo'suyum. Bu sadece bir örnek interaktif deneyim! Gerçek uygulamada fabrika verileri ve yüzlerce usta tecrübesine dayalı teşhis yapabilir, video yükleyebilir ve uzman danışmanlık alabilirsiniz. 🚗✨",
    },
  ])

  const [currentSlogan, setCurrentSlogan] = useState(0)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const slogans = [
    "Motor sesi garip mi?",
    "Fren problemi var mı?",
    "Yağ sızıntısı mı?",
    "Vites zorlanıyor mu?",
    "Klima çalışmıyor mu?",
    "Batarya bitik mi?",
    "Direksiyon titriyor mu?",
    "Fren balata eskik mi?",
    "Amortisör bozuk mu?",
  ]

  const demoFlow = [
    {
      step: 0,
      userMessage: "Arabamdan garip bir ses geliyor",
      botMessage: "Anlıyorum. Bu sesi daha detaylı tarif edebilir misiniz? Aşağıdaki seçeneklerden hangisine benziyor?",
      options: [
        "🔧 Tak tak metalik ses",
        "🐍 Cızz diye sürtünme sesi",
        "🌊 Vızz diye sürekli ses",
        "💥 Patlama benzeri ses",
      ],
    },
    {
      step: 1,
      userMessage: "Tak tak metalik ses",
      botMessage: "Teşekkürler! Bu ses ne zaman oluyor?",
      options: ["🚗 Motor çalışırken", "🛑 Fren yaparken", "🔄 Vites değiştirirken", "⚡ Motor ilk çalıştığında"],
    },
    {
      step: 2,
      userMessage: "Motor çalışırken",
      botMessage: "Mükemmel! Şimdi analiz ediyorum... Bir de video yada ses yüklerseniz daha kesin teşhis koyabilirim.",
      options: ["📸 Video Yükle", "📝 Sadece ses analiziyle devam et"],
    },
    {
      step: 3,
      userMessage: "📸 Video Yükle",
      botMessage: "Harika! Video yüklüyorum ve analizi başlatıyorum...",
      options: [],
      showPhotoUpload: true,
    },
    {
      step: 4,
      userMessage: "",
      botMessage: "🔄 Video analizi tamamlandı! Hem ses hem görüntü verilerini birleştiriyorum...",
      options: [],
      showAnalyzing: true,
    },
    {
      step: 5,
      userMessage: "",
      botMessage:
        "✅ **DETAYLI ANALİZ SONUCU**\n\n🔍 **TEŞHİS**\nMotor üst kapak contası ve valf ayar problemi\n\n📸 **VİDEO ANALİZ**\nGörselde yağ sızıntısı belirtileri tespit edildi\n\n🔊 **SES ANALİZİ**\nValf gürültüsü karakteristik tak tak sesi\n\n⚠️ **ACİLİYET DURUMU**\nYüksek - Erken müdahale önerilir\n\n💰 **TAHMİNİ MALİYET**\n800-1200₺\n\n📋 **ÖNERİLEN ÇÖZÜM**\n• Motor üst kapak contası değişimi\n• Valf ayarı kontrolü ve ayarlama\n• Motor yağı değişimi\n\n🎯 **GÜVENİLİRLİK**\n%95 (Video + Ses analizi)",
      options: ["🛒 Parçaları nereden alabilirim?", "🔧 Tamirci önerisi", "📞 Uzman ile görüş"],
    },
    {
      step: 6,
      userMessage: "🛒 Parçaları nereden alabilirim?",
      botMessage:
        "🛒 **EN UYGUN PARÇA TEDARİK YERLERİ**\n\n💡 **ÖNERİLEN MAĞAZALAR**\n\n🏪 **Yerel Yedek Parça Mağazaları**\n• Bosch Car Service\n  📍 Adres: Atatürk Cad. No:45 Kadıköy/İstanbul\n  📞 Tel: 0216 555 ****\n\n• Opar Otomotiv\n  📍 Adres: Bağdat Cad. No:78 Maltepe/İstanbul\n  📞 Tel: 0216 555 ****\n\n• Oto Sanayi Sitesi\n  📍 Adres: Sanayi Mah. 1. Sok. No:12 Pendik/İstanbul\n  📞 Tel: 0216 555 0789\n\n🌐 **Online Platformlar**\n• Trendyol Otomotiv\n  🔗 Link: trendyol.com/otomotiv-yedek-parca\n  ⚡ Hızlı teslimat - Aynı gün kargo\n\n• Hepsiburada Oto\n  🔗 Link: hepsiburada.com/oto-yedek-parca\n  🛡️ Güvenli alışveriş - 14 gün iade\n\n• N11 Yedek Parça\n  🔗 Link: n11.com/otomotiv/yedek-parca\n  💰 En uygun fiyatlar - Kapıda ödeme\n\n⭐ **Özel Öneriler**\n• Motor üst kapak contası: Elring marka\n  🔗 Sipariş: otoparca.com/elring-conta\n\n• Valf ayar takımı: Febi Bilstein\n  🔗 Sipariş: yedekparca.net/febi-valf\n\n• Motor yağı: Castrol 5W-30\n  🔗 Sipariş: petrolofisi.com.tr/castrol\n\n💰 **Fiyat Karşılaştırması**\nToplam parça maliyeti: 400-600₺\nİşçilik: 400-600₺\n\n📱 **Mobil Uygulamalar**\n• OtoPark App - iOS/Android\n• YedekParça Bul - Konum bazlı arama",
      options: [],
    },
    {
      step: 3,
      userMessage: "📝 Sadece ses analiziyle devam et",
      botMessage:
        "✅ **ANALİZ SONUCU**\n\n🔍 **TEŞHİS**\nMotor bölgesinde valf ayar problemi\n\n🔊 **SES ANALİZİ**\nTak tak metalik ses karakteristiği\n\n⚠️ **ACİLİYET DURUMU**\nOrta seviye\n\n💰 **TAHMİNİ MALİYET**\n300-500₺\n\n📋 **ÖNERİLEN ÇÖZÜM**\nValf ayarı kontrolü ve gerekirse ayarlama\n\n🎯 **GÜVENİLİRLİK**\n%75 (Sadece ses analizi)",
      options: ["🛒 Parça gerekir mi?", "🔧 Tamirci önerisi"],
    },
  ]

  useEffect(() => {
    if (isPlaying && demoStep < demoFlow.length) {
      const timer = setTimeout(() => {
        const currentFlow = demoFlow[demoStep]

        if (currentFlow.userMessage) {
          setDemoMessages((prev) => [...prev, { type: "user", message: currentFlow.userMessage }])
        }

        setTimeout(
          () => {
            setDemoMessages((prev) => [
              ...prev,
              {
                type: "bot",
                message: currentFlow.botMessage,
                options: currentFlow.options,
                showPhotoUpload: currentFlow.showPhotoUpload,
                showAnalyzing: currentFlow.showAnalyzing,
              },
            ])
            setDemoStep((prev) => prev + 1)
          },
          currentFlow.userMessage ? 2500 : 1000,
        )
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isPlaying, demoStep])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPlaying(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (demoStep >= demoFlow.length && isPlaying) {
      setTimeout(() => {
        setDemoStep(0)
        setDemoMessages([
          {
            type: "bot",
            message:
              "Merhaba! Araç sorununuzu nasıl yardımcı olabilirim? Video yükleyebilir veya sorununuzu tarif edebilirsiniz.",
          },
        ])
      }, 8000)
    }
  }, [demoStep, isPlaying])

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlogan((prev) => (prev + 1) % slogans.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleMenuItemClick = (sectionId: string) => {
    setIsMenuOpen(false)
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }, 300)
  }

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false)
      }
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isMenuOpen && !target.closest(".side-menu") && !target.closest(".hamburger-button")) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("click", handleClickOutside)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("click", handleClickOutside)
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  const handleMobileChatSend = () => {
    if (!mobileChatInput.trim()) return

    setMobileChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        message: mobileChatInput,
      },
    ])

    const userInput = mobileChatInput
    setMobileChatInput("")

    setTimeout(() => {
      setMobileChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          message: `📱 Teşekkürler! "${userInput}" mesajını aldım.:\n\n✨ Video yükleyebilirsiniz\n🔍 Fabrika verisi ile analiz alabilirsiniz\n👨‍🔧 Usta tecrübesi ve fabrika verisine dayalı çözümler bulabilirsiniz\n💰 Maliyet tahmini görebilirsiniz\n\nŞimdi uygulamayı indirin ve gerçek deneyimi yaşayın! 🚀`,
        },
      ])
    }, 1000)
  }

  // Voiceflow chat'i açma fonksiyonu
  const openVoiceflowChat = () => {
    if (typeof window !== "undefined" && window.voiceflow && window.voiceflow.chat) {
      window.voiceflow.chat.open()
    } else {
      // Fallback: Eğer widget henüz yüklenmediyse
      console.warn("Voiceflow widget henüz yüklenmedi")
      // Alternatif olarak doğrudan chat sayfasına yönlendirme
      window.location.href = "https://creator.voiceflow.com/share/68dbb62a0bf03aedb5c121de"
    }
  }

  return (
<>
    {/* Üstteki iki buton */}
<div className="flex flex-col items-center justify-center gap-3 mt-6 mb-6 z-50 relative">
  <a
    href="https://wa.me/905391375334"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-gradient-to-r from-orange-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
  >
    Whatsapp Uzman Ekibe Bağlan
  </a>
 <button onClick={() => {
<button
   onClick={() => alert('Asistan yükleniyor...')}
   className="bg-gradient-to-r from-blue-600 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
 >
Ücretsiz Asistana Bağlan
</div>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">

</div>
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Mobile Side Menu Overlay */}
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 z-[9999] md:hidden transition-all duration-300 ease-in-out"
        style={{
          backgroundColor: isMenuOpen ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0)",
          backdropFilter: isMenuOpen ? "blur(12px)" : "blur(0px)",
          pointerEvents: isMenuOpen ? "auto" : "none",
        }}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`side-menu fixed left-0 top-0 h-full w-[340px] bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl transform transition-all duration-500 ease-in-out z-[10000] ${
            isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-gray-700/50 bg-gradient-to-r from-orange-600/10 to-blue-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                NesiVarUsta
              </div>
            </div>
            <p className="text-gray-400 text-sm">AI Destekli Otomotiv Danışmanlığı</p>
          </div>

          <div className="py-2 px-3 space-y-1">
            {[
              { name: "Nasıl Çalışır", id: "how-it-works", icon: "⚙️" },
              { name: "Hakkımızda", id: "about", icon: "ℹ️" },
              { name: "SSS", id: "faq", icon: "❓" },
            ].map((item, index) => (
              <button
                key={item.name}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center justify-between p-2 text-left text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg group transform ${
                  isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                }`}
                style={{
                  transitionProperty: "all",
                  transitionDuration: "0.3s",
                  transitionTimingFunction: "ease-in-out",
                  transitionDelay: isMenuOpen ? `${(index + 1) * 50}ms` : "0ms",
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300" />
              </button>
            ))}
          </div>

          <div className="px-3 mb-3">
            <div className="flex space-x-2">
              <a href="https://wa.me/905391375334" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                  onClick={() => {
                    setIsMenuOpen(false)
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-400 hover:to-blue-500 text-white shadow-lg shadow-orange-500/25 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-sm"
                >
                  <Car className="mr-2 h-4 w-4" />
                  Whatsapp Uzman Ekibe Bağlan
                </Button>
              </a>
            </div>
          </div>

          <div className="px-3 mb-2">
            <div className="flex items-center justify-center space-x-3 py-2 border-t border-b border-gray-700/50">
              {[
                {
                  icon: <Instagram className="w-4 h-4" />,
                  href: "https://www.instagram.com/nesivarusta",
                  color: "hover:text-pink-500",
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-8 h-8 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-center transition-all duration-300 text-gray-400 ${social.color} hover:scale-110 hover:shadow-lg`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="px-3 pb-2">
            <p className="text-gray-400 text-[14px] leading-relaxed text-center">
              Türkiye'nin yeni nesil otomotiv danışmanlık platformu. Fabrika verisi ve binlerce usta tecrübesi ile araç
              sorunlarınıza profesyonel çözümler sunuyoruz.
            </p>
          </div>

          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-12 -mt-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full -ml-8 -mb-8" />
        </div>
      </div>

      {showScrollToTop && !isMenuOpen && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Sayfanın üstüne git"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Header */}
      <nav
        className={`fixed top-0 w-full bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 ${isMenuOpen ? "z-[9998]" : "z-50"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent md:hidden lg:block">
                NesiVarUsta
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {[
                { name: "Nasıl Çalışır", id: "how-it-works" },
                { name: "Hakkımızda", id: "about" },
                { name: "SSS", id: "faq" },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-300 hover:text-orange-400 transition-all duration-300 font-medium relative group text-sm lg:text-base"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-blue-500 transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <a href="https://wa.me/905391375334" target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white">
                  Whatsapp Uzman Ekibe Bağlan
                </Button>
              </a>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hamburger-button relative w-12 h-12 p-0 hover:bg-gray-800/50 transition-all duration-300 z-50"
              >
                <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                  <span className="block w-6 h-0.5 bg-white" />
                  <span className="block w-6 h-0.5 bg-white mt-1" />
                  <span className="block w-6 h-0.5 bg-white mt-1" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full text-orange-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Fabrika Verisi & Usta Tecrübesi ile Araç Teşhisi
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
              <span className="block bg-gradient-to-r from-orange-400 via-blue-400 to-orange-400 bg-clip-text text-transparent transition-all duration-500">
                {slogans[currentSlogan]}
              </span>
              <span className="block text-3xl md:text-4xl text-gray-300 mt-4">Video Çekin, Çözümü Alın!</span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-12">
              Yüzlerce usta tecrübesi ve binlerce arıza kaydı veri kümesi ile araç sorunlarınıza anında profesyonel
              çözümler sunuyoruz.
            </p>
          </div>

          {/* Demo Interface */}
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-4 md:p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-sm border border-green-500/30 rounded-full text-green-300 text-sm font-medium mb-4">
                    <Play className="w-4 h-4 mr-2" />
                    Canlı Demo - Araç Arıza Ön Teşhis Sistemi
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Veri Kümesi Destekli Araç Teşhis Sistemi</h3>
                  <p className="text-gray-300">Sorununuzu tarif edin, seçenekleri seçin, teşhisinizi alın!</p>
                </div>

                <div className="max-w-4xl mx-auto px-2 md:px-0">
                  <div className="bg-gray-800/50 rounded-xl border border-gray-700 h-80 md:h-96 flex flex-col">
                    <div className="flex-1 p-2 md:p-4 overflow-y-auto space-y-3 md:space-y-4 demo-chat-scrollbar">
                      {demoMessages.map((msg, index) => (
                        <div key={index} className="space-y-2 md:space-y-3">
                          <div className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-xl text-sm md:text-base ${
                                msg.type === "user"
                                  ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white"
                                  : "bg-gray-700 text-gray-200"
                              }`}
                            >
                              <div className="whitespace-pre-line">{msg.message}</div>
                            </div>
                          </div>

                          {msg.showPhotoUpload && (
                            <div className="flex justify-start">
                              <div className="max-w-[85%] md:max-w-md bg-gray-600/30 border-2 border-dashed border-orange-500 rounded-lg p-3 md:p-4">
                                <div className="text-center">
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                                    <Camera className="w-6 h-6 md:w-8 md:h-8 text-orange-400 animate-pulse" />
                                  </div>
                                  <p className="text-orange-300 font-medium mb-2 text-sm md:text-base">
                                    📸 Video Yükleniyor...
                                  </p>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
                                  </div>
                                  <p className="text-gray-400 text-xs md:text-sm mt-2">motor_kapagi.jpg</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.showAnalyzing && (
                            <div className="flex justify-start">
                              <div className="max-w-[85%] md:max-w-md bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 md:p-4">
                                <div className="text-center">
                                  <Brain className="w-10 h-10 md:w-12 md:h-12 text-blue-400 mx-auto mb-2 md:mb-3 animate-spin" />
                                  <p className="text-blue-300 font-medium mb-2 text-sm md:text-base">
                                    🧠 video + Ses Analizi
                                  </p>
                                  <div className="flex justify-center space-x-1 mb-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                                  </div>
                                  <p className="text-gray-400 text-xs md:text-sm">
                                    Görüntü işleme ve ses analizi birleştiriliyor...
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.options && msg.options.length > 0 && (
                            <div className="flex justify-start">
                              <div className="max-w-[85%] md:max-w-md space-y-3 md:space-y-2">
                                {msg.options.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    className="block w-full text-left px-3 md:px-4 py-2 bg-gray-600/50 rounded-lg text-gray-200 hover:bg-orange-500/20 hover:text-orange-300 transition-all duration-300 border border-gray-600 hover:border-orange-500/50 text-sm md:text-base"
                                    disabled
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {isPlaying && demoStep < demoFlow.length && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700 px-3 md:px-4 py-2 md:py-3 rounded-xl">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-1 md:p-2 lg:p-4 border-t border-gray-700">
                      <div className="flex space-x-1 md:space-x-2">
                        <input
                          type="text"
                          placeholder="Mesaj yazın..."
                          className="flex-1 bg-gray-700 border-gray-600 text-white px-2 md:px-3 lg:px-4 py-2 rounded-lg text-xs md:text-sm lg:text-base"
                          disabled
                        />
                        <Button
                          className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 px-2 md:px-3 lg:px-4 py-2"
                          disabled
                        >
                          <Camera className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-2 md:px-3 lg:px-4 py-2"
                        >
                          {isPlaying ? "⏸️" : "▶️"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-xl p-4 md:p-6 border border-orange-500/20">
                      <p className="text-orange-300 font-medium mb-2 text-sm md:text-base">
                        💡 Binlerce usta tecrübesi ve Fabrika verisi bir arada.
                      </p>
                      <p className="text-gray-400 text-xs md:text-sm mb-4">
                        Üyelik sonrası sistemimizle gerçek zamanlı analiz yapabilir, video ve ses yükleyebilir ve detaylı
                        analiz alabilirsiniz.
                      </p>
                      <div className="flex justify-center">
                        <Button
                          onClick={openVoiceflowChat}
                          className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105 text-sm md:text-base"
                        >
                          <Brain className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Ücretsiz Chat'i Dene
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                Nasıl Çalışır?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              3 basit adımda araç sorununuza profesyonel çözüm bulun!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-4 lg:gap-8">
            {[
              {
                step: "01",
                title: "Video Yükle",
                description: "Araç sorununun net ses ve video çekin ve platformumuza yükleyin.",
                icon: <Camera className="w-8 h-8" />,
                color: "from-orange-500 to-red-500",
              },
              {
                step: "02",
                title: "Veri Analizi",
                description: "Binlerce arıza kaydı ve usta tecrübesi ile arızanızı analiz eder ve ön teşhis koyar.",
                icon: <Brain className="w-8 h-8" />,
                color: "from-blue-500 to-purple-500",
              },
              {
                step: "03",
                title: "Uzman Çözümü",
                description:
                  "Deneyimli uzmanlarımızdan topladığımız verilerle oluşturduğumuz algoritmamızla çözüm önerisi ve fiyat bilgisi verir.",
                icon: <CheckCircle className="w-8 h-8" />,
                color: "from-green-500 to-teal-500",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-gray-800/50 border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 hover:scale-105 group h-full">
                  <CardContent className="p-8 text-center relative">
                    <div
                      className={`absolute -top-4 -right-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {step.step}
                    </div>

                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${step.color.replace("500", "500/20")} rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-400 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {step.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors duration-300">
                      {step.title}
                    </h3>

                    <p className="text-gray-300 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-blue-500/5 to-orange-500/5"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                  Hakkımızda
                </span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed mb-6">
                NesiVarUsta, Türkiye'nin yeni nesil veri kümesi destekli otomotiv danışmanlık platformudur. Fabrika
                verisi, yüzlerce usta tecrübesi ve binlerce arıza kaydını birleştirerek, araç sahiplerine anında
                profesyonel çözümler sunuyoruz.
              </p>
              <p className="text-xl text-slate-300 leading-relaxed mb-8">
                Video ve ses analizi teknolojimiz ile araç sorunlarınıza anında profesyonel çözümler sunuyoruz. Usta bilgisi
                ile desteklenen sistemimiz, size en doğru çözüm önerilerini ve maliyet hesaplamalarını sunarak zaman ve
                para tasarrufu sağlıyor.
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-orange-500/50 transition-all duration-500 hover:transform hover:scale-105 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Camera className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Video Analizi</h3>
                    <p className="text-slate-400 text-sm mb-3">Anında teşhis teknolojisi</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-orange-400 text-xs font-semibold">Saniyeler İçinde</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Brain className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Usta Tecrübesi</h3>
                    <p className="text-slate-400 text-sm mb-3">Yüzlerce usta görüşü toplandı</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 text-xs font-semibold">Profesyonel Çözüm</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Smartphone className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Mobil Uygulama</h3>
                    <p className="text-slate-400 text-sm mb-3">Veri destekli araç teşhisi</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-400 text-xs font-semibold">Anında Çözüm</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-green-500/50 transition-all duration-500 hover:transform hover:scale-105 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">7/24 Destek</h3>
                    <p className="text-slate-400 text-sm mb-3">Kesintisiz hizmet</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-semibold">Her Zaman Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Mobil Uygulama Bölümü */}
      <section id="mobile-app" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-blue-500/5 to-orange-500/5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                  NesiVarUsta Mobil
                </span>
                &nbsp;Uygulaması
              </h2>
              {/* 7. Mobil uygulama bölümündeki açıklamayı değiştir */}
              <p className="text-xl text-slate-300 leading-relaxed">
                iOS ve Android için özel olarak tasarlanmış mobil uygulamamızla araç sorunlarınızı dijitalleştirin.
                Artık tek dokunuşla video çekebilir, veri kümesi analizi alabilir ve uzman danışmanlığına
                erişebilirsiniz.
              </p>
              <div className="space-y-6">
                {[
                  {
                    icon: "🤖",
                    title: "Veri Kümesi Analizi",
                    desc: "Anında görüntü işleme ve otomatik teşhis sistemi",
                  },
                  { icon: "💬", title: "Canlı Uzman Desteği", desc: "Uzmanlarla gerçek zamanlı görüşme ve danışmanlık" },
                  { icon: "🔔", title: "Akıllı Bildirimler", desc: "Teşhis sonuçları, öneriler ve acil uyarılar" },
                  {
                    icon: "⭐",
                    title: "Geçmiş Takibi",
                    desc: "Araç bakım geçmişi, raporlar ve maliyet analizi",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="w-12 h-12 bg-slate-800/50 rounded-2xl flex items-center justify-center transition-colors duration-300">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
                        {feature.title}
                      </h4>
                      <p className="text-slate-300">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="bg-black rounded-2xl px-6 py-4 flex items-center min-w-[200px] h-[60px] shadow-lg cursor-not-allowed opacity-75"
                >
                  <div className="mr-4 flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6">
                      <path
                        fill="#4285F4"
                        d="M3.609 1.814L13.792 12 3.609 22.186a1.966 1.966 0 01-.09-0.582V2.396c0-.204.031-.4.09-.582z"
                      />
                      <path
                        fill="#34A853"
                        d="M20.524 10.24l-4.83-2.815L13.792 12l1.902 4.575 4.83-2.815c.48-.28.776-.8.776-1.36s-.296-1.08-.776-1.36z"
                      />
                      <path
                        fill="#FBBC04"
                        d="M3.519 1.232c.312-.18.694-.232 1.066-.14L15.694 7.425 13.792 12 4.585 1.372c-.312-.18-.694-.232-1.066-.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M3.519 22.768c.312.18.694.232 1.066.14L15.694 16.575 13.792 12 4.585 22.628c-.312.18-.694-.232-1.066-.14z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white font-normal leading-tight">YAKINDA ŞU ADRESTE</div>
                    <div className="text-xl text-white font-normal leading-tight">Google Play</div>
                  </div>
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="bg-black rounded-2xl px-6 py-4 flex items-center min-w-[200px] h-[60px] shadow-lg cursor-not-allowed opacity-75"
                >
                  <div className="mr-4 flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.5 2.25c.6-.72 1.01-1.73.9-2.75-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.58-1.23" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white font-normal leading-tight">YAKINDA ŞU ADRESTE</div>
                    <div className="text-xl text-white font-normal leading-tight">App Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Süper Profesyonel Mobil Showcase - NesiVarUsta */}
            <div className="relative flex justify-center items-center min-h-[700px] sm:min-h-[750px] md:min-h-[800px] px-4 overflow-hidden">
              {/* Ana Container */}
              <div className="relative w-full max-w-[320px] sm:max-w-md md:max-w-lg h-[650px] sm:h-[700px] md:h-[750px] flex items-center justify-center perspective-1000 mx-auto">
                {/* Sol Telefon - Chat Geçmişi Listesi - NOW VERTICAL/PORTRAIT */}
                <div className="relative top-0 transform hover:scale-105 transition-all duration-700 z-10 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] mx-auto">
                  <div className="w-full aspect-[9/19] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700/50">
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20"></div>
                    <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white rounded-[2.3rem] relative overflow-hidden flex flex-col">
                      {!isMobileChatOpen ? (
                        <>
                          {/* Status Bar */}
                          <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 bg-white">
                            <div className="text-sm font-semibold text-slate-900">9:41</div>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-1 h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-1 h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-1 h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-1 h-3 bg-slate-400 rounded-full"></div>
                              </div>
                              <div className="w-6 h-3 bg-orange-500 rounded-sm"></div>
                            </div>
                          </div>

                          {/* Header */}
                          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-orange-500 to-blue-500 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <div>
                                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Chat Geçmişi</h3>
                                  <p className="text-orange-100 text-[10px] sm:text-xs font-medium">
                                    Önceki Danışmanlıklarım
                                  </p>
                                </div>
                                {/* 3. Chat icon butonunu tıklanabilir yap ve modal'ı aç: */}
                                <div
                                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all duration-300"
                                  onClick={() => setIsMobileChatOpen(true)}
                                >
                                  <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 text-orange-100">
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-medium">12 Aktif Danışmanlık</span>
                                </div>
                                <div className="text-xs">Son güncelleme: 2 dk önce</div>
                              </div>
                            </div>
                          </div>

                          {/* Chat History List */}
                          <div className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-slate-50 to-white overflow-y-auto demo-chat-scrollbar">
                            {/* Chat Item 1 - En Son */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-200 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full -mr-8 -mt-8"></div>
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                      <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-slate-900 font-bold text-xs sm:text-sm">
                                        Motor Conta Sorunu
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-red-600 text-[10px] sm:text-xs font-bold bg-red-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                      ACİL
                                    </span>
                                    <div className="text-slate-400 text-[10px] sm:text-xs mt-1">2 dk önce</div>
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2">
                                  Son mesaj: "En yakın tamirci önerisi alabilir miyim?"
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-orange-600 text-[10px] sm:text-xs font-semibold">
                                    Maliyet: 800-1200₺
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-600 text-[10px] sm:text-xs">Çözüldü</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Chat Item 2 */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-200 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full -mr-8 -mt-8"></div>
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                      <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-slate-900 font-bold text-xs sm:text-sm">
                                        Fren Balata Aşınması
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-blue-600 text-[10px] sm:text-xs font-bold bg-blue-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                      ORTA
                                    </span>
                                    <div className="text-slate-400 text-[10px] sm:text-xs mt-1">1 saat önce</div>
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2">
                                  Son mesaj: "Teşekkürler, çok yardımcı oldunuz!"
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-blue-600 text-[10px] sm:text-xs font-semibold">
                                    Maliyet: 300-450₺
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-600 text-[10px] sm:text-xs">Tamamlandı</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Chat Item 3 */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-200 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-8 -mt-8"></div>
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                      <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-slate-900 font-bold text-xs sm:text-sm">Klima Arızası</div>
                                      <div className="text-slate-600 text-[10px] sm:text-xs">Soğutmuyor</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-purple-600 text-[10px] sm:text-xs font-bold bg-purple-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                      DÜŞÜK
                                    </span>
                                    <div className="text-slate-400 text-[10px] sm:text-xs mt-1">3 saat önce</div>
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2">
                                  Son mesaj: "Gaz kaçağı tespit edildi"
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-purple-600 text-[10px] sm:text-xs font-semibold">
                                    Maliyet: 150-250₺
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                                    <span className="text-yellow-600 text-[10px] sm:text-xs">Devam Ediyor</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Chat Item 4 */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-200 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full -mr-8 -mt-8"></div>
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                      <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-slate-900 font-bold text-xs sm:text-sm">Lastik Kontrolü</div>
                                      <div className="text-slate-600 text-[10px] sm:text-xs">Rutin bakım</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-green-600 text-[10px] sm:text-xs font-bold bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                      NORMAL
                                    </span>
                                    <div className="text-slate-400 text-[10px] sm:text-xs mt-1">1 gün önce</div>
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2">
                                  Son mesaj: "Lastikler iyi durumda"
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-green-600 text-[10px] sm:text-xs font-semibold">
                                    Ücretsiz Kontrol
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-600 text-[10px] sm:text-xs">Tamamlandı</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Daha Fazla Göster */}
                            <div className="text-center py-3">
                              <button className="text-orange-500 text-sm font-semibold hover:text-orange-600 transition-colors duration-300">
                                Daha Fazla Göster (8 chat daha)
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* DEMO CHAT MODAL - TELEFON EKRANININ İÇİNDE */}
                          {/* Status Bar - Mobil telefon için */}
                          <div className="flex justify-between items-center px-3 sm:px-4 py-3 sm:py-4 bg-white">
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-900">9:41</div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <div className="flex space-x-0.5 sm:space-x-1">
                                <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-slate-900 rounded-full"></div>
                                <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-slate-400 rounded-full"></div>
                              </div>
                              <div className="w-4 h-2 sm:w-6 sm:h-3 bg-orange-500 rounded-sm"></div>
                            </div>
                          </div>

                          {/* Modal Header */}
                          <div className="px-2 sm:px-3 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <button
                                    onClick={() => setIsMobileChatOpen(false)}
                                    className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                                  >
                                    <svg
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                  </button>
                                  <div>
                                    <h3 className="text-xs sm:text-sm font-bold">Demo Chat</h3>
                                    <p className="text-orange-100 text-[8px] sm:text-[9px]">İnteraktif Deneme</p>
                                  </div>
                                </div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-300 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 overflow-y-auto p-2 sm:p-3 bg-gradient-to-b from-slate-50 to-white space-y-2 sm:space-y-3 demo-chat-scrollbar">
                            {mobileChatMessages.map((msg, index) => (
                              <div
                                key={index}
                                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-lg sm:rounded-xl p-2 sm:p-3 ${
                                    msg.type === "user"
                                      ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white"
                                      : "bg-white border border-slate-200 text-slate-800"
                                  }`}
                                >
                                  <p className="text-[10px] sm:text-xs leading-relaxed whitespace-pre-line">
                                    {msg.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Chat Input */}
                          <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200">
                            <div className="flex space-x-1 sm:space-x-1.5">
                              <input
                                type="text"
                                value={mobileChatInput}
                                onChange={(e) => setMobileChatInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleMobileChatSend()
                                  }
                                }}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[10px] sm:text-[11px] focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                onClick={handleMobileChatSend}
                                disabled={!mobileChatInput.trim()}
                                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-blue-500 rounded-lg flex items-center justify-center disabled:opacity-50 hover:shadow-lg transition-all duration-300 flex-shrink-0"
                              >
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                              </button>
                            </div>
                            <p className="text-[7px] sm:text-[8px] text-slate-400 mt-1 text-center leading-tight">
                              💡 uzmana danış - Gerçek uygulamada uzman analizi
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                Sıkça Sorulan Sorular
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Merak ettiğiniz her şey burada! Sorularınızın cevaplarını bulun.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Video ve ses analizi nasıl çalışır?",
                answer:
                  "Algoritmamız, yüklediğiniz video,ses gelişmiş görüntü işleme algoritmaları ile analiz eder. Binlerce araç sorunu örneği ile eğitilmiş modelimiz, videodaki görsel belirtileri, ses tıkırtısını tanıyarak olası sorunları tespit eder ve %95'e varan doğrulukla teşhis koyar.",
              },
              {
                question: "Hangi araç sorunlarını teşhis edebiliyorsunuz?",
                answer:
                  "Tüm araba ve Motosiklet ve Elektirikli araçlar, Motor sorunları, fren sistemi arızaları, süspansiyon problemleri, elektrik arızaları, yağ sızıntıları, lastik aşınmaları, egzoz sorunları ve daha birçok araç problemini teşhis edebiliyoruz. Sistemimiz sürekli güncellenerek yeni sorun türleri de eklenmektedir.",
              },
              {
                question: "Video ve Ses kalitesi teşhis için önemli mi?",
                answer:
                  "Evet, net ve iyi aydınlatılmış video daha doğru teşhis koymamızı sağlar. Video çekerken sorunlu bölgeyi yakından, farklı açılardan ve gün ışığında çekmenizi öneriyoruz. Bulanık veya karanlık Video analiz doğruluğunu etkileyebilir.",
              },
              {
                question: "Verilerim güvende mi? Gizlilik nasıl korunuyor?",
                answer:
                  "Verilerinizin güvenliği bizim için önceliktir. Tüm Video ve Ses ve kişisel bilgiler SSL şifreleme ile korunur. Videolar sadece analiz için kullanılır ve üçüncü taraflarla paylaşılmaz.",
              },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-xl border-t border-gray-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta" className="w-full h-full object-contain rounded-xl" />
              </div>
              <p className="text-gray-400 max-w-md">
                Veri kümesi destekli otomotiv danışmanlığı ile araç sorunlarınıza profesyonel çözümler.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/nesivarusta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800/50 hover:bg-orange-500/20 rounded-xl flex items-center justify-center transition-colors duration-300 text-gray-400 hover:text-orange-400"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-orange-400 transition-colors"
                  >
                    Nasıl Çalışır
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-orange-400 transition-colors"
                  >
                    Hakkımızda
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-orange-400 transition-colors"
                  >
                    SSS
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <>
          ) ;

          <div className="border-t border-gray-800/50 pt-8 mt-8 text-center">
            <p className="text-gray-400 mb-4">© 2025 NesiVarUsta. Tüm hakları saklıdır.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
              <Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">
                Gizlilik Politikası
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link href="/terms-of-service" className="hover:text-orange-400 transition-colors">
                Kullanım Şartları
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
