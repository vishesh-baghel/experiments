import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, initializeSchema } from '@/db/client';
import { documents } from '@/db/schema';
import { readDocument } from '@/core/read';
import { nanoid } from 'nanoid';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from '@/db/schema';

describe('readDocument', () => {
  let db: LibSQLDatabase<typeof schema>;

  beforeEach(async () => {
    db = createTestDb();
    await initializeSchema(db);
  });

  afterEach(() => {
    // Cleanup handled by in-memory db going out of scope
  });

  it('should read a document by path', async () => {
    // Arrange: Insert a test document
    const now = new Date();
    await db.insert(documents).values({
      id: nanoid(),
      path: '/test/document',
      title: 'Test Document',
      content: '# Test\n\nThis is test content.',
      tags: JSON.stringify(['test', 'unit']),
      metadata: JSON.stringify({ priority: 'high' }),
      source: 'manual',
      type: 'note',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Act
    const result = await readDocument(db, '/test/document');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.path).toBe('/test/document');
    expect(result!.title).toBe('Test Document');
    expect(result!.content).toBe('# Test\n\nThis is test content.');
    expect(result!.tags).toEqual(['test', 'unit']);
    expect(result!.metadata).toEqual({ priority: 'high' });
    expect(result!.version).toBe(1);
    expect(result!.latencyMs).toBeDefined();
    expect(result!.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should return null for non-existent document', async () => {
    const result = await readDocument(db, '/does/not/exist');

    expect(result).toBeNull();
  });

  it('should not return soft-deleted documents', async () => {
    // Arrange: Insert a soft-deleted document
    const now = new Date();
    await db.insert(documents).values({
      id: nanoid(),
      path: '/deleted/document',
      title: 'Deleted Document',
      content: 'This was deleted.',
      createdAt: now,
      updatedAt: now,
      deletedAt: now, // Soft deleted
      version: 1,
    });

    // Act
    const result = await readDocument(db, '/deleted/document');

    // Assert
    expect(result).toBeNull();
  });

  it('should include latency measurement', async () => {
    // Arrange
    const now = new Date();
    await db.insert(documents).values({
      id: nanoid(),
      path: '/latency/test',
      title: 'Latency Test',
      content: 'Content',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Act
    const result = await readDocument(db, '/latency/test');

    // Assert
    expect(result).not.toBeNull();
    expect(typeof result!.latencyMs).toBe('number');
    expect(result!.latencyMs).toBeLessThan(100); // Should be fast for in-memory
  });

  it('should parse tags as array', async () => {
    // Arrange: Document with no tags
    const now = new Date();
    await db.insert(documents).values({
      id: nanoid(),
      path: '/no/tags',
      title: 'No Tags',
      content: 'Content',
      tags: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Act
    const result = await readDocument(db, '/no/tags');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.tags).toEqual([]);
  });

  it('should parse metadata as object', async () => {
    // Arrange: Document with no metadata
    const now = new Date();
    await db.insert(documents).values({
      id: nanoid(),
      path: '/no/metadata',
      title: 'No Metadata',
      content: 'Content',
      metadata: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Act
    const result = await readDocument(db, '/no/metadata');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.metadata).toBeNull();
  });

  it('should return all document fields', async () => {
    // Arrange
    const now = new Date();
    const id = nanoid();
    await db.insert(documents).values({
      id,
      path: '/full/document',
      title: 'Full Document',
      content: '# Full\n\nAll fields.',
      tags: JSON.stringify(['full', 'test']),
      metadata: JSON.stringify({ status: 'active', priority: 1 }),
      source: 'claude-code',
      type: 'spec',
      createdAt: now,
      updatedAt: now,
      version: 3,
      lastWriteSource: 'claude-code',
    });

    // Act
    const result = await readDocument(db, '/full/document');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.id).toBe(id);
    expect(result!.path).toBe('/full/document');
    expect(result!.title).toBe('Full Document');
    expect(result!.content).toBe('# Full\n\nAll fields.');
    expect(result!.tags).toEqual(['full', 'test']);
    expect(result!.metadata).toEqual({ status: 'active', priority: 1 });
    expect(result!.source).toBe('claude-code');
    expect(result!.type).toBe('spec');
    expect(result!.version).toBe(3);
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });
});
