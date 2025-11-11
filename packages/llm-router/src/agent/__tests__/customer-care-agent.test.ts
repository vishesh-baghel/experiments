import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerCareAgent } from '../customer-care-agent';

// Skip tests if required API keys are missing
const hasRequiredKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const testMode = hasRequiredKeys ? describe : describe.skip;

testMode('CustomerCareAgent', () => {
  let agent: CustomerCareAgent;

  beforeEach(() => {
    // Only use providers with API keys available
    agent = new CustomerCareAgent(undefined, {
      enabledProviders: ['openai', 'anthropic'],
    });
  });

  describe('Initialization', () => {
    it('should create agent with default system prompt', () => {
      expect(agent).toBeDefined();
      expect(agent.getStats).toBeDefined();
      expect(agent.handleQuery).toBeDefined();
    });

    it('should create agent with custom system prompt', () => {
      const customAgent = new CustomerCareAgent('Custom prompt', {
        enabledProviders: ['openai', 'anthropic'],
      });
      expect(customAgent).toBeDefined();
    });
  });

  describe('Query Handling - Simple Queries', () => {
    it('should handle simple factual question', async () => {
      const result = await agent.handleQuery('What are your business hours?', {
        preferCheaper: true,
      });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(10);
      expect(result.metadata.complexity).toBe('simple');
      expect(result.metadata.modelUsed).toBeDefined();
      expect(result.metadata.actualCost).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for API call

    it('should use cheaper model for simple queries', async () => {
      const result = await agent.handleQuery('Do you ship internationally?', {
        preferCheaper: true,
      });

      expect(['simple', 'moderate']).toContain(result.metadata.complexity);
      expect(['GPT-3.5 Turbo', 'GPT-4o Mini', 'Claude 3 Haiku']).toContain(
        result.metadata.modelUsed
      );
      expect(result.metadata.actualCost).toBeLessThan(0.001); // Should be very cheap
    }, 30000);
  });

  describe('Query Handling - Moderate Queries', () => {
    it('should handle moderate complexity question', async () => {
      const result = await agent.handleQuery(
        'Can you explain the differences between your premium and basic plans?',
        { preferCheaper: true }
      );

      expect(result).toBeDefined();
      expect(['simple', 'moderate', 'complex']).toContain(result.metadata.complexity);
      expect(result.answer.length).toBeGreaterThan(50);
      expect(result.metadata.tokensUsed.total).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Query Handling - Complex Queries', () => {
    it('should handle complex multi-part question', async () => {
      const result = await agent.handleQuery(
        'I received a damaged product and was charged twice. Can you help investigate this issue?',
        { preferCheaper: false }
      );

      expect(result).toBeDefined();
      expect(result.metadata.complexity).toMatch(/moderate|complex/);
      expect(result.answer.length).toBeGreaterThan(100);
      expect(result.metadata.actualCost).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Router Options', () => {
    it('should respect preferCheaper option', async () => {
      const cheapResult = await agent.handleQuery(
        'Explain your return policy',
        { preferCheaper: true }
      );
      
      const qualityResult = await agent.handleQuery(
        'Explain your return policy',
        { preferCheaper: false }
      );

      expect(cheapResult.metadata.actualCost).toBeLessThanOrEqual(
        qualityResult.metadata.actualCost
      );
    }, 60000);

    it('should respect forceProvider option', async () => {
      const result = await agent.handleQuery('Test query', {
        forceProvider: 'openai',
      });

      expect(result.metadata.provider).toBe('openai');
    }, 30000);

    it('should enforce cost constraints', async () => {
      const result = await agent.handleQuery('Simple question', {
        maxCostPerQuery: 0.001,
      });

      expect(result.metadata.estimatedCost).toBeLessThanOrEqual(0.001);
    }, 30000);
  });

  describe('Response Metadata', () => {
    it('should include all required metadata fields', async () => {
      const result = await agent.handleQuery('Test query');

      expect(result.metadata).toHaveProperty('modelUsed');
      expect(result.metadata).toHaveProperty('provider');
      expect(result.metadata).toHaveProperty('complexity');
      expect(result.metadata).toHaveProperty('actualCost');
      expect(result.metadata).toHaveProperty('estimatedCost');
      expect(result.metadata).toHaveProperty('tokensUsed');
      expect(result.metadata).toHaveProperty('latency');
      expect(result.metadata).toHaveProperty('costSavings');
    }, 30000);

    it('should track token usage correctly', async () => {
      const result = await agent.handleQuery('What is 2+2?');

      expect(result.metadata.tokensUsed.input).toBeGreaterThan(0);
      expect(result.metadata.tokensUsed.output).toBeGreaterThan(0);
      expect(result.metadata.tokensUsed.total).toBe(
        result.metadata.tokensUsed.input + result.metadata.tokensUsed.output
      );
    }, 30000);

    it('should calculate cost savings', async () => {
      const result = await agent.handleQuery('Simple test', {
        preferCheaper: true,
      });

      expect(result.metadata.costSavings).toBeDefined();
      expect(result.metadata.costSavings?.percentage).toBeGreaterThanOrEqual(0);
      expect(result.metadata.costSavings?.percentage).toBeLessThanOrEqual(100);
    }, 30000);

    it('should measure latency', async () => {
      const result = await agent.handleQuery('Quick test');

      expect(result.metadata.latency).toBeGreaterThan(0);
      expect(result.metadata.latency).toBeLessThan(60000); // Should be under 60 seconds
    }, 30000);
  });

  describe('Statistics Tracking', () => {
    it('should track usage statistics', async () => {
      const initialStats = agent.getStats();
      expect(initialStats.totalQueries).toBe(0);

      await agent.handleQuery('Test 1');
      await agent.handleQuery('Test 2');

      const stats = agent.getStats();
      expect(stats.totalQueries).toBe(2);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.averageCost).toBeGreaterThan(0);
    }, 60000);

    it('should track model breakdown', async () => {
      await agent.handleQuery('Simple query', { preferCheaper: true });

      const stats = agent.getStats();
      expect(Object.keys(stats.modelBreakdown).length).toBeGreaterThan(0);
    }, 30000);

    it('should track complexity breakdown', async () => {
      await agent.handleQuery('What time is it?'); // Simple
      await agent.handleQuery('Explain quantum physics'); // Complex

      const stats = agent.getStats();
      expect(stats.complexityBreakdown.simple).toBeGreaterThan(0);
    }, 60000);

    it('should reset statistics', async () => {
      await agent.handleQuery('Test');
      agent.resetStats();

      const stats = agent.getStats();
      expect(stats.totalQueries).toBe(0);
      expect(stats.totalCost).toBe(0);
    }, 30000);
  });

  describe('Cost Comparison', () => {
    it('should compare costs across models', async () => {
      const comparison = await agent.compareCosts('Test query');

      expect(comparison).toBeDefined();
      expect(comparison.length).toBeGreaterThan(0);
      expect(comparison[0]).toHaveProperty('model');
      expect(comparison[0]).toHaveProperty('cost');
      expect(comparison[0]).toHaveProperty('formatted');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty query gracefully', async () => {
      const result = await agent.handleQuery('');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    }, 30000);

    it('should handle very long query', async () => {
      const longQuery = 'Please help me with this issue. ' + 'a'.repeat(1000);
      const result = await agent.handleQuery(longQuery);

      expect(result).toBeDefined();
      expect(result.metadata.complexity).toMatch(/moderate|complex|reasoning/);
    }, 30000);

    it('should handle special characters', async () => {
      const result = await agent.handleQuery('Test @#$% query with !@# symbols');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    }, 30000);
  });

  describe('Different Providers', () => {
    it('should work with OpenAI provider', async () => {
      const result = await agent.handleQuery('Test OpenAI', {
        forceProvider: 'openai',
      });

      expect(result.metadata.provider).toBe('openai');
      expect(result.answer).toBeDefined();
    }, 30000);

    it('should work with Anthropic provider', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping Anthropic test - no API key');
        return;
      }

      try {
        const result = await agent.handleQuery('Test Anthropic', {
          forceProvider: 'anthropic',
        });

        expect(result.metadata.provider).toBe('anthropic');
        expect(result.answer).toBeDefined();
      } catch (error) {
        // Skip if API key is invalid
        if (error instanceof Error && error.message.includes('invalid x-api-key')) {
          console.log('Skipping Anthropic test - invalid API key');
          return;
        }
        throw error;
      }
    }, 30000);
  });

  describe('Real-World Scenarios', () => {
    it('should handle password reset request', async () => {
      const result = await agent.handleQuery('How do I reset my password?');

      expect(result.answer.toLowerCase()).toMatch(/password|reset|account|email/);
      expect(result.metadata.complexity).toBe('simple');
    }, 30000);

    it('should handle product return inquiry', async () => {
      const result = await agent.handleQuery(
        'I want to return a damaged product I received yesterday'
      );

      expect(result.answer.toLowerCase()).toMatch(/return|refund|exchange|policy/);
      expect(result.metadata.complexity).toMatch(/simple|moderate/);
    }, 30000);

    it('should handle technical support question', async () => {
      const result = await agent.handleQuery(
        'My API integration is failing with a 401 error. How do I fix authentication?'
      );

      expect(result.answer.toLowerCase()).toMatch(/api|auth|error|token|key/);
      expect(result.metadata.complexity).toMatch(/moderate|complex/);
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete simple query in reasonable time', async () => {
      const startTime = Date.now();
      await agent.handleQuery('Quick test');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // Should complete in under 15 seconds
    }, 30000);

    it('should handle multiple sequential queries', async () => {
      const queries = [
        'Test 1',
        'Test 2',
        'Test 3',
      ];

      for (const query of queries) {
        const result = await agent.handleQuery(query);
        expect(result).toBeDefined();
      }

      const stats = agent.getStats();
      expect(stats.totalQueries).toBe(3);
    }, 90000);
  });
});
