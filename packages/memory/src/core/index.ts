import { eq, isNull, like, and, desc, asc } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents, parseDocument } from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Options for retrieving document index
 */
export interface IndexOptions {
  /** Filter by folder path prefix */
  folder?: string;
  /** Filter by source */
  source?: string;
  /** Filter by type */
  type?: string;
  /** Filter by tags (documents must have all specified tags) */
  tags?: string[];
  /** Order by field (default: updatedAt) */
  orderBy?: 'updatedAt' | 'path' | 'title';
  /** Maximum results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Index entry for a document (lightweight, no content)
 */
export interface IndexEntry {
  path: string;
  title: string;
  tags: string[];
  source: string | null;
  type: string | null;
  updatedAt: Date;
}

/**
 * Index result with documents and metadata
 */
export interface IndexResult {
  documents: IndexEntry[];
  folders: string[];
  tagCounts: Record<string, number>;
  total: number;
  latencyMs: number;
}

/**
 * Derive folders from document paths
 */
function deriveFolders(paths: string[]): string[] {
  const folderSet = new Set<string>();

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current += '/' + parts[i];
      folderSet.add(current);
    }
  }

  return Array.from(folderSet).sort();
}

/**
 * Aggregate tags and their counts
 */
function aggregateTags(
  documents: Array<{ tags: string[] }>
): Record<string, number> {
  const tagCounts: Record<string, number> = {};

  for (const doc of documents) {
    for (const tag of doc.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  return tagCounts;
}

/**
 * Get a lightweight index of all documents
 *
 * @param db - Database instance
 * @param options - Filtering and pagination options
 * @returns Index with documents, folders, and tag counts
 */
export async function getDocumentIndex(
  db: LibSQLDatabase<typeof schema>,
  options: IndexOptions = {}
): Promise<IndexResult> {
  const startTime = performance.now();

  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  // Build conditions
  const conditions = [isNull(documents.deletedAt)];

  if (options.folder) {
    conditions.push(like(documents.path, options.folder + '%'));
  }

  if (options.source) {
    conditions.push(eq(documents.source, options.source));
  }

  if (options.type) {
    conditions.push(eq(documents.type, options.type));
  }

  // Determine ordering
  let orderByColumn;
  switch (options.orderBy) {
    case 'path':
      orderByColumn = asc(documents.path);
      break;
    case 'title':
      orderByColumn = asc(documents.title);
      break;
    default:
      orderByColumn = desc(documents.updatedAt);
  }

  // Fetch all matching documents for total count and aggregations
  const allDocsQuery = db
    .select({
      path: documents.path,
      title: documents.title,
      tags: documents.tags,
      source: documents.source,
      type: documents.type,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(and(...conditions))
    .orderBy(orderByColumn);

  const allDocs = await allDocsQuery;

  // Parse tags from JSON string
  let parsedDocs = allDocs.map((doc) => ({
    path: doc.path,
    title: doc.title,
    tags: doc.tags ? JSON.parse(doc.tags) : [],
    source: doc.source,
    type: doc.type,
    updatedAt: new Date(doc.updatedAt),
  }));

  // Filter by tags in memory if specified
  if (options.tags && options.tags.length > 0) {
    parsedDocs = parsedDocs.filter((doc) =>
      options.tags!.every((tag) => doc.tags.includes(tag))
    );
  }

  // Get total count
  const total = parsedDocs.length;

  // Apply pagination
  const paginatedDocs = parsedDocs.slice(offset, offset + limit);

  // Derive folders from all document paths (not just paginated)
  const folders = deriveFolders(parsedDocs.map((d) => d.path));

  // Aggregate tags from all documents (not just paginated)
  const tagCounts = aggregateTags(parsedDocs);

  const endTime = performance.now();

  return {
    documents: paginatedDocs,
    folders,
    tagCounts,
    total,
    latencyMs: Number((endTime - startTime).toFixed(2)),
  };
}
