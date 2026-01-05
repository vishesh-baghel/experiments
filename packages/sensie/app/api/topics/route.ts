import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/topics
 * List all topics for current user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}

/**
 * POST /api/topics
 * Create a new topic (generates learning path)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}
