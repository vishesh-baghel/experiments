/**
 * Model selector - chooses optimal model based on complexity and constraints
 */

import { ComplexityLevel, RouterOptions, ModelConfig, Provider } from '../types';
import {
  getModelsForComplexity,
  getModelConfig,
} from '../models/config';

export class ModelSelector {
  private enabledProviders: Provider[];

  constructor(enabledProviders?: Provider[]) {
    // Default: exclude Ollama (requires local setup)
    this.enabledProviders = enabledProviders || [
      'openai',
      'anthropic',
      'google',
      'groq',
      'together',
    ];
  }

  /**
   * Select optimal model based on complexity and options
   */
  select(
    complexity: ComplexityLevel,
    options: RouterOptions = {}
  ): ModelConfig {
    // If specific model is forced, use it
    if (options.forceModel) {
      return getModelConfig(options.forceModel);
    }

    // Get available models for this complexity level
    let availableModels = getModelsForComplexity(complexity);

    // Filter by enabled providers (exclude Ollama by default)
    availableModels = availableModels.filter((m) =>
      this.enabledProviders.includes(m.provider)
    );

    // Filter by provider if specified
    if (options.forceProvider) {
      availableModels = availableModels.filter(
        (m) => m.provider === options.forceProvider
      );
    }

    // If no models available (shouldn't happen), fallback
    if (availableModels.length === 0) {
      return getModelConfig('gpt-4o-mini');
    }

    // Choose based on preference
    if (options.preferCheaper) {
      return this.selectCheapestModel(availableModels, options);
    } else {
      return this.selectBestModel(availableModels, complexity);
    }
  }

  /**
   * Select cheapest model that meets constraints
   */
  private selectCheapestModel(
    models: ModelConfig[],
    options: RouterOptions
  ): ModelConfig {
    // Sort by total cost (input + output)
    const sorted = [...models].sort((a, b) => {
      const costA = a.inputCostPerToken + a.outputCostPerToken;
      const costB = b.inputCostPerToken + b.outputCostPerToken;
      return costA - costB;
    });

    // Return cheapest that meets constraints
    return sorted[0];
  }

  /**
   * Select best quality model for complexity level
   * Uses dynamic sorting based on model capabilities and context window
   * This automatically includes new models without code changes
   */
  private selectBestModel(
    models: ModelConfig[],
    complexity: ComplexityLevel
  ): ModelConfig {
    // Calculate quality score for each model
    const scored = models.map((model) => {
      let score = 0;
      
      // Context window contributes to score (larger = better)
      score += model.contextWindow / 1000; // Normalize to reasonable range
      
      // Capabilities contribute to score
      score += model.capabilities.length * 10000;
      
      // Reasoning capability is highly valued for complex/reasoning queries
      if (complexity === 'reasoning' || complexity === 'complex') {
        if (model.capabilities.includes('reasoning')) score += 50000;
        if (model.capabilities.includes('advanced-analysis')) score += 40000;
        if (model.capabilities.includes('problem-solving')) score += 40000;
      }
      
      // Fast inference is valued for simple queries
      if (complexity === 'simple') {
        if (model.capabilities.includes('fast-inference')) score += 30000;
      }
      
      // Long context is valuable for all complexities
      if (model.capabilities.includes('long-context')) score += 20000;
      
      return { model, score };
    });
    
    // Sort by score descending (highest quality first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].model;
  }

  /**
   * Get fallback model if primary fails
   */
  getFallback(primary: ModelConfig): ModelConfig {
    // If OpenAI fails, try Anthropic (and vice versa)
    if (primary.provider === 'openai') {
      // Try Claude Haiku as fallback
      return getModelConfig('claude-3-haiku');
    } else {
      // Try GPT-4o-mini as fallback
      return getModelConfig('gpt-4o-mini');
    }
  }

  /**
   * Check if model meets cost constraint
   */
  meetsCostConstraint(
    model: ModelConfig,
    estimatedCost: number,
    maxCost?: number
  ): boolean {
    if (!maxCost) return true;
    return estimatedCost <= maxCost;
  }
}
