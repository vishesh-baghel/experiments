/**
 * Vercel KV Cache Wrapper for Persistent Caching
 * Falls back to in-memory cache in development
 */

import { kv } from '@vercel/kv';
import type { CacheEntry } from 'llm-router';

const CACHE_PREFIX = 'llm-cache:';
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

export class VercelKVCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' && !!process.env.KV_REST_API_URL;
  }

  /**
   * Get cached entry
   */
  async get(key: string): Promise<CacheEntry | null> {
    try {
      if (this.isProduction) {
        const cached = await kv.get<CacheEntry>(`${CACHE_PREFIX}${key}`);
        return cached;
      } else {
        // Development: use in-memory cache
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error('[Cache] Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Set cached entry
   */
  async set(key: string, value: CacheEntry): Promise<void> {
    try {
      if (this.isProduction) {
        await kv.set(`${CACHE_PREFIX}${key}`, value, { ex: CACHE_TTL });
      } else {
        // Development: use in-memory cache
        this.memoryCache.set(key, value);
      }
    } catch (error) {
      console.error('[Cache] Error setting cache:', error);
    }
  }

  /**
   * Get all cache keys (for semantic search)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      if (this.isProduction) {
        const keys = await kv.keys(`${CACHE_PREFIX}*`);
        return keys.map(k => k.replace(CACHE_PREFIX, ''));
      } else {
        return Array.from(this.memoryCache.keys());
      }
    } catch (error) {
      console.error('[Cache] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Get all cache entries (for semantic search)
   */
  async getAllEntries(): Promise<CacheEntry[]> {
    try {
      if (this.isProduction) {
        const keys = await this.getAllKeys();
        const entries = await Promise.all(
          keys.map(key => this.get(key))
        );
        return entries.filter((e: CacheEntry | null): e is CacheEntry => e !== null);
      } else {
        return Array.from(this.memoryCache.values());
      }
    } catch (error) {
      console.error('[Cache] Error getting entries:', error);
      return [];
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.isProduction) {
        const keys = await kv.keys(`${CACHE_PREFIX}*`);
        if (keys.length > 0) {
          await kv.del(...keys);
        }
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    try {
      if (this.isProduction) {
        const keys = await kv.keys(`${CACHE_PREFIX}*`);
        return keys.length;
      } else {
        return this.memoryCache.size;
      }
    } catch (error) {
      console.error('[Cache] Error getting size:', error);
      return 0;
    }
  }
}
