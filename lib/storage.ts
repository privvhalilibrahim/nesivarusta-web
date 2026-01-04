/**
 * LocalStorage Yönetim Utility
 * Cache stratejisi ve temizleme mekanizması
 */

const STORAGE_PREFIX = 'nesivarusta-';
const MAX_CACHE_SIZE = 50; // Maksimum cache'lenebilecek chat sayısı
const CACHE_EXPIRY_DAYS = 30; // Cache'in geçerlilik süresi (gün)

interface CacheEntry {
  data: any;
  timestamp: number;
  chatId: string;
}

/**
 * LocalStorage'dan veri okur (güvenli)
 */
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!item) return null;

    const parsed = JSON.parse(item);
    
    // Eğer timestamp varsa, expiry kontrolü yap
    if (parsed.timestamp) {
      const age = Date.now() - parsed.timestamp;
      const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        // Expired, sil
        removeFromStorage(key);
        return null;
      }
    }

    return parsed.data || parsed;
  } catch (error) {
    console.error(`[Storage] Error reading ${key}:`, error);
    // Hatalı veri varsa temizle
    removeFromStorage(key);
    return null;
  }
}

/**
 * LocalStorage'a veri yazar (güvenli)
 */
export function setToStorage<T>(key: string, data: T, withTimestamp = false): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const item = withTimestamp
      ? { data, timestamp: Date.now() }
      : data;

    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(item));
    return true;
  } catch (error) {
    // Quota exceeded hatası olabilir
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[Storage] Quota exceeded, cleaning old cache...');
      cleanupOldCache();
      
      // Tekrar dene
      try {
        const item = withTimestamp
          ? { data, timestamp: Date.now() }
          : data;
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(item));
        return true;
      } catch (retryError) {
        console.error(`[Storage] Error writing ${key} after cleanup:`, retryError);
        return false;
      }
    }
    
    console.error(`[Storage] Error writing ${key}:`, error);
    return false;
  }
}

/**
 * LocalStorage'dan veri siler
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
  }
}

/**
 * Eski cache'leri temizler (expiry ve boyut kontrolü)
 */
export function cleanupOldCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const chatMessages: CacheEntry[] = [];
    const keysToRemove: string[] = [];

    // Tüm chat mesajlarını topla
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`${STORAGE_PREFIX}messages-`)) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const parsed = JSON.parse(item);
        const chatId = key.replace(`${STORAGE_PREFIX}messages-`, '');
        
        chatMessages.push({
          data: parsed,
          timestamp: parsed.timestamp || Date.now(),
          chatId,
        });
      } catch {
        // Hatalı veri, sil
        keysToRemove.push(key);
      }
    }

    // Expiry kontrolü - eski cache'leri sil
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    chatMessages.forEach((entry) => {
      if (now - entry.timestamp > maxAge) {
        keysToRemove.push(`${STORAGE_PREFIX}messages-${entry.chatId}`);
      }
    });

    // Boyut kontrolü - en eski cache'leri sil
    if (chatMessages.length > MAX_CACHE_SIZE) {
      // Timestamp'e göre sırala (en eski önce)
      chatMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      // En eski olanları sil
      const toRemove = chatMessages.slice(0, chatMessages.length - MAX_CACHE_SIZE);
      toRemove.forEach((entry) => {
        keysToRemove.push(`${STORAGE_PREFIX}messages-${entry.chatId}`);
      });
    }

    // Silinecek key'leri temizle
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      console.info(`[Storage] Cleaned up ${keysToRemove.length} old cache entries`);
    }
  } catch (error) {
    console.error('[Storage] Error during cleanup:', error);
  }
}

/**
 * Chat mesajlarını cache'ler
 */
export function cacheChatMessages(chatId: string, messages: any[]): boolean {
  return setToStorage(`messages-${chatId}`, messages, true);
}

/**
 * Chat mesajlarını cache'den okur
 */
export function getCachedChatMessages(chatId: string): any[] | null {
  return getFromStorage(`messages-${chatId}`);
}

/**
 * Chat history'yi cache'ler
 */
export function cacheChatHistory(history: any[]): boolean {
  return setToStorage('chat-history', history);
}

/**
 * Chat history'yi cache'den okur
 */
export function getCachedChatHistory(): any[] | null {
  return getFromStorage('chat-history');
}

/**
 * Belirli bir chat'in cache'ini siler
 */
export function clearChatCache(chatId: string): void {
  removeFromStorage(`messages-${chatId}`);
}

/**
 * Tüm cache'i temizler (dikkatli kullan!)
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.info(`[Storage] Cleared ${keysToRemove.length} cache entries`);
  } catch (error) {
    console.error('[Storage] Error clearing cache:', error);
  }
}
