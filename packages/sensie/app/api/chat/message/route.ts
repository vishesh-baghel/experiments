import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/auth';
import { getActiveSession, createSession, addMessage } from '@/lib/db/sessions';
import { getTopicById } from '@/lib/db/topics';
import { sensieAgent } from '@/lib/mastra/agents/sensie';
import { SENSIE_SYSTEM_PROMPT } from '@/lib/mastra/prompts';

/**
 * POST /api/chat/message
 * Send a message to Sensie and get a response
 * Uses Mastra's sensieAgent with streaming
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
        // AI SDK v6 uses 'parts' array, v4 uses 'content' string
        const messageContent = extractMessageContent(lastUserMessage);
        if (messageContent) {
          await addMessage({
            sessionId: learningSession.id,
            role: 'USER',
            content: messageContent,
          });
        }
      }
    }

    // Build context for Sensie
    const instructions = buildInstructions(topic?.name, topic?.masteryPercentage);

    // Capture sessionId for onFinish callback
    const sessionId = learningSession?.id;

    // Use Mastra's sensieAgent for streaming with AI SDK v6 compatible format
    // Use onFinish callback to save assistant response after streaming completes
    const stream = await sensieAgent.stream(messages, {
      instructions,
      format: 'aisdk',
      onFinish: async ({ text }) => {
        if (sessionId && text?.trim()) {
          try {
            console.log('[chat] Saving Sensie response:', text.substring(0, 100) + '...');
            await addMessage({
              sessionId,
              role: 'SENSIE',
              content: text.trim(),
            });
            console.log('[chat] Sensie response saved successfully');
          } catch (error) {
            console.error('[chat] Failed to save Sensie response:', error);
          }
        }
      },
    });

    // Return AI SDK v6 compatible streaming response
    return stream.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildInstructions(topicName?: string, mastery?: number): string {
  let prompt = SENSIE_SYSTEM_PROMPT;

  if (topicName) {
    prompt += `\n\nCurrent topic: ${topicName}`;
    if (typeof mastery === 'number') {
      prompt += `\nStudent's current mastery: ${mastery}%`;
    }
  }

  return prompt;
}

/**
 * Extract text content from message (supports both AI SDK v4 and v6 formats)
 * v4: { content: string }
 * v6: { parts: [{ type: 'text', text: string }, ...] }
 */
function extractMessageContent(message: {
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}): string | null {
  // AI SDK v6 format: parts array
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text)
      .join('');
    if (textParts) return textParts;
  }

  // AI SDK v4 format: content string
  if (typeof message.content === 'string') {
    return message.content;
  }

  return null;
}
