"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getOrCreateDeviceId, getOrCreateGuestUserId } from "@/app/lib/device"
import { Button } from "@/components/ui/button"
import {
  Search,
  Calendar,
  MessageSquare,
  Instagram,
  ChevronUp,
  ChevronRight,
  Wrench,
  ArrowRight,
  X,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Send,
  Loader2,
  User,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

// Blog post interface
interface BlogPost {
  id: number
  title: string
  description: string
  content: string
  date: string
  comments: number
  image: string
  category: string
  tags: string[]
  author: {
    name: string
    role: string
    avatar: string
  }
}

// All blog posts with full content
const allBlogPosts: BlogPost[] = [

  {
    id: 21,
    title: "Subaru Yeni Bir WRX STI Tanıttı - Ama Umduğumuz Değil",
    description: "Subaru, Tokyo Otomobil Fuarı'nda manuel şanzımanlı WRX STI Sport♯ prototipini tanıttı. Ancak bu model, hayranların beklediği tam bir STI dönüşü değil.",
    content: `VB nesil Subaru WRX sedan'ın gerçek bir STI kardeşi olmadan piyasaya çıkmasından bu yana, özlem gerçekten de büyüktü. Her ipucuna, teaser'a ve konsepte tutunuyorduk, çünkü bunlar gerçek bir WRX STI dönüşünün hala mümkün olduğunu ima ediyordu. Optimizm, neredeyse tam bir yıl önce ortaya çıkan WRX STI S210 prototipiyle zirve yaptı, ancak hızla soğudu. Manuel şanzıman yoktu, Sürücü Kontrol Merkezi Diferansiyeli yoktu ve anlamlı bir güç artışı yoktu, bu da onu son gerçek STI'nin varisi gibi hissettirmedi - 341 beygir gücü ve 330 lb-ft tork ile son bulan model.

Subaru, daha sonra daha da fazla teaser vererek durumu daha da kötüleştirmedi. Japan Mobility Show'da gösterilen iki STI aromalı konsept, ardından ses, his ve niyet hakkında gizemli teaser'lar, daha büyük bir şeylerin pişirildiğini düşündürüyordu.

Ve işte nihayet: WRX STI Sport♯. Hala tam bir STI değil (üzgün trombon sesi), ancak bu sefer en azından bir manuel şanzıman var. Ne kadar temkinli bir şekilde iyimser hale geldiğimiz göz önüne alındığında, hayal kırıklığı keskin yerine daha çok bastırılmış hissediyor.

## STI Sport♯ Gerçekte Ne Getiriyor?

Subaru, Tokyo'da gösterilen yeni WRX STI Sport♯ hakkında özellikle konuşkan olmadı. Resmi olarak, manuel şanzımanlı ve STI performans parçalarına sahip bir WRX S4 olarak tanımlanıyor, bu hem doğru hem de sinir bozucu derecede belirsiz. Satır aralarını okursak, bu, daha önce ortaya çıkan WRX S4 STI Sport♯'ın manuel donanımlı bir evrimi gibi görünüyor, temiz bir sayfa performans sıçraması değil.

Bu, tanıdık **FA24 2.4 litrelik turboşarjlı boxer-dört** motorun devam ettiği anlamına geliyor, yaklaşık **275 beygir gücü** ve **277 lb-ft tork** üretiyor. Güç hala dört tekerleğe aktarılıyor, şimdi Subaru'nun performans CVT'si yerine altı vitesli manuel şanzıman üzerinden. Odak, Subaru'nun "yüksek performanslı lastikler, elektronik kontrollü amortisörler ve Brembo frenler ve özel STI parçaları sürüş kalitesini maksimize etmek için kullanılıyor" dediği şasi dengesi ve tepkisi üzerinde sıkı bir şekilde duruyor.

Görsel olarak, yeni WRX STI Sport♯ siyahlaştırılmış elementler, ince bir spoiler, her yerde koyu pembe etek vurguları ve STI rozetleri ile geliyor. Beklendiği gibi, içeride Ultrasuede ile kaplı Recaro koltuklar, bir vites kolu ve daha fazla STI rozeti var.

## Hala Bekliyoruz, Hala Umut Ediyoruz

Subaru, Tokyo Auto Salon'da (TAS) gösterilen WRX STI Sport♯'ın hala bir prototip olduğunu belirtti. Üretim zamanlaması, mevcudiyeti veya daha önce Japonya'da yapılan 500 birimlik sınırlı seriyi takip edip etmeyeceği hakkında henüz detay yok. ABD'ye gelecek mi? Muhtemelen hayır - ve ayrıca, gerçekten satın alabileceğiniz WRX tS ile daha iyi durumdasınız. Şimdilik, Subaru'nun TAS gösterimi bir taahhütten ziyade bir açıklama görevi görüyor.

İşte burada olağan hayal kırıklığı geri dönüyor. STI Sport♯, Subaru'nun doğru yönde ilerlediğini, ancak tam olarak taahhüt etmediğini öne sürüyor. İlgiyi canlı tutmak için yeterli sunuyor, ancak yine de geri duruyor. Manuel şanzıman olumlu bir adım, ancak genel paket hala arzu edilen bir şeyler bırakıyor.

Yine de, Subaru hayranları WRX STI dönüşü fikrine sadık kalmaktan başka bir şey değil. Belki bugün değil, belki bu araçla değil, ama umut, bir şekilde, inatla canlı kalmaya devam ediyor.`,
    date: "13 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzE0/2026-subaru-wrx-sti-sport.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Subaru", "WRX", "STI", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 22,
    title: "Yenilenen Nissan Z Yeni Yeşil Renk ve İlginç Bir Şanzıman ile Tanıtıldı",
    description: "Nissan Z'nin facelift versiyonu 2026 Tokyo Auto Salon'da tanıtıldı. En dikkat çekici değişiklik, Unryu Green adlı yeni yeşil renk ve manuel Nismo versiyonunun onaylanması.",
    content: `Nissan Z'nin facelift versiyonu bir süredir bekleniyordu ve nihayet 2026 Tokyo Auto Salon'da sahneye çıktı. İlk izlenim? O kadar tanıdık ki, kalabalık bir otoparkta neredeyse fark edemezsiniz.

En belirgin değişiklik, yeşil rengin geri dönüşü, özellikle **Unryu Green** adlı yeni bir ton. Bu, erken Z modellerinde görülen klasik Grand Prix Green'in modern bir yorumu. Güncellenmiş ön uç da bu temaya uyuyor, eski S30'un aerodinamik G-burunundan ilham alan revize edilmiş bir tampon ve tam Nissan logosunun yerini alan sadeleştirilmiş "Z" amblemi ile. Buna karşılık, arka kısım büyük ölçüde dokunulmamış kalıyor.

## Küçük Değişiklikler, Gerçek İçerik

Daha yakından bakınca, değişiklikler birikmeye başlıyor. Nissan, yeni ön tamponun sadece gösteriş için olmadığını - ön kaldırmayı azaltmak ve sürüklemeyi kısmak için tasarlandığını söylüyor, sadece hafifçe olsa bile. 19 inçlik jantlar, önceki Z'lere bir geri dönüş ve süspansiyon ayarlamaları, bunun sadece yüzeysel bir yenileme olmadığını ima ediyor.

Derinin altında, amortisörler artık daha büyük pistonlar kullanıyor, bu da daha fazla basınç kaldırabilecekleri ve engebeli yollara daha hızlı tepki verebilecekleri anlamına geliyor. Frenler de güçlendirildi, özellikle fuara getirilen daha yüksek donanımlı Nissan modellerinde.

İçeride, biraz sıcaklık ve eski usul çekicilik getiren yeni bej bir iç mekan var. Otomatik karartmalı dikiz aynası gibi pratik dokunuşlar yerini alıyor, ancak genel düzen aynı kalıyor - Z'nin odaklanmış kokpitini zaten beğenenler için iyi haber.

Ancak garip bir detay: iç mekan görselleri, mantıklı olmayan paddle shifters ile eşleştirilmiş altı vitesli bir manuel gösteriyor. Büyük olasılıkla, bu sadece görsellerde bir karışıklık, ancak Nissan'ın bu "hibrit" kurulum hakkında ne söyleyeceğini görelim.

## 2027 Nissan Z Facelift

Gerçek başlık, **Z Nismo**. Nismo için manuel bir şanzıman şok değil - daha çok Nissan'ın nihayet hayranların ne istediğini dinlemesi gibi. Şirket zaten ABD için manuel bir Nismo'yu onayladı, bu da bu sefer gerçekten tutkulu kalabalığa dikkat ettiğini gösteriyor.

Ne zaman göreceğinize gelince, Japonya facelift edilmiş Z'yi 2026 yazı civarında alacak, diğer pazarlar takip edecek. ABD zaten 2026 Z güncellemelerine sahip olduğundan, bu ayarlamaların başka yerlerde 2027 modelleri olarak ortaya çıkmasını bekleyin. Her stil ve süspansiyon değişikliğinin Pasifik'i geçip geçmeyeceği hala belirsiz, ancak zamanlama uyuyor.

Nissan geçen yıl ABD'de 5.487 Z sattı - önceki yıla göre %73 artış. Hafif bir yenileme ve manuel bir Nismo, nihayet çalışmaya başlayan formülü bozmadan bu ivmeyi sürdürmeye yardımcı olmalı.`,
    date: "14 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzNDQw/2027-nissan-z-facelift_03.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nissan", "Z", "Haber", "Performans"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 23,
    title: "Araştırma: Alıcılar Araba Satın Alma Pratiklerini Eski Usulde Tutmak İstiyor",
    description: "Yeni bir araştırma, dijital çağda bile araba alıcılarının önemli belgeleri kağıt üzerinde imzalamayı ve finansman görüşmelerini yüz yüze yapmayı tercih ettiğini gösteriyor.",
    content: `Çoğu araba alıcısı için, yeni bir araba satın almak için bir bayiliğe girmek, yaşayacakları en sinir bozucu deneyim olabilir, çünkü düşman topraklarına adım atmak gibi hissedebilir. Bir ev dışında, bir araba çoğu Amerikalının yapacağı ikinci en büyük satın alma olabilir, bu da çok göz korkutucu bir olasılık olabilir.

Bugünün dijital dünyasında, koltuğunuzdan rahatça ve evden çıkmadan araba satın almanın birçok yolu var. Örneğin, Carvana olarak bilinen çevrimiçi ikinci el araba pazarı, son birkaç yıl içinde önemli ölçüde büyüdü, bu da geçen ay hisse senedi fiyatının şişmesine yol açtı. Aynı zamanda, Hertz özel bir çevrimiçi araba satın alma platformu başlattı ve hatta Amazon, Amazon Autos ile ringe adım attı.

Ancak, dijital araba satın alma deneyimi cazip olsa da, bazı alıcılar yeni bir araç seti almanın çok kolay olduğunu hissedebilir. Hem bayilik yazılım lideri CDK Global hem de çevrimiçi araba satın alma platformu CarGurus'tan gelen yeni veriler, teknolojideki ilerlemelere rağmen, araba satın almanın belirli önemli yönlerinin hala kağıt üzerinde ve gerçek hayatta bırakılmasının daha iyi görüldüğünü, hatta genç alıcılar tarafından bile gösteriyor.

## CDK Global: Kağıtsız mükemmel değil

Araba bayilerinin tamamen kağıtsız olmaya yönelik sektör genelinde bir itilme olmasına rağmen, iki çalışma çoğu araba alıcısının satın alımları hakkındaki önemli tartışmaları gerçek hayatta tutmak ve önemli satın alma belgelerinin sert kağıt kopyalarını eve götürmek istediğini gösteriyor.

CDK Global'in 2025 F&I Alıcı Çalışmasına göre, ankete katılan müşterilerin %55'i araba satın alımlarıyla ilgili önemli belgelerin kağıt kopyalarını imzaladı ve %53'ü böyle bir uygulamanın tercih ettikleri olduğunu söyledi. Öte yandan, ankete katılan müşterilerin sadece %25'i aynı belgeleri bir tablette imzaladı, %29'u bu yöntemi tercih ettiklerini belirtti.

Aynı zamanda, ankete katılan müşterilerin %20'si bazı önemli belgeleri fiziksel olarak, bazılarını dijital olarak imzaladı. Ancak bu en az tercih edilen seçenekti, sadece %17'si "hibrit" çözümü seçti. CDK ayrıca, ankete katılan araba alıcılarının %26'sının satın alma işlemlerinin sonunda önemli evraklarının dijital bir kopyasını aldığını, ancak %22'sinin bunun tercihleri olduğunu söylediğini buldu. Araba alıcılarının yaklaşık %26'sı bazı evrakların hem fiziksel hem de dijital bir kopyasını almayı tercih ettiklerini söyledi, ancak gerçekte, tüketicilerin sadece %11'i bu belgelerin hem dijital hem de fiziksel kağıt kopyalarını gerçekten alıyor.

CDK ayrıca, kağıt tercihinin nesil sınırlarını aştığını buldu, çünkü çalışılan her demografik grubun en az yarısı, 18-26 yaş arası arzu edilen Z Kuşağı tüketicileri dahil, tüm imzaların kağıt üzerinde olmasını istediğini söyledi. Ek olarak, her neslin en az %47'si nihayetinde tüm belgelerin kağıt kopyalarını istedi, 59 yaş ve üzeri katılımcıların %70'i dahil.

## CarGurus: Araba alıcıları finansmanı yüz yüze tartışmak istiyor

Araba satın almanın çoğu Amerikalı için büyük bir satın alma olması konusunda, Aralık ayında yayınlanan bir CarGurus anketinin sonuçları, bir araba satın almanın ağırlığının çevrimiçi finansman için tüketici çekiciliğini frenlediğini buldu.

%31'inin araba alıcılarının çevrimiçi araç finansmanı kurmayı tercih ettiğini buldular, bu rakam 2023'te toplanan sonuçlardan 5 puan ve bu veriyi topladıkları ilk yıl olan 2022'den 15 puan düşük. Alternatif olarak, alıcıların %29'u finansman süreci hakkında bilgi almayı ve yardım almayı yüz yüze tercih ettiklerini belirtti. 2025'te, araba alıcılarının %33'ü arabaları için finansmanı çevrimiçi aldı, %32'si hem çevrimiçi hem de bayide yüz yüze finansman üzerinde çalıştı ve kalan %34'ü finansman anlaşmalarını tamamen yüz yüze tamamladı.

Ancak, finansman sürecinin dijital bir deneyim olarak daha iyi buldukları bir kısmı, ön onaylama adımıydı; alıcının kredi puanını etkilemeyen ancak mevcut kredi oranları ve koşullarını ortaya koyan bir tür kredi kontrolü. CarGurus, araba alıcılarının %31'inin bu süreci çevrimiçi yürütmeyi tercih ettiğini buldu; ancak araba alıcılarının %55'i bunu çevrimiçi talep etti, %29'u hem çevrimiçi hem de yüz yüze ön onay aldı, %15'i ise yüz yüze ön onay aldı.

## Son Düşünceler

Carvana gibi çevrimiçi platformlar ve Hertz gibi yerleşik isimler şeffaf, baskısız alternatifler sunarak büyümeye devam etse de, bu içgörüler, araba satın almanın bazı yönlerinin hala geleneksel bayiliklere bırakılmasının en iyi olduğunu düşünenler olduğunu gösteriyor.

Gerçek bir araba tutkunu olarak, arabaları yakından görmenin ve koşulları gerçekten anlamak için zaman ayırmanın araba satın alma sürecinin önemli bir parçası olduğuna inanıyorum. Arabalar birçok Amerikalı için önemli bir satın almadır, bu da sadece "dokunma ve hissetme" perakende deneyimine değil, aynı zamanda bayilerin her süreci kolay anlaşılır detaylarla açıklayabildiği bir deneyime ihtiyaç duyar.`,
    date: "14 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyMDc5/gettyimages-2218817292.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Araştırma", "Satın Alma", "Öneri"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 24,
    title: "Aura Nismo RS, Nissan'ın İnşa Etmek İstediği Toyota GR Yaris Rakibi Olarak Tanıtıldı",
    description: "Nissan, 2026 Tokyo Auto Salon'da Aura RS Nismo Concept'i tanıttı. Bu hibrit teknolojili küçük hot hatch, Toyota GR Yaris'in potansiyel bir rakibi olarak görülüyor.",
    content: `Tüm zorluklara rağmen, Nissan 2025'i kara geçirdi ve önümüzdeki yıllarda toparlanma konusunda iyimser. Aynı zamanda, şirket herkese hala oldukça özel arabalar üretebileceğini ve damarlarında hala biraz adrenalin aktığını hatırlatmak istiyor.

İşte kanıt: Nissan Aura RS Nismo Concept. 2026 Tokyo Auto Salon'da tanıtılan bu küçük hot hatchback, e-Power hibrit teknolojisini akıllı bir dört tekerlekten çekiş sistemi ile birleştiriyor. Bunu, Toyota GR Yaris'in (Amerika'da mevcut değil) potansiyel bir rakibi olarak düşünün, ancak kendine özgü bir dokunuşla.

## Daha İyi Haberler Var

Üzerinde "konsept" yazsa da, Nissan'ın küçük hot hatch hayranlarını memnun edecek planları var. Basın açıklamasında, şirket aracı motorsporlarına sokmak istediğini ve, işte burada, ticarileştirmeyi hedeflediğini söyledi. Açık bir onay olmasa da, onu showroomlara getirme niyeti var.

Tabii ki, bunların hepsi Nissan'ın gelecekteki mali sağlığına bağlı. Küçük ama artan toparlanmasını sürdürürse, Aura RS Nismo'nun üretime geçme şansını artırmalı. Başka bir deyişle, dünyanın her yerindeki insanlar bunun gerçekleşmesi için daha fazla Nissan satın almalı.

## Özellikler

Evet, bu bir hibrit, ama Ferrari 296 GTB de öyle. Ayrıca, CVT kullanmıyor; bunun yerine, daha doğrudan bir tepki olarak tanımlanabilecek bir doğrudan tahrik şanzımanı ile gidiyor. Tüm güç aktarım sistemi ve tahrik sistemi doğrudan X-Trail e-Power e-4orce'den geliyor ve Aura'nın küçük gövdesine sıkıştırılmış. Bu arada, bu, Amerika'da sunulandan çok daha fazla çekiş gücüne sahip Japon/Dünya pazarı için Rogue.

Bu, yalnızca iki elektrikli motoru için jeneratör görevi gören turboşarjlı 1.5 litrelik, üç silindirli bir motor anlamına geliyor. Ön motor 201 beygir gücü üretirken, arka 134 beygir gücü üretiyor. Birlikte, 211 beygir gücü ve 243 lb-ft tork üretiyor. Tamam, bu akıl almaz sayılar değil, ancak araç 3.300 pound'un altında ağırlığa sahip ve anlık güç aktarımı onun çizgiden hızlı çıkmasına yardımcı olmalı.

Şöyle düşünün: X-Trail e-Power 0-60 mph sprint'i 6.4 saniyede yapabiliyorsa (CarWow tarafından test edildi... tipik İngiliz havasında), Nismo-fied Aura'nın bunu beş saniyede yapabileceğini tahmin ediyoruz.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzQw/3263-1033340.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nissan", "Nismo", "Haber", "Performans"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 26,
    title: "Kongre Direksiyonsuz Sürücüsüz Arabaları Hızlandırmaya Çalışıyor",
    description: "ABD Kongresi, geleneksel insan kontrolleri olmadan çalışan otonom araçların hızlandırılması için yasa tasarısını görüşüyor.",
    content: `## Kongre Robotaksiler İçin Kapıyı Yeniden Açıyor

ABD Temsilciler Meclisi'nin önemli bir komitesi, modern ulaşım politikasındaki en tartışmalı sorulardan birini yeniden ele almaya hazırlanıyor: otonom araçların kamu yollarına ne kadar hızlı izin verilmesi gerektiği.

13 Ocak'ta, Temsilciler Meclisi Enerji ve Ticaret alt komitesi, direksiyon veya pedallar gibi geleneksel insan kontrolleri olmadan çalışan sürücüsüz araçların konuşlandırılmasını hızlandırmak için tasarlanmış yasa taslağı hakkında bir duruşma düzenleyecek. Bu hareket, robotaksi testlerinin ABD'nin büyük şehirlerinde sessizce genişlemesine rağmen, Kongre'de yıllarca süren tıkanıklıktan sonra yenilenen ivmeyi işaret ediyor.

Mevcut yasaya göre, Ulusal Karayolu Trafik Güvenliği İdaresi (NHTSA), şirketlerin güvenli olduklarını kanıtlayabilmeleri şartıyla, üretici başına yılda sadece 2.500 aracı belirli federal güvenlik standartlarından muaf tutabilir.

Otomobil üreticileri, bu sınırın anlamlı ticari konuşlandırma için çok kısıtlayıcı olduğunu savunuyor. Tartışılan bir öneri, bu sınırı dramatik bir şekilde yılda 90.000 araca kadar yükseltirken, aynı zamanda zorunlu dikiz aynaları veya direksiyonlar gibi insan sürücülü arabalar için yazılmış kuralları da yeniden gözden geçiriyor. Destekçiler, değişikliklerin ABD'nin otonomi çabalarını küresel olarak rekabetçi tutmak için gerekli olduğunu söylüyor; eleştirmenler ise teknoloji artan bir inceleme ile karşı karşıya kalırken güvenlik denetimini zayıflatabileceklerini uyarıyor.

## Politika Gerilimi: Yüksek Teknolojili Otonomi vs. Daha Basit Arabalar

Otonom araçları hızlandırma itişi, Washington'dan arabaların geleceği hakkında gelen diğer sinyallerle keskin bir tezat oluşturuyor. Paralel olarak, Trump yönetimi karmaşık düzenlemeleri geri almayı ve daha basit, daha uygun fiyatlı araçları teşvik etmeyi amaçlayan fikirler öne sürdü, en önemlisi gevşetilmiş yakıt ekonomisi kuralları ve küçük, sade Japon kei arabalarını ithal etme konusundaki kamu coşkusu aracılığıyla. Bu girişimler, en son yazılım ve sensörler yerine erişilebilirlik, mekanik basitlik ve daha düşük sahiplik maliyetlerini vurguluyor.

Birlikte ele alındığında, iki yön ABD otomotiv politikasında temel bir çelişkiyi ortaya koyuyor. Bir yandan, yasa koyucular eyaletlerin kendi otonom sürüş kurallarını belirlemesini engelleyecek ve gelişmiş sürücü yardımı kalibrasyonu için ulusal bir çerçeve zorunlu kılacak kapsamlı federal öncelik düşünüyor. Öte yandan, "eski usul" arabalar etrafındaki siyasi mesajlaşma, nostaljiye ve giderek daha pahalı, teknoloji ağırlıklı araçlarla tüketici hayal kırıklığına hitap ediyor. Otonomi yasa tasarıları, yazılım tanımlı robotaksi filolarının hakim olduğu bir gelecek varsayıyor, paralel deregülasyon itişi ise arabaları yuvarlanan bilgisayarlar yerine daha basit araçlara döndürme arzusunu öne sürüyor.

## Hız, Güvenlik ve Belirsiz Bir Yol

Gerçek dünya konuşlandırmaları zaten bahisleri yükseltiyor. Tesla, Austin'de güvenlik monitörleri ile sınırlı bir robotaksi hizmeti başlattı, Waymo ise yeni pazarlara genişlemeye devam ediyor. Mercedes-Benz, bu yılın ilerleyen zamanlarında sürücü gözetimi altında ABD'de şehir kapasiteli otomatik sürüş sistemi tanıtmayı planlıyor. Aynı zamanda, Tesla sürücü yardımının başarısız olduğuna dair son bir rapor gibi yüksek profilli olaylar, tüketici savunucuları, Teamsters gibi işçi sendikaları ve federal araştırmacılar arasında şüpheciliği körükledi.

Yaklaşan Temsilciler Meclisi duruşması bu gerilimi bir gecede çözmeyecek, ancak ABD araç politikasının önümüzdeki on yılı için tonu belirleyebilir. Yasa koyucular hassas bir denge ile karşı karşıya: Çin ve diğer rakiplere liderliği kaptırmaktan kaçınmak için yeterince hızlı hareket etmek, aynı zamanda güvenlik ve hesap verebilirlik konusunda kamu güvenini korumak. Kongre'nin otonom teknolojiye olan coşkusunu, daha basit, daha geleneksel arabalar için paralel itişiyle uzlaştırıp uzlaştıramayacağı, sadece robotaksilerin ne kadar hızlı geldiğini değil, aynı zamanda Amerikalıların nihayetinde ne tür bir otomotiv geleceği alacağını belirleyecek.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTE5ODUy/gettyimages-2220716767.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Otonom", "Teknoloji", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 27,
    title: "Porsche: Benzinli Macan'ı Elektrikli ile Değiştirmekte Yanıldık",
    description: "Porsche'nin eski CEO'su Oliver Blume, Macan'ın sadece elektrikli versiyonunu sunma kararının bir hata olduğunu kabul etti.",
    content: `Şubat 2019'da Porsche, en çok satan modellerinden biri olan son derece popüler Macan crossover'ın bir sonraki neslinin yalnızca elektrikli güçle mevcut olacağını açıkladı. Elektrikli model 2024'ün başlarında piyasaya çıktı ve o zamana kadar, tamamen elektrikli mobiliteye ne kadar hızlı geçileceğine dair dünya görüşü değişti ve Porsche'nin eski CEO'su şimdi bunun bir hata olduğunu kabul etti. Alman yayını Frankfurter Allgemeine Zeitung ile yaptığı röportajda, otomobil üreticisinin başında olduğu son ayında yayınlanan Oliver Blume, hatayı kabul etti: "Stratejimiz, üç segmentimizin her birinde yanmalı motorlar, hibritler ve elektrikli spor arabalar sunmaktı - ancak her ürün için değil. Macan konusunda yanıldık." Bu, Blume'nun son haftalarda Porsche'nin yanlış değerlendirmesini kabul ettiği ikinci kez.

## Porsche Hatayı Düzeltmeyi Planlıyor, Ama Kötü Kararı Savunuyor

Eski CEO (1 Ocak itibarıyla eski Ferrari ve McLaren adamı Dr. Michael Leiters tarafından değiştirildi), o zamanlar yanmalı motorlu Macan'ı kaldırma kararını haklı çıkardı ancak karar bugünün ikliminde verilseydi durumun farklı olacağını ekledi. Blume, "O zaman mevcut verilere ve pazarlarımızın değerlendirmemize dayanarak, aynı kararı tekrar verirdik" dedi. "Bugün durum farklı. Tepki verdik ve yanmalı motorlar ve hibritler ekliyoruz." Bu yanlış hesaplama, Stellantis tarafından Dodge Charger ile yansıtıldı.

Tamamen elektrikli Daytona'nın zayıf satışlarından sonra, çift turbo Hurricane motoru aceleyle eklendi, ancak Porsche bunun kendi tuzakları olduğunu biliyor. Yanmalı Charger'ın acı çekmesine neden olan uzlaşmaları olsa da (başlangıçta benzinli motorlar için tasarlanmamış yüksek bir zemin gibi), Porsche kompakt lüks crossover segmenti için bir benzinli araç canlandırıyor, ancak Macan EV'yi yanmalı motor için yeniden tasarlamaya çalışmak yerine, sıfırdan başlıyor.

## Yeni Macan Hiç Macan Olmayacak

Blume Porsche'nin bazı hatalar yaptığı sırada başta olmuş olabilir, ancak aynı zamanda bu sorunları çözmek için hazır bir şekilde çalıştı, geçen yılın ortasında benzinli Macan'ın boş bıraktığı yerde yeni bir modelin seriye katılacağını ve bu yeni lüks crossover'ın 2028'den geç olmamak üzere geleceğini duyurdu. Porsche Macan adını bir EV ile ilişkilendirmeye o kadar çok yatırım yaptı ki, artık Porsche'nin kompakt lüks için benzinli dönüşünün yeni bir isim taşıması daha mantıklı. Bu yeni isimlendirme henüz kamuya açıklanmadı, ancak Blume yeni crossover'ı "bu segment için çok, çok tipik Porsche ve aynı zamanda BEV Macan'dan farklılaştırılmış" olarak tanımladı. Eski benzinli Macan'ın platformu artık Avrupa siber güvenlik yasalarını karşılayamadığından, yeni gelen muhtemelen Audi Q5'i destekleyen Premium Platform Combustion mimarisine dayanacak.

İlginç bir şekilde, sadece EV olması planlanan bir sonraki Porsche 718 de benzinli motorları kabul etmek için yeniden tasarlanıyor. Umarım Porsche Dodge'dan daha iyi bir iş çıkarır, ancak bu söylenmeden geçmeli. Porsche'nin yeni CEO'sunun denetlemesi gereken çok işi var; SF90 Stradale, 296 GTB ve Purosangue gibi arabalardan sorumlu adam - McLaren'ın yapı kalitesi ve mali istikrarındaki iyileştirmeden bahsetmiyorum bile - Porsche'yi döndürebilir.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjExMDEwNDk5NTkxMDIyMTI3/porsche-macan-4s-electric.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Porsche", "Macan", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 28,
    title: "Rivian, 2026'nın İlk Büyük Araç Geri Çağırma İşlemini R1T ve R1S İçin Çarpışma Riski Nedeniyle Yaptı",
    description: "Rivian, 2022-2025 model R1T ve R1S araçlarında arka süspansiyon toe link eklemlerinde sorun olabileceğini bildirdi.",
    content: `Şimdi 2026'nın ikinci haftasındayız ve yılın ilk geri çağırma işleminin ne olabileceğini görmek için bekliyorduk. Rivian için ne yazık ki, R1T pikap ve R1S SUV bu ayrımı kazandı (halka açık araçlar açısından; teknik olarak, Blue Bird Bus Company bu yıl geri çağırma işlemi yapan ilk otomobil üreticisi, ancak Rivian perakende alanda geri çağırma işlemi yapan ilk). Ulusal Karayolu Trafik Güvenliği İdaresi'ne göre, 2022-2025 Rivian R1T ve R1S araçlarında toe link eklemlerinde bir sorun olabilir ve bu bir çarpışmaya neden olabilir. Aslında, zaten oldu, bir olay küçük yaralanmalarla sonuçlandı.

## Rivian Kamyon ve SUV'larındaki Sorun

Geri çağırma raporu, 19.641 kadar aracın, "arka süspansiyon toe link ekleminin ayrılmasını ve yeniden birleştirilmesini gerektiren bir onarım sırasında tasarım amacına göre yeniden monte edilmemiş bir eklem" ile sonuçlanan bir servis almış olabileceğini açıklıyor. 10 Mart 2025'ten sonra servis edilen araçlar güncellenmiş prosedürlere tabi tutuldu ve bu nedenle geri çağırmanın bir parçası değil, ancak bu tarihten önce onarılanlar için, arka toe link eklemlerinin doğru şekilde yeniden monte edilmemesi, bileşenlere istenmeyen kuvvetlerin uygulanmasına neden olabilir. Belirli durumlarda, bu nihayetinde toe link eklemi ayrılmasına neden olabilir, bu da önceden uyarı olmadan çarpışma riskini artırabilir. Temel olarak, yol yüzeyindeki küçük bir çukur veya başka bir anomali, ani, beklenmedik bir yol tutuşu yeteneği azalmasına neden olabilir. Muhtemelen, sürücüler bunun olmadan önce hafif bir titreşim hissedebilir, ancak sahiplerin önünde uzun bir bekleme var.

## Rivian Sahipleri Ne Yapabilir?

Garip bir şekilde, bu geri çağırma işleminin planlanmış bir bayii bildirim tarihi yok, çözüm güncellenmiş servis prosedürü kullanılarak potansiyel olarak etkilenen arka toe link cıvatalarının değiştirilmesi olmasına rağmen, ancak sahipler nihayetinde bilgilendirilecek - planlanan çözüm sahip bildirim tarihi 24 Şubat 2026. Ne yazık ki, VIN'ler aynı tarihte sadece nhtsa.gov'da aranabilir olacak, bu yüzden o zamana kadar muhtemelen yüksek hızlardan kaçınmak ve sürüş sırasında olağandışı sesler veya titreşimleri not etmek en iyisi. Umarım, yaklaşan R2 ve çok bağlantılı süspansiyonu benzer sorunların kurbanı olmaz. Bu arada, 2026'da geri çağırma işlemi yapacak bir sonraki otomobil üreticisinin hangisi olacağını görmek için bekliyoruz. 2025'teki kötü şöhretli geri çağırma kaydına dayanarak, Ford muhtemelen oldukça sık karışımda olacak.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTM2MzAx/screenshot-2025-08-11-at-09-30-00.jpg?arena_f_auto",
    category: "Arıza",
    tags: ["Rivian", "Geri Çağırma", "Güvenlik"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 31,
    title: "2026 Mitsubishi Outlander Bayi Ziyareti Olmadan 5G Üzerinden Kendini Güncelleyebiliyor",
    description: "Mitsubishi ve AT&T ortaklığı, 2026 Outlander'a 5G bağlantısı getiriyor ve araçların havadan yazılım güncellemeleri almasına olanak sağlıyor.",
    content: `## Mitsubishi ve AT&T 2026 Outlander'a 5G Getirmek İçin Ortaklık Yapıyor

Mitsubishi Motors, araçlarına yeni nesil 5G bağlantısı getirmek için AT&T ile ortaklık yapıyor, 2026 Mitsubishi Outlander ile başlıyor. Bu işbirliği, Mitsubishi'nin araç içi teknolojiyi geliştirme ve daha bağlantılı bir sürüş deneyimi sunma stratejisinde büyük bir adımı işaret ediyor.

2026 Toyota RAV4'teki AT&T sistemine benzer şekilde, yerleşik 5G yeteneği ile 2026 Outlander, yolda sorunsuz bağlantı için tasarlanmış akıllı, yazılım odaklı bir SUV olarak çalışacak.

Ortaklığın kalbinde, AT&T'nin güvenli 5G ağı tarafından desteklenen Mitsubishi Connected Car Services var. Bu entegrasyon, sürücüler ve yolcular için daha hızlı veri hızları, daha düşük gecikme ve geliştirilmiş güvenilirlik sağlıyor. Sonuç, kesin trafik verileri ile gerçek zamanlı navigasyon, daha hızlı bulut tabanlı ses yanıtları ve yolcular için kesintisiz akıştır.

## Gerçek Zamanlı Güncellemelerle Daha Akıllı Araçlar

Akıllı telefon bağlantısına dayanan önceki sistemlerin aksine, Outlander'ın 5G bağlantısı doğrudan aracın mimarisine gömülüdür, bu da sürücüler yola odaklanırken özelliklerin arka planda sorunsuz çalışmasına olanak tanır.

Eğlence ve navigasyonun ötesinde, 5G havadan (OTA) yazılım güncellemelerini etkinleştirir, bu da Mitsubishi'nin uzaktan yeni özellikler, performans iyileştirmeleri ve güvenlik yamaları sunmasına olanak tanır. Bu, bayi ziyaretlerine olan ihtiyacı azaltır ve araçların zamanla güncel ve korumalı kalmasını sağlar. Sahipler, değişen teknoloji ve sürüş ihtiyaçlarına uyum sağlayabilen gelişen bir araçtan yararlanır.

İşbirliği ayrıca Mitsubishi'nin daha geniş dijital stratejisini destekler. Daha hızlı ve daha stabil bağlantı, gelişmiş sürücü yardım özellikleri ve satın alma sonrası yeni dijital hizmetlerin devreye sokulması için kapıları açar. Mitsubishi, bugünün teknoloji meraklısı tüketicilerinin beklentilerini yansıtan kişiselleştirilmiş, her zaman bağlantılı bir sahiplik deneyimi yaratma hedefinde olduğunu söylüyor.

## Gelecek Modeller İçin Temel Oluşturma

Mitsubishi Motors North America Dijital Ürün Stratejisi Direktörü Bryan Arnett, AT&T ile ortaklığın şirketin bağlantılı araç hırslarının geleceğe hazır teknoloji tarafından desteklendiğinden emin olduğunu söyledi. AT&T, Connected Solutions bölümü aracılığıyla, otomobil üreticilerine esnek, ölçeklenebilir bağlantı çözümleri sağlayarak otomotiv varlığını genişletmeye devam ediyor.

2026 Outlander, Mitsubishi'nin 5G geleceğine ilk adımını işaret ediyor, önümüzdeki yıllarda ek modellerin teknolojiyi benimsemesi bekleniyor. Araçlar mobil akıllı cihazlara evrildikçe, Mitsubishi'nin AT&T ile ortaklığı, hızla ilerleyen bağlantılı araç pazarındaki konumunu güçlendiriyor. Yine de, sürücülere havadan güncellemeleri kabul etme veya reddetme seçeneği sunmanın nihayetinde tüketicilere fayda sağlayıp sağlamayacağı konusunda sorular devam ediyor.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "/placeholder.svg",
    category: "Öneri",
    tags: ["Mitsubishi", "Outlander", "Teknoloji"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 32,
    title: "Rezvani'nin Sert V8 Güçlü Tank'ı 2026 İçin 1.000 HP'lik Büyük Bir Yeniden Tasarım Aldı",
    description: "Rezvani Tank, 2017'den bu yana ilk kez tam bir yeniden tasarımla geldi ve Dodge Demon'dan 1.000 beygir gücünde bir seçenek sunuyor.",
    content: `## On Yıllık Bekleyiş

Rezvani 2017'de Tank'ı tanıttığında, piyasadaki başka hiçbir şeye benzemeyen ve hissettirmeyen bir üretim SUV olarak öne çıktı. Altında Jeep Wrangler temellerini kullandı, ancak tasarım ağırlıklı olarak fütüristik, neredeyse konsept araç bölgesine yöneldi. Tank, çoğu lüks SUV'un konfor ve stile odaklandığı bir zamanda yüksek çıkışlı motorlar, ciddi arazi ekipmanları ve mevcut kurşun geçirmezliği birleştirdi.

Yıllar boyunca, Tank kademeli güncellemeler gördü, ancak ana konsept değişmedi. 2026 için ise, Rezvani tam bir yeniden tasarım tanıttı. Gövdeden mekaniklere kadar neredeyse her parça yeniden düşünüldü. Sonuç, orijinal karakterini koruyan ancak şimdi öncekinden daha vahşi olan bir Tank.

## Daha Keskin Görünümler, Daha Yüksek Sesli Detaylar

2026 Rezvani Tank, zırhlı araç ilhamını daha da ileri götürüyor. Yeni gövde daha keskin ve daha agresif, tipik lüks SUV'lardan çok askeri araçları yankılayan çizgiler ve detaylarla. Hala büyük boy lastikler, cesur çamurluk genişletmeleri ve kare paneller özelliklerini içeriyor, ancak oranlar artık daha uyumlu ve odaklı görünüyor.

İçeride, Tank taktik özelliklerini konfor ve stil için özelleştirilebilen bir kabin ile dengeler. Alıcılar yeni 10 inç dokunmatik ekran, yükseltilmiş ses ve özel amplifikatör rafları seçebilir. Yıldız ışığı tavan kaplamaları, benzersiz gösterge renkleri, detaylı dikiş ve geniş bir bitiş yelpazesi için seçenekler var. Seçimlere bağlı olarak, iç mekan zırhlı kabukla bile, askeri bir araçtan çok yüksek kaliteli bir salon gibi hissedebilir.

## Demon Gücü ve Yarım Milyon Dolarlık Yapılar

Kaputun altında, 2026 Tank birkaç motor seçeneği sunuyor. Standart seri Jeep kaynaklı seçenekleri içerir: turboşarjlı dört silindirli ve doğal emişli V6. Ayrıca kısa süreliğine elektrik gücüyle çalışabilen hafif hibrit bir versiyon da var.

V8 seçenekleriyle işler hızla yükseliyor, Dodge Demon için güç ünitesi ile zirveye çıkıyor. Bu yükseltme, Tank'a 1.000 beygir gücünde süperşarjlı 6.2 litrelik HEMI bırakıyor, kurşun geçirmez bir SUV'da hiper araç seviyesinde çıkış sunuyor. Arazi yetenekleri yükseltilmiş akslar, ağır hizmet frenleri, kaldırma kitleri ve Fox Racing süspansiyon seçeneklerini içerir.

Fiyatlandırma yaklaşık $175,000'den başlıyor, ancak Tank'ın ünü, böyle bir niş SUV'dan beklenebileceği gibi, kapsamlı seçenekler listesinden geliyor. Tam zırh, taktik ekipman, performans parçaları ve özel bitişler fiyatı yarım milyon dolara kadar çıkarabilir.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNTcz/2026-rezvani-tank-main.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Rezvani", "Tank", "Performans"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 38,
    title: "Toyota'nın Gazoo Racing Artık Bağımsız Bir Marka",
    description: "Toyota, Gazoo Racing'i güçlendirmek için 'Toyota' ismini bırakıp sadece 'Gazoo Racing' olarak yeniden markalaştırıyor.",
    content: `## Tarihsel Öncelik

Toyota'nın Gazoo Racing (GR) bir marka olarak şimdi hiç olmadığı kadar tanınıyor. GR rozetini taşıyan birkaç heyecan verici yol arabası ile, marka sadece Toyota'nın motorsporları veya yarış tarafı değil. Gerçekte, Gazoo Racing aslında Başkan Akio Toyoda'nın gerçek tutku ve hatta gizlilikten doğdu.

2007'de, Akio nihayet motorsporları tutkusunu Nürburgring 24 Saat'e girerek tatmin etmek istedi. Sorun, katılımının ve ekibinin Toyota Motor Corporation tarafından resmi olarak onaylanmamış olmasıydı, bu da Gazoo Racing'in doğuşuna ve Akio'nun şimdi ünlü takma adı "Morizo" moniker'ına yol açtı. Akio, yarışa ilk girişlerinin "aşağılayıcı" olduğunu bile hatırlıyor ve o zamandan beri markayı ve arabaları daha iyi yapmak için yakıt olarak kullandı.

## Sadece "Gazoo Racing"

Yeniden canlandırma ve yeteneklerini güçlendirme çabası içinde, Toyota köklerine dönerek "Toyota"yı bırakıp sadece "Gazoo Racing"e geri dönmeye karar verdi. Şirketin resmi basın açıklamasına göre, bu hareket "motorsporlarından yetiştirilmiş sürekli daha iyi arabalar yapma ve yetenek yetiştirme"yi güçlendirmek için yapıldı.

Bu hedefe ulaşmak için, Akio ve GR Ekibi, "Shikinen Sengu" olarak bilinen bir Japon ritüelini kullanmaya devam edecek. Bu fikir, Japonya'nın Mie Eyaleti'ndeki Ise Tapınağı'ndan uyarlandı, burada her 20 yılda bir, tüm yapılar tamamen yeniden inşa edilmelidir. Onları Lexus LFA'yı inşa etmeye ve satmaya iten bu ritüeldi ve hepimiz bunun nasıl sonuçlandığını biliyoruz.

Aynı prensibi kullanmak, Gazoo Racing'in 86, Yaris, Corolla ve Supra gibi arabalarla performansta büyük bir oyuncu olmasını sağladı. Bunlar şimdi yakın zamanda lansman edilen GR markalı üretim modelleri olan GR GT ve Lexus LFA konsepti ile takip ediliyor. Gazoo Racing'in WRC, NASCAR ve WEC'de ağır varlığı (ve başarısı) ve Haas Team ortaklığı aracılığıyla Formula 1'e yenilenen ilgisi ile motorsporlarındaki sürekli itişinden bahsetmiyorum bile.

## Toyota Gazoo Racing Europe Toyota Racing Olarak Yeniden Markalandı

Gazoo Racing markalaşmada merkez sahneyi alırken, Toyota'nın motorsporları bölümünün diğer kolları da yeniden markalaşıyor. WRC ve WEC geliştirmesinin çoğu, şimdi sadece "Toyota Racing" olarak yeniden markalanan Toyota Gazoo Racing Europe grubu aracılığıyla Avrupa'da yapılıyor.

Yerinde kalacak tek yarış varlığı Toyota Gazoo Rookie Racing ekibi olacak. Burası Morizo'nun parladığı yer, bu ekibi motorsporları aracılığıyla yeni teknolojileri test etmek için bir platform olarak kullanıyor. Bu nedenle, adı aynı kalacak ve Gazoo Racing ile Toyota Racing arasında bir köprü görevi görecek.`,
    date: "15 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNTY1/toyota-gazoo-racing-badge-copy.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "Gazoo Racing", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 41,
    title: "Ford CEO'su Senato'ya Neden Arabalar Bu Kadar Pahalı Sorusuna Cevap Vermiyor — Henüz Değil",
    description: "ABD Senatosu arabaların neden bu kadar pahalı olduğunu öğrenmek istiyor, ancak Ford CEO'su Jim Farley ifade vermek istemiyor — en azından henüz değil.",
    content: `ABD Senatosu arabaların neden bu kadar pahalı olduğunu öğrenmek istiyor, ancak Ford CEO'su Jim Farley ifade vermek istemiyor — en azından henüz değil. Senatör Ted Cruz, 14 Ocak'ta Detroit'in Büyük Üçlüsü'nün (Ford, Chevrolet ve Stellantis) CEO'larıyla bir kongre oturumu planladı, ancak Farley, hukuk danışmanı aracılığıyla, önce aynı gün başlayan ve Farley tarafından "otomobiller için Super Bowl haftası" olarak tanımlanan Detroit Otomobil Fuarı ile bir zamanlama çakışması olduğunu belirterek tereddüt etti. Cruz'a yazdığı mektupta ayrıca, Tesla CEO'su Elon Musk davet listesinden çıkarıldıktan ve bunun yerine elektrikli araç üreticisinin mühendislik başkan yardımcısının oturuma çağrılmasından sonra Detroit CEO'larının katılmasını beklemek ama diğerlerini beklememek haksızlık olduğunu belirtti. Temelde, Tesla mühendislerinin yeni arabaların maliyeti hakkında soruları cevaplayabilmesi durumunda, diğer otomobil üreticileri neden yapamaz? Şimdi, tüm oturum belirsizlik içinde.

## Senato Ticaret Komitesi Oturumu Ertelendi

Politico'ya göre, 14 Ocak oturumu Farley'nin planlanan tarihte ifade vermeyi reddetmesi nedeniyle ertelendi. Farley'nin mektubundan sonra, GM CEO'su Mary Barra da diğer Detroit CEO'ları katılmadıkça katılmayı reddetti. Komite sözcüsü Phoebe Keller, komitenin "bu oturumu yeniden planlamak için otomotiv endüstrisinin liderleriyle koordine ettiğini" söyledi. Ford, GM ve Stellantis CEO'larının hepsi katılırsa, bu, 2008'den bu yana, otomobil üreticilerinin durgunluktan sarsıldığı zamandan beri ilk kez Büyük Üçlü'nün CEO'larının Kongre önünde birlikte görünmesi olacak. O zamandan beri Tesla otomotiv endüstrisinde güçlü bir güç haline geldi, ancak Farley'nin CEO olmayanların ifade vermesine itirazına rağmen, Musk'ın oturumda görünmesi pek olası görünmüyor.

## Elon Musk'un Uygun Fiyatlılık Konusunda İfade Vermesi Olası Değil

Senatör Cruz, Musk'ı davet etmeme kararını savundu, çünkü onun görünmesinin tüm oturumu rayından çıkaracağından korkuyordu. "Elon bir tanık olursa, Demokratlar bunu bir sirk haline getirecek" dedi Cruz. Senatör, oturumun devam edeceğinden ve Farley'nin komite önünde davasını sunacağından emin, ancak diğer Detroit CEO'larının aynı anda görünüp görünmeyeceği belirsiz. Ne olursa olsun, ülke arabaların neden bu kadar pahalı hale geldiğini anlamak istiyor. Mayıs 2025'te yapılan bir araştırma, Amerikalıların değiştirme maliyetlerini karşılayamadıkları için arabalarını daha uzun süre tuttuğunu, katılımcıların yaklaşık %40'ının yeni bir arabanın ulaşılamaz olduğunu söylediğini ortaya koydu. Geçen hafta yayınlanan benzer bir analiz, durumun değişmediğini ve 2025'te ortalama yeni araba fiyatının ilk kez 50.000 doları aştığını gösteriyor, bu çalışmalar sürpriz değil. Bu oturum iyileştirmelere yol açacak mı? Umarız, ancak şimdilik CEO'ların ve senatörlerin bir buluşma tarihi üzerinde anlaşmasını beklemek zorundayız.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjA5MTIyNjkxODE0NDAxNjQ4/jim-farley-vintage-racing.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Ford", "Haber", "Politika"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 42,
    title: "2026 Shelby American Super Snake Ford Mustang'ı 830 Beygir Gücünde Bir Canavara Dönüştürüyor",
    description: "Detroit Otomobil Fuarı'nın gelmesini sabırla beklerken, Shelby American bize en az o kadar heyecan verici bir şey sunma özgürlüğünü aldı: 2026 Shelby American Super Snake.",
    content: `Detroit Otomobil Fuarı'nın gelmesini sabırla beklerken Ford'un ne hazırladığını görebilmek için (yeni bir Mustang Cobra mı yoksa Boss mu?), Shelby American bize en az o kadar heyecan verici bir şey sunma özgürlüğünü aldı: 2026 Shelby American Super Snake. İlk olarak 1966'da büyük bloklu bir Cobra'da ve ardından ertesi yıl yüksek performanslı bir Mustang'de tanıtılan bir isim olan Super Snake, Shelby American'ın en uzun süredir devam eden Ford Mustang modelidir ve yeni yıl için kazanan bir tarifi bozmuyor. Daha az ağırlık, daha fazla güç ve iyi donanımlı bir Mustang GTD'nin fiyatına iki tane alabileceğiniz anlamına gelen bir MSRP elde ediyorsunuz. Ve her zamanki gibi, Super Snake fastback veya cabriolet versiyonunda alınabilir.

## Süperşarjör Takmak mı, Takmamak mı? İşte Soru Bu

S650 tabanlı Super Snake, standart olarak 480 beygir gücüne sahip GT'nin 5.0 litrelik Coyote V8'ini temel alıyor, ancak süperşarjör seçeneğini tercih ederseniz, 93 oktan yakıtla 830 beygir gücünün üzerinde güç mümkün. Bunu başarmaya yardımcı olan şeyler arasında yükseltilmiş radyatör ve ısı eşanjörü, Borla egzoz sistemi ve performans yarım milleri var. Ford'un 815 beygir gücündeki GTD'sinden farklı olarak, Super Snake işlemi otomatik veya manuel şanzımanlı arabalara uygulanabilir (ikincisi Shelby vites topu ile kısa atışlı bir vites değiştirici alır) ve daha nadir de olabilir. Bazı kaynaklar GTD'nin 1.700 birimle sınırlandırılacağını söylerken, Shelby American Super Snake'in üretimini (Las Vegas'ta zaten başlamış olan) sadece 300 birimle sınırlandırıyor, ancak onaylanmış üçüncü taraflar tarafından birkaç tane daha yapılabilir.

Diğer yükseltmeler arasında sertleştirilmiş jant saplamaları ve yeni somunlar, yükseltilmiş süspansiyon kurulumu, daha iyi fren diskleri ve yapışkan lastikli 20 inç dövülmüş magnezyum jantlar var. İçeride, ayrıca yeniden kaplanmış koltuklar, nakışlı paspaslar, Shelby su birikintisi lambaları, Super Snake kapı eşiği plakaları, seri numaralı gösterge plaketi ve motor plaketi ve motor bölmesinde yeni kapaklar elde ediyorsunuz. Cabriolet'ler ayrıca yeni bir ışık çubuğu ile donatılacak.

## Daha Az Ağırlık, Hem Super Snake Hem de Alıcıların Cüzdanları İçin

Shelby American yeni bir boş ağırlık rakamı sağlamasa da, yukarıda bahsedilen jantlar, yeni bir alüminyum kaput ve karbon fiber çamurluklar sayesinde daha düşük bir kütle övünüyor. İkincisi, sabitlenmiş kaput gibi havalandırmalıdır ve arabayı genişletir, revize edilmiş ızgaralarla yeni bir ön fasiya gerektirir ve bunun normal bir Mustang GT olmadığını vurgulamak için, Super Snake destekli bir ön splitter, karbon fiber splitter wickers, karbon fiber wickers'lı yeni yan rocker'lar, ördek kuyruğu arka spoiler, karbon fiber arka difüzör ve Super Snake çizgileri ve rozetlerinden yararlanır. Coupe'ler ayrıca karbon fiber arka kanat alır ve arabalar yasal olarak renkli camlara sahip olur. Son olarak, ayarlanmış pony arabalarının daha da fazla güce sahip olmasını isteyenler Orange Fury boya işi sipariş edebilir. Tabii ki eğer paraları kalırsa; 2026 Shelby American Super Snake bir Mustang GTD'den çok daha uygun fiyatlı olsa da, hala 175.885 dolara mal oluyor (3 yıllık/36.000 millik garanti ve temel Ford Mustang dahil). Bu, 1.064 beygir gücündeki bir Corvette ZR1'den daha fazla. Sadece söylüyorum…`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzOTMy/shelbysupersnake-26-gallery-17.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Shelby", "Ford", "Mustang", "Performans"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 43,
    title: "Volvo Geçen Yıl Aynı Sorun İçin Geri Çağırdığı Arabaları Yine Düzeltiyor",
    description: "Mayıs 2025'te Volvo, arka kamera sorunu için bir güvenlik geri çağırma işlemi başlattı: Google tabanlı eğlence ekranları, arka kamera görüntüsünün gösterilmesini engelleyen hatalı yazılıma sahip.",
    content: `## Arka Kamera Arızası

Mayıs 2025'te Volvo, arka kamera sorunu için bir güvenlik geri çağırma işlemi başlattı: Google tabanlı eğlence ekranları, arka kamera görüntüsünün gösterilmesini engelleyen hatalı yazılıma sahip.

Bu geri çağırmanın dikkat çekici olan yanı, Volvo ürün gamının çoğunu kapsayan 413.000 arabayı kapsamasıdır. Bu geri çağırmanın kapsadığı üretim yıllarının 2021'den 2025'e kadar dört yıldan fazla bir süreyi kapsadığını söylemeye gerek yok.

## Aynı Sorun, Yeni Belirti

Sorun çözülmekten çok uzak görünüyor, çünkü Ulusal Karayolu Trafik Güvenliği İdaresi (NHTSA) yeni bir güvenlik geri çağırma işlemi başlattı. İkinci geri çağırma, Mayıs ayındaki aynı sorunla ilgilidir ve ABD'deki toplam etkilenen araç sayısını 413.151'e çıkardı.

İkinci bir geri çağırma uyarısı, "aynı belirtiye neden olan ek bir sorun bulunduğu" için yayınlandı. NHTSA uyarısında açıklandığı gibi sorun, "her geri vites olayının başlangıcında görüntünün görünmemesi"dir.

Bu, elbette, sadece müşterilerin ödediği bir özelliğin başarısızlığı değil, aynı zamanda arka yedek kameraya ağırlıkla güvenenler için potansiyel bir güvenlik riskidir.

Ancak uyarıda, NHTSA, sorundan etkilenenlerin hala park yardım uyarıları, arka otomatik frenleme ve çapraz trafik uyarısı gibi kameraya güvenmeyen diğer güvenlik özelliklerini kullanabileceğini belirtti.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAwOTQ2NTgy/352206-volvo-xc70-long-range-phev.jpg?arena_f_auto",
    category: "Arıza",
    tags: ["Volvo", "Geri Çağırma", "Güvenlik"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 44,
    title: "Caterham'ın Muhteşem Elektrikli Spor Arabası Amerika'ya Geliyor",
    description: "Caterham'ın 2+2 Project V spor arabası, bu hafta Tokyo Auto Salon'da çalışan bir prototip görünmeden önce, Las Vegas'taki 2026 Consumer Electronics Show'da gösteri arabası formunda yerini aldı.",
    content: `Caterham'ın 2+2 Project V spor arabası, bu hafta Tokyo Auto Salon'da çalışan bir prototip görünmeden önce, Las Vegas'taki 2026 Consumer Electronics Show'da gösteri arabası formunda yerini aldı, ancak ABD'deki zamanı geçici olmayacak, küresel satışlar 2027 için planlanmış durumda. Bu Amerika'yı da içeriyor. Car and Driver ile konuşan Caterham Cars'ın denizaşırı temsilcisi Justin Gardiner, şirketin "bu haftadan itibaren Amerika'yı çok ciddiye alacağını" açıkladı ve "Buradan çok satmayı planlıyoruz" diye ekledi. Lotus Elan +2'den ilham alan Project V, Porsche 718 gibi modelleri hedefleyecek, bu da ucuz olmayacağı anlamına geliyor (bunun hakkında daha sonra), ancak aynı zamanda elektrikli güce rağmen sürüş eğlencesine odaklanma anlamına da geliyor.

## Caterham Elektrikli Spor Arabaları Farklı Şekilde Ele Alıyor

Project V, birçok yeni arabada olduğu gibi, elektrikli olsun ya da olmasın, bir arabanın kabinini aşırı dijitalleştirme fikrini reddediyor. Bunun yerine, fiziksel düğmeler ve iğneli gerçek göstergeler var. Tek ekran, akıllı telefon entegrasyonu ve yasal olarak zorunlu olan arka görüş kamerasını sağlamak için orada, ve koltuklar Project V'nin sıvı soğutmalı Xing Mobility batarya paketlerinin şasinin önünde ve arkasında olması sayesinde yere çok yakın oturuyor (minimalist Caterham Seven'in sürüş hissini taklit etmek için tasarlanmış bir düzen), çoğu elektrikli araçta olduğu gibi kabinin altındaki bir kaykay paketinde değil.

Caterham ayrıca, bir invertör, redüksiyon dişlisi ve kalıcı mıknatıslı senkron motorun hepsini bir arada içeren hazır bir Yamaha Motor 200kW 400 volt arka e-aks kullanmayı seçti, işleri mümkün olduğunca basit tutuyor. Basitlikten bahsederken, Gardiner şunları söyledi: "Kesinlikle sahip olmamız gereken minimum miktarda çekiş kontrolüne gidiyoruz. Çünkü bu yeni bir araba, ABS'ye sahip olması gerekecek, çekiş kontrolüne sahip olması gerekecek ve hava yastıklarına sahip olması gerekecek […], ancak mümkün olduğunca basit tutuyoruz. Bir motor, arka tekerlekler, bu kadar."

## Sürülmesi Eğlenceli, Ama Satın Alması Pahalı

Gardiner batarya tipi seçimini açıkladı, "Caterham sürücüleri arabalarını sonuna kadar zorlamayı sever" dedi, bu yüzden şirket şarj süresi yerine deşarj süresine odaklandı. "Birisi bu bataryaları gerçekten, gerçekten hızlı boşaltıyorsa, birçok elektrikli araç aşırı ısınma nedeniyle yavaş moda geçer" dedi Gardiner. "Müşterilerimizin bunu yapacağını biliyoruz. Sadece biliyoruz. Bu yüzden batarya paketlerinin çalışmasını sağlamalıyız." Project V şu anda 0-62 mph için 4.5 saniyenin altında bir süre hedefliyor, 143 mph maksimum hızla, ve Gardiner, Porsche'nin elektrikli 718 Boxster ve Cayman'ının çok daha fazla güce sahip olacağını söylese de, "sürülmesi o kadar eğlenceli olmayacak" diyor. Ne yazık ki, işleri mümkün olduğunca basit tutmaya rağmen, 107.000 doların biraz üzerindeki orijinal hedef fiyat yaklaşık 135.000 dolara yeniden ayarlandı, ancak Project V Seven gibi bir şey hissederse, sürülmesi bir vahiy olabilir. Gardiner'ın dediği gibi, "Caterham'dan daha eğlenceli bir şey yok."`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyOTU1/v-hero-main.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Caterham", "Elektrikli", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 45,
    title: "Bir Çinli Otomobil Üreticisi CES'te Yeni Bir Çift Turbo V8 Tanıttı",
    description: "Sektör genelindeki bu akıma karşı, Great Wall Motor (GWM) CES 2026'da kendi geliştirdiği dört litrelik çift turbo V8'i tanıtarak kasıtlı olarak yıkıcı bir açıklama yaptı.",
    content: `## GWM Çin'in Elektrikli Araç Momentumunu Zorluyor

Çin, batarya-elektrikli ve plug-in hibrit araçların tüm yeni araba satışlarının yarısından fazlasını oluşturmasıyla, küresel elektrifikasyon merkezi olmaya devam ediyor. Çoğu yerli otomobil üreticisi, küçültülmüş motorlar ve özel platformlar etrafında inşa edilmiş sadece elektrikli veya ağır elektrifikasyonlu ürün gamlarına agresif bir şekilde dönüyor.

Sektör genelindeki bu akıma karşı, Great Wall Motor (GWM) CES 2026'da kendi geliştirdiği dört litrelik çift turbo V8'i tanıtarak kasıtlı olarak yıkıcı bir açıklama yaptı.

Bu hareket, GWM'nin piyasadaki konumu göz önüne alındığında özellikle anlamlı. Yeni enerji araçları, 2025 satışlarının sadece %30'unu temsil etti ve tam elektrifikasyonu benimseyen BYD ve Geely gibi rakiplerin gerisinde kaldı.

Elektrikli araç hakimiyetini kovalamak yerine, GWM, özellikle premium arazi ve performans uygulamaları için büyük hacimli içten yanmalı motorlardaki gücünü pekiştiriyor. V8'i, uzun süredir V8 kalbi olarak kabul edilen ABD'deki en büyük tüketici ticaret fuarlarından birinde sergilemek, elektrifikasyon hızlanırken bile duygusal olarak etkileyici güç aktarım sistemleri için hala küresel talep olduğuna dair güven işareti veriyor.

## Hibrit Olasılıklar İçin İnşa Edilmiş Modern Bir V8

Eski okul silindir sayısına rağmen, GWM'nin V8'i güncel olmayan bir şey değil. Dört litrelik motor, Miller döngüsü teknolojisi, çift turboşarjör ve ön monte su soğutmalı intercooler kullanıyor. Entegre bir post-boost borulama düzeni ve ön uç aksesuar tahriki, isteğe bağlı viskoz fan ile birlikte, motorun özellikle zorlu arazi veya yüksek yüklü ortamlar için dayanıklılık ve termal stabilite göz önünde bulundurularak tasarlandığını gösteriyor.

Yakıt görevleri, 350 bar direkt enjeksiyon ile 5.5 bar port enjeksiyonunu birleştiren ve değişken deplasmanlı bir yağ pompası ile eşleştirilen çift enjeksiyon sistemi tarafından yönetiliyor. Bu kurulum, motorun karbon birikimini minimize ederken farklı çalışma koşullarına verimli bir şekilde uyum sağlamasına olanak tanıyor.

Güç, bir tork konvertörü ile GWM tarafından geliştirilmiş dokuz vitesli otomatik şanzıman üzerinden yönlendiriliyor ve kritik olarak, V8'in mimarisi küçük bir elektrikli motor ve batarya entegre etmek için hükümler içeriyor. Bu, Toyota'nın uygulamasına benzer şekilde, geleneksel kası tamamen değiştirmek yerine elektrikli yardımı geleneksel kasla harmanlayan hibrit V8 uygulamalarına kapı açıyor.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMzEy/gwm-v8-2.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["GWM", "V8", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 46,
    title: "Ultra Sınırlı Toyota GR Yaris Morizo RR Sert Performansla Tanıtıldı",
    description: "Toyota GR Yaris Morizo RR ile tanışın – zaten vahşi bir hot hatch üzerine daha pist odaklı, Nürburgring'den beslenmiş bir yaklaşım. Morizo'nun kendisi de bunu şekillendirmekte rol aldı ve sonuç, sadece sayılar için değil, sürücüler için yapılmış bir araç.",
    content: `## Nürburgring Derslerinden Yol Arabası Gerçeğine

Toyota başkanı Akio Toyoda – aksi takdirde Morizo olarak bilinir – sadece Gazoo Racing projelerine adını koymuyor. Direksiyonun arkasına kendisi geçiyor. Geçen yıl, Nürburgring 24 Saat dayanıklılık yarışında Toyota Gazoo Rookie Racing'i (TGRR) yönetti, bu da şimdiye kadarki en sert GR Yaris'in yaratılmasına yol açtı.

Toyota GR Yaris Morizo RR ile tanışın – zaten vahşi bir hot hatch üzerine daha pist odaklı, Nürburgring'den beslenmiş bir yaklaşım. Morizo'nun kendisi de bunu şekillendirmekte rol aldı ve sonuç, sadece sayılar için değil, sürücüler için yapılmış bir araç. Sadece 200 adet üretilecek, Japonya ve bir avuç Avrupa pazarı arasında bölünecek, bu yüzden ilk günden itibaren garantili bir koleksiyon parçası.

Daha büyük güç rakamlarını kovalamak yerine, burada odak noktası direksiyon arkasında his, tutarlılık ve güven duygusuydu. Bu, bir broşürde iyi görünen şeylerden değil, dayanıklılık yarışından alınan derslerle şekillendirilmiş bir araç.

## En Önemli Yerlerde Performans İyileştirmeleri

Yüzeyin altında, GR Yaris Morizo RR, Nürburgring'de bulacağınız türden pürüzlü, yüksek hızlı yüzeyler için ayarlanmış süspansiyon ayarı alıyor. Amortisörler, lastiklerin yola yapışmasını sağlamak için ayarlandı ve elektrikli güç direksiyonu artık zorladığınızda daha keskin geri bildirim ve daha öngörülebilir tepkiler veriyor.

Dikkat çekici ayarlamalardan biri, sadece bu araba için yeni bir 4WD kontrol modu. Normal GRAVEL ayarı yerine, tork dağılımını önden arkaya 50:50'de kilitleyen "MORIZO" modunu alıyorsunuz. Amaç? Köşelere saldırırken tutarlılık ve stabilite, sürekli gücü dağıtan bir sistem değil.

Toyota GR Yaris Morizo RR'nin güç çıkışında herhangi bir güncellemeden bahsetmedi, bu yüzden 1.6 litrelik üç silindirli G16E-GTS motorunun 300 beygir gücü, 295 lb-ft tork çıkışını koruduğunu varsayıyoruz. GR Direct Automatic Transmission ile eşleştirildiğinde, tüm kurulum Morizo'nun kendi yarış deneyimlerinden tercih ettiği şeyi yansıtıyor: sürücü için daha az iş, daha pürüzsüz güç ve tur tur devam etmek için ihtiyacınız olan türden odak.

## Dünya Çapında Sınırlı Mevcudiyet

Dışarıda, Morizo RR tam olarak göze çarpmayan değil. Özel Gravel Khaki boyası ona neredeyse işçi gibi görünen ince bir görünüm veriyor, mat bronz jantlar ve sarı fren kaliperleri ile vurgulanıyor – her ikisi de Morizo'nun kendi zevkine bir gönderme. Aerodinamik iyileştirmeler arasında Nürburgring yarışından doğan büyük bir karbon fiber arka kanat, artı karbon kaput, ön spoiler ve yan etekler var.

İçeride, her değişikliğin bir nedeni var. Sarı dikişli süet kaplı direksiyon simidi, Toyota'nın Rally2 programından ödünç alınan yeni paddle shifters ve bir anahtar düzeni alıyor. Benzersiz koltuklar, Morizo RR rozetleri ve numaralı bir plaket, bunun ortalama bir GR Yaris olmadığını açıkça gösteriyor.

Bir tane istiyorsanız, şansa ihtiyacınız olacak – Japonya'daki ilk 100 birim için satışlar 2026 baharından itibaren piyango tabanlı olacak, diğer 100 birim Avrupa'ya gidecek. GR Yaris Morizo RR, standart GR Yaris gibi, ne yazık ki ABD için hala yasak, ancak GR Corolla zaten burada olduğu için, gelecekte bir GR Corolla Morizo RR için umut etmemek zor. Belki bir gün? Lütfen?`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMzMjUz/toyota-gr-yaris-morizo-rr_01_09-1033253.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "GR Yaris", "Performans"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 47,
    title: "Mercedes 600.000 Dolarlık G-Wagen Teslimat Sırasında Kaybolduktan Sonra Dava Açıyor",
    description: "600.000 doların hemen altında bir satış fiyatına sahip bir Mercedes-AMG G 63, New York'taki bir bayilik ile Nevada'daki bir araç yolunun arasında bir yerde kayboldu.",
    content: `600.000 doların hemen altında bir satış fiyatına sahip bir Mercedes-AMG G 63, New York'taki bir bayilik ile Nevada'daki bir araç yolunun arasında bir yerde kayboldu. Otomotiv dünyasındaki çoğu yasal savaş sürücülerin otomobil üreticilerini dava etmesini içerirken, ölümcül bir Model X kazasından sonra Tesla'nın dava edilmesi veya Hyundai ve Kia hırsızlıklarıyla bağlantılı dava dalgası gibi davaları düşünün, bu hikaye senaryoyu tersine çeviriyor. Bu sefer, Mercedes-Benz saldırıya geçiyor, eve hiç ulaşmayan lüks bir SUV için nakliye brokerlerini ve taşıyıcıları mahkemeye götürüyor.

## Nakliye Sırasında Kaybolan G 63

Hikaye, 2024'ün sonlarında bir müşteri olan William Costa'nın yaklaşık 584.000 dolar karşılığında yeni bir Mercedes-AMG G 63 satın alması, Mercedes-Benz Financial Services aracılığıyla 437.000 dolardan fazla finansman sağlamasıyla başladı. Automotive News'e göre, alıcı aracın Brooklyn'den Henderson, Nevada'ya gönderilmesi için Carpool Logistics brokerlerini tuttu. Carpool Logistics daha sonra işi Deep Xpress'e alt taşeron olarak verdi, o da bunu tekrar Deep XpressDreamwork Towing'e alt taşeron olarak verdi. Arabayı Ocak 2026'da aldıktan sonra, aynı günün ilerleyen saatlerinde lüks SUV'yi teslim etmek için G Quality Transportation'ı tuttular. G-Wagon nihayetinde Los Angeles'ta bir yolun kenarına bırakıldı ve teslimatta nakit olarak ödendi. Bundan sonra, su bulanıklaşıyor ve iz soğuyor. Günler sonra, orijinal broker aracı çalıntı olarak bildirdi ve Mercedes-Benz Financial, SUV'nin nakliye sırasındaki gözetim ve iletişim başarısızlıkları nedeniyle etkili bir şekilde kaybolduğu sonucuna vardı.

## Mercedes Neden Broker ve Taşıyıcıların Peşinde

Alıcıya veya bayiliğe odaklanmak yerine, Mercedes-Benz Financial, SUV'yi eyalet sınırları boyunca taşımaktan sorumlu şirketleri hedefliyor. Kredi veren, federal Carmack Değişikliği kapsamında ihmal ve sorumluluk nedeniyle birden fazla broker ve taşıyıcıyı dava ediyor, bu yasa, eyaletler arası taşıma sırasında mallar kaybolduğunda veya hasar gördüğünde kimin ödeyeceğini yönetir. Şikayet, lojistik zincirindeki her bir tarafın aracın kendi bakımları altındayken sorumluluk üstlendiğini, ancak hedeflediği yere ulaştığından emin olmayı başaramadığını savunuyor. Davada adı geçen taşıma şirketlerinden bazıları katılımlarını tartışıyor veya kendilerine verilen talimatları takip ettiklerini söylüyor, diğerleri ise henüz kamuoyuna yanıt vermedi. Günün sonunda, birisi, birisi sorumlu tutulmalı, ancak bunun kim olduğu şimdilik belirsizliğini koruyor.

## Devam Eden, Karmaşık Bir Soruşturma

Üst düzey araç teslimatları dünyasında, lojistik sürecinde yer alan riskler genellikle arka planda bırakılır. Ancak bu durum, perde arkasında ne olduğuna ışık tutuyor: süreç giderek parçalanmış hale geldi, genellikle tek bir aracı taşımak için birden fazla alt taşeron kullanan brokerleri içeriyor. Tek bir tarafın taşımayı kendisinin yapması yerine, yaklaşık 600.000 dolarlık bir lüks SUV teslimatında en az dört taraf yer aldı. Bu yapı her şey yolunda gittiğinde çalışabilir, ancak bir şeyler ters gittiğinde hata için çok az yer bırakır. Bu soruşturma hala başlangıç aşamasında, ancak Mercedes-Benz Financial Services'ın avukatı Charles Ostrowski'nin Automotive News'e söylediği gibi, "Dava içindeki keşif ek detayları ortaya çıkarmaya yardımcı olmalı".`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyODE4/image.jpg?arena_f_auto",
    category: "Haber",
    tags: ["Mercedes", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 48,
    title: "Ford 30.000 Dolarlık Elektrikli Araçlarına Gözler Kapalı Otonom Sürüşün Geleceğini Doğruladı",
    description: "Yakın zamanda üretimi durdurulan elektrikli pikap F-150 Lightning'dan çıkarılan zor derslerle, Ford şimdi yaklaşan Universal EV platformunu mükemmelleştirmeye odaklanıyor.",
    content: `Yakın zamanda üretimi durdurulan elektrikli pikap F-150 Lightning'dan çıkarılan zor derslerle, Ford şimdi yaklaşan Universal EV platformunu mükemmelleştirmeye odaklanıyor. Bu platform, yaklaşık 30.000 dolar fiyat noktasında bir elektrikli kamyon dahil olmak üzere birkaç çok daha uygun fiyatlı elektrikli araç üretecek. Düşük fiyat göz önüne alındığında, bu elektrikli araçların markanın en iyi otonom sürüş teknolojilerini kaçırabileceği düşünülebilir, ancak durum böyle değil. Ford, ilk gözler kapalı sürücü yardım sisteminin 2028'de yeni elektrikli araç platformunda tanıtılacağını doğruladı. Bu, mevcut BlueCruise Level 2 sisteminden çok daha gelişmiş bir kurulum olacak.

## Level 2'den Level 3'e Büyük Sıçrama

Birçok otomobil üreticisi şu anda Level 2 sistemler sunuyor, bu sayede ellerinizi direksiyondan çekebilir ve arabanın direksiyon, frenleme ve hızlanmayı halletmesine izin verebilirsiniz. Arabanın neredeyse her ortamda noktadan noktaya sürüşü halledebildiği Tesla'nın Full Self-Driving'ı bile, sürücünün dikkatli kalması ve gerekirse devralmaya hazır olması gerektiği için Level 2 sistemi olarak kalıyor. Level 3 büyük bir adımdır, çünkü gözlerinizi yoldan da çekebilirsiniz. Bu, sürücülerin işe giderken video izleme gibi diğer görevlere katılmasına olanak tanır.

Ford'un planladığı gözler kapalı sistem, Rivian'ın yeni otonomi paketine çok benzer şekilde LiDAR sensörleri kullanacak, düşük görüş koşullarında daha doğru engel tespiti vaat ediyor. Ancak Ford'un yeni sistemi 30.000 dolar fiyat noktasında standart olmayacak. Ek bir ücret gerekli olacak, ancak Ford bunun ne kadar olacağına veya abonelik olup olmayacağına henüz karar vermedi.

"İş modeli hakkında da çok şey öğreniyoruz" dedi Ford'un baş elektrikli araç, dijital ve tasarım sorumlusu Doug Field, Reuters ile konuşurken. "Abonelik mi olmalı? Hepsini başta mı ödemelisiniz? Şu anda bunu süper uygun fiyatlı yapmaya odaklanıyoruz ve bundan çok heyecanlıyız. Bunun için fiyatlandırmayı belirlemek için zamanımız var."

Tesla FSD paketi için 8.000 dolar alıyor ve Ford bunun altında kalmak isteyecek, çünkü böyle bir maliyet 30.000 dolarlık bir elektrikli araç için değer önerisini azaltır.

## Kalite Temel Endişe

Ford, son birkaç yılda sektörde geri çağırmalarda kötü şöhretle öncülük etti, 2025'te bunlardan 150'den fazlası oldu. Bunların çoğu eski modeller içindi, ancak Ford bunu yeni elektrikli araç platformu ve ilişkili teknolojileriyle tekrarlamaktan kaçınmak isteyecek. Bu hedefi desteklemek için, şirket gözler kapalı sistemi şirket içinde geliştirmeyi planlıyor. Tedarikçilere daha az güvenerek, Ford nihai ürün üzerinde daha fazla kalite kontrolü üstlenmeyi umuyor, aynı zamanda maliyetleri düşürüyor ve müşterilere daha hızlı güncellemeler sunuyor.

Gözler kapalı sistem ne kadar heyecan verici olsa da, bu tür teknolojiler sadece güvenilir bir şekilde çalışırsa değerlidir. Sadece Volvo'ya sorun; yazılım tanımlı EX90 elektrikli SUV'u hatalarla dolu ve bazı sahipleri bunun için İsveç markasını mahkemeye verdi.

## Son Düşünceler

Ford kaliteyi ve fiyatlandırmayı doğru yapabilirse, gerçekten uygun fiyatlı bir araçta Level 3 otonom sürüş sunan ilk otomobil üreticilerinden biri olabilir. Mercedes'in zaten bir Level 3 sistemi var, ancak belirli eyaletlerdeki belirli otoyollarla sınırlı ve sadece S-Class gibi üst düzey lüks modellerde sunuluyor. Ford şimdi kendisini gelişmiş otonom sürüş teknolojisini demokratikleştirmede bir lider olarak konumlandırma fırsatına sahip.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjEwMDc0MTcxNDg3NTYxMTgy/2023-mustang-mach-e-premium-bluecruise.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Ford", "Elektrikli", "Teknoloji"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 49,
    title: "Volvo'nun Yeni Elektrikli SUV'u Etkileyici Menzil ve 10 Dakikada Şarj İddiasında",
    description: "Volvo bu ayın ilerleyen zamanlarında açıklayacağı elektrikli crossover'dan son derece gurur duyuyor ve bunun için her hakkı var. İsveçli otomobil üreticisi, yaklaşan EX60'ın sınıfının en iyisi 810 kilometre veya 503 mil menzil sunduğunu açıkladı.",
    content: `Volvo bu ayın ilerleyen zamanlarında açıklayacağı elektrikli crossover'dan son derece gurur duyuyor ve bunun için her hakkı var. İsveçli otomobil üreticisi, yaklaşan EX60'ın sınıfının en iyisi 810 kilometre veya 503 mil menzil sunduğunu açıkladı. Bu, tamamen yeni BMW iX3'ten (500 mil), en son Mercedes-Benz GLC EQ Technology ile (443 mil) ve en uzun menzilli Tesla Model Y'den (400 mil) daha iyi. Bu rakamların hepsi daha az katı WLTP döngüsünde hesaplanmış olsa da, yine de Volvo'nun Almanya'dan en son ve en büyüklerini, ayrıca Tesla'yı geride bırakabilmesi oldukça bir başarı. EPA döngüsünde, Volvo 400 mil iddia ediyor. Ancak uzun menzil, yeni Volvo EX60'ın sahip olacağı tek şey değil.

## Dikkat Çekici Şarj Hızları

2026 Consumer Electronics Show'da, Donut Lab adlı bir startup sadece beş dakikada yeniden şarj edilebilen bir katı hal bataryası ortaya çıkardı, ancak bu yeni nesil teknoloji olmadan bile, Volvo'nun elektrikli crossover'ı sahipleri şarj istasyonunda uzun süre bekletmeyecek, sadece 10 dakikada (400kW hızlı şarj kullanıldığında) 173 mil menzil kazanma yeteneği vaat ediyor. 800 volt SPA3 platformunun lütfu olan bu özellikler, Volvo EX60'ı daha büyük, daha pahalı EX90 dahil olmak üzere önceden gelen herhangi bir Volvo'dan daha fazla menzil yapabilir hale getirecek ve şarj hızları da Volvo'nun şimdiye kadar başardığı en iyiler. Ayrıca, EX60 10 yıllık batarya garantisi taşıyacak. EX60 bu mimari üzerine inşa edilen ilk araç ve daha fazlası planlanıyor, ancak hepsi SUV olacak.

## Volvo Tesla'nın Kitabından Bir Sayfa Aldı

Tesla tarafından öncülük edildiği gibi, 2027 EX60 mega döküm yardımıyla inşa ediliyor, burada üretim sırasında yüzlerce küçük bileşen tek bir dökümle değiştiriliyor. Bu sadece karmaşıklığı değil, aynı zamanda ağırlığı da azaltıyor, bu da EX60'ın bu kadar dikkat çekici rakamlara sahip olmasının bir parçası. 21 Ocak'ta, Volvo tam özellik listesini açıkladığında ve bize daha fazla görüntü gösterdiğinde daha fazlasını öğreneceğiz, ancak o zamana kadar, teaser görüntülerinden biri bagajın zeminini gösteriyor, ek depolama bölmelerini ortaya çıkarıyor. Ancak dikkat çeken şey, bu sahte zeminin hemen önünde yatan şey: katlanmış koltuklar. Bu koltukların arkasındaki alanın boyutuna göre, EX60'ın yedi koltuklu olabileceği görünüyor, bu da onu bahsedilen Model Y'nin Çin versiyonuyla doğrudan rekabete sokuyor ve her iki Alman rakibini de geride bırakıyor. Umarız, Volvo fiyatlandırmayı rekabetçi yapabilecek. Üç haftadan kısa bir süre içinde geri bildirim yapacağız.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyODQz/ex60-exterior-front.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Volvo", "EX60", "Elektrikli"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 50,
    title: "Jeep, Ram ve Dodge Stellantis'i Zorlu Bir 2025'te Güçlendirdi",
    description: "2025'te Stellantis grubu, bazı markalarına olan ilgiyi yeniden canlandırmak için birçok yeni araç başlattı. Dikkat çekici lansmanlar arasında yeni nesil Dodge Charger EV ve SIXPACK var.",
    content: `## Stellantis 2025'te Yıldızlara Ateş Ediyor

2025'te Stellantis grubu, bazı markalarına olan ilgiyi yeniden canlandırmak için birçok yeni araç başlattı. Dikkat çekici lansmanlar arasında yeni nesil Dodge Charger EV ve SIXPACK, Ram 1500'e Hemi V8'in geri dönüşü ve tamamen yeni Cherokee hibrit var. Tüm bunlar ve daha fazlası, grup için olumlu bir satış yılına dönüştü.

Yıl sona ererken, Stellantis grubu 2025'in 4. çeyreğinde güçlü rakamlar yayınlamak için avantaj sağladı. Aslında, grup yılın 3. ve 4. çeyreklerinde ABD'de satışları artırdı, 2024'ün aynı dönemine göre %4 artış. Toplamda, şirket Amerika'da 1.260.000 araç sattı.

## 2025 Olumluları

2025'te olumlu satış rakamlarına yol açan bazı kilit faktörler, grubun bir bütün olarak geliyor. Jeep üç yılda şimdiye kadarki en iyi Aralık satış rakamlarını kaydetti, Ram %17 perakende satış büyümesi ile geldi ve Dodge Durango 2005'ten bu yana şimdiye kadarki en iyi satış yılını aldı, yıllık bazda %37 artış. Tek isim plakası sunan Chrysler bile, Q4 2025'te Q4 2024'e kıyasla toplam minivan satışları %32 artışla iyi bir yıl sonu geçirdi.

"Ardışık çeyrek satış artışları ve pazar payı büyümesi ile, ABD'de işimizi sıfırlamak için doğru adımları attığımız açık" dedi ABD perakende satış başkanı Jeff Kommor. "Hala yapılacak iş var, ancak bu yıl HEMI'nin Ram 1500'e geri dönüşü, tamamen yeni Jeep Cherokee hibrit ve tamamen elektrikli Jeep Recon ile vurgulanan çeşitlendirilmiş güç aktarım sistemi serisi ile ilerleme kaydettik. 2025'i yüksek bir notla kapattık ve şimdi showroomlara giren beş yeni modelle 2026'da bu ivmeyi sürdüreceğiz: Jeep Cherokee, Recon, yenilenen Grand Wagoneer ve Grand Cherokee ve Dodge Charger SIXPACK."

## Sorunlar ve Gelecek Görünümü

Satışlar grubun geneli için sağlıklı olmuş olabilir, ancak yukarıda belirtilen toplam satış rakamı aslında yıllık bazda %3 daha düşük. Ayrıca, 2025'in grubun satış dayanaklarından bazılarını etkileyen üretim geri çağırmalarıyla dolu bir yıl olduğu da belirtilmelidir.

Geçtiğimiz 2025'te, çoğunlukla 4xe elektrikli modellerle ilgili olmak üzere birden fazla geri çağırma raporunu ele aldık. Aslında, 2025'te, tüm Stellantis grubu 2.776.953 aracı geri çağırmak zorunda kaldı. Yapı kalite kontrol sorunlarının kesinlikle satışları etkilediğini söylemeye gerek yok.

Geçen Ekim'de, Stellantis dört yıl içinde Amerika'ya önemli bir 13 milyar dolar yatırım duyurdu – şirketin 100 yıllık tarihindeki en büyük. ABD'de araç üretimini %50 genişletmeyi hedefliyor ve üretim alanlarında ek işler yaratacak.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDIxNzc5/2026-jeep-gladiator-sahara.png?arena_f_auto",
    category: "Öneri",
    tags: ["Stellantis", "Jeep", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 51,
    title: "Toyota FJ Cruiser'ı Gizlice İnşa Etti—Şimdi Bir Kült Klasik",
    description: "90'ların sonu ve 2000'lerin başı, piyasaya çıkan retrofütüristik arabalar dalgasına tanık oldu. Bazı önemli örnekler arasında New Beetle, Mini ve PT Cruiser var.",
    content: `## 2000'lerin Retro Dalgasına Binmek

90'ların sonu ve 2000'lerin başı, piyasaya çıkan retrofütüristik arabalar dalgasına tanık oldu. Bazı önemli örnekler arasında New Beetle, Mini ve PT Cruiser var. Elbette, Toyota da 2003'te o yılın Detroit Otomobil Fuarı'nda FJ Cruiser Concept'i tanıttığında bu trende atladı.

Buna karşı alınan tepki en azından olumluydu, şirketi bunu bir üretim modeli olarak hayata geçirmeye teşvik etti. Şubat 2005'e hızlıca geçelim: Chicago Otomobil Fuarı'nda ön üretim gösterisinde gösterildi. Ocak 2006'da, ilk parti yol giden FJ Cruiser'lar Japonya'daki Homura'daki Hino Motors fabrikasından çıktı. Bununla birlikte, bu 40 Serisi Land Cruiser'den ilham alan SUV bu yıl 20 yaşına giriyor, modern klasik masasında yerini kazanıyor.

## Sert Gençlik Aracı

Şimdi, Toyota sadece bir gün uyanıp klasik bir Land Cruiser'den ilham alan bir konsept yapmanın iyi bir fikir olacağını düşünmedi. FJ Cruiser hikayesi 90'lara kadar uzanıyor, Toyota ürün planlayıcısı Dave Danzer ve satış ve operasyonlardan sorumlu başkan yardımcısı Yoshi Inaba ile. İkisi, Akio Toyoda ile birlikte 40 Serisi'nin modern yorumunu ortaya çıkardı ve grup aslında aracın geliştirilmesinin ilk günlerinde gizlice çalışmak zorunda kaldı.

Proje dahili olarak Rugged Youth Utility aracı olarak biliniyordu ve amacı Toyota markasına daha genç erkek alıcıları çekmekti. Tacoma'nın şasisinin üzerine FJ40 gövdelerini yapıştırarak uygulanabilirliğini görmek için başladı. Muhtemelen Akio Toyoda fikri beğendi. Sonuçta, bu gizli planın California'daki NUMMI fabrikasında yapılmasına izin verdik. Sorun şuydu, o zaman şirketin başkanı değildi, bu yüzden onay almak için yönetim kuruluna ciddi bir ikna yapılması gerekiyordu.

Toyoda hala yönetim kuruluna modernize edilmiş bir FJ40'ın işe yarayacağını ve projeyi çok beğendiğini söylemek zorundaydı. Elbette, soyadınızın da şirketin adı olması yardımcı oluyor, ancak yine de onaylandı. Birkaç tasarım önerisi sunuldu, ancak onay mührünü alan Jin Won Kim'in çalışmasıydı. Bu arada, o zaman sadece 24 yaşındaydı…ve şimdi varoluşsal bir kriz yaşıyoruz.

## Konseptten Gerçeğe

Bahsedildiği gibi, FJ Cruiser konsepti bir hit oldu ve Toyota Japan'den onay alındıktan sonra, daha kapsamlı geliştirme kısa süre sonra başladı. SUV için kullanılan şasi, 120 Serisi Toyota Land Cruiser Prado ve Lexus GX'in yanı sıra dördüncü nesil 4Runner ve ikinci nesil Tacoma ile aynı olan F2 platformuydu.

Test modelleri Moab, Mojave ve Sierra Nevada'da kapsamlı bir şekilde sürüldü. Her biri, çekiş kontrol sistemlerini kalibre etmek ve süspansiyon kurulumunu ince ayar yapmak için kırılma noktalarına kadar sürüldü. Geliştirme çalışması nispeten hızlıydı, büyük ölçüde FJ Cruiser'ın üretiminden önce zaten birçok teste tabi tutulmuş mevcut F2 platformu sayesinde.

## Özellikler

Dışarıda, FJ Cruiser tanıtımından üretimin sonuna kadar değişmeden kaldı, yani boyutları baştan sona aynı kaldı. 183.9 inç uzunluğunda, 75.0 inç genişliğinde, 72 inç yüksekliğindeydi ve 105.9 inçlik bir dingil mesafesinde sürüyordu. Ayrıca 9.6 inç değerinde yerden yükseklik vardı ve 27.5 inç suyu geçebilir.

4.0 litrelik V6'sı yıllar boyunca bazı güncellemeler gördü. Başlangıçta 239 beygir gücü ve 278 lb-ft üretiyordu, ancak 2010 model yılı Dual VVT-i ekleyerek bunu 259 beygir gücü ve 270 lb-ft'e çıkardı. Bu rakam 2011 için 260 beygir gücü ve 271 lb-ft'e ayarlanacaktı. Altı vitesli manuel mevcuttu, ancak çoğu beş vitesli otomatikle geldi.

## İyi Sattı mı?

ABD'deki satışlar ilk model yılında 56.225 satışla başlangıçta güçlüydü. Ertesi yıl, 55.170 FJ Cruiser yeni evler buldu, ancak daha sonra 2008'de finansal kriz nedeniyle keskin bir şekilde düştü ve sadece 28.688'e düştü. O andan itibaren, SUV 2014'te üretimi durdurulana kadar 12.000 ila 15.000 birim arasında seyretti.

İlginç bir şekilde, Japonya kelimenin tam anlamıyla orada üretilmesine rağmen 2010'a kadar beklemek zorunda kaldı. Orada 2018'e kadar sekiz yıl satıldı ve hacim hareket ettiriciden ziyade daha çok bir yenilik öğesiydi. Başka yerlerde, özellikle Afrika, Orta Doğu ve Asya'nın bazı bölgelerinde satışlar iyiydi. Toyota onlar için para kazanmıyorsa hemen fişi çekmezdi ve küresel satışlar 2023'e kadar sürdü. Bu tek bir nesilde 16 yıl.

## Kalıcı Miras

Bugünlerde, tuhaf arazi aracının dünya çapında hayranları var ve bir tür kült ikonu olarak kutlanıyor. Onları hala patikalarda ve amaçlandığı gibi kullanıldığını görebilirsiniz, ayrıca mevcut sahipleri tarafından değer veriliyor. İkinci el değerleri hala güçlü ve bazıları ikinci el piyasada etiket fiyatının üzerinde satılıyor. Ruhu bir şekilde yeni 250 Serisi Land Cruiser'da yaşıyor, tasarım ekibine, tahmin ettiğiniz gibi, Jin Won Kim liderlik etti.

Bu modelin etkisi o kadar büyük ki Toyota onu Land Cruiser FJ formunda geri getirdi. Ne yazık ki, Amerika için yapılmayan daha küçük IMV platformunu kullandığı için Amerika'ya gelme şansı çok düşük. Ancak etkisi açıkça orada, sert mekanikler, merdiven çerçeveli şasi ve iyi arazi kabiliyeti vaadi ile. Bir bakıma, şimdi FJ Cruiser'ın iki manevi halefine sahibiz.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyNzQ2/3203-1032746.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Toyota", "FJ Cruiser", "Koleksiyon"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 52,
    title: "Hırsızlar Merhum Formula 1 Pilotu Jules Bianchi'nin Son Go-Kart'ını Çaldı",
    description: "Dünya çapındaki Formula 1 hayranları bu hafta Bianchi ailesiyle birlikte yürekleri kırık. Jules Bianchi'nin babası Philippe, Facebook'ta hırsızların oğlunun son yarıştığı go-kart'ı çaldığını açıkladı.",
    content: `Dünya çapındaki Formula 1 hayranları bu hafta Bianchi ailesiyle birlikte yürekleri kırık. Jules Bianchi'nin babası Philippe, Facebook'ta hırsızların oğlunun son yarıştığı go-kart'ı çaldığını açıkladı. Jules motorsporları üzerinde muazzam bir etki yaptı ve Charles LeClerc bir F1 pilotu olmadan yıllar önce onun vaftiz babasıydı. Motorsporları son iki on yılda dramatik bir şekilde değişmiş olsa da, çoğu büyük pilotun temelleri hala karting'de başlar. Jules için de durum böyleydi. Bu yarış hatırası kaybı Bianchi ailesi için derinden kişisel.

## Jules Bianchi'nin Hikayesi

Monaco puan finişleri ve Ferrari Driver Academy başlıklarından çok önce, karting vardı. Jules Bianchi sadece beş yaşında babasına ait bir pistte yarışmaya başladı ve 17 yaşına kadar sporda kaldı. Bu erken yıllar, onu takip eden her şeyi şekillendirdi, Fransız Formula Renault'daki başarısından Formula 3'teki zaferlere ve nihayet 2013'te Formula 1'e gelişine kadar. Bir yıl sonra, kariyeri ve hayatı trajik bir şekilde Japonya Grand Prix'sinde ıslak koşullarda bir kaza sonrası kesildi, arabası başka bir pilotun arabasını pistten kurtaran mobil bir vince çarptığında. Ciddi kafa yaralanmaları yaşadı ve dokuz ay sonra 25 yaşında hayatını kaybetti, kısa ama etkili bir miras bırakarak. Mevcut önemli Formula 1 pilotları cenazeye katıldı, Lewis Hamilton, Valtteri Bottas ve elbette Charles LeClerc dahil.

## Çalınan Go-Kart'lar

Philippe Bianchi haberleri karting topluluğuna bir mesajla paylaştı, hırsızlıkta birkaç kart'ın alındığını, torunlarına ait olanlar dahil açıkladı. Ancak en çok acıtan Jules'in son kart'ının kaybıydı. "Jules'in son kart'ını çaldılar, bir KZ 125 model ART GP" diye yazdı ve makinelerin parasal değeri olsa da, "bizi acıtan duygusal değerdir" diye ekledi. Günümüzde, karting genç yetenekleri keşfetmede her zamankinden daha önemli, bu yüzden Porsche Motorsport North America ve K1 Speed go-kart yarışçılarına gerçek Porsche'lerle yarışma şansı sunuyor.

## Motorsporları Topluluğuna Bir Çağrı

Şimdi, aile bir zamanlar Jules'in yeteneğini kutlayan aynı motorsporları topluluğuna yardım için dönüyor. Philippe, JB17 kart'larıyla karşılaşabilecek herkesin iletişime geçmesini istedi, görünürlüğün Jules'in kart'ını evine döndürebileceğini umuyor. Kart hiç ortaya çıkmasa bile, Jules Bianchi'nin mirası güvende kalıyor, sadece rekor kitaplarında değil, bir zamanlar yaptığı aynı hayali kovalamaya devam eden sayısız genç pilotta.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMyMDM2/untitled-design.jpg?arena_f_auto",
    category: "Haber",
    tags: ["Formula 1", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 53,
    title: "Fransız Mikro Araç 6 On Yıldır Durmakta Olan Nürburgring Tur Rekorunu Kırdı",
    description: "Nürburgring, bir yarış pisti olarak, sadece Green Hell olarak bilinmekten modern bağlamda daha da ilgili hale gelmeye kadar itibarını dönüştürdü.",
    content: `## (En Yavaş) Ring Kralı

Nürburgring, bir yarış pisti olarak, sadece Green Hell olarak bilinmekten modern bağlamda daha da ilgili hale gelmeye kadar itibarını dönüştürdü. Bu, tamamen hypercar'lar ve supercar'lar sayesinde – ve son zamanlarda, hatta Ford ve Chevy bile mücadeleye katıldı.

Bu 12.9 mil yarış pisti, tüm performans modellerinin yargılandığı barometre haline geldi. Porsche, Mercedes-Benz, Lamborghini ve benzeri çoğu marka şimdiye kadarki en hızlı tur tacını kazanmak için takıntılı hale geldi, ancak spektrumun diğer ucunda ne var?

## Yeni Bir O Kadar da Gösterişli Olmayan Tur Rekoru

Ligier ile tanışın, yaşlı olanlar ve F1'i sevenler için tanıdık bir marka adı. Çok ilginç bir araba yapan bir Fransız markası. JS50, kendi ülkesinde voiture sans permis olarak adlandırılan şeydir, bu da lisanssız bir araba anlamına gelir. Bu mikro boyutlu araba çok yavaş hızlarla sınırlıdır, 14 yaşındaki sürücülerin kamu yollarında sürmesine izin verir.

JS50 kentsel yollarda mantıklı olsa da, kesinlikle dünyanın en tehlikeli pisti etrafında yeri yok. Yine de Ligier, iki Fransız gazeteci Nicolas Meunier ve Martin Coulomb ile birlikte ünlü piste birkaç JS50 turu atmak için gitti. Elektrikli araçlar sınırlı 119 mil menzili nedeniyle aslında Almanya'ya sürülmedi, ancak pistte JS50'nin çeşitli varyantları, birkaç elektrikli araç ve bir dizel motorlu olan vardı.

Ligier aslında JS50'leri yarış tipi çıkartmalarla donattı. Bunun dışında, arabalar stok kaldı ve sadece 28 mph maksimum hızla, dizel motorlu JS50 28 dakika ve 25.8 saniyede tamamlandı, bu artık resmi olarak pistte kaydedilen en yavaş tur. 1960'ta 16 dakika ve 1 saniye ile çizgiyi geçen önceki rekor sahibi Trabant P50'yi geride bıraktı.

## Hepsi İyi Eğlence İçin

Açıkçası, Ligier'in Almanya'daki son çabaları tamamen iyi eğlence için yapıldı. J50'nin elektrikli araç varyantları da turladı ve daha yavaş elektrikli araç dizelden sadece yarım dakika önde, 27 dakika ve 55.6 saniyede, üçünün en hızlısı ise 19 dakika ve 53.4 saniyede tur attı.

Tamamen ilgisiz bir not olarak, mevcut en hızlı tur Mercedes-Benz AMG ONE tarafından 6 dakika ve 29.1 saniyede belirlendi.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNTIz/ligier-js50-nurburgring-lap-record-1.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Nürburgring", "Rekor", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 54,
    title: "Mitsubishi'nin Maceracı Minivan'ı Daha Eğlenceli Olmak Üzere",
    description: "Mitsubishi Delica D:5 Amerika ve dünyanın çoğu için yasak meyve. Yüzeyde, sürgülü kapıları ve insanlar için gerçek alanı olan düz bir minivan.",
    content: `## Amerika'nın Alamadığı (Henüz) Minivan

Mitsubishi Delica D:5 Amerika ve dünyanın çoğu için yasak meyve. Yüzeyde, sürgülü kapıları ve insanlar için gerçek alanı olan düz bir minivan. Ancak altında, birçok yumuşak yol SUV'sini utandıran donanımla inşa edilmiş: dört tekerlekten çekiş, arazi modları ve hatta kilitli diferansiyeller. Ailenizi şehirden çıkarıp daha zorlu arazilere götürmek için hantal bir crossover'a ihtiyacınız olmadığını gösteren bir örnek.

Bu yaklaşım Japonya'da hala çalışıyor. Delica evde iyi satmaya devam ediyor ve Mitsubishi bu başarıya çifte bahis yapıyor. 2026 Tokyo Auto Salon için, şirket standını özelleştirilmiş Delica D:5 ve Delica Mini serisiyle dolduruyor, buna "Delica Festivali" diyor.

## Delica Mini Tam Karakter Moduna Geçiyor

Delica Mini, Japan Mobility Show sırasında metalde hayran kaldığımız uzun bir kei arabası, Tokyo Auto Salon 2026 için birkaç gösteri versiyonu alıyor. Bunlardan biri olan Delica Mini Delimaru Festa, maskot çıkartmaları ve çatıda büyük bir Delimaru figürü ile öne çıkıyor. Bu oyuncul bir yaklaşım, ancak aynı zamanda Mitsubishi'nin Mini'nin sadece başka bir şehir arabası olmasını değil – Delica dünyasına ilk adım olarak tasarlanmasını istediğini gösteriyor.

Sert tarafta, Delica Mini Ultimate Gear dokulu bir kaplama, çatı rafı, ızgara koruması, arka merdiven ve küçük bir süspansiyon yükseltmesi alıyor. Diğer versiyonlar pop-up çatılar, kayma çubukları, çamurluklar ve eski Mitsubishi arazi araçlarına referans veren retro stil ekliyor. Bu boyutta bile, Mitsubishi Mini'ye gerçek kullanışlılık vermek konusunda ciddi.

## Delica Yaşam Tarzı

Elbette, tam donanımlı Delica D:5 de dikkatini çekiyor, Mitsubishi birkaç özel versiyon gösteriyor. Ultimate Gear yükseltilmiş bir süspansiyon, ekstra gövde koruması ve çizikleri gizleyen dokulu bir bitiş özelliğine sahip. Ayrıca açık hava markası LOGOS ile inşa edilmiş bir Active Camper modeli var, bu daha sıcak bir iç mekan ekliyor ancak aynı 4WD donanımını koruyor. Ralli ilhamlı dokunuşlarla Wild Adventure versiyonları Delica'nın arazi kimlik bilgilerini güçlendiriyor ve Mitsubishi'nin motorsporları geçmişine geri bağlanıyor.

Mitsubishi hatta 2025'te Asia Cross Country Rally'yi kazanan gerçek Triton ralli kamyonunu, etkinlik sırasında kullanılan bir Delica D:5 destek aracıyla birlikte sergiliyor. Bu, Delica'nın macera markalamasının tamamen kozmetik olmadığını hatırlatıyor.

Her şey 9-11 Ocak tarihlerinde Chiba'daki Makuhari Messe'de Tokyo Auto Salon 2026'da sergilenecek. Modern Delica'nın hiç ABD'ye gelip gelmeyeceği belirsizliğini koruyor. Şimdilik, Mitsubishi sahip olduğu şeyden en iyi şekilde yararlanıyor.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxODQ2/mitsubishi-delica-mini-for-2026-tokyo-auto-salon_1_01.png?arena_f_auto",
    category: "Öneri",
    tags: ["Mitsubishi", "Delica", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 55,
    title: "Yedek Parça Jantlar Zaten Bugatti'nin 4 Milyon Dolarlık Tourbillon'unu Hedefliyor",
    description: "Bugatti henüz tek bir Tourbillon'u müşteriye teslim etmeden önce, yedek parça sektörü devreye girmeye başladı. Vossen yeni V16 hypercar için dövülmüş LC3 jant setini tanıttı.",
    content: `Bugatti henüz tek bir Tourbillon'u müşteriye teslim etmeden önce, yedek parça sektörü devreye girmeye başladı. Vossen yeni V16 hypercar için dövülmüş LC3 jant setini tanıttı, tasarımlarının Molsheim'in bir sonraki amiral gemisine nasıl görüneceğini göstermek için üst düzey CGI kullanıyor. Sonuç, yaklaşık dört milyon dolardan başlayacak bir araba etrafındaki kişiselleştirme yarışında eşit parçalar hayal configurator ve erken atış.

## Dört Milyon Dolarlık Bir Tuval İçin İki LC3 Tasarımı

Vossen'in renderları beyaz ve mavi bir Tourbillon'u kademeli jant kurulumu ile eşleştiriyor. Önde LC3 11T oturuyor, derin içbükey yüzü, çok parmaklı düzeni ve fren soğutmasına işaret eden küçük havalandırma halkası olan dövülmüş monoblok. Arkada ise LC3 01T var, arka aksa motorsporları hissi veren ancak gövdeyi tasarım gürültüsünde boğmayan daha geleneksel bir Y parmak deseni.

Her ikisi de Brushed Gloss Clear'da gösteriliyor, bu işlemenin çoğu konuşmayı yapmasına izin veriyor ve Tourbillon'un temiz yüzeyiyle güzel oynuyor. LC3 için boyutlar 19 ila 24 inç arasında, genişlikler 8.5 ila 13 inç arasında ve fiyatlandırma jant başına yaklaşık 2.600 dolar. Bu supercar dünyasında çizgi dışı değil, ancak yine de lastikleri düşünmeden önce beş haneli donanım anlamına geliyor.

Bugatti'nin kendi fabrika jant aileleri olacak, seçenek paketlerine ve markanın Molsheim'deki yeni Atelier'ine bağlı. Bu alanın tüm amacı, her yapıyı markadan doğrudan özel yapılmış gibi hissettirmek. Vossen'in teklifi, bazı sahiplerin hala menüden çıkmak isteyeceğidir.

## Yedek Parça Metali Tourbillon'a Ait mi

Tartışma hemen başladı, çünkü bazı hayranlar LC3 şekillerinin arabanın aero temasını yansıtmasını beğeniyor. Diğerleri, milimetreye kadar mühendislik yapılmış sınırlı üretim, 1.800 beygir gücünde hibrit V16'da jant değiştirmenin hem teknik hem de değer açısından sorun istemek olduğunu savunuyor.

Tourbillon radikal teknolojiyle dolu, ancak kabini olağan ekran duvarını reddediyor ve analog ilhamlı bir düzen lehine. Merkezi aletler üst düzey mekanik bir saat gibi inşa edilmiş. Herhangi bir tuner yaklaşmadan önce zaten özelleştirilmiş gibi hisseden bir araba.

Ayrıca Bugatti'nin şirket içinde ne yaptığı konusunda küçük bir mesele var. Şirket bu ayın ilerleyen zamanlarında yeni bir Bugatti tek seferlik hypercar hazırlıyor ve tarih, kendi benzersiz jantları, aero ve donanımıyla geleceğini söylüyor. Fabrika zaten "standart" Tourbillon'un üzerinde oturan özel yapılar üretirken, üçüncü taraf stil parçaları ana yemekten ziyade baharat gibi görünmeye başlıyor.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxOTYx/bugatti-tourbillon-vossen-1-1031961.jpeg?arena_f_auto",
    category: "Öneri",
    tags: ["Bugatti", "Tourbillon", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 56,
    title: "Tesla Cybercab İsmini Kullanma Hakkını Satın Alması Gerekiyor—ve Yakında",
    description: "Sahne hazırdı ve ışıklar parlaktı, Tesla geçen Ekim 2024'te \"We, Robot\" etkinliğinde Cybercab'i tanıttığında. Ancak elektrikli araç üreticisi ödevini yapmamış gibi görünüyor.",
    content: `## İsim Hazır Değildi

Sahne hazırdı ve ışıklar parlaktı, Tesla geçen Ekim 2024'te "We, Robot" etkinliğinde Cybercab'i tanıttığında. Ancak elektrikli araç üreticisi ödevini yapmamış gibi görünüyor, çünkü şimdi "Cybercab" ticari markasıyla bir işgalci durumu gibi görünen bir durumla karşı karşıya.

Electrek'ten bir rapora göre, Amerika Birleşik Devletleri Patent ve Ticari Marka Ofisi (USPTO) Tesla'nın Cybercab ticari marka başvurusuna bir askıya alma bildirimi yayınladı. Bildirim, aynı isim için zaten bekleyen bir öncelik başvurusu olduğunu belirtiyor, bu Unibev adlı bir şirkete ait. Özellikle, Unibev bir Fransız içecek işletmesi olarak tanımlanıyor, bu da Cybercab isim plakasının nihayetinde dört otonom tekerlek üzerinde yuvarlanan bir araçla hiçbir ilgisi olmayabileceğini gösteriyor.

"Cybercab"i USPTO'nun çevrimiçi arama aracına yazarak ticari markayı kendiniz arayabilirsiniz.

## Déjà Vu Hissi

Durumu daha ilginç kılan şey, Unibev'in ayrıca TESLAQUILA ticari markalarına sahip olması, Tesla'nın bir zamanlar markalı alkolü için keşfettiği bir isim. Bu bağlamda bakıldığında, Cybercab anlaşmazlığı daha az tesadüfi görünüyor. Desen, Unibev'in Tesla'nın markalama faaliyetlerini, özellikle ticari marka başvurularındaki gecikmeleri aktif olarak izliyor olabileceğini gösteriyor.

Güdü açısından, olası bir açıklama finansal kaldıraçtır. Cybercab ismine öncelik haklarını güvence altına alarak, Unibev Tesla'nın ticari markayı satın almayı arzulaması durumunda önemli bir ödeme çıkarmak için kendini konumlandırabilir – bu klasik ticari marka işgalci davranışıyla yakından uyumlu bir yaklaşım.

## Saat Tıkıyor

Tesla Cybercab'i – veya nihayetinde benimseyeceği her ne ise – bu yıl Nisan ayı gibi erken bir tarihte üretmeye başlamayı planlıyor, bu da ticari marka sorununa hızlı bir yanıtı zaman hassas hale getiriyor. Ayrıca, şirket tamamen otonom sistemi için henüz düzenleyici onay almadı. Austin, Texas'ta iki Cybercab prototipinin son görüntüleri, araçların insan sürücü ve direksiyon simidi ile çalıştığını gösterdi.

Ek bağlam için, Tesla Cybercab'in nihayetinde direksiyon simidi veya pedallar olmadan üretilmesinin amaçlandığını söyledi, şirketin tamamen otonom, iki koltuklu robotaksi vizyonunu destekliyor.

Tesla'nın Cybercab ticari markası için Unibev ile müzakere etmeyi seçip seçmeyeceği veya ismi tamamen terk edip etmeyeceği görülecek. Ancak, "Cyber" kelimesini içeren bir isim plakasını korumak, şirketin mevcut ürün stratejisiyle düzgün bir şekilde uyum sağlayacaktır. Cybertruck zaten Chevrolet Silverado EV ve Rivian R1T gibi elektrikli pikap'lara Tesla'nın cevabı olarak bu markalama yaklaşımını çapalıyor. Marka ayrıca isimlendirme temasını Cyberquad for Kids elektrikli dört tekerlekli binek oyuncağı dahil olmak üzere otomotiv dışı ürünlere genişletti.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNTQz/tesla-cybercab.png?arena_f_auto",
    category: "Öneri",
    tags: ["Tesla", "Cybercab", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 57,
    title: "Mazda'nın CX-30 Satışları 2025'te Çöktü—Ancak Marka Bunun Kasıtlı Olduğunu Söylüyor",
    description: "Yüzeyde, rakamlar hikayeyi anlatıyor: Mazda CX-30, otomobil üreticisinin 2025 ABD ürün gamında en büyük darbelerden birini aldı. Aralık satışları 2.749 birime düştü, bir önceki yıla göre %69 azalma.",
    content: `## CX-30 Düşüşü Göründüğü Kadar Basit Değil

Yüzeyde, rakamlar hikayeyi anlatıyor: Mazda CX-30, otomobil üreticisinin 2025 ABD ürün gamında en büyük darbelerden birini aldı. Aralık satışları 2.749 birime düştü, bir önceki yıla göre %69 azalma. Tüm yıl için, satışlar 96.515'ten 56.684'e düştü – %41'den fazla bir düşüş. Ancak Mazda, bu rakamların düşüşü açıklayabilecek daha fazlası olduğunu söylüyor.

CarBuzz'e gönderilen bir açıklamaya göre, CX-30'un düşüşü kasıtlı bir hareket, alıcıların ilgisini kaybettiğinin bir işareti değil.

"CX-30 şu anda Meksika'da üretiliyor ve ABD-Meksika tarife anlaşmaları etrafındaki devam eden belirsizlikle, bu modelin üretimini ölçeklendirmek için stratejik bir karar verdik."

Kısacası, Mazda ABD'ye daha az CX-30 üretti ve gönderdi ve satış rakamları bunu yansıtıyor. Bunun sadece kısa vadeli bir hareket mi yoksa daha büyük bir değişimin işareti mi olduğu hala belirsiz, ancak şimdilik Mazda CX-30'un kenarda oturmasına izin vermekten memnun görünüyor.

## Mazda 2025'te Kazançlarını Nerede Buldu

CX-30 tökezlerken, Mazda'nın ABD ürün gamının geri kalanı tamamen kötü haber değildi. CX-50 açık kazanan oldu, 10.783 birim satışla şimdiye kadarki en iyi Aralık'ını kaydetti ve yılı %35.5 artışla kapattı. CX-5 136.355 birim satışla Mazda'nın en çok satanı olmaya devam ediyor – geçen yıla göre %2 artış. Bu model mevcut neslin sonuncusu olacak olsa da, bu yıl showroomlara tamamen yeni bir versiyon geliyor.

Bu büyüme başka yerlerdeki kayıpları dengelemeye yardımcı oldu ve Mazda'nın daha büyük, daha yaşam tarzı odaklı crossover'lara kaymasının çalıştığını gösterdi.

Sertifikalı ikinci el satışlar başka bir kazançtı. Mazda 2025'te 76.009 CPO aracı sattı, üst üste ikinci yıl için yeni bir rekor kırdı. Aralık CPO satışları yıllık bazda %14 arttı. Bu, alıcıların yeni arabalarda geri duruyor olsalar bile markaya hala ilgi duyduklarının bir işareti.

## Ne Geliyor

Bu parlak noktalara rağmen bile, Mazda 2025'i ABD satışlarında bir önceki yıla göre %3.3 düşüşle kapattı. Aralık özellikle zayıftı, yıllık bazda %18.9 düştü. CX-90, bahsedilen CX-30 ile birlikte en önemli düşüşü gören başka bir kilit model.

İleriye bakıldığında, Mazda'nın dikkati bir sonraki büyük hacim oyuncusuna kayıyor. Geçen yıl açıklanan ve yakında gelmesi beklenen yeni nesil CX-5, markanın ABD ürün gamını bir kez daha güçlendirmesi bekleniyor. Yenilenen stil, güncellenmiş teknoloji ve hala rekabetçi bir segmentte tanıdık bir ayak izi ile, CX-5 bu yıl Mazda'nın rakamlarını tekrar yeşile çekebilir.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/MjA5MTMxNTczNTQxMDIxNTQw/2020-mazda-cx-30.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Mazda", "CX-30", "Haber"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 58,
    title: "Cybertruck Sahibi Tesla'nın Tam Otonom Sürüşünün Ölümcül Bir Kazayı Önlemeye Yardımcı Olduğunu Söylüyor",
    description: "Tesla'nın Full Self-Driving (FSD) sistemi yaygın güvenlik incelemesiyle karşı karşıya kaldı, bazı olaylar davalara dönüştü. Ancak CBS Austin'in son bir raporu, sistemin etkili bir şekilde performans gösterdiği bir senaryoyu vurguluyor.",
    content: `## Felaketten Bir Yanlış Hareket

Tesla'nın Full Self-Driving (FSD) sistemi yaygın güvenlik incelemesiyle karşı karşıya kaldı, bazı olaylar davalara dönüştü. Ancak CBS Austin'in son bir raporu, sistemin aksi takdirde ölümcül olabilecek bir durumda etkili bir şekilde performans gösterdiği bir senaryoyu vurguluyor.

Tamamen elektrikli Cybertruck'un sahibi Clifford Lee, New Mexico'daki Highway 54'ün iki şeritli bir bölümünde yaklaşık 75 mph hızla seyahat ederken, karşı yönde seyahat eden bir pikap kamyonu aniden kendi şeridine geçti. Lee'ye göre, FSD sistemi son anda tepki verdi, Cybertruck'u bariyer yakınındaki dar bir boşluğa yönlendirdi. Hata payı o kadar küçüktü ki, gelen kamyon Cybertruck'un yan aynasını kırptı, ancak Lee yaralanmadan kurtuldu.

## Daha Yakından Bakış

Tesla'nın Full Self-Driving (FSD) sistemi Model 3, Model Y ve Cybertruck'ta 8.000 dolarlık bir seçenek, Model S ve Model X ise Tesla'nın müşteriye yönelik web sitesine göre zaten Luxe Paketi'nin bir parçası olarak bunu içeriyor. Yazılım, Navigate on Autopilot, Auto Lane Change ve Autopark gibi özellikler ekleyerek standart Autopilot paketini geliştiriyor.

Adına rağmen, FSD gerçek otonom yetenek sunmuyor. Sistem bir SAE Level 2 sürücü yardım sistemi olarak sınıflandırılıyor – Ford'un BlueCruise ve General Motors'un Super Cruise gibi sınıflandırmada benzer – bu hala sürekli sürücü dikkati ve gözetimi gerektiriyor. Bu yapılandırmada, teknoloji sürücünün yerine geçmek yerine kesinlikle bir sürüş yardımcısı olarak işlev görüyor. Yine de, Lee olaydan görünüşte sarsılmış görünse de, FSD sistemi kritik anda Cybertruck'un kontrolünü alabildi.

"Neredeyse öldürülüyordum" dedi Lee CBS Austin'e. "Bir süre kontrolsüz bir şekilde titriyordum."

## Yazılım Gelişmeye Devam Ediyor

Sonuç, düzenleyiciler güvenlik endişeleri nedeniyle FSD'yi araştırmaya devam ederken olumlu bir not taşıyor. Bildirilen vakalar arasında FSD aktif Tesla araçlarının iddiaya göre kırmızı ışıkta geçmesi ve karşı şeritlere giren araçlarla ilgili şikayetler var. Bazı eski otomobil üreticileri de sistemi lisanslamayı reddetti, bu bildirildiğine göre daha çok "Full Self-Driving" ismiyle bağlantılı, eleştirmenler bunun yanıltıcı olduğunu savunuyor.

En son yineleme, FSD v14.2.2, Aralık 2025'te yayınlandı. Güncelleme bildirildiğine göre sistemin birkaç yönünü iyileştirdi, sinir ağı görüş kodlayıcısı dahil – kamera beslemelerini sürücü yardım işlevleri için yapılandırılmış verilere dönüştüren AI tabanlı bir sürüş bileşeni.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNjA3/tesla-cybertruck.png?arena_f_auto",
    category: "Öneri",
    tags: ["Tesla", "Cybertruck", "Teknoloji"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
  {
    id: 59,
    title: "Hyundai'nin İnsansı Robotu 2035'e Kadar Fabrikalardan Evlere Taşınabilir",
    description: "Atlas ile tanışın. Boston Dynamics laboratuvarından çıkan büyüyen robot ailesinin en yeni üyesi – belki de köpek benzeri Spot'uyla en çok tanınan.",
    content: `Atlas ile tanışın. Boston Dynamics laboratuvarından çıkan büyüyen robot ailesinin en yeni üyesi – belki de köpek benzeri Spot'uyla en çok tanınan. Ancak Atlas iki ayak üzerinde yürüyor ve kesinlikle insansı bir şekle sahip. Ve şirketin ana şirketi Hyundai Motor Group'un istediği gibi olursa, Atlas yakında ABD'deki parça ve montaj fabrikalarında görünmeye başlayacak.

Hyundai bu on yılın ilerleyen zamanlarında yılda 30.000 kadar makine üretmeyi umuyor. Ve yetkililer Atlas'ın öncelikle fabrika uygulamaları için tasarlandığını söylese de, bir Boston Dynamics üst düzey yetkilisi Autoblog'a 2035'e kadar ev uygulamaları için hazır bir robot versiyonuna sahip olmak istediğini söyledi.

## Eşikte

"Smartphone'un tanıtımı kadar etkili olacak bir dönüşümün eşiğindeyiz" dedi Atlas programından sorumlu Boston Dynamics başkan yardımcısı Zachary Jackowski.

1992'de kurulan şirket, robot alanında öncü olmuştur, özgürce hareket edebilen ve robot köpek Spot gibi arama ve kurtarma dahil çeşitli hizmetler sunabilen makinelere odaklanmıştır. Boston Dynamics 2020'de Hyundai tarafından satın alındı ve o zamandan beri dünya çapında otomobil fabrikaları ve diğer fabrikalarda temel dayanak haline gelen daha geleneksel, sabit otomasyonu artırabilecek robotlar üzerinde çalışıyor.

Atlas bu çabanın ilk sonucudur. Bir bilim kurgu filminin setinden çıkmış gibi görünüyor, ancak yuvarlak, saat şeklindeki kafası "Terminator" film serisindeki robotların öfkeli yüzünden kesinlikle daha az tehditkar. Ancak Atlas yürüyebilir, eğilebilir, hatta biraz dans edebilir. Motorlu kolları bir insandan daha fazla yönde hareket edebilir ve pençe benzeri "elleri" hassas nesneleri almasına izin veren dokunsal sensörlere sahiptir. 110 pound'a kadar yük kaldırabilir – Hyundai montaj hattında kurulumuna yardımcı olabileceği tamponlar gibi.

## Üretim Planları

"Vizyonumuz, her yere gidebilen ve herhangi bir nesneyi manipüle edebilen genel amaçlı bir insansı robottur" diye açıkladı Atlas programında ürün lideri Aya Durbin.

Hyundai yılda yaklaşık 30.000 Atlas robotunu bir araya getirmek için özel bir fabrika kurmayı planlıyor, üretimin 2028'de başlaması bekleniyor. Başlangıçta, yetkililer, Georgia'daki Metaplant gibi Hyundai fabrikalarına yuvarlanmaya, yani yürümeye başlayacaklarını söyledi. Şirket daha sonra bunları diğer üreticilere sunmaya başlamayı planlıyor. İhtiyaç duyulduğunda kiralanacakları bir "robot-hizmet olarak" işletmesi öngörüyor.

Boston Dynamics yetkilileri, Atlas için özel eğitim tesisleri kurduklarını belirtti ve en son AI yazılımının robotun geleneksel fabrika otomasyonu gibi hareketlerinin özellikle programlanmasına gerek kalmadan uçarken öğrenmesine izin verdiğini ekledi. Ve robotlardan biri bir görevi öğrendiğinde – otomotiv parçalarının paletlerini boşaltmak gibi – bu bilgiyi dijital olarak klonlarına aktarabilir.

## Dostça Bir Yüz

Atlas'ın üretim versiyonu mevcut prototipten biraz farklı görünecek.

Hyundai insansı robotlar üzerinde çalışan birçok şirketten sadece biri. Oldukça fazla rakip – birçoğu Çin'den – bu hafta CES'te benzer makineler sergiliyor. Yıllık toplantıdan yok: Tesla, kendi Optimus robotunun üretimini hızlandırmaya başlıyor.

Tesla CEO'su Elon Musk Optimus için agresif planlar ortaya koydu ve sadece şirketin montaj hatlarında değil. Vizyonu eski Jetsons animasyonlu televizyon dizisinden alınmış olabilir, insansı makineleri Amerikan evlerinde yaygın olarak hayal ediyor.

Bu fikir herkesle mutlaka rezonansa girmiyor, Hyundai Motor Başkanı ve CEO'su Jaehoon Chang bir medya yuvarlak masasında kabul etti. "Terminator" gibi filmlerde protagonisler olarak hizmet eden çok fazla robot oldu. Ve robotları kıyamet işareti olarak görmeyenler için bile, fabrika işleri için ne anlama gelebilecekleri sorusu var. Kendi adına, Hyundai ve Boston Dynamics bu tür endişeleri hafife almak için büyük çaba gösterdi, Atlas'ın gelişinin her şeyden önce daha fazla iş yaratacağını vaat ediyor.

## Bir Robot Hizmetçi?

Bununla birlikte, Boston Dynamic CEO'su Robert Playter Atlas'ın evinizde bir yer bulmaya hazır olmadığını uyardı. Henüz değil. İlk endişe, dedi, "güvenliktir." Ve yeni nesil Atlas'ın sadece bulaşıklarınızı yıkayıp kaldırmakla kalmayıp, geceleri çocuğunuzu yatağa yatırabilmesini sağlamak zaman alacak.

Daha olası olarak, Autoblog'a söyledi, bu tür insansı robotlar yaşlı bakımı durumlarında özellikle yardımcı olabilir, Baby Boomer'lar ve Gen X kuşağı yaşlandıkça insan işçi eksikliğinin arttığı bir alan.

Atlas'ın ev için eğitilmesinin ne kadar süreceği sorulduğunda, Playter bunun 2035 kadar erken bir tarihte gerçekleşebileceğini öne sürdü. Diğer zorluk, ekledi, maliyet olacak. Fabrikalar altı haneli fiyat etiketlerini haklı çıkarabilir. Ev sahipleri için uygun fiyatlı hale gelmek için, bunun "$10.000 ile $20.000" arasında bir yere düşmesi gerekeceğini öne sürdü.`,
    date: "16 Ocak 2025",
    comments: 0,
    image: "https://www.autoblog.com/.image/w_1080,q_auto:good,c_limit/NzowMDAwMDAwMDAxMDMxNzI3/hyundai-atlas-robot-posed.jpg?arena_f_auto",
    category: "Öneri",
    tags: ["Hyundai", "Robot", "Teknoloji"],
    author: {
      name: "NesiVarUsta",
      role: "Admin",
      avatar: "/logo.jpeg",
    },
  },
]

// Function to get related posts based on current blog post
function getRelatedPosts(currentPostId: number, currentCategory: string) {
  // Önce aynı kategoriden blogları al
  const sameCategoryPosts = allBlogPosts
    .filter((post) => post.id !== currentPostId && post.category === currentCategory)
    .slice(0, 3)
  
  // Eğer 3'ten az varsa, diğer kategorilerden ekle
  if (sameCategoryPosts.length < 3) {
    const otherCategoryPosts = allBlogPosts
      .filter((post) => post.id !== currentPostId && post.category !== currentCategory)
      .slice(0, 3 - sameCategoryPosts.length)
    
    return [...sameCategoryPosts, ...otherCategoryPosts]
    .slice(0, 3)
    .map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        date: post.date,
        comments: post.comments,
        image: post.image,
      }))
  }
  
  return sameCategoryPosts.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      date: post.date,
      comments: post.comments,
      image: post.image,
    }))
}

// Get recent news from blog posts (last 3 posts)
const recentNews = allBlogPosts
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
    return allBlogPosts.length
  }
  return allBlogPosts.filter((post) => post.category === categoryName).length
}

// Categories
const categories = [
  { name: "Tümü", count: getCategoryCount("Tümü") },
  { name: "Arıza", count: getCategoryCount("Arıza") },
  { name: "Bakım", count: getCategoryCount("Bakım") },
  { name: "Öneri", count: getCategoryCount("Öneri") },
]

// Tags
// Get tags from all blog posts dynamically (max 10)
const getAllTags = (): string[] => {
  const allTags = new Set<string>()
  allBlogPosts.forEach((post) => {
    post.tags.forEach((tag) => allTags.add(tag))
  })
  // Alfabetik sırala ve en fazla 10 etiket göster
  return Array.from(allTags).sort().slice(0, 10)
}

// Tags (dynamically generated from blog posts, max 10)
const tags = getAllTags()


// Comments Section Component
function CommentsSection({ blogId }: { blogId: number }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    author_name: "",
    author_email: "",
    content: "",
  })
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const [fieldErrors, setFieldErrors] = useState<{
    author_name?: string
    content?: string
  }>({})
  const [userReactions, setUserReactions] = useState<Record<string, "like" | "dislike" | null>>({})
  const [commentSubmitted, setCommentSubmitted] = useState(false)

  // Yorumları yükle
  useEffect(() => {
    loadComments()
    // Sayfa değiştiğinde commentSubmitted flag'ini sıfırla
    setCommentSubmitted(false)
  }, [blogId])

  // Kullanıcının reaksiyonlarını yükle
  useEffect(() => {
    if (comments.length > 0) {
      loadUserReactions()
    }
  }, [comments])

  // Mesajları 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (submitStatus.message) {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: "" })
      }, 5000) // 5 saniye

      return () => clearTimeout(timer) // Cleanup
    }
  }, [submitStatus.message])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blogs/comments?blog_id=${blogId}`)
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

  const loadUserReactions = async () => {
    try {
      const reactions: Record<string, "like" | "dislike" | null> = {}
      await Promise.all(
        comments.map(async (comment) => {
          try {
            const response = await fetch(`/api/blogs/comments/react?comment_id=${comment.id}`)
            const data = await response.json()
            if (data.success) {
              reactions[comment.id] = data.reaction
            }
          } catch (error) {
            console.error(`Reaction load error for comment ${comment.id}:`, error)
          }
        })
      )
      setUserReactions(reactions)
    } catch (error) {
      console.error("User reactions load error:", error)
    }
  }

  const handleReaction = async (commentId: string, reaction: "like" | "dislike") => {
    try {
      const response = await fetch("/api/blogs/comments/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          reaction: reaction,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Yorumları güncelle
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes_count: data.likes_count,
                  dislikes_count: data.dislikes_count,
                }
              : comment
          )
        )

        // Kullanıcı reaksiyonunu güncelle
        setUserReactions((prev) => ({
          ...prev,
          [commentId]: data.reaction,
        }))
      }
    } catch (error) {
      console.error("Reaction error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus({ type: null, message: "" })
    setFieldErrors({})

    // Eğer bu sayfada zaten yorum atıldıysa, ikinci yorum atılmasını engelle
    if (commentSubmitted) {
      setSubmitStatus({
        type: "error",
        message: "Bu sayfada zaten yorum attınız. Sayfayı yenileyip tekrar deneyebilirsiniz.",
      })
      return
    }

    // Validasyon
    const errors: { author_name?: string; content?: string } = {}
    
    if (!formData.author_name.trim()) {
      errors.author_name = "Lütfen adınızı girin"
    }
    
    if (!formData.content.trim()) {
      errors.content = "Lütfen yorumunuzu girin"
    } else if (formData.content.trim().length < 3) {
      errors.content = "Yorum çok kısa (minimum 3 karakter)"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      setSubmitStatus({ type: null, message: "" })

      // User ID ve device ID'yi al
      const user_id = getOrCreateGuestUserId()
      const device_id = getOrCreateDeviceId()
      
      const response = await fetch("/api/blogs/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blog_id: blogId,
          author_name: formData.author_name.trim(),
          author_email: formData.author_email.trim() || undefined,
          content: formData.content.trim(),
          user_id: user_id || undefined,
          device_id: device_id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Yorum başarıyla atıldı, flag'i set et
        setCommentSubmitted(true)
        
        // Eğer yorum reddedildiyse, bunu hata olarak göster
        if (data.status === "rejected") {
          setSubmitStatus({
            type: "error",
            message: data.message || "Yorumunuz uygun bulunmadı ve yayınlanmayacaktır.",
          })
        } else {
          setSubmitStatus({
            type: "success",
            message: data.message || "Yorumunuz gönderildi!",
          })
        }
        
        // Formu temizle
        setFormData({
          author_name: "",
          author_email: "",
          content: "",
        })
        setFieldErrors({})

        // Yorumlar sadece admin onayladıktan sonra görünecek, bu yüzden burada yeniden yükleme yapmıyoruz
      } else {
        setSubmitStatus({
          type: "error",
          message: data.error || "Yorum gönderilirken bir hata oluştu",
        })
        
        // Hata durumunda formu temizle
        setFormData({
          author_name: "",
          author_email: "",
          content: "",
        })
        setFieldErrors({})
      }
    } catch (error) {
      console.error("Yorum gönderme hatası:", error)
      setSubmitStatus({
        type: "error",
        message: "Yorum gönderilirken bir hata oluştu",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-8 pb-8 border-b border-gray-700/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Yorumlar</h2>
        <div className="w-20 h-0.5 bg-gradient-to-r from-orange-500 to-blue-500 mx-auto"></div>
      </div>

      {/* Yorum Formu */}
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Yorum Yap</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author_name" className="block text-sm font-medium text-gray-300 mb-2">
                Adınız <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                id="author_name"
                value={formData.author_name}
                onChange={(e) => {
                  setFormData({ ...formData, author_name: e.target.value })
                  if (fieldErrors.author_name) {
                    setFieldErrors({ ...fieldErrors, author_name: undefined })
                  }
                }}
                className={`w-full px-4 py-2 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  fieldErrors.author_name
                    ? "border-red-500 bg-red-500/10 focus:ring-red-500"
                    : "border-gray-700 focus:ring-orange-500 focus:border-transparent"
                }`}
                placeholder="Adınız"
                disabled={submitting}
              />
              {fieldErrors.author_name && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.author_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="author_email" className="block text-sm font-medium text-gray-300 mb-2">
                E-posta (Opsiyonel)
              </label>
              <input
                type="email"
                id="author_email"
                value={formData.author_email}
                onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="email@example.com"
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Yorumunuz <span className="text-orange-400">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value })
                if (fieldErrors.content) {
                  setFieldErrors({ ...fieldErrors, content: undefined })
                }
              }}
              rows={4}
              className={`w-full px-4 py-2 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 resize-none ${
                fieldErrors.content
                  ? "border-red-500 bg-red-500/10 focus:ring-red-500"
                  : "border-gray-700 focus:ring-orange-500 focus:border-transparent"
              }`}
              placeholder="Yorumunuzu buraya yazın..."
              disabled={submitting}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/2000 karakter
            </p>
            {fieldErrors.content && (
              <p className="mt-2 text-sm text-red-400">{fieldErrors.content}</p>
            )}
          </div>
          
          {submitStatus.message && (
            <div
              className={`p-3 rounded-lg border relative ${
                submitStatus.type === "success"
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500"
              }`}
            >
              <button
                type="button"
                onClick={() => setSubmitStatus({ type: null, message: "" })}
                className={`absolute top-1/2 right-2 transform -translate-y-1/2 transition-colors ${
                  submitStatus.type === "success"
                    ? "text-green-600 hover:text-green-400"
                    : "text-red-600 hover:text-red-400"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
              <p className={`text-sm pr-6 ${
                submitStatus.type === "success" ? "text-green-400" : "text-red-400"
              }`}>
                {submitStatus.message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Yorumu Gönder
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Yorum Listesi */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto" />
            <p className="text-gray-400 mt-2">Yorumlar yükleniyor...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const userReaction = userReactions[comment.id] || null
            const likesCount = comment.likes_count || 0
            const dislikesCount = comment.dislikes_count || 0

            return (
              <div
                key={comment.id}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg p-6"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{comment.author_name}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(comment.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="ml-16">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {comment.content}
                  </p>
                  
                  {/* Like/Dislike Butonları */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleReaction(comment.id, "like")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        userReaction === "like"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${userReaction === "like" ? "fill-current" : ""}`} />
                      <span className="text-sm font-medium">{likesCount}</span>
                    </button>
                    <button
                      onClick={() => handleReaction(comment.id, "dislike")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        userReaction === "dislike"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
                      }`}
                    >
                      <ThumbsDown className={`w-4 h-4 ${userReaction === "dislike" ? "fill-current" : ""}`} />
                      <span className="text-sm font-medium">{dislikesCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function BlogDetailPage() {
  const params = useParams()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const [blogStats, setBlogStats] = useState<Record<number, { likes_count: number; dislikes_count: number }>>({})
  const [userBlogReaction, setUserBlogReaction] = useState<"like" | "dislike" | null>(null)

  // Get blog post by id from params
  const blogId = params?.id ? parseInt(params.id as string) : 1
  const blogPost = allBlogPosts.find((post) => post.id === blogId) || allBlogPosts[0]
  
  // Get related posts based on current blog post category
  const relatedPosts = getRelatedPosts(blogPost.id, blogPost.category)

  // Yorum sayılarını yükle
  useEffect(() => {
    const loadCommentCounts = async () => {
      try {
        const response = await fetch("/api/blogs/comments/counts")
        const data = await response.json()
        if (data.success && data.counts) {
          setCommentCounts(data.counts)
        }
      } catch (error) {
        console.error("Yorum sayıları yüklenirken hata:", error)
      }
    }
    loadCommentCounts()
  }, [blogId])

  // Blog stats ve kullanıcı reaksiyonunu yükle
  useEffect(() => {
    const loadBlogStats = async () => {
      try {
        // Stats'ı yükle
        const statsResponse = await fetch("/api/blogs/stats")
        const statsData = await statsResponse.json()
        if (statsData.success && statsData.stats) {
          setBlogStats(statsData.stats)
        }

        // Kullanıcının reaksiyonunu yükle (her zaman kontrol et - Firestore'dan silinirse null döner)
        const user_id = getOrCreateGuestUserId()
        const device_id = getOrCreateDeviceId()
        const reactionParams = new URLSearchParams({
          blog_id: blogId.toString(),
        })
        if (user_id) {
          reactionParams.append("user_id", user_id)
        }
        if (device_id) {
          reactionParams.append("device_id", device_id)
        }
        const reactionResponse = await fetch(`/api/blogs/react?${reactionParams.toString()}`)
        const reactionData = await reactionResponse.json()
        if (reactionData.success) {
          // API'den null dönerse (reaksiyon yoksa), frontend'de de null yap
          setUserBlogReaction(reactionData.reaction || null)
        }
      } catch (error) {
        console.error("Blog stats yüklenirken hata:", error)
      }
    }
    loadBlogStats()
  }, [blogId])

  // Blog like/dislike handler
  const handleBlogReaction = async (reaction: "like" | "dislike") => {
    try {
      // User ID ve device ID'yi al
      const user_id = getOrCreateGuestUserId()
      const device_id = getOrCreateDeviceId()
      
      const response = await fetch("/api/blogs/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blog_id: blogId,
          reaction: reaction,
          user_id: user_id || undefined,
          device_id: device_id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Stats'ı güncelle - API'den dönen veriyi direkt kullan
        setBlogStats((prev) => ({
          ...prev,
          [blogId]: {
            likes_count: data.likes_count,
            dislikes_count: data.dislikes_count,
          },
        }))
        // Kullanıcı reaksiyonunu güncelle
        setUserBlogReaction(data.reaction)
      }
    } catch (error) {
      console.error("Blog reaksiyon hatası:", error)
    }
  }

  // Parse blog content to format markdown
  const parseBlogContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      // Handle headings (##)
      if (line.trim().startsWith('##')) {
        const headingText = line.replace(/^##+\s*/, '').trim()
        return (
          <h2 key={index} className="text-2xl font-bold text-orange-400 mt-6 mb-4">
            {parseBoldText(headingText)}
          </h2>
        )
      }
      // Handle subheadings (###)
      if (line.trim().startsWith('###')) {
        const headingText = line.replace(/^###+\s*/, '').trim()
        return (
          <h3 key={index} className="text-xl font-bold text-orange-400 mt-5 mb-3">
            {parseBoldText(headingText)}
          </h3>
        )
      }
      // Handle regular paragraphs
      if (line.trim()) {
        return (
          <p key={index} className="mb-4 text-gray-300 leading-relaxed">
            {parseBoldText(line)}
          </p>
        )
      }
      return <br key={index} />
    })
  }

  // Parse bold text (**text**)
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.replace(/\*\*/g, '')
        return (
          <strong key={index} className="text-white font-bold">
            {boldText}
          </strong>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Mobile Side Menu - Same as blog list page */}
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
              { name: "Bloglar", href: "/blogs", icon: "📝", type: "link" },
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
                href="/blogs"
                className="text-gray-300 hover:text-orange-400 transition-all duration-300 font-medium relative group text-sm lg:text-base"
              >
                Bloglar
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:items-start">
            {/* Left Sidebar */}
            <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              {/* Categories */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Kategoriler</h3>
                <ul className="space-y-2">
                  {categories
                    .filter((category) => category.name === "Tümü" || category.count > 0)
                    .map((category) => (
                    <li key={category.name}>
                      <Link
                        href={`/blogs?category=${encodeURIComponent(category.name)}`}
                        className="w-full text-left px-4 py-2 rounded-lg transition-all duration-300 text-gray-300 hover:bg-gray-800/50 hover:text-orange-400 block"
                      >
                        {category.name} ({category.count})
                      </Link>
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
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                          {news.title}
                        </h4>
                        {/* Mobil: yan yana, Tablet: tarih üstte + like/dislike altında, PC: yan yana */}
                        <div className="flex flex-row md:flex-col lg:flex-row lg:items-center gap-2 md:gap-2 lg:gap-3 mt-1">
                          <p className="text-xs text-gray-400">{news.date}</p>
                          <div className="flex items-center gap-2 text-gray-400 ml-auto md:ml-0 lg:ml-auto">
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
            </aside>

            {/* Main Blog Content */}
            <main className="lg:col-span-3">
              {/* Back to Blogs */}
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors mb-6"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Bloglara Dön</span>
              </Link>

              {/* Blog Post Image */}
              <div className="relative w-full bg-gray-700/50 rounded-lg overflow-hidden mb-6">
                <img
                  src={blogPost.image}
                  alt={blogPost.title}
                  className="w-full h-auto object-contain max-h-[400px] md:max-h-[500px] lg:max-h-[600px]"
                />
              </div>

              {/* Blog Post Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{blogPost.title}</h1>

              {/* Blog Post Content */}
              <div className="prose prose-invert max-w-none mb-8">
                <div className="text-gray-300 leading-relaxed">
                  {parseBlogContent(blogPost.content)}
                </div>
              </div>

              {/* Author Info */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700/50 border-2 border-orange-500/30">
                  <img
                    src={blogPost.author.avatar}
                    alt={blogPost.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{blogPost.author.name}</h3>
                  <p className="text-gray-400 text-sm">{blogPost.author.role}</p>
                  </div>
                </div>

                {/* Blog Like/Dislike */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleBlogReaction("like")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      userBlogReaction === "like"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${userBlogReaction === "like" ? "fill-current" : ""}`} />
                    <span className="text-sm font-medium">{blogStats[blogId]?.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => handleBlogReaction("dislike")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      userBlogReaction === "dislike"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 ${userBlogReaction === "dislike" ? "fill-current" : ""}`} />
                    <span className="text-sm font-medium">{blogStats[blogId]?.dislikes_count || 0}</span>
                  </button>
                </div>
              </div>

              {/* Categories and Tags */}
              <div className="mb-8 pb-8 border-b border-gray-700/50">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Kategoriler:</span>
                    <span className="text-orange-400 ml-2">{blogPost.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Etiketler:</span>
                    <div className="inline-flex flex-wrap gap-2 ml-2">
                      {blogPost.tags.map((tag, index) => (
                        <span key={index} className="text-orange-400">
                          {tag}
                          {index < blogPost.tags.length - 1 && ","}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <CommentsSection blogId={blogPost.id} />

              {/* Post You May Like */}
              <div className="mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Beğenebileceğiniz Yazılar</h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-orange-500 to-blue-500 mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blogs/${post.id}`}
                      className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 group"
                    >
                      <div className="relative w-full h-48 bg-gray-700/50 overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6">
                        {/* Mobil: hepsi yan yana, Tablet: tarih+yorum yan yana + like/dislike altında, PC: hepsi yan yana */}
                        <div className="flex flex-row md:flex-col lg:flex-row lg:items-center lg:flex-wrap gap-3 text-sm text-gray-400 mb-3">
                          {/* Mobil, Tablet ve PC: Tarih ve yorum yan yana */}
                          <div className="flex flex-row items-center gap-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                              <span>{commentCounts[post.id] || 0}</span>
                            </div>
                          </div>
                          {/* Mobil: sağda, Tablet: altında, PC: sağda */}
                          <div className="flex items-center gap-2 ml-auto md:ml-0 lg:ml-auto">
                            <div className="flex items-center gap-1 text-gray-400">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span className="text-xs">{blogStats[post.id]?.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span className="text-xs">{blogStats[post.id]?.dislikes_count || 0}</span>
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-300 text-sm line-clamp-2">{post.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
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
