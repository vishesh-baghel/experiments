import { describe, it, expect } from 'vitest';
import { ModelSelector } from '../selector';

describe('ModelSelector', () => {
  const selector = new ModelSelector();

  describe('Basic Selection', () => {
    it('should select model for simple complexity', () => {
      const model = selector.select('simple');
      
      expect(model).toBeDefined();
      expect(model.recommendedFor).toContain('simple');
    });

    it('should select model for moderate complexity', () => {
      const model = selector.select('moderate');
      
      expect(model).toBeDefined();
      expect(model.recommendedFor).toContain('moderate');
    });

    it('should select model for complex complexity', () => {
      const model = selector.select('complex');
      
      expect(model).toBeDefined();
      expect(model.recommendedFor).toContain('complex');
    });

    it('should select model for reasoning complexity', () => {
      const model = selector.select('reasoning');
      
      expect(model).toBeDefined();
      expect(model.recommendedFor).toContain('reasoning');
    });
  });

  describe('Prefer Cheaper Option', () => {
    it('should select cheaper model when preferCheaper is true', () => {
      const defaultModel = selector.select('complex');
      const cheapModel = selector.select('complex', { preferCheaper: true });
      
      const defaultCost = defaultModel.inputCostPerToken + defaultModel.outputCostPerToken;
      const cheapCost = cheapModel.inputCostPerToken + cheapModel.outputCostPerToken;
      
      expect(cheapCost).toBeLessThanOrEqual(defaultCost);
    });

    it('should select quality model when preferCheaper is false', () => {
      const model = selector.select('reasoning', { preferCheaper: false });
      
      expect(model).toBeDefined();
      expect(['claude-3-5-sonnet-20241022', 'o1-mini', 'claude-3-opus-20240229']).toContain(model.model);
    });
  });

  describe('Provider Filtering', () => {
    it('should filter by OpenAI provider', () => {
      const model = selector.select('simple', { forceProvider: 'openai' });
      
      expect(model.provider).toBe('openai');
    });

    it('should filter by Anthropic provider', () => {
      const model = selector.select('simple', { forceProvider: 'anthropic' });
      
      expect(model.provider).toBe('anthropic');
    });

    it('should respect provider preference for all complexity levels', () => {
      const levels: Array<'simple' | 'moderate' | 'complex' | 'reasoning'> = [
        'simple',
        'moderate',
        'complex',
        'reasoning',
      ];
      
      levels.forEach(level => {
        const model = selector.select(level, { forceProvider: 'openai' });
        expect(model.provider).toBe('openai');
      });
    });
  });

  describe('Force Specific Model', () => {
    it('should use forced model when specified', () => {
      const model = selector.select('simple', { forceModel: 'gpt-4o' });
      
      expect(model.model).toBe('gpt-4o');
    });

    it('should override complexity recommendation with forced model', () => {
      const model = selector.select('simple', { forceModel: 'claude-3-opus' });
      
      expect(model.model).toBe('claude-3-opus-20240229');
    });
  });

  describe('Fallback Selection', () => {
    it('should provide OpenAI fallback for Anthropic', () => {
      const anthropicModel = selector.select('simple', { forceProvider: 'anthropic' });
      const fallback = selector.getFallback(anthropicModel);
      
      expect(fallback.provider).toBe('openai');
    });

    it('should provide Anthropic fallback for OpenAI', () => {
      const openaiModel = selector.select('simple', { forceProvider: 'openai' });
      const fallback = selector.getFallback(openaiModel);
      
      expect(fallback.provider).toBe('anthropic');
    });
  });

  describe('Cost Constraint Check', () => {
    it('should pass when cost is within constraint', () => {
      const model = selector.select('simple');
      const estimatedCost = 0.0001;
      const maxCost = 0.001;
      
      const meets = selector.meetsCostConstraint(model, estimatedCost, maxCost);
      
      expect(meets).toBe(true);
    });

    it('should fail when cost exceeds constraint', () => {
      const model = selector.select('complex');
      const estimatedCost = 0.01;
      const maxCost = 0.001;
      
      const meets = selector.meetsCostConstraint(model, estimatedCost, maxCost);
      
      expect(meets).toBe(false);
    });

    it('should pass when no constraint is set', () => {
      const model = selector.select('complex');
      const estimatedCost = 100;
      
      const meets = selector.meetsCostConstraint(model, estimatedCost);
      
      expect(meets).toBe(true);
    });
  });

  describe('Model Quality Selection', () => {
    it('should prefer high-quality models for simple tasks', () => {
      const model = selector.select('simple', { preferCheaper: false });
      
      // With dynamic scoring, Gemini Flash may win due to 1M context window
      expect([
        'gpt-4o-mini',
        'claude-3-haiku-20240307',
        'gpt-3.5-turbo',
        'gemini-1.5-flash',
        'groq-llama-3.1-8b',
        'together-llama-3.1-8b'
      ]).toContain(model.model);
    });

    it('should prefer advanced models for reasoning', () => {
      const model = selector.select('reasoning', { preferCheaper: false });
      
      expect(['claude-3-5-sonnet-20241022', 'o1-mini', 'claude-3-opus-20240229']).toContain(model.model);
    });
  });
});
