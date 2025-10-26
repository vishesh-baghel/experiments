/**
 * Model selector - chooses optimal model based on complexity and constraints
 */

import { ComplexityLevel, RouterOptions, ModelConfig } from '../types';
import {
  getModelsForComplexity,
  getCheapestModel,
  getBestModel,
  getModelConfig,
} from '../models/config';

export class ModelSelector {
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
   */
  private selectBestModel(
    models: ModelConfig[],
    complexity: ComplexityLevel
  ): ModelConfig {
    // For reasoning/complex tasks, prioritize advanced models
    if (complexity === 'reasoning' || complexity === 'complex') {
      // Prefer: Claude 3.5 Sonnet, o1-mini, GPT-4o, Claude Opus
      const priorities = [
        'claude-3-5-sonnet-20241022',
        'o1-mini',
        'gpt-4o',
        'claude-3-opus-20240229',
      ];

      for (const modelId of priorities) {
        const found = models.find((m) => m.model === modelId);
        if (found) return found;
      }
    }

    // For simple/moderate, prefer fast and efficient models
    // Prefer: GPT-4o-mini, Claude Haiku, GPT-3.5
    const priorities = [
      'gpt-4o-mini',
      'claude-3-haiku-20240307',
      'gpt-3.5-turbo',
    ];

    for (const modelId of priorities) {
      const found = models.find((m) => m.model === modelId);
      if (found) return found;
    }

    // Fallback to first available
    return models[0];
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
