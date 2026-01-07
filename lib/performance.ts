/**
 * Performance Optimization Utilities
 * Query optimization, connection pooling, ve caching için
 */

import { cache } from './cache';

/**
 * Firestore query cache key oluştur
 */
export function createCacheKey(collection: string, filters: Record<string, any>): string {
  const filterStr = JSON.stringify(filters);
  return `firestore:${collection}:${Buffer.from(filterStr).toString('base64')}`;
}

/**
 * Firestore query'yi cache'le
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl: number = 30000 // 30 saniye default
): Promise<T> {
  // Cache'den kontrol et
  const cached = cache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Query'yi çalıştır
  const result = await queryFn();
  
  // Cache'e kaydet
  cache.set(cacheKey, result, ttl);
  
  return result;
}

/**
 * Batch operations için debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Concurrent request limiter
 */
class RequestLimiter {
  private activeRequests: Map<string, number> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const current = this.activeRequests.get(key) || 0;
    
    if (current >= this.maxConcurrent) {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.execute(key, fn);
    }

    this.activeRequests.set(key, current + 1);
    
    try {
      return await fn();
    } finally {
      const updated = (this.activeRequests.get(key) || 1) - 1;
      if (updated <= 0) {
        this.activeRequests.delete(key);
      } else {
        this.activeRequests.set(key, updated);
      }
    }
  }
}

export const requestLimiter = new RequestLimiter(10);
