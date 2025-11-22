/**
 * API Route: Mark Post as Good
 * PATCH /api/posts/[id]/mark-good
 */

import { NextRequest, NextResponse } from 'next/server';
import { markPostAsGood } from '@/lib/db/posts';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updatedPost = await markPostAsGood(id);

    return NextResponse.json({
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error marking post as good:', error);
    return NextResponse.json(
      { error: 'Failed to mark post as good' },
      { status: 500 }
    );
  }
}
