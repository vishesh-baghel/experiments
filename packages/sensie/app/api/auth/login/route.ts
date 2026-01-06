import { NextRequest, NextResponse } from 'next/server';
import { authenticateOwner, authenticateVisitor } from '@/lib/auth/auth';
import { createSession } from '@/lib/auth/session';

/**
 * POST /api/auth/login
 * Authenticate user with passphrase (owner) or create visitor session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { mode, passphrase } = body;

    if (mode === 'owner') {
      if (!passphrase) {
        return NextResponse.json(
          { error: 'Passphrase is required' },
          { status: 400 }
        );
      }

      const result = await authenticateOwner(passphrase);
      if (!result.success || !result.user) {
        return NextResponse.json(
          { error: result.error || 'Authentication failed' },
          { status: 401 }
        );
      }

      const session = await createSession(result.user.id, 'owner');
      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: 'owner',
        },
        session: {
          expiresAt: session.expiresAt,
        },
      });
    } else if (mode === 'visitor') {
      const result = await authenticateVisitor();
      if (!result.success || !result.user) {
        return NextResponse.json(
          { error: result.error || 'Failed to create visitor session' },
          { status: 500 }
        );
      }

      const session = await createSession(result.user.id, 'visitor');
      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: 'visitor',
        },
        session: {
          expiresAt: session.expiresAt,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid mode. Use "owner" or "visitor"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
