/**
 * Example: Using Customer Care Agent with Mastra
 * 
 * This example shows the recommended way to use the router
 * with a Mastra agent for real customer care scenarios
 */

import { CustomerCareAgent } from '../src/agent/customer-care-agent';

async function main() {
  // Create agent
  const agent = new CustomerCareAgent();

  // Example queries
  const queries = [
    'How do I reset my password?',
    'I need help understanding the differences between your premium and basic plans',
    'Can you help me implement your API? Here\'s my code: `const api = new API()`',
  ];

  console.log('Customer Care Agent Demo\n');

  // Process each query
  for (const query of queries) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Query: "${query}"`);
    console.log('='.repeat(80));

    try {
      const result = await agent.handleQuery(query, {
        preferCheaper: true, // Optimize for cost
      });

      console.log('\nResponse:');
      console.log(result.answer.substring(0, 200) + '...\n');

      console.log('Metadata:');
      console.log(`  Model: ${result.metadata.modelUsed}`);
      console.log(`  Complexity: ${result.metadata.complexity}`);
      console.log(`  Cost: $${result.metadata.actualCost.toFixed(6)}`);
      console.log(`  Savings: ${result.metadata.costSavings?.percentage.toFixed(1)}%`);
      console.log(`  Latency: ${result.metadata.latency}ms`);

    } catch (error) {
      console.error('[ERROR]:', error);
    }

    // Delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Show statistics
  console.log('\n' + '='.repeat(80));
  console.log('Session Statistics');
  console.log('='.repeat(80));

  const stats = agent.getStats();
  console.log(`Total Queries: ${stats.totalQueries}`);
  console.log(`Total Cost: $${stats.totalCost.toFixed(6)}`);
  console.log(`Average Cost: $${stats.averageCost.toFixed(6)}`);
  
  console.log('\nModel Usage:');
  Object.entries(stats.modelBreakdown).forEach(([model, count]) => {
    console.log(`  ${model}: ${count} queries`);
  });
}

main().catch(console.error);
