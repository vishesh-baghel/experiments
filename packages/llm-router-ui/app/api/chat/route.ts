import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { CustomerCareAgent } from '@/lib/customer-care-agent';
import { createClient } from 'redis';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Cache data structure
interface CachedResponse {
  response: string;
  model: string;
  provider: string;
  complexity: string;
  timestamp: number;
}

// Initialize Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    redisClient.on('error', (err) => console.error('[Redis] Client Error:', err));
    
    await redisClient.connect();
    console.log('[Redis] Connected successfully');
  }
  return redisClient;
}

// Simple persistent cache using Redis
const persistentCache = {
  async get(query: string): Promise<CachedResponse | null> {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(`llm-cache:${query}`);
      if (!cached) return null;
      return JSON.parse(cached) as CachedResponse;
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      return null;
    }
  },
  async set(query: string, data: CachedResponse): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.setEx(`llm-cache:${query}`, 86400, JSON.stringify(data)); // 24h TTL
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }
};

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

  // Check Vercel KV cache first (persistent across deployments)
  const kvCached = await persistentCache.get(userQuery);
  if (kvCached) {
    console.log('[Cache] KV cache hit!');
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const text = kvCached.response;
        const chunkSize = 50;
        
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        }
        
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Router-Cache-Hit': 'true',
        'X-Router-Model': kvCached.model,
        'X-Router-Provider': kvCached.provider,
        'X-Router-Complexity': kvCached.complexity,
        'X-Router-Cost': '0',
      },
    });
  }

  // Use agent to get routing decision (checks in-memory cache)
  const agentResponse = await agent.handleQuery(userQuery, {
    preferCheaper: true,
  });

  const routing = agentResponse.routing;

  // If in-memory cache hit, return cached response in streaming format
  if (routing.cacheHit && agentResponse.response) {
    // Create a streaming response for cached content in AI SDK format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Split response into chunks for streaming effect
        const text = agentResponse.response;
        const chunkSize = 50;
        
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          // AI SDK text stream format
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        }
        
        // Send finish event
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

  // Cache miss - get fresh response from LLM
  const model = getModelInstance(routing.provider, routing.model);

  // Add system prompt from agent
  const systemMessage = { role: 'system' as const, content: agent.getSystemPrompt() };
  const allMessages = [systemMessage, ...messages];


  // Stream the response with routing metadata
  const result = streamText({
    model,
    messages: allMessages,
    onFinish: async ({ text, usage }) => {
      // Cache the response in both in-memory and Vercel KV
      const actualCost = (usage.promptTokens * 0.00000015) + (usage.completionTokens * 0.0000006);
      
      // In-memory cache (for local dev)
      await agent.cacheResponse(userQuery, text, routing.model, actualCost, routing.provider, routing.complexity);
      
      // Vercel KV cache (for production persistence)
      await persistentCache.set(userQuery, {
        response: text,
        model: routing.model,
        provider: routing.provider,
        complexity: routing.complexity,
        timestamp: Date.now(),
      });

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
