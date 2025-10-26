import { describe, it, expect } from 'vitest';
import { CostCalculator } from '../calculator';
import { getModelConfig } from '../../models/config';

describe('CostCalculator', () => {
  const calculator = new CostCalculator();

  describe('Token Estimation', () => {
    it('should estimate tokens for short text', () => {
      const tokens = calculator.estimateTokens('Hello world');
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate more tokens for longer text', () => {
      const shortText = 'Hi';
      const longText = 'This is a much longer piece of text that should result in more tokens being estimated';
      
      const shortTokens = calculator.estimateTokens(shortText);
      const longTokens = calculator.estimateTokens(longText);
      
      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    it('should use approximately 4 characters per token', () => {
      const text = 'a'.repeat(400); // 400 characters
      const tokens = calculator.estimateTokens(text);
      
      expect(tokens).toBeCloseTo(100, 10); // ~100 tokens with some tolerance
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate cost for GPT-3.5', () => {
      const model = getModelConfig('gpt-3.5-turbo');
      const query = 'What are your business hours?';
      
      const cost = calculator.estimateCost(query, model);
      
      expect(cost.input).toBeGreaterThan(0);
      expect(cost.output).toBeGreaterThan(0);
      expect(cost.total).toBe(cost.input + cost.output);
    });

    it('should estimate higher cost for GPT-4', () => {
      const gpt35 = getModelConfig('gpt-3.5-turbo');
      const gpt4 = getModelConfig('gpt-4o');
      const query = 'Explain quantum computing';
      
      const cost35 = calculator.estimateCost(query, gpt35);
      const cost4 = calculator.estimateCost(query, gpt4);
      
      expect(cost4.total).toBeGreaterThan(cost35.total);
    });

    it('should account for expected output tokens', () => {
      const model = getModelConfig('gpt-3.5-turbo');
      const query = 'Hi';
      
      const shortOutput = calculator.estimateCost(query, model, 100);
      const longOutput = calculator.estimateCost(query, model, 1000);
      
      expect(longOutput.total).toBeGreaterThan(shortOutput.total);
    });
  });

  describe('Actual Cost Calculation', () => {
    it('should calculate actual cost from token usage', () => {
      const model = getModelConfig('gpt-3.5-turbo');
      const inputTokens = 100;
      const outputTokens = 200;
      
      const cost = calculator.calculateActualCost(inputTokens, outputTokens, model);
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBe(
        inputTokens * model.inputCostPerToken + outputTokens * model.outputCostPerToken
      );
    });

    it('should calculate zero cost for zero tokens', () => {
      const model = getModelConfig('gpt-3.5-turbo');
      const cost = calculator.calculateActualCost(0, 0, model);
      
      expect(cost).toBe(0);
    });
  });

  describe('Cost Savings', () => {
    it('should calculate savings vs expensive model', () => {
      const query = 'Simple question';
      const cheapModel = getModelConfig('gpt-3.5-turbo');
      const actualCost = calculator.estimateCost(query, cheapModel).total;
      
      const savings = calculator.calculateSavings(actualCost, query);
      
      expect(savings.vsExpensive).toBeGreaterThan(0);
      expect(savings.percentage).toBeGreaterThan(0);
      expect(savings.percentage).toBeLessThanOrEqual(100);
    });

    it('should show zero savings for expensive model', () => {
      const query = 'Complex question';
      const expensiveModel = getModelConfig('claude-3-opus');
      const actualCost = calculator.estimateCost(query, expensiveModel).total;
      
      const savings = calculator.calculateSavings(actualCost, query, 'claude-3-opus');
      
      expect(savings.percentage).toBeCloseTo(0, 1);
    });
  });

  describe('Cost Formatting', () => {
    it('should format very small costs', () => {
      const formatted = calculator.formatCost(0.00001);
      
      expect(formatted).toContain('$');
      expect(formatted.length).toBeGreaterThan(1);
    });

    it('should format medium costs', () => {
      const formatted = calculator.formatCost(0.001);
      
      expect(formatted).toContain('$');
      expect(formatted).toContain('0.001');
    });

    it('should format large costs', () => {
      const formatted = calculator.formatCost(1.5);
      
      expect(formatted).toContain('$');
      expect(formatted).toContain('1.5');
    });
  });

  describe('Cost Comparison', () => {
    it('should compare costs across all models', () => {
      const query = 'Test query';
      const comparison = calculator.compareCosts(query);
      
      expect(comparison.length).toBeGreaterThan(0);
      expect(comparison[0]).toHaveProperty('model');
      expect(comparison[0]).toHaveProperty('cost');
      expect(comparison[0]).toHaveProperty('formatted');
    });

    it('should return different costs for different models', () => {
      const query = 'Test query';
      const comparison = calculator.compareCosts(query);
      
      const costs = comparison.map(c => c.cost);
      const uniqueCosts = new Set(costs);
      
      expect(uniqueCosts.size).toBeGreaterThan(1);
    });

    it('should include all configured models', () => {
      const query = 'Test query';
      const comparison = calculator.compareCosts(query);
      
      expect(comparison.length).toBeGreaterThanOrEqual(7); // 7 models configured
    });
  });
});
