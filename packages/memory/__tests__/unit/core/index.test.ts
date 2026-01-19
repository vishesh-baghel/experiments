import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { writeDocument } from '@/core/write';
import { getDocumentIndex, type IndexOptions } from '@/core/index';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('getDocumentIndex', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);

    // Seed test documents
    await writeDocument(db, {
      path: '/work/project-alpha',
      content: '# Project Alpha\n\nTypeScript ML project.',
      tags: ['typescript', 'ml'],
      source: 'manual',
      type: 'spec',
    });

    await writeDocument(db, {
      path: '/work/project-beta',
      content: '# Project Beta\n\nReact app.',
      tags: ['react', 'typescript'],
      source: 'manual',
      type: 'note',
    });

    await writeDocument(db, {
      path: '/personal/notes',
      content: '# Personal Notes\n\nDaily journal.',
      tags: ['personal', 'journal'],
      source: 'claude-code',
      type: 'note',
    });
  });

  describe('basic index', () => {
    it('should return list of all documents', async () => {
      const result = await getDocumentIndex(db);

      expect(result.documents.length).toBe(3);
    });

    it('should return path and title for each document', async () => {
      const result = await getDocumentIndex(db);

      const alpha = result.documents.find((d) => d.path === '/work/project-alpha');
      expect(alpha).toBeDefined();
      expect(alpha!.title).toBe('Project Alpha');
    });

    it('should return tags for each document', async () => {
      const result = await getDocumentIndex(db);

      const alpha = result.documents.find((d) => d.path === '/work/project-alpha');
      expect(alpha!.tags).toEqual(['typescript', 'ml']);
    });

    it('should return source and type for each document', async () => {
      const result = await getDocumentIndex(db);

      const alpha = result.documents.find((d) => d.path === '/work/project-alpha');
      expect(alpha!.source).toBe('manual');
      expect(alpha!.type).toBe('spec');
    });

    it('should return updatedAt timestamp', async () => {
      const result = await getDocumentIndex(db);

      const alpha = result.documents.find((d) => d.path === '/work/project-alpha');
      expect(alpha!.updatedAt).toBeInstanceOf(Date);
    });

    it('should not return full content', async () => {
      const result = await getDocumentIndex(db);

      const alpha = result.documents.find((d) => d.path === '/work/project-alpha');
      // Index entries should not have 'content' field
      expect('content' in alpha!).toBe(false);
    });

    it('should include total count', async () => {
      const result = await getDocumentIndex(db);

      expect(result.total).toBe(3);
    });

    it('should include latency measurement', async () => {
      const result = await getDocumentIndex(db);

      expect(result.latencyMs).toBeDefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ordering', () => {
    it('should order by updatedAt descending by default', async () => {
      // Update one document to give it a newer timestamp
      await new Promise((r) => setTimeout(r, 1100)); // Wait for second precision
      await writeDocument(db, {
        path: '/personal/notes',
        content: '# Personal Notes\n\nUpdated journal.',
        tags: ['personal', 'journal'],
        source: 'claude-code',
        type: 'note',
      });

      const result = await getDocumentIndex(db);

      // Most recently updated should be first
      expect(result.documents[0].path).toBe('/personal/notes');
    });

    it('should support ordering by path', async () => {
      const result = await getDocumentIndex(db, { orderBy: 'path' });

      expect(result.documents[0].path).toBe('/personal/notes');
      expect(result.documents[1].path).toBe('/work/project-alpha');
      expect(result.documents[2].path).toBe('/work/project-beta');
    });

    it('should support ordering by title', async () => {
      const result = await getDocumentIndex(db, { orderBy: 'title' });

      // Alphabetical: "Personal Notes", "Project Alpha", "Project Beta"
      expect(result.documents[0].title).toBe('Personal Notes');
      expect(result.documents[1].title).toBe('Project Alpha');
      expect(result.documents[2].title).toBe('Project Beta');
    });
  });

  describe('filtering', () => {
    it('should filter by folder path', async () => {
      const result = await getDocumentIndex(db, { folder: '/work' });

      expect(result.documents.length).toBe(2);
      result.documents.forEach((doc) => {
        expect(doc.path.startsWith('/work')).toBe(true);
      });
    });

    it('should filter by source', async () => {
      const result = await getDocumentIndex(db, { source: 'claude-code' });

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/personal/notes');
    });

    it('should filter by type', async () => {
      const result = await getDocumentIndex(db, { type: 'note' });

      expect(result.documents.length).toBe(2);
    });

    it('should filter by tags', async () => {
      const result = await getDocumentIndex(db, { tags: ['typescript'] });

      expect(result.documents.length).toBe(2); // Alpha and Beta
    });

    it('should combine multiple filters', async () => {
      const result = await getDocumentIndex(db, {
        folder: '/work',
        type: 'spec',
      });

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/work/project-alpha');
    });
  });

  describe('pagination', () => {
    it('should respect limit', async () => {
      const result = await getDocumentIndex(db, { limit: 2 });

      expect(result.documents.length).toBe(2);
      expect(result.total).toBe(3); // Total is still 3
    });

    it('should respect offset', async () => {
      const page1 = await getDocumentIndex(db, { limit: 1, offset: 0 });
      const page2 = await getDocumentIndex(db, { limit: 1, offset: 1 });

      expect(page1.documents[0].path).not.toBe(page2.documents[0].path);
    });
  });

  describe('soft delete handling', () => {
    it('should not return soft-deleted documents', async () => {
      // Soft delete a document
      const { documents } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      await db
        .update(documents)
        .set({ deletedAt: new Date() })
        .where(eq(documents.path, '/personal/notes'));

      const result = await getDocumentIndex(db);

      expect(result.documents.length).toBe(2);
      expect(result.documents.find((d) => d.path === '/personal/notes')).toBeUndefined();
    });
  });

  describe('derived folders', () => {
    it('should include derived folders list', async () => {
      const result = await getDocumentIndex(db);

      expect(result.folders).toBeDefined();
      expect(result.folders).toContain('/work');
      expect(result.folders).toContain('/personal');
    });

    it('should include nested folders', async () => {
      // Add a deeper nested document
      await writeDocument(db, {
        path: '/work/projects/memory/spec',
        content: '# Memory Spec',
        tags: [],
      });

      const result = await getDocumentIndex(db);

      expect(result.folders).toContain('/work');
      expect(result.folders).toContain('/work/projects');
      expect(result.folders).toContain('/work/projects/memory');
    });
  });

  describe('tag aggregation', () => {
    it('should include all unique tags with counts', async () => {
      const result = await getDocumentIndex(db);

      expect(result.tagCounts).toBeDefined();
      expect(result.tagCounts['typescript']).toBe(2);
      expect(result.tagCounts['ml']).toBe(1);
      expect(result.tagCounts['react']).toBe(1);
      expect(result.tagCounts['personal']).toBe(1);
    });
  });
});
