import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { documents } from '@/db/schema';
import { writeDocument } from '@/core/write';
import { readDocument } from '@/core/read';
import { deleteDocument, restoreDocument, permanentlyDeleteDocument } from '@/core/delete';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('deleteDocument', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);

    // Seed test documents
    await writeDocument(db, {
      path: '/test/document',
      content: '# Test Document\n\nContent here.',
      tags: ['test'],
      source: 'manual',
    });

    await writeDocument(db, {
      path: '/test/another',
      content: '# Another Document',
      tags: ['test'],
      source: 'manual',
    });
  });

  describe('soft delete', () => {
    it('should soft delete a document', async () => {
      const result = await deleteDocument(db, '/test/document');

      expect(result.success).toBe(true);
      expect(result.action).toBe('soft-deleted');
    });

    it('should set deletedAt timestamp', async () => {
      await deleteDocument(db, '/test/document');

      // Direct query to verify deletedAt is set
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.path, '/test/document'))
        .limit(1);

      expect(doc[0].deletedAt).not.toBeNull();
    });

    it('should make document invisible to read', async () => {
      await deleteDocument(db, '/test/document');

      const doc = await readDocument(db, '/test/document');
      expect(doc).toBeNull();
    });

    it('should return error for non-existent document', async () => {
      const result = await deleteDocument(db, '/does/not/exist');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for already deleted document', async () => {
      await deleteDocument(db, '/test/document');
      const result = await deleteDocument(db, '/test/document');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should include latency measurement', async () => {
      const result = await deleteDocument(db, '/test/document');

      expect(result.latencyMs).toBeDefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('restoreDocument', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);

    // Create and soft delete a document
    await writeDocument(db, {
      path: '/deleted/document',
      content: '# Deleted Document',
      tags: ['deleted'],
    });

    await deleteDocument(db, '/deleted/document');
  });

  it('should restore a soft-deleted document', async () => {
    const result = await restoreDocument(db, '/deleted/document');

    expect(result.success).toBe(true);
    expect(result.action).toBe('restored');
  });

  it('should clear deletedAt timestamp', async () => {
    await restoreDocument(db, '/deleted/document');

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.path, '/deleted/document'))
      .limit(1);

    expect(doc[0].deletedAt).toBeNull();
  });

  it('should make document visible to read again', async () => {
    await restoreDocument(db, '/deleted/document');

    const doc = await readDocument(db, '/deleted/document');
    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('Deleted Document');
  });

  it('should return error for non-deleted document', async () => {
    await writeDocument(db, {
      path: '/active/document',
      content: '# Active',
    });

    const result = await restoreDocument(db, '/active/document');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not deleted');
  });

  it('should return error for non-existent document', async () => {
    const result = await restoreDocument(db, '/does/not/exist');

    expect(result.success).toBe(false);
  });

  it('should include latency measurement', async () => {
    const result = await restoreDocument(db, '/deleted/document');

    expect(result.latencyMs).toBeDefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('permanentlyDeleteDocument', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);

    // Create a document and its version history
    await writeDocument(db, {
      path: '/permanent/delete',
      content: '# Original',
    });

    await writeDocument(db, {
      path: '/permanent/delete',
      content: '# Updated',
    });

    // Soft delete it first
    await deleteDocument(db, '/permanent/delete');
  });

  it('should permanently delete a soft-deleted document', async () => {
    const result = await permanentlyDeleteDocument(db, '/permanent/delete');

    expect(result.success).toBe(true);
    expect(result.action).toBe('permanently-deleted');
  });

  it('should remove document from database entirely', async () => {
    await permanentlyDeleteDocument(db, '/permanent/delete');

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.path, '/permanent/delete'))
      .limit(1);

    expect(doc.length).toBe(0);
  });

  it('should remove version history', async () => {
    await permanentlyDeleteDocument(db, '/permanent/delete');

    const { documentVersions } = await import('@/db/schema');

    // Get all version records
    const versions = await db.select().from(documentVersions);

    // None should be for our deleted document
    expect(versions.length).toBe(0);
  });

  it('should return error for non-deleted document', async () => {
    await writeDocument(db, {
      path: '/active/document',
      content: '# Active',
    });

    const result = await permanentlyDeleteDocument(db, '/active/document');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in trash');
  });

  it('should return error for non-existent document', async () => {
    const result = await permanentlyDeleteDocument(db, '/does/not/exist');

    expect(result.success).toBe(false);
  });

  it('should include latency measurement', async () => {
    const result = await permanentlyDeleteDocument(db, '/permanent/delete');

    expect(result.latencyMs).toBeDefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
