import { CustomerCareAgent } from '@/lib/agent';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize agent with router (uses Redis-backed semantic cache)
const agent = new CustomerCareAgent(undefined, {
  useCache: true,
  useMLClassifier: true, // Use ML classifier for better accuracy
  enabledProviders: ['openai', 'anthropic'], // Only providers with API keys
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last user message for routing
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content;

  // Add system prompt to messages
  const systemMessage = { role: 'system' as const, content: agent.getSystemPrompt() };
  const allMessages = [systemMessage, ...messages];

  // Use agent to handle query with streaming (uses Mastra Agent + LLM Router)
  const result = await agent.handleQueryStream(userQuery, allMessages, {
    preferCheaper: true,
  });

  const routing = result.routing;

  // Log routing decision with full details
  console.log('Routing Decision:', {
    query: userQuery.substring(0, 80) + '...',
    complexity: routing.complexity,
    selectedModel: routing.model,
    provider: routing.provider,
    estimatedCost: routing.estimatedCost,
    cacheHit: routing.cacheHit,
  });
  
  // DEBUG: Log the actual routing object structure
  console.log('DEBUG - Full routing object:', JSON.stringify(routing, null, 2));
  console.log('DEBUG - routing.complexity type:', typeof routing.complexity);
  console.log('DEBUG - routing.complexity value:', routing.complexity);

  // If cache hit, return cached response instantly
  if (routing.cacheHit) {
    return new Response(result.stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Router-Cache-Hit': 'true',
        'X-Router-Model': routing.model,
        'X-Router-Provider': routing.provider,
        'X-Router-Complexity': routing.complexity,
        'X-Router-Cost': '0',
      },
    });
  }

  // Cache miss - stream fresh response from Mastra Agent
  // The stream is already in the correct format from our agent
  // Just add usage tracking
  result.usage.then((usage) => {
    const actualCost = (usage.inputTokens * 0.00000015) + (usage.outputTokens * 0.0000006);
    console.log('Response:', {
      tokensUsed: usage.totalTokens,
      actualCost,
      cached: true, // Now cached for next time
    });
  });

  // Return streaming response with routing metadata
  return new Response(result.stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Router-Model': routing.model,
      'X-Router-Provider': routing.provider,
      'X-Router-Complexity': routing.complexity,
      'X-Router-Cost': routing.estimatedCost.toString(),
      'X-Router-Cache-Hit': 'false',
    },
  });
}
