/**
 * Cost calculator for LLM usage
 */

import { ModelConfig } from '../types';
import { getModelConfig, MODEL_CONFIGS } from '../models/config';

export class CostCalculator {
  /**
   * Estimate tokens for a query (rough approximation)
   * Real tokenization would use tiktoken or equivalent
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English
    // This is a simplification. Production code should use proper tokenizers
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost for a query
   */
  estimateCost(
    query: string,
    model: ModelConfig,
    expectedOutputTokens: number = 500
  ): {
    input: number;
    output: number;
    total: number;
  } {
    const inputTokens = this.estimateTokens(query);
    const outputTokens = expectedOutputTokens;

    const inputCost = inputTokens * model.inputCostPerToken;
    const outputCost = outputTokens * model.outputCostPerToken;
    const totalCost = inputCost + outputCost;

    return {
      input: inputCost,
      output: outputCost,
      total: totalCost,
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
