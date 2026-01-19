import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { writeDocument } from '@/core/write';
import { searchDocuments, type SearchOptions } from '@/core/search';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('searchDocuments', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);

    // Seed test documents
    await writeDocument(db, {
      path: '/work/project-alpha',
      content: '# Project Alpha\n\nThis is a TypeScript project about machine learning.',
      tags: ['typescript', 'ml', 'work'],
      source: 'manual',
    });

    await writeDocument(db, {
      path: '/work/project-beta',
      content: '# Project Beta\n\nA React application for data visualization.',
      tags: ['react', 'typescript', 'data'],
      source: 'manual',
    });

    await writeDocument(db, {
      path: '/personal/recipes',
      content: '# Favorite Recipes\n\nPasta with garlic and olive oil.',
      tags: ['cooking', 'personal'],
      source: 'manual',
    });

    await writeDocument(db, {
      path: '/work/notes/meeting',
      content: '# Meeting Notes\n\nDiscussed the TypeScript migration timeline.',
      tags: ['meeting', 'work'],
      source: 'claude-code',
    });
  });

  describe('basic search', () => {
    it('should search by single keyword', async () => {
      const results = await searchDocuments(db, { query: 'TypeScript' });

      expect(results.documents.length).toBe(3); // Alpha, Beta, Meeting
      expect(results.documents.map((d) => d.path)).toContain('/work/project-alpha');
      expect(results.documents.map((d) => d.path)).toContain('/work/project-beta');
      expect(results.documents.map((d) => d.path)).toContain('/work/notes/meeting');
    });

    it('should search by phrase', async () => {
      const results = await searchDocuments(db, { query: '"machine learning"' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/work/project-alpha');
    });

    it('should return empty results for non-matching query', async () => {
      const results = await searchDocuments(db, { query: 'quantum computing' });

      expect(results.documents.length).toBe(0);
      expect(results.total).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const lower = await searchDocuments(db, { query: 'typescript' });
      const upper = await searchDocuments(db, { query: 'TYPESCRIPT' });

      expect(lower.documents.length).toBe(upper.documents.length);
    });

    it('should support prefix search', async () => {
      const results = await searchDocuments(db, { query: 'Type*' });

      expect(results.documents.length).toBe(3);
    });
  });

  describe('search results', () => {
    it('should return snippets with highlights', async () => {
      const results = await searchDocuments(db, { query: 'pasta' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].snippet).toBeDefined();
      expect(results.documents[0].snippet).toContain('Pasta');
    });

    it('should return path and title', async () => {
      const results = await searchDocuments(db, { query: 'recipes' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/personal/recipes');
      expect(results.documents[0].title).toBe('Favorite Recipes');
    });

    it('should return tags', async () => {
      const results = await searchDocuments(db, { query: 'alpha' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].tags).toEqual(['typescript', 'ml', 'work']);
    });

    it('should include latency measurement', async () => {
      const results = await searchDocuments(db, { query: 'project' });

      expect(results.latencyMs).toBeDefined();
      expect(results.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should return total count', async () => {
      const results = await searchDocuments(db, { query: 'project' });

      expect(results.total).toBe(2);
    });
  });

  describe('pagination', () => {
    it('should respect limit', async () => {
      const results = await searchDocuments(db, {
        query: 'TypeScript',
        limit: 2,
      });

      expect(results.documents.length).toBe(2);
      expect(results.total).toBe(3); // Total matches regardless of limit
    });

    it('should respect offset', async () => {
      const page1 = await searchDocuments(db, {
        query: 'TypeScript',
        limit: 1,
        offset: 0,
      });

      const page2 = await searchDocuments(db, {
        query: 'TypeScript',
        limit: 1,
        offset: 1,
      });

      expect(page1.documents[0].path).not.toBe(page2.documents[0].path);
    });

    it('should default to reasonable limit', async () => {
      const results = await searchDocuments(db, { query: 'project' });

      // Default limit should be applied
      expect(results.documents.length).toBeLessThanOrEqual(20);
    });
  });

  describe('filters', () => {
    it('should filter by folder path', async () => {
      const results = await searchDocuments(db, {
        query: '*',
        folder: '/work',
      });

      expect(results.documents.length).toBe(3); // Alpha, Beta, Meeting
      results.documents.forEach((doc) => {
        expect(doc.path.startsWith('/work')).toBe(true);
      });
    });

    it('should filter by tag', async () => {
      const results = await searchDocuments(db, {
        query: '*',
        tags: ['typescript'],
      });

      expect(results.documents.length).toBe(2); // Alpha, Beta
      results.documents.forEach((doc) => {
        expect(doc.tags).toContain('typescript');
      });
    });

    it('should filter by multiple tags (AND logic)', async () => {
      const results = await searchDocuments(db, {
        query: '*',
        tags: ['typescript', 'ml'],
      });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/work/project-alpha');
    });

    it('should filter by source', async () => {
      const results = await searchDocuments(db, {
        query: '*',
        source: 'claude-code',
      });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/work/notes/meeting');
    });

    it('should combine multiple filters', async () => {
      const results = await searchDocuments(db, {
        query: 'project',
        folder: '/work',
        tags: ['typescript'],
      });

      expect(results.documents.length).toBe(2); // Alpha, Beta
    });
  });

  describe('soft delete handling', () => {
    it('should not return soft-deleted documents', async () => {
      // Search before delete
      const before = await searchDocuments(db, { query: 'pasta' });
      expect(before.documents.length).toBe(1);

      // Soft delete the document
      const { documents } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      await db
        .update(documents)
        .set({ deletedAt: new Date() })
        .where(eq(documents.path, '/personal/recipes'));

      // Search after delete
      const after = await searchDocuments(db, { query: 'pasta' });
      expect(after.documents.length).toBe(0);
    });
  });

  describe('FTS5 operators', () => {
    it('should support AND operator', async () => {
      const results = await searchDocuments(db, { query: 'project AND alpha' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/work/project-alpha');
    });

    it('should support OR operator', async () => {
      const results = await searchDocuments(db, { query: 'pasta OR react' });

      expect(results.documents.length).toBe(2);
    });

    it('should support NOT operator', async () => {
      const results = await searchDocuments(db, { query: 'project NOT alpha' });

      expect(results.documents.length).toBe(1);
      expect(results.documents[0].path).toBe('/work/project-beta');
    });
  });
});
