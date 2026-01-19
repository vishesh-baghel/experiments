import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Database client singleton
let client: Client | null = null;
let db: LibSQLDatabase<typeof schema> | null = null;

/**
 * Get or create the database client
 * Uses Turso's HTTP API for edge deployment
 */
export function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is required');
    }

    client = createClient({
      url,
      authToken,
    });
  }

  return client;
}

/**
 * Get or create the Drizzle database instance
 */
export function getDb(): LibSQLDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getClient(), { schema });
  }

  return db;
}

/**
 * Create an in-memory database for testing
 */
export function createTestDb(): LibSQLDatabase<typeof schema> {
  const testClient = createClient({
    url: ':memory:',
  });

  return drizzle(testClient, { schema });
}

/**
 * Initialize database schema (for testing)
 * Creates tables if they don't exist
 */
export async function initializeSchema(
  database: LibSQLDatabase<typeof schema>
): Promise<void> {
  const client = (database as unknown as { session: { client: Client } }).session.client;

  // Create documents table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      metadata TEXT,
      source TEXT,
      type TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at INTEGER,
      last_write_source TEXT
    )
  `);

  // Create document_versions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await client.execute(
    'CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path)'
  );
  await client.execute(
    'CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at)'
  );
  await client.execute(
    'CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at)'
  );
  await client.execute(
    'CREATE INDEX IF NOT EXISTS idx_versions_document ON document_versions(document_id, version)'
  );

  // Create FTS5 virtual table for full-text search
  // Using a regular FTS5 table (not external content) for simpler sync
  await client.execute(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      path,
      title,
      content,
      tags
    )
  `);

  // Create triggers to keep FTS5 in sync with documents table
  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS documents_fts_insert AFTER INSERT ON documents
    WHEN new.deleted_at IS NULL
    BEGIN
      INSERT INTO documents_fts(rowid, path, title, content, tags)
      VALUES (new.rowid, new.path, new.title, new.content, new.tags);
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS documents_fts_update AFTER UPDATE ON documents
    BEGIN
      DELETE FROM documents_fts WHERE rowid = old.rowid;
      INSERT INTO documents_fts(rowid, path, title, content, tags)
      SELECT new.rowid, new.path, new.title, new.content, new.tags
      WHERE new.deleted_at IS NULL;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS documents_fts_delete AFTER DELETE ON documents
    BEGIN
      DELETE FROM documents_fts WHERE rowid = old.rowid;
    END
  `);
}

// Export schema for use in queries
export { schema };
