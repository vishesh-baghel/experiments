import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Main documents table
 * Stores markdown files with metadata, tags, and soft delete support
 */
export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tags: text('tags'), // JSON array string
    metadata: text('metadata'), // JSON object string
    source: text('source'), // e.g., "claude-code", "chatgpt", "manual"
    type: text('type'), // e.g., "note", "spec", "meeting"
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    version: integer('version').notNull().default(1),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete
    lastWriteSource: text('last_write_source'), // Track which agent wrote last
  },
  (table) => ({
    pathIdx: index('idx_documents_path').on(table.path),
    deletedIdx: index('idx_documents_deleted').on(table.deletedAt),
    updatedIdx: index('idx_documents_updated').on(table.updatedAt),
  })
);

/**
 * Document versions table
 * Keeps last N versions of each document for rollback
 */
export const documentVersions = sqliteTable(
  'document_versions',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    content: text('content').notNull(),
    metadata: text('metadata'), // JSON snapshot of metadata at this version
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    documentVersionIdx: index('idx_versions_document').on(
      table.documentId,
      table.version
    ),
  })
);

// Type exports for use in application code
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;

// Helper types for JSON fields
export interface DocumentMetadata {
  [key: string]: string | number | boolean;
}

export interface ParsedDocument extends Omit<Document, 'tags' | 'metadata'> {
  tags: string[];
  metadata: DocumentMetadata | null;
}

/**
 * Parse JSON fields from document
 */
export function parseDocument(doc: Document): ParsedDocument {
  return {
    ...doc,
    tags: doc.tags ? JSON.parse(doc.tags) : [],
    metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
  };
}

/**
 * Serialize JSON fields for document insert/update
 */
export function serializeDocument(
  doc: Partial<ParsedDocument>
): Partial<Document> {
  const result: Partial<Document> = { ...doc } as Partial<Document>;

  if ('tags' in doc && doc.tags !== undefined) {
    result.tags = JSON.stringify(doc.tags);
  }

  if ('metadata' in doc && doc.metadata !== undefined) {
    result.metadata = doc.metadata ? JSON.stringify(doc.metadata) : null;
  }

  return result;
}
