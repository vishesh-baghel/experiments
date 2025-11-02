'use client';

import { useState } from 'react';
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import benchmarkQueries from './queries.json';

interface BenchmarkQuery {
  id: number;
  query: string;
  expectedComplexity: string;
  category: string;
}

interface BenchmarkResult {
  id: number;
  query: string;
  expectedComplexity: string;
  category: string;
  complexity: string;
  selectedModel: string;
  provider: string;
  responseTime: number;
  cost: number;
  cacheHit: boolean;
  tokensUsed: number;
  success: boolean;
  error?: string;
}

interface BenchmarkSummary {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalCost: number;
  totalTime: number;
  avgResponseTime: number;
  cacheHitRate: number;
  totalTokens: number;
  costSaved: number;
  routingAccuracy: number;
  simpleCorrect: number;
  simpleTotal: number;
  moderateCorrect: number;
  moderateTotal: number;
  complexCorrect: number;
  complexTotal: number;
  reasoningCorrect: number;
  reasoningTotal: number;
}

export default function BenchmarksPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');

  const runBenchmarks = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setProgress(0);

    // Filter queries based on selected complexity
    const queriesToRun = selectedComplexity === 'all' 
      ? benchmarkQueries 
      : benchmarkQueries.filter(q => q.expectedComplexity === selectedComplexity);

    const benchmarkResults: BenchmarkResult[] = [];
    let totalCost = 0;
    let totalTime = 0;
    let cacheHits = 0;
    let totalTokens = 0;
    let successCount = 0;
    let costSaved = 0;

    const BATCH_SIZE = 10;
    
    // Process queries in batches of 10
    for (let batchStart = 0; batchStart < queriesToRun.length; batchStart += BATCH_SIZE) {
      const batch = queriesToRun.slice(batchStart, batchStart + BATCH_SIZE);
      
      // Run batch in parallel
      const batchPromises = batch.map(async ({ id, query, expectedComplexity, category }) => {
        const startTime = Date.now();

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: query }],
            }),
          });

          const responseTime = Date.now() - startTime;

          // Extract metadata from headers
          const model = response.headers.get('X-Router-Model') || 'unknown';
          const provider = response.headers.get('X-Router-Provider') || 'unknown';
          const complexity = response.headers.get('X-Router-Complexity') || 'unknown';
          const cost = parseFloat(response.headers.get('X-Router-Cost') || '0');
          const cacheHit = response.headers.get('X-Router-Cache-Hit') === 'true';

          // Read the stream to completion
          const reader = response.body?.getReader();
          let tokens = 0;
          if (reader) {
            while (true) {
              const { done } = await reader.read();
              if (done) break;
              tokens += 10; // Rough estimate
            }
          }

          return {
            id,
            query,
            expectedComplexity,
            category,
            complexity,
            selectedModel: model,
            provider,
            responseTime,
            cost: cacheHit ? 0 : cost,
            cacheHit,
            tokensUsed: tokens,
            success: true,
            actualCost: cost,
          };
        } catch (error) {
          return {
            id,
            query,
            expectedComplexity,
            category,
            complexity: 'unknown',
            selectedModel: 'unknown',
            provider: 'unknown',
            responseTime: Date.now() - startTime,
            cost: 0,
            cacheHit: false,
            tokensUsed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            actualCost: 0,
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Process batch results
      batchResults.forEach((result) => {
        const { actualCost, ...benchmarkResult } = result;
        benchmarkResults.push(benchmarkResult);
        totalCost += result.cost;
        totalTime += result.responseTime;
        totalTokens += result.tokensUsed;
        
        if (result.success) {
          successCount++;
        }
        
        if (result.cacheHit) {
          cacheHits++;
          costSaved += actualCost || 0;
        }
      });

      // Update UI after each batch
      setResults([...benchmarkResults]);
      setProgress((benchmarkResults.length / queriesToRun.length) * 100);
    }

    // Calculate routing accuracy
    const simpleResults = benchmarkResults.filter(r => r.expectedComplexity === 'simple');
    const moderateResults = benchmarkResults.filter(r => r.expectedComplexity === 'moderate');
    const complexResults = benchmarkResults.filter(r => r.expectedComplexity === 'complex');
    const reasoningResults = benchmarkResults.filter(r => r.expectedComplexity === 'reasoning');

    const simpleCorrect = simpleResults.filter(r => r.complexity === 'simple').length;
    const moderateCorrect = moderateResults.filter(r => r.complexity === 'moderate').length;
    const complexCorrect = complexResults.filter(r => r.complexity === 'complex').length;
    const reasoningCorrect = reasoningResults.filter(r => r.complexity === 'reasoning').length;

    const totalCorrect = simpleCorrect + moderateCorrect + complexCorrect + reasoningCorrect;
    const routingAccuracy = benchmarkResults.length > 0 ? (totalCorrect / benchmarkResults.length) * 100 : 0;

    // Calculate summary
    const summaryData: BenchmarkSummary = {
      totalQueries: queriesToRun.length,
      successfulQueries: successCount,
      failedQueries: queriesToRun.length - successCount,
      totalCost,
      totalTime,
      avgResponseTime: totalTime / queriesToRun.length,
      cacheHitRate: (cacheHits / queriesToRun.length) * 100,
      totalTokens,
      costSaved,
      routingAccuracy,
      simpleCorrect,
      simpleTotal: simpleResults.length,
      moderateCorrect,
      moderateTotal: moderateResults.length,
      complexCorrect,
      complexTotal: complexResults.length,
      reasoningCorrect,
      reasoningTotal: reasoningResults.length,
    };

    setSummary(summaryData);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>
        <h1 className="text-3xl font-bold mb-2">LLM Router Benchmarks</h1>
        <p className="text-muted-foreground">
          Test routing decisions, response times, and cost optimization
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={runBenchmarks}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Benchmarks... {progress.toFixed(0)}%
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Benchmarks
            </>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter:</label>
          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            disabled={isRunning}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-50"
          >
            <option value="all">All ({benchmarkQueries.length})</option>
            <option value="simple">Simple ({benchmarkQueries.filter(q => q.expectedComplexity === 'simple').length})</option>
            <option value="moderate">Moderate ({benchmarkQueries.filter(q => q.expectedComplexity === 'moderate').length})</option>
            <option value="complex">Complex ({benchmarkQueries.filter(q => q.expectedComplexity === 'complex').length})</option>
            <option value="reasoning">Reasoning ({benchmarkQueries.filter(q => q.expectedComplexity === 'reasoning').length})</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Total Queries</div>
              <div className="text-2xl font-bold">{summary.totalQueries}</div>
              <div className="text-xs text-green-600 mt-1">
                {summary.successfulQueries} successful
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Routing Accuracy</div>
              <div className={`text-2xl font-bold ${
                summary.routingAccuracy >= 90 ? 'text-green-600' : 
                summary.routingAccuracy >= 75 ? 'text-orange-600' : 
                'text-red-600'
              }`}>
                {summary.routingAccuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {summary.simpleCorrect + summary.moderateCorrect + summary.complexCorrect + summary.reasoningCorrect}/{summary.totalQueries} correct
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Avg Response Time</div>
              <div className="text-2xl font-bold">{summary.avgResponseTime.toFixed(0)}ms</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {(summary.totalTime / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-blue-600">${summary.totalCost.toFixed(6)}</div>
              <div className="text-xs text-green-600 mt-1">
                Saved: ${summary.costSaved.toFixed(6)}
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {summary.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((summary.cacheHitRate / 100) * summary.totalQueries)} hits
              </div>
            </div>
          </div>
          
          {/* Routing Accuracy Breakdown */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="text-xs font-semibold mb-3 text-muted-foreground">Routing Accuracy by Complexity</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Simple</div>
                <div className="text-lg font-bold">{summary.simpleTotal > 0 ? ((summary.simpleCorrect / summary.simpleTotal) * 100).toFixed(1) : 0}%</div>
                <div className="text-xs text-muted-foreground">{summary.simpleCorrect}/{summary.simpleTotal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Moderate</div>
                <div className="text-lg font-bold">{summary.moderateTotal > 0 ? ((summary.moderateCorrect / summary.moderateTotal) * 100).toFixed(1) : 0}%</div>
                <div className="text-xs text-muted-foreground">{summary.moderateCorrect}/{summary.moderateTotal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Complex</div>
                <div className="text-lg font-bold">{summary.complexTotal > 0 ? ((summary.complexCorrect / summary.complexTotal) * 100).toFixed(1) : 0}%</div>
                <div className="text-xs text-muted-foreground">{summary.complexCorrect}/{summary.complexTotal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Reasoning</div>
                <div className="text-lg font-bold">{summary.reasoningTotal > 0 ? ((summary.reasoningCorrect / summary.reasoningTotal) * 100).toFixed(1) : 0}%</div>
                <div className="text-xs text-muted-foreground">{summary.reasoningCorrect}/{summary.reasoningTotal}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="flex-1 overflow-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-background sticky top-0 z-10 border-b border-border">
              <tr>
                <th className="text-left p-3 font-semibold">ID</th>
                <th className="text-left p-3 font-semibold">Query</th>
                <th className="text-left p-3 font-semibold">Category</th>
                <th className="text-left p-3 font-semibold">Expected</th>
                <th className="text-left p-3 font-semibold">Actual</th>
                <th className="text-left p-3 font-semibold">Model</th>
                <th className="text-right p-3 font-semibold">Time (ms)</th>
                <th className="text-right p-3 font-semibold">Cost</th>
                <th className="text-center p-3 font-semibold">Cache</th>
                <th className="text-center p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr
                  key={index}
                  className="border-t border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3 text-muted-foreground font-mono text-xs">{result.id}</td>
                  <td className="p-3 max-w-md truncate" title={result.query}>
                    {result.query}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-muted/50">
                      {result.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-600 capitalize">
                      {result.expectedComplexity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      result.complexity === result.expectedComplexity 
                        ? 'bg-green-500/10 text-green-600' 
                        : 'bg-orange-500/10 text-orange-600'
                    }`}>
                      {result.complexity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">{result.selectedModel}</td>
                  <td className="p-3 text-right font-mono">
                    {result.responseTime.toFixed(0)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    ${result.cost.toFixed(6)}
                  </td>
                  <td className="p-3 text-center">
                    {result.cacheHit ? (
                      <span className="text-green-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-muted-foreground">✗</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isRunning && (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="text-lg mb-2">No benchmark results yet</p>
            <p className="text-sm">Click "Run Benchmarks" to start testing</p>
          </div>
        </div>
      )}
    </div>
  );
}
