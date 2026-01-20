import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { getCookie } from 'hono/cookie';
import { createApi, validateSession } from '@/api/routes';
import { cors, logger, apiKeyAuth, createErrorHandler } from '@/api/middleware';

// Create the main app
const app = new Hono().basePath('/api');

// Apply middleware
app.use('*', cors());
app.use('*', logger());

// Auth middleware: supports both API key and session cookie
app.use('*', async (c, next) => {
  const path = c.req.path;

  // Skip auth for auth endpoints
  if (path === '/api/auth/login' || path === '/api/auth/logout' || path === '/api/auth/session' || path === '/api/health') {
    await next();
    return;
  }

  // Check for API key first (for MCP/programmatic access)
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    const authMiddleware = apiKeyAuth();
    return authMiddleware(c, next);
  }

  // Check for session cookie (for UI access)
  const sessionToken = getCookie(c, 'memory_session');
  if (validateSession(sessionToken)) {
    await next();
    return;
  }

  // No valid auth found
  return c.json({ error: 'Authorization header required' }, 401);
});

// Mount the API routes
const api = createApi();
app.route('/', api);

// Error handler
app.onError(createErrorHandler());

// Export handlers for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
