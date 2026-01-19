import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { writeDocument } from '@/core/write';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

// Mock the getDb function to return our test database
let testDb: LibSQLDatabase<typeof schema>;

vi.mock('@/db/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/db/client')>();
  return {
    ...original,
    getDb: () => testDb,
  };
});

// Import tools after mocking
import {
  memoryIndex,
  memorySearch,
  memoryRead,
  memoryWrite,
  memoryList,
  memoryDelete,
} from '@/mastra/tools';

describe('Mastra Tools', () => {
  beforeEach(async () => {
    // Create fresh test database
    const { createTestDb, initializeSchema } = await import('@/db/client');
    testDb = createTestDb();
    await initializeSchema(testDb);

    // Seed test data
    await writeDocument(testDb, {
      path: '/work/project-alpha',
      content: '# Project Alpha\n\nA TypeScript project.',
      tags: ['typescript', 'work'],
      source: 'manual',
      type: 'spec',
    });

    await writeDocument(testDb, {
      path: '/work/project-beta',
      content: '# Project Beta\n\nA React application.',
      tags: ['react', 'work'],
      source: 'claude-code',
      type: 'note',
    });

    await writeDocument(testDb, {
      path: '/personal/journal',
      content: '# Daily Journal\n\nToday was productive.',
      tags: ['personal', 'journal'],
      source: 'manual',
      type: 'note',
    });
  });

  describe('memoryIndex', () => {
    it('should return all documents', async () => {
      const result = await memoryIndex.execute?.({
        context: {},
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.folders).toContain('/work');
      expect(result.folders).toContain('/personal');
    });

    it('should filter by folder', async () => {
      const result = await memoryIndex.execute?.({
        context: { folder: '/work' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents.length).toBe(2);
    });

    it('should return tag counts', async () => {
      const result = await memoryIndex.execute?.({
        context: {},
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.tagCounts['work']).toBe(2);
      expect(result.tagCounts['typescript']).toBe(1);
    });
  });

  describe('memorySearch', () => {
    it('should search by keyword', async () => {
      const result = await memorySearch.execute?.({
        context: { query: 'TypeScript' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/work/project-alpha');
    });

    it('should return snippets', async () => {
      const result = await memorySearch.execute?.({
        context: { query: 'React' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents[0].snippet).toBeDefined();
    });

    it('should filter by folder', async () => {
      const result = await memorySearch.execute?.({
        context: { query: '*', folder: '/personal' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/personal/journal');
    });
  });

  describe('memoryRead', () => {
    it('should read document by path', async () => {
      const result = await memoryRead.execute?.({
        context: { path: '/work/project-alpha' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.found).toBe(true);
      expect(result.title).toBe('Project Alpha');
      expect(result.content).toContain('TypeScript');
      expect(result.tags).toContain('typescript');
    });

    it('should return error for non-existent document', async () => {
      const result = await memoryRead.execute?.({
        context: { path: '/does/not/exist' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.found).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('memoryWrite', () => {
    it('should create new document', async () => {
      const result = await memoryWrite.execute?.({
        context: {
          path: '/new/document',
          content: '# New Document\n\nContent here.',
          tags: ['new'],
        },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.version).toBe(1);
    });

    it('should update existing document', async () => {
      const result = await memoryWrite.execute?.({
        context: {
          path: '/work/project-alpha',
          content: '# Project Alpha\n\nUpdated content.',
        },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.version).toBe(2);
      expect(result.previousVersion).toBe(1);
    });
  });

  describe('memoryList', () => {
    it('should list documents in folder', async () => {
      const result = await memoryList.execute?.({
        context: { folder: '/work' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.documents.length).toBe(2);
      expect(result.folder).toBe('/work');
    });

    it('should return subfolders', async () => {
      // Add a nested document
      await writeDocument(testDb, {
        path: '/work/projects/nested',
        content: '# Nested',
        tags: [],
      });

      const result = await memoryList.execute?.({
        context: { folder: '/work' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.subfolders).toContain('/work/projects');
    });
  });

  describe('memoryDelete', () => {
    it('should soft delete document', async () => {
      const result = await memoryDelete.execute?.({
        context: { path: '/personal/journal' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('soft-deleted');
    });

    it('should return error for non-existent document', async () => {
      const result = await memoryDelete.execute?.({
        context: { path: '/does/not/exist' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should make document invisible after delete', async () => {
      await memoryDelete.execute?.({
        context: { path: '/personal/journal' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      const readResult = await memoryRead.execute?.({
        context: { path: '/personal/journal' },
        mapiAgentToken: '',
        runId: 'test',
        runtimeContext: {} as any,
      });

      expect(readResult.found).toBe(false);
    });
  });
});
