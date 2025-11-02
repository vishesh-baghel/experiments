/**
 * LLM Router - Intelligent model selection for cost-optimized AI applications
 * 
 * @example
 * ```typescript
 * import { LLMRouter } from 'llm-router';
 * 
 * // Use the router directly
 * const router = new LLMRouter();
 * const routing = await router.routeQuery('Explain quantum computing');
 * 
 * console.log(`Selected: ${routing.model} (${routing.provider})`);
 * console.log(`Cost: $${routing.estimatedCost.total}`);
 * ```
 */

// Main exports
export { LLMRouter } from './router';

// Router components (for advanced usage)
export { ComplexityAnalyzer, ModelSelector, CostCalculator } from './router';

// Model configurations
export * from './models/config';

// Types
export * from './types';

// Demo utilities (for testing)
export * from './demo/queries';
