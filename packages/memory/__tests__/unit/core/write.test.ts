import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { documents, documentVersions } from '@/db/schema';
import { writeDocument, type WriteDocumentInput } from '@/core/write';
import { readDocument } from '@/core/read';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('writeDocument', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);
  });

  describe('create new document', () => {
    it('should create a new document', async () => {
      const input: WriteDocumentInput = {
        path: '/new/document',
        title: 'New Document',
        content: '# New\n\nThis is new.',
        tags: ['new', 'test'],
        source: 'manual',
        type: 'note',
      };

      const result = await writeDocument(db, input);

      expect(result.action).toBe('created');
      expect(result.path).toBe('/new/document');
      expect(result.version).toBe(1);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify document exists
      const doc = await readDocument(db, '/new/document');
      expect(doc).not.toBeNull();
      expect(doc!.title).toBe('New Document');
      expect(doc!.content).toBe('# New\n\nThis is new.');
      expect(doc!.tags).toEqual(['new', 'test']);
    });

    it('should auto-generate title from content if not provided', async () => {
      const input: WriteDocumentInput = {
        path: '/auto/title',
        content: '# Auto Generated Title\n\nContent here.',
      };

      const result = await writeDocument(db, input);

      expect(result.action).toBe('created');

      const doc = await readDocument(db, '/auto/title');
      expect(doc!.title).toBe('Auto Generated Title');
    });

    it('should use path as title if no heading in content', async () => {
      const input: WriteDocumentInput = {
        path: '/no/heading',
        content: 'Just plain content without heading.',
      };

      const result = await writeDocument(db, input);

      const doc = await readDocument(db, '/no/heading');
      expect(doc!.title).toBe('heading'); // Last segment of path
    });

    it('should store metadata as JSON', async () => {
      const input: WriteDocumentInput = {
        path: '/with/metadata',
        content: '# Metadata Test',
        metadata: { priority: 'high', status: 'draft', count: 42 },
      };

      await writeDocument(db, input);

      const doc = await readDocument(db, '/with/metadata');
      expect(doc!.metadata).toEqual({ priority: 'high', status: 'draft', count: 42 });
    });

    it('should set lastWriteSource', async () => {
      const input: WriteDocumentInput = {
        path: '/with/source',
        content: '# Source Test',
        source: 'claude-code',
      };

      await writeDocument(db, input);

      const doc = await readDocument(db, '/with/source');
      expect(doc!.lastWriteSource).toBe('claude-code');
    });
  });

  describe('update existing document', () => {
    it('should update an existing document', async () => {
      // Create initial document
      await writeDocument(db, {
        path: '/update/test',
        content: '# Original',
        tags: ['original'],
      });

      // Update it
      const result = await writeDocument(db, {
        path: '/update/test',
        content: '# Updated',
        tags: ['updated'],
      });

      expect(result.action).toBe('updated');
      expect(result.version).toBe(2);
      expect(result.previousVersion).toBe(1);

      // Verify update
      const doc = await readDocument(db, '/update/test');
      expect(doc!.content).toBe('# Updated');
      expect(doc!.tags).toEqual(['updated']);
      expect(doc!.version).toBe(2);
    });

    it('should increment version on each update', async () => {
      await writeDocument(db, { path: '/version/test', content: '# V1' });
      await writeDocument(db, { path: '/version/test', content: '# V2' });
      await writeDocument(db, { path: '/version/test', content: '# V3' });

      const doc = await readDocument(db, '/version/test');
      expect(doc!.version).toBe(3);
    });

    it('should save previous version to version history', async () => {
      await writeDocument(db, {
        path: '/history/test',
        content: '# Version 1',
        metadata: { v: 1 },
      });

      await writeDocument(db, {
        path: '/history/test',
        content: '# Version 2',
        metadata: { v: 2 },
      });

      // Check version history
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.path, '/history/test'))
        .limit(1);

      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, doc[0].id));

      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].content).toBe('# Version 1');
    });

    it('should update lastWriteSource on update', async () => {
      await writeDocument(db, {
        path: '/source/update',
        content: '# Test',
        source: 'manual',
      });

      await writeDocument(db, {
        path: '/source/update',
        content: '# Updated',
        source: 'claude-code',
      });

      const doc = await readDocument(db, '/source/update');
      expect(doc!.lastWriteSource).toBe('claude-code');
    });

    it('should update updatedAt timestamp', async () => {
      await writeDocument(db, { path: '/time/test', content: '# First' });

      const doc1 = await readDocument(db, '/time/test');
      const firstUpdated = doc1!.updatedAt;

      // Delay to ensure timestamp difference (SQLite has second precision)
      await new Promise((r) => setTimeout(r, 1100));

      await writeDocument(db, { path: '/time/test', content: '# Second' });

      const doc2 = await readDocument(db, '/time/test');
      expect(doc2!.updatedAt.getTime()).toBeGreaterThan(firstUpdated.getTime());
    });
  });

  describe('restore soft-deleted document', () => {
    it('should restore a soft-deleted document when writing to same path', async () => {
      // Create and delete
      await writeDocument(db, { path: '/restore/test', content: '# Original' });

      await db
        .update(documents)
        .set({ deletedAt: new Date() })
        .where(eq(documents.path, '/restore/test'));

      // Verify it's deleted
      const deleted = await readDocument(db, '/restore/test');
      expect(deleted).toBeNull();

      // Write to same path should create new document
      const result = await writeDocument(db, {
        path: '/restore/test',
        content: '# New Content',
      });

      expect(result.action).toBe('created');
      expect(result.version).toBe(1);

      const doc = await readDocument(db, '/restore/test');
      expect(doc!.content).toBe('# New Content');
    });
  });

  describe('validation', () => {
    it('should require path', async () => {
      await expect(
        writeDocument(db, { path: '', content: '# Test' })
      ).rejects.toThrow();
    });

    it('should require content', async () => {
      await expect(
        writeDocument(db, { path: '/test', content: '' })
      ).rejects.toThrow();
    });

    it('should normalize path', async () => {
      await writeDocument(db, {
        path: 'no/leading/slash',
        content: '# Test',
      });

      const doc = await readDocument(db, '/no/leading/slash');
      expect(doc).not.toBeNull();
      expect(doc!.path).toBe('/no/leading/slash');
    });
  });
});
