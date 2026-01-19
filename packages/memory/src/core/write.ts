import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { nanoid } from 'nanoid';
import {
  documents,
  documentVersions,
  serializeDocument,
  type DocumentMetadata,
} from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Input for writing a document
 */
export interface WriteDocumentInput {
  path: string;
  content: string;
  title?: string;
  tags?: string[];
  metadata?: DocumentMetadata;
  source?: string;
  type?: string;
}

/**
 * Result of writing a document
 */
export interface WriteDocumentResult {
  path: string;
  version: number;
  previousVersion?: number;
  action: 'created' | 'updated';
  latencyMs: number;
}

/**
 * Extract title from markdown content
 * Looks for first # heading
 */
function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Get title from path (last segment)
 */
function titleFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1] || 'Untitled';
}

/**
 * Normalize path to always start with /
 */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    return '/' + path;
  }
  return path;
}

/**
 * Write (create or update) a document
 *
 * @param db - Database instance
 * @param input - Document data to write
 * @returns Result with action taken and version info
 */
export async function writeDocument(
  db: LibSQLDatabase<typeof schema>,
  input: WriteDocumentInput
): Promise<WriteDocumentResult> {
  const startTime = performance.now();

  // Validate input
  if (!input.path || input.path.trim() === '') {
    throw new Error('Path is required');
  }

  if (!input.content || input.content.trim() === '') {
    throw new Error('Content is required');
  }

  const path = normalizePath(input.path.trim());
  const now = new Date();

  // Determine title
  const title =
    input.title || extractTitle(input.content) || titleFromPath(path);

  // Check if document exists (not soft-deleted)
  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.path, path), isNull(documents.deletedAt)))
    .limit(1);

  // Check for soft-deleted document at same path
  const softDeleted = await db
    .select()
    .from(documents)
    .where(and(eq(documents.path, path), isNotNull(documents.deletedAt)))
    .limit(1);

  // If there's a soft-deleted document, hard delete it first
  if (existing.length === 0 && softDeleted.length > 0) {
    await db.delete(documents).where(eq(documents.path, path));
  }

  let result: WriteDocumentResult;

  if (existing.length === 0) {
    // Create new document
    const id = nanoid();

    const docData = serializeDocument({
      id,
      path,
      title,
      content: input.content,
      tags: input.tags || [],
      metadata: input.metadata || null,
      source: input.source || null,
      type: input.type || null,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
      lastWriteSource: input.source || null,
    });

    await db.insert(documents).values(docData as typeof documents.$inferInsert);

    result = {
      path,
      version: 1,
      action: 'created',
      latencyMs: 0,
    };
  } else {
    // Update existing document
    const existingDoc = existing[0];
    const newVersion = existingDoc.version + 1;

    // Save current version to history
    await db.insert(documentVersions).values({
      id: nanoid(),
      documentId: existingDoc.id,
      version: existingDoc.version,
      content: existingDoc.content,
      metadata: existingDoc.metadata,
      createdAt: existingDoc.updatedAt,
    });

    // Update document
    const updateData = serializeDocument({
      title,
      content: input.content,
      tags: input.tags !== undefined ? input.tags : undefined,
      metadata: input.metadata !== undefined ? input.metadata : undefined,
      source: input.source !== undefined ? input.source : undefined,
      type: input.type !== undefined ? input.type : undefined,
      updatedAt: now,
      version: newVersion,
      lastWriteSource: input.source || existingDoc.lastWriteSource,
    });

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    await db
      .update(documents)
      .set(cleanUpdateData)
      .where(eq(documents.id, existingDoc.id));

    result = {
      path,
      version: newVersion,
      previousVersion: existingDoc.version,
      action: 'updated',
      latencyMs: 0,
    };
  }

  const endTime = performance.now();
  result.latencyMs = Number((endTime - startTime).toFixed(2));

  return result;
}
