/**
 * Example: Basic Router Usage
 * 
 * This example shows how to use the LLM Router directly
 * to analyze queries and get routing decisions
 */

import { LLMRouter } from '../src/router';

async function main() {
  const router = new LLMRouter();

  // Example 1: Route a simple query
  console.log('\n=== Example 1: Simple Query ===');
  const simpleQuery = 'What are your business hours?';
  const simpleRouting = await router.routeQuery(simpleQuery);
  
  console.log('Query:', simpleQuery);
  console.log('Complexity:', simpleRouting.complexity.level);
  console.log('Selected Model:', simpleRouting.displayName);
  console.log('Estimated Cost:', `$${simpleRouting.estimatedCost.total.toFixed(6)}`);
  console.log('Reasoning:', simpleRouting.reasoning);

  // Example 2: Route a complex query
  console.log('\n=== Example 2: Complex Query ===');
  const complexQuery = 'Explain how OAuth2 authentication works and help me implement it in my Node.js application';
  const complexRouting = await router.routeQuery(complexQuery);
  
  console.log('Query:', complexQuery);
  console.log('Complexity:', complexRouting.complexity.level);
  console.log('Selected Model:', complexRouting.displayName);
  console.log('Estimated Cost:', `$${complexRouting.estimatedCost.total.toFixed(6)}`);

  // Example 3: Route with options
  console.log('\n=== Example 3: With Budget Constraint ===');
  const routingWithBudget = await router.routeQuery(complexQuery, {
    maxCostPerQuery: 0.001, // Max $0.001 per query
    preferCheaper: true,
  });
  
  console.log('Selected Model:', routingWithBudget.displayName);
  console.log('Estimated Cost:', `$${routingWithBudget.estimatedCost.total.toFixed(6)}`);

  // Example 4: Force specific provider
  console.log('\n=== Example 4: Force Provider ===');
  const anthropicRouting = await router.routeQuery(complexQuery, {
    forceProvider: 'anthropic',
  });
  
  console.log('Selected Model:', anthropicRouting.displayName);
  console.log('Provider:', anthropicRouting.provider);

  // Example 5: Compare costs across models
  console.log('\n=== Example 5: Cost Comparison ===');
  const costComparison = await router.compareCosts(complexQuery);
  console.log('\nCost estimates for query:');
  costComparison.forEach((item) => {
    console.log(`  ${item.model.padEnd(25)} ${item.formatted}`);
  });
}

main().catch(console.error);
