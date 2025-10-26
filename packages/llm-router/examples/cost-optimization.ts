/**
 * Example: Cost Optimization Strategies
 * 
 * This example demonstrates different cost optimization approaches
 */

import { LLMRouter } from '../src/router';
import { CustomerCareAgent } from '../src/agent/customer-care-agent';

async function main() {
  const router = new LLMRouter();
  const agent = new CustomerCareAgent();

  const testQuery = 'Explain the difference between your service plans and help me choose the best one for my needs';

  console.log('Cost Optimization Strategies\n');
  console.log(`Test Query: "${testQuery}"\n`);

  // Strategy 1: Default (balanced quality and cost)
  console.log('=== Strategy 1: Default Routing ===');
  const defaultRouting = await router.routeQuery(testQuery);
  console.log(`Model: ${defaultRouting.displayName}`);
  console.log(`Estimated Cost: $${defaultRouting.estimatedCost.total.toFixed(6)}`);

  // Strategy 2: Prefer cheaper models
  console.log('\n=== Strategy 2: Prefer Cheaper Models ===');
  const cheapRouting = await router.routeQuery(testQuery, {
    preferCheaper: true,
  });
  console.log(`Model: ${cheapRouting.displayName}`);
  console.log(`Estimated Cost: $${cheapRouting.estimatedCost.total.toFixed(6)}`);
  
  const savings1 = ((defaultRouting.estimatedCost.total - cheapRouting.estimatedCost.total) / defaultRouting.estimatedCost.total * 100);
  console.log(`Savings: ${savings1.toFixed(1)}%`);

  // Strategy 3: Budget constraint
  console.log('\n=== Strategy 3: Budget Constraint ($0.001 max) ===');
  const budgetRouting = await router.routeQuery(testQuery, {
    maxCostPerQuery: 0.001,
  });
  console.log(`Model: ${budgetRouting.displayName}`);
  console.log(`Estimated Cost: $${budgetRouting.estimatedCost.total.toFixed(6)}`);

  // Strategy 4: Compare all models
  console.log('\n=== Strategy 4: Full Cost Comparison ===');
  const comparison = await router.compareCosts(testQuery);
  
  console.log('All models sorted by cost:');
  comparison
    .sort((a, b) => a.cost - b.cost)
    .forEach((item, index) => {
      const badge = index === 0 ? '[BEST] ' : index === comparison.length - 1 ? '[EXPENSIVE] ' : '        ';
      console.log(`${badge}${item.model.padEnd(25)} ${item.formatted}`);
    });

  const cheapest = comparison[0];
  const mostExpensive = comparison[comparison.length - 1];
  const maxSavings = ((mostExpensive.cost - cheapest.cost) / mostExpensive.cost * 100);
  
  console.log(`\n[INFO] Maximum possible savings: ${maxSavings.toFixed(1)}%`);
  console.log(`   (${cheapest.model} vs ${mostExpensive.model})`);

  // Strategy 5: Real-world test
  console.log('\n=== Strategy 5: Real Execution Test ===');
  console.log('Testing with actual API calls...\n');
  
  const result = await agent.handleQuery(testQuery, {
    preferCheaper: true,
  });

  console.log('Results:');
  console.log(`  Model Used: ${result.metadata.modelUsed}`);
  console.log(`  Actual Cost: $${result.metadata.actualCost.toFixed(6)}`);
  console.log(`  Estimated Cost: $${result.metadata.estimatedCost.toFixed(6)}`);
  console.log(`  Accuracy: ${((result.metadata.actualCost / result.metadata.estimatedCost) * 100).toFixed(1)}%`);
  console.log(`  Savings vs Expensive: ${result.metadata.costSavings?.percentage.toFixed(1)}%`);

  console.log('\nCost optimization complete!');
}

main().catch(console.error);
