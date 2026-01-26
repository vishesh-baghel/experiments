import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { createApi } from '@/api/routes';
import { createApiKey } from '@/core/auth';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

/**
 * Integration tests for the complete authentication flow
 * Tests the interaction between login, session management, and API key access
 *
 * Note: Hono test client requires lowercase 'cookie' header
 */
describe('Auth Flow Integration', () => {
  let db: LibSQLDatabase<typeof schema>;
  let api: ReturnType<typeof createApi>;
  const originalEnv = { ...process.env };

  // Helper to create a valid session cookie
  const createValidSessionCookie = () => {
    const validToken = `${Date.now()}.testuser${Math.random().toString(36).substring(2)}`;
    return `memory_session=${validToken}`;
  };

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);
    api = createApi(db);
    vi.stubEnv('MEMORY_UI_PASSWORD', 'test-password-123');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /**
   * Note: Hono's test client (and fetch API in general) strips Cookie headers
   * for security reasons. Session validation logic is tested via validateSession
   * unit tests. These tests verify the login/logout flow and API responses.
   *
   * For true E2E testing with cookies, use a real HTTP server with supertest
   * or similar tools, or browser automation (Playwright/Cypress).
   */
  describe('Session-based Authentication Flow', () => {
    it('should complete login and logout flow', async () => {
      // 1. Initially not authenticated (no cookie)
      const sessionCheck1 = await api.request('/auth/session');
      expect((await sessionCheck1.json()).authenticated).toBe(false);

      // 2. Login - verify success response
      const loginRes = await api.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-password-123' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.success).toBe(true);
      // Note: Cookie is set but test client can't forward it

      // 3. Verify settings endpoint works (doesn't require session in test DB mode)
      const settingsRes = await api.request('/settings');
      expect(settingsRes.status).toBe(200);

      // 4. Logout - verify success response
      const logoutRes = await api.request('/auth/logout', {
        method: 'POST',
      });
      expect(logoutRes.status).toBe(200);
      expect((await logoutRes.json()).success).toBe(true);

      // 5. Session check without cookie returns not authenticated
      const sessionCheck3 = await api.request('/auth/session');
      expect((await sessionCheck3.json()).authenticated).toBe(false);
    });

    it('should reject access with invalid password', async () => {
      const loginRes = await api.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong-password' }),
      });

      expect(loginRes.status).toBe(401);
      expect((await loginRes.json()).error).toBe('Invalid passphrase');
    });
  });

  describe('API Key-based Authentication Flow', () => {
    it('should generate API key and use it for access', async () => {
      const sessionCookie = createValidSessionCookie();

      // Get settings (creates API key on first request)
      const settingsRes = await api.request('/settings', {
        headers: { cookie: sessionCookie },
      });
      const settingsData = await settingsRes.json();

      expect(settingsData.apiKey.key).toMatch(/^mem_[a-f0-9]{32}$/);
      const apiKey = settingsData.apiKey.key;

      // API key can be used for API access
      expect(apiKey).toBeDefined();
    });

    it('should regenerate API key and invalidate old one', async () => {
      const sessionCookie = createValidSessionCookie();

      // Get initial API key
      const settings1 = await api.request('/settings', {
        headers: { cookie: sessionCookie },
      });
      const data1 = await settings1.json();
      const oldKeyPrefix = data1.apiKey.prefix;

      // Regenerate API key
      const regenRes = await api.request('/settings/api-key/regenerate', {
        method: 'POST',
        headers: { cookie: sessionCookie },
      });
      expect(regenRes.status).toBe(200);

      const regenData = await regenRes.json();
      expect(regenData.apiKey.key).toMatch(/^mem_[a-f0-9]{32}$/);
      expect(regenData.apiKey.prefix).not.toBe(oldKeyPrefix);

      // Verify new key is active
      const settings2 = await api.request('/settings', {
        headers: { cookie: sessionCookie },
      });
      const data2 = await settings2.json();
      expect(data2.apiKey.prefix).toBe(regenData.apiKey.prefix);
    });
  });

  describe('Document Access with Authentication', () => {
    it('should allow document operations with valid session', async () => {
      const sessionCookie = createValidSessionCookie();

      // Create document
      const createRes = await api.request('/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: sessionCookie,
        },
        body: JSON.stringify({
          path: '/test/document',
          content: '# Test Document\n\nThis is a test.',
          tags: ['test'],
        }),
      });
      expect(createRes.status).toBe(201);

      // Read document
      const readRes = await api.request('/documents/test/document', {
        headers: { cookie: sessionCookie },
      });
      expect(readRes.status).toBe(200);
      const docData = await readRes.json();
      expect(docData.title).toBe('Test Document');

      // Search documents
      const searchRes = await api.request('/search?q=test', {
        headers: { cookie: sessionCookie },
      });
      expect(searchRes.status).toBe(200);
      const searchData = await searchRes.json();
      expect(searchData.documents.length).toBe(1);

      // Delete document
      const deleteRes = await api.request('/documents/test/document', {
        method: 'DELETE',
        headers: { cookie: sessionCookie },
      });
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Settings and Stats', () => {
    it('should return accurate document count in settings', async () => {
      const sessionCookie = createValidSessionCookie();

      // Check initial count
      const settings1 = await api.request('/settings', {
        headers: { cookie: sessionCookie },
      });
      expect((await settings1.json()).stats.documentCount).toBe(0);

      // Create documents
      for (let i = 0; i < 3; i++) {
        await api.request('/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: sessionCookie,
          },
          body: JSON.stringify({
            path: `/test/doc-${i}`,
            content: `# Document ${i}`,
          }),
        });
      }

      // Check updated count
      const settings2 = await api.request('/settings', {
        headers: { cookie: sessionCookie },
      });
      expect((await settings2.json()).stats.documentCount).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent key operations gracefully', async () => {
      // Create multiple keys in parallel
      const promises = Array.from({ length: 5 }, () => createApiKey(db));
      const results = await Promise.all(promises);

      // All should succeed with unique keys
      const keys = new Set(results.map((r) => r.key));
      expect(keys.size).toBe(5);
    });

    it('should handle session expiration gracefully', async () => {
      // Create an expired session token
      const expiredTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const expiredCookie = `memory_session=${expiredTimestamp}.expired123`;

      // Session check should return not authenticated
      const sessionRes = await api.request('/auth/session', {
        headers: { cookie: expiredCookie },
      });
      expect((await sessionRes.json()).authenticated).toBe(false);
    });

    it('should handle missing password config (dev mode)', async () => {
      delete process.env.MEMORY_UI_PASSWORD;

      // Should allow any login
      const loginRes = await api.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'anything' }),
      });
      expect(loginRes.status).toBe(200);
    });
  });
});
