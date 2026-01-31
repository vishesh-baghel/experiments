/**
 * API Route: Generate Post from Outline
 * POST /api/posts/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePost } from '@/lib/mastra/agent';
import { buildPostContext } from '@/lib/mastra/context';
import { getUserWithRelations } from '@/lib/db/users';
import { getGoodPostsForLearning } from '@/lib/db/posts';
import { getOutlineById } from '@/lib/db/outlines';
import { blockGuestWrite } from '@/lib/auth';

const RequestSchema = z.object({
  userId: z.string(),
  outlineId: z.string(),
});

export async function POST(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, outlineId } = RequestSchema.parse(body);

    // Start independent fetches in parallel
    const userPromise = getUserWithRelations(userId);
    const goodPostsPromise = getGoodPostsForLearning(userId, 10);
    const outlinePromise = getOutlineById(outlineId);

    // Wait for user first to check if exists (early return)
    const user = await userPromise;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Wait for outline
    const outline = await outlinePromise;
    if (!outline || !outline.contentIdea) {
      return NextResponse.json(
        { error: 'Outline not found' },
        { status: 404 }
      );
    }

    // Wait for good posts
    const goodPosts = await goodPostsPromise;

    // Parse outline sections from JSON
    const parsedOutline = {
      format: outline.format,
      sections: outline.sections as Array<{
        heading: string;
        keyPoints: string[];
        toneGuidance: string;
        examples: string[];
      }>,
      estimatedLength: outline.estimatedLength,
      toneReminders: Array.isArray(outline.toneReminders)
        ? outline.toneReminders as string[]
        : [],
    };

    // Build context
    const context = await buildPostContext(
      parsedOutline,
      {
        title: outline.contentIdea.title,
        description: outline.contentIdea.description,
        contentPillar: outline.contentIdea.contentPillar,
      },
      user,
      goodPosts
    );

    // Generate post using agent
    const generatedPost = await generatePost(userId, outlineId, context);

    return NextResponse.json({
      variations: generatedPost.variations,
    });
  } catch (error) {
    console.error('Error generating post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    // Handle structured output validation errors
    if (error instanceof Error) {
      if (error.message.includes('Structured output validation failed')) {
        console.error('Structured output validation failed for post generation.');

        return NextResponse.json(
          {
            error: 'Failed to generate valid post structure',
            details: error.message,
            hint: 'The AI generated content that does not match the required schema. Please try again.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate post', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    );
  }
}
