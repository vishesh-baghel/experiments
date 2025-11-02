/**
 * Benchmark Suite - Measures router performance with real queries
 * Tracks: Latency, Cost, Accuracy, Cache Hit Rate
 */

import { LLMRouter } from '../router';
import { ComplexityLevel } from '../types';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

export interface BenchmarkQuery {
  id: number;
  query: string;
  expectedComplexity: ComplexityLevel;
  category: string;
}

export interface BenchmarkResult {
  queryId: number;
  query: string;
  expectedComplexity: ComplexityLevel;
  predictedComplexity: ComplexityLevel;
  correct: boolean;
  selectedModel: string;
  selectedProvider: string;
  estimatedCost: number;
  latency: number;
  cacheHit: boolean;
}

export interface BenchmarkSummary {
  totalQueries: number;
  accuracy: number;
  avgLatency: number;
  totalCost: number;
  cacheHitRate: number;
  byComplexity: Record<
    ComplexityLevel,
    {
      count: number;
      accuracy: number;
      avgCost: number;
      avgLatency: number;
    }
  >;
  byProvider: Record<
    string,
    {
      count: number;
      totalCost: number;
      avgLatency: number;
    }
  >;
}

export class BenchmarkRunner {
  private router: LLMRouter;
  private results: BenchmarkResult[] = [];

  constructor(enabledProviders?: string[]) {
    this.router = new LLMRouter({
      useCache: true,
      useMLClassifier: false, // Use heuristics for fair comparison
      enabledProviders: enabledProviders as any || ['openai'], // Default to OpenAI only
    });
  }

  /**
   * Run benchmark on all queries
   */
  async runBenchmark(queries: BenchmarkQuery[]): Promise<BenchmarkSummary> {
    console.log('='.repeat(80));
    console.log('RUNNING BENCHMARK');
    console.log('='.repeat(80));
    console.log(`Total queries: ${queries.length}`);
    console.log();

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${queries.length} queries...`);
      }

      const result = await this.benchmarkQuery(query);
      this.results.push(result);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log();
    console.log('='.repeat(80));
    console.log('BENCHMARK COMPLETE');
    console.log('='.repeat(80));

    return this.generateSummary();
  }

  /**
   * Benchmark a single query
   */
  private async benchmarkQuery(
    query: BenchmarkQuery
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();

    // Check cache before routing
    const cacheEntry = await this.router.getCache().get(query.query);
    const cacheHit = cacheEntry !== null;

    // Route the query
    const routing = await this.router.routeQuery(query.query, {
      preferCheaper: true,
    });

    const latency = Date.now() - startTime;

    return {
      queryId: query.id,
      query: query.query,
      expectedComplexity: query.expectedComplexity,
      predictedComplexity: routing.complexity.level,
      correct: routing.complexity.level === query.expectedComplexity,
      selectedModel: routing.model,
      selectedProvider: routing.provider,
      estimatedCost: routing.estimatedCost.total,
      latency,
      cacheHit,
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): BenchmarkSummary {
    const total = this.results.length;
    const correct = this.results.filter((r) => r.correct).length;
    const cacheHits = this.results.filter((r) => r.cacheHit).length;

    const summary: BenchmarkSummary = {
      totalQueries: total,
      accuracy: correct / total,
      avgLatency:
        this.results.reduce((sum, r) => sum + r.latency, 0) / total,
      totalCost: this.results.reduce((sum, r) => sum + r.estimatedCost, 0),
      cacheHitRate: cacheHits / total,
      byComplexity: this.groupByComplexity(),
      byProvider: this.groupByProvider(),
    };

    return summary;
  }

  /**
   * Group results by complexity level
   */
  private groupByComplexity(): BenchmarkSummary['byComplexity'] {
    const levels: ComplexityLevel[] = ['simple', 'moderate', 'complex', 'reasoning'];
    const grouped: any = {};

    for (const level of levels) {
      const results = this.results.filter((r) => r.expectedComplexity === level);
      if (results.length === 0) continue;

      const correct = results.filter((r) => r.correct).length;

      grouped[level] = {
        count: results.length,
        accuracy: correct / results.length,
        avgCost: results.reduce((sum, r) => sum + r.estimatedCost, 0) / results.length,
        avgLatency: results.reduce((sum, r) => sum + r.latency, 0) / results.length,
      };
    }

    return grouped;
  }

  /**
   * Group results by provider
   */
  private groupByProvider(): BenchmarkSummary['byProvider'] {
    const providers = new Set(this.results.map((r) => r.selectedProvider));
    const grouped: any = {};

    for (const provider of providers) {
      const results = this.results.filter((r) => r.selectedProvider === provider);

      grouped[provider] = {
        count: results.length,
        totalCost: results.reduce((sum, r) => sum + r.estimatedCost, 0),
        avgLatency: results.reduce((sum, r) => sum + r.latency, 0) / results.length,
      };
    }

    return grouped;
  }

  /**
   * Save results to file
   */
  saveResults(filename: string = 'benchmark-results.json'): void {
    const output = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.results,
    };

    const outputPath = join(__dirname, filename);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results saved to: ${outputPath}`);
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const summary = this.generateSummary();

    console.log();
    console.log('='.repeat(80));
    console.log('BENCHMARK SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log(`Total Queries: ${summary.totalQueries}`);
    console.log(`Accuracy: ${(summary.accuracy * 100).toFixed(1)}%`);
    console.log(`Avg Latency: ${summary.avgLatency.toFixed(0)}ms`);
    console.log(`Total Cost: $${summary.totalCost.toFixed(6)}`);
    console.log(`Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`);
    console.log();

    console.log('By Complexity:');
    for (const [level, stats] of Object.entries(summary.byComplexity)) {
      console.log(`  ${level}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Accuracy: ${(stats.accuracy * 100).toFixed(1)}%`);
      console.log(`    Avg Cost: $${stats.avgCost.toFixed(6)}`);
      console.log(`    Avg Latency: ${stats.avgLatency.toFixed(0)}ms`);
    }
    console.log();

    console.log('By Provider:');
    for (const [provider, stats] of Object.entries(summary.byProvider)) {
      console.log(`  ${provider}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Total Cost: $${stats.totalCost.toFixed(6)}`);
      console.log(`    Avg Latency: ${stats.avgLatency.toFixed(0)}ms`);
    }
    console.log();
  }
}

// Run benchmark if executed directly
if (require.main === module) {
  (async () => {
    try {
      // Load queries (you need to generate them first)
      let benchmarkQueries;
      try {
        const queriesModule = await import('./queries');
        benchmarkQueries = queriesModule.benchmarkQueries;
      } catch (error) {
        console.error('Error: Benchmark queries not found!');
        console.error('Please run: pnpm generate-queries');
        console.error('This will generate the queries.ts file needed for benchmarking.');
        process.exit(1);
      }
      
      const runner = new BenchmarkRunner();
      await runner.runBenchmark(benchmarkQueries);
      runner.printSummary();
      runner.saveResults();
    } catch (error) {
      console.error('Benchmark failed:', error);
      process.exit(1);
    }
  })();
}
