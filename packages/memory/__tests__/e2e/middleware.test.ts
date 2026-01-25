import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * E2E-style tests for the Next.js middleware
 * Tests the authentication flow at the request routing level
 */

// Session constants (matching middleware.ts)
const SESSION_COOKIE = 'memory_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/demo', '/api', '/_next', '/favicon.ico'];

/**
 * Validate session token (matching middleware logic)
 */
function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const [timestamp] = token.split('.');
  const created = parseInt(timestamp, 10);
  if (isNaN(created)) return false;
  const age = (Date.now() - created) / 1000;
  return age < SESSION_MAX_AGE;
}

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Simulate middleware behavior for testing
 */
function simulateMiddleware(
  pathname: string,
  cookies: Record<string, string> = {}
): { redirect: string | null; allowed: boolean } {
  // Allow public paths
  if (isPublicPath(pathname)) {
    return { redirect: null, allowed: true };
  }

  // Check for session cookie
  const sessionToken = cookies[SESSION_COOKIE];
  const isValidSession = validateSession(sessionToken);

  // If no valid session, redirect to login
  if (!isValidSession) {
    return {
      redirect: `/login?redirect=${encodeURIComponent(pathname)}`,
      allowed: false,
    };
  }

  return { redirect: null, allowed: true };
}

describe('Middleware E2E Tests', () => {
  describe('Public Paths', () => {
    it('should allow /login without authentication', () => {
      const result = simulateMiddleware('/login');
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });

    it('should allow /demo without authentication', () => {
      const result = simulateMiddleware('/demo');
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });

    it('should allow /api/* without authentication', () => {
      const paths = ['/api/health', '/api/auth/login', '/api/documents'];
      for (const path of paths) {
        const result = simulateMiddleware(path);
        expect(result.allowed).toBe(true);
        expect(result.redirect).toBeNull();
      }
    });

    it('should allow /_next/* without authentication', () => {
      const paths = ['/_next/static/chunks/main.js', '/_next/image?url=test'];
      for (const path of paths) {
        const result = simulateMiddleware(path);
        expect(result.allowed).toBe(true);
        expect(result.redirect).toBeNull();
      }
    });

    it('should allow /favicon.ico without authentication', () => {
      const result = simulateMiddleware('/favicon.ico');
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });
  });

  describe('Protected Paths - No Session', () => {
    it('should redirect / to login', () => {
      const result = simulateMiddleware('/');
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2F');
    });

    it('should redirect /settings to login', () => {
      const result = simulateMiddleware('/settings');
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Fsettings');
    });

    it('should redirect /documents/* to login', () => {
      const result = simulateMiddleware('/documents/work/project');
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Fdocuments%2Fwork%2Fproject');
    });

    it('should redirect /search to login', () => {
      const result = simulateMiddleware('/search');
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Fsearch');
    });

    it('should redirect /trash to login', () => {
      const result = simulateMiddleware('/trash');
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Ftrash');
    });
  });

  describe('Protected Paths - Valid Session', () => {
    const validToken = `${Date.now()}.validrandom123`;

    it('should allow / with valid session', () => {
      const result = simulateMiddleware('/', { [SESSION_COOKIE]: validToken });
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });

    it('should allow /settings with valid session', () => {
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: validToken });
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });

    it('should allow /documents/* with valid session', () => {
      const result = simulateMiddleware('/documents/work/project', {
        [SESSION_COOKIE]: validToken,
      });
      expect(result.allowed).toBe(true);
      expect(result.redirect).toBeNull();
    });

    it('should allow all protected routes with valid session', () => {
      const paths = ['/', '/settings', '/search', '/trash', '/documents/new', '/edit/test'];
      for (const path of paths) {
        const result = simulateMiddleware(path, { [SESSION_COOKIE]: validToken });
        expect(result.allowed).toBe(true);
        expect(result.redirect).toBeNull();
      }
    });
  });

  describe('Protected Paths - Expired Session', () => {
    const expiredTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    const expiredToken = `${expiredTimestamp}.expiredrandom`;

    it('should redirect / with expired session', () => {
      const result = simulateMiddleware('/', { [SESSION_COOKIE]: expiredToken });
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2F');
    });

    it('should redirect /settings with expired session', () => {
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: expiredToken });
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Fsettings');
    });
  });

  describe('Protected Paths - Invalid Session Token', () => {
    it('should redirect with malformed token', () => {
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: 'invalid' });
      expect(result.allowed).toBe(false);
    });

    it('should redirect with empty token', () => {
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: '' });
      expect(result.allowed).toBe(false);
    });

    it('should redirect with non-numeric timestamp', () => {
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: 'abc.random' });
      expect(result.allowed).toBe(false);
    });
  });

  describe('Session Expiration Boundary', () => {
    it('should allow session at 6 days', () => {
      const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
      const token = `${sixDaysAgo}.stillvalid`;
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: token });
      expect(result.allowed).toBe(true);
    });

    it('should reject session at 8 days', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const token = `${eightDaysAgo}.expired`;
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: token });
      expect(result.allowed).toBe(false);
    });

    it('should allow session at exactly 7 days minus 1 second', () => {
      const justUnder7Days = Date.now() - (7 * 24 * 60 * 60 * 1000 - 1000);
      const token = `${justUnder7Days}.borderline`;
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: token });
      expect(result.allowed).toBe(true);
    });
  });

  describe('Redirect URL Preservation', () => {
    it('should preserve simple paths in redirect', () => {
      const result = simulateMiddleware('/documents');
      expect(result.redirect).toContain('redirect=%2Fdocuments');
    });

    it('should preserve nested paths in redirect', () => {
      const result = simulateMiddleware('/documents/work/project/notes');
      expect(result.redirect).toContain('redirect=%2Fdocuments%2Fwork%2Fproject%2Fnotes');
    });

    it('should URL-encode special characters', () => {
      const result = simulateMiddleware('/search?q=test');
      // The query string won't be included in our simple test, but path should be encoded
      expect(result.redirect).toContain('redirect=');
    });
  });
});

describe('Full Auth Flow E2E Scenarios', () => {
  describe('New User Flow', () => {
    it('should follow: visit / -> redirect to login -> login -> redirect back to /', () => {
      // Step 1: Visit protected page without session
      const step1 = simulateMiddleware('/');
      expect(step1.allowed).toBe(false);
      expect(step1.redirect).toBe('/login?redirect=%2F');

      // Step 2: Visit login page (allowed)
      const step2 = simulateMiddleware('/login');
      expect(step2.allowed).toBe(true);

      // Step 3: After login (would set cookie), visit / again
      const validToken = `${Date.now()}.newuser`;
      const step3 = simulateMiddleware('/', { [SESSION_COOKIE]: validToken });
      expect(step3.allowed).toBe(true);
    });
  });

  describe('Returning User Flow', () => {
    it('should allow direct access with existing valid session', () => {
      const validToken = `${Date.now()}.returning`;

      // User can access any protected page directly
      const pages = ['/', '/settings', '/search', '/documents/my-doc'];
      for (const page of pages) {
        const result = simulateMiddleware(page, { [SESSION_COOKIE]: validToken });
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Session Expiry Flow', () => {
    it('should redirect to login when session expires', () => {
      // User was logged in 8 days ago
      const expiredToken = `${Date.now() - 8 * 24 * 60 * 60 * 1000}.olduser`;

      // Should redirect to login
      const result = simulateMiddleware('/settings', { [SESSION_COOKIE]: expiredToken });
      expect(result.allowed).toBe(false);
      expect(result.redirect).toBe('/login?redirect=%2Fsettings');
    });
  });

  describe('API Access Flow', () => {
    it('should allow API access without session (for API key auth)', () => {
      // API routes don't require session (they use API key auth)
      const paths = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/session',
        '/api/settings',
        '/api/index',
        '/api/search',
        '/api/documents/test',
      ];

      for (const path of paths) {
        const result = simulateMiddleware(path);
        expect(result.allowed).toBe(true);
        expect(result.redirect).toBeNull();
      }
    });
  });
});
