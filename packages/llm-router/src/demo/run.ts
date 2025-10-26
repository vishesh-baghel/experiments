/**
 * Demo runner for LLM Router
 * Run with: pnpm dev
 */

import { CustomerCareAgent } from '../agent/customer-care-agent';
import { demoQueries, getQueriesByComplexity } from './queries';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('LLM ROUTER DEMO - Customer Care Agent');
  console.log('='.repeat(80));
  console.log('This demo shows intelligent model selection based on query complexity\n');

  // Check for API keys
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error('[ERROR] Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
    console.error('   Copy .env.example to .env and add your API keys\n');
    process.exit(1);
  }

  // Create agent
  const agent = new CustomerCareAgent();

  // Demo 1: Process one query from each complexity level
  console.log('\nDEMO 1: Query Complexity Comparison\n');

  const levels: Array<'simple' | 'moderate' | 'complex' | 'reasoning'> = [
    'simple',
    'moderate',
    'complex',
    'reasoning',
  ];

  for (const level of levels) {
    const queries = getQueriesByComplexity(level);
    const demoQuery = queries[0]; // Take first query from each level

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Testing ${level.toUpperCase()} query:`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const result = await agent.handleQuery(demoQuery.query, {
        preferCheaper: true, // Cost optimization mode
      });

      console.log('[OK] Response:');
      console.log(`   ${result.answer.substring(0, 200)}${result.answer.length > 200 ? '...' : ''}`);
      console.log();
    } catch (error) {
      console.error('[ERROR]:', error);
    }

    // Add delay between requests to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Demo 2: Show cost comparison
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 2: Cost Comparison Across Models');
  console.log('='.repeat(80) + '\n');

  const complexQuery = demoQueries.find((q) => q.expectedComplexity === 'complex')!;
  
  console.log(`Query: "${complexQuery.query.substring(0, 100)}..."\n`);
  
  const costComparison = await agent.compareCosts(complexQuery.query);
  
  console.log('Cost estimates across all models:');
  console.log('─'.repeat(80));
  costComparison
    .sort((a, b) => a.cost - b.cost)
    .forEach((item, index) => {
      const icon = index === 0 ? '[$]' : index === costComparison.length - 1 ? '[$$]' : '    ';
      console.log(`${icon} ${item.model.padEnd(25)} ${item.formatted}`);
    });
  
  const cheapest = costComparison[0];
  const expensive = costComparison[costComparison.length - 1];
  const savings = ((expensive.cost - cheapest.cost) / expensive.cost * 100).toFixed(1);
  
  console.log('─'.repeat(80));
  console.log(`[INFO] Potential savings: ${savings}% by choosing optimal model\n`);

  // Demo 3: Show usage statistics
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 3: Usage Statistics');
  console.log('='.repeat(80) + '\n');

  const stats = agent.getStats();
  
  console.log(`Total Queries: ${stats.totalQueries}`);
  console.log(`Total Cost: $${stats.totalCost.toFixed(6)}`);
  console.log(`Average Cost: $${stats.averageCost.toFixed(6)}`);
  
  console.log('\nModel Breakdown:');
  Object.entries(stats.modelBreakdown).forEach(([model, count]) => {
    console.log(`  ${model}: ${count} queries`);
  });
  
  console.log('\nComplexity Breakdown:');
  Object.entries(stats.complexityBreakdown).forEach(([level, count]) => {
    if (count > 0) {
      console.log(`  ${level}: ${count} queries`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('Demo Complete!');
  console.log('='.repeat(80) + '\n');
}

// Run demo
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
