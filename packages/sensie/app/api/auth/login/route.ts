import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Authenticate user with passphrase (owner) or create visitor session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}
