import { prisma } from './client';
import type { User, UserPreferences } from '@prisma/client';

/**
 * Create a new user
 */
export async function createUser(data: {
  username: string;
  password: string;
  isOwner?: boolean;
}): Promise<User> {
  throw new Error('Not implemented');
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  throw new Error('Not implemented');
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  throw new Error('Not implemented');
}

/**
 * Get the owner user (there should only be one)
 */
export async function getOwnerUser(): Promise<User | null> {
  throw new Error('Not implemented');
}

/**
 * Check if an owner already exists
 */
export async function ownerExists(): Promise<boolean> {
  throw new Error('Not implemented');
}

/**
 * Update user's visitor mode setting
 */
export async function updateVisitorMode(
  userId: string,
  allowVisitorMode: boolean
): Promise<User> {
  throw new Error('Not implemented');
}

/**
 * Get or create user preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  throw new Error('Not implemented');
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserPreferences> {
  throw new Error('Not implemented');
}
