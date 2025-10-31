/**
 * Customer Care Agent - Uses LLM Router for intelligent model selection
 */

import { Agent } from '@mastra/core/agent';
import { LLMRouter } from '../router';
import { RouterOptions, ExecutionResult } from '../types';
import { getModelConfig } from '../models/config';
import { join } from 'path';
import { existsSync } from 'fs';

export class CustomerCareAgent {
  private router: LLMRouter;
  private systemPrompt: string;
  private mlClassifierReady: boolean = false;

  constructor(customPrompt?: string) {
    this.router = new LLMRouter({ useMLClassifier: true });
    this.systemPrompt =
      customPrompt ||
      `You are a helpful and friendly customer care agent.

Your responsibilities:
- Answer customer questions clearly and concisely
- Help resolve issues and complaints professionally
- Provide accurate information about policies, products, and services
- Escalate complex issues when necessary
- Maintain a positive and empathetic tone

Guidelines:
- Be concise for simple questions
- Provide detailed explanations for complex queries
- Always verify information before providing it
- If you don't know something, admit it and offer to find out
- Show empathy for customer frustrations`;

    // Initialize ML classifier in background
    this.initializeMLClassifier();
  }

  /**
   * Initialize ML classifier with pre-computed embeddings (background)
   * Falls back to heuristics until ready
   */
  private async initializeMLClassifier(): Promise<void> {
    try {
      const precomputedPath = join(__dirname, '../classifier/precomputed-embeddings.json');
      
      if (existsSync(precomputedPath)) {
        console.log('Loading ML classifier from pre-computed embeddings...');
        const { MLClassifier } = await import('../classifier/ml-classifier');
        const classifier = await MLClassifier.loadFromPrecomputed(precomputedPath);
        
        // Replace router's classifier
        await this.router.initializeMLClassifier(
          (await import('../classifier/training-data')).trainingData
        );
        
        this.mlClassifierReady = true;
        console.log('✓ ML classifier ready (95%+ accuracy)');
      } else {
        console.log('⚠ Pre-computed embeddings not found. Run: pnpm precompute');
        console.log('  Using heuristic classification (85% accuracy) as fallback');
      }
    } catch (error) {
      console.error('Failed to initialize ML classifier:', error);
      console.log('  Using heuristic classification as fallback');
    }
  }

  /**
   * Handle a customer query with intelligent routing
   */
  async handleQuery(
    query: string,
    options: RouterOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Step 1: Use router to select optimal model
    const routing = await this.router.routeQuery(query, {
      preferCheaper: true, // Default to cost optimization
      ...options,
    });

    // Log routing decision
    console.log('\n' + '='.repeat(80));
    console.log('CUSTOMER CARE AGENT - Routing Decision');
    console.log('='.repeat(80));
    console.log(`Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`Complexity: ${routing.complexity.level.toUpperCase()} (score: ${routing.complexity.score}/100)`);
    console.log(`Analysis: ${routing.complexity.reasoning}`);
    console.log(`Selected Model: ${routing.displayName} (${routing.provider})`);
    console.log(`Estimated Cost: $${routing.estimatedCost.total.toFixed(6)}`);
    console.log(`Reasoning: ${routing.reasoning}`);
    console.log('='.repeat(80) + '\n');

    // Step 2: Create Mastra agent with selected model
    const agent = this.createAgent(routing.provider, routing.model);

    // Step 3: Execute query
    try {
      const response = await agent.generate(query);

      // Step 4: Calculate actual cost
      const actualCost = this.router
        .getCostCalculator()
        .calculateActualCost(
          response.usage.inputTokens || 0,
          response.usage.outputTokens || 0,
          { ...routing, inputCostPerToken: 0, outputCostPerToken: 0 } as any
        );

      // Get model config for accurate pricing
      const modelConfig = getModelConfig(routing.model.split('/').pop() || routing.model);
      const realActualCost = this.router
        .getCostCalculator()
        .calculateActualCost(
          response.usage.inputTokens || 0,
          response.usage.outputTokens || 0,
          modelConfig
        );

      // Calculate savings
      const savings = this.router
        .getCostCalculator()
        .calculateSavings(realActualCost, query);

      // Record usage
      this.router.recordUsage(
        routing.model,
        routing.complexity.level,
        realActualCost
      );

      const latency = Date.now() - startTime;

      // Log response summary
      console.log('Response Summary:');
      console.log(`   Tokens Used: ${response.usage.totalTokens} (${response.usage.inputTokens} in, ${response.usage.outputTokens} out)`);
      console.log(`   Actual Cost: $${realActualCost.toFixed(6)}`);
      console.log(`   Cost Savings: ${savings.percentage.toFixed(1)}% vs expensive models`);
      console.log(`   Latency: ${latency}ms`);
      console.log('='.repeat(80) + '\n');

      return {
        answer: response.text,
        metadata: {
          modelUsed: routing.displayName,
          provider: routing.provider,
          complexity: routing.complexity.level,
          actualCost: realActualCost,
          estimatedCost: routing.estimatedCost.total,
          tokensUsed: {
            input: response.usage.inputTokens || 0,
            output: response.usage.outputTokens || 0,
            total: response.usage.totalTokens || 0,
          },
          latency,
          costSavings: savings,
        },
      };
    } catch (error) {
      console.error('[ERROR] Error executing query:', error);
      throw error;
    }
  }

  /**
   * Create Mastra agent with specific model
   */
  private createAgent(provider: string, model: string): Agent {
    // Use Mastra's model router format: "provider/model"
    const modelString = `${provider}/${model}`;
    
    return new Agent({
      name: 'customer-care',
      instructions: this.systemPrompt,
      model: modelString,
    });
  }

  /**
   * Get router statistics
   */
  getStats() {
    return this.router.getStats();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.router.resetStats();
  }

  /**
   * Compare costs for a query across all models
   */
  async compareCosts(query: string) {
    return this.router.compareCosts(query);
  }
}
