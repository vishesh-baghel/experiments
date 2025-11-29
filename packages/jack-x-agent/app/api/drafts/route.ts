/**
 * Draft API Route
 * POST /api/drafts - Create a new draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

const CreateDraftSchema = z.object({
  outlineId: z.string(),
  content: z.string().min(1, 'Content cannot be empty'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outlineId, content } = CreateDraftSchema.parse(body);

    // Verify outline exists
    const outline = await prisma.outline.findUnique({
      where: { id: outlineId },
      include: { contentIdea: true },
    });

    if (!outline) {
      return NextResponse.json(
        { error: 'Outline not found' },
        { status: 404 }
      );
    }

    // Create draft
    const draft = await prisma.draft.create({
      data: {
        outlineId,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    console.error('Error creating draft:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
