import { RouterOptions, RoutingDecision, UsageStats, Provider } from '../types';
import { ComplexityAnalyzer } from './analyzer';
import { ModelSelector } from './selector';
import { CostCalculator } from './calculator';
import { SemanticCache } from '../cache/semantic-cache';
import { MLClassifier } from '../classifier/ml-classifier';

/**
 * LLM Router - Main orchestrator for intelligent model selection
 * Now with semantic caching and ML-based classification
 */
export class LLMRouter {
  private analyzer: ComplexityAnalyzer;
  private selector: ModelSelector;
  private calculator: CostCalculator;
  private cache: SemanticCache;
  private mlClassifier: MLClassifier | null = null;
  private stats: UsageStats;
  private useMLClassifier: boolean = false;

  constructor(options: {
    useCache?: boolean;
    useMLClassifier?: boolean;
    cacheOptions?: { similarityThreshold?: number; maxEntries?: number };
    enabledProviders?: Provider[];
  } = {}) {
    this.analyzer = new ComplexityAnalyzer(); 
    this.selector = new ModelSelector(options.enabledProviders);
    this.calculator = new CostCalculator();
    this.cache = new SemanticCache(options.cacheOptions);
    this.useMLClassifier = options.useMLClassifier ?? false;
    
    if (this.useMLClassifier) {
      this.mlClassifier = new MLClassifier();
      // Auto-load precomputed embeddings
      this.loadPrecomputedEmbeddings();
    }
    
    this.stats = {
      totalQueries: 0,
      totalCost: 0,
      averageCost: 0,
      modelBreakdown: {},
      complexityBreakdown: {
        simple: 0,
        moderate: 0,
        complex: 0,
        reasoning: 0,
      },
    };
  }

  /**
   * Auto-load precomputed embeddings for ML classifier
   */
  private async loadPrecomputedEmbeddings(): Promise<void> {
    try {
      // Import precomputed embeddings
      const precomputedData = await import('../classifier/precomputed-embeddings.json');
      await this.mlClassifier!.loadTrainingData(precomputedData.embeddings as any);
      console.log('[Router] ML Classifier trained with precomputed embeddings');
    } catch (error) {
      console.warn('[Router] Failed to load precomputed embeddings, falling back to heuristics:', error);
      this.useMLClassifier = false;
    }
  }

  /**
   * Initialize ML classifier with training data
   */
  async initializeMLClassifier(trainingData: any[]): Promise<void> {
    if (!this.mlClassifier) {
      this.mlClassifier = new MLClassifier();
      this.useMLClassifier = true;
    }
    await this.mlClassifier.loadTrainingData(trainingData);
  }

  /**
   * Route a query to the optimal model
   * This is the main entry point for the router
   * Now with semantic caching and optional ML classification
   * 
   * Note: Cache checking should be done at application layer (agent/API)
   * since cache stores full responses, not just routing decisions
   */
  async routeQuery(
    query: string,
    options: RouterOptions = {}
  ): Promise<RoutingDecision & { cached?: boolean }> {
    // Step 1: Analyze query complexity (use ML if available, otherwise heuristics)
    let complexity;
    if (this.useMLClassifier && this.mlClassifier?.isTrained()) {
      const mlResult = await this.mlClassifier.classify(query);
      complexity = {
        level: mlResult.level,
        score: Math.round(mlResult.confidence * 100),
        reasoning: mlResult.reasoning,
        factors: { mlConfidence: mlResult.confidence, scores: mlResult.scores },
      };
    } else {
      complexity = await this.analyzer.analyze(query);
    }

    // Step 2: Select optimal model
    const selectedModel = this.selector.select(complexity.level, options);

    // Step 3: Estimate cost
    const estimatedCost = this.calculator.estimateCost(query, selectedModel);

    // Step 4: Check cost constraints
    if (
      options.maxCostPerQuery &&
      estimatedCost.total > options.maxCostPerQuery
    ) {
      // Try to find a cheaper alternative
      const cheaperModel = this.selector.select(complexity.level, {
        ...options,
        preferCheaper: true,
      });
      const cheaperCost = this.calculator.estimateCost(
        query,
        cheaperModel
      );

      if (cheaperCost.total <= options.maxCostPerQuery) {
        return this.createRoutingDecision(
          query,
          cheaperModel,
          complexity,
          cheaperCost,
          'Cost constraint enforced - selected cheaper model'
        );
      }
    }

    // Step 5: Generate routing decision with reasoning
    const reasoning = this.generateRoutingReasoning(
      complexity,
      selectedModel,
      options
    );

    return this.createRoutingDecision(
      query,
      selectedModel,
      complexity,
      estimatedCost,
      reasoning
    );
  }

  /**
   * Create routing decision object
   */
  private createRoutingDecision(
    query: string,
    model: any,
    complexity: any,
    estimatedCost: any,
    reasoning: string
  ): RoutingDecision {
    return {
      provider: model.provider,
      model: model.model,
      displayName: model.displayName,
      complexity,
      estimatedCost,
      reasoning,
    };
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateRoutingReasoning(
    complexity: any,
    model: any,
    options: RouterOptions
  ): string {
    const reasons: string[] = [];

    // Complexity reasoning
    reasons.push(
      `Query classified as '${complexity.level}' (score: ${complexity.score}/100)`
    );

    // Model selection reasoning
    if (options.preferCheaper) {
      reasons.push(
        `Selected ${model.displayName} for cost optimization`
      );
    } else {
      reasons.push(
        `Selected ${model.displayName} for optimal quality at this complexity level`
      );
    }

    // Additional factors
    if (options.forceProvider) {
      reasons.push(`Provider preference: ${options.forceProvider}`);
    }
    if (options.maxCostPerQuery) {
      reasons.push(
        `Cost constraint: max $${options.maxCostPerQuery.toFixed(6)} per query`
      );
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Record actual usage for stats
   */
  recordUsage(
    model: string,
    complexity: string,
    actualCost: number
  ): void {
    this.stats.totalQueries++;
    this.stats.totalCost += actualCost;
    this.stats.averageCost = this.stats.totalCost / this.stats.totalQueries;

    // Update model breakdown
    this.stats.modelBreakdown[model] =
      (this.stats.modelBreakdown[model] || 0) + 1;

    // Update complexity breakdown
    if (complexity in this.stats.complexityBreakdown) {
      this.stats.complexityBreakdown[
        complexity as keyof typeof this.stats.complexityBreakdown
      ]++;
    }
  }

  /**
   * Get usage statistics
   */
  getStats(): UsageStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      totalCost: 0,
      averageCost: 0,
      modelBreakdown: {},
      complexityBreakdown: {
        simple: 0,
        moderate: 0,
        complex: 0,
        reasoning: 0,
      },
    };
  }

  /**
   * Get cost calculator for external use
   */
  getCostCalculator(): CostCalculator {
    return this.calculator;
  }

  /**
   * Compare costs across all models for a query
   */
  async compareCosts(query: string) {
    return this.calculator.compareCosts(query);
  }

  /**
   * Get semantic cache instance
   */
  getCache(): SemanticCache {
    return this.cache;
  }

  /**
   * Get ML classifier instance
   */
  getMLClassifier(): MLClassifier | null {
    return this.mlClassifier;
  }

  /**
   * Check if ML classifier is enabled and trained
   */
  isMLClassifierReady(): boolean {
    return this.useMLClassifier && this.mlClassifier?.isTrained() === true;
  }
}

// Export components for advanced usage
export { ComplexityAnalyzer } from './analyzer';
export { ModelSelector } from './selector';
export { CostCalculator } from './calculator';
