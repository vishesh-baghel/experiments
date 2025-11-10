/**
 * Customer Care Agent - Uses LLM Router for intelligent model selection with Mastra Agent
 * Supports both streaming and non-streaming responses
 */

import { Agent } from '@mastra/core/agent';
import { LLMRouter, type RouterOptions } from 'llm-router';

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
  actualCost?: number;
}

export interface StreamingAgentResponse {
  routing: {
    model: string;
    provider: string;
    complexity: string;
    estimatedCost: number;
    cacheHit: boolean;
  };
  stream: ReadableStream;
  usage: Promise<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
}

export class CustomerCareAgent {
  private router: LLMRouter;
  private systemPrompt: string;

  constructor(customPrompt?: string, routerOptions?: Record<string, unknown>) {
    console.log('DEBUG - Agent constructor routerOptions:', routerOptions);
    this.router = new LLMRouter({
      useCache: true,
      useMLClassifier: true,
      ...routerOptions,
    });
    console.log('DEBUG - Router initialized with cache:', this.router.getCache() !== null);

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
   * Returns complete response (non-streaming)
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
          complexity: cachedEntry.complexity,
          estimatedCost: 0,
          cacheHit: true,
        },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        latency,
        actualCost: 0,
      };
    }

    // Step 2: Cache miss - use router to select optimal model
    const routing = await this.router.routeQuery(query, {
      preferCheaper: true,
      ...options,
    });

    // Step 3: Create Mastra agent with selected model
    const agent = this.createAgent(routing.provider, routing.model);

    // Step 4: Execute query
    const response = await agent.generate(query);

    // Step 5: Calculate actual cost
    const actualCost =
      (response.usage.inputTokens || 0) * 0.00000015 +
      (response.usage.outputTokens || 0) * 0.0000006;

    // Step 6: Cache the response
    await cache.set(
      query,
      response.text,
      routing.model,
      actualCost,
      routing.provider,
      routing.complexity.level
    );

    const latency = Date.now() - startTime;

    return {
      response: response.text,
      routing: {
        model: routing.model,
        provider: routing.provider,
        complexity: routing.complexity.level,
        estimatedCost: routing.estimatedCost.total,
        cacheHit: false,
      },
      usage: {
        inputTokens: response.usage.inputTokens || 0,
        outputTokens: response.usage.outputTokens || 0,
        totalTokens: response.usage.totalTokens || 0,
      },
      latency,
      actualCost,
    };
  }

  /**
   * Handle a customer query with streaming response
   * Uses Mastra Agent's streaming capabilities
   */
  async handleQueryStream(
    query: string,
    messages: Array<{ role: string; content: string }>,
    options: RouterOptions = {}
  ): Promise<StreamingAgentResponse> {
    const cache = this.router.getCache();

    // Step 1: Check semantic cache first (with error handling)
    let cachedEntry = null;
    try {
      cachedEntry = await cache.get(query);
    } catch (error) {
      console.warn('[Cache] Failed to check cache, continuing without cache:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    if (cachedEntry) {
      // Return cached response as instant stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send entire cached response instantly
          controller.enqueue(encoder.encode(`0:${JSON.stringify(cachedEntry.response)}\n`));
          controller.enqueue(
            encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
          );
          controller.close();
        },
      });

      return {
        routing: {
          model: cachedEntry.model,
          provider: cachedEntry.provider,
          complexity: cachedEntry.complexity,
          estimatedCost: 0,
          cacheHit: true,
        },
        stream,
        usage: Promise.resolve({
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        }),
      };
    }

    // Step 2: Cache miss - use router to select optimal model
    const routing = await this.router.routeQuery(query, {
      preferCheaper: true,
      ...options,
    });

    // DEBUG: Log what router returned
    console.log('DEBUG - Router returned:', {
      complexity: routing.complexity,
      complexityLevel: routing.complexity?.level,
      model: routing.model,
      provider: routing.provider,
    });

    // Step 3: Create Mastra agent with selected model
    const agent = this.createAgent(routing.provider, routing.model);

    // Step 4: Stream the response using Mastra Agent
    const result = await agent.stream(messages);

    // Step 5: Wrap the stream to cache the response
    let fullResponse = '';
    const originalStream = result.textStream;
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      try {
        for await (const chunk of originalStream) {
          fullResponse += chunk;
          await writer.write(chunk);
        }
        writer.close();

        // Cache the complete response
        const usage = await result.usage;
        const actualCost =
          (usage.inputTokens || 0) * 0.00000015 +
          (usage.outputTokens || 0) * 0.0000006;

        // Try to cache, but don't fail if cache is unavailable
        try {
          await cache.set(
            query,
            fullResponse,
            routing.model,
            actualCost,
            routing.provider,
            routing.complexity.level
          );
        } catch (cacheError) {
          console.warn('[Cache] Failed to cache response:', cacheError instanceof Error ? cacheError.message : 'Unknown error');
        }
      } catch (error) {
        writer.abort(error);
      }
    })();

    return {
      routing: {
        model: routing.model,
        provider: routing.provider,
        complexity: routing.complexity.level,
        estimatedCost: routing.estimatedCost.total,
        cacheHit: false,
      },
      stream: readable,
      usage: result.usage.then((u) => ({
        inputTokens: u.inputTokens || 0,
        outputTokens: u.outputTokens || 0,
        totalTokens: u.totalTokens || 0,
      })),
    };
  }

  /**
   * Cache a response for future use
   */
  async cacheResponse(
    query: string,
    response: string,
    model: string,
    cost: number,
    provider: string,
    complexity: string
  ): Promise<void> {
    const cache = this.router.getCache();
    await cache.set(query, response, model, cost, provider, complexity);
  }

  /**
   * Create Mastra agent with specific model
   */
  private createAgent(provider: string, model: string): Agent {
    const modelString = `${provider}/${model}`;

    return new Agent({
      name: 'customer-care',
      instructions: this.systemPrompt,
      model: modelString,
    });
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
