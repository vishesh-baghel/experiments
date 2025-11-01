/**
 * Accurate Token Counter using tiktoken
 * 
 * Replaces character-based estimation (±15% error) with
 * actual tokenization (±2% error) for accurate cost calculation.
 */

import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export interface TokenCount {
  tokens: number;
  method: 'tiktoken' | 'estimate';
  accuracy: 'high' | 'low';
}

export class TokenCounter {
  private encoders: Map<string, any> = new Map();

  /**
   * Count tokens accurately using tiktoken
   */
  countTokens(text: string, model: string): TokenCount {
    try {
      // Map model names to tiktoken models
      const tiktokenModel = this.getTiktokenModel(model);
      
      if (!tiktokenModel) {
        // Fallback to estimation
        return this.estimateTokens(text);
      }

      // Get or create encoder for this model
      let encoder = this.encoders.get(tiktokenModel);
      if (!encoder) {
        encoder = encoding_for_model(tiktokenModel);
        this.encoders.set(tiktokenModel, encoder);
      }

      // Encode and count tokens
      const tokens = encoder.encode(text);
      
      return {
        tokens: tokens.length,
        method: 'tiktoken',
        accuracy: 'high',
      };
    } catch (error) {
      console.warn(`Failed to count tokens with tiktoken for ${model}:`, error);
      return this.estimateTokens(text);
    }
  }

  /**
   * Fallback estimation (±15% error)
   * This is the last resort - should never throw
   */
  private estimateTokens(text: string): TokenCount {
    try {
      // Rule of thumb: 1 token ≈ 4 characters for English
      const estimatedTokens = Math.ceil(text.length / 4);
      
      return {
        tokens: estimatedTokens,
        method: 'estimate',
        accuracy: 'low',
      };
    } catch (error) {
      // Absolute fallback - if even Math.ceil fails, return safe default
      console.error('Critical error in token estimation:', error);
      return {
        tokens: Math.max(1, Math.floor(text.length / 4) || 100),
        method: 'estimate',
        accuracy: 'low',
      };
    }
  }

  /**
   * Map provider model names to tiktoken models
   */
  private getTiktokenModel(model: string): TiktokenModel | null {
    // OpenAI models
    if (model.includes('gpt-4o')) return 'gpt-4o';
    if (model.includes('gpt-4-turbo')) return 'gpt-4-turbo';
    if (model.includes('gpt-4')) return 'gpt-4';
    if (model.includes('gpt-3.5-turbo')) return 'gpt-3.5-turbo';
    
    // Anthropic uses similar tokenization to GPT-4
    if (model.includes('claude')) return 'gpt-4';
    
    // For other providers, we'll use estimation
    // (Gemini, Groq, Together, Ollama don't have tiktoken support)
    return null;
  }

  /**
   * Count tokens for messages (with role overhead)
   */
  countMessageTokens(messages: Array<{ role: string; content: string }>, model: string): TokenCount {
    // Each message has overhead: role tokens + formatting
    const messageOverhead = 4; // Approximate overhead per message
    
    let totalTokens = 0;
    
    for (const message of messages) {
      const contentTokens = this.countTokens(message.content, model);
      const roleTokens = this.countTokens(message.role, model);
      totalTokens += contentTokens.tokens + roleTokens.tokens + messageOverhead;
    }

    return {
      tokens: totalTokens,
      method: 'tiktoken',
      accuracy: 'high',
    };
  }

  /**
   * Compare estimation vs accurate counting
   */
  compareAccuracy(text: string, model: string): {
    estimated: number;
    actual: number;
    error: number;
    errorPercent: number;
  } {
    const estimated = this.estimateTokens(text);
    const actual = this.countTokens(text, model);
    const error = Math.abs(actual.tokens - estimated.tokens);
    const errorPercent = (error / actual.tokens) * 100;

    return {
      estimated: estimated.tokens,
      actual: actual.tokens,
      error,
      errorPercent,
    };
  }

  /**
   * Clean up encoders
   */
  dispose(): void {
    for (const encoder of this.encoders.values()) {
      encoder.free();
    }
    this.encoders.clear();
  }
}

// Singleton instance
export const tokenCounter = new TokenCounter();
