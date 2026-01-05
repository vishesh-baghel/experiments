import type { User } from '@/lib/types';

/**
 * Core authentication logic
 *
 * Auth modes:
 * - Owner: Full access via passphrase (stored as bcrypt hash)
 * - Visitor: Limited access, no passphrase needed
 */

/**
 * Auth result returned from authentication
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Session data stored in iron-session
 */
export interface SessionData {
  userId: string;
  role: 'owner' | 'visitor';
  createdAt: number;
  expiresAt: number;
}

/**
 * Authenticate user with passphrase (owner mode)
 */
export async function authenticateOwner(passphrase: string): Promise<AuthResult> {
  throw new Error('Not implemented');
}

/**
 * Create or get visitor session
 */
export async function authenticateVisitor(): Promise<AuthResult> {
  throw new Error('Not implemented');
}

/**
 * Check if current user is the owner
 */
export function isOwner(session: SessionData | null): boolean {
  throw new Error('Not implemented');
}

/**
 * Check if current user is a visitor
 */
export function isVisitor(session: SessionData | null): boolean {
  throw new Error('Not implemented');
}

/**
 * Validate session is still valid
 */
export function isSessionValid(session: SessionData | null): boolean {
  throw new Error('Not implemented');
}

/**
 * Get user from session
 */
export async function getUserFromSession(
  session: SessionData
): Promise<User | null> {
  throw new Error('Not implemented');
}

/**
 * Setup owner account (first-time setup)
 */
export async function setupOwner(passphrase: string): Promise<AuthResult> {
  throw new Error('Not implemented');
}

/**
 * Check if owner account exists
 */
export async function hasOwnerAccount(): Promise<boolean> {
  throw new Error('Not implemented');
}

/**
 * Change owner passphrase
 */
export async function changePassphrase(
  currentPassphrase: string,
  newPassphrase: string
): Promise<{ success: boolean; error?: string }> {
  throw new Error('Not implemented');
}

/**
 * Require auth middleware helper
 */
export function requireAuth(
  session: SessionData | null,
  requiredRole?: 'owner' | 'visitor'
): { authorized: boolean; error?: string } {
  throw new Error('Not implemented');
}
