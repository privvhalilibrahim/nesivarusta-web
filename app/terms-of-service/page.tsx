"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  FileText,
  Scale,
  AlertTriangle,
  CreditCard,
  Users,
  Shield,
  ChevronUp,
  Copyright,
  RefreshCw,
  Gavel,
  Mail,
} from "lucide-react"
import Link from "next/link"

export default function TermsOfService() {
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
            <Scale className="w-4 h-4 mr-2" />
            Hukuki Şartlar
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
              Kullanım Şartları
            </span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            NesiVarUsta platformunu kullanarak aşağıdaki şart ve koşulları kabul etmiş olursunuz. Lütfen dikkatlice
            okuyunuz.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Genel Şartlar */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Genel Şartlar</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Bu kullanım şartları, NesiVarUsta Teknoloji A.Ş. ("Şirket", "biz", "bizim") tarafından işletilen
                NesiVarUsta platformu ("Hizmet", "Platform") ile sizin ("Kullanıcı", "siz", "sizin") aranızdaki hukuki
                ilişkiyi düzenler.
              </p>

              <h3 className="text-lg font-semibold text-orange-400 mt-6">Kabul ve Onay</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bu şartları kabul etmek için 18 yaşında veya daha büyük olmalısınız</li>
                <li>18 yaşından küçükseniz, ebeveyn veya vasi onayı gereklidir</li>
                <li>Platformu kullanarak bu şartları kabul etmiş sayılırsınız</li>
                <li>Şartları kabul etmiyorsanız, platformu kullanmamalısınız</li>
              </ul>
            </div>
          </section>

          {/* Hizmet Tanımı */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Hizmet Tanımı</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>NesiVarUsta, veri kümesi destekli otomotiv danışmanlık hizmetleri sunar:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Veri kümesi destekli araç fotoğraf analizi ve teşhis</li>
                <li>Uzman otomotiv mühendisi danışmanlığı</li>
                <li>Araç sorun tespiti ve çözüm önerileri</li>
                <li>Maliyet hesaplama ve parça önerileri</li>
                <li>7/24 müşteri destek hizmetleri</li>
                <li>Video görüşme ve canlı chat desteği</li>
              </ul>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mt-6">
                <p className="text-orange-300">
                  <strong>Önemli Not:</strong> Hizmetlerimiz danışmanlık niteliğindedir. Kesin teşhis için mutlaka
                  yetkili servise başvurunuz.
                </p>
              </div>
            </div>
          </section>

          {/* Kullanıcı Yükümlülükleri */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Kullanıcı Yükümlülükleri</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-orange-400">Hesap Güvenliği</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hesap bilgilerinizi güvenli tutmak</li>
                <li>Şifrenizi kimseyle paylaşmamak</li>
                <li>Hesabınızda gerçekleşen tüm aktivitelerden sorumlu olmak</li>
                <li>Şüpheli aktiviteleri derhal bildirmek</li>
              </ul>

              <h3 className="text-lg font-semibold text-orange-400 mt-6">Yasak Faaliyetler</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sahte veya yanıltıcı bilgi vermek</li>
                <li>Başkalarının hesaplarını kullanmak</li>
                <li>Platformu zararlı amaçlarla kullanmak</li>
                <li>Telif hakkı ihlali yapacak içerik yüklemek</li>
                <li>Spam veya istenmeyen içerik göndermek</li>
                <li>Sistemleri hacklemeye veya zarar vermeye çalışmak</li>
              </ul>
            </div>
          </section>

          {/* Ödeme ve Faturalama */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Ödeme ve Faturalama</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-orange-400">Ödeme Şartları</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tüm ödemeler Türk Lirası (TL) üzerinden yapılır</li>
                <li>Aylık abonelikler her ay otomatik olarak yenilenir</li>
                <li>Ödeme bilgileri güvenli ödeme sağlayıcıları ile korunur</li>
                <li>Faturalar e-posta adresinize gönderilir</li>
              </ul>

              <h3 className="text-lg font-semibold text-orange-400 mt-6">İptal ve İade</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz</li>
                <li>İptal sonrası mevcut dönem sonuna kadar hizmet devam eder</li>
                <li>14 gün içinde koşulsuz iade hakkınız vardır</li>
                <li>İade talepleri 5-10 iş günü içinde işleme alınır</li>
              </ul>
            </div>
          </section>

          {/* Sorumluluk Sınırlaması */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Sorumluluk Sınırlaması</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 font-semibold mb-2">ÖNEMLİ UYARI</p>
                <p>
                  NesiVarUsta danışmanlık hizmeti sunar. Kesin teşhis ve onarım için mutlaka yetkili servise başvurunuz.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-orange-400">Hizmet Sınırlamaları</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Veri kümesi analizi %100 doğruluk garantisi vermez</li>
                <li>Öneriler genel bilgi amaçlıdır</li>
                <li>Acil durumlar için 112 veya yetkili servisi arayın</li>
                <li>Araç güvenliği konularında profesyonel yardım alın</li>
              </ul>

              <h3 className="text-lg font-semibold text-orange-400 mt-6">Sorumluluk Reddi</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hatalı teşhis veya önerilerden kaynaklanan zararlar</li>
                <li>Üçüncü taraf hizmetlerinden kaynaklanan sorunlar</li>
                <li>İnternet bağlantısı veya teknik aksaklıklar</li>
                <li>Kullanıcı hatalarından kaynaklanan problemler</li>
              </ul>
            </div>
          </section>

          {/* Fikri Mülkiyet */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mr-4">
                <Copyright className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Fikri Mülkiyet Hakları</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Platform üzerindeki tüm içerik, yazılım, tasarım ve markalar NesiVarUsta'nın mülkiyetindedir:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Logo, marka adı ve tasarım unsurları</li>
                <li>AI algoritmaları ve yazılım kodları</li>
                <li>İçerik, makaleler ve rehberler</li>
                <li>Veritabanı ve kullanıcı arayüzü</li>
              </ul>
              <p className="mt-4">Bu içerikleri izinsiz kopyalayamaz, dağıtamaz veya ticari amaçla kullanamazsınız.</p>
            </div>
          </section>

          {/* Değişiklikler */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <RefreshCw className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Şartlarda Değişiklik</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Bu kullanım şartlarını gerektiğinde güncelleyebiliriz:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Değişiklikler platform üzerinde duyurulur</li>
                <li>Önemli değişiklikler e-posta ile bildirilir</li>
                <li>Değişiklikler yayınlandıktan 30 gün sonra yürürlüğe girer</li>
                <li>Değişiklikleri kabul etmiyorsanız hesabınızı kapatabilirsiniz</li>
              </ul>
            </div>
          </section>

          {/* Uygulanacak Hukuk */}
          <section className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                <Gavel className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Uygulanacak Hukuk ve Yetki</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li>Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir</li>
                <li>Uyuşmazlıklar İstanbul Mahkemeleri ve İcra Daireleri'nde çözülür</li>
                <li>Tüketici hakları saklıdır</li>
                <li>KVKK ve diğer ilgili mevzuat hükümleri geçerlidir</li>
              </ul>
            </div>
          </section>

          {/* İletişim */}
          <section className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/70 transition-colors duration-300 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">İletişim Bilgileri</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Kullanım şartları hakkında sorularınız için:</p>
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
