import { eq, isNull, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents, parseDocument, type ParsedDocument } from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Result of reading a document
 */
export interface ReadDocumentResult extends ParsedDocument {
  latencyMs: number;
}

/**
 * Read a document by its path
 *
 * @param db - Database instance
 * @param path - Document path (e.g., "/work/projects/memory")
 * @returns Document with parsed fields and latency, or null if not found
 */
export async function readDocument(
  db: LibSQLDatabase<typeof schema>,
  path: string
): Promise<ReadDocumentResult | null> {
  const startTime = performance.now();

  // Query for document that is not soft-deleted
  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.path, path), isNull(documents.deletedAt)))
    .limit(1);

  const endTime = performance.now();
  const latencyMs = Number((endTime - startTime).toFixed(2));

  if (result.length === 0) {
    return null;
  }

  const doc = result[0];
  const parsed = parseDocument(doc);

  return {
    ...parsed,
    latencyMs,
  };
}

/**
 * Read a specific version of a document
 *
 * @param db - Database instance
 * @param path - Document path
 * @param version - Version number to read
 * @returns Document version content or null if not found
 */
export async function readDocumentVersion(
  db: LibSQLDatabase<typeof schema>,
  path: string,
  version: number
): Promise<{ content: string; metadata: Record<string, unknown> | null; version: number; createdAt: Date } | null> {
  const startTime = performance.now();

  // First get the document to get its ID
  const docResult = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.path, path))
    .limit(1);

  if (docResult.length === 0) {
    return null;
  }

  const documentId = docResult[0].id;

  // Get the specific version
  const { documentVersions } = await import('@/db/schema');

  const versionResult = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.version, version)
      )
    )
    .limit(1);

  const endTime = performance.now();

  if (versionResult.length === 0) {
    return null;
  }

  const v = versionResult[0];

  return {
    content: v.content,
    metadata: v.metadata ? JSON.parse(v.metadata) : null,
    version: v.version,
    createdAt: v.createdAt,
  };
}
