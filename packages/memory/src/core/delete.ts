import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents, documentVersions } from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Result of a delete operation
 */
export interface DeleteResult {
  success: boolean;
  action?: 'soft-deleted' | 'restored' | 'permanently-deleted';
  error?: string;
  latencyMs: number;
}

/**
 * Soft delete a document (sets deletedAt timestamp)
 *
 * @param db - Database instance
 * @param path - Document path to delete
 * @returns Result indicating success or failure
 */
export async function deleteDocument(
  db: LibSQLDatabase<typeof schema>,
  path: string
): Promise<DeleteResult> {
  const startTime = performance.now();

  // Find the document (must not already be deleted)
  const existing = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.path, path), isNull(documents.deletedAt)))
    .limit(1);

  if (existing.length === 0) {
    const endTime = performance.now();
    return {
      success: false,
      error: 'Document not found or already deleted',
      latencyMs: Number((endTime - startTime).toFixed(2)),
    };
  }

  // Soft delete by setting deletedAt
  await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(eq(documents.id, existing[0].id));

  const endTime = performance.now();

  return {
    success: true,
    action: 'soft-deleted',
    latencyMs: Number((endTime - startTime).toFixed(2)),
  };
}

/**
 * Restore a soft-deleted document
 *
 * @param db - Database instance
 * @param path - Document path to restore
 * @returns Result indicating success or failure
 */
export async function restoreDocument(
  db: LibSQLDatabase<typeof schema>,
  path: string
): Promise<DeleteResult> {
  const startTime = performance.now();

  // Find the document (must be deleted)
  const existing = await db
    .select({ id: documents.id, deletedAt: documents.deletedAt })
    .from(documents)
    .where(eq(documents.path, path))
    .limit(1);

  if (existing.length === 0) {
    const endTime = performance.now();
    return {
      success: false,
      error: 'Document not found',
      latencyMs: Number((endTime - startTime).toFixed(2)),
    };
  }

  if (existing[0].deletedAt === null) {
    const endTime = performance.now();
    return {
      success: false,
      error: 'Document is not deleted',
      latencyMs: Number((endTime - startTime).toFixed(2)),
    };
  }

  // Restore by clearing deletedAt
  await db
    .update(documents)
    .set({ deletedAt: null })
    .where(eq(documents.id, existing[0].id));

  const endTime = performance.now();

  return {
    success: true,
    action: 'restored',
    latencyMs: Number((endTime - startTime).toFixed(2)),
  };
}

/**
 * Permanently delete a document and its version history
 * Only works on documents that are already soft-deleted
 *
 * @param db - Database instance
 * @param path - Document path to permanently delete
 * @returns Result indicating success or failure
 */
export async function permanentlyDeleteDocument(
  db: LibSQLDatabase<typeof schema>,
  path: string
): Promise<DeleteResult> {
  const startTime = performance.now();

  // Find the document (must be soft-deleted)
  const existing = await db
    .select({ id: documents.id, deletedAt: documents.deletedAt })
    .from(documents)
    .where(eq(documents.path, path))
    .limit(1);

  if (existing.length === 0) {
    const endTime = performance.now();
    return {
      success: false,
      error: 'Document not found',
      latencyMs: Number((endTime - startTime).toFixed(2)),
    };
  }

  if (existing[0].deletedAt === null) {
    const endTime = performance.now();
    return {
      success: false,
      error: 'Document is not in trash (must be soft-deleted first)',
      latencyMs: Number((endTime - startTime).toFixed(2)),
    };
  }

  const documentId = existing[0].id;

  // Delete version history first (due to foreign key)
  await db
    .delete(documentVersions)
    .where(eq(documentVersions.documentId, documentId));

  // Delete the document
  await db.delete(documents).where(eq(documents.id, documentId));

  const endTime = performance.now();

  return {
    success: true,
    action: 'permanently-deleted',
    latencyMs: Number((endTime - startTime).toFixed(2)),
  };
}
