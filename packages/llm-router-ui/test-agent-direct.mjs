// Test the agent directly without going through the API
import { CustomerCareAgent } from './lib/agent.ts';

const agent = new CustomerCareAgent(undefined, {
  useCache: false,
  useMLClassifier: true,
  enabledProviders: ['openai', 'anthropic'],
});

const query = 'My laptop is running slow after the latest update. What steps can I take to troubleshoot this issue?';
const messages = [
  { role: 'system', content: agent.getSystemPrompt() },
  { role: 'user', content: query }
];

console.log('Testing agent directly...\n');
console.log('Query:', query);

try {
  const result = await agent.handleQueryStream(query, messages, {
    preferCheaper: true,
  });

  console.log('\nRouting result:');
  console.log('- Complexity:', result.routing.complexity);
  console.log('- Model:', result.routing.model);
  console.log('- Provider:', result.routing.provider);
  console.log('- Cache hit:', result.routing.cacheHit);
  console.log('- Estimated cost:', result.routing.estimatedCost);

  // Cancel the stream
  await result.stream.cancel();
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
