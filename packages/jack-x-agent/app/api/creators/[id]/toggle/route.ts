/**
 * API Route: Toggle Creator Status
 * PATCH /api/creators/[id]/toggle
 */

import { NextRequest, NextResponse } from 'next/server';
import { toggleCreatorStatus } from '@/lib/db/creators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const creator = await toggleCreatorStatus(id);

    return NextResponse.json({
      creator,
    });
  } catch (error) {
    console.error('Error toggling creator:', error);
    
    if (error instanceof Error && error.message === 'Creator not found') {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle creator' },
      { status: 500 }
    );
  }
}
