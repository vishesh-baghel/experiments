import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { apiKeyAuth, cors, logger, createErrorHandler } from '@/api/middleware';

describe('Middleware', () => {
  describe('apiKeyAuth', () => {
    let originalApiKey: string | undefined;

    beforeEach(() => {
      originalApiKey = process.env.MEMORY_API_KEY;
    });

    afterEach(() => {
      if (originalApiKey) {
        process.env.MEMORY_API_KEY = originalApiKey;
      } else {
        delete process.env.MEMORY_API_KEY;
      }
    });

    it('should allow requests when no API key is configured', async () => {
      delete process.env.MEMORY_API_KEY;

      const app = new Hono();
      app.use('*', apiKeyAuth());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      expect(res.status).toBe(200);
    });

    it('should reject requests without Authorization header', async () => {
      process.env.MEMORY_API_KEY = 'test-key';

      const app = new Hono();
      app.use('*', apiKeyAuth());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toContain('Authorization');
    });

    it('should reject requests with invalid API key', async () => {
      process.env.MEMORY_API_KEY = 'test-key';

      const app = new Hono();
      app.use('*', apiKeyAuth());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: { Authorization: 'wrong-key' },
      });
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toContain('Invalid');
    });

    it('should allow requests with valid API key', async () => {
      process.env.MEMORY_API_KEY = 'test-key';

      const app = new Hono();
      app.use('*', apiKeyAuth());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: { Authorization: 'test-key' },
      });
      expect(res.status).toBe(200);
    });

    it('should support Bearer token format', async () => {
      process.env.MEMORY_API_KEY = 'test-key';

      const app = new Hono();
      app.use('*', apiKeyAuth());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer test-key' },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('cors', () => {
    it('should handle OPTIONS preflight request', async () => {
      const app = new Hono();
      app.use('*', cors());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'OPTIONS' });
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should add CORS headers to responses', async () => {
      const app = new Hono();
      app.use('*', cors());
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('logger', () => {
    it('should log requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const app = new Hono();
      app.use('*', logger());
      app.get('/test', (c) => c.json({ success: true }));

      await app.request('/test');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/test'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('200'));

      consoleSpy.mockRestore();
    });
  });

  describe('createErrorHandler', () => {
    it('should catch and format errors', async () => {
      const app = new Hono();
      app.onError(createErrorHandler());
      app.get('/error', () => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await app.request('/error');
      consoleSpy.mockRestore();

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Test error');
    });

    it('should include stack in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

      const app = new Hono();
      app.onError(createErrorHandler());
      app.get('/error', () => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await app.request('/error');
      consoleSpy.mockRestore();

      const data = await res.json();
      expect(data.stack).toBeDefined();

      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    });

    it('should hide stack in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      const app = new Hono();
      app.onError(createErrorHandler());
      app.get('/error', () => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await app.request('/error');
      consoleSpy.mockRestore();

      const data = await res.json();
      expect(data.stack).toBeUndefined();

      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    });
  });
});
