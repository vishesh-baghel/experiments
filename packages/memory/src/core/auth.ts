import { eq, isNull, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { createHash, randomBytes } from 'crypto';
import { apiKeys, type ApiKey } from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Generate a secure random API key
 * Format: mem_<32 random hex characters>
 */
export function generateApiKey(): { key: string; prefix: string } {
  const randomPart = randomBytes(16).toString('hex');
  const key = `mem_${randomPart}`;
  const prefix = key.substring(0, 12); // "mem_" + first 8 chars
  return { key, prefix };
}

/**
 * Hash an API key for storage
 * We store the hash, not the plaintext key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Get the current active API key for display (returns prefix only)
 */
export async function getActiveApiKey(
  db: LibSQLDatabase<typeof schema>
): Promise<{ id: string; prefix: string; name: string; createdAt: Date } | null> {
  const result = await db
    .select({
      id: apiKeys.id,
      prefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(isNull(apiKeys.revokedAt))
    .orderBy(apiKeys.createdAt)
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return {
    id: result[0].id,
    prefix: result[0].prefix,
    name: result[0].name,
    createdAt: result[0].createdAt,
  };
}

/**
 * Create a new API key
 * Returns the full key (only shown once) and stores the hash
 */
export async function createApiKey(
  db: LibSQLDatabase<typeof schema>,
  name: string = 'Default'
): Promise<{ id: string; key: string; prefix: string; createdAt: Date }> {
  const { key, prefix } = generateApiKey();
  const hashedKey = hashApiKey(key);
  const id = randomBytes(8).toString('hex');
  const now = new Date();

  await db.insert(apiKeys).values({
    id,
    key: hashedKey,
    keyPrefix: prefix,
    name,
    createdAt: now,
  });

  return { id, key, prefix, createdAt: now };
}

/**
 * Regenerate API key - revokes all existing keys and creates a new one
 * Returns the new key (only shown once)
 */
export async function regenerateApiKey(
  db: LibSQLDatabase<typeof schema>,
  name: string = 'Default'
): Promise<{ id: string; key: string; prefix: string; createdAt: Date }> {
  const now = new Date();

  // Revoke all existing active keys
  await db
    .update(apiKeys)
    .set({ revokedAt: now })
    .where(isNull(apiKeys.revokedAt));

  // Create new key
  return createApiKey(db, name);
}

/**
 * Validate an API key against stored hashes
 * Returns the key record if valid, null otherwise
 */
export async function validateApiKey(
  db: LibSQLDatabase<typeof schema>,
  key: string
): Promise<ApiKey | null> {
  const hashedKey = hashApiKey(key);

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, hashedKey), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, result[0].id));

  return result[0];
}

/**
 * Get or create API key
 * If no active key exists, creates one
 * Returns the prefix for display (never returns the full key after creation)
 */
export async function getOrCreateApiKey(
  db: LibSQLDatabase<typeof schema>
): Promise<{
  id: string;
  prefix: string;
  name: string;
  createdAt: Date;
  isNew: boolean;
  key?: string; // Only present if newly created
}> {
  const existing = await getActiveApiKey(db);

  if (existing) {
    return { ...existing, isNew: false };
  }

  // Create new key
  const newKey = await createApiKey(db);
  return {
    id: newKey.id,
    prefix: newKey.prefix,
    name: 'Default',
    createdAt: newKey.createdAt,
    isNew: true,
    key: newKey.key, // Return full key only on creation
  };
}

/**
 * Check if the provided key matches the environment variable
 * (Fallback for backwards compatibility)
 */
export function validateEnvApiKey(key: string): boolean {
  const envKey = process.env.MEMORY_API_KEY;
  if (!envKey) return false;
  return key === envKey;
}
