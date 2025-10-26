import { describe, it, expect, beforeEach } from 'vitest';
import { LLMRouter } from '../index';

describe('LLMRouter', () => {
  let router: LLMRouter;

  beforeEach(() => {
    router = new LLMRouter();
  });

  describe('Query Routing', () => {
    it('should route simple query to cheap model', async () => {
      const result = await router.routeQuery('What are your hours?');
      
      expect(result).toBeDefined();
      expect(result.complexity.level).toBe('simple');
      expect(['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku-20240307']).toContain(result.model);
    });

    it('should route complex query to advanced model', async () => {
      const result = await router.routeQuery(
        'Explain how OAuth2 works and help me implement it with refresh tokens'
      );
      
      expect(['moderate', 'complex', 'reasoning']).toContain(result.complexity.level);
      expect(result.estimatedCost.total).toBeGreaterThan(0);
    });

    it('should include complexity analysis', async () => {
      const result = await router.routeQuery('Test query');
      
      expect(result.complexity).toBeDefined();
      expect(result.complexity.level).toBeDefined();
      expect(result.complexity.score).toBeGreaterThanOrEqual(0);
      expect(result.complexity.score).toBeLessThanOrEqual(100);
      expect(result.complexity.factors).toBeDefined();
      expect(result.complexity.reasoning).toBeDefined();
    });

    it('should include cost estimation', async () => {
      const result = await router.routeQuery('Test query');
      
      expect(result.estimatedCost).toBeDefined();
      expect(result.estimatedCost.input).toBeGreaterThanOrEqual(0);
      expect(result.estimatedCost.output).toBeGreaterThanOrEqual(0);
      expect(result.estimatedCost.total).toBeGreaterThanOrEqual(0);
    });

    it('should include routing reasoning', async () => {
      const result = await router.routeQuery('Test query');
      
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(10);
    });
  });

  describe('Router Options', () => {
    it('should respect preferCheaper option', async () => {
      const expensive = await router.routeQuery('Complex query', {
        preferCheaper: false,
      });
      const cheap = await router.routeQuery('Complex query', {
        preferCheaper: true,
      });
      
      const expensiveCost = expensive.estimatedCost.total;
      const cheapCost = cheap.estimatedCost.total;
      
      expect(cheapCost).toBeLessThanOrEqual(expensiveCost);
    });

    it('should respect forceProvider option', async () => {
      const result = await router.routeQuery('Test query', {
        forceProvider: 'openai',
      });
      
      expect(result.provider).toBe('openai');
    });

    it('should respect forceModel option', async () => {
      const result = await router.routeQuery('Test query', {
        forceModel: 'gpt-4o',
      });
      
      expect(result.model).toBe('gpt-4o');
    });

    it('should enforce cost constraints', async () => {
      const result = await router.routeQuery('Very long complex query that would normally be expensive', {
        maxCostPerQuery: 0.001,
      });
      
      expect(result.estimatedCost.total).toBeLessThanOrEqual(0.001);
    });
  });

  describe('Usage Statistics', () => {
    it('should initialize with zero stats', () => {
      const stats = router.getStats();
      
      expect(stats.totalQueries).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageCost).toBe(0);
    });

    it('should record usage', () => {
      router.recordUsage('gpt-3.5-turbo', 'simple', 0.0001);
      
      const stats = router.getStats();
      
      expect(stats.totalQueries).toBe(1);
      expect(stats.totalCost).toBe(0.0001);
      expect(stats.averageCost).toBe(0.0001);
      expect(stats.modelBreakdown['gpt-3.5-turbo']).toBe(1);
      expect(stats.complexityBreakdown.simple).toBe(1);
    });

    it('should accumulate multiple recordings', () => {
      router.recordUsage('gpt-3.5-turbo', 'simple', 0.0001);
      router.recordUsage('gpt-4o', 'complex', 0.001);
      router.recordUsage('gpt-3.5-turbo', 'simple', 0.0001);
      
      const stats = router.getStats();
      
      expect(stats.totalQueries).toBe(3);
      expect(stats.totalCost).toBeCloseTo(0.0012, 4);
      expect(stats.modelBreakdown['gpt-3.5-turbo']).toBe(2);
      expect(stats.modelBreakdown['gpt-4o']).toBe(1);
      expect(stats.complexityBreakdown.simple).toBe(2);
      expect(stats.complexityBreakdown.complex).toBe(1);
    });

    it('should calculate correct average cost', () => {
      router.recordUsage('gpt-3.5-turbo', 'simple', 0.0001);
      router.recordUsage('gpt-4o', 'complex', 0.0003);
      
      const stats = router.getStats();
      
      expect(stats.averageCost).toBeCloseTo(0.0002, 6);
    });

    it('should reset stats', () => {
      router.recordUsage('gpt-3.5-turbo', 'simple', 0.0001);
      router.resetStats();
      
      const stats = router.getStats();
      
      expect(stats.totalQueries).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageCost).toBe(0);
    });
  });

  describe('Cost Comparison', () => {
    it('should compare costs across models', async () => {
      const comparison = await router.compareCosts('Test query');
      
      expect(comparison).toBeDefined();
      expect(comparison.length).toBeGreaterThan(0);
    });

    it('should return sorted cost comparison', async () => {
      const comparison = await router.compareCosts('Test query');
      
      expect(comparison[0]).toHaveProperty('model');
      expect(comparison[0]).toHaveProperty('cost');
      expect(comparison[0]).toHaveProperty('formatted');
    });
  });

  describe('Cost Calculator Access', () => {
    it('should provide access to cost calculator', () => {
      const calculator = router.getCostCalculator();
      
      expect(calculator).toBeDefined();
      expect(calculator.estimateTokens).toBeDefined();
      expect(calculator.estimateCost).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', async () => {
      const result = await router.routeQuery('');
      
      expect(result).toBeDefined();
      expect(result.complexity.level).toBe('simple');
    });

    it('should handle very long query', async () => {
      const longQuery = 'a'.repeat(10000);
      const result = await router.routeQuery(longQuery);
      
      expect(result).toBeDefined();
      expect(['moderate', 'complex', 'reasoning']).toContain(result.complexity.level);
    });

    it('should handle special characters', async () => {
      const result = await router.routeQuery('Test @#$% query with !@# symbols');
      
      expect(result).toBeDefined();
      expect(result.model).toBeDefined();
    });

    it('should handle multiple options simultaneously', async () => {
      const result = await router.routeQuery('Test query', {
        preferCheaper: true,
        forceProvider: 'openai',
        maxCostPerQuery: 0.001,
      });
      
      expect(result.provider).toBe('openai');
      expect(result.estimatedCost.total).toBeLessThanOrEqual(0.001);
    });
  });
});
