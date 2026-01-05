import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/topics/[id]/start
 * Start a learning session for topic
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  throw new Error('Not implemented');
}
