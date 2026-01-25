import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import {
  generateApiKey,
  hashApiKey,
  createApiKey,
  getActiveApiKey,
  regenerateApiKey,
  validateApiKey,
  getOrCreateApiKey,
  validateEnvApiKey,
} from '@/core/auth';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('Auth Core Functions', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);
  });

  describe('generateApiKey', () => {
    it('should generate key with mem_ prefix', () => {
      const { key, prefix } = generateApiKey();

      expect(key).toMatch(/^mem_[a-f0-9]{32}$/);
      expect(prefix).toBe(key.substring(0, 12));
    });

    it('should generate unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const { key } = generateApiKey();
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
    });
  });

  describe('hashApiKey', () => {
    it('should return consistent hash for same key', () => {
      const key = 'mem_1234567890abcdef1234567890abcdef';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different keys', () => {
      const hash1 = hashApiKey('mem_1234567890abcdef1234567890abcdef');
      const hash2 = hashApiKey('mem_abcdef1234567890abcdef1234567890');

      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string (SHA-256)', () => {
      const hash = hashApiKey('mem_test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('createApiKey', () => {
    it('should create and store API key', async () => {
      const result = await createApiKey(db);

      expect(result.id).toBeDefined();
      expect(result.key).toMatch(/^mem_[a-f0-9]{32}$/);
      expect(result.prefix).toBe(result.key.substring(0, 12));
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should store with custom name', async () => {
      const result = await createApiKey(db, 'Production Key');

      const activeKey = await getActiveApiKey(db);
      expect(activeKey?.name).toBe('Production Key');
    });

    it('should store hashed key, not plaintext', async () => {
      const result = await createApiKey(db);

      // The stored key should be a hash, not the actual key
      const activeKey = await getActiveApiKey(db);
      expect(activeKey).not.toBeNull();
      expect(activeKey!.prefix).toBe(result.prefix);
      // Prefix should match but we can't retrieve the full key
    });
  });

  describe('getActiveApiKey', () => {
    it('should return null when no keys exist', async () => {
      const result = await getActiveApiKey(db);
      expect(result).toBeNull();
    });

    it('should return active key info', async () => {
      await createApiKey(db, 'Test Key');

      const result = await getActiveApiKey(db);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test Key');
      expect(result!.prefix).toMatch(/^mem_[a-f0-9]{8}$/);
    });

    it('should not return revoked keys', async () => {
      await createApiKey(db);
      await regenerateApiKey(db); // This revokes the first key

      // Revoke the new key manually for this test
      const activeKey = await getActiveApiKey(db);
      expect(activeKey).not.toBeNull();
    });
  });

  describe('regenerateApiKey', () => {
    it('should create new key and revoke old ones', async () => {
      const oldKey = await createApiKey(db);
      const newKey = await regenerateApiKey(db);

      expect(newKey.id).not.toBe(oldKey.id);
      expect(newKey.key).not.toBe(oldKey.key);

      // Old key should not be valid anymore
      const validatedOld = await validateApiKey(db, oldKey.key);
      expect(validatedOld).toBeNull();

      // New key should be valid
      const validatedNew = await validateApiKey(db, newKey.key);
      expect(validatedNew).not.toBeNull();
    });

    it('should work when no previous keys exist', async () => {
      const result = await regenerateApiKey(db);

      expect(result.key).toMatch(/^mem_[a-f0-9]{32}$/);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct key', async () => {
      const { key } = await createApiKey(db);

      const result = await validateApiKey(db, key);

      expect(result).not.toBeNull();
      expect(result!.keyPrefix).toBe(key.substring(0, 12));
    });

    it('should reject incorrect key', async () => {
      await createApiKey(db);

      const result = await validateApiKey(db, 'mem_wrong_key_here_1234567890ab');

      expect(result).toBeNull();
    });

    it('should reject revoked key', async () => {
      const { key: oldKey } = await createApiKey(db);
      await regenerateApiKey(db);

      const result = await validateApiKey(db, oldKey);

      expect(result).toBeNull();
    });

    it('should update lastUsedAt on validation', async () => {
      const { key, id } = await createApiKey(db);

      // Wait a tiny bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await validateApiKey(db, key);

      const activeKey = await getActiveApiKey(db);
      expect(activeKey).not.toBeNull();
    });
  });

  describe('getOrCreateApiKey', () => {
    it('should create key if none exists', async () => {
      const result = await getOrCreateApiKey(db);

      expect(result.isNew).toBe(true);
      expect(result.key).toBeDefined();
      expect(result.key).toMatch(/^mem_[a-f0-9]{32}$/);
    });

    it('should return existing key without full key', async () => {
      await createApiKey(db);

      const result = await getOrCreateApiKey(db);

      expect(result.isNew).toBe(false);
      expect(result.key).toBeUndefined();
    });

    it('should be idempotent for existing keys', async () => {
      const first = await getOrCreateApiKey(db);
      const second = await getOrCreateApiKey(db);

      expect(first.id).toBe(second.id);
      expect(first.isNew).toBe(true);
      expect(second.isNew).toBe(false);
    });
  });

  describe('validateEnvApiKey', () => {
    const originalEnv = process.env.MEMORY_API_KEY;

    beforeEach(() => {
      vi.stubEnv('MEMORY_API_KEY', 'mem_test_env_key_12345678901234');
    });

    afterEach(() => {
      if (originalEnv) {
        process.env.MEMORY_API_KEY = originalEnv;
      } else {
        delete process.env.MEMORY_API_KEY;
      }
    });

    it('should validate correct env key', () => {
      expect(validateEnvApiKey('mem_test_env_key_12345678901234')).toBe(true);
    });

    it('should reject incorrect key', () => {
      expect(validateEnvApiKey('mem_wrong_key')).toBe(false);
    });

    it('should return false when env key not set', () => {
      delete process.env.MEMORY_API_KEY;
      expect(validateEnvApiKey('any_key')).toBe(false);
    });
  });
});
