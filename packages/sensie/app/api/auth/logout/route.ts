import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Destroy current session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}
