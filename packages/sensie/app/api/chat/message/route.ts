import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat/message
 * Send a message to Sensie and get a response
 * Handles: regular messages, commands, answers
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  throw new Error('Not implemented');
}
