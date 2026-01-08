import { NextRequest } from 'next/server';
import { streamText, convertToCoreMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/auth';
import { getActiveSession, createSession, addMessage } from '@/lib/db/sessions';
import { getTopicById } from '@/lib/db/topics';
import { SENSIE_SYSTEM_PROMPT } from '@/lib/mastra/prompts';

// Create Vercel AI Gateway client if configured
const aiGateway = process.env.AI_GATEWAY_API_KEY
  ? createOpenAI({
      baseURL: 'https://gateway.ai.cloudflare.com/v1/vercel/vercel-ai-gateway',
      apiKey: process.env.AI_GATEWAY_API_KEY,
    })
  : null;

// Get the model to use - AI Gateway or direct Anthropic
function getModel() {
  if (aiGateway) {
    return aiGateway('anthropic/claude-sonnet-4-20250514');
  }
  return anthropic('claude-sonnet-4-20250514');
}

/**
 * POST /api/chat/message
 * Send a message to Sensie and get a response
 * Handles: regular messages, commands, answers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const authResult = requireAuth(session);
    if (!authResult.authorized || !session) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, topicId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create learning session if topicId provided
    let learningSession = null;
    let topic = null;

    if (topicId) {
      topic = await getTopicById(topicId);
      if (!topic || topic.userId !== session.userId) {
        return new Response(JSON.stringify({ error: 'Topic not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      learningSession = await getActiveSession(topicId);
      if (!learningSession) {
        learningSession = await createSession({
          userId: session.userId,
          topicId,
        });
      }

      // Store user message
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'user') {
        await addMessage({
          sessionId: learningSession.id,
          role: 'USER',
          content: lastUserMessage.content,
        });
      }
    }

    // Build context for Sensie
    const systemPrompt = buildSystemPrompt(topic?.name, topic?.masteryPercentage);

    // Stream response using AI SDK (uses AI Gateway if configured)
    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildSystemPrompt(topicName?: string, mastery?: number): string {
  let prompt = SENSIE_SYSTEM_PROMPT;

  if (topicName) {
    prompt += `\n\nCurrent topic: ${topicName}`;
    if (typeof mastery === 'number') {
      prompt += `\nStudent's current mastery: ${mastery}%`;
    }
  }

  return prompt;
}
