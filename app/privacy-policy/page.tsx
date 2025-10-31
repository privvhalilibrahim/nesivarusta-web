"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, FileText, ChevronUp, Cookie, Mail } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicy() {
  const [showScrollToTop, setShowScrollToTop] = useState(false)

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo ve Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg p-1">
              <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent hidden lg:block">
              NesiVarUsta
            </div>
          </div>
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
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 pt-32 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full text-orange-300 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Gizlilik ve Güvenlik
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
              Gizlilik Politikası
            </span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Kişisel verilerinizin korunması bizim için önceliktir. Bu politika, verilerinizi nasıl topladığımızı,
            kullandığımızı ve koruduğumuzu açıklar.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Veri Toplama */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <Database className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Topladığımız Bilgiler</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-orange-400">Kişisel Bilgiler</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ad, soyad ve iletişim bilgileri (e-posta, telefon)</li>
                <li>Hesap oluşturma sırasında verdiğiniz bilgiler</li>
                <li>Araç bilgileri (marka, model, yıl)</li>
                <li>Ödeme bilgileri (güvenli ödeme sağlayıcıları aracılığıyla)</li>
              </ul>

              <h3 className="text-lg font-semibold text-orange-400 mt-6">Teknik Bilgiler</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Yüklediğiniz araç fotoğrafları</li>
                <li>IP adresi ve cihaz bilgileri</li>
                <li>Tarayıcı türü ve sürümü</li>
                <li>Platform kullanım istatistikleri</li>
              </ul>
            </div>
          </section>

          {/* Veri Kullanımı */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Bilgileri Nasıl Kullanırız</h2>
            </div>
            <div className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Veri kümesi destekli araç teşhis hizmetleri sunmak</li>
                <li>Uzman danışmanlık hizmetleri sağlamak</li>
                <li>Hesabınızı yönetmek ve güvenliğini sağlamak</li>
                <li>Müşteri destek hizmetleri vermek</li>
                <li>Hizmet kalitesini artırmak ve geliştirmek</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                <li>Size özel öneriler ve güncellemeler göndermek (izninizle)</li>
              </ul>
            </div>
          </section>

          {/* Veri Güvenliği */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-4">
                <Lock className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Veri Güvenliği</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Verilerinizin güvenliği için aşağıdaki önlemleri alıyoruz:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>SSL/TLS şifreleme ile veri aktarımı</li>
                <li>Güvenli sunucu altyapısı ve düzenli güvenlik güncellemeleri</li>
                <li>Erişim kontrolü ve yetkilendirme sistemleri</li>
                <li>Düzenli güvenlik denetimleri ve penetrasyon testleri</li>
                <li>Veri yedekleme ve kurtarma prosedürleri</li>
                <li>Çalışan eğitimleri ve gizlilik anlaşmaları</li>
              </ul>
            </div>
          </section>

          {/* Veri Paylaşımı */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mr-4">
                <UserCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Veri Paylaşımı</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Açık rızanızın bulunması durumunda</li>
                <li>Yasal zorunluluklar ve mahkeme kararları</li>
                <li>Hizmet sağlayıcılarımızla (ödeme işlemcileri, bulut hizmetleri) - sadece hizmet sunumu için</li>
                <li>Şirket birleşme, devir veya satış durumlarında</li>
                <li>Güvenlik ve dolandırıcılık önleme amaçlı</li>
              </ul>
            </div>
          </section>

          {/* Haklarınız */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Veri Sahibi Haklarınız</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Bilgi alma hakkı:</strong> Hangi verilerinizin işlendiğini öğrenme
                </li>
                <li>
                  <strong>Erişim hakkı:</strong> Verilerinizin bir kopyasını talep etme
                </li>
                <li>
                  <strong>Düzeltme hakkı:</strong> Yanlış verilerin düzeltilmesini isteme
                </li>
                <li>
                  <strong>Silme hakkı:</strong> Verilerinizin silinmesini talep etme
                </li>
                <li>
                  <strong>İşleme itiraz hakkı:</strong> Veri işlemeye itiraz etme
                </li>
                <li>
                  <strong>Veri taşınabilirliği:</strong> Verilerinizi başka bir hizmete aktarma
                </li>
                <li>
                  <strong>Otomatik karar alma:</strong> Otomatik kararlardan etkilenmeme
                </li>
              </ul>
              <p className="mt-4">
                Bu haklarınızı kullanmak için{" "}
                <a href="mailto:nesivarusta@gmail.com" className="text-orange-400 hover:text-orange-300">
                  nesivarusta@gmail.com
                </a>{" "}
                adresine başvurabilirsiniz.
              </p>
            </div>
          </section>

          {/* Çerezler */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mr-4">
                <Cookie className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Çerez Politikası</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Web sitemizde aşağıdaki çerez türlerini kullanıyoruz:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Zorunlu çerezler:</strong> Sitenin çalışması için gerekli
                </li>
                <li>
                  <strong>Performans çerezleri:</strong> Site performansını ölçmek için
                </li>
                <li>
                  <strong>Fonksiyonel çerezler:</strong> Kullanıcı deneyimini geliştirmek için
                </li>
                <li>
                  <strong>Pazarlama çerezleri:</strong> Kişiselleştirilmiş reklamlar için (izninizle)
                </li>
              </ul>
              <p>Çerez tercihlerinizi tarayıcı ayarlarından yönetebilirsiniz.</p>
            </div>
          </section>

          {/* İletişim */}
          <section className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">İletişim</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Gizlilik politikamız hakkında sorularınız için:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>E-posta:</strong>{" "}
                    <a href="mailto:nesivarusta@gmail.com" className="text-orange-400 hover:text-orange-300">
                      nesivarusta@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 px-8 py-3">
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
