import { sql, eq, and, like, isNull, inArray } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Client } from '@libsql/client';
import { documents, parseDocument, type ParsedDocument } from '@/db/schema';
import type * as schema from '@/db/schema';

/**
 * Search options for querying documents
 */
export interface SearchOptions {
  /** FTS5 query string */
  query: string;
  /** Filter by folder path prefix */
  folder?: string;
  /** Filter by tags (AND logic) */
  tags?: string[];
  /** Filter by source */
  source?: string;
  /** Maximum results to return (default: 20) */
  limit?: number;
  /** Offset for pagination (default: 0) */
  offset?: number;
}

/**
 * Search result document with snippet
 */
export interface SearchDocument {
  path: string;
  title: string;
  tags: string[];
  snippet: string;
  source: string | null;
  type: string | null;
}

/**
 * Search results with pagination info
 */
export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  latencyMs: number;
}

/**
 * Search documents using FTS5 full-text search
 *
 * @param db - Database instance
 * @param options - Search options including query and filters
 * @returns Search results with documents and pagination info
 */
export async function searchDocuments(
  db: LibSQLDatabase<typeof schema>,
  options: SearchOptions
): Promise<SearchResult> {
  const startTime = performance.now();

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // Get the raw client for queries
  const client = (db as unknown as { session: { client: Client } }).session
    .client;

  // Check if this is a "list all" query (no text search, just filters)
  const isListAll = options.query === '*' || options.query.trim() === '';

  // Type for raw SQL result rows
  type RawRow = {
    path: string;
    title: string;
    tags: string | null;
    snippet: string | null;
    source: string | null;
    type: string | null;
  };

  let results: RawRow[];
  let total: number;

  if (isListAll) {
    // No FTS5 query - just filter the documents table directly
    const result = await listDocumentsWithFilters(client, options, limit, offset);
    results = result.rows as RawRow[];
    total = result.total;
  } else {
    // Use FTS5 for text search
    const result = await searchWithFTS5(client, options, limit, offset);
    results = result.rows as RawRow[];
    total = result.total;
  }

  const searchDocuments: SearchDocument[] = results.map((row) => ({
    path: row.path,
    title: row.title,
    tags: row.tags ? JSON.parse(row.tags) : [],
    snippet: row.snippet || '',
    source: row.source,
    type: row.type,
  }));

  const endTime = performance.now();

  return {
    documents: searchDocuments,
    total,
    latencyMs: Number((endTime - startTime).toFixed(2)),
  };
}

/**
 * List documents with filters (no text search)
 */
async function listDocumentsWithFilters(
  client: Client,
  options: SearchOptions,
  limit: number,
  offset: number
): Promise<{ rows: unknown[]; total: number }> {
  const { whereClause, args } = buildWhereClauseSimple(options);

  // Get total count
  const countResult = await client.execute({
    sql: `SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL ${whereClause}`,
    args,
  });

  let total = Number(countResult.rows[0]?.count ?? 0);

  // If we have tag filters, fetch all and filter in memory
  if (options.tags && options.tags.length > 0) {
    const allResults = await client.execute({
      sql: `
        SELECT path, title, tags, source, type, substr(content, 1, 100) as snippet
        FROM documents
        WHERE deleted_at IS NULL ${whereClause}
        ORDER BY updated_at DESC
      `,
      args,
    });

    const filtered = allResults.rows.filter((row) => {
      const docTags = row.tags ? JSON.parse(row.tags as string) : [];
      return options.tags!.every((tag) => docTags.includes(tag));
    });

    total = filtered.length;
    return { rows: filtered.slice(offset, offset + limit), total };
  }

  // No tag filter - use SQL pagination
  const queryResult = await client.execute({
    sql: `
      SELECT path, title, tags, source, type, substr(content, 1, 100) as snippet
      FROM documents
      WHERE deleted_at IS NULL ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  return { rows: queryResult.rows, total };
}

/**
 * Search documents using FTS5
 */
async function searchWithFTS5(
  client: Client,
  options: SearchOptions,
  limit: number,
  offset: number
): Promise<{ rows: unknown[]; total: number }> {
  const ftsQuery = options.query;
  const { whereClause, args } = buildWhereClause(options);

  // Get total count
  const countResult = await client.execute({
    sql: `
      SELECT COUNT(*) as count
      FROM documents_fts
      JOIN documents ON documents.rowid = documents_fts.rowid
      WHERE documents_fts MATCH ?
        AND documents.deleted_at IS NULL
        ${whereClause}
    `,
    args: [ftsQuery, ...args],
  });

  let total = Number(countResult.rows[0]?.count ?? 0);

  // If we have tag filters, fetch all and filter in memory
  if (options.tags && options.tags.length > 0) {
    const allResults = await client.execute({
      sql: `
        SELECT
          documents.path,
          documents.title,
          documents.tags,
          documents.source,
          documents.type,
          snippet(documents_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
        FROM documents_fts
        JOIN documents ON documents.rowid = documents_fts.rowid
        WHERE documents_fts MATCH ?
          AND documents.deleted_at IS NULL
          ${whereClause}
        ORDER BY rank
      `,
      args: [ftsQuery, ...args],
    });

    const filtered = allResults.rows.filter((row) => {
      const docTags = row.tags ? JSON.parse(row.tags as string) : [];
      return options.tags!.every((tag) => docTags.includes(tag));
    });

    total = filtered.length;
    return { rows: filtered.slice(offset, offset + limit), total };
  }

  // No tag filter - use SQL pagination
  const queryResult = await client.execute({
    sql: `
      SELECT
        documents.path,
        documents.title,
        documents.tags,
        documents.source,
        documents.type,
        snippet(documents_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
      FROM documents_fts
      JOIN documents ON documents.rowid = documents_fts.rowid
      WHERE documents_fts MATCH ?
        AND documents.deleted_at IS NULL
        ${whereClause}
      ORDER BY rank
      LIMIT ? OFFSET ?
    `,
    args: [ftsQuery, ...args, limit, offset],
  });

  return { rows: queryResult.rows, total };
}

/**
 * Build WHERE clause for FTS5 queries (with documents. prefix)
 */
function buildWhereClause(options: SearchOptions): {
  whereClause: string;
  args: (string | number)[];
} {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (options.folder) {
    conditions.push('AND documents.path LIKE ?');
    args.push(options.folder + '%');
  }

  if (options.source) {
    conditions.push('AND documents.source = ?');
    args.push(options.source);
  }

  return {
    whereClause: conditions.join(' '),
    args,
  };
}

/**
 * Build WHERE clause for simple queries (no prefix)
 */
function buildWhereClauseSimple(options: SearchOptions): {
  whereClause: string;
  args: (string | number)[];
} {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (options.folder) {
    conditions.push('AND path LIKE ?');
    args.push(options.folder + '%');
  }

  if (options.source) {
    conditions.push('AND source = ?');
    args.push(options.source);
  }

  return {
    whereClause: conditions.join(' '),
    args,
  };
}
