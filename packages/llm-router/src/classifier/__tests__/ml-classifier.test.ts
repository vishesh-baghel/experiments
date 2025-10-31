import { describe, it, expect, beforeAll } from 'vitest';
import { MLClassifier } from '../ml-classifier';
import { trainingData } from '../training-data';

describe('MLClassifier', () => {
  let classifier: MLClassifier;

  beforeAll(async () => {
    classifier = new MLClassifier();
    
    // Use a subset of training data for faster tests
    const subset = [
      ...trainingData.filter((e) => e.complexity === 'simple').slice(0, 10),
      ...trainingData.filter((e) => e.complexity === 'moderate').slice(0, 10),
      ...trainingData.filter((e) => e.complexity === 'complex').slice(0, 10),
      ...trainingData.filter((e) => e.complexity === 'reasoning').slice(0, 10),
    ];
    
    await classifier.loadTrainingData(subset);
  }, 120000); // 2 minute timeout for embedding generation

  describe('training', () => {
    it('should be trained after loading data', () => {
      expect(classifier.isTrained()).toBe(true);
    });

    it('should have correct training stats', () => {
      const stats = classifier.getTrainingStats();
      expect(stats.totalExamples).toBe(40);
      expect(stats.examplesByLevel.simple).toBe(10);
      expect(stats.examplesByLevel.moderate).toBe(10);
      expect(stats.examplesByLevel.complex).toBe(10);
      expect(stats.examplesByLevel.reasoning).toBe(10);
    });
  });

  describe('classification', () => {
    it('should classify simple queries correctly', async () => {
      const result = await classifier.classify('What are your hours?');
      expect(result.level).toBe('simple');
      expect(result.confidence).toBeGreaterThan(0.7);
    }, 10000);

    it('should classify moderate queries correctly', async () => {
      const result = await classifier.classify(
        'Can you explain the difference between your plans?'
      );
      expect(result.level).toBe('moderate');
      expect(result.confidence).toBeGreaterThan(0.7);
    }, 10000);

    it('should classify complex queries correctly', async () => {
      const result = await classifier.classify(
        'I was charged twice but only received one item and cannot access my account'
      );
      expect(result.level).toBe('complex');
      expect(result.confidence).toBeGreaterThan(0.7);
    }, 10000);

    it('should classify reasoning queries correctly', async () => {
      const result = await classifier.classify(
        'What is the best plan for a growing startup?'
      );
      expect(result.level).toBe('reasoning');
      expect(result.confidence).toBeGreaterThan(0.7);
    }, 10000);

    it('should provide confidence scores for all levels', async () => {
      const result = await classifier.classify('What are your hours?');
      expect(result.scores.simple).toBeDefined();
      expect(result.scores.moderate).toBeDefined();
      expect(result.scores.complex).toBeDefined();
      expect(result.scores.reasoning).toBeDefined();
    }, 10000);

    it('should provide reasoning for classification', async () => {
      const result = await classifier.classify('What are your hours?');
      expect(result.reasoning).toContain('confidence');
      expect(result.reasoning).toContain(result.level);
    }, 10000);

    it('should throw error if not trained', async () => {
      const untrainedClassifier = new MLClassifier();
      await expect(
        untrainedClassifier.classify('test')
      ).rejects.toThrow('not trained');
    });
  });

  describe('evaluation', () => {
    it('should evaluate accuracy on test data', async () => {
      const testData = [
        ...trainingData.filter((e) => e.complexity === 'simple').slice(10, 15),
        ...trainingData.filter((e) => e.complexity === 'moderate').slice(10, 15),
      ];

      const results = await classifier.evaluateAccuracy(testData);
      
      expect(results.total).toBe(10);
      expect(results.correct).toBeGreaterThan(0);
      expect(results.accuracy).toBeGreaterThan(0);
      expect(results.accuracy).toBeLessThanOrEqual(1);
    }, 60000);

    it('should provide confusion matrix', async () => {
      const testData = [
        ...trainingData.filter((e) => e.complexity === 'simple').slice(10, 12),
        ...trainingData.filter((e) => e.complexity === 'moderate').slice(10, 12),
      ];

      const results = await classifier.evaluateAccuracy(testData);
      
      expect(results.confusionMatrix).toBeDefined();
      expect(results.confusionMatrix.simple).toBeDefined();
      expect(results.confusionMatrix.moderate).toBeDefined();
    }, 30000);
  });
});
