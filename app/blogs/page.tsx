"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Calendar,
  MessageSquare,
  Instagram,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ArrowRight,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination"

// Blog post interface
interface BlogPost {
  id: number
  title: string
  description: string
  date: string
  comments: number
  image: string
  category: string
  tags: string[]
}

// Sample blog data
const blogPosts: BlogPost[] = [
 
  {
    id: 21,
    title: "Subaru Yeni Bir WRX STI Tanıttı - Ama Umduğumuz Değil",
    description: "Subaru, Tokyo Otomobil Fuarı'nda manuel şanzımanlı WRX STI Sport♯ prototipini tanıttı. Ancak bu model, hayranların beklediği tam bir STI dönüşü değil.",
    date: "13 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzE0/2026-subaru-wrx-sti-sport.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Subaru", "WRX", "STI", "Haber"],
  },
  {
    id: 22,
    title: "Yenilenen Nissan Z Yeni Yeşil Renk ve İlginç Bir Şanzıman ile Tanıtıldı",
    description: "Nissan Z'nin facelift versiyonu 2026 Tokyo Auto Salon'da tanıtıldı. En dikkat çekici değişiklik, Unryu Green adlı yeni yeşil renk ve manuel Nismo versiyonunun onaylanması.",
    date: "14 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzNDQw/2027-nissan-z-facelift_03.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nissan", "Z", "Haber", "Performans"],
  },
  {
    id: 23,
    title: "Araştırma: Alıcılar Araba Satın Alma Pratiklerini Eski Usulde Tutmak İstiyor",
    description: "Yeni bir araştırma, dijital çağda bile araba alıcılarının önemli belgeleri kağıt üzerinde imzalamayı ve finansman görüşmelerini yüz yüze yapmayı tercih ettiğini gösteriyor.",
    date: "14 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyMDc5/gettyimages-2218817292.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Araştırma", "Satın Alma", "Öneri"],
  },
  {
    id: 24,
    title: "Aura Nismo RS, Nissan'ın İnşa Etmek İstediği Toyota GR Yaris Rakibi Olarak Tanıtıldı",
    description: "Nissan, 2026 Tokyo Auto Salon'da Aura RS Nismo Concept'i tanıttı. Bu hibrit teknolojili küçük hot hatch, Toyota GR Yaris'in potansiyel bir rakibi olarak görülüyor.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzQw/3263-1033340.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nissan", "Nismo", "Haber", "Performans"],
  },
  {
    id: 26,
    title: "Kongre Direksiyonsuz Sürücüsüz Arabaları Hızlandırmaya Çalışıyor",
    description: "ABD Kongresi, geleneksel insan kontrolleri olmadan çalışan otonom araçların hızlandırılması için yasa tasarısını görüşüyor.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTE5ODUy/gettyimages-2220716767.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Otonom", "Teknoloji", "Haber"],
  },
  {
    id: 27,
    title: "Porsche: Benzinli Macan'ı Elektrikli ile Değiştirmekte Yanıldık",
    description: "Porsche'nin eski CEO'su Oliver Blume, Macan'ın sadece elektrikli versiyonunu sunma kararının bir hata olduğunu kabul etti.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjExMDEwNDk5NTkxMDIyMTI3/porsche-macan-4s-electric.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Porsche", "Macan", "Haber"],
  },
  {
    id: 28,
    title: "Rivian, 2026'nın İlk Büyük Araç Geri Çağırma İşlemini R1T ve R1S İçin Çarpışma Riski Nedeniyle Yaptı",
    description: "Rivian, 2022-2025 model R1T ve R1S araçlarında arka süspansiyon toe link eklemlerinde sorun olabileceğini bildirdi.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTM2MzAx/screenshot-2025-08-11-at-09-30-00.jpg?arena_f_auto",
    category: "Arıza",
    tags: ["Rivian", "Geri Çağırma", "Güvenlik"],
  },
  {
    id: 31,
    title: "2026 Mitsubishi Outlander Bayi Ziyareti Olmadan 5G Üzerinden Kendini Güncelleyebiliyor",
    description: "Mitsubishi ve AT&T ortaklığı, 2026 Outlander'a 5G bağlantısı getiriyor ve araçların havadan yazılım güncellemeleri almasına olanak sağlıyor.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "/placeholder.svg",
    category: "Öneri",
    tags: ["Mitsubishi", "Outlander", "Teknoloji"],
  },
  {
    id: 32,
    title: "Rezvani'nin Sert V8 Güçlü Tank'ı 2026 İçin 1.000 HP'lik Büyük Bir Yeniden Tasarım Aldı",
    description: "Rezvani Tank, 2017'den bu yana ilk kez tam bir yeniden tasarımla geldi ve Dodge Demon'dan 1.000 beygir gücünde bir seçenek sunuyor.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNTcz/2026-rezvani-tank-main.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Rezvani", "Tank", "Performans"],
  },
  {
    id: 38,
    title: "Toyota'nın Gazoo Racing Artık Bağımsız Bir Marka",
    description: "Toyota, Gazoo Racing'i güçlendirmek için 'Toyota' ismini bırakıp sadece 'Gazoo Racing' olarak yeniden markalaştırıyor.",
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNTY1/toyota-gazoo-racing-badge-copy.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "Gazoo Racing", "Haber"],
  },
  {
    id: 41,
    title: "Ford CEO'su Senato'ya Neden Arabalar Bu Kadar Pahalı Sorusuna Cevap Vermiyor — Henüz Değil",
    description: "ABD Senatosu arabaların neden bu kadar pahalı olduğunu öğrenmek istiyor, ancak Ford CEO'su Jim Farley ifade vermek istemiyor — en azından henüz değil.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjA5MTIyNjkxODE0NDAxNjQ4/jim-farley-vintage-racing.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Ford", "Haber", "Politika"],
  },
  {
    id: 42,
    title: "2026 Shelby American Super Snake Ford Mustang'ı 830 Beygir Gücünde Bir Canavara Dönüştürüyor",
    description: "Detroit Otomobil Fuarı'nın gelmesini sabırla beklerken, Shelby American bize en az o kadar heyecan verici bir şey sunma özgürlüğünü aldı: 2026 Shelby American Super Snake.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzOTMy/shelbysupersnake-26-gallery-17.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Shelby", "Ford", "Mustang", "Performans"],
  },
  {
    id: 43,
    title: "Volvo Geçen Yıl Aynı Sorun İçin Geri Çağırdığı Arabaları Yine Düzeltiyor",
    description: "Mayıs 2025'te Volvo, arka kamera sorunu için bir güvenlik geri çağırma işlemi başlattı: Google tabanlı eğlence ekranları, arka kamera görüntüsünün gösterilmesini engelleyen hatalı yazılıma sahip.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTQ2NTgy/352206-volvo-xc70-long-range-phev.jpg?arena_f_auto",
    category: "Arıza",
    tags: ["Volvo", "Geri Çağırma", "Güvenlik"],
  },
  {
    id: 44,
    title: "Caterham'ın Muhteşem Elektrikli Spor Arabası Amerika'ya Geliyor",
    description: "Caterham'ın 2+2 Project V spor arabası, bu hafta Tokyo Auto Salon'da çalışan bir prototip görünmeden önce, Las Vegas'taki 2026 Consumer Electronics Show'da gösteri arabası formunda yerini aldı.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyOTU1/v-hero-main.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Caterham", "Elektrikli", "Haber"],
  },
  {
    id: 45,
    title: "Bir Çinli Otomobil Üreticisi CES'te Yeni Bir Çift Turbo V8 Tanıttı",
    description: "Sektör genelindeki bu akıma karşı, Great Wall Motor (GWM) CES 2026'da kendi geliştirdiği dört litrelik çift turbo V8'i tanıtarak kasıtlı olarak yıkıcı bir açıklama yaptı.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzEy/gwm-v8-2.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["GWM", "V8", "Haber"],
  },
  {
    id: 46,
    title: "Ultra Sınırlı Toyota GR Yaris Morizo RR Sert Performansla Tanıtıldı",
    description: "Toyota GR Yaris Morizo RR ile tanışın – zaten vahşi bir hot hatch üzerine daha pist odaklı, Nürburgring'den beslenmiş bir yaklaşım. Morizo'nun kendisi de bunu şekillendirmekte rol aldı ve sonuç, sadece sayılar için değil, sürücüler için yapılmış bir araç.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMjUz/toyota-gr-yaris-morizo-rr_01_09-1033253.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "GR Yaris", "Performans"],
  },
  {
    id: 47,
    title: "Mercedes 600.000 Dolarlık G-Wagen Teslimat Sırasında Kaybolduktan Sonra Dava Açıyor",
    description: "600.000 doların hemen altında bir satış fiyatına sahip bir Mercedes-AMG G 63, New York'taki bir bayilik ile Nevada'daki bir araç yolunun arasında bir yerde kayboldu.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyODE4/image.jpg?arena_f_auto",
    category: "Haber",
    tags: ["Mercedes", "Haber"],
  },
  {
    id: 48,
    title: "Ford 30.000 Dolarlık Elektrikli Araçlarına Gözler Kapalı Otonom Sürüşün Geleceğini Doğruladı",
    description: "Yakın zamanda üretimi durdurulan elektrikli pikap F-150 Lightning'dan çıkarılan zor derslerle, Ford şimdi yaklaşan Universal EV platformunu mükemmelleştirmeye odaklanıyor.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjEwMDc0MTcxNDg3NTYxMTgy/2023-mustang-mach-e-premium-bluecruise.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Ford", "Elektrikli", "Teknoloji"],
  },
  {
    id: 49,
    title: "Volvo'nun Yeni Elektrikli SUV'u Etkileyici Menzil ve 10 Dakikada Şarj İddiasında",
    description: "Volvo bu ayın ilerleyen zamanlarında açıklayacağı elektrikli crossover'dan son derece gurur duyuyor ve bunun için her hakkı var. İsveçli otomobil üreticisi, yaklaşan EX60'ın sınıfının en iyisi 810 kilometre veya 503 mil menzil sunduğunu açıkladı.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyODQz/ex60-exterior-front.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Volvo", "EX60", "Elektrikli"],
  },
  {
    id: 50,
    title: "Jeep, Ram ve Dodge Stellantis'i Zorlu Bir 2025'te Güçlendirdi",
    description: "2025'te Stellantis grubu, bazı markalarına olan ilgiyi yeniden canlandırmak için birçok yeni araç başlattı. Dikkat çekici lansmanlar arasında yeni nesil Dodge Charger EV ve SIXPACK var.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDIxNzc5/2026-jeep-gladiator-sahara.png?arena_f_auto",
    category: "Öneri",
    tags: ["Stellantis", "Jeep", "Haber"],
  },
  {
    id: 51,
    title: "Toyota FJ Cruiser'ı Gizlice İnşa Etti—Şimdi Bir Kült Klasik",
    description: "90'ların sonu ve 2000'lerin başı, piyasaya çıkan retrofütüristik arabalar dalgasına tanık oldu. Bazı önemli örnekler arasında New Beetle, Mini ve PT Cruiser var.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNzQ2/3203-1032746.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "FJ Cruiser", "Koleksiyon"],
  },
  {
    id: 52,
    title: "Hırsızlar Merhum Formula 1 Pilotu Jules Bianchi'nin Son Go-Kart'ını Çaldı",
    description: "Dünya çapındaki Formula 1 hayranları bu hafta Bianchi ailesiyle birlikte yürekleri kırık. Jules Bianchi'nin babası Philippe, Facebook'ta hırsızların oğlunun son yarıştığı go-kart'ı çaldığını açıkladı.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyMDM2/untitled-design.jpg?arena_f_auto",
    category: "Haber",
    tags: ["Formula 1", "Haber"],
  },
  {
    id: 53,
    title: "Fransız Mikro Araç 6 On Yıldır Durmakta Olan Nürburgring Tur Rekorunu Kırdı",
    description: "Nürburgring, bir yarış pisti olarak, sadece Green Hell olarak bilinmekten modern bağlamda daha da ilgili hale gelmeye kadar itibarını dönüştürdü.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNTIz/ligier-js50-nurburgring-lap-record-1.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nürburgring", "Rekor", "Haber"],
  },
  {
    id: 54,
    title: "Mitsubishi'nin Maceracı Minivan'ı Daha Eğlenceli Olmak Üzere",
    description: "Mitsubishi Delica D:5 Amerika ve dünyanın çoğu için yasak meyve. Yüzeyde, sürgülü kapıları ve insanlar için gerçek alanı olan düz bir minivan.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxODQ2/mitsubishi-delica-mini-for-2026-tokyo-auto-salon_1_01.png?arena_f_auto",
    category: "Öneri",
    tags: ["Mitsubishi", "Delica", "Haber"],
  },
  {
    id: 55,
    title: "Yedek Parça Jantlar Zaten Bugatti'nin 4 Milyon Dolarlık Tourbillon'unu Hedefliyor",
    description: "Bugatti henüz tek bir Tourbillon'u müşteriye teslim etmeden önce, yedek parça sektörü devreye girmeye başladı. Vossen yeni V16 hypercar için dövülmüş LC3 jant setini tanıttı.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxOTYx/bugatti-tourbillon-vossen-1-1031961.jpeg?arena_f_auto",
    category: "Öneri",
    tags: ["Bugatti", "Tourbillon", "Haber"],
  },
  {
    id: 56,
    title: "Tesla Cybercab İsmini Kullanma Hakkını Satın Alması Gerekiyor—ve Yakında",
    description: "Sahne hazırdı ve ışıklar parlaktı, Tesla geçen Ekim 2024'te \"We, Robot\" etkinliğinde Cybercab'i tanıttığında. Ancak elektrikli araç üreticisi ödevini yapmamış gibi görünüyor.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNTQz/tesla-cybercab.png?arena_f_auto",
    category: "Öneri",
    tags: ["Tesla", "Cybercab", "Haber"],
  },
  {
    id: 57,
    title: "Mazda'nın CX-30 Satışları 2025'te Çöktü—Ancak Marka Bunun Kasıtlı Olduğunu Söylüyor",
    description: "Yüzeyde, rakamlar hikayeyi anlatıyor: Mazda CX-30, otomobil üreticisinin 2025 ABD ürün gamında en büyük darbelerden birini aldı. Aralık satışları 2.749 birime düştü, bir önceki yıla göre %69 azalma.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjA5MTMxNTczNTQxMDIxNTQw/2020-mazda-cx-30.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Mazda", "CX-30", "Haber"],
  },
  {
    id: 58,
    title: "Cybertruck Sahibi Tesla'nın Tam Otonom Sürüşünün Ölümcül Bir Kazayı Önlemeye Yardımcı Olduğunu Söylüyor",
    description: "Tesla'nın Full Self-Driving (FSD) sistemi yaygın güvenlik incelemesiyle karşı karşıya kaldı, bazı olaylar davalara dönüştü. Ancak CBS Austin'in son bir raporu, sistemin etkili bir şekilde performans gösterdiği bir senaryoyu vurguluyor.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNjA3/tesla-cybertruck.png?arena_f_auto",
    category: "Öneri",
    tags: ["Tesla", "Cybertruck", "Teknoloji"],
  },
  {
    id: 59,
    title: "Hyundai'nin İnsansı Robotu 2035'e Kadar Fabrikalardan Evlere Taşınabilir",
    description: "Atlas ile tanışın. Boston Dynamics laboratuvarından çıkan büyüyen robot ailesinin en yeni üyesi – belki de köpek benzeri Spot'uyla en çok tanınan.",
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNzI3/hyundai-atlas-robot-posed.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Hyundai", "Robot", "Teknoloji"],
  },
]

// Recent news interface
interface RecentNews {
  id: number
  title: string
  date: string
  image: string
}

// Get recent news from blog posts (last 3 posts)
const recentNews: RecentNews[] = blogPosts
  .slice(0, 3)
  .map((post) => ({
    id: post.id,
    title: post.title,
    date: post.date,
    image: post.image,
  }))

// Calculate category counts dynamically
const getCategoryCount = (categoryName: string) => {
  if (categoryName === "Tümü") {
    return blogPosts.length
  }
  return blogPosts.filter((post) => post.category === categoryName).length
}

// Categories
const categories = [
  { name: "Tümü", count: getCategoryCount("Tümü") },
  { name: "Arıza", count: getCategoryCount("Arıza") },
  { name: "Bakım", count: getCategoryCount("Bakım") },
  { name: "Öneri", count: getCategoryCount("Öneri") },
]

// Get tags from all blog posts dynamically (max 10)
const getAllTags = (): string[] => {
  const allTags = new Set<string>()
  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => allTags.add(tag))
  })
  // Alfabetik sırala ve en fazla 10 etiket göster
  return Array.from(allTags).sort().slice(0, 10)
}

// Tags (dynamically generated from blog posts, max 10)
const tags = getAllTags()

function BlogsPageContent() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState("Tümü")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const [blogStats, setBlogStats] = useState<Record<number, { likes_count: number; dislikes_count: number }>>({})
  const [userBlogReactions, setUserBlogReactions] = useState<Record<number, "like" | "dislike" | null>>({})

  // Set category from URL parameter on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam)
      // Validate category exists
      const validCategories = ["Tümü", "Arıza", "Bakım", "Öneri"]
      if (validCategories.includes(decodedCategory)) {
        setSelectedCategory(decodedCategory)
      }
    }
  }, [searchParams])

  // Yorum sayılarını yükle
  useEffect(() => {
    const loadCommentCounts = async () => {
      try {
        const response = await fetch("/api/blogs/comments/counts", { cache: "no-store" })
        const data = await response.json()
        if (data.success) {
          setCommentCounts(data.counts || {})
        }
      } catch (error) {
        console.error("Yorum sayıları yüklenirken hata:", error)
      }
    }
    
    // İlk yükleme
    loadCommentCounts()
    
    // Sayfa focus olduğunda tekrar yükle (yorum atıldıktan sonra sayfaya dönünce güncellenir)
    const handleFocus = () => {
      loadCommentCounts()
    }
    
    window.addEventListener("focus", handleFocus)
    
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  // Blog stats ve kullanıcı reaksiyonlarını yükle
  useEffect(() => {
    const loadBlogStats = async () => {
      try {
        // Stats'ı yükle (cache: no-store ile her zaman güncel veri al)
        const statsResponse = await fetch("/api/blogs/stats", { cache: "no-store" })
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setBlogStats(statsData.stats || {})
        }

        // Her blog için kullanıcının reaksiyonunu yükle
        const reactions: Record<number, "like" | "dislike" | null> = {}
        await Promise.all(
          blogPosts.map(async (post) => {
            try {
              const reactionResponse = await fetch(`/api/blogs/react?blog_id=${post.id}`, { cache: "no-store" })
              const reactionData = await reactionResponse.json()
              if (reactionData.success) {
                reactions[post.id] = reactionData.reaction
              }
            } catch (error) {
              console.error(`Reaction load error for blog ${post.id}:`, error)
            }
          })
        )
        setUserBlogReactions(reactions)
      } catch (error) {
        console.error("Blog stats yüklenirken hata:", error)
      }
    }
    
    // İlk yükleme
    loadBlogStats()
    
    // Sayfa focus olduğunda tekrar yükle (like atıldıktan sonra sayfaya dönünce güncellenir)
    const handleFocus = () => {
      loadBlogStats()
    }
    
    window.addEventListener("focus", handleFocus)
    
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  // Blog like/dislike handler
  const handleBlogReaction = async (blogId: number, reaction: "like" | "dislike", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await fetch("/api/blogs/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blog_id: blogId,
          reaction: reaction,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Stats'ı güncelle
        setBlogStats((prev) => ({
          ...prev,
          [blogId]: {
            likes_count: data.likes_count,
            dislikes_count: data.dislikes_count,
          },
        }))
        // Kullanıcı reaksiyonunu güncelle
        setUserBlogReactions((prev) => ({
          ...prev,
          [blogId]: data.reaction,
        }))
      }
    } catch (error) {
      console.error("Blog reaksiyon hatası:", error)
    }
  }

  const postsPerPage = 4

  // Filter posts by category, tags, and search
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "Tümü" || post.category === selectedCategory
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => post.tags.includes(tag))
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesTags && matchesSearch
  })

  // Calculate total pages based on filtered posts
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  // Reset to page 1 if current page exceeds total pages (e.g., when filtering)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Paginate posts
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

  // Helper function to generate pagination page numbers
  const getPaginationPages = (isMobile: boolean = false) => {
    const pages: (number | string)[] = []
    const maxVisible = isMobile ? 3 : 5 // Mobile: 3, Desktop: 5
    
    // Mobile: Show smart pagination if more than 4 pages
    // Desktop: Show all pages if 12 or less, otherwise use smart pagination
    if (isMobile && totalPages <= 4) {
      // Mobile: Show all if 4 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (!isMobile && totalPages <= 12) {
      // Desktop: Show all pages if 12 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage <= 2) {
        // Near the beginning
        if (isMobile) {
          // Mobile: 1 2 3 ... 8
          for (let i = 2; i <= 3; i++) {
            pages.push(i)
          }
        } else {
          // Desktop: 1 2 3 4 ... 8
          for (let i = 2; i <= 4; i++) {
            pages.push(i)
          }
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 1) {
        // Near the end
        pages.push("ellipsis")
        if (isMobile) {
          // Mobile: 1 ... 6 7 8
          for (let i = totalPages - 2; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          // Desktop: 1 ... 5 6 7 8
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        }
      } else {
        // In the middle
        pages.push("ellipsis")
        if (isMobile) {
          // Mobile: 1 ... 4 5 6 ... 8
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
        } else {
          // Desktop: 1 ... 4 5 6 ... 8
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // Handle scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
            <p className="text-gray-400 text-sm">Uzman Destekli Otomotiv Danışmanlığı</p>
          </div>

          <div className="py-2 px-3 space-y-1">
            {[
              { name: "Ana Sayfa", href: "/", icon: "🏠", type: "link" },
            ].map((item, index) => (
              <Link
                key={item.name}
                href={item.href || "#"}
                onClick={() => setIsMenuOpen(false)}
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
              </Link>
            ))}
          </div>

          {/* WhatsApp Button */}
          <div className="px-3 mb-3 space-y-2">
            <a
              href="https://wa.me/905391375334"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-1.5 text-xs leading-tight"
            >
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="text-center">WHATSAPP UZMAN EKİBE BAĞLANIN</span>
            </a>
            <Link
              href="/chat"
              onClick={() => setIsMenuOpen(false)}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-400 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2 text-xs leading-tight"
            >
              <Wrench className="w-4 h-4 flex-shrink-0" />
              ÜCRETSİZ ARIZA ANALİZ YAPTIR
            </Link>
          </div>

          <div className="px-3 mb-2">
            <div className="flex items-center justify-center space-x-3 py-2 border-t border-b border-gray-700/50">
              <a
                href="https://www.instagram.com/nesivarusta"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-pink-500 hover:scale-110 hover:shadow-lg"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="px-3 pb-2">
            <p className="text-gray-400 text-[14px] leading-relaxed text-center">
              Türkiye'nin yeni nesil otomotiv danışmanlık platformu. Fabrika verisi ve binlerce usta tecrübesi ile araç
              sorunlarınıza profesyonel çözümler sunuyoruz.
            </p>
          </div>
        </div>
      </div>

      {/* Header/Navbar */}
      <nav
        className={`fixed top-0 w-full bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 ${isMenuOpen ? "z-[9998]" : "z-50"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg p-1">
                <img src="/logo.jpeg" alt="NesiVarUsta Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent md:hidden lg:block">
                NesiVarUsta
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link
                href="/"
                className="text-gray-300 hover:text-orange-400 transition-all duration-300 font-medium relative group text-sm lg:text-base"
              >
                Ana Sayfa
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-blue-500 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/chat"
                className="text-gray-300 hover:text-orange-400 transition-all duration-300 font-medium relative group text-sm lg:text-base"
              >
                Ücretsiz Analiz Yaptır
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-blue-500 transition-all duration-300 group-hover:w-full" />
              </Link>
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

      {/* Main Content */}
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <aside className="lg:col-span-1 space-y-8 relative">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 pr-10 w-full bg-gray-800/50 backdrop-blur-xl border border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setCurrentPage(1)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors z-10"
                    aria-label="Temizle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Kategoriler</h3>
                <ul className="space-y-2">
                  {categories
                    .filter((category) => category.name === "Tümü" || category.count > 0)
                    .map((category) => (
                      <li key={category.name}>
                        <button
                          onClick={() => {
                            setSelectedCategory(category.name)
                            setCurrentPage(1)
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 ${
                            selectedCategory === category.name
                              ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold shadow-lg"
                              : "text-gray-300 hover:bg-gray-800/50 hover:text-orange-400"
                          }`}
                        >
                          {category.name} ({category.count})
                        </button>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Son Eklenenler */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Son Eklenenler</h3>
                <div className="space-y-4">
                  {recentNews.map((news) => (
                    <Link
                      key={news.id}
                      href={`/blogs/${news.id}`}
                      className="flex items-start space-x-3 group cursor-pointer"
                    >
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700/50 backdrop-blur-sm border border-gray-700/50 group-hover:border-orange-500/50 transition-colors">
                        <img
                          src={news.image}
                          alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                          {news.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">{news.date}</p>
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span className="text-xs">{blogStats[news.id]?.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" />
                              <span className="text-xs">{blogStats[news.id]?.dislikes_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search By Tags */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Etiketlere Göre Ara</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          // Tıklanan etiket zaten seçiliyse, seçimi kaldır
                          setSelectedTags(selectedTags.filter((t) => t !== tag))
                        } else {
                          // Yeni etiket ekle
                          setSelectedTags([...selectedTags, tag])
                        }
                        setCurrentPage(1) // Sayfayı 1'e sıfırla
                      }}
                      className={`px-3 py-1.5 text-sm backdrop-blur-sm border rounded-lg transition-all duration-300 ${
                        selectedTags.includes(tag)
                          ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white border-orange-500 shadow-lg"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedTags([])
                      setCurrentPage(1)
                    }}
                    className="mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Tüm etiket filtrelerini temizle ({selectedTags.length})
                  </button>
                )}
              </div>
            </aside>

            {/* Main Blog Content */}
            <main className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {paginatedPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 group"
                  >
                    {/* Image */}
                    <div className="relative w-full h-48 bg-gray-700/50 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Metadata */}
                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{commentCounts[post.id] || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={(e) => handleBlogReaction(post.id, "like", e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                              userBlogReactions[post.id] === "like"
                                ? "bg-green-500/20 text-green-400"
                                : "text-gray-400 hover:text-green-400"
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${userBlogReactions[post.id] === "like" ? "fill-current" : ""}`} />
                            <span className="text-xs">{blogStats[post.id]?.likes_count || 0}</span>
                          </button>
                          <button
                            onClick={(e) => handleBlogReaction(post.id, "dislike", e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                              userBlogReactions[post.id] === "dislike"
                                ? "bg-red-500/20 text-red-400"
                                : "text-gray-400 hover:text-red-400"
                            }`}
                          >
                            <ThumbsDown className={`w-3.5 h-3.5 ${userBlogReactions[post.id] === "dislike" ? "fill-current" : ""}`} />
                            <span className="text-xs">{blogStats[post.id]?.dislikes_count || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                        {post.title}
                      </h2>

                      {/* Description */}
                      <p className="text-gray-300 mb-4 line-clamp-2">{post.description}</p>

                      {/* Read More Button */}
                      <Link 
                        href={`/blogs/${post.id}`}
                        className="inline-flex items-center gap-2 text-white hover:text-orange-400 transition-colors duration-300 font-medium group"
                      >
                        <span>DAHA FAZLA OKU</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="text-white">
                  <PaginationContent className="flex items-center justify-center gap-1 md:gap-2">
                    {/* Previous Button - Icon Only */}
                    {currentPage > 1 && (
                      <PaginationItem>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(currentPage - 1)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="cursor-pointer flex items-center justify-center text-orange-500 hover:text-orange-400 transition-all duration-300 p-2"
                        >
                          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
                        </button>
                      </PaginationItem>
                    )}
                    
                    {/* Mobile: Show smart pagination */}
                    <div className="flex md:hidden items-center gap-1">
                      {getPaginationPages(true).map((page, index) => {
                        if (page === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-mobile-${index}`}>
                              <PaginationEllipsis className="text-gray-400 text-xs" />
                            </PaginationItem>
                          )
                        }
                        const pageNum = page as number
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageNum)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                              isActive={currentPage === pageNum}
                              className={`cursor-pointer min-w-[2.25rem] h-9 text-xs transition-all duration-300 ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white border-orange-500 shadow-lg"
                                  : "bg-transparent border border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-400 hover:text-orange-400 text-white"
                              }`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                    </div>

                    {/* Desktop: Show full pagination */}
                    <div className="hidden md:flex items-center gap-1">
                      {getPaginationPages(false).map((page, index) => {
                        if (page === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-desktop-${index}`}>
                              <PaginationEllipsis className="text-gray-400" />
                            </PaginationItem>
                          )
                        }
                        const pageNum = page as number
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageNum)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                              isActive={currentPage === pageNum}
                              className={`cursor-pointer min-w-[2.5rem] h-10 text-sm transition-all duration-300 ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white border-orange-500 shadow-lg"
                                  : "bg-transparent border border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-400 hover:text-orange-400 text-white"
                              }`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                    </div>

                    {/* Next Button - Icon Only */}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(currentPage + 1)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="cursor-pointer flex items-center justify-center text-orange-500 hover:text-orange-400 transition-all duration-300 p-2"
                        >
                          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
                        </button>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-4 md:right-8 z-50 w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Sayfanın üstüne git"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-xl border-t border-gray-800/50 py-12 relative z-10">
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
                  <Link href="/" className="hover:text-orange-400 transition-colors">
                    Ana Sayfa
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="hover:text-orange-400 transition-colors">
                    Bloglar
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-orange-400 transition-colors">
                    Ücretsiz Analiz Yaptır
                  </Link>
                </li>
              </ul>
            </div>
          </div>

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

export default function BlogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    }>
      <BlogsPageContent />
    </Suspense>
  )
}
