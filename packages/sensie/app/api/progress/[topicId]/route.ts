import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

/**
 * GET /api/progress/[topicId]
 * Get progress for specific topic
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  throw new Error('Not implemented');
}
