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

  // Google Gemini Models
  'gemini-1.5-flash': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    contextWindow: 1000000,
    inputCostPerToken: 0.075 / 1_000_000, // $0.075 per 1M tokens (CHEAPEST)
    outputCostPerToken: 0.30 / 1_000_000, // $0.30 per 1M tokens
    capabilities: ['chat', 'vision', 'long-context'],
    recommendedFor: ['simple', 'moderate'],
  },
  'gemini-1.5-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: 2000000,
    inputCostPerToken: 1.25 / 1_000_000, // $1.25 per 1M tokens
    outputCostPerToken: 5.00 / 1_000_000, // $5.00 per 1M tokens
    capabilities: ['chat', 'vision', 'reasoning', 'long-context'],
    recommendedFor: ['moderate', 'complex'],
  },

  // Groq Models (Fast Inference)
  'groq-llama-3.1-8b': {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    displayName: 'Llama 3.1 8B (Groq)',
    contextWindow: 128000,
    inputCostPerToken: 0.05 / 1_000_000, // $0.05 per 1M tokens (VERY CHEAP)
    outputCostPerToken: 0.08 / 1_000_000, // $0.08 per 1M tokens
    capabilities: ['chat', 'fast-inference'],
    recommendedFor: ['simple'],
  },
  'groq-llama-3.1-70b': {
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    displayName: 'Llama 3.1 70B (Groq)',
    contextWindow: 128000,
    inputCostPerToken: 0.59 / 1_000_000, // $0.59 per 1M tokens
    outputCostPerToken: 0.79 / 1_000_000, // $0.79 per 1M tokens
    capabilities: ['chat', 'reasoning', 'fast-inference'],
    recommendedFor: ['moderate', 'complex'],
  },

  // Together AI Models (Open Source)
  'together-llama-3.1-8b': {
    provider: 'together',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    displayName: 'Llama 3.1 8B (Together)',
    contextWindow: 128000,
    inputCostPerToken: 0.18 / 1_000_000, // $0.18 per 1M tokens
    outputCostPerToken: 0.18 / 1_000_000, // $0.18 per 1M tokens
    capabilities: ['chat', 'open-source'],
    recommendedFor: ['simple', 'moderate'],
  },
  'together-qwen-2.5-72b': {
    provider: 'together',
    model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    displayName: 'Qwen 2.5 72B (Together)',
    contextWindow: 32768,
    inputCostPerToken: 0.88 / 1_000_000, // $0.88 per 1M tokens
    outputCostPerToken: 0.88 / 1_000_000, // $0.88 per 1M tokens
    capabilities: ['chat', 'reasoning', 'open-source'],
    recommendedFor: ['moderate', 'complex'],
  },

  // Ollama Models (Local, Free)
  'ollama-llama-3.1-8b': {
    provider: 'ollama',
    model: 'llama3.1:8b',
    displayName: 'Llama 3.1 8B (Local)',
    contextWindow: 128000,
    inputCostPerToken: 0, // FREE (local inference)
    outputCostPerToken: 0, // FREE (local inference)
    capabilities: ['chat', 'local', 'privacy'],
    recommendedFor: ['simple', 'moderate'],
  },
  'ollama-qwen-2.5-14b': {
    provider: 'ollama',
    model: 'qwen2.5:14b',
    displayName: 'Qwen 2.5 14B (Local)',
    contextWindow: 32768,
    inputCostPerToken: 0, // FREE (local inference)
    outputCostPerToken: 0, // FREE (local inference)
    capabilities: ['chat', 'reasoning', 'local', 'privacy'],
    recommendedFor: ['moderate', 'complex'],
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
 * Now includes Gemini Flash (cheapest), Groq, Together, and Ollama (free)
 */
export function getCheapestModel(level: string): ModelConfig {
  const models = getModelsForComplexity(level);
  
  // Prefer Ollama (free) if available for simple/moderate
  if (level === 'simple' || level === 'moderate') {
    const ollamaModel = models.find((m) => m.provider === 'ollama');
    if (ollamaModel) return ollamaModel;
  }
  
  // Otherwise find cheapest by cost
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
