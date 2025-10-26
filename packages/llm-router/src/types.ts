/**
 * Core type definitions for the LLM Router
 */

export type Provider = 'openai' | 'anthropic';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'reasoning';

export interface ModelConfig {
  provider: Provider;
  model: string;
  displayName: string;
  contextWindow: number;
  inputCostPerToken: number;
  outputCostPerToken: number;
  capabilities: string[];
  recommendedFor: ComplexityLevel[];
}

export interface ComplexityAnalysis {
  level: ComplexityLevel;
  score: number;
  factors: {
    length: number;
    hasCode: boolean;
    hasMath: boolean;
    questionType: 'simple' | 'complex' | 'reasoning';
    keywords: string[];
    sentenceComplexity: number;
  };
  reasoning: string;
}

export interface RouterOptions {
  maxCostPerQuery?: number;
  preferCheaper?: boolean;
  forceProvider?: Provider;
  forceModel?: string;
  enableEmbeddings?: boolean;
}

export interface RoutingDecision {
  provider: Provider;
  model: string;
  displayName: string;
  complexity: ComplexityAnalysis;
  estimatedCost: {
    input: number;
    output: number;
    total: number;
  };
  reasoning: string;
}

export interface QueryMetadata {
  queryLength: number;
  estimatedTokens: number;
  timestamp: Date;
}

export interface ExecutionResult {
  answer: string;
  metadata: {
    modelUsed: string;
    provider: Provider;
    complexity: ComplexityLevel;
    actualCost: number;
    estimatedCost: number;
    tokensUsed: {
      input: number;
      output: number;
      total: number;
    };
    latency: number;
    costSavings?: {
      vsExpensive: number;
      percentage: number;
    };
  };
}

export interface UsageStats {
  totalQueries: number;
  totalCost: number;
  averageCost: number;
  modelBreakdown: Record<string, number>;
  complexityBreakdown: Record<ComplexityLevel, number>;
}
