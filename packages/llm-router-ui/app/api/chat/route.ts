import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { CustomerCareAgent } from '@/lib/customer-care-agent';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize agent with router
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

  // Use agent to get routing decision (checks cache internally)
  const agentResponse = await agent.handleQuery(userQuery, {
    preferCheaper: true,
  });

  const routing = agentResponse.routing;

  // If cache hit, return cached response in streaming format
  if (routing.cacheHit && agentResponse.response) {
    // Create a streaming response for cached content
    const stream = new ReadableStream({
      start(controller) {
        // Send the cached text
        controller.enqueue(new TextEncoder().encode(`0:"${agentResponse.response}"\n`));
        // Send finish event
        controller.enqueue(new TextEncoder().encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
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

  // Cache miss - get fresh response from LLM
  const model = getModelInstance(routing.provider, routing.model);

  // Add system prompt from agent
  const systemMessage = { role: 'system' as const, content: agent.getSystemPrompt() };
  const allMessages = [systemMessage, ...messages];

  // Track full response for caching
  let fullResponse = '';

  // Stream the response with routing metadata
  const result = streamText({
    model,
    messages: allMessages,
    onFinish: async ({ text, usage }) => {
      // Cache the response for future use
      const actualCost = (usage.promptTokens * 0.00000015) + (usage.completionTokens * 0.0000006);
      await agent.cacheResponse(userQuery, text, routing.model, actualCost, routing.provider);

      // Log routing decision and actual cost
      console.log('Routing:', {
        query: userQuery,
        complexity: routing.complexity,
        selectedModel: routing.model,
        provider: routing.provider,
        estimatedCost: routing.estimatedCost,
        actualCost,
        cacheHit: routing.cacheHit,
        tokensUsed: usage.totalTokens,
        cached: true, // Now cached for next time
      });
    },
  });

  // Add routing metadata to response headers
  return result.toDataStreamResponse({
    headers: {
      'X-Router-Model': routing.model,
      'X-Router-Provider': routing.provider,
      'X-Router-Complexity': routing.complexity,
      'X-Router-Cost': routing.estimatedCost.toString(),
      'X-Router-Cache-Hit': routing.cacheHit.toString(),
    },
  });
}

function getModelInstance(provider: string, modelName: string) {
  switch (provider) {
    case 'openai':
      return openai(modelName);
    case 'anthropic':
      return anthropic(modelName);
    default:
      // Fallback to GPT-4o-mini
      return openai('gpt-4o-mini');
  }
}
