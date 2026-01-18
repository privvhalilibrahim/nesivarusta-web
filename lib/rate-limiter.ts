/**
 * Rate Limiting Utility
 * Kullanıcı bazında ve IP bazında rate limiting
 */

import { cache } from './cache';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

class RateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Rate limit config ekle
   */
  setConfig(key: string, maxRequests: number, windowMs: number) {
    this.configs.set(key, { maxRequests, windowMs });
  }

  /**
   * Rate limit kontrolü
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(identifier: string, configKey: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const config = this.configs.get(configKey);
    if (!config) {
      return { allowed: true, remaining: Infinity, resetAt: Date.now() };
    }

    const cacheKey = `rate_limit:${configKey}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Cache'den mevcut request'leri al
    const requests: number[] = (cache.get<number[]>(cacheKey) || []).filter(
      (timestamp) => timestamp > windowStart
    );

    // Yeni request ekle
    requests.push(now);
    cache.set(cacheKey, requests, config.windowMs);

    const remaining = Math.max(0, config.maxRequests - requests.length);
    const allowed = requests.length <= config.maxRequests;
    const resetAt = now + config.windowMs;

    return { allowed, remaining, resetAt };
  }

  /**
   * Rate limit'i resetle
   */
  reset(identifier: string, configKey: string) {
    const cacheKey = `rate_limit:${configKey}:${identifier}`;
    cache.delete(cacheKey);
  }
}

export const rateLimiter = new RateLimiter();

// Default configs
rateLimiter.setConfig('chat', 10, 60000); // 10 request per minute (User ID bazlı - chat için hızlı olmalı)
rateLimiter.setConfig('pdf', 5, 300000); // 5 request per 5 minutes
rateLimiter.setConfig('analyze', 20, 60000); // 20 request per minute
rateLimiter.setConfig('api', 100, 60000); // 100 request per minute (genel)

// Spam önleme için sıkı limitler (hibrit IP + User ID kontrolü)
rateLimiter.setConfig('feedback', 5, 60000); // 5 request per minute
rateLimiter.setConfig('comment', 3, 60000); // 3 request per minute (spam riski çok yüksek)
rateLimiter.setConfig('blog_react', 10, 60000); // 10 request per minute
rateLimiter.setConfig('comment_react', 10, 60000); // 10 request per minute

// Diğer API'ler için gevşek limitler
rateLimiter.setConfig('guest', 20, 60000); // 20 request per minute (IP bazlı)
rateLimiter.setConfig('history', 30, 60000); // 30 request per minute (User ID bazlı)
rateLimiter.setConfig('delete', 10, 60000); // 10 request per minute (User ID bazlı)
rateLimiter.setConfig('tts', 20, 60000); // 20 request per minute (User ID bazlı)
