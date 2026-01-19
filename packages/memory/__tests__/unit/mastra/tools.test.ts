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

// Helper to create execution context for Mastra tools
function createExecutionContext<T extends Record<string, unknown>>(context: T) {
  return {
    context,
    runId: 'test',
    runtimeContext: {} as never,
  } as Parameters<NonNullable<typeof memoryIndex.execute>>[0];
}

// Type for asserting tool results
type IndexResult = {
  documents: Array<{ path: string; title: string; tags: string[]; source: string | null; type: string | null; updatedAt: string }>;
  folders: string[];
  tagCounts: Record<string, number>;
  total: number;
  latencyMs: number;
};

type SearchResult = {
  documents: Array<{ path: string; title: string; tags: string[]; snippet: string; source: string | null; type: string | null }>;
  total: number;
  latencyMs: number;
};

type ReadResult = {
  found: boolean;
  path?: string;
  title?: string;
  content?: string;
  tags?: string[];
  version?: number;
  latencyMs?: number;
  error?: string;
};

type WriteResult = {
  success: boolean;
  path: string;
  version: number;
  previousVersion?: number;
  action: 'created' | 'updated';
  latencyMs: number;
};

type ListResult = {
  documents: Array<{ path: string; title: string; tags: string[]; source: string | null; type: string | null; updatedAt: string }>;
  subfolders: string[];
  folder: string;
  total: number;
  latencyMs: number;
};

type DeleteResult = {
  success: boolean;
  path: string;
  action?: 'soft-deleted';
  error?: string;
  latencyMs: number;
};

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
      const result = await memoryIndex.execute?.(
        createExecutionContext({}) as never
      ) as IndexResult;

      expect(result.documents.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.folders).toContain('/work');
      expect(result.folders).toContain('/personal');
    });

    it('should filter by folder', async () => {
      const result = await memoryIndex.execute?.(
        createExecutionContext({ folder: '/work' }) as never
      ) as IndexResult;

      expect(result.documents.length).toBe(2);
    });

    it('should return tag counts', async () => {
      const result = await memoryIndex.execute?.(
        createExecutionContext({}) as never
      ) as IndexResult;

      expect(result.tagCounts['work']).toBe(2);
      expect(result.tagCounts['typescript']).toBe(1);
    });
  });

  describe('memorySearch', () => {
    it('should search by keyword', async () => {
      const result = await memorySearch.execute?.(
        createExecutionContext({ query: 'TypeScript' }) as never
      ) as SearchResult;

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/work/project-alpha');
    });

    it('should return snippets', async () => {
      const result = await memorySearch.execute?.(
        createExecutionContext({ query: 'React' }) as never
      ) as SearchResult;

      expect(result.documents[0].snippet).toBeDefined();
    });

    it('should filter by folder', async () => {
      const result = await memorySearch.execute?.(
        createExecutionContext({ query: '*', folder: '/personal' }) as never
      ) as SearchResult;

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].path).toBe('/personal/journal');
    });
  });

  describe('memoryRead', () => {
    it('should read document by path', async () => {
      const result = await memoryRead.execute?.(
        createExecutionContext({ path: '/work/project-alpha' }) as never
      ) as ReadResult;

      expect(result.found).toBe(true);
      expect(result.title).toBe('Project Alpha');
      expect(result.content).toContain('TypeScript');
      expect(result.tags).toContain('typescript');
    });

    it('should return error for non-existent document', async () => {
      const result = await memoryRead.execute?.(
        createExecutionContext({ path: '/does/not/exist' }) as never
      ) as ReadResult;

      expect(result.found).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('memoryWrite', () => {
    it('should create new document', async () => {
      const result = await memoryWrite.execute?.(
        createExecutionContext({
          path: '/new/document',
          content: '# New Document\n\nContent here.',
          tags: ['new'],
        }) as never
      ) as WriteResult;

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.version).toBe(1);
    });

    it('should update existing document', async () => {
      const result = await memoryWrite.execute?.(
        createExecutionContext({
          path: '/work/project-alpha',
          content: '# Project Alpha\n\nUpdated content.',
        }) as never
      ) as WriteResult;

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.version).toBe(2);
      expect(result.previousVersion).toBe(1);
    });
  });

  describe('memoryList', () => {
    it('should list documents in folder', async () => {
      const result = await memoryList.execute?.(
        createExecutionContext({ folder: '/work' }) as never
      ) as ListResult;

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

      const result = await memoryList.execute?.(
        createExecutionContext({ folder: '/work' }) as never
      ) as ListResult;

      expect(result.subfolders).toContain('/work/projects');
    });
  });

  describe('memoryDelete', () => {
    it('should soft delete document', async () => {
      const result = await memoryDelete.execute?.(
        createExecutionContext({ path: '/personal/journal' }) as never
      ) as DeleteResult;

      expect(result.success).toBe(true);
      expect(result.action).toBe('soft-deleted');
    });

    it('should return error for non-existent document', async () => {
      const result = await memoryDelete.execute?.(
        createExecutionContext({ path: '/does/not/exist' }) as never
      ) as DeleteResult;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should make document invisible after delete', async () => {
      await memoryDelete.execute?.(
        createExecutionContext({ path: '/personal/journal' }) as never
      );

      const readResult = await memoryRead.execute?.(
        createExecutionContext({ path: '/personal/journal' }) as never
      ) as ReadResult;

      expect(readResult.found).toBe(false);
    });
  });
});
