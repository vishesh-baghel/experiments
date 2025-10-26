import { describe, it, expect } from 'vitest';
import { ComplexityAnalyzer } from '../analyzer';

describe('ComplexityAnalyzer', () => {
  const analyzer = new ComplexityAnalyzer();

  describe('Simple Queries', () => {
    it('should classify short factual questions as simple', async () => {
      const result = await analyzer.analyze('What are your business hours?');
      
      expect(result.level).toBe('simple');
      expect(result.score).toBeLessThan(25);
      expect(result.factors.length).toBeLessThan(50);
    });

    it('should classify yes/no questions as simple', async () => {
      const result = await analyzer.analyze('Do you ship internationally?');
      
      expect(result.level).toBe('simple');
      expect(result.factors.questionType).toBe('simple');
    });

    it('should classify password reset as simple', async () => {
      const result = await analyzer.analyze('How do I reset my password?');
      
      expect(result.level).toBe('simple');
      expect(result.reasoning).toContain('Simple');
    });
  });

  describe('Moderate Queries', () => {
    it('should classify multi-part questions as moderate', async () => {
      const result = await analyzer.analyze(
        'I received a damaged product. What are my options for replacement or refund?'
      );
      
      expect(result.level).toBe('moderate');
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.score).toBeLessThan(50);
    });

    it('should classify comparison questions as moderate', async () => {
      const result = await analyzer.analyze(
        'Can you explain the differences between your premium and basic plans?'
      );
      
      expect(result.level).toBe('moderate');
      expect(result.factors.keywords).toContain('explain');
    });
  });

  describe('Complex Queries', () => {
    it('should classify multi-issue queries as complex', async () => {
      const result = await analyzer.analyze(
        "I've been charged twice for the same order, but only received one item. I also noticed my subscription was upgraded without my consent."
      );
      
      expect(result.level).toBe('complex');
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.factors.length).toBeGreaterThan(100);
    });

    it('should detect code and classify as complex', async () => {
      const result = await analyzer.analyze(
        'How do I implement this? `function example() { return true; }`'
      );
      
      expect(result.factors.hasCode).toBe(true);
      expect(result.level).toMatch(/complex|moderate/);
    });

    it('should classify technical questions as complex', async () => {
      const result = await analyzer.analyze(
        'I need help understanding how your API authentication works with OAuth2'
      );
      
      expect(result.level).toMatch(/complex|reasoning/);
      expect(result.factors.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Reasoning Queries', () => {
    it('should classify decision-making queries as reasoning', async () => {
      const result = await analyzer.analyze(
        "I'm deciding between canceling my subscription or downgrading. I've used 80% of quota this month. What should I do?"
      );
      
      expect(result.level).toBe('reasoning');
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.factors.questionType).toBe('reasoning');
    });

    it('should classify strategic questions as reasoning', async () => {
      const result = await analyzer.analyze(
        'Given my budget constraints and team size, recommend the best approach considering multiple factors'
      );
      
      expect(result.level).toBe('reasoning');
      expect(result.factors.keywords).toContain('recommend');
    });
  });

  describe('Code Detection', () => {
    it('should detect markdown code blocks', async () => {
      const result = await analyzer.analyze(
        'Here is my code:\n```javascript\nconst x = 1;\n```'
      );
      
      expect(result.factors.hasCode).toBe(true);
    });

    it('should detect inline code', async () => {
      const result = await analyzer.analyze(
        'Use `const variable = value` in your code'
      );
      
      expect(result.factors.hasCode).toBe(true);
    });

    it('should detect function definitions', async () => {
      const result = await analyzer.analyze(
        'Create a function myFunction() that returns data'
      );
      
      expect(result.factors.hasCode).toBe(true);
    });
  });

  describe('Math Detection', () => {
    it('should detect arithmetic expressions', async () => {
      const result = await analyzer.analyze('Calculate 5 + 3 * 2');
      
      expect(result.factors.hasMath).toBe(true);
    });

    it('should detect mathematical terms', async () => {
      const result = await analyzer.analyze(
        'Solve this equation and show the formula'
      );
      
      expect(result.factors.hasMath).toBe(true);
    });

    it('should detect math functions', async () => {
      const result = await analyzer.analyze('Calculate sin(45) and cos(45)');
      
      expect(result.factors.hasMath).toBe(true);
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract complexity keywords', async () => {
      const result = await analyzer.analyze(
        'Explain how to implement and optimize the architecture'
      );
      
      expect(result.factors.keywords).toContain('explain');
      expect(result.factors.keywords).toContain('implement');
      expect(result.factors.keywords).toContain('optimize');
      expect(result.factors.keywords).toContain('architecture');
    });

    it('should not extract keywords from simple queries', async () => {
      const result = await analyzer.analyze('What time is it?');
      
      expect(result.factors.keywords.length).toBe(0);
    });
  });

  describe('Sentence Complexity', () => {
    it('should calculate higher complexity for long sentences', async () => {
      const longQuery = 'This is a very long and complex sentence with multiple clauses, conjunctions, and various elements that make it harder to understand, because it contains many ideas, and therefore requires more processing.';
      const result = await analyzer.analyze(longQuery);
      
      expect(result.factors.sentenceComplexity).toBeGreaterThan(3);
    });

    it('should calculate lower complexity for short sentences', async () => {
      const result = await analyzer.analyze('Hello. How are you?');
      
      expect(result.factors.sentenceComplexity).toBeLessThan(3);
    });
  });

  describe('Reasoning Generation', () => {
    it('should provide reasoning for classification', async () => {
      const result = await analyzer.analyze('What are your hours?');
      
      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(20);
    });

    it('should mention key factors in reasoning', async () => {
      const result = await analyzer.analyze(
        'Explain how to implement OAuth2 authentication'
      );
      
      expect(result.reasoning.toLowerCase()).toMatch(/complex|explain|implement/);
    });
  });
});
