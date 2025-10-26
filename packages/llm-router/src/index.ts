/**
 * LLM Router - Intelligent model selection for cost-optimized AI applications
 * 
 * @example
 * ```typescript
 * import { CustomerCareAgent, LLMRouter } from '@experiments/llm-router';
 * 
 * // Use the customer care agent
 * const agent = new CustomerCareAgent();
 * const result = await agent.handleQuery('How do I reset my password?');
 * 
 * // Or use the router directly
 * const router = new LLMRouter();
 * const routing = await router.routeQuery('Explain quantum computing');
 * ```
 */

// Main exports
export { LLMRouter } from './router';
export { CustomerCareAgent } from './agent/customer-care-agent';

// Router components (for advanced usage)
export { ComplexityAnalyzer, ModelSelector, CostCalculator } from './router';

// Model configurations
export * from './models/config';

// Types
export * from './types';

// Demo utilities (for testing)
export * from './demo/queries';
