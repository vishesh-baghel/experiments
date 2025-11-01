/**
 * Cost calculator for LLM usage
 * Now with accurate token counting using tiktoken
 */

import { ModelConfig } from '../types';
import { getModelConfig, MODEL_CONFIGS } from '../models/config';
import { tokenCounter, TokenCount } from '../utils/token-counter';

export class CostCalculator {
  /**
   * Count tokens accurately using tiktoken
   * Falls back to estimation for unsupported models
   */
  countTokens(text: string, modelName: string): TokenCount {
    return tokenCounter.countTokens(text, modelName);
  }

  /**
   * Estimate tokens (legacy method, kept for backward compatibility)
   * @deprecated Use countTokens() for accurate counting
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English
    // ±15% error - use countTokens() for ±2% accuracy
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost for a query using accurate token counting
   */
  estimateCost(
    query: string,
    model: ModelConfig,
    expectedOutputTokens: number = 500
  ): {
    input: number;
    output: number;
    total: number;
    inputTokens: number;
    outputTokens: number;
    accuracy: 'high' | 'low';
  } {
    // Use accurate token counting
    const tokenCount = this.countTokens(query, model.model);
    const inputTokens = tokenCount.tokens;
    const outputTokens = expectedOutputTokens;

    const inputCost = inputTokens * model.inputCostPerToken;
    const outputCost = outputTokens * model.outputCostPerToken;
    const totalCost = inputCost + outputCost;

    return {
      input: inputCost,
      output: outputCost,
      total: totalCost,
      inputTokens,
      outputTokens,
      accuracy: tokenCount.accuracy,
    };
  }

  /**
   * Calculate actual cost from token usage
   */
  calculateActualCost(
    inputTokens: number,
    outputTokens: number,
    model: ModelConfig
  ): number {
    const inputCost = inputTokens * model.inputCostPerToken;
    const outputCost = outputTokens * model.outputCostPerToken;
    return inputCost + outputCost;
  }

  /**
   * Calculate cost savings compared to expensive model
   */
  calculateSavings(
    actualCost: number,
    query: string,
    expensiveModelKey: string = 'claude-3-opus'
  ): {
    vsExpensive: number;
    percentage: number;
  } {
    const expensiveModel = getModelConfig(expensiveModelKey);
    
    const expensiveCost = this.estimateCost(query, expensiveModel).total;
    const savings = expensiveCost - actualCost;
    const percentage = (savings / expensiveCost) * 100;

    return {
      vsExpensive: savings,
      percentage: Math.max(0, percentage),
    };
  }

  /**
   * Format cost for display
   */
  formatCost(cost: number): string {
    if (cost < 0.0001) {
      return `$${(cost * 1000000).toFixed(2)}/M`;
    } else if (cost < 0.01) {
      return `$${cost.toFixed(6)}`;
    } else {
      return `$${cost.toFixed(4)}`;
    }
  }

  /**
   * Compare costs across models for a query
   */
  compareCosts(query: string): Array<{
    model: string;
    cost: number;
    formatted: string;
  }> {
    return (Object.entries(MODEL_CONFIGS) as Array<[string, ModelConfig]>).map(
      ([key, config]) => {
        const cost = this.estimateCost(query, config).total;
        return {
          model: config.displayName,
          cost,
          formatted: this.formatCost(cost),
        };
      }
    );
  }
}
