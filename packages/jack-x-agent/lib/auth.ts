/**
 * Authentication utilities
 * Simple localStorage-based auth for demo purposes
 */

import { cookies } from 'next/headers';

/**
 * Get current user ID from cookies (server-side)
 * Note: In Next.js 15+, this must be async
 */
export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    // Return a placeholder that will trigger client-side redirect
    return '';
  }
  
  return userId;
}

/**
 * Get current user ID (async version for server components)
 */
export async function getCurrentUserIdAsync(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    return '';
  }
  
  return userId;
}

/**
 * Set user session (client-side helper)
 */
export function setUserSession(userId: string, email: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    
    // Also set cookie for server-side access
    document.cookie = `userId=${userId}; path=/; max-age=2592000`; // 30 days
    document.cookie = `userEmail=${email}; path=/; max-age=2592000`;
  }
}

/**
 * Clear user session
 */
export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    
    // Clear cookies
    document.cookie = 'userId=; path=/; max-age=0';
    document.cookie = 'userEmail=; path=/; max-age=0';
  }
}

/**
 * Get user session (client-side)
 */
export function getUserSession() {
  if (typeof window !== 'undefined') {
    return {
      userId: localStorage.getItem('userId'),
      userEmail: localStorage.getItem('userEmail'),
    };
  }
  return { userId: null, userEmail: null };
}
