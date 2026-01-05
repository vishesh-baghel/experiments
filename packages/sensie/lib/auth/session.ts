import type { SessionData } from './auth';

/**
 * Session management using iron-session
 *
 * Sessions are encrypted and stored in cookies
 */

/**
 * Session options for iron-session
 */
export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || '',
  cookieName: 'sensie_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  role: 'owner' | 'visitor'
): Promise<SessionData> {
  throw new Error('Not implemented');
}

/**
 * Get current session from request
 */
export async function getSession(): Promise<SessionData | null> {
  throw new Error('Not implemented');
}

/**
 * Destroy current session (logout)
 */
export async function destroySession(): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Refresh session expiry
 */
export async function refreshSession(
  session: SessionData
): Promise<SessionData> {
  throw new Error('Not implemented');
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: SessionData): boolean {
  throw new Error('Not implemented');
}

/**
 * Get session expiry time
 */
export function getSessionExpiry(session: SessionData): Date {
  throw new Error('Not implemented');
}

/**
 * Session duration constants
 */
export const SESSION_DURATIONS = {
  OWNER: 60 * 60 * 24 * 7, // 1 week
  VISITOR: 60 * 60 * 24 * 1, // 1 day
};
