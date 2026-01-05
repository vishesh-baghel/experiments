import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/setup
 * First-time owner account setup
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}

/**
 * GET /api/auth/setup
 * Check if owner account exists
 */
export async function GET(): Promise<NextResponse> {
  throw new Error('Not implemented');
}
