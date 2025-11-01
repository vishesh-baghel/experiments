/**
 * Streaming Router - Wraps LLMRouter to add streaming support
 * Uses composition pattern to keep router unchanged (backward compatible)
 */

import { LLMRouter } from './index';
import { RouterOptions, Provider } from '../types';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    provider: Provider;
    model: string;
    tokensUsed?: number;
  };
}

export class StreamingRouter {
  private router: LLMRouter;

  constructor(router: LLMRouter) {
    this.router = router;
  }

  /**
   * Route query and stream the response
   * Returns async generator for real-time streaming
   */
  async *routeQueryStream(
    query: string,
    systemPrompt: string,
    options: RouterOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // Step 1: Use router to select optimal model
    const routing = await this.router.routeQuery(query, options);

    // Step 2: Get provider SDK instance
    const providerModel = this.getProviderModel(
      routing.provider,
      routing.model
    );

    // Step 3: Stream the response
    const { textStream, usage } = await streamText({
      model: providerModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
    });

    // Step 4: Yield chunks as they arrive
    for await (const chunk of textStream) {
      yield {
        content: chunk,
        done: false,
        metadata: {
          provider: routing.provider,
          model: routing.model,
        },
      };
    }

    // Step 5: Final chunk with usage stats
    const usageStats = await usage;
    yield {
      content: '',
      done: true,
      metadata: {
        provider: routing.provider,
        model: routing.model,
        tokensUsed: usageStats.totalTokens,
      },
    };
  }

  /**
   * Get provider SDK model instance
   * Note: Groq, Together, Ollama require custom provider setup
   * For now, we support OpenAI, Anthropic, and Google
   */
  private getProviderModel(provider: Provider, modelName: string) {
    switch (provider) {
      case 'openai':
        return openai(modelName);
      case 'anthropic':
        return anthropic(modelName);
      case 'google':
        return google(modelName);
      case 'groq':
      case 'together':
      case 'ollama':
        // These providers need custom SDK setup
        // For benchmarking, we'll focus on OpenAI, Anthropic, Google
        throw new Error(
          `Streaming not yet implemented for ${provider}. Use OpenAI, Anthropic, or Google for streaming.`
        );
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get the underlying router instance
   */
  getRouter(): LLMRouter {
    return this.router;
  }
}
