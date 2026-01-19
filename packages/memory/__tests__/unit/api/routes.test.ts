import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { writeDocument } from '@/core/write';
import { createApi } from '@/api/routes';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('API Routes', () => {
  let db: LibSQLDatabase<typeof schema>;
  let api: ReturnType<typeof createApi>;

  beforeEach(async () => {
    // Create fresh test database
    db = createTestDb();
    await initializeSchema(db);

    // Create API with test database
    api = createApi(db);

    // Seed test data
    await writeDocument(db, {
      path: '/work/project-alpha',
      content: '# Project Alpha\n\nA TypeScript project.',
      tags: ['typescript', 'work'],
      source: 'manual',
      type: 'spec',
    });

    await writeDocument(db, {
      path: '/work/project-beta',
      content: '# Project Beta\n\nA React application.',
      tags: ['react', 'work'],
      source: 'claude-code',
      type: 'note',
    });

    await writeDocument(db, {
      path: '/personal/journal',
      content: '# Daily Journal\n\nToday was productive.',
      tags: ['personal', 'journal'],
      source: 'manual',
      type: 'note',
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await api.request('/health');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('GET /index', () => {
    it('should return document index', async () => {
      const res = await api.request('/index');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(3);
      expect(data.total).toBe(3);
      expect(data.folders).toContain('/work');
      expect(data.folders).toContain('/personal');
    });

    it('should filter by folder', async () => {
      const res = await api.request('/index?folder=/work');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(2);
    });

    it('should filter by tags', async () => {
      const res = await api.request('/index?tags=typescript');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(1);
    });

    it('should respect limit', async () => {
      const res = await api.request('/index?limit=1');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(1);
      expect(data.total).toBe(3);
    });
  });

  describe('GET /search', () => {
    it('should search documents', async () => {
      const res = await api.request('/search?q=TypeScript');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(1);
      expect(data.documents[0].path).toBe('/work/project-alpha');
    });

    it('should return error for missing query', async () => {
      const res = await api.request('/search');

      expect(res.status).toBe(400);
    });

    it('should filter by folder', async () => {
      const res = await api.request('/search?q=*&folder=/personal');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.length).toBe(1);
      expect(data.documents[0].path).toBe('/personal/journal');
    });
  });

  describe('GET /folders', () => {
    it('should return folder tree', async () => {
      const res = await api.request('/folders');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.folders).toContain('/work');
      expect(data.folders).toContain('/personal');
    });
  });

  describe('GET /tags', () => {
    it('should return tag counts', async () => {
      const res = await api.request('/tags');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.tags['work']).toBe(2);
      expect(data.tags['typescript']).toBe(1);
    });
  });

  describe('GET /documents/*', () => {
    it('should read document by path', async () => {
      const res = await api.request('/documents/work/project-alpha');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.title).toBe('Project Alpha');
      expect(data.content).toContain('TypeScript');
      expect(data.tags).toContain('typescript');
    });

    it('should return 404 for non-existent document', async () => {
      const res = await api.request('/documents/does/not/exist');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /documents', () => {
    it('should create new document', async () => {
      const res = await api.request('/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/new/document',
          content: '# New Document\n\nContent here.',
          tags: ['new'],
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.action).toBe('created');
      expect(data.version).toBe(1);
    });

    it('should update existing document', async () => {
      const res = await api.request('/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/work/project-alpha',
          content: '# Project Alpha\n\nUpdated content.',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.action).toBe('updated');
      expect(data.version).toBe(2);
    });

    it('should return error for missing path', async () => {
      const res = await api.request('/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# Content',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /documents/*', () => {
    it('should update document', async () => {
      const res = await api.request('/documents/work/project-alpha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# Project Alpha\n\nUpdated via PUT.',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.action).toBe('updated');
    });

    it('should create document if not exists', async () => {
      const res = await api.request('/documents/new/via/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# New via PUT',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.action).toBe('created');
    });
  });

  describe('DELETE /documents/*', () => {
    it('should soft delete document', async () => {
      const res = await api.request('/documents/personal/journal', {
        method: 'DELETE',
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.action).toBe('soft-deleted');
    });

    it('should return 404 for non-existent document', async () => {
      const res = await api.request('/documents/does/not/exist', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    it('should make document invisible after delete', async () => {
      await api.request('/documents/personal/journal', {
        method: 'DELETE',
      });

      const res = await api.request('/documents/personal/journal');
      expect(res.status).toBe(404);
    });
  });
});
