"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Car,
  Settings,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Check,
  Star,
  Shield,
  Brain,
  Camera,
  ChevronDown,
  X,
  Scale,
} from "lucide-react"
import Link from "next/link"

interface FormData {
  // Step 1 - Kişisel Bilgiler
  firstName: string
  lastName: string
  email: string
  phone: string

  // Step 2 - Araç Bilgileri
  carBrand: string
  carModel: string
  carYear: string
  engineSize: string
  fuelType: string

  // Step 3 - Kullanım Tercihleri
  primaryUse: string[]
  frequency: string
  notifications: boolean

  // Step 4 - Paket Seçimi
  selectedPlan: string

  // Step 5 - Hesap Güvenliği
  password: string
  confirmPassword: string

  // Step 6 - Onaylar
  termsAccepted: boolean
  marketingAccepted: boolean
}

const carBrands = [
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Ford",
  "Opel",
  "Renault",
  "Peugeot",
  "Fiat",
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Nissan",
  "Mazda",
  "Skoda",
  "Seat",
  "Citroen",
  "Volvo",
  "Mitsubishi",
  "Suzuki",
  "Dacia",
  "Diğer",
]

const fuelTypes = ["Benzin", "Dizel", "LPG", "Hybrid", "Elektrik", "Benzin+LPG"]

const usageOptions = [
  { id: "photo-analysis", label: "Fotoğraf Analizi", icon: Camera },
  { id: "expert-consultation", label: "Uzman Danışmanlığı", icon: Brain },
  { id: "emergency-support", label: "Acil Destek", icon: Shield },
  { id: "maintenance-tracking", label: "Bakım Takibi", icon: Settings },
]

const plans = [
  {
    id: "basic",
    name: "Temel",
    price: "₺49",
    period: "/ay",
    features: ["5 Fotoğraf Analizi", "Temel Teşhis", "Email Destek", "Mobil Uygulama"],
    color: "from-orange-500 to-red-500",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₺99",
    period: "/ay",
    features: ["Sınırsız Analiz", "Gelişmiş Teşhis", "Canlı Chat", "Uzman Danışmanlık"],
    color: "from-orange-500 to-blue-500",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "₺199",
    period: "/ay",
    features: ["Tüm Pro Özellikler", "7/24 Video Destek", "Özel Uzman", "API Erişimi"],
    color: "from-blue-500 to-purple-500",
  },
]

// Modal Component
const PolicyModal = ({
  isOpen,
  onClose,
  type,
}: { isOpen: boolean; onClose: () => void; type: "privacy" | "terms" }) => {
  if (!isOpen) return null

  const privacyContent = (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Gizlilik Politikası</h2>
        <p className="text-gray-400">Kişisel verilerinizin korunması bizim için önceliktir</p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">Topladığımız Bilgiler</h3>
          <div className="text-gray-300 space-y-2">
            <p>
              <strong>Kişisel Bilgiler:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Ad, soyad ve iletişim bilgileri (e-posta, telefon)</li>
              <li>Hesap oluşturma sırasında verdiğiniz bilgiler</li>
              <li>Araç bilgileri (marka, model, yıl)</li>
              <li>Ödeme bilgileri (güvenli ödeme sağlayıcıları aracılığıyla)</li>
            </ul>
            <p className="mt-4">
              <strong>Teknik Bilgiler:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Yüklediğiniz araç fotoğrafları</li>
              <li>IP adresi ve cihaz bilgileri</li>
              <li>Tarayıcı türü ve sürümü</li>
              <li>Platform kullanım istatistikleri</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Bilgileri Nasıl Kullanırız</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Veri kümesi destekli araç teşhis hizmetleri sunmak</li>
            <li>Uzman danışmanlık hizmetleri sağlamak</li>
            <li>Hesabınızı yönetmek ve güvenliğini sağlamak</li>
            <li>Müşteri destek hizmetleri vermek</li>
            <li>Hizmet kalitesini artırmak ve geliştirmek</li>
            <li>Yasal yükümlülüklerimizi yerine getirmek</li>
            <li>Size özel öneriler ve güncellemeler göndermek (izninizle)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-green-400 mb-3">Veri Güvenliği</h3>
          <p className="text-gray-300 mb-3">Verilerinizin güvenliği için aşağıdaki önlemleri alıyoruz:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>SSL/TLS şifreleme ile veri aktarımı</li>
            <li>Güvenli sunucu altyapısı ve düzenli güvenlik güncellemeleri</li>
            <li>Erişim kontrolü ve yetkilendirme sistemleri</li>
            <li>Düzenli güvenlik denetimleri ve penetrasyon testleri</li>
            <li>Veri yedekleme ve kurtarma prosedürleri</li>
            <li>Çalışan eğitimleri ve gizlilik anlaşmaları</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Veri Sahibi Haklarınız</h3>
          <p className="text-gray-300 mb-3">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
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
          </ul>
          <p className="text-gray-300 mt-3">
            Bu haklarınızı kullanmak için <span className="text-orange-400">nesivarusta@gmail.com</span> adresine
            başvurabilirsiniz.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">Çerez Politikası</h3>
          <p className="text-gray-300 mb-3">Web sitemizde aşağıdaki çerez türlerini kullanıyoruz:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
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
          <p className="text-gray-300">Çerez tercihlerinizi tarayıcı ayarlarından yönetebilirsiniz.</p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">İletişim</h3>
          <div className="text-gray-300 space-y-2">
            <p>
              <strong>E-posta:</strong> nesivarusta@gmail.com
            </p>
            <p>
              <strong>Telefon:</strong> +90 (212) 555-0123
            </p>
            <p>
              <strong>Adres:</strong> Maslak Mahallesi, Teknoloji Caddesi No:1, Sarıyer/İstanbul
            </p>
            <p>
              <strong>Veri Sorumlusu:</strong> NesiVarUsta Teknoloji A.Ş.
            </p>
          </div>
        </section>
      </div>
    </div>
  )

  const termsContent = (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Kullanım Şartları</h2>
        <p className="text-gray-400">NesiVarUsta platformunu kullanarak bu şartları kabul etmiş olursunuz</p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">Genel Şartlar</h3>
          <div className="text-gray-300 space-y-3">
            <p>
              Bu kullanım şartları, NesiVarUsta Teknoloji A.Ş. tarafından işletilen NesiVarUsta platformu ile sizin
              aranızdaki hukuki ilişkiyi düzenler.
            </p>
            <p>
              <strong>Kabul ve Onay:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Bu şartları kabul etmek için 18 yaşında veya daha büyük olmalısınız</li>
              <li>18 yaşından küçükseniz, ebeveyn veya vasi onayı gereklidir</li>
              <li>Platformu kullanarak bu şartları kabul etmiş sayılırsınız</li>
              <li>Şartları kabul etmiyorsanız, platformu kullanmamalısınız</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Hizmet Tanımı</h3>
          <p className="text-gray-300 mb-3">NesiVarUsta, veri kümesi destekli otomotiv danışmanlık hizmetleri sunar:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Veri kümesi destekli araç fotoğraf analizi ve teşhis</li>
            <li>Uzman otomotiv mühendisi danışmanlığı</li>
            <li>Araç sorun tespiti ve çözüm önerileri</li>
            <li>Maliyet hesaplama ve parça önerileri</li>
            <li>7/24 müşteri destek hizmetleri</li>
            <li>Video görüşme ve canlı chat desteği</li>
          </ul>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-4">
            <p className="text-orange-300 text-sm">
              <strong>Önemli Not:</strong> Hizmetlerimiz danışmanlık niteliğindedir. Kesin teşhis için mutlaka yetkili
              servise başvurunuz.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-green-400 mb-3">Kullanıcı Yükümlülükleri</h3>
          <div className="text-gray-300 space-y-3">
            <p>
              <strong>Hesap Güvenliği:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Hesap bilgilerinizi güvenli tutmak</li>
              <li>Şifrenizi kimseyle paylaşmamak</li>
              <li>Hesabınızda gerçekleşen tüm aktivitelerden sorumlu olmak</li>
              <li>Şüpheli aktiviteleri derhal bildirmek</li>
            </ul>
            <p className="mt-3">
              <strong>Yasak Faaliyetler:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Sahte veya yanıltıcı bilgi vermek</li>
              <li>Başkalarının hesaplarını kullanmak</li>
              <li>Platformu zararlı amaçlarla kullanmak</li>
              <li>Telif hakkı ihlali yapacak içerik yüklemek</li>
              <li>Spam veya istenmeyen içerik göndermek</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Ödeme ve Faturalama</h3>
          <div className="text-gray-300 space-y-3">
            <p>
              <strong>Ödeme Şartları:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Tüm ödemeler Türk Lirası (TL) üzerinden yapılır</li>
              <li>Aylık abonelikler her ay otomatik olarak yenilenir</li>
              <li>Ödeme bilgileri güvenli ödeme sağlayıcıları ile korunur</li>
              <li>Faturalar e-posta adresinize gönderilir</li>
            </ul>
            <p className="mt-3">
              <strong>İptal ve İade:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz</li>
              <li>İptal sonrası mevcut dönem sonuna kadar hizmet devam eder</li>
              <li>14 gün içinde koşulsuz iade hakkınız vardır</li>
              <li>İade talepleri 5-10 iş günü içinde işleme alınır</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-red-400 mb-3">Sorumluluk Sınırlaması</h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
            <p className="text-red-300 font-semibold">ÖNEMLİ UYARI</p>
            <p className="text-red-200 text-sm">
              NesiVarUsta danışmanlık hizmeti sunar. Kesin teşhis ve onarım için mutlaka yetkili servise başvurunuz.
            </p>
          </div>
          <div className="text-gray-300 space-y-3">
            <p>
              <strong>Hizmet Sınırlamaları:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Veri kümesi analizi %100 doğruluk garantisi vermez</li>
              <li>Öneriler genel bilgi amaçlıdır</li>
              <li>Acil durumlar için 112 veya yetkili servisi arayın</li>
              <li>Araç güvenliği konularında profesyonel yardım alın</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">Fikri Mülkiyet Hakları</h3>
          <p className="text-gray-300 mb-3">
            Platform üzerindeki tüm içerik, yazılım, tasarım ve markalar NesiVarUsta'nın mülkiyetindedir:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Logo, marka adı ve tasarım unsurları</li>
            <li>AI algoritmaları ve yazılım kodları</li>
            <li>İçerik, makaleler ve rehberler</li>
            <li>Veritabanı ve kullanıcı arayüzü</li>
          </ul>
          <p className="text-gray-300 mt-3">
            Bu içerikleri izinsiz kopyalayamaz, dağıtamaz veya ticari amaçla kullanamazsınız.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Şartlarda Değişiklik</h3>
          <p className="text-gray-300 mb-3">Bu kullanım şartlarını gerektiğinde güncelleyebiliriz:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Değişiklikler platform üzerinde duyurulur</li>
            <li>Önemli değişiklikler e-posta ile bildirilir</li>
            <li>Değişiklikler yayınlandıktan 30 gün sonra yürürlüğe girer</li>
            <li>Değişiklikleri kabul etmiyorsanız hesabınızı kapatabilirsiniz</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Uygulanacak Hukuk ve Yetki</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir</li>
            <li>Uyuşmazlıklar İstanbul Mahkemeleri ve İcra Daireleri'nde çözülür</li>
            <li>Tüketici hakları saklıdır</li>
            <li>KVKK ve diğer ilgili mevzuat hükümleri geçerlidir</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">İletişim Bilgileri</h3>
          <div className="text-gray-300 space-y-2">
            <p>
              <strong>E-posta:</strong> nesivarusta@gmail.com
            </p>
            <p>
              <strong>Telefon:</strong> +90 (212) 555-0123
            </p>
            <p>
              <strong>Müşteri Hizmetleri:</strong> nesivarusta@gmail.com
            </p>
            <p>
              <strong>Adres:</strong> Maslak Mahallesi, Teknoloji Caddesi No:1, Sarıyer/İstanbul
            </p>
            <p>
              <strong>Şirket:</strong> NesiVarUsta Teknoloji A.Ş.
            </p>
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            {type === "privacy" ? (
              <Shield className="w-6 h-6 text-orange-400" />
            ) : (
              <Scale className="w-6 h-6 text-orange-400" />
            )}
            <h3 className="text-xl font-bold text-white">
              {type === "privacy" ? "Gizlilik Politikası" : "Kullanım Şartları"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl flex items-center justify-center transition-colors duration-300 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{type === "privacy" ? privacyContent : termsContent}</div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    carBrand: "",
    carModel: "",
    carYear: "",
    engineSize: "",
    fuelType: "",
    primaryUse: [],
    frequency: "",
    notifications: true,
    selectedPlan: "pro",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    marketingAccepted: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [modalOpen, setModalOpen] = useState<"privacy" | "terms" | null>(null)

  const totalSteps = 6

  // Mouse tracking for dynamic effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = "Ad gereklidir"
        if (!formData.lastName.trim()) newErrors.lastName = "Soyad gereklidir"
        if (!formData.email.trim()) {
          newErrors.email = "E-posta gereklidir"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Geçerli bir e-posta adresi giriniz"
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Telefon numarası gereklidir"
        } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phone)) {
          newErrors.phone = "Geçerli bir telefon numarası giriniz"
        }
        break

      case 2:
        if (!formData.carBrand) newErrors.carBrand = "Araç markası seçiniz"
        if (!formData.carModel.trim()) newErrors.carModel = "Araç modeli gereklidir"
        if (!formData.carYear) newErrors.carYear = "Araç yılı seçiniz"
        if (!formData.fuelType) newErrors.fuelType = "Yakıt türü seçiniz"
        break

      case 3:
        if (formData.primaryUse.length === 0) newErrors.primaryUse = "En az bir kullanım alanı seçiniz"
        if (!formData.frequency) newErrors.frequency = "Kullanım sıklığı seçiniz"
        break

      case 5:
        if (!formData.password) {
          newErrors.password = "Şifre gereklidir"
        } else if (formData.password.length < 8) {
          newErrors.password = "Şifre en az 8 karakter olmalıdır"
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Şifre tekrarı gereklidir"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Şifreler eşleşmiyor"
        }
        break

      case 6:
        if (!formData.termsAccepted) newErrors.termsAccepted = "Kullanım şartlarını kabul etmelisiniz"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsLoading(false)
      // Redirect to success page or dashboard
      console.log("Form submitted:", formData)
    }
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const togglePrimaryUse = (useId: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryUse: prev.primaryUse.includes(useId)
        ? prev.primaryUse.filter((id) => id !== useId)
        : [...prev.primaryUse, useId],
    }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Kişisel Bilgileriniz</h2>
              <p className="text-gray-400">Size özel hizmet sunabilmemiz için bilgilerinizi paylaşın</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Ad *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  className={`w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                    errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                  }`}
                  placeholder="Adınız"
                />
                {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Soyad *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  className={`w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                    errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                  }`}
                  placeholder="Soyadınız"
                />
                {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">E-posta Adresi *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                  }`}
                  placeholder="ornek@email.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Telefon Numarası *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                    errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                  }`}
                  placeholder="+90 (555) 123 45 67"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Araç Bilgileriniz</h2>
              <p className="text-gray-400">Size özel teşhis ve öneriler sunabilmemiz için araç bilgilerinizi girin</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Araç Markası *</label>
                <div className="relative">
                  <select
                    value={formData.carBrand}
                    onChange={(e) => updateFormData("carBrand", e.target.value)}
                    className={`w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 appearance-none text-sm md:text-base ${
                      errors.carBrand ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                    }`}
                  >
                    <option value="">Marka seçiniz</option>
                    {carBrands.map((brand) => (
                      <option key={brand} value={brand} className="bg-gray-800">
                        {brand}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.carBrand && <p className="text-red-400 text-sm">{errors.carBrand}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Araç Modeli *</label>
                <input
                  type="text"
                  value={formData.carModel}
                  onChange={(e) => updateFormData("carModel", e.target.value)}
                  className={`w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                    errors.carModel ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                  }`}
                  placeholder="Örn: A4, Golf, Corolla"
                />
                {errors.carModel && <p className="text-red-400 text-sm">{errors.carModel}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Model Yılı *</label>
                <div className="relative">
                  <select
                    value={formData.carYear}
                    onChange={(e) => updateFormData("carYear", e.target.value)}
                    className={`w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 appearance-none text-sm md:text-base ${
                      errors.carYear ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                    }`}
                  >
                    <option value="">Yıl seçiniz</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map((year) => (
                      <option key={year} value={year} className="bg-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.carYear && <p className="text-red-400 text-sm">{errors.carYear}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Motor Hacmi</label>
                <input
                  type="text"
                  value={formData.engineSize}
                  onChange={(e) => updateFormData("engineSize", e.target.value)}
                  className="w-full px-3 md:px-4 py-3 md:py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-sm md:text-base"
                  placeholder="Örn: 1.6, 2.0, 1.4 TSI"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Yakıt Türü *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fuelTypes.map((fuel) => (
                  <button
                    key={fuel}
                    type="button"
                    onClick={() => updateFormData("fuelType", fuel)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      formData.fuelType === fuel
                        ? "border-orange-500 bg-orange-500/20 text-orange-300"
                        : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>
              {errors.fuelType && <p className="text-red-400 text-sm">{errors.fuelType}</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Kullanım Tercihleriniz</h2>
              <p className="text-gray-400">Hangi hizmetlerimizi kullanmayı planlıyorsunuz?</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-300">Kullanmak İstediğiniz Hizmetler *</label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                {usageOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = formData.primaryUse.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => togglePrimaryUse(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/20"
                          : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-orange-500/30" : "bg-gray-600/30"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-orange-400" : "text-gray-400"}`} />
                        </div>
                        <span className={`font-medium ${isSelected ? "text-orange-300" : "text-gray-300"}`}>
                          {option.label}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-orange-400 ml-auto" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              {errors.primaryUse && <p className="text-red-400 text-sm">{errors.primaryUse}</p>}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-300">Ne Sıklıkla Kullanmayı Planlıyorsunuz? *</label>
              <div className="space-y-3">
                {[
                  { id: "daily", label: "Günlük", desc: "Her gün aktif kullanım" },
                  { id: "weekly", label: "Haftalık", desc: "Haftada birkaç kez" },
                  { id: "monthly", label: "Aylık", desc: "Ayda birkaç kez" },
                  { id: "occasional", label: "Ara sıra", desc: "İhtiyaç duyduğumda" },
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => updateFormData("frequency", freq.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.frequency === freq.id
                        ? "border-orange-500 bg-orange-500/20"
                        : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div
                          className={`font-medium ${formData.frequency === freq.id ? "text-orange-300" : "text-gray-300"}`}
                        >
                          {freq.label}
                        </div>
                        <div className="text-sm text-gray-400">{freq.desc}</div>
                      </div>
                      {formData.frequency === freq.id && <Check className="w-5 h-5 text-orange-400" />}
                    </div>
                  </button>
                ))}
              </div>
              {errors.frequency && <p className="text-red-400 text-sm">{errors.frequency}</p>}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-xl">
              <input
                type="checkbox"
                id="notifications"
                checked={formData.notifications}
                onChange={(e) => updateFormData("notifications", e.target.checked)}
                className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-700 accent-orange-500"
              />
              <label htmlFor="notifications" className="text-gray-300">
                E-posta ve SMS bildirimleri almak istiyorum
              </label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Paket Seçimi</h2>
              <p className="text-gray-400">İhtiyaçlarınıza en uygun paketi seçin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    formData.selectedPlan === plan.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                  }`}
                  onClick={() => updateFormData("selectedPlan", plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                        EN POPÜLER
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-3xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                      >
                        {plan.price}
                      </span>
                      <span className="text-gray-400 ml-1">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-orange-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {formData.selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1">14 Gün Ücretsiz Deneme</h4>
                  <p className="text-blue-200 text-sm">
                    Seçtiğiniz paketi 14 gün boyunca ücretsiz deneyebilirsiniz. İstediğiniz zaman iptal edebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Hesap Güvenliği</h2>
              <p className="text-gray-400">Hesabınız için güvenli bir şifre oluşturun</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Şifre *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-orange-500"
                    }`}
                    placeholder="En az 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Şifre Tekrarı *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 md:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm md:text-base ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-orange-500"
                    }`}
                    placeholder="Şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3">Şifre Gereksinimleri:</h4>
              <ul className="space-y-2 text-sm">
                <li
                  className={`flex items-center ${formData.password.length >= 8 ? "text-green-400" : "text-gray-400"}`}
                >
                  <Check
                    className={`w-4 h-4 mr-2 ${formData.password.length >= 8 ? "text-green-400" : "text-gray-400"}`}
                  />
                  En az 8 karakter
                </li>
                <li
                  className={`flex items-center ${/[A-Z]/.test(formData.password) ? "text-green-400" : "text-gray-400"}`}
                >
                  <Check
                    className={`w-4 h-4 mr-2 ${/[A-Z]/.test(formData.password) ? "text-green-400" : "text-gray-400"}`}
                  />
                  En az bir büyük harf
                </li>
                <li
                  className={`flex items-center ${/[0-9]/.test(formData.password) ? "text-green-400" : "text-gray-400"}`}
                >
                  <Check
                    className={`w-4 h-4 mr-2 ${/[0-9]/.test(formData.password) ? "text-green-400" : "text-gray-400"}`}
                  />
                  En az bir rakam
                </li>
              </ul>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Son Adım!</h2>
              <p className="text-gray-400">Kayıt işlemini tamamlamak için onaylarınızı verin</p>
            </div>

            {/* Özet Bilgiler */}
            <div className="bg-gray-700/30 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Kayıt Özeti</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Ad Soyad:</span>
                  <span className="text-white ml-2">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">E-posta:</span>
                  <span className="text-white ml-2">{formData.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Araç:</span>
                  <span className="text-white ml-2">
                    {formData.carBrand} {formData.carModel} ({formData.carYear})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Seçilen Paket:</span>
                  <span className="text-orange-400 ml-2 font-semibold">
                    {plans.find((p) => p.id === formData.selectedPlan)?.name} -{" "}
                    {plans.find((p) => p.id === formData.selectedPlan)?.price}/ay
                  </span>
                </div>
              </div>
            </div>

            {/* Onaylar */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData("termsAccepted", e.target.checked)}
                  className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-700 accent-orange-500 mt-0.5"
                />
                <label htmlFor="terms" className="text-gray-300 text-sm">
                  <button
                    type="button"
                    onClick={() => setModalOpen("terms")}
                    className="text-orange-400 hover:text-orange-300 underline"
                  >
                    Kullanım Şartları
                  </button>{" "}
                  ve{" "}
                  <button
                    type="button"
                    onClick={() => setModalOpen("privacy")}
                    className="text-orange-400 hover:text-orange-300 underline"
                  >
                    Gizlilik Politikası
                  </button>
                  'nı okudum ve kabul ediyorum. *
                </label>
              </div>
              {errors.termsAccepted && <p className="text-red-400 text-sm ml-8">{errors.termsAccepted}</p>}

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.marketingAccepted}
                  onChange={(e) => updateFormData("marketingAccepted", e.target.checked)}
                  className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-700 accent-orange-500 mt-0.5"
                />
                <label htmlFor="marketing" className="text-gray-300 text-sm">
                  Kampanya, promosyon ve yeni özellikler hakkında e-posta almak istiyorum.
                </label>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h4 className="text-orange-300 font-semibold mb-1">Güvenlik Garantisi</h4>
                  <p className="text-orange-200 text-sm">
                    Tüm bilgileriniz SSL şifreleme ile korunur. Kredi kartı bilgileriniz güvenli ödeme sağlayıcıları
                    tarafından işlenir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
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

      {/* Policy Modal */}
      <PolicyModal isOpen={modalOpen !== null} onClose={() => setModalOpen(null)} type={modalOpen || "privacy"} />

      {/* Header */}
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobil görünümde farklı düzen */}
          <div className="block md:hidden mb-8">
            {/* Ana Sayfaya Dön Butonu - Mobilde üstte ortada */}
            <div className="text-center mb-6">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span>Ana Sayfaya Dön</span>
              </Link>
            </div>

            {/* Logo - Mobilde ortada */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg p-1">
                  <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                  NesiVarUsta
                </div>
              </div>
            </div>
          </div>

          {/* Desktop görünümde eski düzen */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Ana Sayfaya Dön</span>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                NesiVarUsta
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-xs md:text-sm text-gray-400">
                Adım {currentStep} / {totalSteps}
              </span>
              <span className="text-xs md:text-sm text-gray-400">
                {Math.round((currentStep / totalSteps) * 100)}% Tamamlandı
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-4 md:p-8">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>

                {currentStep === totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold px-6 md:px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Kaydediliyor...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Kaydı Tamamla</span>
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold px-6 md:px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105 text-sm md:text-base"
                  >
                    İleri
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-4 md:mt-6">
            <p className="text-gray-400 text-xs md:text-sm">
              Yardıma mı ihtiyacınız var?{" "}
              <a href="mailto:destek@nesivarusta.com" className="text-orange-400 hover:text-orange-300">
                destek@nesivarusta.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
