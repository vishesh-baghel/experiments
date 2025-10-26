/**
 * Model configurations with real pricing data
 * Prices are per 1M tokens (as of January 2025)
 */

import { ModelConfig } from '../types';

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    contextWindow: 16385,
    inputCostPerToken: 0.50 / 1_000_000, // $0.50 per 1M tokens
    outputCostPerToken: 1.50 / 1_000_000, // $1.50 per 1M tokens
    capabilities: ['chat', 'function-calling'],
    recommendedFor: ['simple', 'moderate'],
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    contextWindow: 128000,
    inputCostPerToken: 0.15 / 1_000_000, // $0.15 per 1M tokens
    outputCostPerToken: 0.60 / 1_000_000, // $0.60 per 1M tokens
    capabilities: ['chat', 'function-calling', 'vision'],
    recommendedFor: ['simple', 'moderate'],
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    contextWindow: 128000,
    inputCostPerToken: 2.50 / 1_000_000, // $2.50 per 1M tokens
    outputCostPerToken: 10.00 / 1_000_000, // $10.00 per 1M tokens
    capabilities: ['chat', 'function-calling', 'vision', 'reasoning'],
    recommendedFor: ['moderate', 'complex'],
  },
  'o1-mini': {
    provider: 'openai',
    model: 'o1-mini',
    displayName: 'o1-mini',
    contextWindow: 128000,
    inputCostPerToken: 3.00 / 1_000_000, // $3.00 per 1M tokens
    outputCostPerToken: 12.00 / 1_000_000, // $12.00 per 1M tokens
    capabilities: ['reasoning', 'problem-solving'],
    recommendedFor: ['complex', 'reasoning'],
  },

  // Anthropic Models
  'claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    contextWindow: 200000,
    inputCostPerToken: 0.25 / 1_000_000, // $0.25 per 1M tokens
    outputCostPerToken: 1.25 / 1_000_000, // $1.25 per 1M tokens
    capabilities: ['chat', 'long-context'],
    recommendedFor: ['simple', 'moderate'],
  },
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    inputCostPerToken: 3.00 / 1_000_000, // $3.00 per 1M tokens
    outputCostPerToken: 15.00 / 1_000_000, // $15.00 per 1M tokens
    capabilities: ['chat', 'reasoning', 'long-context', 'code'],
    recommendedFor: ['moderate', 'complex', 'reasoning'],
  },
  'claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    contextWindow: 200000,
    inputCostPerToken: 15.00 / 1_000_000, // $15.00 per 1M tokens
    outputCostPerToken: 75.00 / 1_000_000, // $75.00 per 1M tokens
    capabilities: ['chat', 'reasoning', 'long-context', 'advanced-analysis'],
    recommendedFor: ['complex', 'reasoning'],
  },
};

/**
 * Get model config by key
 */
export function getModelConfig(key: string): ModelConfig {
  const config = MODEL_CONFIGS[key];
  if (!config) {
    throw new Error(`Unknown model: ${key}`);
  }
  return config;
}

/**
 * Get all models for a complexity level
 */
export function getModelsForComplexity(
  level: string
): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter((config) =>
    config.recommendedFor.includes(level as any)
  );
}

/**
 * Get cheapest model for complexity level
 */
export function getCheapestModel(level: string): ModelConfig {
  const models = getModelsForComplexity(level);
  return models.reduce((cheapest, current) => {
    const cheapestCost =
      cheapest.inputCostPerToken + cheapest.outputCostPerToken;
    const currentCost =
      current.inputCostPerToken + current.outputCostPerToken;
    return currentCost < cheapestCost ? current : cheapest;
  });
}

/**
 * Get best model for complexity level (quality over cost)
 */
export function getBestModel(level: string): ModelConfig {
  const models = getModelsForComplexity(level);
  // For complex/reasoning, prefer Claude 3.5 Sonnet or o1-mini
  if (level === 'complex' || level === 'reasoning') {
    return (
      models.find((m) => m.model === 'claude-3-5-sonnet-20241022') ||
      models.find((m) => m.model === 'o1-mini') ||
      models[0]
    );
  }
  // For simple/moderate, prefer GPT-4o-mini or Claude Haiku
  return (
    models.find((m) => m.model === 'gpt-4o-mini') ||
    models.find((m) => m.model === 'claude-3-haiku-20240307') ||
    models[0]
  );
}
