/**
 * Customer Care Agent - Uses LLM Router for intelligent model selection
 * Simplified version for UI demo
 */

import { LLMRouter } from 'llm-router';
import type { RouterOptions } from 'llm-router';

export interface AgentResponse {
  response: string;
  routing: {
    model: string;
    provider: string;
    complexity: string;
    estimatedCost: number;
    cacheHit: boolean;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export class CustomerCareAgent {
  private router: LLMRouter;
  private systemPrompt: string;

  constructor(customPrompt?: string, routerOptions?: any) {
    this.router = new LLMRouter({
      useCache: true,
      useMLClassifier: true, // Use ML classifier for better accuracy
      ...routerOptions,
    });
    
    this.systemPrompt =
      customPrompt ||
      `You are a helpful and friendly customer care agent.

Your responsibilities:
- Answer customer questions clearly and concisely
- Help resolve issues and complaints professionally
- Provide accurate information about policies, products, and services
- Maintain a positive and empathetic tone

Guidelines:
- Keep responses brief and to the point
- Use simple, easy-to-understand language
- Be empathetic and understanding
- If you don't know something, admit it honestly`;
  }

  /**
   * Handle a customer query with intelligent routing and caching
   */
  async handleQuery(
    query: string,
    options: RouterOptions = {}
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const cache = this.router.getCache();

    // Step 1: Check semantic cache first
    const cachedEntry = await cache.get(query);
    if (cachedEntry) {
      const latency = Date.now() - startTime;
      return {
        response: cachedEntry.response,
        routing: {
          model: cachedEntry.model,
          provider: cachedEntry.provider,
          complexity: 'simple', // Cached responses are "free"
          estimatedCost: 0, // No cost for cached responses
          cacheHit: true,
        },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        latency,
      };
    }

    // Step 2: Cache miss - use router to select optimal model
    const routing = await this.router.routeQuery(query, {
      preferCheaper: true, // Default to cost optimization
      ...options,
    });

    // For demo purposes, return routing info
    // In production, you'd call the actual LLM here
    const latency = Date.now() - startTime;

    return {
      response: '', // Will be filled by streaming in API route
      routing: {
        model: routing.model,
        provider: routing.provider,
        complexity: routing.complexity.level,
        estimatedCost: routing.estimatedCost.total,
        cacheHit: false,
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      latency,
    };
  }

  /**
   * Cache a response for future use
   * Call this after getting the LLM response
   */
  async cacheResponse(
    query: string,
    response: string,
    model: string,
    cost: number,
    provider: string
  ): Promise<void> {
    const cache = this.router.getCache();
    await cache.set(query, response, model, cost, provider);
  }

  /**
   * Get the system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Get the router instance
   */
  getRouter(): LLMRouter {
    return this.router;
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return this.router.getStats();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.router.getCache().getStats();
  }
}
