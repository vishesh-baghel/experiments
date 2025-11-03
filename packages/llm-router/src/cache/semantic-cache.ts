/**
 * Semantic Cache - Uses Upstash Vector with built-in embeddings
 * 
 * Architecture:
 * - Upstash Vector generates embeddings automatically (no OpenAI embedding API needed)
 * - Fast semantic similarity search (<50ms)
 * - Async writes (don't block responses)
 * 
 * Performance:
 * - First unique query: <50ms (Upstash generates embedding + searches)
 * - Repeated query: <50ms (semantic match)
 * - Similar query: <50ms (semantic match)
 */

import { Index } from '@upstash/vector';

export interface CacheEntry {
  query: string;
  response: string;
  model: string;
  provider: string;
  complexity: string;
  timestamp: number;
  hits: number;
  cost: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  costSaved: number;
  avgHitsPerEntry: number;
}

export class SemanticCache {
  private vectorDb: Index | null = null;
  private similarityThreshold: number;
  private totalLookups: number = 0;
  private totalHits: number = 0;
  private useVector: boolean;

  constructor(options: {
    similarityThreshold?: number;
    useVector?: boolean;
  } = {}) {
    this.similarityThreshold = options.similarityThreshold ?? 0.85;
    this.useVector = options.useVector ?? true;
    
    if (this.useVector) {
      this.initializeVector();
    }
  }

  /**
   * Initialize Upstash Vector client
   */
  private initializeVector(): void {
    try {
      if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
        console.warn('[SemanticCache] Upstash Vector credentials not found, caching disabled');
        this.useVector = false;
        return;
      }

      this.vectorDb = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN,
      });
      
      console.log('[SemanticCache] Upstash Vector initialized for semantic caching');
    } catch (error) {
      console.error('[SemanticCache] Failed to initialize Upstash Vector:', error);
      this.useVector = false;
    }
  }

  /**
   * Get cached response using semantic similarity search
   * Upstash generates embeddings automatically from the query text
   * 
   * Flow:
   * 1. Pass raw query text to Upstash (no embedding generation needed)
   * 2. Upstash generates embedding and searches (<50ms total)
   * 3. Return if similarity >= threshold
   */
  async get(query: string): Promise<CacheEntry | null> {
    this.totalLookups++;

    if (!this.useVector || !this.vectorDb) {
      return null;
    }

    try {
      console.log(`[Cache] Querying for: "${query.substring(0, 50)}..."`);
      
      // Query Upstash Vector with raw text (Upstash generates embedding automatically)
      const results = await this.vectorDb.query({
        data: query, // Pass raw text instead of vector
        topK: 1,
        includeMetadata: true,
      });

      if (results.length === 0) {
        console.log(`[Cache] ✗ MISS - No similar queries found`);
        return null;
      }

      const match = results[0];
      const similarity = match.score;

      const matchId = String(match.id || '');
      console.log(`[Cache] Best match: "${matchId.substring(0, 50)}..." (similarity: ${(similarity * 100).toFixed(1)}%)`);
      console.log(`[Cache] Threshold: ${(this.similarityThreshold * 100).toFixed(1)}%`);

      if (similarity >= this.similarityThreshold && match.metadata) {
        console.log(`[Cache] ✓ HIT - Returning cached response`);
        this.totalHits++;
        
        // Cast metadata to CacheEntry
        const entry = match.metadata as unknown as CacheEntry;
        entry.hits = (entry.hits || 0) + 1;
        
        // Update hits asynchronously
        this.vectorDb.update({
          id: matchId,
          metadata: entry as any,
        }).catch(err => console.error('[Cache] Error updating hits:', err));
        
        return entry;
      }

      console.log(`[Cache] ✗ MISS - Similarity below threshold`);
      return null;
    } catch (error) {
      console.error('[Cache] Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Cache a new query-response pair
   * Generates embedding and stores in Upstash Vector asynchronously
   */
  async set(
    query: string,
    response: string,
    model: string,
    cost: number,
    provider?: string,
    complexity?: string
  ): Promise<void> {
    if (!this.useVector) {
      return;
    }

    // Fire-and-forget async
    this.setCacheAsync(query, response, model, cost, provider, complexity).catch(err =>
      console.error('[Cache] Failed to cache entry:', err)
    );
  }

  /**
   * Internal async method to store in cache
   * Upstash generates embeddings automatically from the query text
   */
  private async setCacheAsync(
    query: string,
    response: string,
    model: string,
    cost: number,
    provider?: string,
    complexity?: string
  ): Promise<void> {
    if (!this.vectorDb) return;

    try {
      const entry: CacheEntry = {
        query,
        response,
        model,
        provider: provider || 'openai',
        complexity: complexity || 'unknown',
        timestamp: Date.now(),
        hits: 0,
        cost,
      };

      // Store in Upstash Vector with raw text (Upstash generates embedding automatically)
      await this.vectorDb.upsert({
        id: query,
        data: query, // Pass raw text instead of vector
        metadata: entry as any,
      });

      console.log(`[Cache] ✓ Stored entry for: "${query.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[Cache] Error in setCacheAsync:', error);
    }
  }

  /**
   * Clear all cached entries
   */
  async clear(): Promise<void> {
    if (!this.useVector || !this.vectorDb) {
      return;
    }

    try {
      // Upstash Vector reset
      await this.vectorDb.reset();
      
      this.totalLookups = 0;
      this.totalHits = 0;
      
      console.log(`[Cache] Cleared all entries`);
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.useVector || !this.vectorDb) {
      return {
        totalEntries: 0,
        totalHits: 0,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null,
        costSaved: 0,
        avgHitsPerEntry: 0,
      };
    }

    try {
      const info = await this.vectorDb.info();
      
      return {
        totalEntries: info.vectorCount || 0,
        totalHits: this.totalHits,
        hitRate: this.totalLookups > 0 ? this.totalHits / this.totalLookups : 0,
        oldestEntry: null,
        newestEntry: null,
        costSaved: 0,
        avgHitsPerEntry: 0,
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null,
        costSaved: 0,
        avgHitsPerEntry: 0,
      };
    }
  }

  /**
   * Set similarity threshold
   */
  setSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = threshold;
  }

  /**
   * Get similarity threshold
   */
  getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }
}
