/**
 * User Management Utilities
 * User oluşturma ve güncelleme işlemlerini merkezi hale getirir
 * Kod tekrarını önler, tutarlılık sağlar
 */

import admin from "firebase-admin"
import { db } from "@/app/firebase/firebaseAdmin"

export interface CreateUserParams {
  device_id: string
  ip_address: string
  from_tablet?: boolean
  from_phone?: boolean
  from_pc?: boolean
  highScore?: number
  initialCounts?: {
    total_chats?: number
    total_messages?: number
    total_feedbacks?: number
    total_comments?: number
    total_likes?: number
    total_dislikes?: number
  }
}

export interface UpdateUserParams {
  user_id: string
  ip_address?: string
  from_tablet?: boolean
  from_phone?: boolean
  from_pc?: boolean
  last_seen_at?: admin.firestore.Timestamp
}

/**
 * Yeni user oluştur
 * Tüm gerekli alanları tutarlı şekilde initialize eder
 */
export async function createUser(params: CreateUserParams): Promise<string> {
  const {
    device_id,
    ip_address,
    from_tablet = false,
    from_phone = false,
    from_pc = true,
    highScore = 0,
    initialCounts = {},
  } = params

  const now = admin.firestore.Timestamp.now()

  // Yeni user document oluştur
  const userRef = db.collection("users").doc()
  const user_id = userRef.id

  await userRef.set({
    block_reason: "",
    blocked: false,
    created_at: now,
    device_id,
    first_seen_at: now,
    ip_address,
    last_seen_at: now,
    notes: "",
    from_tablet,
    from_phone,
    from_pc,
    total_chats: initialCounts.total_chats ?? 0,
    total_messages: initialCounts.total_messages ?? 0,
    total_feedbacks: initialCounts.total_feedbacks ?? 0,
    total_comments: initialCounts.total_comments ?? 0,
    total_likes: initialCounts.total_likes ?? 0,
    total_dislikes: initialCounts.total_dislikes ?? 0,
    high_score: highScore,
    type: "guest",
    updated_at: now,
    user_id,
  })

  return user_id
}

/**
 * Mevcut user'ı bul veya oluştur (device_id ile)
 * /api/guest endpoint'i ile aynı mantık
 */
export async function findOrCreateUserByDeviceId(
  device_id: string,
  params: {
    ip_address: string
    from_tablet?: boolean
    from_phone?: boolean
    from_pc?: boolean
  }
): Promise<{ user_id: string; isNew: boolean; high_score: number }> {
  const { 
    ip_address, 
    from_tablet = false,
    from_phone = false,
    from_pc = true,
  } = params

  const now = admin.firestore.Timestamp.now()

  // Mevcut user'ı bul
  const existing = await db
    .collection("users")
    .where("device_id", "==", device_id)
    .limit(1)
    .get()

  if (!existing.empty) {
    // Mevcut user bulundu - güncelle
    const doc = existing.docs[0]
    const data = doc.data()
    await doc.ref.set(
      {
        last_seen_at: now,
        ip_address,
        from_tablet,
        from_phone,
        from_pc,
        updated_at: now,
      },
      { merge: true }
    )

    return { user_id: doc.id, isNew: false, high_score: typeof data?.high_score === "number" ? data.high_score : 0 }
  }

  // Yeni user oluştur (high_score: 0 ile)
  const user_id = await createUser({
    device_id,
    ip_address,
    from_tablet,
    from_phone,
    from_pc,
    highScore: 0,
  })

  return { user_id, isNew: true, high_score: 0 }
}

/**
 * User'ı güncelle (last_seen_at, ip_address)
 */
export async function updateUserActivity(
  params: UpdateUserParams
): Promise<void> {
  const { user_id, ip_address, from_tablet, from_phone, from_pc, last_seen_at } = params

  const updateData: any = {
    updated_at: admin.firestore.Timestamp.now(),
  }

  if (last_seen_at !== undefined) {
    updateData.last_seen_at = last_seen_at
  } else {
    updateData.last_seen_at = admin.firestore.Timestamp.now()
  }

  if (ip_address !== undefined) {
    updateData.ip_address = ip_address
  }

  if (from_tablet !== undefined) {
    updateData.from_tablet = from_tablet
  }

  if (from_phone !== undefined) {
    updateData.from_phone = from_phone
  }

  if (from_pc !== undefined) {
    updateData.from_pc = from_pc
  }

  const userRef = db.collection("users").doc(user_id)
  await userRef.set(updateData, { merge: true })
}

/**
 * User'ın var olup olmadığını kontrol et (user_id ile)
 */
export async function userExists(user_id: string): Promise<boolean> {
  const userDoc = await db.collection("users").doc(user_id).get()
  return userDoc.exists
}

/**
 * User'ın high_score alanını güncelle (sadece yeni skor daha büyükse)
 */
export async function updateUserHighScore(
  user_id: string,
  high_score: number
): Promise<void> {
  const userRef = db.collection("users").doc(user_id)
  const doc = await userRef.get()
  if (!doc.exists) return

  const current = (doc.data()?.high_score as number) ?? 0
  if (high_score <= current) return

  await userRef.set(
    {
      high_score,
      updated_at: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  )
}

/**
 * User'ı bul (device_id ile)
 */
export async function findUserByDeviceId(
  device_id: string
): Promise<{ user_id: string; exists: boolean }> {
  const existing = await db
    .collection("users")
    .where("device_id", "==", device_id)
    .limit(1)
    .get()

  if (existing.empty) {
    return { user_id: "", exists: false }
  }

  return { user_id: existing.docs[0].id, exists: true }
}
