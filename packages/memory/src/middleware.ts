import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session constants (must match routes.ts)
const SESSION_COOKIE = 'memory_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/demo',
  '/api',
  '/_next',
  '/favicon.ico',
];

/**
 * Validate session token
 * Matches the logic in src/api/routes.ts
 */
function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const [timestamp] = token.split('.');
  const created = parseInt(timestamp, 10);
  if (isNaN(created)) return false;
  // Check if session is expired
  const age = (Date.now() - created) / 1000;
  return age < SESSION_MAX_AGE;
}

/**
 * Check if path is public (doesn't require auth)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const isValidSession = validateSession(sessionToken);

  // If no valid session, redirect to login
  if (!isValidSession) {
    const loginUrl = new URL('/login', request.url);
    // Store the original URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
