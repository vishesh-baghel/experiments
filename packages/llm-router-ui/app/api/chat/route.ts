import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { CustomerCareAgent } from '@/lib/customer-care-agent';

export const maxDuration = 30;

const agent = new CustomerCareAgent(undefined, {
  useCache: true,
  useMLClassifier: true,
  enabledProviders: ['openai', 'anthropic'],
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content;

  const agentResponse = await agent.handleQuery(userQuery, {
    preferCheaper: true,
  });

  const routing = agentResponse.routing;

  if (routing.cacheHit && agentResponse.response) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const text = agentResponse.response;
        
        controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
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

  const model = getModelInstance(routing.provider, routing.model);
  const systemMessage = { role: 'system' as const, content: agent.getSystemPrompt() };
  const allMessages = [systemMessage, ...messages];
  const result = streamText({
    model,
    messages: allMessages,
    onFinish: async ({ text, usage }) => {
      const actualCost = (usage.promptTokens * 0.00000015) + (usage.completionTokens * 0.0000006);
      await agent.cacheResponse(userQuery, text, routing.model, actualCost, routing.provider, routing.complexity);
      console.log('Routing:', {
        query: userQuery,
        complexity: routing.complexity,
        selectedModel: routing.model,
        provider: routing.provider,
        estimatedCost: routing.estimatedCost,
        actualCost,
        cacheHit: routing.cacheHit,
        tokensUsed: usage.totalTokens,
        cached: true
      });
    },
  });

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
      return openai('gpt-4o-mini');
  }
}
