import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticCache } from '../semantic-cache';

describe('SemanticCache', () => {
  let cache: SemanticCache;

  beforeEach(() => {
    cache = new SemanticCache({ similarityThreshold: 0.85 });
  });

  describe('basic operations', () => {
    it('should return null for empty cache', async () => {
      const result = await cache.get('test query');
      expect(result).toBeNull();
    });

    it('should cache and retrieve exact match', async () => {
      await cache.set('What are your hours?', 'We are open 9-5', 'gpt-4o-mini', 0.0001);
      
      const result = await cache.get('What are your hours?');
      expect(result).not.toBeNull();
      expect(result?.response).toBe('We are open 9-5');
      expect(result?.model).toBe('gpt-4o-mini');
    });

    it('should retrieve semantically similar queries', async () => {
      // Use very low similarity threshold for this test (embeddings can vary)
      const testCache = new SemanticCache({ similarityThreshold: 0.70 });
      await testCache.set('What are your business hours?', 'We are open 9-5', 'gpt-4o-mini', 0.0001);
      
      // Very similar query - almost identical meaning
      const result = await testCache.get('What are your hours?');
      expect(result).not.toBeNull();
      expect(result?.response).toBe('We are open 9-5');
    }, 10000);

    it('should not retrieve dissimilar queries', async () => {
      await cache.set('What are your hours?', 'We are open 9-5', 'gpt-4o-mini', 0.0001);
      
      // Completely different query
      const result = await cache.get('How do I reset my password?');
      expect(result).toBeNull();
    }, 10000);
  });

  describe('hit tracking', () => {
    it('should increment hits on cache hit', async () => {
      await cache.set('test query', 'test response', 'gpt-4o-mini', 0.0001);
      
      await cache.get('test query');
      await cache.get('test query');
      
      const stats = cache.getStats();
      expect(stats.totalHits).toBe(2);
    });

    it('should track hit rate correctly', async () => {
      // Use very different queries to ensure miss
      await cache.set('What are your business hours?', 'response 1', 'gpt-4o-mini', 0.0001);
      
      await cache.get('What are your business hours?'); // hit
      await cache.get('How do I implement OAuth2 authentication in Python?'); // miss (completely different)
      await cache.get('What are your business hours?'); // hit
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
    });
  });

  describe('cache eviction', () => {
    it('should evict oldest entry when max size reached', async () => {
      const smallCache = new SemanticCache({ maxEntries: 2 });
      
      // Use very different queries to avoid semantic similarity matches
      await smallCache.set('What are your business hours?', 'response 1', 'gpt-4o-mini', 0.0001);
      await smallCache.set('How do I implement OAuth2 authentication?', 'response 2', 'gpt-4o-mini', 0.0001);
      await smallCache.set('What is the capital of France?', 'response 3', 'gpt-4o-mini', 0.0001);
      
      expect(smallCache.size()).toBe(2);
      
      // First query should be evicted
      const result = await smallCache.get('What are your business hours?');
      expect(result).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should calculate cost saved correctly', async () => {
      await cache.set('query 1', 'response 1', 'gpt-4o-mini', 0.001);
      await cache.set('query 2', 'response 2', 'gpt-4o', 0.01);
      
      await cache.get('query 1'); // hit, saves 0.001
      await cache.get('query 1'); // hit, saves 0.001
      await cache.get('query 2'); // hit, saves 0.01
      
      const stats = cache.getStats();
      expect(stats.costSaved).toBeCloseTo(0.012, 3);
    });

    it('should track timestamps correctly', async () => {
      const before = Date.now();
      await cache.set('query 1', 'response 1', 'gpt-4o-mini', 0.0001);
      const after = Date.now();
      
      const stats = cache.getStats();
      expect(stats.oldestEntry).toBeGreaterThanOrEqual(before);
      expect(stats.oldestEntry).toBeLessThanOrEqual(after);
    });
  });

  describe('configuration', () => {
    it('should respect custom similarity threshold', async () => {
      const strictCache = new SemanticCache({ similarityThreshold: 0.95 });
      
      await strictCache.set('What are your hours?', 'We are open 9-5', 'gpt-4o-mini', 0.0001);
      
      // Similar but not identical - should miss with high threshold
      const result = await strictCache.get('What time do you open?');
      expect(result).toBeNull();
    }, 10000);

    it('should allow updating similarity threshold', () => {
      cache.setSimilarityThreshold(0.9);
      expect(() => cache.setSimilarityThreshold(1.5)).toThrow();
      expect(() => cache.setSimilarityThreshold(-0.1)).toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset stats', async () => {
      await cache.set('query 1', 'response 1', 'gpt-4o-mini', 0.0001);
      await cache.set('query 2', 'response 2', 'gpt-4o-mini', 0.0001);
      await cache.get('query 1');
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });
});
