import type { Context, Next, MiddlewareHandler } from 'hono';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { validateApiKey, validateEnvApiKey } from '@/core/auth';
import type * as schema from '@/db/schema';

/**
 * API Key authentication middleware
 * Validates the Authorization header against MEMORY_API_KEY env var
 * (For backwards compatibility)
 */
export function apiKeyAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const envApiKey = process.env.MEMORY_API_KEY;

    // Skip auth if no API key is configured (development mode)
    if (!envApiKey) {
      await next();
      return;
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    // Support both "Bearer <token>" and "<token>" formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (token !== envApiKey) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    await next();
  };
}

/**
 * Database-backed API Key authentication middleware
 * Validates against stored API keys in the database
 */
export function apiKeyAuthWithDb(
  getDatabase: () => LibSQLDatabase<typeof schema>
): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    // Support both "Bearer <token>" and "<token>" formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    // First try env-based key (for backwards compatibility)
    if (validateEnvApiKey(token)) {
      await next();
      return;
    }

    // Then try database-backed key
    const db = getDatabase();
    const validKey = await validateApiKey(db, token);

    if (!validKey) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    await next();
  };
}

/**
 * CORS middleware for cross-origin requests
 */
export function cors(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    await next();

    // Add CORS headers to response
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  };
}

/**
 * Request logging middleware
 */
export function logger(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    console.log(`${method} ${path} ${status} ${duration}ms`);
  };
}

/**
 * Error handling middleware using Hono's onError
 * Use this with app.onError() instead of as middleware
 */
export function createErrorHandler() {
  return (err: Error, c: Context) => {
    console.error('Unhandled error:', err);

    return c.json(
      {
        error: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
      500
    );
  };
}
