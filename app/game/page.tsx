"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Car } from "lucide-react"
import { getOrCreateDeviceId, getOrCreateGuestUserId, setGuestUserId, detectDeviceType } from "@/app/lib/device"

type CarItem = {
  name: string
  price: number
  priceFormatted: string
  imageUrl?: string
}

const HIGH_SCORE_KEY = "cars-game-high-score"

/** Hotlink engelini aşmak için FastestLaps görsellerini kendi API'mizden proxy'liyoruz */
function getImageSrc(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined
  if (imageUrl.includes("media.fastestlaps.com")) {
    return `/api/game/image?url=${encodeURIComponent(imageUrl)}`
  }
  return imageUrl
}

function pickRandom(cars: CarItem[], exclude?: CarItem): CarItem {
  let c = cars[Math.floor(Math.random() * cars.length)]
  while (exclude && c === exclude) {
    c = cars[Math.floor(Math.random() * cars.length)]
  }
  return c
}

/** Cevap gösterildikten sonra fiyatı 0'dan hedef değere artan animasyonla gösterir */
function AnimatedPrice({ price, duration = 600 }: { price: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (t: number) => {
      if (start === null) start = t
      const elapsed = t - start
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - (1 - progress) ** 2
      setDisplayValue(Math.round(easeOut * price))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [price, duration])
  return <>{`€${displayValue.toLocaleString("en-US")}`}</>
}

export default function GamePage() {
  const [cars, setCars] = useState<CarItem[]>([])
  const [left, setLeft] = useState<CarItem | null>(null)
  const [right, setRight] = useState<CarItem | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [answered, setAnswered] = useState<"none" | "correct" | "wrong">("none")
  const [chosenSide, setChosenSide] = useState<"left" | "right" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/data/cars-price.json")
      .then((r) => r.json())
      .then((data: CarItem[]) => {
        setCars(data)
        if (data.length >= 2) {
          const a = pickRandom(data)
          let b = pickRandom(data, a)
          while (b === a) b = pickRandom(data, a)
          setLeft(a)
          setRight(b)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // LocalStorage'dan high score oku
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY)
      if (saved !== null) setHighScore(parseInt(saved, 10))
    } catch (_) {}
  }, [])

  // Oyun başlarken kullanıcı yoksa oluştur (blog/chat/feedback ile aynı kullanıcı)
  useEffect(() => {
    let cancelled = false
    const device_id = getOrCreateDeviceId()
    const existingUserId = getOrCreateGuestUserId()
    if (existingUserId) return

    fetch("/api/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id, ...detectDeviceType() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.user_id) return
        setGuestUserId(data.user_id)
        const serverHigh = typeof data.high_score === "number" ? data.high_score : 0
        const localHigh = (() => {
          try {
            const s = localStorage.getItem(HIGH_SCORE_KEY)
            return s !== null ? parseInt(s, 10) : 0
          } catch {
            return 0
          }
        })()
        const merged = Math.max(serverHigh, localHigh)
        if (serverHigh !== merged) setHighScore((prev) => Math.max(prev, merged))
        // Guest geç dönmüş olabilir; bu oturumda yapılan skoru da kullanıcıya yaz
        if (merged > 0) {
          fetch("/api/game/high-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: data.user_id, high_score: merged }),
          }).catch(() => {})
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  // Yeni rekor kırıldığında state + localStorage + sunucu (kullanıcıya high_score atanır)
  useEffect(() => {
    if (score <= highScore) return
    setHighScore(score)
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score))
    } catch (_) {}
    const user_id = getOrCreateGuestUserId()
    if (!user_id) return
    fetch("/api/game/high-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, high_score: score }),
    }).catch(() => {})
  }, [score, highScore])

  const ensureGuestUser = useCallback(() => {
    if (getOrCreateGuestUserId()) return
    const device_id = getOrCreateDeviceId()
    fetch("/api/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id, ...detectDeviceType() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user_id) return
        setGuestUserId(data.user_id)
        // Guest ilk tıklamada tamamlandıysa bu oturumdaki skoru da kullanıcıya yaz
        const currentScore = (() => {
          try {
            const s = localStorage.getItem(HIGH_SCORE_KEY)
            return s !== null ? parseInt(s, 10) : 0
          } catch {
            return 0
          }
        })()
        const serverHigh = typeof data.high_score === "number" ? data.high_score : 0
        const toSend = Math.max(currentScore, serverHigh)
        if (toSend > 0) {
          fetch("/api/game/high-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: data.user_id, high_score: toSend }),
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  const handleChoice = useCallback(
    (side: "left" | "right") => {
      if (answered !== "none" || !left || !right) return
      // Mobilde mount'taki guest bazen tamamlanmıyor; ilk tıklamada yoksa burada oluştur (feedback gibi)
      ensureGuestUser()
      const chosen = side === "left" ? left : right
      const other = side === "left" ? right : left
      const correct = chosen.price >= other.price
      setChosenSide(side)
      setAnswered(correct ? "correct" : "wrong")
      if (correct) {
        setScore((s) => s + 1)
      }
    },
    [answered, left, right, ensureGuestUser]
  )

  const nextRound = useCallback(() => {
    if (!left || !right || cars.length < 2) return
    const winner = chosenSide === "left" ? left : right
    let next = pickRandom(cars, winner)
    while (next === winner) next = pickRandom(cars, winner)
    setLeft(winner)
    setRight(next)
    setAnswered("none")
    setChosenSide(null)
  }, [left, right, chosenSide, cars])

  // Doğru cevaptan 3 saniye sonra otomatik bir sonraki soruya geç
  useEffect(() => {
    if (answered !== "correct" || !left || !right || cars.length < 2) return
    const t = setTimeout(nextRound, 3000)
    return () => clearTimeout(t)
  }, [answered, nextRound, left, right, cars.length])

  const restart = useCallback(() => {
    if (cars.length < 2) return
    const a = pickRandom(cars)
    let b = pickRandom(cars, a)
    while (b === a) b = pickRandom(cars, a)
    setLeft(a)
    setRight(b)
    setScore(0)
    setAnswered("none")
    setChosenSide(null)
  }, [cars])

  if (loading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <p className="text-white/80">Yükleniyor...</p>
      </div>
    )
  }

  if (cars.length < 2) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <p className="text-white/80">Araba listesi yüklenemedi.</p>
      </div>
    )
  }

  const showResult = answered !== "none"
  const correctSide =
    left && right
      ? left.price >= right.price
        ? "left"
        : "right"
      : null

  return (
    <div className="h-full min-h-0 w-full max-w-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Üst bar: oyun adı */}
      <div className="flex-shrink-0 flex justify-center items-center px-4 py-3 border-b border-gray-800">
        <h1 className="text-lg font-semibold text-white">Hangi Araba Daha Pahalı?</h1>
      </div>

      {/* Game area: tam genişlik/yükseklik; mobil alt-üst, büyük ekran yan yana — iOS Chrome taşma için max-w-full */}
      <div className="flex-1 min-h-0 min-w-0 w-full max-w-full flex flex-col md:flex-row relative overflow-hidden">
        {/* Sol / Üst araba */}
        <button
          type="button"
          onClick={() => handleChoice("left")}
          disabled={showResult}
          className={`flex-1 min-h-0 min-w-0 max-w-full flex flex-col transition-all duration-300 relative overflow-hidden group ${
            showResult ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <div
            className={`flex-1 min-h-[40vh] md:min-h-0 min-w-0 w-full max-w-full relative border-4 transition-all duration-300 overflow-hidden ${
              showResult && correctSide === "left"
                ? "border-green-500 shadow-[0_0_24px_rgba(34,197,94,0.5)]"
                : showResult && chosenSide === "left" && answered === "wrong"
                  ? "border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]"
                  : "border-transparent [@media(hover:hover)]:group-hover:border-gray-600"
            }`}
          >
            {/* Blog gibi: object-contain ile tüm görsel görünür; hover sadece masaüstü (mobilde takılmaz) */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              {getImageSrc(left?.imageUrl) ? (
                <img
                  src={getImageSrc(left?.imageUrl)}
                  alt={left?.name ?? ""}
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Car className="w-20 h-20 md:w-24 md:h-24 text-gray-600" strokeWidth={1.5} />
                </div>
              )}
            </div>
            {/* Hover: sol panel karartma — sadece (hover: hover) cihazlarda, mobilde kalın çerçeve kalmaz */}
            {!showResult && (
              <div className="absolute inset-0 bg-black/40 opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
            )}
            {/* İsim + fiyat overlay (görseldeki gibi beyaz kutu) */}
            {left && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-center font-semibold text-white line-clamp-2 drop-shadow-md">{left.name}</p>
                {showResult && (
                  <p className="text-center text-sm font-medium text-gray-200 mt-1">
                    <AnimatedPrice price={left.price} />
                  </p>
                )}
              </div>
            )}
          </div>
        </button>

        {/* Sağ / Alt araba */}
        <button
          type="button"
          onClick={() => handleChoice("right")}
          disabled={showResult}
          className={`flex-1 min-h-0 min-w-0 max-w-full flex flex-col transition-all duration-300 relative overflow-hidden group ${
            showResult ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <div
            className={`flex-1 min-h-[40vh] md:min-h-0 min-w-0 w-full max-w-full relative border-4 transition-all duration-300 overflow-hidden ${
              showResult && correctSide === "right"
                ? "border-green-500 shadow-[0_0_24px_rgba(34,197,94,0.5)]"
                : showResult && chosenSide === "right" && answered === "wrong"
                  ? "border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]"
                  : "border-transparent [@media(hover:hover)]:group-hover:border-gray-600"
            }`}
          >
            {/* Blog gibi: object-contain ile tüm görsel görünür; hover sadece masaüstü */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              {getImageSrc(right?.imageUrl) ? (
                <img
                  src={getImageSrc(right?.imageUrl)}
                  alt={right?.name ?? ""}
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Car className="w-20 h-20 md:w-24 md:h-24 text-gray-600" strokeWidth={1.5} />
                </div>
              )}
            </div>
            {/* Hover: sağ panel karartma — sadece (hover: hover) cihazlarda */}
            {!showResult && (
              <div className="absolute inset-0 bg-black/40 opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
            )}
            {right && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-center font-semibold text-white line-clamp-2 drop-shadow-md">{right.name}</p>
                {showResult && (
                  <p className="text-center text-sm font-medium text-gray-200 mt-1">
                    <AnimatedPrice price={right.price} />
                  </p>
                )}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Alt bar: sol en yüksek skor, orta ana sayfa, sağ güncel skor — mobilde aynı satırda */}
      <div className="flex-shrink-0 px-2 py-3 md:p-4 border-t border-gray-800 grid grid-cols-3 items-center gap-1 md:gap-4 min-w-0">
        <span className="text-sm text-gray-400 whitespace-nowrap truncate min-w-0" title="En yüksek skor">
          En yüksek: <strong className="text-white">{highScore}</strong>
        </span>
        <div className="flex items-center justify-center gap-2 md:gap-4 min-w-0 shrink-0">
          {showResult && answered === "wrong" && (
            <button
              type="button"
              onClick={restart}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors text-sm whitespace-nowrap"
            >
              Tekrar oyna
            </button>
          )}
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors whitespace-nowrap"
          >
            Ana sayfa
          </Link>
        </div>
        <span className="text-sm text-gray-400 text-right whitespace-nowrap min-w-0" title="Skor">
          Skor: <strong className="text-white">{score}</strong>
        </span>
      </div>
    </div>
  )
}
