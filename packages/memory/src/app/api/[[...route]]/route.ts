import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createApi } from '@/api/routes';
import { cors, logger, apiKeyAuth, createErrorHandler } from '@/api/middleware';

// Create the main app
const app = new Hono().basePath('/api');

// Apply middleware
app.use('*', cors());
app.use('*', logger());

// API key auth for non-browser requests (check X-Requested-With header)
app.use('*', async (c, next) => {
  // Skip auth for browser requests (they'll use session auth later)
  const isXHR = c.req.header('X-Requested-With') === 'XMLHttpRequest';
  const acceptsHtml = c.req.header('Accept')?.includes('text/html');

  if (acceptsHtml && !isXHR) {
    // Browser request - skip API key auth (use session auth)
    await next();
    return;
  }

  // API request - require API key if configured
  const authMiddleware = apiKeyAuth();
  return authMiddleware(c, next);
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
