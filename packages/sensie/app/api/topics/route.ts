import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/auth';
import { getTopicsByUser, createTopic, countActiveTopics } from '@/lib/db/topics';
import type { TopicStatus } from '@prisma/client';

const MAX_ACTIVE_TOPICS = 3;

/**
 * GET /api/topics
 * List all topics for current user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    const authResult = requireAuth(session);
    if (!authResult.authorized || !session) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as TopicStatus | null;

    const topics = await getTopicsByUser(session.userId, status || undefined);

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/topics
 * Create a new topic (generates learning path)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    const authResult = requireAuth(session);
    if (!authResult.authorized || !session) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic name is required' },
        { status: 400 }
      );
    }

    // Check active topic limit for visitors
    if (session.role === 'visitor') {
      const activeCount = await countActiveTopics(session.userId);
      if (activeCount >= 1) {
        return NextResponse.json(
          { error: 'Visitors can only have 1 active topic. Complete or archive your current topic first.' },
          { status: 403 }
        );
      }
    }

    // Check active topic limit for owner (3 max)
    const activeCount = await countActiveTopics(session.userId);
    if (activeCount >= MAX_ACTIVE_TOPICS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ACTIVE_TOPICS} active topics allowed. Complete or archive a topic first.` },
        { status: 403 }
      );
    }

    const topic = await createTopic({
      userId: session.userId,
      name: name.trim(),
      description: description?.trim(),
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Create topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
