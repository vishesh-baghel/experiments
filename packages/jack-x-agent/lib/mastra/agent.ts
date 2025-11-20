/**
 * Jack Mastra Agent
 * Embedded agent for content idea and outline generation
 */

import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  JACK_SYSTEM_PROMPT,
  IDEA_GENERATION_PROMPT,
  OUTLINE_GENERATION_PROMPT,
} from './prompts';
import {
  ContentIdeaSchema,
  ContentOutlineSchema,
  IdeaContextSchema,
  OutlineContextSchema,
} from './schemas';
import { createIdeaTrace, createOutlineTrace } from '@/lib/observability/langfuse';

/**
 * Jack Agent Configuration
 */
export const jackAgent = new Agent({
  name: 'jack',
  instructions: JACK_SYSTEM_PROMPT,
  model: openai('gpt-4o', {
    structuredOutputs: true,
  }),
});

/**
 * Generate content ideas
 */
export async function generateIdeas(
  userId: string,
  context: z.infer<typeof IdeaContextSchema>,
  recentIdeas: Array<{ title: string; contentPillar: string; status: string }> = []
) {
  const trace = createIdeaTrace(userId);

  try {
    const span = trace.span({
      name: 'generate-ideas',
      input: context,
    });

    const result = await jackAgent.generate(IDEA_GENERATION_PROMPT, {
      schema: z.object({
        ideas: z.array(ContentIdeaSchema),
      }),
      context: {
        topics: context.topics.map((t) => `${t.name} (${t.mentions} mentions)`).join(', '),
        projects: context.projects.map((p) => `${p.name}: ${p.description}`).join('\n'),
        toneConfig: JSON.stringify(context.tone, null, 2),
        learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
        goodPosts: context.goodPosts
          .map((p) => `[${p.pillar}] ${p.content.substring(0, 100)}...`)
          .join('\n\n'),
        recentIdeas: recentIdeas
          .map((idea) => `[${idea.status}] ${idea.contentPillar}: ${idea.title}`)
          .join('\n'),
      },
    });

    span.end({
      output: result,
    });

    await trace.finalize();

    return result.object.ideas;
  } catch (error) {
    trace.update({
      level: 'ERROR',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    await trace.finalize();
    throw error;
  }
}

/**
 * Generate outline for a content idea
 */
export async function generateOutline(
  userId: string,
  context: z.infer<typeof OutlineContextSchema>
) {
  const trace = createOutlineTrace(userId, context.idea.title);

  try {
    const span = trace.span({
      name: 'generate-outline',
      input: context,
    });

    const result = await jackAgent.generate(OUTLINE_GENERATION_PROMPT, {
      schema: ContentOutlineSchema,
      context: {
        idea: JSON.stringify(context.idea, null, 2),
        format: context.idea.suggestedFormat,
        toneConfig: JSON.stringify(context.tone, null, 2),
        learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
        goodPosts: context.goodPosts
          .map((p) => `[${p.pillar}] ${p.content.substring(0, 100)}...`)
          .join('\n\n'),
        avgPostLength: String(context.tone.learnedPatterns?.avgPostLength || 180),
      },
    });

    span.end({
      output: result,
    });

    await trace.finalize();

    return result.object;
  } catch (error) {
    trace.update({
      level: 'ERROR',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    await trace.finalize();
    throw error;
  }
}
