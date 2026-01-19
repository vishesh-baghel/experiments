import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { getDb } from '@/db/client';
import { getDocumentIndex } from '@/core/index';
import { searchDocuments } from '@/core/search';
import { readDocument } from '@/core/read';
import { writeDocument } from '@/core/write';
import { deleteDocument, restoreDocument } from '@/core/delete';
import type * as schema from '@/db/schema';
import type { DocumentMetadata } from '@/db/schema';

// Schema for metadata values (string, number, or boolean)
const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const metadataSchema = z.record(metadataValueSchema);

type Env = {
  Variables: {
    db?: LibSQLDatabase<typeof schema>;
  };
};

/**
 * Create API routes with optional database override
 * Useful for testing with in-memory databases
 */
export function createApi(dbOverride?: LibSQLDatabase<typeof schema>) {
  const app = new Hono<Env>();

  // Middleware to set database from override or use singleton
  app.use('*', async (c, next) => {
    if (dbOverride) {
      c.set('db', dbOverride);
    }
    await next();
  });

  // Helper to get database from context or singleton
  const getDatabase = (c: { get: (key: 'db') => LibSQLDatabase<typeof schema> | undefined }) => {
    return c.get('db') || getDb();
  };

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Document index
  app.get(
    '/index',
    zValidator(
      'query',
      z.object({
        folder: z.string().optional(),
        source: z.string().optional(),
        type: z.string().optional(),
        tags: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      })
    ),
    async (c) => {
      const db = getDatabase(c);
      const query = c.req.valid('query');

      const result = await getDocumentIndex(db, {
        folder: query.folder,
        source: query.source,
        type: query.type,
        tags: query.tags ? query.tags.split(',') : undefined,
        limit: query.limit,
        offset: query.offset,
      });

      return c.json({
        documents: result.documents.map((doc) => ({
          path: doc.path,
          title: doc.title,
          tags: doc.tags,
          source: doc.source,
          type: doc.type,
          updatedAt: doc.updatedAt.toISOString(),
        })),
        folders: result.folders,
        tagCounts: result.tagCounts,
        total: result.total,
        latencyMs: result.latencyMs,
      });
    }
  );

  // Full-text search
  app.get(
    '/search',
    zValidator(
      'query',
      z.object({
        q: z.string().min(1),
        folder: z.string().optional(),
        tags: z.string().optional(),
        source: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      })
    ),
    async (c) => {
      const db = getDatabase(c);
      const query = c.req.valid('query');

      const result = await searchDocuments(db, {
        query: query.q,
        folder: query.folder,
        tags: query.tags ? query.tags.split(',') : undefined,
        source: query.source,
        limit: query.limit,
        offset: query.offset,
      });

      return c.json({
        documents: result.documents,
        total: result.total,
        latencyMs: result.latencyMs,
      });
    }
  );

  // Get folder tree
  app.get('/folders', async (c) => {
    const db = getDatabase(c);
    const result = await getDocumentIndex(db, { limit: 1000 });

    return c.json({
      folders: result.folders,
      latencyMs: result.latencyMs,
    });
  });

  // Get tag list with counts
  app.get('/tags', async (c) => {
    const db = getDatabase(c);
    const result = await getDocumentIndex(db, { limit: 1000 });

    return c.json({
      tags: result.tagCounts,
      latencyMs: result.latencyMs,
    });
  });

  // Read document by path
  app.get('/documents/:path{.*}', async (c) => {
    const db = getDatabase(c);
    const path = '/' + c.req.param('path');

    const result = await readDocument(db, path);

    if (!result) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json({
      path: result.path,
      title: result.title,
      content: result.content,
      tags: result.tags,
      metadata: result.metadata,
      source: result.source,
      type: result.type,
      version: result.version,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      latencyMs: result.latencyMs,
    });
  });

  // Create document
  app.post(
    '/documents',
    zValidator(
      'json',
      z.object({
        path: z.string().min(1),
        content: z.string().min(1),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        metadata: metadataSchema.optional(),
        source: z.string().optional(),
        type: z.string().optional(),
      })
    ),
    async (c) => {
      const db = getDatabase(c);
      const body = c.req.valid('json');

      const result = await writeDocument(db, {
        path: body.path,
        content: body.content,
        title: body.title,
        tags: body.tags,
        metadata: body.metadata,
        source: body.source,
        type: body.type,
      });

      return c.json(
        {
          path: result.path,
          version: result.version,
          previousVersion: result.previousVersion,
          action: result.action,
          latencyMs: result.latencyMs,
        },
        result.action === 'created' ? 201 : 200
      );
    }
  );

  // Update document by path
  app.put(
    '/documents/:path{.*}',
    zValidator(
      'json',
      z.object({
        content: z.string().min(1),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        metadata: metadataSchema.optional(),
        source: z.string().optional(),
        type: z.string().optional(),
      })
    ),
    async (c) => {
      const db = getDatabase(c);
      const path = '/' + c.req.param('path');
      const body = c.req.valid('json');

      const result = await writeDocument(db, {
        path,
        content: body.content,
        title: body.title,
        tags: body.tags,
        metadata: body.metadata,
        source: body.source,
        type: body.type,
      });

      return c.json({
        path: result.path,
        version: result.version,
        previousVersion: result.previousVersion,
        action: result.action,
        latencyMs: result.latencyMs,
      });
    }
  );

  // Delete document by path (soft delete)
  app.delete('/documents/:path{.*}', async (c) => {
    const db = getDatabase(c);
    const path = '/' + c.req.param('path');

    const result = await deleteDocument(db, path);

    if (!result.success) {
      return c.json({ error: result.error }, 404);
    }

    return c.json({
      path,
      action: result.action,
      latencyMs: result.latencyMs,
    });
  });

  // Restore soft-deleted document
  app.post('/documents/:path{.*}/restore', async (c) => {
    const db = getDatabase(c);
    const path = '/' + c.req.param('path');

    const result = await restoreDocument(db, path);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({
      path,
      action: result.action,
      latencyMs: result.latencyMs,
    });
  });

  return app;
}

// Default API instance for production use
export const api = createApi();

export default api;
